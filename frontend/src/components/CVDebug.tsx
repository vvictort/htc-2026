import { useState } from "react";
import CVMonitor from "./CVMonitor";

export default function CVDebug() {
    const [open, setOpen] = useState(true);
    return (
        <div style={{ padding: 12 }}>
            <div style={{ marginBottom: 8 }}>
                <button onClick={() => setOpen((v) => !v)} style={{ padding: 8 }}>{open ? "Hide" : "Show"} CV Monitor</button>
            </div>
            {open && <CVMonitor />}
        </div>
    );
}
