import { useEffect, useRef, useState } from "react";
import { PoseEngine, type PoseMetrics, type RoiPoint, type AlertEvent } from "../pose/PoseEngine";
import { MOTION_ENDPOINTS } from "../utils/api";
import { auth } from "../config/firebase";

export default function CVMonitor({
  externalVideoRef,
  leftPct: propLeftPct,
  rightPct: propRightPct,
  mirror,
  sendApi,
  showDebugHUD,
  onAlertDebug,
}: {
  externalVideoRef?: React.RefObject<HTMLVideoElement | null>;
  leftPct?: number;
  rightPct?: number;
  mirror?: boolean;
  sendApi?: boolean;
  /** Show a real-time debug overlay with state, speeds, scores */
  showDebugHUD?: boolean;
  /** Called on every PoseEngine alert (for debug event log) */
  onAlertDebug?: (a: AlertEvent) => void;
}) {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PoseEngine | null>(null);

  const effectiveVideoRef = externalVideoRef ?? internalVideoRef;

  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<PoseMetrics | null>(null);
  const [caption, setCaption] = useState<{ text: string; color: string; key: number } | null>(null);
  const leftPctRef = useRef(propLeftPct ?? 0.08);
  const rightPctRef = useRef(propRightPct ?? 0.92);
  const roiRef = useRef<RoiPoint[]>([]);

  const lastTriggerAtRef = useRef(0);
  const lastCategoryRef = useRef<string>("");
  const lastCategoryAtRef = useRef(0);
  const pendingRef = useRef(false);

  const flipSide = (side: "left" | "right" | null | undefined) =>
    !side ? side : mirror ? (side === "left" ? "right" : "left") : side;

  const lastCaptionStateRef = useRef<string>("");
  useEffect(() => {
    if (!metrics) return;
    const side = flipSide(metrics.breachedBoundary);
    const label = side ? `⚠️ BOUNDARY ${side.toUpperCase()}` : metrics.state;
    if (label === lastCaptionStateRef.current) return;
    lastCaptionStateRef.current = label;

    const color = side
      ? "#f87171"
      : metrics.state === "ACTIVE"
        ? "#4ade80"
        : metrics.state === "STILL"
          ? "#9ca3af"
          : "#facc15";

    setCaption({ text: label, color, key: Date.now() });
  }, [metrics?.state, metrics?.breachedBoundary]);

  useEffect(() => {
    if (!caption) return;
    const t = setTimeout(() => setCaption(null), 3000);
    return () => clearTimeout(t);
  }, [caption?.key]);

  const sendApiRef = useRef<boolean>(!!sendApi);
  useEffect(() => {
    sendApiRef.current = !!sendApi;
  }, [sendApi]);

  /** Map PoseEngine alert types → backend MotionCategory values */
  const mapToCategory = (type: "UNKNOWN" | "BOUNDARY" | "ACTIVE"): string => {
    switch (type) {
      case "ACTIVE":
        return "slight_movement";
      case "BOUNDARY":
        return "out_of_frame";
      case "UNKNOWN":
        return "unknown";
    }
  };

  /**
   * Rate-limited API trigger:
   * - Global cooldown: 5 s between any two requests
   * - Same-category dedup: skip if identical category within 10 s
   * - Serialised: only one in-flight request at a time
   */
  const triggerApi = async (type: "UNKNOWN" | "BOUNDARY" | "ACTIVE", details: Record<string, unknown>) => {
    const now = Date.now();
    const GLOBAL_COOLDOWN_MS = 5_000;
    const SAME_CATEGORY_COOLDOWN_MS = 10_000;

    const category = mapToCategory(type);

    if (now - lastTriggerAtRef.current < GLOBAL_COOLDOWN_MS) return;

    if (category === lastCategoryRef.current && now - lastCategoryAtRef.current < SAME_CATEGORY_COOLDOWN_MS) return;

    if (pendingRef.current) return;

    lastTriggerAtRef.current = now;
    lastCategoryRef.current = category;
    lastCategoryAtRef.current = now;
    pendingRef.current = true;

    const confidence = metrics?.poseConfidence ?? 0.5;

    let token: string | null = null;
    try {
      token = (await auth.currentUser?.getIdToken()) ?? null;
    } catch (e) {
      console.warn("[CVMonitor] Failed to get auth token:", e);
    }

    console.log(`[CVMonitor] 📤 Sending motion event: ${type} → category="${category}", confidence=${confidence}`, {
      details,
      timestamp: new Date(now).toLocaleTimeString(),
    });

    try {
      await fetch(MOTION_ENDPOINTS.CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ category, confidence, metadata: details }),
      });
      console.log(`[CVMonitor] ✅ Motion event sent: ${category}`);
    } catch (e) {
      console.error(`[CVMonitor] ❌ Failed to send motion event:`, e);
    } finally {
      pendingRef.current = false;
    }
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      const video = effectiveVideoRef.current;
      if (!video) return;

      if (externalVideoRef == null) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
        await video.play();
      }

      const waitForDimensions = (): Promise<boolean> =>
        new Promise((resolve) => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            resolve(true);
            return;
          }
          let resolved = false;
          const onReady = () => {
            if (resolved) return;
            resolved = true;
            video.removeEventListener("loadeddata", onReady);
            resolve(video.videoWidth > 0 && video.videoHeight > 0);
          };
          video.addEventListener("loadeddata", onReady);
          const poll = setInterval(() => {
            if (resolved) {
              clearInterval(poll);
              return;
            }
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              resolved = true;
              clearInterval(poll);
              video.removeEventListener("loadeddata", onReady);
              resolve(true);
            }
          }, 200);
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              clearInterval(poll);
              video.removeEventListener("loadeddata", onReady);
              resolve(false);
            }
          }, 5000);
        });

      const ready = await waitForDimensions();
      if (!ready || cancelled) {
        if (!ready) console.error("[CVMonitor] Video dimensions still 0x0 after 5s, aborting PoseEngine init");
        return;
      }

      const engine = new PoseEngine(
        video,
        () => roiRef.current,
        () => {
          const vw = video.videoWidth;
          if (!vw) return {};
          return mirror
            ? { leftX: (1 - rightPctRef.current) * vw, rightX: (1 - leftPctRef.current) * vw }
            : { leftX: leftPctRef.current * vw, rightX: rightPctRef.current * vw };
        },
        {
          minKpScore: 0.25,
          inferFps: 5,
          breachMs: 800,
          activeMs: 1500,
          cooldownMs: 15000,
          activeSpeedPxPerSec: 35,
          activeLimbSpeedNormPerSec: 0.5,
          activityWindowMs: 5000,
          activeRatioThreshold: 1.0,
        },
        (m) => setMetrics(m),
        (a) => {
          onAlertDebug?.(a);
          if (sendApiRef.current && !onAlertDebug) {
            triggerApi(a.type, a.details ?? {});
          }
        },
      );

      await new Promise((resolve) => requestAnimationFrame(resolve));

      await engine.init();
      engine.start();
      engineRef.current = engine;
      setIsLoading(false);
    }

    start();

    return () => {
      cancelled = true;
      engineRef.current?.stop();
      engineRef.current = null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [externalVideoRef]);

  useEffect(() => {
    if (propLeftPct != null) leftPctRef.current = propLeftPct;
    if (propRightPct != null) rightPctRef.current = propRightPct;
    const video = effectiveVideoRef.current;
    if (video && video.videoWidth) {
      const w = video.videoWidth;
      const h = video.videoHeight;
      roiRef.current = [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ];
    }
  }, [propLeftPct, propRightPct]);

  useEffect(() => {
    const video = effectiveVideoRef.current;
    if (!video) return;
    const onMeta = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return;
      roiRef.current = [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ];
    };
    video.addEventListener("loadedmetadata", onMeta);
    onMeta();
    return () => video.removeEventListener("loadedmetadata", onMeta);
  }, [effectiveVideoRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = effectiveVideoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.style.position = "fixed";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "1";

    let raf = 0;
    const render = () => {
      const rect = video.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      canvas.style.left = rect.left + "px";
      canvas.style.top = rect.top + "px";
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";

      if (video.videoWidth && video.videoHeight) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        roiRef.current = [
          { x: 0, y: 0 },
          { x: vw, y: 0 },
          { x: vw, y: vh },
          { x: 0, y: vh },
        ];
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (metrics?.centroid && video.videoWidth && video.videoHeight) {
        const sx = canvas.width / video.videoWidth;
        const sy = canvas.height / video.videoHeight;
        const cx = mirror ? canvas.width - metrics.centroid.x * sx : metrics.centroid.x * sx;
        const cy2 = metrics.centroid.y * sy;

        ctx.fillStyle = metrics.breachedBoundary ? "rgba(255,0,0,0.95)" : "rgba(0,120,255,0.95)";
        ctx.beginPath();
        ctx.arc(cx, cy2, 8, 0, 2 * Math.PI);
        ctx.fill();
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [metrics, mirror]);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1001, pointerEvents: "none" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", zIndex: 1002 }}>
        {externalVideoRef == null && (
          <video
            ref={internalVideoRef}
            playsInline
            muted
            style={{ width: "100%", display: "block", transform: mirror ? "scaleX(-1)" : undefined }}
          />
        )}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        {isLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              zIndex: 10,
            }}>
            <div style={{ textAlign: "center", color: "#fff" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: "3px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "cvSpin 0.8s linear infinite",
                  margin: "0 auto 12px",
                }}
              />
              <div style={{ fontSize: 14, opacity: 0.9 }}>Loading pose detection...</div>
            </div>
          </div>
        )}
        <style>{`
          @keyframes cvSpin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        {caption && (
          <div
            key={caption.key}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              pointerEvents: "none",
              textAlign: "center",
              animation: "cvCaption 3s ease-out forwards",
            }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: caption.color,
                textShadow: "0 2px 16px rgba(0,0,0,0.7), 0 0 40px rgba(0,0,0,0.4)",
                letterSpacing: 2,
                fontFamily: "system-ui, sans-serif",
              }}>
              {caption.text}
            </div>
          </div>
        )}
        <style>{`
                    @keyframes cvCaption {
                        0%   { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                        30%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
                    }
                `}</style>
        {showDebugHUD && metrics && (
          <>
            <div
              style={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 15,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(8px)",
                borderRadius: 24,
                padding: "6px 18px",
                fontFamily: "system-ui, sans-serif",
                fontSize: 14,
                color: "#fff",
                boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
              }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  letterSpacing: 1,
                  color: metrics.breachedBoundary
                    ? "#f87171"
                    : metrics.state === "ACTIVE"
                      ? "#4ade80"
                      : metrics.state === "STILL"
                        ? "#9ca3af"
                        : "#facc15",
                }}>
                {metrics.breachedBoundary ? `⚠️ ${flipSide(metrics.breachedBoundary)!.toUpperCase()}` : metrics.state}
              </span>
              <span style={{ width: 1, height: 18, background: "rgba(255,255,255,0.2)" }} />
              <span style={{ color: metrics.poseOk ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                {metrics.poseOk ? "✓" : "✗"} {(metrics.poseConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 15,
                pointerEvents: "none",
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
                padding: "24px 12px 10px",
                fontFamily: "monospace",
                fontSize: 12,
                color: "#fff",
              }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ opacity: 0.5, fontSize: 10, marginBottom: 2 }}>SPEED</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {metrics.movementSpeed?.toFixed(0) ?? "—"}
                  <span style={{ fontSize: 10, opacity: 0.6 }}> px/s</span>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ opacity: 0.5, fontSize: 10, marginBottom: 2 }}>LIMB</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {metrics.movementSpeedNorm?.toFixed(2) ?? "—"}
                  <span style={{ fontSize: 10, opacity: 0.6 }}> /s</span>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ opacity: 0.5, fontSize: 10, marginBottom: 2 }}>ACTIVITY</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                  <div
                    style={{
                      width: 48,
                      height: 6,
                      borderRadius: 3,
                      background: "#374151",
                      overflow: "hidden",
                    }}>
                    <div
                      style={{
                        width: `${(metrics.activeScore ?? 0) * 100}%`,
                        height: "100%",
                        borderRadius: 3,
                        background:
                          (metrics.activeScore ?? 0) > 0.8
                            ? "#f87171"
                            : (metrics.activeScore ?? 0) > 0.4
                              ? "#facc15"
                              : "#4ade80",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {((metrics.activeScore ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ opacity: 0.5, fontSize: 10, marginBottom: 2 }}>TORSO</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {metrics.torsoLen?.toFixed(0) ?? "—"}
                  <span style={{ fontSize: 10, opacity: 0.6 }}> px</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
