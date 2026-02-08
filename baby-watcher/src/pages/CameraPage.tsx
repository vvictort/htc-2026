// src/pages/CameraPage.tsx
import { useEffect, useRef, useState } from "react";
import {
    PoseEngine,
    type AlertEvent,
    type Boundaries,
    type PoseMetrics,
    type RoiPoint,
} from "../pose/PoseEngine";

export function CameraPage() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<PoseEngine | null>(null);

    const [metrics, setMetrics] = useState<PoseMetrics | null>(null);
    const [alerts, setAlerts] = useState<AlertEvent[]>([]);

    // UI sliders store boundary positions as percentages (0..1)
    const [leftPct, setLeftPct] = useState(0.15);
    const [rightPct, setRightPct] = useState(0.85);

    // ROI: whole screen (video pixel coords)
    const roiRef = useRef<RoiPoint[]>([]);
    const boundariesRef = useRef<Boundaries>({});

    const [isMonitoring, setIsMonitoring] = useState(false);
    const lastTriggerAtRef = useRef<number>(0);
    const activeSinceRef = useRef<number | null>(null);
    const activeNotifiedRef = useRef(false);
    const [lastApiCall, setLastApiCall] = useState<{ reason: string; at: number } | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let cancelled = false;

        async function start() {
            const video = videoRef.current;
            if (!video) return;

            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            video.srcObject = stream;
            await video.play();

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
                (a) => setAlerts((prev) => [a, ...prev].slice(0, 10))
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
    }, []);

    // ROI: whole screen (video pixel coords)
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

    // Apply slider -> boundaries (in *video pixel coordinates*, as PoseEngine uses keypoint x/y in that space)
    const applyBoundariesFromSliders = () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) return;

        // Keep ROI full-screen once video dimensions are known
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

    // Ensure boundaries stay valid and always update boundariesRef
    useEffect(() => {
        // Keep left <= right with a tiny gap
        const MIN_GAP = 0.02;
        if (leftPct > rightPct - MIN_GAP) {
            setRightPct(Math.min(Math.max(leftPct + MIN_GAP, 0), 1));
            return;
        }
        applyBoundariesFromSliders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leftPct, rightPct]);

    // Canvas overlay rendering (and auto-sizing)
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

            // ROI is always full-screen in video pixel coords; make sure it’s set once video dims are ready
            setFullScreenRoiFromVideo();

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw boundaries (convert from video pixels -> canvas pixels)
            const b = boundariesRef.current;
            if (video.videoWidth && video.videoHeight) {
                const sx = canvas.width / video.videoWidth;

                const drawBoundary = (xVideo: number, label: string) => {
                    const x = xVideo * sx;
                    ctx.strokeStyle = "rgba(255, 165, 0, 0.9)";
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height);
                    ctx.stroke();

                    ctx.fillStyle = "rgba(255, 165, 0, 0.9)";
                    ctx.font = "12px sans-serif";
                    ctx.fillText(label, Math.min(Math.max(x + 6, 0), canvas.width - 40), 16);
                };

                if (b.leftX != null) drawBoundary(b.leftX, "LEFT");
                if (b.rightX != null) drawBoundary(b.rightX, "RIGHT");
            }

            // Centroid (scaled to overlay space)
            if (metrics?.centroid && video.videoWidth && video.videoHeight) {
                const sx = canvas.width / video.videoWidth;
                const sy = canvas.height / video.videoHeight;
                const cx = metrics.centroid.x * sx;
                const cy = metrics.centroid.y * sy;

                ctx.fillStyle = metrics.breachedBoundary
                    ? "rgba(255, 0, 0, 0.85)"
                    : "rgba(0, 120, 255, 0.85)";
                ctx.beginPath();
                ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
                ctx.fill();
            }

            raf = requestAnimationFrame(render);
        };

        raf = requestAnimationFrame(render);
        return () => cancelAnimationFrame(raf);
    }, [metrics]);

    const triggerDummyApiCall = async (reason: "UNKNOWN" | "BOUNDARY" | "ACTIVE", details: Record<string, unknown>) => {
        // Simple cooldown so we don't spam calls every frame.
        const now = Date.now();
        const COOLDOWN_MS = 5000;
        if (now - lastTriggerAtRef.current < COOLDOWN_MS) return;
        lastTriggerAtRef.current = now;

        // Update UI to show API call was sent
        setLastApiCall({ reason, at: now });

        try {
            await fetch("/api/monitor-event", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason, at: now, details }),
            }).catch(() => {
                // swallow network errors in dummy mode
            });

            // eslint-disable-next-line no-console
            console.log("[monitor-event]", reason, details);
        } catch {
            // ignore
        }
    };

    // When armed, trigger on UNKNOWN state, boundary breach, or sustained ACTIVE (5s)
    useEffect(() => {
        if (!isMonitoring) {
            activeSinceRef.current = null;
            activeNotifiedRef.current = false;
            return;
        }
        if (!metrics) return;

        // UNKNOWN -> immediate
        if (metrics.state === "UNKNOWN") {
            activeSinceRef.current = null;
            activeNotifiedRef.current = false;
            triggerDummyApiCall("UNKNOWN", {
                poseOk: metrics.poseOk,
                poseConfidence: metrics.poseConfidence,
            });
            return;
        }

        // Boundary -> immediate
        if (metrics.breachedBoundary) {
            triggerDummyApiCall("BOUNDARY", { side: metrics.breachedBoundary });
        }

        // Sustained ACTIVE -> after 5 seconds continuously
        const now = Date.now();
        if (metrics.state === "ACTIVE") {
            activeSinceRef.current ??= now;
            const activeForMs = now - (activeSinceRef.current ?? now);
            if (activeForMs >= 5000 && !activeNotifiedRef.current) {
                activeNotifiedRef.current = true;
                triggerDummyApiCall("ACTIVE", {
                    activeForMs,
                    movementSpeed: metrics.movementSpeed,
                });
            }
        } else {
            // STILL resets sustained-active timer
            activeSinceRef.current = null;
            activeNotifiedRef.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMonitoring, metrics?.state, metrics?.breachedBoundary, metrics?.movementSpeed]);

    return (
        <div style={{ maxWidth: 720 }}>
            <div style={{ position: "relative" }}>
                <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block" }} />
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                />
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button
                    onClick={() => {
                        setIsMonitoring((v) => {
                            const next = !v;
                            // reset active timers when toggling
                            activeSinceRef.current = null;
                            activeNotifiedRef.current = false;
                            if (next === false) {
                                setLastApiCall(null); // Clear API call indicator when stopping
                            }
                            return next;
                        });
                        // reset cooldown so first event after starting is immediate
                        lastTriggerAtRef.current = 0;
                    }}
                    style={{
                        padding: "8px 12px",
                        fontWeight: 600,
                        background: isMonitoring ? "#b91c1c" : "#16a34a",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                    }}
                >
                    {isMonitoring ? "Stop" : "Start"}
                </button>
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                    When started, we'll call the API if pose becomes UNKNOWN or crosses a boundary.
                </span>
                {lastApiCall && (
                    <div style={{
                        padding: '6px 12px',
                        background: '#3b82f6',
                        color: 'white',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600
                    }}>
                        🔔 API called: {lastApiCall.reason} @ {new Date(lastApiCall.at).toLocaleTimeString()}
                    </div>
                )}
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 600 }}>Boundaries</div>
                    <label style={{ display: "grid", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Left</span>
                            <span style={{ opacity: 0.7 }}>{Math.round(leftPct * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(leftPct * 100)}
                            onChange={(e) => setLeftPct(Number(e.target.value) / 100)}
                        />
                    </label>

                    <label style={{ display: "grid", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Right</span>
                            <span style={{ opacity: 0.7 }}>{Math.round(rightPct * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(rightPct * 100)}
                            onChange={(e) => setRightPct(Number(e.target.value) / 100)}
                        />
                    </label>

                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                        Boundary alerts fire when the trunk centroid crosses LEFT/RIGHT.
                    </div>
                </div>

                <div style={{ display: "grid", gap: 4 }}>
                    <div style={{
                        fontWeight: 600,
                        padding: '8px',
                        background: metrics?.state === "ACTIVE" ? '#22c55e' : metrics?.state === "STILL" ? '#6b7280' : '#eab308',
                        color: 'white',
                        borderRadius: 4
                    }}>
                        State: {metrics?.state ?? "—"}
                    </div>
                    <div>Pose OK: {metrics?.poseOk ? "yes" : "no"}</div>
                    <div>Pose confidence: {metrics ? metrics.poseConfidence.toFixed(2) : "—"}</div>

                    <div style={{ marginTop: 8, fontWeight: 600, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                        Centroid Motion (body position)
                    </div>
                    <div style={{
                        padding: '4px 8px',
                        background: (metrics?.centroidSpeed ?? 0) >= 35 ? '#22c55e' : '#ef4444',
                        color: 'white',
                        borderRadius: 4,
                        fontSize: 13
                    }}>
                        Speed: {metrics?.centroidSpeed != null ? metrics.centroidSpeed.toFixed(1) : "—"} px/s
                        <span style={{ marginLeft: 8, opacity: 0.9 }}>
                            (threshold: 35 px/s) {(metrics?.centroidSpeed ?? 0) >= 35 ? '✓ ACTIVE' : ''}
                        </span>
                    </div>

                    <div style={{ marginTop: 8, fontWeight: 600, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                        Limb Motion (arms/legs)
                    </div>
                    <div style={{
                        padding: '4px 8px',
                        background: (metrics?.movementSpeedNorm ?? 0) >= 0.5 ? '#22c55e' : '#ef4444',
                        color: 'white',
                        borderRadius: 4,
                        fontSize: 13
                    }}>
                        Limb speed (normalized): {metrics?.movementSpeedNorm != null ? metrics.movementSpeedNorm.toFixed(3) : "—"} /s
                        <span style={{ marginLeft: 8, opacity: 0.9 }}>
                            (threshold: 0.5 /s) {(metrics?.movementSpeedNorm ?? 0) >= 0.5 ? '✓ ACTIVE' : ''}
                        </span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        Limb speed (px): {metrics?.movementSpeed != null ? metrics.movementSpeed.toFixed(1) : "—"} px/s
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        Torso length: {metrics?.torsoLen != null ? metrics.torsoLen.toFixed(1) : "—"} px
                    </div>

                    <div style={{ marginTop: 8, fontWeight: 600, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                        Activity Score (5s window for API)
                    </div>
                    <div style={{ fontSize: 13 }}>
                        Active score: {metrics?.activeScore != null ? (metrics.activeScore * 100).toFixed(0) : "—"}%
                        <span style={{ marginLeft: 8, opacity: 0.7 }}>
                            (threshold: 60%) {(metrics?.activeScore ?? 0) >= 0.6 ? '→ triggers 5s API timer' : ''}
                        </span>
                    </div>

                    <div style={{ marginTop: 8, fontWeight: 600, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                        Boundary Detection
                    </div>
                    <div>Boundary breach: {metrics?.breachedBoundary || "none"}</div>
                </div>
            </div>

            <div style={{ marginTop: 12 }}>
                <div>Recent alerts:</div>
                <ul>
                    {alerts.map((a, i) => (
                        <li key={i}>
                            {a.type} @ {new Date(a.tEpochMs).toLocaleTimeString()}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
