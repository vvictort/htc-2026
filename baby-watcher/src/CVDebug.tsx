import { useState } from "react";
import "./App.css";
import { CameraPage } from "./pages/CameraPage";

export default function CVDebug() {
    const [mode, setMode] = useState<"camera" | "viewer">("camera");

    return (
        <div style={{ padding: 16 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button onClick={() => setMode("camera")}>Camera</button>
                <button onClick={() => setMode("viewer")}>Viewer</button>
            </div>

            {mode === "camera" ? <CameraPage /> : <div>Viewer TBD</div>}
        </div>
    );
}