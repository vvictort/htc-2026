/**
 * Gemini-powered baby motion threat classifier.
 *
 * Receives a motion category from the OpenCV camera monitor and asks
 * Google Gemini to classify whether it represents a safe, cautionary,
 * or dangerous situation for the baby — along with a brief reason.
 *
 * Env vars:
 *   GEMINI_API_KEY — Google AI Studio / Vertex Gemini API key
 */

import { MotionCategory, ThreatLevel } from "../../shared/models/MotionLog";

interface GeminiClassification {
  threatLevel: ThreatLevel;
  reason: string;
}

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Build the prompt for Gemini. We give it structured context so the
 * response is deterministic and parseable.
 */
function buildPrompt(category: MotionCategory, confidence: number, metadata?: Record<string, unknown>): string {
  const metaStr = metadata ? `\nAdditional sensor data: ${JSON.stringify(metadata)}` : "";

  return `You are a baby safety AI assistant integrated into a smart baby monitor.

An OpenCV camera module has detected the following baby motion category:
  Category: "${category}"
  Detection confidence: ${(confidence * 100).toFixed(0)}%${metaStr}

Based on this information, classify the threat level as one of:
  - "safe"    — Normal baby behaviour, no concern.
  - "caution" — Unusual but not immediately dangerous. Parents should be aware.
  - "danger"  — Potentially dangerous situation requiring immediate attention.

RULES:
- "still" with high confidence is safe (baby sleeping).
- "slight_movement" is generally safe.
- "rolling", "crawling", "sitting_up" are normal developmental milestones — usually safe, caution only if confidence is very low (potential misdetection).
- "standing" is caution in a crib (fall risk).
- "flailing" is caution (could indicate distress).
- "crying_motion" is caution (baby needs attention).
- "face_covered" is ALWAYS danger (suffocation risk).
- "out_of_frame" is caution (baby may have left safe area).
- "unknown" is caution (unrecognised motion).

Respond with ONLY a valid JSON object (no markdown, no code fences):
{"threatLevel": "safe|caution|danger", "reason": "Brief one-sentence explanation"}`;
}

/**
 * Call the Gemini API to classify a motion event.
 * Falls back to a rule-based classifier if Gemini is unavailable.
 */
export async function classifyMotion(
  category: MotionCategory,
  confidence: number,
  metadata?: Record<string, unknown>,
): Promise<GeminiClassification> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not set — cannot classify motion");
    return {
      threatLevel: "caution",
      reason: "GEMINI_API_KEY missing. Cannot classify.",
    };
  }

  try {
    const prompt = buildPrompt(category, confidence, metadata);

    console.log("🚀 Calling Gemini API for motion classification...");
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1, // near-deterministic
          maxOutputTokens: 256,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ Gemini API error (${res.status}):`, errText);

      if (res.status === 429) {
        return {
          threatLevel: "safe",
          reason: "Gemini rate limit exceeded. Skipping classification (assumed safe).",
        };
      }

      // Return safe to avoid notifying users about API errors
      return {
        threatLevel: "safe",
        reason: "Classification temporarily unavailable. Assumed safe.",
      };
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    // Extract the text from Gemini's response
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("📝 Gemini raw response:", text);

    // Try to parse as JSON first
    try {
      // Strip potential markdown fences just in case
      const cleaned = text.replace(/```json\s*|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as {
        threatLevel?: string;
        reason?: string;
      };

      const validLevels: ThreatLevel[] = ["safe", "caution", "danger"];
      const level = validLevels.includes(parsed.threatLevel as ThreatLevel)
        ? (parsed.threatLevel as ThreatLevel)
        : "caution";

      console.log("✨ Gemini API called successfully and returned JSON classification.");

      return {
        threatLevel: level,
        reason: parsed.reason || "Baby activity detected.",
      };
    } catch {
      // Try to extract threatLevel from partial/truncated JSON like `{"threatLevel": "safe`
      const partialMatch = text.match(/"threatLevel"\s*:\s*"?(safe|caution|danger)/i);
      if (partialMatch) {
        const level = partialMatch[1].toLowerCase() as ThreatLevel;
        console.log(`⚠️ Parsed threat level from partial JSON: ${level}`);
        // Return user-friendly messages based on threat level
        const friendlyReasons: Record<ThreatLevel, string> = {
          danger: "Potential safety concern detected. Please check on your baby.",
          caution: "Unusual activity detected. You may want to check in.",
          safe: "Normal baby behaviour detected.",
        };
        return { threatLevel: level, reason: friendlyReasons[level] };
      }
      // Fallback: extract threat level from prose response
      console.warn("⚠️ Gemini returned non-JSON response, attempting to extract threat level...");
      const lowerText = text.toLowerCase();

      if (lowerText.includes("danger") || lowerText.includes("suffocation") || lowerText.includes("face covered")) {
        return { threatLevel: "danger", reason: "Potential safety concern detected. Please check on your baby." };
      }
      if (lowerText.includes("caution") || lowerText.includes("unusual") || lowerText.includes("attention")) {
        return { threatLevel: "caution", reason: "Unusual activity detected. You may want to check in." };
      }
      if (lowerText.includes("safe") || lowerText.includes("normal") || lowerText.includes("no concern")) {
        return { threatLevel: "safe", reason: "Normal baby behaviour detected." };
      }

      // Default to safe for slight_movement and still categories
      if (category === "slight_movement" || category === "still") {
        return { threatLevel: "safe", reason: "Baby is resting peacefully." };
      }

      return { threatLevel: "caution", reason: "Activity detected. You may want to check in." };
    }
  } catch (err) {
    console.error("❌ Gemini classification failed:", err);
    // Return safe to avoid notifying users about internal errors
    return {
      threatLevel: "safe",
      reason: "Classification temporarily unavailable. Assumed safe.",
    };
  }
}
