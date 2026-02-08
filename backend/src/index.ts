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
import notificationRoutes from './features/notifications/notification.routes';
import { setIO } from './features/notifications/notification.controller';

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

// Share Socket.IO instance with notification controller for realtime push
setIO(io);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '5mb' })); // Parse JSON bodies (increased for base64 snapshots)
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

// Notification routes
app.use('/api/notifications', notificationRoutes);

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

    // Allow authenticated clients to join a user-specific room for realtime notifications
    socket.on('subscribe-notifications', (firebaseUid: string) => {
        socket.join(`user:${firebaseUid}`);
        console.log(`Socket ${socket.id} subscribed to notifications for user ${firebaseUid}`);
    });

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
    }); socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        // Clean up rooms when broadcaster or viewer disconnects
        rooms.forEach((room, roomId) => {
            // If disconnected client was the broadcaster
            if (room.broadcaster === socket.id) {
                console.log(`Broadcaster ${socket.id} disconnected from room ${roomId}`);
                socket.to(roomId).emit('broadcaster-disconnected');
                room.broadcaster = undefined;
            }

            // If disconnected client was a viewer
            if (room.viewers.has(socket.id)) {
                console.log(`Viewer ${socket.id} disconnected from room ${roomId}`);
                room.viewers.delete(socket.id);

                // Notify broadcaster that viewer left
                if (room.broadcaster) {
                    io.to(room.broadcaster).emit('viewer-disconnected', socket.id);
                    console.log(`Notified broadcaster ${room.broadcaster} about viewer ${socket.id} disconnect`);
                }
            }
        });
    });
});

// WebRTC ICE server credentials endpoint
// Returns STUN + TURN servers for NAT traversal across different networks
app.get('/api/webrtc/ice-servers', (_req: Request, res: Response) => {
    const iceServers: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ];

    // Add TURN server if configured
    const turnUrl = process.env.TURN_SERVER_URL;
    const turnUser = process.env.TURN_USERNAME;
    const turnCred = process.env.TURN_CREDENTIAL;

    if (turnUrl && turnUser && turnCred) {
        iceServers.push(
            { urls: turnUrl, username: turnUser, credential: turnCred },
        );
    } else {
        // Fallback: open relay TURN servers for development/hackathon
        iceServers.push(
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject',
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject',
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject',
            },
        );
    }

    res.json({ iceServers });
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
