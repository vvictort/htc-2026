import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import CVMonitor from "./CVMonitor";

const BACKEND_URL = "http://localhost:5000";

interface BroadcasterProps {
  roomId: string;
}

export default function Broadcaster({ roomId }: BroadcasterProps) {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [mirror, setMirror] = useState(true);

  const [leftPct, setLeftPct] = useState(0.08);
  const [rightPct, setRightPct] = useState(0.92);

  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    console.log("Broadcaster component mounted for room:", roomId);
    socketRef.current = io(BACKEND_URL);

    socketRef.current.on("connect", () => {
      console.log("Broadcaster connected to signaling server with ID:", socketRef.current?.id);
      socketRef.current?.emit("join-room", roomId);
    });

    socketRef.current.on("viewer-joined", async (viewerId: string) => {
      console.log("Viewer joined:", viewerId);

      // Check if we already have a connection with this viewer
      if (peerConnectionsRef.current.has(viewerId)) {
        console.log("Already have connection with viewer:", viewerId);
        return;
      }

      setViewerCount((prev) => prev + 1);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) socketRef.current?.emit("ice-candidate", viewerId, event.candidate);
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          peerConnectionsRef.current.delete(viewerId);
          setViewerCount((p) => Math.max(0, p - 1));
        }
      };

      // Add current stream tracks (preview stream) to the peer
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => pc.addTrack(t, streamRef.current!));
      }

      peerConnectionsRef.current.set(viewerId, pc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("offer", viewerId, offer);
    });

    socketRef.current.on("viewer-disconnected", (viewerId: string) => {
      console.log("Viewer disconnected:", viewerId);
      const pc = peerConnectionsRef.current.get(viewerId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(viewerId);
        setViewerCount((p) => Math.max(0, p - 1));
      }
    });

    socketRef.current.on("answer", async (viewerId: string, answer: RTCSessionDescriptionInit) => {
      const pc = peerConnectionsRef.current.get(viewerId);
      if (pc) await pc.setRemoteDescription(answer);
    });

    socketRef.current.on("ice-candidate", (viewerId: string, candidate: RTCIceCandidateInit) => {
      const pc = peerConnectionsRef.current.get(viewerId);
      if (pc) pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // request camera & mic permission immediately and attach preview
    const openPreview = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          // keep muted preview
          videoRef.current.play().catch(() => {});
        }
        setPermissionGranted(true);
      } catch (err) {
        console.error("Permission request failed:", err);
        setError("Failed to access camera/microphone. Please grant permissions.");
      }
    };

    openPreview();

    return () => {
      console.log("Broadcaster unmounting - cleanup");
      // cleanup peers but keep stream alive only if we want
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // do not stop preview stream here, leave it to explicit user action
    };
  }, [roomId]);

  const startBroadcasting = () => {
    if (!permissionGranted) return;
    socketRef.current?.emit("broadcaster", roomId);
    setIsBroadcasting(true);
  };

  const stopBroadcasting = () => {
    // Close peer connections only; keep preview stream active
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    socketRef.current?.emit("stop-broadcast", roomId);
    setIsBroadcasting(false);
  };

  // draggable boundary handles
  useEffect(() => {
    // ensure pct bounds
    setLeftPct((v) => Math.min(Math.max(v, 0), 1));
    setRightPct((v) => Math.min(Math.max(v, 0), 1));
  }, []);

  const startDrag = (which: "left" | "right", e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const move = (pageX: number) => {
      const rect = videoRef.current?.getBoundingClientRect();
      if (!rect) return;
      const rel = (pageX - rect.left) / rect.width;
      if (which === "left") setLeftPct(Math.min(Math.max(rel, 0), rightPct - 0.02));
      else setRightPct(Math.max(Math.min(rel, 1), leftPct + 0.02));
    };

    const onMove = (ev: MouseEvent) => move(ev.pageX);
    const onTouch = (ev: TouchEvent) => move(ev.touches[0].pageX);
    const up = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
      // notify CVMonitor of boundary change
      // note CVMonitor reads values from Broadcaster props
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true } as any);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
  };

  return (
    <div className="flex flex-col gap-4 p-6 max-w-4xl w-full">
      <div className="bg-gray-800 rounded-xl shadow-2xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <i className="fa-solid fa-video"></i>
            Broadcaster - Room: {roomId}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className="text-lg font-semibold">
                {isBroadcasting ? (
                  <span className="text-green-500">🔴 Live</span>
                ) : (
                  <span className="text-gray-300">Preview</span>
                )}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Viewers</div>
              <div className="text-lg font-semibold text-white">{viewerCount}</div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation text-red-400"></i>
              <span className="text-red-200">{error}</span>
            </div>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "16/9" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
              style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
            />

            {/* CV Monitor visible while previewing; pass videoRef and boundary props; allow interactions */}
            <div className="absolute top-4 right-4" style={{ width: 360, zIndex: 1003 }}>
              <CVMonitor
                externalVideoRef={videoRef}
                leftPct={leftPct}
                rightPct={rightPct}
                mirror={mirror}
                sendApi={isBroadcasting}
                onBoundariesChange={(l, r) => { setLeftPct(l); setRightPct(r); }}
              />
            </div>

            {/* bottom draggable boundary bars */}
            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, height: 80, pointerEvents: 'auto' }}>
              <div style={{ color: 'white', marginBottom: 6, fontWeight: 700 }}>Set the baby's left/right borders</div>
              <div style={{ position: 'relative', height: 48, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
                {/* draggable left and right handles */}
                <div
                  onMouseDown={(e) => startDrag('left', e)}
                  onTouchStart={(e) => startDrag('left', e)}
                  style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${Math.round(leftPct * 100)}%`, width: 12, transform: 'translateX(-50%)', cursor: 'ew-resize',
                    background: '#ff9900', borderRadius: 6,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                />
                <div
                  onMouseDown={(e) => startDrag('right', e)}
                  onTouchStart={(e) => startDrag('right', e)}
                  style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${Math.round(rightPct * 100)}%`, width: 12, transform: 'translateX(-50%)', cursor: 'ew-resize',
                    background: '#ff9900', borderRadius: 6,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                />

                {/* shaded region between bars (allowed play area) */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${Math.round(leftPct * 100)}%`, right: `${100 - Math.round(rightPct * 100)}%`, background: 'rgba(34,197,94,0.12)', borderRadius: 6 }} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white' }}>
              <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} /> Mirror preview
            </label>

            {!isBroadcasting ? (
              <button
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
                onClick={startBroadcasting}
                disabled={!permissionGranted}
              >
                <i className="fa-solid fa-play"></i>
                Start Broadcasting
              </button>
            ) : (
              <button
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
                onClick={stopBroadcasting}
              >
                <i className="fa-solid fa-stop"></i>
                Stop Broadcasting
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
