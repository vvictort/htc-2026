import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { MOTION_ENDPOINTS, WEBRTC_ENDPOINTS } from "../utils/api";
import { auth } from "../config/firebase";
import BoundaryOverlay from "./BoundaryOverlay";
import CVMonitor from "./CVMonitor";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

interface BroadcasterProps {
  roomId: string;
  /** When true, renders as full-screen video with HUD overlay instead of the legacy card UI */
  fullscreen?: boolean;
  /** Called when user taps "Stop" inside the fullscreen HUD */
  onStop?: () => void;
  /** Auto-start the camera when the component mounts (no second click needed) */
  autoStart?: boolean;
}

export default function Broadcaster({ roomId, fullscreen = false, onStop, autoStart = false }: BroadcasterProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [leftPct, setLeftPct] = useState(0.08);
  const [rightPct, setRightPct] = useState(0.92);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<{ reason: string; at: number } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [lullabyPlaying, setLullabyPlaying] = useState(false);
  const [lullabyProgress, setLullabyProgress] = useState<{ current: number; duration: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const streamRef = useRef<MediaStream | null>(null);
  const lastEventAtRef = useRef<number>(0);
  const canvasSnapRef = useRef<HTMLCanvasElement | null>(null);
  const lullabyAudioRef = useRef<HTMLAudioElement | null>(null);
  const lullabyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ]);

  useEffect(() => {
    fetch(WEBRTC_ENDPOINTS.ICE_SERVERS)
      .then((r) => r.json())
      .then((data) => {
        if (data.iceServers) iceServersRef.current = data.iceServers;
        console.log(`[ICE] Loaded ${data.iceServers?.length ?? 0} ICE servers`);
      })
      .catch((err) => console.warn("[ICE] Failed to fetch ICE servers, using STUN-only fallback:", err));
  }, []);

  const captureSnapshot = (): string | undefined => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return undefined;

    if (!canvasSnapRef.current) {
      canvasSnapRef.current = document.createElement("canvas");
    }
    const canvas = canvasSnapRef.current;
    const scale = 320 / video.videoWidth;
    canvas.width = 320;
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7).replace(/^data:image\/jpeg;base64,/, "");
  };

  const lastReasonRef = useRef("");
  const lastReasonAtRef = useRef(0);
  const eventPendingRef = useRef(false);

  /** Map PoseEngine alert types → backend MotionCategory values */
  const mapToCategory = (reason: string): string => {
    switch (reason) {
      case "ACTIVE":
        return "slight_movement";
      case "BOUNDARY":
        return "out_of_frame";
      case "SOUND":
        return "crying_motion";
      default:
        return "unknown";
    }
  };

  const sendMonitorEvent = async (
    reason: "ACTIVE" | "BOUNDARY" | "UNKNOWN" | "SOUND",
    details?: Record<string, unknown>,
  ) => {
    const now = Date.now();
    const COOLDOWN_MS = 5_000;
    const SAME_REASON_COOLDOWN_MS = 10_000;
    const category = mapToCategory(reason);
    console.log(`[sendMonitorEvent] Attempting monitor event: ${reason} → category="${category}"`, {
      details,
      now,
      lastEventAt: lastEventAtRef.current,
    });
    if (now - lastEventAtRef.current < COOLDOWN_MS) {
      console.log(`[sendMonitorEvent] Blocked by cooldown (${COOLDOWN_MS / 1000}s)`);
      return;
    }
    if (category === lastReasonRef.current && now - lastReasonAtRef.current < SAME_REASON_COOLDOWN_MS) {
      console.log(`[sendMonitorEvent] Blocked by same-reason dedup (${category})`);
      return;
    }
    if (eventPendingRef.current) return;
    lastEventAtRef.current = now;
    lastReasonRef.current = category;
    lastReasonAtRef.current = now;
    eventPendingRef.current = true;

    console.log(`[Broadcaster] 📤 Sending motion event: ${reason} → ${category}`, {
      details,
      timestamp: new Date(now).toLocaleTimeString(),
    });

    setLastEvent({ reason, at: now });

    const snapshot = captureSnapshot();

    let token: string | null = null;
    try {
      token = (await auth.currentUser?.getIdToken()) ?? null;
    } catch (e) {
      console.warn("[sendMonitorEvent] Failed to get auth token:", e);
    }

    try {
      console.log(`[sendMonitorEvent] Sending ${category} to ${MOTION_ENDPOINTS.CREATE}`, {
        snapshotExists: !!snapshot,
      });
      await fetch(MOTION_ENDPOINTS.CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ category, confidence: 0.7, snapshot, metadata: details }),
      });
      console.log(`[motion] ${category} → event sent to /api/motion`);
    } catch (err) {
      console.error("[motion] failed to send:", err);
    } finally {
      eventPendingRef.current = false;
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

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

      if (peerConnectionsRef.current.has(viewerId)) {
        console.log("Already have connection with viewer:", viewerId);
        return;
      }

      setViewerCount((prev) => prev + 1);

      const peerConnection = createPeerConnection(viewerId);
      peerConnectionsRef.current.set(viewerId, peerConnection);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, streamRef.current!);
        });
      }

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socketRef.current?.emit("offer", viewerId, offer);
    });

    socketRef.current.on("viewer-disconnected", (viewerId: string) => {
      console.log("Viewer disconnected:", viewerId);

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
    socketRef.current.on("play-audio", (audioUrl: string) => {
      console.log("[Broadcaster] Received play-audio event, data length:", audioUrl.length);
      setIsPlayingAudio(true);

      try {
        const audio = new Audio(audioUrl);
        audio
          .play()
          .then(() => console.log("[Broadcaster] Audio playing on baby device"))
          .catch((err) => console.error("[Broadcaster] Audio playback error:", err));

        audio.onended = () => {
          console.log("[Broadcaster] Audio playback completed");
          setIsPlayingAudio(false);
          audio.remove();
        };

        audio.onerror = () => {
          console.error("[Broadcaster] Audio error");
          setIsPlayingAudio(false);
          audio.remove();
        };
      } catch (err) {
        console.error("[Broadcaster] Failed to create audio element:", err);
        setIsPlayingAudio(false);
      }
    });

    socketRef.current.on("lullaby-play", (payload: { audioBase64: string; durationMs: number; vibe: string }) => {
      console.log(
        `[Broadcaster] 🎶 Received lullaby-play (${(payload.audioBase64.length / 1024).toFixed(0)} KB, ${payload.vibe})`,
      );
      if (lullabyAudioRef.current) {
        lullabyAudioRef.current.pause();
        lullabyAudioRef.current = null;
      }
      if (lullabyIntervalRef.current) clearInterval(lullabyIntervalRef.current);

      const byteString = atob(payload.audioBase64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      lullabyAudioRef.current = audio;

      audio
        .play()
        .then(() => {
          setLullabyPlaying(true);
          lullabyIntervalRef.current = setInterval(() => {
            if (!audio.paused && socketRef.current) {
              const status = {
                state: "playing",
                currentTime: audio.currentTime,
                duration: audio.duration || payload.durationMs / 1000,
              };
              setLullabyProgress({ current: audio.currentTime, duration: status.duration });
              socketRef.current.emit("lullaby-status", roomId, status);
            }
          }, 1000);
        })
        .catch((err) => console.error("[Broadcaster] lullaby play error:", err));

      audio.onended = () => {
        setLullabyPlaying(false);
        setLullabyProgress(null);
        if (lullabyIntervalRef.current) clearInterval(lullabyIntervalRef.current);
        if (socketRef.current)
          socketRef.current.emit("lullaby-status", roomId, { state: "ended", currentTime: 0, duration: 0 });
        URL.revokeObjectURL(url);
        lullabyAudioRef.current = null;
      };
    });

    socketRef.current.on("lullaby-stop", () => {
      console.log("[Broadcaster] 🎶 Received lullaby-stop");
      if (lullabyAudioRef.current) {
        lullabyAudioRef.current.pause();
        lullabyAudioRef.current = null;
      }
      if (lullabyIntervalRef.current) clearInterval(lullabyIntervalRef.current);
      setLullabyPlaying(false);
      setLullabyProgress(null);
      if (socketRef.current)
        socketRef.current.emit("lullaby-status", roomId, { state: "stopped", currentTime: 0, duration: 0 });
    });

    socketRef.current.on("lullaby-play", (payload: { audioBase64: string; durationMs: number; vibe: string }) => {
      console.log(
        `[Broadcaster] 🎶 Received lullaby-play (${(payload.audioBase64.length / 1024).toFixed(0)} KB, ${payload.vibe})`,
      );
      if (lullabyAudioRef.current) {
        lullabyAudioRef.current.pause();
        lullabyAudioRef.current = null;
      }
      if (lullabyIntervalRef.current) clearInterval(lullabyIntervalRef.current);

      const byteString = atob(payload.audioBase64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      lullabyAudioRef.current = audio;

      audio
        .play()
        .then(() => {
          setLullabyPlaying(true);
          lullabyIntervalRef.current = setInterval(() => {
            if (!audio.paused && socketRef.current) {
              const status = {
                state: "playing",
                currentTime: audio.currentTime,
                duration: audio.duration || payload.durationMs / 1000,
              };
              setLullabyProgress({ current: audio.currentTime, duration: status.duration });
              socketRef.current.emit("lullaby-status", roomId, status);
            }
          }, 1000);
        })
        .catch((err) => console.error("[Broadcaster] lullaby play error:", err));

      audio.onended = () => {
        setLullabyPlaying(false);
        setLullabyProgress(null);
        if (lullabyIntervalRef.current) clearInterval(lullabyIntervalRef.current);
        if (socketRef.current)
          socketRef.current.emit("lullaby-status", roomId, { state: "ended", currentTime: 0, duration: 0 });
        URL.revokeObjectURL(url);
        lullabyAudioRef.current = null;
      };
    });

    socketRef.current.on("lullaby-stop", () => {
      console.log("[Broadcaster] 🎶 Received lullaby-stop");
      if (lullabyAudioRef.current) {
        lullabyAudioRef.current.pause();
        lullabyAudioRef.current = null;
      }
      if (lullabyIntervalRef.current) clearInterval(lullabyIntervalRef.current);
      setLullabyPlaying(false);
      setLullabyProgress(null);
      if (socketRef.current)
        socketRef.current.emit("lullaby-status", roomId, { state: "stopped", currentTime: 0, duration: 0 });
    });

    return () => {
      console.log("Broadcaster component unmounting - cleaning up for room:", roomId);
      stopStreaming();
      if (lullabyAudioRef.current) {
        lullabyAudioRef.current.pause();
        lullabyAudioRef.current = null;
      }
      if (lullabyIntervalRef.current) clearInterval(lullabyIntervalRef.current);
      if (socketRef.current) {
        console.log("Disconnecting broadcaster socket:", socketRef.current.id);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId]);

  useEffect(() => {
    const openPreview = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(() => {});
        }
        console.log("[Broadcaster] preview stream started");
      } catch (err) {
        console.warn("[Broadcaster] preview permission failed", err);
      }
    };

    openPreview();
    return () => {
    };
  }, []);

  useEffect(() => {
    if (autoStart && !isStreaming) {
      startStreaming();
    }
  }, [autoStart]);

  const startStreaming = async () => {
    try {
      setError(null);

      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      }

      socketRef.current?.emit("broadcaster", roomId);
      setIsStreaming(true);

      console.log("Broadcasting started (signaled)");
    } catch (err) {
      console.error("Error starting stream:", err);
      setError("Failed to access camera. Please grant camera permissions.");
    }
  };
  
  if (fullscreen) {
    return (
      <div className="absolute inset-0 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal/90 z-10">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <span className="text-5xl opacity-40">📹</span>
            </div>
            <p className="text-white/50 text-sm mb-8">Camera is off</p>
            <button
              onClick={startStreaming}
              className="px-8 py-4 bg-coral hover:bg-coral-dark active:scale-95 text-white font-bold text-base rounded-2xl transition-all shadow-lg flex items-center gap-3">
              <span className="text-xl">▶️</span>
              Start Camera
            </button>
          </div>
        )}
        {isStreaming && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="pointer-events-auto flex items-center justify-between px-4 py-3 bg-linear-to-b from-black/70 to-transparent">
              <div className="flex items-center gap-3">
                <span className="text-xl">👶</span>
                <span className="text-white font-bold text-sm tracking-wide">
                  Lulla<span className="text-coral">link</span>
                </span>
                <span className="ml-1 flex items-center gap-1.5 text-xs text-white/60">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Live
                </span>
              </div>

              <button
                onClick={() => {
                  stopStreaming();
                  onStop?.();
                }}
                className="px-4 py-1.5 text-sm text-white/80 hover:text-white bg-white/10 hover:bg-red-500/80 rounded-full backdrop-blur-sm transition-all">
                ⏹ Stop
              </button>
            </div>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 items-end">
              <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                <span className="text-base">👁️</span>
                <span className="text-white font-semibold text-sm">{viewerCount}</span>
                <span className="text-white/50 text-xs">{viewerCount === 1 ? "viewer" : "viewers"}</span>
              </div>
              {lastEvent && (
                <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-soft-blue/20 backdrop-blur-md rounded-full border border-soft-blue/30">
                  <span className="text-base">🔔</span>
                  <span className="text-white/80 text-xs font-medium">{lastEvent.reason}</span>
                </div>
              )}
              {lullabyPlaying && lullabyProgress && (
                <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-md rounded-full border border-purple-400/30">
                  <span className="text-base animate-pulse">🎶</span>
                  <span className="text-white/80 text-xs font-medium">
                    {Math.floor(lullabyProgress.duration - lullabyProgress.current)}s left
                  </span>
                </div>
              )}
            </div>
            {error && (
              <div className="pointer-events-auto absolute top-16 left-1/2 -translate-x-1/2 max-w-sm w-full mx-4">
                <div className="bg-red-500/80 backdrop-blur-md text-white text-sm rounded-xl px-4 py-3 flex items-center gap-2 shadow-lg border border-red-400/30">
                  <span>⚠️</span>
                  <span className="flex-1">{error}</span>
                  <button onClick={() => setError(null)} className="text-white/70 hover:text-white ml-2">
                    ✕
                  </button>
                </div>
              </div>
            )}{" "}
            <div className="pointer-events-auto absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-3 bg-linear-to-t from-black/70 to-transparent">
              <span className="text-xs text-white/40 font-mono">Room: {roomId}</span>
              <span className="text-[0.6rem] text-white/30">Baby Device Mode</span>
            </div>
            {isPlayingAudio && (
              <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                <div className="bg-black/80 backdrop-blur-xl rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl border border-white/10">
                  <div className="text-4xl animate-pulse">🔊</div>
                  <div className="text-white font-semibold text-lg">Playing Message</div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-coral rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span
                      className="w-2 h-2 bg-coral rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-coral rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <BoundaryOverlay
              leftPct={leftPct}
              rightPct={rightPct}
              onChange={(l, r) => {
                setLeftPct(l);
                setRightPct(r);
              }}
            />
            <CVMonitor
              externalVideoRef={videoRef}
              leftPct={leftPct}
              rightPct={rightPct}
              mirror={true}
              sendApi={isStreaming}
              showDebugHUD
              onAlertDebug={(a) => {
                console.log("[Broadcaster] CVMonitor alert received", a, { isStreaming });
                if (isStreaming) {
                  if (a.type === "ACTIVE") sendMonitorEvent("ACTIVE", a.details);
                  else if (a.type === "BOUNDARY") sendMonitorEvent("BOUNDARY", a.details);
                }
              }}
            />
          </div>
        )}
      </div>
    );
  }

  
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
              🔔 Notification sent: <strong>{lastEvent.reason}</strong> at {new Date(lastEvent.at).toLocaleTimeString()}
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
