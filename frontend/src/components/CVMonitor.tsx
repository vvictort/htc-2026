import { useEffect, useRef, useState } from "react";
import { PoseEngine, type PoseMetrics, type RoiPoint, type Boundaries } from "../pose/PoseEngine";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export default function CVMonitor({ externalVideoRef }: { externalVideoRef?: React.RefObject<HTMLVideoElement> }) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<PoseEngine | null>(null);

    // If an external videoRef is provided (e.g. from Broadcaster), use it instead of creating our own stream
    const effectiveVideoRef = externalVideoRef ?? videoRef;

    const [metrics, setMetrics] = useState<PoseMetrics | null>(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [leftPct, setLeftPct] = useState(0.08);
    const [rightPct, setRightPct] = useState(0.92);
    const roiRef = useRef<RoiPoint[]>([]);
    const boundariesRef = useRef<Boundaries>({});

    const lastTriggerAtRef = useRef(0);
    const activeSinceRef = useRef<number | null>(null);
    const activeNotifiedRef = useRef(false);

    const [apiSent, setApiSent] = useState<{ type: string; at: number } | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let cancelled = false;

        async function start() {
            const video = effectiveVideoRef.current;
            if (!video) return;

            // If there is no external videoRef, we need to open the camera ourselves
            if (externalVideoRef == null) {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                video.srcObject = stream;
                await video.play();
            }

            if (cancelled) return;

            const engine = new PoseEngine(
                video,
                () => roiRef.current,
                () => boundariesRef.current,
                {
                    minKpScore: 0.25,
                    inferFps: 5,
                    breachMs: 800,
                    activeMs: 1500,
                    cooldownMs: 15000,
                    activeSpeedPxPerSec: 35,
                    activeLimbSpeedNormPerSec: 0.5,
                    activityWindowMs: 5000,
                    activeRatioThreshold: 0.6,
                },
                (m) => setMetrics(m),
                (a) => console.log("alert", a)
            );

            await engine.init();
            engine.start();
            engineRef.current = engine;
        }

        start();

        return () => {
            cancelled = true;
            engineRef.current?.stop();
            engineRef.current = null;
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, [externalVideoRef]);

    const setFullScreenRoiFromVideo = () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth || !video.videoHeight) return;

        const w = video.videoWidth;
        const h = video.videoHeight;
        roiRef.current = [
            { x: 0, y: 0 },
            { x: w, y: 0 },
            { x: w, y: h },
            { x: 0, y: h },
        ];
    };

    const applyBoundariesFromSliders = () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) return;
        setFullScreenRoiFromVideo();

        const lp = Math.min(Math.max(leftPct, 0), 1);
        const rp = Math.min(Math.max(rightPct, 0), 1);
        const left = Math.min(lp, rp);
        const right = Math.max(lp, rp);

        boundariesRef.current = {
            leftX: left * video.videoWidth,
            rightX: right * video.videoWidth,
        };
    };

    useEffect(() => {
        const MIN_GAP = 0.02;
        if (leftPct > rightPct - MIN_GAP) {
            setRightPct(Math.min(Math.max(leftPct + MIN_GAP, 0), 1));
            return;
        }
        applyBoundariesFromSliders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leftPct, rightPct]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let raf = 0;
        const render = () => {
            const rect = video.getBoundingClientRect();
            const w = Math.max(1, Math.round(rect.width));
            const h = Math.max(1, Math.round(rect.height));
            if (canvas.width !== w) canvas.width = w;
            if (canvas.height !== h) canvas.height = h;

            setFullScreenRoiFromVideo();

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw boundaries
            const b = boundariesRef.current;
            if (video.videoWidth && video.videoHeight) {
                const sx = canvas.width / video.videoWidth;

                const drawBoundary = (xVideo: number, label: string) => {
                    const x = xVideo * sx;
                    ctx.strokeStyle = "rgba(255,165,0,0.95)";
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height);
                    ctx.stroke();

                    ctx.fillStyle = "rgba(255,165,0,0.95)";
                    ctx.font = "14px sans-serif";
                    ctx.fillText(label, Math.min(Math.max(x + 6, 0), canvas.width - 40), 18);
                };

                if (b.leftX != null) drawBoundary(b.leftX, "LEFT");
                if (b.rightX != null) drawBoundary(b.rightX, "RIGHT");
            }

            // centroid
            if (metrics?.centroid && video.videoWidth && video.videoHeight) {
                const sx = canvas.width / video.videoWidth;
                const sy = canvas.height / video.videoHeight;
                const cx = metrics.centroid.x * sx;
                const cy = metrics.centroid.y * sy;

                ctx.fillStyle = metrics.breachedBoundary ? "rgba(255,0,0,0.95)" : "rgba(0,120,255,0.95)";
                ctx.beginPath();
                ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
                ctx.fill();
            }

            raf = requestAnimationFrame(render);
        };

        raf = requestAnimationFrame(render);
        return () => cancelAnimationFrame(raf);
    }, [metrics]);

    const triggerApi = async (type: "UNKNOWN" | "BOUNDARY" | "ACTIVE", details: Record<string, unknown>) => {
        const now = Date.now();
        const COOLDOWN_MS = 5000;
        if (now - lastTriggerAtRef.current < COOLDOWN_MS) return;
        lastTriggerAtRef.current = now;

        setApiSent({ type, at: now });

        try {
            await fetch(`${API_URL}/monitor-event`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, at: now, details }),
            });
        } catch {
            // ignore
        }
    };

    // monitoring effect
    useEffect(() => {
        if (!isMonitoring) {
            activeSinceRef.current = null;
            activeNotifiedRef.current = false;
            return;
        }
        if (!metrics) return;

        if (metrics.state === "UNKNOWN") {
            activeSinceRef.current = null;
            activeNotifiedRef.current = false;
            triggerApi("UNKNOWN", { poseOk: metrics.poseOk, poseConfidence: metrics.poseConfidence });
            return;
        }

        if (metrics.breachedBoundary) {
            triggerApi("BOUNDARY", { side: metrics.breachedBoundary });
        }

        if (metrics.state === "ACTIVE") {
            activeSinceRef.current ??= Date.now();
            const activeForMs = Date.now() - (activeSinceRef.current ?? Date.now());
            if (activeForMs >= 5000 && !activeNotifiedRef.current) {
                activeNotifiedRef.current = true;
                triggerApi("ACTIVE", { activeForMs, movementSpeed: metrics.movementSpeed });
            }
        } else {
            activeSinceRef.current = null;
            activeNotifiedRef.current = false;
        }
    }, [isMonitoring, metrics?.state, metrics?.breachedBoundary, metrics?.movementSpeed]);

    return (
        <div style={{ maxWidth: 900 }}>
            <div style={{ position: "relative" }}>
                <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block" }} />
                <canvas
                    ref={canvasRef}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
                />

                <div style={{ position: "absolute", top: 10, right: 10 }}>
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            background: metrics?.breachedBoundary ? "#dc2626" : metrics?.state === "ACTIVE" ? "#16a34a" : metrics?.state === "STILL" ? "#6b7280" : "#eab308",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: 700,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                    >
                        <div style={{ fontSize: 12, textAlign: "center" }}>
                            {metrics?.breachedBoundary ? "BORDER" : metrics?.state === "ACTIVE" ? "MOTION" : metrics?.state === "STILL" ? "OK" : "NO"}
                        </div>
                    </div>
                    {apiSent && (
                        <div style={{ marginTop: 8, background: "#3b82f6", padding: 6, color: "white", borderRadius: 6 }}>
                            API: {apiSent.type} @{new Date(apiSent.at).toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button
                    onClick={() => {
                        setIsMonitoring((v) => {
                            const next = !v;
                            activeSinceRef.current = null;
                            activeNotifiedRef.current = false;
                            if (!next) setApiSent(null);
                            return next;
                        });
                        lastTriggerAtRef.current = 0;
                    }}
                    style={{ padding: "8px 12px", fontWeight: 600, background: isMonitoring ? "#b91c1c" : "#16a34a", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
                >
                    {isMonitoring ? "Stop" : "Start"}
                </button>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                    When started, API calls fire on UNKNOWN, BOUNDARY, or sustained ACTIVE.
                </div>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 700 }}>Boundaries</div>
                <label style={{ display: "grid", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Left</span>
                        <span style={{ opacity: 0.7 }}>{Math.round(leftPct * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={Math.round(leftPct * 100)} onChange={(e) => setLeftPct(Number(e.target.value) / 100)} />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Right</span>
                        <span style={{ opacity: 0.7 }}>{Math.round(rightPct * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={Math.round(rightPct * 100)} onChange={(e) => setRightPct(Number(e.target.value) / 100)} />
                </label>

                <div style={{ display: "grid", gap: 6, borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>
                    <div style={{ fontWeight: 700 }}>Diagnostics</div>
                    <div>State: <strong>{metrics?.state ?? "—"}</strong></div>
                    <div>Pose OK: {metrics?.poseOk ? "yes" : "no"}</div>
                    <div>Centroid speed: {metrics?.centroidSpeed?.toFixed(1) ?? "—"} px/s</div>
                    <div>Limb speed norm: {metrics?.movementSpeedNorm?.toFixed(3) ?? "—"} /s</div>
                    <div>Torso length: {metrics?.torsoLen?.toFixed(1) ?? "—"} px</div>
                    <div>Active score (5s): {(((metrics?.activeScore ?? 0) * 100)).toFixed(0)}%</div>
                    <div>Boundary: {metrics?.breachedBoundary ?? "none"}</div>
                </div>
            </div>
        </div>
    );
}
