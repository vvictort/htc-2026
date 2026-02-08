import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './shared/config/database';
import { initializeFirebase } from './shared/config/firebase';
import { verifyFirebaseToken } from './shared/middleware/authMiddleware';
import authRoutes from './features/auth/auth.routes';
import audioRoutes from './features/audio/audio.routes';

// Load environment variables
dotenv.config();

// Initialize Firebase
initializeFirebase();

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check route
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Root route
app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
        message: 'Welcome to the TypeScript Express API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            api: '/api'
        }
    });
});

// API routes
app.get('/api', (_req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to the API' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Audio routes
app.use('/api/audio', audioRoutes);

// Protected route example - requires authentication
app.get('/api/protected', verifyFirebaseToken, (req: Request, res: Response) => {
    res.status(200).json({
        message: 'This is a protected route',
        user: {
            uid: req.user?.uid,
            email: req.user?.email
        }
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
