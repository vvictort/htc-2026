import { useEffect, useRef, useState } from "react";
import { PoseEngine, type PoseMetrics, type RoiPoint, type Boundaries } from "../pose/PoseEngine";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export default function CVMonitor({
    externalVideoRef,
    leftPct: propLeftPct,
    rightPct: propRightPct,
    onBoundariesChange,
    mirror,
    sendApi,
}: {
    externalVideoRef?: React.RefObject<HTMLVideoElement | null>;
    leftPct?: number;
    rightPct?: number;
    onBoundariesChange?: (left: number, right: number) => void;
    mirror?: boolean;
    // when true, CVMonitor is allowed to send API notifications (controlled by Broadcaster start)
    sendApi?: boolean;
}) {
    const internalVideoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<PoseEngine | null>(null);

    // If an external videoRef is provided (e.g. from Broadcaster), use it instead of creating our own stream
    const effectiveVideoRef = externalVideoRef ?? internalVideoRef;

    const [metrics, setMetrics] = useState<PoseMetrics | null>(null);
    const [leftPctLocal, setLeftPctLocal] = useState(propLeftPct ?? 0.08);
    const [rightPctLocal, setRightPctLocal] = useState(propRightPct ?? 0.92);
    const roiRef = useRef<RoiPoint[]>([]);
    const boundariesRef = useRef<Boundaries>({});

    const lastTriggerAtRef = useRef(0);

    const sendApiRef = useRef<boolean>(!!sendApi);
    useEffect(() => {
        sendApiRef.current = !!sendApi;
    }, [sendApi]);

    const triggerApi = async (type: "UNKNOWN" | "BOUNDARY" | "ACTIVE", details: Record<string, unknown>) => {
        const now = Date.now();
        const COOLDOWN_MS = 5000;
        if (now - lastTriggerAtRef.current < COOLDOWN_MS) return;
        lastTriggerAtRef.current = now;

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

    // initialize engine
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
                    // require 100% activity over the window to trigger ACTIVE (resets after firing)
                    activeRatioThreshold: 1.0,
                },
                (m) => setMetrics(m),
                (a) => {
                    // Only forward alerts to API when broadcasting (sendApiRef set by Broadcaster)
                    if (sendApiRef.current) {
                        triggerApi(a.type, a.details ?? {});
                    }
                }
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

    // sync prop boundaries into local state
    useEffect(() => {
        if (propLeftPct != null) setLeftPctLocal(propLeftPct);
        if (propRightPct != null) setRightPctLocal(propRightPct);
    }, [propLeftPct, propRightPct]);

    const setFullScreenRoiFromVideo = () => {
        const video = effectiveVideoRef.current;
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

    const applyBoundaries = (left: number, right: number) => {
        const video = effectiveVideoRef.current;
        if (!video || !video.videoWidth) return;
        setFullScreenRoiFromVideo();

        const lp = Math.min(Math.max(left, 0), 1);
        const rp = Math.min(Math.max(right, 0), 1);
        const l = Math.min(lp, rp);
        const r = Math.max(lp, rp);

        boundariesRef.current = {
            leftX: l * video.videoWidth,
            rightX: r * video.videoWidth,
        };

        onBoundariesChange?.(l, r);
    };

    useEffect(() => {
        applyBoundaries(leftPctLocal, rightPctLocal);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leftPctLocal, rightPctLocal, effectiveVideoRef.current?.videoWidth]);

    // draw overlay canvas based on effective video
    useEffect(() => {
        const canvas = canvasRef.current;
        const video = effectiveVideoRef.current;
        if (!canvas || !video) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // ensure canvas is positioned over the video element but under UI controls
        canvas.style.position = "fixed";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "1";

        let raf = 0;
        const render = () => {
            const rect = video.getBoundingClientRect();
            // size the canvas to the video's on-screen size and position it
            const w = Math.max(1, Math.round(rect.width));
            const h = Math.max(1, Math.round(rect.height));
            if (canvas.width !== w) canvas.width = w;
            if (canvas.height !== h) canvas.height = h;
            canvas.style.left = rect.left + "px";
            canvas.style.top = rect.top + "px";
            canvas.style.width = rect.width + "px";
            canvas.style.height = rect.height + "px";

            setFullScreenRoiFromVideo();

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // mirror canvas drawing if requested
            if (mirror) {
                ctx.save();
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }

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
                const cy = canvas.height / video.videoHeight;
                const cx = metrics.centroid.x * sx;
                const cy2 = metrics.centroid.y * cy;

                ctx.fillStyle = metrics.breachedBoundary ? "rgba(255,0,0,0.95)" : "rgba(0,120,255,0.95)";
                ctx.beginPath();
                ctx.arc(cx, cy2, 8, 0, 2 * Math.PI);
                ctx.fill();
            }

            if (mirror) ctx.restore();

            raf = requestAnimationFrame(render);
        };

        raf = requestAnimationFrame(render);
        return () => cancelAnimationFrame(raf);
    }, [metrics, mirror]);

    return (
        <div style={{ maxWidth: 900, position: 'relative', zIndex: 1001 }}>
            <div style={{ position: "relative", zIndex: 1002 }}>
                {/* internal video is used only if no external video passed */}
                {externalVideoRef == null && (
                    <video ref={internalVideoRef} playsInline muted style={{ width: "100%", display: "block", transform: mirror ? "scaleX(-1)" : undefined }} />
                )}
                <canvas
                    ref={canvasRef}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", transform: mirror ? "scaleX(-1)" : undefined, zIndex: 1 }}
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
                        {/* <div style={{ fontSize: 12, textAlign: "center" }}>
                            {metrics?.breachedBoundary ? "BORDER" : metrics?.state === "ACTIVE" ? "MOTION" : metrics?.state === "STILL" ? "OK" : "NO"}
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    );
}
