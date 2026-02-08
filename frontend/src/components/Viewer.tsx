import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = "http://localhost:5000";

interface ViewerProps {
  roomId: string;
}

export default function Viewer({ roomId }: ViewerProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [error, setError] = useState<string | null>(null);
  const [waitingForBroadcaster, setWaitingForBroadcaster] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const broadcasterIdRef = useRef<string | null>(null);

  const createPeerConnection = (): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && broadcasterIdRef.current) {
        socketRef.current?.emit("ice-candidate", broadcasterIdRef.current, event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      console.log("Received remote track");
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
        setIsConnected(true);
        setError(null);
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.connectionState);
      setConnectionState(peerConnection.connectionState);

      if (peerConnection.connectionState === "connected") {
        setIsConnected(true);
        setError(null);
      } else if (peerConnection.connectionState === "disconnected" || peerConnection.connectionState === "failed") {
        setError("Connection lost");
        setIsConnected(false);
      }
    };

    return peerConnection;
  };
  useEffect(() => {
    console.log("Viewer component mounted for room:", roomId);
    socketRef.current = io(BACKEND_URL);

    socketRef.current.on("connect", () => {
      console.log("Viewer connected to signaling server with ID:", socketRef.current?.id);
      socketRef.current?.emit("join-room", roomId);
      socketRef.current?.emit("viewer", roomId);
    });

    socketRef.current.on("broadcaster-exists", (broadcasterId: string) => {
      console.log("Broadcaster exists:", broadcasterId);
      broadcasterIdRef.current = broadcasterId;
      setWaitingForBroadcaster(false);
      // Broadcaster will send offer to us automatically
    });

    socketRef.current.on("broadcaster-ready", async (broadcasterId: string) => {
      console.log("Broadcaster ready (came online):", broadcasterId);
      broadcasterIdRef.current = broadcasterId;
      setWaitingForBroadcaster(false);

      // Automatically start connection when broadcaster comes online
      // Close existing connection if any
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      // The broadcaster will now send us an offer since we're already in the room
      setError(null);
    });

    socketRef.current.on("offer", async (broadcasterId: string, offer: RTCSessionDescriptionInit) => {
      console.log("Received offer from broadcaster:", broadcasterId);
      broadcasterIdRef.current = broadcasterId;

      const peerConnection = createPeerConnection();
      peerConnectionRef.current = peerConnection;

      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socketRef.current?.emit("answer", broadcasterId, answer);
    });

    socketRef.current.on("ice-candidate", (_broadcasterId: string, candidate: RTCIceCandidateInit) => {
      console.log("Received ICE candidate from broadcaster");
      if (peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socketRef.current.on("broadcaster-disconnected", () => {
      console.log("Broadcaster disconnected");
      setError("Broadcaster has disconnected");
      setIsConnected(false);
      setWaitingForBroadcaster(true);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    });

    // Cleanup function - called when component unmounts or roomId changes
    return () => {
      console.log("Viewer component unmounting - cleaning up for room:", roomId);

      // Close peer connection
      if (peerConnectionRef.current) {
        console.log("Closing peer connection");
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
        // Stop video
        const videoElement = videoRef.current;
        if (videoElement) {
          videoElement.srcObject = null;
        }
      }

      // Disconnect socket - this will trigger server-side cleanup
      if (socketRef.current) {
        console.log("Disconnecting viewer socket:", socketRef.current.id);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId]);

  const getConnectionStateColor = () => {
    switch (connectionState) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      case "failed":
        return "text-red-500";
      case "disconnected":
        return "text-red-500";
      default:
        return "text-gray-300";
    }
  };

  const getConnectionStateIcon = () => {
    switch (connectionState) {
      case "connected":
        return "🟢";
      case "connecting":
        return "🟡";
      case "failed":
        return "🔴";
      case "disconnected":
        return "🔴";
      default:
        return "⚪";
    }
  };
  return (
    <div className="flex flex-col gap-4 p-6 max-w-4xl w-full">
      <div className="bg-gray-800 rounded-xl shadow-2xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <i className="fa-solid fa-eye"></i>
            Viewer - Room: {roomId}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Connection Status</div>
              <div className={`text-lg font-semibold ${getConnectionStateColor()}`}>
                {getConnectionStateIcon()} {connectionState}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Stream Status</div>
              <div className="text-lg font-semibold">
                {isConnected ? (
                  <span className="text-green-500">Receiving</span>
                ) : (
                  <span className="text-gray-300">Waiting...</span>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-4 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-yellow-400"></i>
              <span className="text-yellow-200">{error}</span>
            </div>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "16/9" }}>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mb-4"></div>
                  <p>Waiting for broadcaster...</p>
                </div>
              </div>
            )}
          </div>

          {!isConnected && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 flex items-start gap-3">
              <i className="fa-solid fa-circle-info text-blue-400 mt-1"></i>
              <span className="text-gray-300">
                {waitingForBroadcaster ? (
                  <>
                    Waiting for broadcaster to start in room <strong className="text-white">{roomId}</strong>. Will
                    auto-connect when live!
                  </>
                ) : (
                  <>
                    Connecting to broadcaster in room <strong className="text-white">{roomId}</strong>...
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Talk to Baby (TTS) Section */}
      <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <i className="fa-solid fa-comment-dots text-coral"></i>
            Talk to Baby
          </h3>

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Type a message to say..."
              className="flex-1 px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // Handle send logic
                  console.log("Sending TTS:", e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
            <button
              className="px-6 py-3 rounded-xl bg-coral hover:bg-coral-dark text-white font-bold transition-colors flex items-center gap-2"
              onClick={() => {
                // Handle send logic
                console.log("Sending TTS");
              }}>
              <span>Speak</span>
              <i className="fa-solid fa-volume-high"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
