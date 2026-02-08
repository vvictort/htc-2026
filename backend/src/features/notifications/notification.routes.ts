import express from "express";
import {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    getPreferences,
} from "./notification.controller";
import { verifyFirebaseToken } from "../../shared/middleware/authMiddleware";

const router = express.Router();

// All routes are protected
router.post("/", verifyFirebaseToken, createNotification);
router.get("/", verifyFirebaseToken, getNotifications);
router.put("/read-all", verifyFirebaseToken, markAllAsRead);
router.put("/:id/read", verifyFirebaseToken, markAsRead);
router.get("/preferences", verifyFirebaseToken, getPreferences);
router.put("/preferences", verifyFirebaseToken, updatePreferences);

export default router;
