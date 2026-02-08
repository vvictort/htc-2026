import { useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { getAuthToken } from "../../utils/api";

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels: {
    accent?: string;
    description?: string;
    age?: string;
    gender?: string;
    use_case?: string;
  };
}

interface VoiceSelectorProps {
  onSelect: (voiceId: string) => void;
}

export default function VoiceSelector({ onSelect }: VoiceSelectorProps) {
  const { token, loading: authLoading } = useAuth();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const fetchVoices = async () => {
      try {
        const authToken = token || getAuthToken();
        if (!authToken) {
          setError("Please log in to view voices");
          setLoading(false);
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiUrl}/audio/voices`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Failed to fetch voices: ${res.status} ${errText}`);
        }
        const data = await res.json();
        setVoices(data.voices || []);
        setError(null);
      } catch (err) {
        console.error("VoiceSelector: Error fetching voices", err);
        setError("Could not load voices. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchVoices();
  }, [token, authLoading]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelect(id);
  };

  if (loading)
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
      </div>
    );

  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  if (voices.length === 0) {
    return (
      <div className="text-center p-8 text-mid-gray">
        <p className="text-lg mb-2">🎤</p>
        <p>No voices available. Please check your ElevenLabs API configuration.</p>
      </div>
    );
  }

  const categories = Array.from(new Set(voices.map((v) => v.category))).sort();

  return (
    <div className="space-y-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {categories.map((category) => {
        const categoryVoices = voices.filter((v) => v.category === category);
        if (categoryVoices.length === 0) return null;

        return (
          <div key={category}>
            <h4 className="capitalize font-bold text-mid-gray mb-3 text-sm sticky top-0 bg-white py-2 z-10">
              {category} Voices
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryVoices.map((voice) => (
                <button
                  key={voice.voice_id}
                  onClick={() => handleSelect(voice.voice_id)}
                  className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all text-left ${selectedId === voice.voice_id
                      ? "border-coral bg-coral/5 shadow-md"
                      : "border-warm-cream hover:border-coral/50 hover:bg-white"
                    }`}>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border border-warm-cream shrink-0">
                    {voice.labels?.gender === "female" ? "👩" : "👨"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-charcoal truncate">{voice.name}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {voice.labels?.accent && (
                        <span className="text-[10px] text-mid-gray bg-warm-white px-1.5 py-0.5 rounded border border-warm-cream">
                          {voice.labels.accent}
                        </span>
                      )}
                      {voice.labels?.age && (
                        <span className="text-[10px] text-mid-gray bg-warm-white px-1.5 py-0.5 rounded border border-warm-cream">
                          {voice.labels.age}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedId === voice.voice_id ? "border-coral bg-coral" : "border-mid-gray/30"
                      }`}>
                    {selectedId === voice.voice_id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
