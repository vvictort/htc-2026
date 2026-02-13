import { useRef } from "react";

interface BoundaryOverlayProps {
    leftPct: number;
    rightPct: number;
    onChange: (leftPct: number, rightPct: number) => void;
}

/**
 * Self-contained boundary overlay that renders directly on top of the video.
 * Two orange boundary lines with drag handles — no separate slider bar needed.
 * Works entirely in screen-space percentages; mirror conversion happens downstream (CVMonitor → PoseEngine).
 */
export default function BoundaryOverlay({ leftPct, rightPct, onChange }: BoundaryOverlayProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const startDrag = (which: "left" | "right", e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const clamp = (v: number) => Math.max(0, Math.min(1, v));

        const move = (pageX: number) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const rel = clamp((pageX - rect.left) / rect.width);
            if (which === "left") onChange(Math.min(rel, rightPct - 0.02), rightPct);
            else onChange(leftPct, Math.max(rel, leftPct + 0.02));
        };

        const onMouseMove = (ev: MouseEvent) => move(ev.pageX);
        const onTouchMove = (ev: TouchEvent) => move(ev.touches[0].pageX);
        const up = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("mouseup", up);
            window.removeEventListener("touchend", up);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("touchmove", onTouchMove, { passive: true } as EventListenerOptions);
        window.addEventListener("mouseup", up);
        window.addEventListener("touchend", up);
    };

    const lineStyle = (pct: number): React.CSSProperties => ({
        position: "absolute",
        top: 0,
        bottom: 0,
        left: `${pct * 100}%`,
        width: 3,
        marginLeft: -1,
        background: "rgba(255,165,0,0.9)",
        cursor: "ew-resize",
        pointerEvents: "auto",
        zIndex: 2,
    });

    const handleStyle: React.CSSProperties = {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 14,
        height: 52,
        borderRadius: 7,
        background: "#ff9900",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
    };

    return (
        <div
            ref={containerRef}
            style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${leftPct * 100}%`,
                    right: `${(1 - rightPct) * 100}%`,
                    background: "rgba(34,197,94,0.06)",
                    borderTop: "2px solid rgba(34,197,94,0.15)",
                    borderBottom: "2px solid rgba(34,197,94,0.15)",
                }}
            />
            <div
                onMouseDown={(e) => startDrag("left", e)}
                onTouchStart={(e) => startDrag("left", e)}
                style={lineStyle(leftPct)}
            >
                <div style={handleStyle} />
                <span
                    style={{
                        position: "absolute",
                        top: 10,
                        left: 12,
                        color: "rgba(255,165,0,0.9)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 1,
                        textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                    }}
                >
                    L
                </span>
            </div>
            <div
                onMouseDown={(e) => startDrag("right", e)}
                onTouchStart={(e) => startDrag("right", e)}
                style={lineStyle(rightPct)}
            >
                <div style={handleStyle} />
                <span
                    style={{
                        position: "absolute",
                        top: 10,
                        right: 12,
                        color: "rgba(255,165,0,0.9)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 1,
                        textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                    }}
                >
                    R
                </span>
            </div>
        </div>
    );
}
