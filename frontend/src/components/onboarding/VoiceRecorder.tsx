import { useState } from "react";

interface VoiceRecorderProps {
  onComplete: (blob: Blob) => void;
}

export default function VoiceRecorder({ onComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    // Logic to start recording (MediaRecorder API) would go here
    // Simulating completion for UI demo
    setTimeout(() => {
      setIsRecording(false);
      setRecordedBlob(new Blob(["audio data"], { type: "audio/webm" }));
      onComplete(new Blob());
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-warm-white rounded-xl border border-warm-cream text-center">
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${isRecording ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/30" : "bg-coral shadow-lg shadow-coral/30"}`}>
        <button
          onClick={startRecording}
          disabled={isRecording || !!recordedBlob}
          className="text-4xl text-white outline-none">
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
        <button onClick={() => setRecordedBlob(null)} className="mt-4 text-sm text-coral hover:underline">
          Record Again
        </button>
      )}
    </div>
  );
}
