import { useState, useRef } from "react";

interface VoiceRecorderProps {
  onComplete: (blob: Blob) => void;
}

export default function VoiceRecorder({ onComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setRecordedBlob(blob);
          onComplete(blob);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access denied or not available.");
      }
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-warm-white rounded-xl border border-warm-cream text-center">
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
          isRecording ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/30" : "bg-coral shadow-lg shadow-coral/30"
        }`}>
        <button
          onClick={toggleRecording}
          disabled={!!recordedBlob && !isRecording}
          className="text-4xl text-white outline-none w-full h-full rounded-full flex items-center justify-center">
          {isRecording ? "⏹" : recordedBlob ? "✅" : "🎙️"}
        </button>
      </div>

      <h3 className="text-lg font-bold text-charcoal mb-2">
        {isRecording ? "Recording..." : recordedBlob ? "Recording Complete!" : "Tap to Record"}
      </h3>

      <p className="text-sm text-mid-gray max-w-xs transition-opacity duration-300 opacity-80">
        {isRecording
          ? 'Read out loud: "Hey little one, I\'m right here with you. Sweet dreams."'
          : recordedBlob
            ? "Great job! We've captured your voice sample."
            : "Make sure you're in a quiet room."}
      </p>

      {recordedBlob && (
        <button onClick={resetRecording} className="mt-4 text-sm text-coral hover:underline">
          Record Again
        </button>
      )}
    </div>
  );
}
