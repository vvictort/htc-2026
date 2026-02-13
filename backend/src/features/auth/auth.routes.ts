import express from 'express';
import { signUp, login, googleLogin, getCurrentUser } from './auth.controller';
import { verifyFirebaseToken } from '../../shared/middleware/authMiddleware';

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);
router.post('/google', googleLogin);

router.get('/me', verifyFirebaseToken, getCurrentUser);

export default router;
