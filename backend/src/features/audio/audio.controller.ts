import { Request, Response } from "express";
import User from "../../shared/models/User";
import formidable from "formidable";
import fs from "fs";

interface TextToSpeechRequest {
  text: string;
  voiceId?: string;
  babyDeviceId: string;
}

type LullabyVibe = "lullaby" | "classic" | "nature" | "cosmic" | "ocean" | "rainy";
type LullabyLength = "short" | "medium" | "long";

interface LullabyRequest {
  babyName?: string;
  babyDeviceId: string;
  vibe?: LullabyVibe;
  length?: LullabyLength;
}

// Music generation prompts for each vibe — to help baby sleep
const MUSIC_PROMPTS: Record<LullabyVibe, { prompt: string; instrumental: boolean }> = {
  lullaby: {
    prompt:
      "A tender, warm female voice softly singing a gentle lullaby to a baby. " +
      "Sweet humming and soft 'la la la' melodies layered over a delicate music box, " +
      "light acoustic guitar fingerpicking and warm piano chords. Very slow tempo, " +
      "breathy and intimate vocals like a mother singing her baby to sleep. " +
      "Nursery lullaby, deeply soothing, minimal instrumentation.",
    instrumental: false,
  },
  classic: {
    prompt:
      "A very gentle, slow, soft instrumental lullaby with a soothing music box melody, soft humming, " +
      "delicate piano arpeggios and warm pad synths. Calm, peaceful, dreamy nursery atmosphere. " +
      "No vocals, no drums, no percussion. Perfect for helping a baby fall asleep.",
    instrumental: true,
  },
  nature: {
    prompt:
      "A calming ambient soundscape for a baby to fall asleep: gentle birdsong fading into soft crickets, " +
      "a quiet flowing stream in the background, light breeze through leaves, layered with a barely-there " +
      "celeste melody humming a lullaby. Ultra-soothing, natural, no drums, no vocals.",
    instrumental: true,
  },
  cosmic: {
    prompt:
      "A dreamy, ethereal ambient lullaby with soft synthesizer pads, twinkling chimes like distant stars, " +
      "warm low drone tones like floating through space, gentle rising and falling arpeggios. " +
      "Slow, weightless, deeply relaxing. No vocals, no beats. For a baby drifting to sleep.",
    instrumental: true,
  },
  ocean: {
    prompt:
      "Soft ocean waves gently lapping on shore, combined with a warm, slow acoustic guitar lullaby " +
      "and light harp glissandos. Distant seagulls fading away. Peaceful, sleepy, waterfront nursery vibes. " +
      "No drums, no vocals, purely instrumental and calming.",
    instrumental: true,
  },
  rainy: {
    prompt:
      "Gentle rain falling on a window pane with soft thunder rumbling far away, mixed with a slow " +
      "solo piano lullaby in a minor key, warm and cozy atmosphere. Lo-fi warmth, " +
      "no percussion, no vocals. Deeply relaxing for a baby to fall asleep.",
    instrumental: true,
  },
};

const DURATION_MS: Record<LullabyLength, number> = {
  short: 30000,    // 30 seconds
  medium: 60000,   // 1 minute
  long: 120000,    // 2 minutes
};

const streamFromElevenLabs = async ({
  text,
  voice,
  elevenLabsApiKey,
}: {
  text: string;
  voice: string;
  elevenLabsApiKey: string;
}): Promise<{ buffer: Buffer; status: number; error?: string }> => {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": elevenLabsApiKey,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    return { buffer: Buffer.alloc(0), status: response.status, error: errorData };
  }

  const audioBuffer = await response.arrayBuffer();
  return { buffer: Buffer.from(audioBuffer), status: 200 };
};

// Generate and stream audio directly (no storage)
export const streamAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("[streamAudio] Raw request body:", JSON.stringify(req.body));
    const { text, voiceId, babyDeviceId } = req.body as TextToSpeechRequest;

    console.log("[streamAudio] Received request:", { 
      text: text?.substring(0, 50), 
      hasVoiceId: !!voiceId,
      babyDeviceId,
      hasText: !!text,
      hasBabyDeviceId: !!babyDeviceId,
      textLength: text?.length,
      textType: typeof text,
      babyDeviceIdType: typeof babyDeviceId,
      userId: req.user?.uid
    });

    // Validate input - check for both falsy and empty strings
    if (!text || text.trim() === "" || !babyDeviceId || babyDeviceId.trim() === "") {
      console.error("[streamAudio] Validation failed:", { 
        text: text, 
        babyDeviceId: babyDeviceId,
        textTrimmed: text?.trim(),
        babyDeviceIdTrimmed: babyDeviceId?.trim()
      });
      res.status(400).json({ 
        error: "Text and babyDeviceId are required",
        received: {
          text: !!text,
          babyDeviceId: !!babyDeviceId
        }
      });
      return;
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsApiKey) {
      res.status(500).json({ error: "ElevenLabs API key not configured" });
      return;
    }

    // Get user's custom voice if available
    let voice = voiceId;

    if (!voice && req.user?.uid) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (user?.customVoiceId && user.enableCustomVoice !== false) {
        voice = user.customVoiceId;
        console.log(`🎤 Using custom voice for user ${req.user.email}`);
      } else if (user?.customVoiceId && user.enableCustomVoice === false) {
        console.log(`⚠️ Custom voice disabled by user ${req.user.email}, using default`);
      }
    }
    // Fallback to default voice
    voice = voice || process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";

    console.log(`🎵 Streaming audio for device ${babyDeviceId}: "${text}"`);

    const { buffer, status, error } = await streamFromElevenLabs({
      text,
      voice,
      elevenLabsApiKey,
    });

    if (error) {
      console.error("❌ ElevenLabs API error:", error);
      res.status(status).json({
        error: "Failed to generate audio",
        status,
        details: error,
      });
      return;
    }

    console.log(`✓ Audio generated (${buffer.length} bytes) - streaming to client`);

    // Set headers for audio streaming
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="message-${Date.now()}.mp3"`);
    res.setHeader("X-Baby-Device-Id", babyDeviceId);

    // Send audio buffer
    res.send(buffer);

    // Async logging after response (fire and forget pattern for performance?)
    // Or await it.
    if (req.user?.uid) {
      // We need 'User' model which is already imported.
      User.findOne({ firebaseUid: req.user.uid })
        .then(async (user) => {
          if (user) {
            // Dynamically import AudioLog or use if available
            const AudioLog = (await import("../../shared/models/AudioLog")).default;

            await AudioLog.create({
              userId: user._id,
              babyDeviceId,
              text: text.substring(0, 1000), // Cap length
              voiceId: voice,
              characterCount: text.length,
              status: "success",
            });
            console.log(`📝 Audio log saved for user ${user.email}`);
          }
        })
        .catch((err) => console.error("Error saving audio log:", err));
    }
  } catch (error: any) {
    console.error("❌ Stream audio error:", error);

    // Log failure
    if (req.user?.uid) {
      User.findOne({ firebaseUid: req.user.uid })
        .then(async (user) => {
          if (user) {
            const AudioLog = (await import("../../shared/models/AudioLog")).default;
            await AudioLog.create({
              userId: user._id,
              babyDeviceId: req.body.babyDeviceId || "unknown",
              text: (req.body.text || "").substring(0, 1000),
              voiceId: "unknown",
              characterCount: (req.body.text || "").length,
              status: "failed",
            });
          }
        })
        .catch(() => { });
    }

    res.status(500).json({
      error: "Failed to stream audio",
      details: error.message,
    });
  }
};

// Generate a soothing lullaby using ElevenLabs Music Generation API
export const streamLullaby = async (req: Request, res: Response): Promise<void> => {
  try {
    const { babyDeviceId, vibe, length } = req.body as LullabyRequest;

    if (!babyDeviceId) {
      res.status(400).json({ error: "babyDeviceId is required" });
      return;
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      res.status(500).json({ error: "ElevenLabs API key not configured" });
      return;
    }

    const allowedVibes: LullabyVibe[] = ["lullaby", "classic", "nature", "cosmic", "ocean", "rainy"];
    const allowedLengths: LullabyLength[] = ["short", "medium", "long"];

    const resolvedVibe: LullabyVibe = allowedVibes.includes(vibe as LullabyVibe)
      ? (vibe as LullabyVibe)
      : "classic";
    const resolvedLength: LullabyLength = allowedLengths.includes(length as LullabyLength)
      ? (length as LullabyLength)
      : "medium";

    const { prompt, instrumental } = MUSIC_PROMPTS[resolvedVibe];
    const durationMs = DURATION_MS[resolvedLength];

    console.log(`🎶 Generating ${resolvedVibe} lullaby (${resolvedLength}, instrumental=${instrumental}) for device ${babyDeviceId}`);

    const response = await fetch("https://api.elevenlabs.io/v1/music", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsApiKey,
      },
      body: JSON.stringify({
        prompt,
        music_length_ms: durationMs,
        model_id: "music_v1",
        force_instrumental: instrumental,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ ElevenLabs Music Gen error:", errorData);
      res.status(response.status).json({ error: "Failed to generate lullaby", details: errorData });
      return;
    }

    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);

    console.log(`✓ Lullaby generated (${buffer.length} bytes)`);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="lullaby-${Date.now()}.mp3"`);
    res.setHeader("X-Baby-Device-Id", babyDeviceId);
    res.send(buffer);
  } catch (error: any) {
    console.error("❌ Stream lullaby error:", error);
    res.status(500).json({ error: "Failed to stream lullaby", details: error.message });
  }
};

// Get available voices from ElevenLabs
export const getVoices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsApiKey) {
      res.status(500).json({ error: "ElevenLabs API key not configured" });
      return;
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": elevenLabsApiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      res.status(response.status).json({
        error: "Failed to fetch voices",
        details: errorData,
      });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    console.error("❌ Get voices error:", error);
    res.status(500).json({
      error: "Failed to fetch voices",
      details: error.message,
    });
  }
};

// Create custom voice from audio samples (voice cloning)
export const createCustomVoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsApiKey) {
      res.status(500).json({ error: "ElevenLabs API key not configured" });
      return;
    }

    if (!req.user?.uid) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("❌ Form parse error:", err);
        res.status(400).json({ error: "Failed to parse form data", details: err.message });
        return;
      }

      const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
      const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;

      if (!name) {
        res.status(400).json({ error: "Voice name is required" });
        return;
      }

      if (!files.samples) {
        res.status(400).json({ error: "At least one audio sample is required" });
        return;
      }

      try {
        // Prepare FormData for ElevenLabs API
        const formData = new FormData();
        formData.append("name", name);
        if (description) {
          formData.append("description", description);
        }

        // Add audio files
        const samples = Array.isArray(files.samples) ? files.samples : [files.samples];

        for (const sample of samples) {
          const fileBuffer = fs.readFileSync(sample.filepath);
          const blob = new Blob([fileBuffer], { type: sample.mimetype || "audio/mpeg" });
          formData.append("files", blob, sample.originalFilename || "sample.mp3");
        }

        console.log(`🎤 Creating custom voice "${name}" for user ${req.user!.email}`);

        // Call ElevenLabs voice cloning API
        const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsApiKey,
          },
          body: formData,
        });

        // Clean up temp files
        for (const sample of samples) {
          fs.unlinkSync(sample.filepath);
        }

        if (!response.ok) {
          const errorData = await response.text();
          console.error("❌ ElevenLabs voice creation error:", errorData);
          res.status(response.status).json({
            error: "Failed to create custom voice",
            details: errorData,
          });
          return;
        }

        const voiceData: any = await response.json();
        const voiceId = voiceData.voice_id;

        // Save voice ID to user's database record
        const user = await User.findOneAndUpdate(
          { firebaseUid: req.user!.uid },
          { customVoiceId: voiceId },
          { new: true },
        );

        console.log(`✓ Custom voice created: ${voiceId}`);

        res.status(201).json({
          message: "Custom voice created successfully",
          voiceId: voiceId,
          voiceName: name,
          user: {
            id: user?._id,
            email: user?.email,
            customVoiceId: user?.customVoiceId,
          },
        });
      } catch (apiError: any) {
        console.error("❌ Voice creation API error:", apiError);
        res.status(500).json({
          error: "Failed to create custom voice",
          details: apiError.message,
        });
      }
    });
  } catch (error: any) {
    console.error("❌ Create custom voice error:", error);
    res.status(500).json({
      error: "Failed to create custom voice",
      details: error.message,
    });
  }
};

// Get user's custom voice details
export const getCustomVoice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user?.customVoiceId) {
      res.status(404).json({ error: "No custom voice found for this user" });
      return;
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsApiKey) {
      res.status(500).json({ error: "ElevenLabs API key not configured" });
      return;
    }

    // Get voice details from ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${user.customVoiceId}`, {
      headers: {
        "xi-api-key": elevenLabsApiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      res.status(response.status).json({
        error: "Failed to fetch voice details",
        details: errorData,
      });
      return;
    }

    const voiceData = await response.json();
    res.status(200).json({ ...(voiceData as any), enableCustomVoice: user.enableCustomVoice });
  } catch (error: any) {
    console.error("❌ Get custom voice error:", error);
    res.status(500).json({
      error: "Failed to get custom voice",
      details: error.message,
    });
  }
};

// Delete user's custom voice
export const deleteCustomVoice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user?.customVoiceId) {
      res.status(404).json({ error: "No custom voice found for this user" });
      return;
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsApiKey) {
      res.status(500).json({ error: "ElevenLabs API key not configured" });
      return;
    }

    console.log(`🗑️ Deleting custom voice ${user.customVoiceId} for user ${req.user.email}`);

    // Delete voice from ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${user.customVoiceId}`, {
      method: "DELETE",
      headers: {
        "xi-api-key": elevenLabsApiKey,
      },
    });

    if (!response.ok && response.status !== 404) {
      const errorData = await response.text();
      console.error("❌ ElevenLabs voice deletion error:", errorData);
      res.status(response.status).json({
        error: "Failed to delete custom voice",
        details: errorData,
      });
      return;
    }

    // Remove voice ID from user's database record
    await User.findOneAndUpdate({ firebaseUid: req.user.uid }, { $unset: { customVoiceId: "" } });

    console.log(`✓ Custom voice deleted`);

    res.status(200).json({
      message: "Custom voice deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Delete custom voice error:", error);
    res.status(500).json({
      error: "Failed to delete custom voice",
      details: error.message,
    });
  }
};
export const setVoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { voiceId } = req.body;

    if (!voiceId) {
      res.status(400).json({ error: "Voice ID is required" });
      return;
    }

    if (!req.user?.uid) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const user = await User.findOneAndUpdate({ firebaseUid: req.user.uid }, { customVoiceId: voiceId }, { new: true });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    console.log(`✓ Voice updated for user ${req.user.email}: ${voiceId}`);

    res.status(200).json({
      message: "Voice updated successfully",
      voiceId: user.customVoiceId,
    });
  } catch (error: any) {
    console.error("❌ Set voice error:", error);
    res.status(500).json({
      error: "Failed to update voice",
      details: error.message,
    });
  }
};

export const updateAudioSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { enableCustomVoice } = req.body;

    if (typeof enableCustomVoice !== "boolean") {
      res.status(400).json({ error: "enableCustomVoice must be a boolean" });
      return;
    }

    if (!req.user?.uid) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const user = await User.findOneAndUpdate({ firebaseUid: req.user.uid }, { enableCustomVoice }, { new: true });

    console.log(`✓ Audio settings updated for user ${req.user.email}: enableCustomVoice=${enableCustomVoice}`);

    res.status(200).json({
      message: "Audio settings updated",
      user: {
        enableCustomVoice: user?.enableCustomVoice,
      },
    });
  } catch (error: any) {
    console.error("❌ Update audio settings error:", error);
    res.status(500).json({
      error: "Failed to update audio settings",
      details: error.message,
    });
  }
};
