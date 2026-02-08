import express from "express";
import {
    logMotionEvent,
    getMotionLogs,
    getCategories,
} from "./motion.controller";
import { verifyFirebaseToken } from "../../shared/middleware/authMiddleware";

const router = express.Router();

// POST   /api/motion              — Log a motion event (from OpenCV camera)
router.post("/", verifyFirebaseToken, logMotionEvent);

// GET    /api/motion              — List motion logs (paginated, filterable)
router.get("/", verifyFirebaseToken, getMotionLogs);

// GET    /api/motion/categories   — List valid motion categories (public reference)
router.get("/categories", getCategories);

export default router;
