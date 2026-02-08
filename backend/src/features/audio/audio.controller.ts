import { Request, Response } from 'express';

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

        // Use default voice if not provided
        const voice = voiceId || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

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
