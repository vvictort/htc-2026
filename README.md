# HTC-2026 - Baby Monitor Application 👶🎵

A modern baby monitor application with real-time video monitoring, AI-powered pose detection, voice cloning, lullaby generation, and multi-channel notifications (email, SMS, push). Parents can watch their baby live from anywhere using cross-network WebRTC streaming with TURN server support, receive instant alerts with snapshots, and send personalized audio messages using their own cloned voice.

## Project Structure

```
htc-2026/
├── backend/                          # TypeScript Node.js API server
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/                # Authentication (Firebase + MongoDB)
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── auth.routes.ts
│   │   │   ├── audio/               # TTS, lullaby, voice cloning
│   │   │   │   ├── audio.controller.ts
│   │   │   │   └── audio.routes.ts
│   │   │   └── notifications/       # Alerts, email, SMS delivery
│   │   │       ├── notification.controller.ts
│   │   │       ├── notification.routes.ts
│   │   │       └── notification.service.ts
│   │   ├── shared/
│   │   │   ├── config/              # Database & Firebase config
│   │   │   ├── middleware/          # Auth middleware
│   │   │   └── models/             # Mongoose schemas
│   │   │       ├── User.ts
│   │   │       ├── Notification.ts
│   │   │       └── AudioLog.ts
│   │   └── index.ts                 # Express + Socket.IO + WebRTC signaling
│   └── .env                         # Environment variables
│
├── frontend/                         # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Broadcaster.tsx      # WebRTC camera broadcaster
│   │   │   ├── Viewer.tsx           # WebRTC stream viewer (fullscreen support)
│   │   │   ├── auth/                # Login, signup forms
│   │   │   ├── dashboard/           # Layout, sidebar, lullaby, quotes
│   │   │   ├── landing/             # Marketing pages
│   │   │   ├── onboarding/          # Voice recorder & selector
│   │   │   └── ui/                  # Toast, shared UI
│   │   ├── pages/
│   │   │   ├── BabyDevicePage.tsx   # Baby device mode (camera broadcaster)
│   │   │   ├── MonitorPage.tsx      # Parent monitor (viewer + HUD controls)
│   │   │   ├── DashboardPage.tsx    # Dashboard with live stats
│   │   │   └── ...                  # Other route pages
│   │   ├── context/                 # Auth context (Firebase + storage)
│   │   └── utils/                   # API helpers
│   └── .env                         # Frontend env (VITE_API_URL)
│
├── baby-watcher/                     # Pose detection engine (TensorFlow)
│   └── src/pose/PoseEngine.tsx
│
└── README.md
```

## Technology Stack

| Technology       | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| **Node.js**      | Backend runtime                                |
| **TypeScript**   | Type-safe development                          |
| **Express**      | REST API framework                             |
| **MongoDB**      | User profiles, notifications, audio logs       |
| **Firebase**     | Authentication (Admin SDK + REST API)          |
| **Socket.IO**    | Real-time notification push + WebRTC signaling |
| **WebRTC**       | Peer-to-peer video streaming (STUN + TURN)     |
| **ElevenLabs**   | TTS, voice cloning, lullaby generation         |
| **SendGrid**     | Email notification delivery                    |
| **Twilio**       | SMS notification delivery                      |
| **React + Vite** | Frontend SPA                                   |
| **TensorFlow**   | Baby pose detection                            |

---

## RESTful API Endpoints

Base URL: `http://localhost:5000/api`

All protected routes require:
```
Authorization: Bearer <firebase-id-token>
```

---

### 🔐 Authentication (`/api/auth`)

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "securePassword123",
  "displayName": "Parent Name",
  "phone": "+15551234567"           // optional, for SMS alerts
}
```
**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "uid": "firebase_uid",
    "email": "parent@example.com",
    "displayName": "Parent Name",
    "mongoId": "mongodb_id"
  },
  "customToken": "firebase_custom_token"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "securePassword123"
}
```
**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "uid": "firebase_uid",
    "email": "parent@example.com",
    "displayName": "Parent Name",
    "mongoId": "mongodb_id"
  },
  "idToken": "firebase_jwt_token",
  "refreshToken": "firebase_refresh_token",
  "expiresIn": "3600"
}
```

#### Google OAuth Login
```http
POST /api/auth/google
Content-Type: application/json

{
  "idToken": "google_id_token_from_popup"
}
```
**Response (200):** Same shape as login response.

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### 🎵 Audio / Text-to-Speech (`/api/audio`)

#### Stream TTS Audio
```http
POST /api/audio/stream
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Hello sweetie, time for your nap!",
  "babyDeviceId": "device123",
  "voiceId": "optional-voice-id"
}
```
**Response:** `audio/mpeg` binary stream (MP3)

**Voice priority:** `voiceId` param → user's custom voice → default voice

#### Generate Lullaby (Music Generation)
Uses ElevenLabs Music Generation to create soothing instrumental music, ambient sounds, and humming to help baby relax and fall asleep.
```http
POST /api/audio/lullaby
Authorization: Bearer <token>
Content-Type: application/json

{
  "babyDeviceId": "device123",          // required
  "vibe": "lullaby",                    // "lullaby" | "classic" | "nature" | "cosmic" | "ocean" | "rainy"
  "length": "medium"                    // "short" (30s) | "medium" (1min) | "long" (2min)
}
```
**Response:** `audio/mpeg` binary stream (AI-generated instrumental music)

**Vibes:**
- `lullaby` — soft singing vocals, gentle humming & warm melody (with vocals)
- `classic` — music box melody, soft piano arpeggios & warm humming
- `nature` — birdsong, crickets, flowing streams with celeste melody
- `cosmic` — ethereal synth pads, twinkling chimes, weightless drones
- `ocean` — gentle waves, harp glissandos & acoustic guitar
- `rainy` — rain on glass, distant thunder & solo piano

#### Get Available Voices
```http
GET /api/audio/voices
Authorization: Bearer <token>
```
**Response (200):**
```json
{
  "voices": [
    {
      "voice_id": "abc123",
      "name": "Rachel",
      "category": "premade",
      "labels": { "accent": "american", "gender": "female" }
    }
  ]
}
```

---

### 🎤 Voice Cloning (`/api/audio/voice`)

#### Clone Voice from Audio Samples
```http
POST /api/audio/voice/clone
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Fields:
  name:    "Mom's Voice"        (required)
  samples: audio_file.webm      (required, 1-3 files)
```
**Response (201):**
```json
{
  "message": "Custom voice created successfully",
  "voiceId": "elevenlabs_voice_id",
  "voiceName": "Mom's Voice"
}
```

#### Get Custom Voice Details
```http
GET /api/audio/voice/custom
Authorization: Bearer <token>
```

#### Delete Custom Voice
```http
DELETE /api/audio/voice/custom
Authorization: Bearer <token>
```

#### Set Active Voice (Preset)
```http
PUT /api/audio/voice
Authorization: Bearer <token>
Content-Type: application/json

{
  "voiceId": "elevenlabs_voice_id"
}
```

#### Update Audio Settings
```http
PUT /api/audio/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "enableCustomVoice": true
}
```

---

### 🔔 Notifications (`/api/notifications`)

#### Create Notification (Trigger Alert)
Called by the baby monitor camera when an event is detected.
```http
POST /api/notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "BOUNDARY",                     // "ACTIVE" | "BOUNDARY" | "UNKNOWN" | "SOUND"
  "snapshot": "base64_jpeg_without_prefix",  // optional
  "details": { "side": "left" }             // optional metadata
}
```
**Response (201):**
```json
{
  "id": "notification_id",
  "type": "boundary",
  "message": "Boundary breach detected (left side).",
  "snapshot": true,
  "time": "2026-02-08T12:00:00.000Z",
  "read": false
}
```

**Side effects:**
- Emits `new-notification` via Socket.IO to `user:<firebaseUid>` room
- Sends email via SendGrid (if `notificationPreferences.email` is true)
- Sends SMS via Twilio (if `notificationPreferences.sms` is true and `phone` is set)

#### List Notifications (Paginated)
```http
GET /api/notifications?page=1&limit=30
Authorization: Bearer <token>
```
**Response (200):**
```json
{
  "notifications": [ ... ],
  "total": 42,
  "unreadCount": 5,
  "page": 1,
  "pages": 2
}
```

#### Mark Single as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer <token>
```

#### Get Notification Preferences
```http
GET /api/notifications/preferences
Authorization: Bearer <token>
```
**Response (200):**
```json
{
  "notificationPreferences": {
    "email": true,
    "sms": false,
    "push": true
  },
  "phone": "+15551234567"
}
```

#### Update Notification Preferences
```http
PUT /api/notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": true,
  "sms": true,
  "push": true,
  "phone": "+15551234567"
}
```

---

### 🏥 Health & Status

```http
GET /health          →  { "status": "OK" }
GET /                →  { "message": "Welcome to the TypeScript Express API", ... }
```

#### Live Server Status (Active Monitors & Viewers)
```http
GET /api/status
```
**Response (200):**
```json
{
  "activeMonitors": 1,
  "totalViewers": 2,
  "activeRooms": [
    { "roomId": "baby-HCL0S7LxnW", "hasCamera": true, "viewers": 2 }
  ],
  "serverStatus": "online",
  "uptime": 3600.5
}
```
**Notes:**
- `activeMonitors` — count of rooms with a live baby camera broadcasting (in-memory, real-time)
- `totalViewers` — total connected parent viewers across all rooms
- `serverStatus` — always `"online"` if the server responds
- `uptime` — server uptime in seconds
- This data is ephemeral (in-memory via Socket.IO rooms), not persisted in MongoDB

---

### 📡 WebRTC (`/api/webrtc`)

#### Get ICE Servers (STUN + TURN)
```http
GET /api/webrtc/ice-servers
```
**Response (200):**
```json
{
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" },
    { "urls": "stun:stun1.l.google.com:19302" },
    {
      "urls": "turn:openrelay.metered.ca:80",
      "username": "openrelayproject",
      "credential": "openrelayproject"
    }
  ]
}
```
**Notes:**
- Used by Broadcaster & Viewer components to establish cross-network peer connections
- TURN servers are required when devices are behind symmetric NATs (different networks)
- Custom TURN server can be configured via env vars: `TURN_SERVER_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`
- Falls back to free openrelay.metered.ca TURN servers if env vars are not set

---

## Real-Time Events (Socket.IO)

Connect to `http://localhost:5000` via Socket.IO.

### Notification Events

| Event (Client → Server)   | Payload                | Description                             |
| ------------------------- | ---------------------- | --------------------------------------- |
| `subscribe-notifications` | `firebaseUid` (string) | Join user-specific room for live alerts |

| Event (Server → Client) | Payload                                       | Description                               |
| ----------------------- | --------------------------------------------- | ----------------------------------------- |
| `new-notification`      | `{ id, type, message, snapshot, time, read }` | Pushed when a new notification is created |

### WebRTC Signaling Events

| Event (Client → Server) | Payload                                  | Description                        |
| ----------------------- | ---------------------------------------- | ---------------------------------- |
| `join-room`             | `roomId` (string)                        | Join a WebRTC room                 |
| `broadcaster`           | `roomId` (string)                        | Register as the camera broadcaster |
| `viewer`                | `roomId` (string)                        | Register as a stream viewer        |
| `offer`                 | `viewerId`, `RTCSessionDescription`      | Send SDP offer to a viewer         |
| `answer`                | `broadcasterId`, `RTCSessionDescription` | Send SDP answer to broadcaster     |
| `ice-candidate`         | `targetId`, `RTCIceCandidate`            | Exchange ICE candidates            |

| Event (Server → Client)    | Payload                  | Description                                     |
| -------------------------- | ------------------------ | ----------------------------------------------- |
| `broadcaster-exists`       | `broadcasterId` (string) | Sent to viewer when broadcaster is already live |
| `broadcaster-ready`        | `broadcasterId` (string) | Sent to room when broadcaster comes online      |
| `broadcaster-disconnected` | —                        | Sent to room when broadcaster leaves            |
| `viewer-joined`            | `viewerId` (string)      | Sent to broadcaster when new viewer joins       |
| `viewer-disconnected`      | `viewerId` (string)      | Sent to broadcaster when viewer leaves          |

### WebRTC Room Pairing

Both baby and parent devices auto-derive the room ID from the user's Firebase UID:
```
roomId = `baby-${user.uid.slice(0, 12)}`
```
This ensures devices on the **same account** connect automatically without manual room entry.

### Two-Device Setup

| Device Role | URL Path   | Component      | Function                                  |
| ----------- | ---------- | -------------- | ----------------------------------------- |
| **Baby**    | `/baby`    | BabyDevicePage | Camera broadcaster, wake lock, minimal UI |
| **Parent**  | `/monitor` | MonitorPage    | Stream viewer with HUD (TTS + lullaby)    |

1. On the **baby device**: Navigate to `/baby`, log in, tap "Start Baby Camera"
2. On the **parent device**: Navigate to `/monitor`, tap "Watch Baby Stream"
3. Both devices auto-pair via the same account — no room ID needed
4. Parent HUD provides TTS (talk to baby) and lullaby generation buttons over the live feed

---

## Database Schemas

### User
```typescript
{
  firebaseUid: string;              // Firebase Auth UID (unique, indexed)
  email: string;                     // User email (unique)
  displayName?: string;
  phone?: string;                    // For SMS alerts (E.164 format)
  customVoiceId?: string;            // ElevenLabs cloned voice ID
  enableCustomVoice?: boolean;       // Toggle custom voice for TTS
  notificationPreferences: {
    email: boolean;                  // Default: true
    sms: boolean;                    // Default: false
    push: boolean;                   // Default: true
  };
}
```

### Notification
```typescript
{
  userId: ObjectId;                  // Ref → User
  type: "motion" | "sound" | "boundary" | "unknown" | "system";
  message: string;
  snapshot?: string;                 // Base64 JPEG
  read: boolean;                    // Default: false
  details?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

### AudioLog
```typescript
{
  userId: ObjectId;
  babyDeviceId: string;
  text: string;
  voiceId: string;
  characterCount: number;
  status: "success" | "failed";
}
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Firebase project (Admin SDK + Web API key)
- ElevenLabs API key
- SendGrid API key (for email alerts)
- Twilio account (for SMS alerts)

### Environment Variables

Create `backend/.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ElevenLabs
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=default_voice_id

# SendGrid (Email)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+15551234567

# TURN Server (optional — falls back to openrelay.metered.ca)
TURN_SERVER_URL=turn:your-turn-server.com:443
TURN_USERNAME=your-username
TURN_CREDENTIAL=your-credential
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=AIzaSyXXXX
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### Quick Start

```bash
# Backend
cd backend
npm install
npm run dev          # http://localhost:5000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173
```

---

## API Response Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 201  | Created (signup, voice clone, notif) |
| 202  | Accepted (email queued)              |
| 400  | Bad Request (missing/invalid data)   |
| 401  | Unauthorized (invalid/missing token) |
| 404  | Not Found                            |
| 500  | Internal Server Error                |

## Security

- Firebase JWT token verification on all protected routes
- Helmet.js security headers
- CORS configured for frontend origin
- Environment variable protection (.env + .gitignore)
- User-specific resource isolation (users can only access their own data)

---

**Built with ❤️ for parents and babies**