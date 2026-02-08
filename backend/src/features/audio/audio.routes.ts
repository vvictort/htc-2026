import express from "express";
import {
  streamAudio,
  streamLullaby,
  getVoices,
  createCustomVoice,
  getCustomVoice,
  deleteCustomVoice,
  setVoice,
  updateAudioSettings,
} from "./audio.controller";
import { verifyFirebaseToken } from "../../shared/middleware/authMiddleware";

const router = express.Router();

// Protected routes - require authentication
router.post("/stream", verifyFirebaseToken, streamAudio);
router.post("/lullaby", verifyFirebaseToken, streamLullaby);
router.get("/voices", verifyFirebaseToken, getVoices);

// Custom voice management
router.post("/voice/clone", verifyFirebaseToken, createCustomVoice);
router.get("/voice/custom", verifyFirebaseToken, getCustomVoice);
router.delete("/voice/custom", verifyFirebaseToken, deleteCustomVoice);
router.put("/voice", verifyFirebaseToken, setVoice);
router.put("/settings", verifyFirebaseToken, updateAudioSettings);

export default router;
