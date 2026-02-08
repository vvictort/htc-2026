import express from 'express';
import { streamAudio, getVoices } from './audio.controller';
import { verifyFirebaseToken } from '../../shared/middleware/authMiddleware';

const router = express.Router();

// Protected routes - require authentication
router.post('/stream', verifyFirebaseToken, streamAudio);
router.get('/voices', verifyFirebaseToken, getVoices);

export default router;
