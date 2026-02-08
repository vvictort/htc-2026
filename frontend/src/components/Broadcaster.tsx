import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getAuthToken, NOTIFICATION_ENDPOINTS, WEBRTC_ENDPOINTS } from "../utils/api";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

interface BroadcasterProps {
  roomId: string;
}

export default function Broadcaster({ roomId }: BroadcasterProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<{ reason: string; at: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const streamRef = useRef<MediaStream | null>(null);
  const lastEventAtRef = useRef<number>(0);
  const canvasSnapRef = useRef<HTMLCanvasElement | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ]);

  // Fetch TURN/STUN servers from backend for cross-network connectivity
  useEffect(() => {
    fetch(WEBRTC_ENDPOINTS.ICE_SERVERS)
      .then((r) => r.json())
      .then((data) => {
        if (data.iceServers) iceServersRef.current = data.iceServers;
        console.log(`[ICE] Loaded ${data.iceServers?.length ?? 0} ICE servers`);
      })
      .catch((err) => console.warn("[ICE] Failed to fetch ICE servers, using STUN-only fallback:", err));
  }, []);

  // Capture a JPEG snapshot from the live video element
  const captureSnapshot = (): string | undefined => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return undefined;

    if (!canvasSnapRef.current) {
      canvasSnapRef.current = document.createElement("canvas");
    }
    const canvas = canvasSnapRef.current;
    // Thumbnail size to keep payload small
    const scale = 320 / video.videoWidth;
    canvas.width = 320;
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Return raw base64 without the data-url prefix
    return canvas.toDataURL("image/jpeg", 0.7).replace(/^data:image\/jpeg;base64,/, "");
  };

  // Send a monitor event to the backend notifications endpoint
  const sendMonitorEvent = async (
    reason: "ACTIVE" | "BOUNDARY" | "UNKNOWN" | "SOUND",
    details?: Record<string, unknown>
  ) => {
    const now = Date.now();
    const COOLDOWN_MS = 10_000; // 10s cooldown between events
    if (now - lastEventAtRef.current < COOLDOWN_MS) return;
    lastEventAtRef.current = now;

    setLastEvent({ reason, at: now });

    const snapshot = captureSnapshot();
    const token = getAuthToken();

    try {
      await fetch(NOTIFICATION_ENDPOINTS.CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason, snapshot, details }),
      });
      console.log(`[monitor-event] ${reason} → notification sent`);
    } catch (err) {
      console.error("[monitor-event] failed to send:", err);
    }
  };

  const createPeerConnection = (viewerId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({
      iceServers: iceServersRef.current,
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice-candidate", viewerId, event.candidate);
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${viewerId}:`, peerConnection.connectionState);
      if (
        peerConnection.connectionState === "disconnected" ||
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "closed"
      ) {
        peerConnectionsRef.current.delete(viewerId);
        setViewerCount((prev) => Math.max(0, prev - 1));
      }
    };

    return peerConnection;
  };

  const stopStreaming = () => {
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setViewerCount(0);
    console.log("Broadcasting stopped");
  };
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

      const peerConnection = createPeerConnection(viewerId);
      peerConnectionsRef.current.set(viewerId, peerConnection);

      // Add stream tracks to peer connection
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, streamRef.current!);
        });
      }

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socketRef.current?.emit("offer", viewerId, offer);
    });

    socketRef.current.on("viewer-disconnected", (viewerId: string) => {
      console.log("Viewer disconnected:", viewerId);

      // Close and remove peer connection
      const peerConnection = peerConnectionsRef.current.get(viewerId);
      if (peerConnection) {
        peerConnection.close();
        peerConnectionsRef.current.delete(viewerId);
        setViewerCount((prev) => Math.max(0, prev - 1));
      }
    });

    socketRef.current.on("answer", async (viewerId: string, answer: RTCSessionDescriptionInit) => {
      console.log("Received answer from viewer:", viewerId);
      const peerConnection = peerConnectionsRef.current.get(viewerId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    });

    socketRef.current.on("ice-candidate", (viewerId: string, candidate: RTCIceCandidateInit) => {
      console.log("Received ICE candidate from viewer:", viewerId);
      const peerConnection = peerConnectionsRef.current.get(viewerId);
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Cleanup function
    return () => {
      console.log("Broadcaster component unmounting - cleaning up for room:", roomId);
      stopStreaming();
      if (socketRef.current) {
        console.log("Disconnecting broadcaster socket:", socketRef.current.id);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId]);

  const startStreaming = async () => {
    try {
      setError(null);

      // Get user media (camera)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      streamRef.current = stream;

      // Display local video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Announce as broadcaster
      socketRef.current?.emit("broadcaster", roomId);
      setIsStreaming(true);

      console.log("Broadcasting started");
    } catch (err) {
      console.error("Error starting stream:", err);
      setError("Failed to access camera. Please grant camera permissions.");
    }
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
                {isStreaming ? (
                  <span className="text-green-500">🔴 Live</span>
                ) : (
                  <span className="text-gray-300">Offline</span>
                )}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Viewers</div>
              <div className="text-lg font-semibold text-white">{viewerCount}</div>
            </div>
          </div>

          {lastEvent && (
            <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-blue-200">
              🔔 Notification sent: <strong>{lastEvent.reason}</strong> at{" "}
              {new Date(lastEvent.at).toLocaleTimeString()}
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation text-red-400"></i>
              <span className="text-red-200">{error}</span>
            </div>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "16/9" }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <i className="fa-solid fa-video-slash text-6xl mb-4"></i>
                  <p>Camera off</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            {!isStreaming ? (
              <button
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
                onClick={startStreaming}>
                <i className="fa-solid fa-play"></i>
                Start Broadcasting
              </button>
            ) : (
              <button
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
                onClick={stopStreaming}>
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
