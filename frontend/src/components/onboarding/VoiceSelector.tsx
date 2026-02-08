import { useState } from "react";

interface VoiceSelectorProps {
  onSelect: (voiceId: string) => void;
}

const presetVoices = [
  { id: "voice1", name: "Gentle Haze", gender: "Female", emoji: "👩" },
  { id: "voice2", name: "Calm Ocean", gender: "Male", emoji: "👨" },
  { id: "voice3", name: "Soft Cloud", gender: "Female", emoji: "👵" },
  { id: "voice4", name: "Storyteller", gender: "Male", emoji: "👴" },
];

export default function VoiceSelector({ onSelect }: VoiceSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelect(id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {presetVoices.map((voice) => (
        <button
          key={voice.id}
          onClick={() => handleSelect(voice.id)}
          className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
            selectedId === voice.id
              ? "border-coral bg-coral/5 shadow-md"
              : "border-warm-cream hover:border-coral/50 hover:bg-white"
          }`}>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-warm-cream">
            {voice.emoji}
          </div>
          <div className="text-left flex-1">
            <h4 className="font-bold text-charcoal">{voice.name}</h4>
            <span className="text-xs text-mid-gray bg-warm-white px-2 py-0.5 rounded-full border border-warm-cream">
              {voice.gender}
            </span>
          </div>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selectedId === voice.id ? "border-coral bg-coral" : "border-mid-gray/30"
            }`}>
            {selectedId === voice.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
          </div>
        </button>
      ))}

      {/* Audio Element Placeholder - would be hidden and controlled by JS in real implementation */}
    </div>
  );
}
