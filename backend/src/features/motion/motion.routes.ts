import express from "express";
import {
    logMotionEvent,
    getMotionLogs,
    getCategories,
} from "./motion.controller";
import { verifyFirebaseToken } from "../../shared/middleware/authMiddleware";

const router = express.Router();

router.post("/", verifyFirebaseToken, logMotionEvent);

router.get("/", verifyFirebaseToken, getMotionLogs);

router.get("/categories", getCategories);

export default router;
