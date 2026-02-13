import { useCallback, useRef, useState } from "react";
import CVMonitor from "./CVMonitor";
import type { AlertEvent } from "../pose/PoseEngine";

interface LogEntry {
    id: number;
    time: string;
    type: string;
    details: string;
}

export default function CVDebug() {
    const [open, setOpen] = useState(true);
    const [leftPct, setLeftPct] = useState(0.08);
    const [rightPct, setRightPct] = useState(0.92);
    const [eventLog, setEventLog] = useState<LogEntry[]>([]);
    const idCounter = useRef(0);
    const logEndRef = useRef<HTMLDivElement | null>(null);

    const handleAlert = useCallback((a: AlertEvent) => {
        const entry: LogEntry = {
            id: ++idCounter.current,
            time: new Date(a.tEpochMs).toLocaleTimeString(),
            type: a.type,
            details: a.details ? JSON.stringify(a.details) : "",
        };
        setEventLog((prev) => [...prev.slice(-99), entry]);
        setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#111", color: "#eee", fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#1a1a2e", borderBottom: "1px solid #333" }}>
                <h2 style={{ margin: 0, fontSize: 18 }}>🔬 CV Debug &nbsp;
                    <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.6 }}>real-time motion categorization</span>
                </h2>
                <div style={{ flex: 1 }} />
                <button
                    onClick={() => setOpen((v) => !v)}
                    style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: open ? "#dc2626" : "#16a34a", color: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                    {open ? "⏹ Stop" : "▶ Start"}
                </button>
            </div>
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                <div style={{ flex: 2, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
                    {open ? (
                        <CVMonitor
                            leftPct={leftPct}
                            rightPct={rightPct}
                            showDebugHUD
                            onAlertDebug={handleAlert}
                        />
                    ) : (
                        <div style={{ color: "#666", fontSize: 20 }}>Camera stopped</div>
                    )}
                </div>
                <div style={{ flex: 1, minWidth: 280, maxWidth: 360, display: "flex", flexDirection: "column", borderLeft: "1px solid #333", background: "#16161a" }}>
                    <div style={{ padding: 16, borderBottom: "1px solid #333" }}>
                        <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>🔲 Boundary Zone</h3>
                        <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
                            Left: {(leftPct * 100).toFixed(0)}%
                        </label>
                        <input
                            type="range" min="0" max="0.5" step="0.01"
                            value={leftPct}
                            onChange={(e) => setLeftPct(Number(e.target.value))}
                            style={{ width: "100%", accentColor: "#f59e0b" }}
                        />
                        <label style={{ display: "block", fontSize: 12, marginBottom: 4, marginTop: 8 }}>
                            Right: {(rightPct * 100).toFixed(0)}%
                        </label>
                        <input
                            type="range" min="0.5" max="1" step="0.01"
                            value={rightPct}
                            onChange={(e) => setRightPct(Number(e.target.value))}
                            style={{ width: "100%", accentColor: "#f59e0b" }}
                        />
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #333" }}>
                            <h3 style={{ margin: 0, fontSize: 14, flex: 1 }}>📋 Alert Log ({eventLog.length})</h3>
                            <button
                                onClick={() => setEventLog([])}
                                style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, border: "1px solid #555", background: "transparent", color: "#aaa", cursor: "pointer" }}
                            >
                                Clear
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", fontFamily: "monospace", fontSize: 12 }}>
                            {eventLog.length === 0 && (
                                <div style={{ color: "#555", padding: 16, textAlign: "center" }}>
                                    No alerts yet — move around to trigger ACTIVE or cross a boundary line
                                </div>
                            )}
                            {eventLog.map((e) => (
                                <div
                                    key={e.id}
                                    style={{
                                        padding: "6px 8px",
                                        marginBottom: 4,
                                        borderRadius: 6,
                                        background: e.type === "BOUNDARY" ? "rgba(220,38,38,0.15)" : "rgba(22,163,74,0.15)",
                                        borderLeft: `3px solid ${e.type === "BOUNDARY" ? "#dc2626" : "#16a34a"}`,
                                    }}
                                >
                                    <span style={{ color: "#888" }}>{e.time}</span>{" "}
                                    <span style={{ fontWeight: 700, color: e.type === "BOUNDARY" ? "#f87171" : "#4ade80" }}>{e.type}</span>
                                    {e.details && <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>{e.details}</div>}
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
