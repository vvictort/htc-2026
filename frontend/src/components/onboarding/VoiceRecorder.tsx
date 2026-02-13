import { useState, useRef } from "react";

interface VoiceSample {
  id: string;
  blob: Blob;
  type: "mic" | "upload";
  name: string;
}

interface VoiceRecorderProps {
  onSamplesChange: (samples: Blob[]) => void;
}

export default function VoiceRecorder({ onSamplesChange }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [samples, setSamples] = useState<VoiceSample[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const newSample: VoiceSample = {
            id: Date.now().toString(),
            blob,
            type: "mic",
            name: `Recording ${samples.length + 1}`,
          };
          const newSamples = [...samples, newSample];
          setSamples(newSamples);
          onSamplesChange(newSamples.map((s) => s.blob));

          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Could not access microphone.");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newSample: VoiceSample = {
        id: Date.now().toString(),
        blob: file,
        type: "upload",
        name: file.name,
      };
      const newSamples = [...samples, newSample];
      setSamples(newSamples);
      onSamplesChange(newSamples.map((s) => s.blob));
    }
  };

  const removeSample = (id: string) => {
    const newSamples = samples.filter((s) => s.id !== id);
    setSamples(newSamples);
    onSamplesChange(newSamples.map((s) => s.blob));
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-warm-white rounded-xl border-2 border-dashed border-warm-cream">
      {samples.length > 0 && (
        <div className="w-full max-w-md space-y-2 mb-4">
          <h4 className="text-sm font-bold text-charcoal mb-2">Your Voice Samples:</h4>
          {samples.map((sample) => (
            <div
              key={sample.id}
              className="flex items-center justify-between bg-white p-3 rounded-lg border border-warm-cream shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xl">{sample.type === "mic" ? "🎤" : "📁"}</span>
                <span className="text-sm font-medium text-charcoal truncate max-w-[150px]">{sample.name}</span>
                <audio src={URL.createObjectURL(sample.blob)} controls className="h-6 w-24" />
              </div>
              <button
                onClick={() => removeSample(sample.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-4">
        <button
          onClick={toggleRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
            isRecording ? "bg-red-500 animate-pulse scale-105" : "bg-coral hover:bg-coral-dark hover:scale-105"
          }`}>
          <span className="text-h1 text-white">{isRecording ? "⬛" : "🎤"}</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-20 h-20 rounded-full flex items-center justify-center bg-white border-2 border-warm-cream hover:border-coral shadow-lg transition-all hover:scale-105"
          title="Upload Audio File">
          <span className="text-h2 text-mid-gray">📁</span>
        </button>
        <input type="file" accept="audio/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
      </div>

      <p className="text-center text-charcoal font-medium">
        {isRecording ? "Recording... Tap to stop" : "Tap Start to record or Upload a file"}
      </p>
    </div>
  );
}
