import { Request, Response } from 'express';
import User from '../../shared/models/User';
import formidable from 'formidable';
import fs from 'fs';

interface TextToSpeechRequest {
    text: string;
    voiceId?: string;
    babyDeviceId: string;
}

// Generate and stream audio directly (no storage)
export const streamAudio = async (req: Request, res: Response): Promise<void> => {
    try {
        const { text, voiceId, babyDeviceId } = req.body as TextToSpeechRequest;

        // Validate input
        if (!text || !babyDeviceId) {
            res.status(400).json({ error: 'Text and babyDeviceId are required' });
            return;
        }

        const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

        if (!elevenLabsApiKey) {
            res.status(500).json({ error: 'ElevenLabs API key not configured' });
            return;
        }

        // Get user's custom voice if available
        let voice = voiceId;

        if (!voice && req.user?.uid) {
            const user = await User.findOne({ firebaseUid: req.user.uid });
            if (user?.customVoiceId) {
                voice = user.customVoiceId;
                console.log(`🎤 Using custom voice for user ${req.user.email}`);
            }
        }

        // Fallback to default voice
        voice = voice || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

        console.log(`🎵 Streaming audio for device ${babyDeviceId}: "${text}"`);

        // Call ElevenLabs API
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': elevenLabsApiKey,
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_turbo_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ ElevenLabs API error:', errorData);

            res.status(response.status).json({
                error: 'Failed to generate audio',
                status: response.status,
                details: errorData,
            });
            return;
        }

        // Stream audio directly to client
        const audioBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(audioBuffer);

        console.log(`✓ Audio generated (${buffer.length} bytes) - streaming to client`);

        // Set headers for audio streaming
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Disposition', `attachment; filename="message-${Date.now()}.mp3"`);
        res.setHeader('X-Baby-Device-Id', babyDeviceId);

        // Send audio buffer
        res.send(buffer);
    } catch (error: any) {
        console.error('❌ Stream audio error:', error);
        res.status(500).json({
            error: 'Failed to stream audio',
            details: error.message
        });
    }
};

// Get available voices from ElevenLabs
export const getVoices = async (_req: Request, res: Response): Promise<void> => {
    try {
        const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

        if (!elevenLabsApiKey) {
            res.status(500).json({ error: 'ElevenLabs API key not configured' });
            return;
        }

        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: {
                'xi-api-key': elevenLabsApiKey,
            },
        });

        if (!response.ok) {
            const errorData = await response.text();
            res.status(response.status).json({
                error: 'Failed to fetch voices',
                details: errorData
            });
            return;
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error: any) {
        console.error('❌ Get voices error:', error);
        res.status(500).json({
            error: 'Failed to fetch voices',
            details: error.message
        });
    }
};

// Create custom voice from audio samples (voice cloning)
export const createCustomVoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

        if (!elevenLabsApiKey) {
            res.status(500).json({ error: 'ElevenLabs API key not configured' });
            return;
        }

        if (!req.user?.uid) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const form = formidable({ multiples: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error('❌ Form parse error:', err);
                res.status(400).json({ error: 'Failed to parse form data', details: err.message });
                return;
            }

            const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
            const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;

            if (!name) {
                res.status(400).json({ error: 'Voice name is required' });
                return;
            }

            if (!files.samples) {
                res.status(400).json({ error: 'At least one audio sample is required' });
                return;
            }

            try {
                // Prepare FormData for ElevenLabs API
                const formData = new FormData();
                formData.append('name', name);
                if (description) {
                    formData.append('description', description);
                }

                // Add audio files
                const samples = Array.isArray(files.samples) ? files.samples : [files.samples];

                for (const sample of samples) {
                    const fileBuffer = fs.readFileSync(sample.filepath);
                    const blob = new Blob([fileBuffer], { type: sample.mimetype || 'audio/mpeg' });
                    formData.append('files', blob, sample.originalFilename || 'sample.mp3');
                }

                console.log(`🎤 Creating custom voice "${name}" for user ${req.user!.email}`);

                // Call ElevenLabs voice cloning API
                const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
                    method: 'POST',
                    headers: {
                        'xi-api-key': elevenLabsApiKey,
                    },
                    body: formData,
                });

                // Clean up temp files
                for (const sample of samples) {
                    fs.unlinkSync(sample.filepath);
                }

                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('❌ ElevenLabs voice creation error:', errorData);
                    res.status(response.status).json({
                        error: 'Failed to create custom voice',
                        details: errorData
                    });
                    return;
                }

                const voiceData: any = await response.json();
                const voiceId = voiceData.voice_id;

                // Save voice ID to user's database record
                const user = await User.findOneAndUpdate(
                    { firebaseUid: req.user!.uid },
                    { customVoiceId: voiceId },
                    { new: true }
                );

                console.log(`✓ Custom voice created: ${voiceId}`);

                res.status(201).json({
                    message: 'Custom voice created successfully',
                    voiceId: voiceId,
                    voiceName: name,
                    user: {
                        id: user?._id,
                        email: user?.email,
                        customVoiceId: user?.customVoiceId
                    }
                });
            } catch (apiError: any) {
                console.error('❌ Voice creation API error:', apiError);
                res.status(500).json({
                    error: 'Failed to create custom voice',
                    details: apiError.message
                });
            }
        });
    } catch (error: any) {
        console.error('❌ Create custom voice error:', error);
        res.status(500).json({
            error: 'Failed to create custom voice',
            details: error.message
        });
    }
};

// Get user's custom voice details
export const getCustomVoice = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.uid) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const user = await User.findOne({ firebaseUid: req.user.uid });

        if (!user?.customVoiceId) {
            res.status(404).json({ error: 'No custom voice found for this user' });
            return;
        }

        const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

        if (!elevenLabsApiKey) {
            res.status(500).json({ error: 'ElevenLabs API key not configured' });
            return;
        }

        // Get voice details from ElevenLabs
        const response = await fetch(
            `https://api.elevenlabs.io/v1/voices/${user.customVoiceId}`,
            {
                headers: {
                    'xi-api-key': elevenLabsApiKey,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            res.status(response.status).json({
                error: 'Failed to fetch voice details',
                details: errorData
            });
            return;
        }

        const voiceData = await response.json();
        res.status(200).json(voiceData);
    } catch (error: any) {
        console.error('❌ Get custom voice error:', error);
        res.status(500).json({
            error: 'Failed to get custom voice',
            details: error.message
        });
    }
};

// Delete user's custom voice
export const deleteCustomVoice = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.uid) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const user = await User.findOne({ firebaseUid: req.user.uid });

        if (!user?.customVoiceId) {
            res.status(404).json({ error: 'No custom voice found for this user' });
            return;
        }

        const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

        if (!elevenLabsApiKey) {
            res.status(500).json({ error: 'ElevenLabs API key not configured' });
            return;
        }

        console.log(`🗑️ Deleting custom voice ${user.customVoiceId} for user ${req.user.email}`);

        // Delete voice from ElevenLabs
        const response = await fetch(
            `https://api.elevenlabs.io/v1/voices/${user.customVoiceId}`,
            {
                method: 'DELETE',
                headers: {
                    'xi-api-key': elevenLabsApiKey,
                },
            }
        );

        if (!response.ok && response.status !== 404) {
            const errorData = await response.text();
            console.error('❌ ElevenLabs voice deletion error:', errorData);
            res.status(response.status).json({
                error: 'Failed to delete custom voice',
                details: errorData
            });
            return;
        }

        // Remove voice ID from user's database record
        await User.findOneAndUpdate(
            { firebaseUid: req.user.uid },
            { $unset: { customVoiceId: '' } }
        );

        console.log(`✓ Custom voice deleted`);

        res.status(200).json({
            message: 'Custom voice deleted successfully'
        });
    } catch (error: any) {
        console.error('❌ Delete custom voice error:', error);
        res.status(500).json({
            error: 'Failed to delete custom voice',
            details: error.message
        });
    }
};
