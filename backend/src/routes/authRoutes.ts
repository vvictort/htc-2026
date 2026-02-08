import express from 'express';
import { signUp, login, getCurrentUser } from '../controllers/authController';
import { verifyFirebaseToken } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/signup', signUp);
router.post('/login', login);

// Protected routes
router.get('/me', verifyFirebaseToken, getCurrentUser);

export default router;
