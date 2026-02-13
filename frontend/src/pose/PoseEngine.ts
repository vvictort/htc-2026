
import type * as posedetection from "@tensorflow-models/pose-detection";

export type MonitorState = "STILL" | "ACTIVE" | "UNKNOWN";
export type AlertType = "BOUNDARY" | "ACTIVE";

export interface RoiPoint {
  x: number;
  y: number;
}

export interface PoseEngineConfig {
  minKpScore: number;
  inferFps: number;
  breachMs: number;
  activeMs: number;
  cooldownMs: number;

  activeSpeedPxPerSec: number;
  activeLimbSpeedNormPerSec?: number;

  activityWindowMs?: number;
  activeRatioThreshold?: number;
}

export interface Boundaries {
  leftX?: number;
  rightX?: number;
}

export interface PoseMetrics {
  tEpochMs: number;
  poseOk: boolean;
  poseConfidence: number;
  centroid?: { x: number; y: number };
  bbox?: { x1: number; y1: number; x2: number; y2: number };
  centroidSpeed?: number;
  movementSpeed?: number;
  movementSpeedNorm?: number;
  torsoLen?: number;
  activeScore?: number;
  state: MonitorState;
  insideRoi?: boolean;
  breachedBoundary?: "left" | "right" | null;
}

export interface AlertEvent {
  type: AlertType;
  tEpochMs: number;
  details?: Record<string, unknown>;
}

export class PoseEngine {
  private detector!: posedetection.PoseDetector;
  private running = false;

  private lastInferAt = 0;
  private lastCentroid?: { x: number; y: number; t: number };
  private centroidSpeedEma?: number;

  private lastLimbs?: { ptsByIndex: Partial<Record<number, { x: number; y: number; w: number }>>; t: number };
  private limbSpeedEmaNorm?: number;

  private state: MonitorState = "UNKNOWN";

  private breachSince: number | null = null;
  private lastAlertAt = 0;

  private video: HTMLVideoElement;
  private getRoi: () => RoiPoint[];
  private getBoundaries: () => Boundaries;
  private cfg: PoseEngineConfig;
  private onMetrics: (m: PoseMetrics) => void;
  private onAlert: (a: AlertEvent) => void;
  private onStateChange?: (s: MonitorState) => void;

  private activityHistory: Array<{ t: number; moving: boolean }> = [];

  constructor(
    video: HTMLVideoElement,
    getRoi: () => RoiPoint[],
    getBoundaries: () => Boundaries,
    cfg: PoseEngineConfig,
    onMetrics: (m: PoseMetrics) => void,
    onAlert: (a: AlertEvent) => void,
    onStateChange?: (s: MonitorState) => void,
  ) {
    this.video = video;
    this.getRoi = getRoi;
    this.getBoundaries = getBoundaries;
    this.cfg = cfg;
    this.onMetrics = onMetrics;
    this.onAlert = onAlert;
    this.onStateChange = onStateChange;
  }

  async init() {
    const [tf, posedetectionModule] = await Promise.all([
      import("@tensorflow/tfjs-core"),
      import("@tensorflow-models/pose-detection"),
    ]);
    await import("@tensorflow/tfjs-backend-webgl");

    await tf.setBackend("webgl");
    await tf.ready();

    this.detector = await posedetectionModule.createDetector(posedetectionModule.SupportedModels.MoveNet, {
      modelType: posedetectionModule.movenet.modelType.SINGLEPOSE_LIGHTNING,
    });
  }

  start() {
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
  }

  private loop = async () => {
    if (!this.running) return;

    const now = performance.now();
    const minDt = 1000 / this.cfg.inferFps;

    if (now - this.lastInferAt < minDt) {
      requestAnimationFrame(this.loop);
      return;
    }

    if (!this.video.videoWidth || !this.video.videoHeight) {
      requestAnimationFrame(this.loop);
      return;
    }

    this.lastInferAt = now;

    const poses = await this.detector.estimatePoses(this.video, { maxPoses: 1 });
    const pose = poses[0];
    const kps = pose?.keypoints ?? [];

    const good = kps.filter((k) => (k.score ?? 0) >= this.cfg.minKpScore);
    const poseConfidence = kps.length ? good.length / kps.length : 0;
    const poseOk = good.length >= 4;

    const bbox = poseOk
      ? (() => {
          const xs = good.map((p) => p.x ?? 0);
          const ys = good.map((p) => p.y ?? 0);
          return {
            x1: Math.min(...xs),
            y1: Math.min(...ys),
            x2: Math.max(...xs),
            y2: Math.max(...ys),
          };
        })()
      : undefined;

    const trunkIndices = [5, 6, 11, 12];
    const trunk = trunkIndices.map((i) => kps[i]).filter((k) => k && (k.score ?? 0) >= this.cfg.minKpScore);

    const trunkPts = trunk.map((k) => ({
      x: k.x ?? 0,
      y: k.y ?? 0,
      w: k.score ?? 0,
    }));

    const centroid =
      trunkPts.length >= 2
        ? (() => {
            const totalWeight = trunkPts.reduce((s, p) => s + p.w, 0);
            const weightedX = trunkPts.reduce((s, p) => s + p.x * p.w, 0);
            const weightedY = trunkPts.reduce((s, p) => s + p.y * p.w, 0);
            return {
              x: weightedX / totalWeight,
              y: weightedY / totalWeight,
            };
          })()
        : undefined;

    let centroidSpeed: number | undefined;
    if (centroid) {
      if (this.lastCentroid) {
        const dt = (now - this.lastCentroid.t) / 1000;
        const dx = centroid.x - this.lastCentroid.x;
        const dy = centroid.y - this.lastCentroid.y;
        const v = Math.sqrt(dx * dx + dy * dy) / Math.max(dt, 1e-3);
        const alpha = 0.4;
        this.centroidSpeedEma = this.centroidSpeedEma == null ? v : alpha * v + (1 - alpha) * this.centroidSpeedEma;
        centroidSpeed = this.centroidSpeedEma;
      }
      this.lastCentroid = { ...centroid, t: now };
    }

    const kpLS = kps[5];
    const kpRS = kps[6];
    const kpLH = kps[11];
    const kpRH = kps[12];

    const torsoPairs: Array<[typeof kpLS | undefined, typeof kpLH | undefined]> = [
      [kpLS, kpLH],
      [kpRS, kpRH],
    ];

    const torsoSamples = torsoPairs
      .map(([s, h]) => {
        if (!s || !h) return null;
        if ((s.score ?? 0) < this.cfg.minKpScore) return null;
        if ((h.score ?? 0) < this.cfg.minKpScore) return null;
        const dx = (s.x ?? 0) - (h.x ?? 0);
        const dy = (s.y ?? 0) - (h.y ?? 0);
        return Math.sqrt(dx * dx + dy * dy);
      })
      .filter((v): v is number => v != null && Number.isFinite(v) && v > 1);

    const torsoLen = torsoSamples.length ? torsoSamples.reduce((a, b) => a + b, 0) / torsoSamples.length : undefined;

    const limbIndices = [7, 8, 9, 10, 13, 14, 15, 16];
    const limbPtsByIndex: Partial<Record<number, { x: number; y: number; w: number }>> = {};
    for (const i of limbIndices) {
      const k = kps[i];
      if (!k) continue;
      const w = k.score ?? 0;
      if (w < this.cfg.minKpScore) continue;
      limbPtsByIndex[i] = { x: k.x ?? 0, y: k.y ?? 0, w };
    }

    let limbSpeedNorm: number | undefined;
    if (poseOk && torsoLen && torsoLen > 1) {
      if (this.lastLimbs) {
        const dt = (now - this.lastLimbs.t) / 1000;
        const denom = Math.max(dt, 1e-3);

        let wSum = 0;
        let sqSum = 0;
        let paired = 0;

        for (const i of limbIndices) {
          const p0 = this.lastLimbs.ptsByIndex[i];
          const p1 = limbPtsByIndex[i];
          if (!p0 || !p1) continue;
          const w = Math.min(p0.w, p1.w);
          const dx = p1.x - p0.x;
          const dy = p1.y - p0.y;
          const d2 = dx * dx + dy * dy;
          wSum += w;
          sqSum += w * d2;
          paired++;
        }

        if (paired >= 2 && wSum > 1e-6) {
          const rmsDisp = Math.sqrt(sqSum / wSum);
          const vPx = rmsDisp / denom;
          const vNorm = vPx / torsoLen;

          const alpha = 0.4;
          this.limbSpeedEmaNorm =
            this.limbSpeedEmaNorm == null ? vNorm : alpha * vNorm + (1 - alpha) * this.limbSpeedEmaNorm;
          limbSpeedNorm = this.limbSpeedEmaNorm;
        }
      }
      this.lastLimbs = { ptsByIndex: limbPtsByIndex, t: now };
    }

    const movementSpeed = limbSpeedNorm != null && torsoLen ? limbSpeedNorm * torsoLen : undefined;
    const movementSpeedNorm = limbSpeedNorm;

    const centroidMoving = centroidSpeed != null && centroidSpeed >= this.cfg.activeSpeedPxPerSec;
    const limbThr = this.cfg.activeLimbSpeedNormPerSec ?? 0.06;
    const limbsMoving = limbSpeedNorm != null && limbSpeedNorm >= limbThr;
    const movingNow = centroidMoving || limbsMoving;

    const nextState = poseOk ? (movingNow ? "ACTIVE" : "STILL") : "UNKNOWN";

    const windowMs = this.cfg.activityWindowMs ?? 5000;
    const minT = now - windowMs;

    if (poseOk) {
      this.activityHistory.push({ t: now, moving: movingNow });
    }

    while (this.activityHistory.length && this.activityHistory[0].t < minT) {
      this.activityHistory.shift();
    }

    const activeScore = this.activityHistory.length
      ? this.activityHistory.filter((h) => h.moving).length / this.activityHistory.length
      : 0;
    if (nextState !== this.state) {
      this.state = nextState;
      this.onStateChange?.(nextState);
    }

    const roi = this.getRoi();
    const insideRoi = centroid ? pointInPoly(centroid, roi) : undefined;

    const boundaries = this.getBoundaries();
    let breachedBoundary: "left" | "right" | null = null;
    if (centroid && insideRoi) {
      if (boundaries.leftX != null && centroid.x < boundaries.leftX) {
        breachedBoundary = "left";
      } else if (boundaries.rightX != null && centroid.x > boundaries.rightX) {
        breachedBoundary = "right";
      }
    }

    this.updateAlerts(now, insideRoi, breachedBoundary, activeScore);

    this.onMetrics({
      tEpochMs: Date.now(),
      poseOk,
      poseConfidence,
      centroid,
      bbox,
      centroidSpeed,
      movementSpeed,
      movementSpeedNorm,
      torsoLen,
      activeScore,
      state: this.state,
      insideRoi,
      breachedBoundary,
    });

    requestAnimationFrame(this.loop);
  };

  private updateAlerts(
    nowPerf: number,
    insideRoi?: boolean,
    breachedBoundary?: "left" | "right" | null,
    activeScore?: number,
  ) {
    const nowEpoch = Date.now();

    if (nowEpoch - this.lastAlertAt < this.cfg.cooldownMs) return;

    if (insideRoi === false || breachedBoundary) {
      this.breachSince ??= nowPerf;
      if (nowPerf - this.breachSince > this.cfg.breachMs) {
        this.fire("BOUNDARY");
        this.breachSince = null;
      }
    } else {
      this.breachSince = null;
    }

    const score = activeScore ?? 0;
    const thr = this.cfg.activeRatioThreshold ?? 1.0;
    if (score >= thr) {
      this.fire("ACTIVE");
    }
  }

  private fire(type: AlertType) {
    this.lastAlertAt = Date.now();
    this.onAlert({ type, tEpochMs: this.lastAlertAt });
    if (type === "ACTIVE") {
      this.activityHistory = [];
    }
  }
}

function pointInPoly(pt: { x: number; y: number }, poly: RoiPoint[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;

    const intersect = yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-9) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}
