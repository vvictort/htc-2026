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
import motionRoutes from './features/motion/motion.routes';
import { setIO } from './features/notifications/notification.controller';
import { setMotionIO } from './features/motion/motion.controller';

dotenv.config();

initializeFirebase();

const app: Application = express();
const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

setIO(io);
setMotionIO(io);

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

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

app.get('/api', (_req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to the API' });
});

app.use('/api/auth', authRoutes);

app.use('/api/audio', audioRoutes);

app.use('/api/notifications', notificationRoutes);

app.use('/api/motion', motionRoutes);

app.get('/api/protected', verifyFirebaseToken, (req: Request, res: Response) => {
    res.status(200).json({
        message: 'This is a protected route',
        user: {
            uid: req.user?.uid,
            email: req.user?.email
        }
    });
});

interface Room {
    broadcaster?: string;
    viewers: Set<string>;
}

const rooms = new Map<string, Room>();

app.get('/api/status', (_req: Request, res: Response) => {
    let activeMonitors = 0;
    let totalViewers = 0;
    const activeRooms: { roomId: string; hasCamera: boolean; viewers: number }[] = [];

    rooms.forEach((room, roomId) => {
        const hasCamera = !!room.broadcaster;
        if (hasCamera) activeMonitors++;
        totalViewers += room.viewers.size;
        if (hasCamera || room.viewers.size > 0) {
            activeRooms.push({ roomId, hasCamera, viewers: room.viewers.size });
        }
    });

    res.json({
        activeMonitors,
        totalViewers,
        activeRooms,
        serverStatus: 'online',
        uptime: process.uptime(),
    });
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

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

        if (room.broadcaster) {
            socket.emit('broadcaster-exists', room.broadcaster);
        }

        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('broadcaster', (roomId: string) => {
        const room = rooms.get(roomId);
        if (room) {
            room.broadcaster = socket.id;

            socket.to(roomId).emit('broadcaster-ready', socket.id);

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
    });    socket.on('ice-candidate', (id: string, candidate: any) => {
        socket.to(id).emit('ice-candidate', socket.id, candidate);
    });

    socket.on('lullaby-play', (roomId: string, payload: { audioBase64: string; durationMs: number; vibe: string }) => {
        const room = rooms.get(roomId);
        if (room?.broadcaster) {
            io.to(room.broadcaster).emit('lullaby-play', payload);
            console.log(`[Lullaby] Relayed play command to broadcaster in room ${roomId} (${(payload.audioBase64.length / 1024).toFixed(0)} KB, ${payload.durationMs}ms, ${payload.vibe})`);
        }
    });

    socket.on('lullaby-stop', (roomId: string) => {
        const room = rooms.get(roomId);
        if (room?.broadcaster) {
            io.to(room.broadcaster).emit('lullaby-stop');
            console.log(`[Lullaby] Relayed stop command to broadcaster in room ${roomId}`);
        }
    });

    socket.on('lullaby-status', (roomId: string, status: { state: string; currentTime: number; duration: number }) => {
        socket.to(roomId).emit('lullaby-status', status);
    });

    socket.on('tts-play', (roomId: string, payload: { audioBase64: string }) => {
        const room = rooms.get(roomId);
        if (room?.broadcaster) {
            io.to(room.broadcaster).emit('tts-play', payload);
            console.log(`[TTS] Relayed TTS to broadcaster in room ${roomId} (${(payload.audioBase64.length / 1024).toFixed(0)} KB)`);
        }
    });

    socket.on('play-audio', (roomId: string, audioUrl: string) => {
        console.log(`[play-audio] Forwarding audio to room ${roomId}`);
        const room = rooms.get(roomId);
        if (room?.broadcaster) {
            io.to(room.broadcaster).emit('play-audio', audioUrl);
            console.log(`[play-audio] Sent audio to broadcaster ${room.broadcaster}`);
        } else {
            console.warn(`[play-audio] No broadcaster found in room ${roomId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        rooms.forEach((room, roomId) => {
            if (room.broadcaster === socket.id) {
                console.log(`Broadcaster ${socket.id} disconnected from room ${roomId}`);
                socket.to(roomId).emit('broadcaster-disconnected');
                room.broadcaster = undefined;
            }

            if (room.viewers.has(socket.id)) {
                console.log(`Viewer ${socket.id} disconnected from room ${roomId}`);
                room.viewers.delete(socket.id);

                if (room.broadcaster) {
                    io.to(room.broadcaster).emit('viewer-disconnected', socket.id);
                    console.log(`Notified broadcaster ${room.broadcaster} about viewer ${socket.id} disconnect`);
                }
            }
        });
    });
});

app.get('/api/webrtc/ice-servers', (_req: Request, res: Response) => {
    const iceServers: Array<{ urls: string; username?: string; credential?: string }> = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ];

    const turnUrl = process.env.TURN_SERVER_URL;
    const turnUser = process.env.TURN_USERNAME;
    const turnCred = process.env.TURN_CREDENTIAL;

    if (turnUrl && turnUser && turnCred) {
        iceServers.push(
            { urls: turnUrl, username: turnUser, credential: turnCred },
        );
    } else {
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

app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

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
