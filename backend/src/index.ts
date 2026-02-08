import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
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

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

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

// WebRTC Signaling with Socket.IO
interface Room {
    broadcaster?: string;
    viewers: Set<string>;
}

const rooms = new Map<string, Room>();

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        
        if (!rooms.has(roomId)) {
            rooms.set(roomId, { viewers: new Set() });
        }
        
        const room = rooms.get(roomId)!;
        
        // If there's already a broadcaster, tell this viewer about them
        if (room.broadcaster) {
            socket.emit('broadcaster-exists', room.broadcaster);
        }
        
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('broadcaster', (roomId: string) => {
        const room = rooms.get(roomId);
        if (room) {
            room.broadcaster = socket.id;
            
            // Notify all viewers in the room that broadcaster is ready
            socket.to(roomId).emit('broadcaster-ready', socket.id);
            
            // Tell the broadcaster about all existing viewers so it can send offers
            room.viewers.forEach(viewerId => {
                socket.emit('viewer-joined', viewerId);
                console.log(`Notifying broadcaster ${socket.id} about existing viewer ${viewerId}`);
            });
            
            console.log(`Broadcaster ${socket.id} ready in room ${roomId} with ${room.viewers.size} existing viewers`);
        }
    });

    socket.on('viewer', (roomId: string) => {
        const room = rooms.get(roomId);
        if (room) {
            room.viewers.add(socket.id);
            if (room.broadcaster) {
                socket.to(room.broadcaster).emit('viewer-joined', socket.id);
                console.log(`Viewer ${socket.id} joined broadcaster ${room.broadcaster}`);
            }
        }
    });

    socket.on('offer', (id: string, description: any) => {
        socket.to(id).emit('offer', socket.id, description);
    });

    socket.on('answer', (id: string, description: any) => {
        socket.to(id).emit('answer', socket.id, description);
    });

    socket.on('ice-candidate', (id: string, candidate: any) => {
        socket.to(id).emit('ice-candidate', socket.id, candidate);
    });

    socket.on('disconnect', () => {
        // Clean up rooms when broadcaster or viewer disconnects
        rooms.forEach((room, roomId) => {
            if (room.broadcaster === socket.id) {
                socket.to(roomId).emit('broadcaster-disconnected');
                room.broadcaster = undefined;
            }
            room.viewers.delete(socket.id);
        });
        console.log('Client disconnected:', socket.id);
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
        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
            console.log(`WebRTC signaling server ready`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
