# Lullalink 👶

**AI-Powered Baby Monitor for Single Parents, Parents, and Caregivers**

Lullalink is a real-time baby monitoring platform that combines WebRTC live streaming, AI-assisted threat classification, and instant alerts so caregivers can monitor and respond quickly.

## Table of Contents

- [Lullalink 👶](#lullalink-)
  - [Table of Contents](#table-of-contents)
  - [At a Glance](#at-a-glance)
  - [Feature Snapshot](#feature-snapshot)
  - [Architecture](#architecture)
  - [End-to-End Flow](#end-to-end-flow)
  - [Tech Stack and Prerequisites](#tech-stack-and-prerequisites)
  - [Quick Start](#quick-start)
  - [Environment Variables](#environment-variables)
  - [Project Structure](#project-structure)
  - [Technical Reference](#technical-reference)
    - [Frontend Routes](#frontend-routes)
    - [REST API Endpoints](#rest-api-endpoints)
      - [Authentication (`/api/auth`)](#authentication-apiauth)
      - [Audio + Voice (`/api/audio`)](#audio--voice-apiaudio)
      - [Notifications (`/api/notifications`)](#notifications-apinotifications)
      - [Motion Monitoring (`/api/motion`)](#motion-monitoring-apimotion)
      - [Health, Status, and WebRTC](#health-status-and-webrtc)
    - [Real-Time Events (Socket.IO)](#real-time-events-socketio)
      - [Notification Events](#notification-events)
      - [WebRTC Signalling Events](#webrtc-signaling-events)
      - [Automatic Room Pairing](#automatic-room-pairing)
    - [Data Models](#data-models)
      - [User](#user)
      - [Notification](#notification)
      - [AudioLog](#audiolog)
      - [MotionLog](#motionlog)
  - [Security](#security)

---

## At a Glance

| Item                 | Summary                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Problem              | Caregivers need reliable live monitoring and fast alerts without complex setup.                   |
| Solution             | A two-device baby monitoring system: baby device broadcasts, parent device watches and interacts. |
| Primary users        | Single parents, parents, and caregivers.                                                          |
| Core value           | Live stream + AI risk classification + real-time alerts + voice tools in one app.                 |
| Backend              | Node.js, TypeScript, Express, MongoDB, Firebase Auth, Socket.IO.                                  |
| Frontend             | React 19, Vite, Tailwind CSS v4, WebRTC, TensorFlow.js.                                           |
| AI/External services | Google Gemini, ElevenLabs, SendGrid, TURN server support.                                         |

### Engineering Highlights

- Cross-network WebRTC streaming with STUN/TURN and Socket.IO signaling.
- Motion-risk pipeline with Gemini classification and rule-based fallback.
- Real-time push notifications plus email delivery.
- Talk-to-baby TTS, AI lullaby generation, and optional custom voice cloning.
- Authenticated multi-device pairing using Firebase identity.

---

## Feature Snapshot

| Area                             | What it does                                                          |
| -------------------------------- | --------------------------------------------------------------------- |
| Baby Device Mode (`/baby`)       | Fullscreen camera broadcaster with HUD and wake-lock support.         |
| Parent Monitor (`/monitor`)      | Fullscreen viewer with controls for TTS and lullaby playback.         |
| Dashboard (`/dashboard`)         | Live system stats, recent alerts, and lullaby generator widget.       |
| Notifications (`/notifications`) | Real-time and historical alert feed with snapshot support.            |
| Profile (`/profile`)             | Notification preferences, voice settings, and voice-clone management. |
| AI Safety                        | Motion events classified into risk levels with automated alerting.    |

---

## Architecture

```mermaid
graph TB
    subgraph "Frontend (React + Vite + Tailwind)"
        BABY["Baby Device"]
        PARENT["Parent Monitor"]
        DASH["Dashboard"]
        PROFILE["Profile"]
        NOTIF["Notifications"]
    end

    subgraph "Backend (Express + Socket.IO)"
        API["REST API :5000/api"]
        SIG["WebRTC Signaling"]
        AUTHCTRL["Auth Controller"]
        ACTRL["Audio Controller"]
        MCTRL["Motion Controller"]
        NCTRL["Notification Controller"]
    end

    subgraph "External Services"
        FB["Firebase Auth"]
        DB[("MongoDB Atlas")]
        GEM["Google Gemini"]
        EL["ElevenLabs"]
        SG["SendGrid"]
        TURN["TURN/STUN"]
    end

    BABY <-->|"Video/Audio"| PARENT
    BABY <-->|"offer/answer/ICE"| SIG
    PARENT <-->|"offer/answer/ICE"| SIG

    DASH --> API
    PROFILE --> API
    NOTIF <-->|"subscribe + push"| SIG
    PARENT --> API
    BABY --> API

    AUTHCTRL <--> FB
    AUTHCTRL <--> DB
    ACTRL <--> DB
    ACTRL --> EL
    MCTRL <--> DB
    MCTRL --> GEM
    NCTRL <--> DB
    NCTRL --> SG
    NCTRL --> SIG

    BABY -.-> TURN
    PARENT -.-> TURN
```

---

## End-to-End Flow

```mermaid
sequenceDiagram
    actor Parent as Parent Device
    actor Baby as Baby Device
    participant BE as Backend (Express + Socket.IO)
    participant DB as MongoDB
    participant AI as Gemini
    participant EL as ElevenLabs

    Parent->>BE: Authenticate (email/password or Google)
    BE->>DB: Load or create user profile

    Baby->>BE: Join room and register broadcaster
    Parent->>BE: Join room as viewer
    Parent-->>Baby: WebRTC signaling (offer/answer/ICE)

    Baby->>BE: Send motion event
    BE->>AI: Classify risk level
    BE->>DB: Save motion log and notification (if needed)
    BE-->>Parent: Push real-time notification

    Parent->>BE: Send TTS / lullaby request
    BE->>EL: Generate audio
    BE-->>Parent: Stream audio response
```

---

## Tech Stack and Prerequisites

| Area       | Stack / Service                                       | Purpose                                                       | Required for local setup |
| ---------- | ----------------------------------------------------- | ------------------------------------------------------------- | ------------------------ |
| Frontend   | React 19, Vite, Tailwind CSS v4, Framer Motion, Lenis | UI, navigation, styling, interactions                         | Yes                      |
| Backend    | Node.js 18+, TypeScript, Express                      | API server runtime and routing                                | Yes                      |
| Data       | MongoDB Atlas, Mongoose                               | Persist users, alerts, audio logs, motion logs                | Yes                      |
| Auth       | Firebase (Admin SDK + Web SDK + REST API key)         | Authentication and JWT verification                           | Yes                      |
| Realtime   | Socket.IO, WebRTC (STUN/TURN)                         | Signaling, streaming, live event push                         | Yes                      |
| Vision     | TensorFlow.js MoveNet, OpenCV (Python)                | Motion and pose event generation                              | Yes                      |
| AI + Audio | Google Gemini, ElevenLabs                             | Threat classification, TTS, lullaby generation, voice cloning | Yes (for full features)  |
| Alerts     | SendGrid                                              | Email notification delivery                                   | Optional                 |

Minimum to run core platform: Node.js 18+, MongoDB Atlas, Firebase project.

To run full feature set: add Gemini API key, ElevenLabs API key, and SendGrid API key.

---

## Quick Start

```bash
# 1) Backend
cd backend
npm install
npm run dev          # http://localhost:5000

# 2) Frontend (new terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173
```

---

## Environment Variables

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

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Gemini
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# TURN (optional - falls back to openrelay.metered.ca)
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

---

## Project Structure

```text
htc-2026/
├── backend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── audio/
│   │   │   ├── motion/
│   │   │   └── notifications/
│   │   ├── shared/
│   │   │   ├── config/
│   │   │   ├── middleware/
│   │   │   └── models/
│   │   └── index.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── pose/
│   │   ├── config/
│   │   └── utils/
│   └── package.json
└── README.md
```

---

## Technical Reference

### Frontend Routes

| Route            | Page                | Description                                    |
| ---------------- | ------------------- | ---------------------------------------------- |
| `/`              | `LandingPage`       | Marketing landing page.                        |
| `/signup`        | `SignUpPage`        | Registration (email/password + Google OAuth).  |
| `/login`         | `LoginPage`         | Login (email/password + Google OAuth).         |
| `/baby`          | `BabyDevicePage`    | Baby device broadcaster mode.                  |
| `/monitor`       | `MonitorPage`       | Parent live monitor with TTS/lullaby controls. |
| `/dashboard`     | `DashboardPage`     | Overview with stats, alerts, and shortcuts.    |
| `/notifications` | `NotificationsPage` | Alert history with real-time updates.          |
| `/profile`       | `ProfilePage`       | Preferences and voice settings.                |
| `/onboarding`    | `OnboardingPage`    | New-user setup flow.                           |
| `/about`         | `AboutPage`         | About and mission page.                        |
| `/auth-showcase` | `AuthShowcase`      | Auth component demo page.                      |

### REST API Endpoints

Base URL: `http://localhost:5000/api`

Protected routes require:

```http
Authorization: Bearer <firebase-id-token>
```

#### Authentication (`/api/auth`)

| Method | Endpoint           | Functionality                                                 | Auth |
| ------ | ------------------ | ------------------------------------------------------------- | ---- |
| `POST` | `/api/auth/signup` | Creates a new account and user record.                        | No   |
| `POST` | `/api/auth/login`  | Authenticates with email/password and returns session tokens. | No   |
| `POST` | `/api/auth/google` | Signs in with Google token and provisions a user if needed.   | No   |
| `GET`  | `/api/auth/me`     | Returns the currently authenticated user profile.             | Yes  |

#### Audio + Voice (`/api/audio`)

| Method   | Endpoint                  | Functionality                                                            | Auth |
| -------- | ------------------------- | ------------------------------------------------------------------------ | ---- |
| `POST`   | `/api/audio/stream`       | Generates and streams TTS audio for the baby device.                     | Yes  |
| `POST`   | `/api/audio/lullaby`      | Generates and streams AI lullaby audio by vibe/length.                   | Yes  |
| `GET`    | `/api/audio/voices`       | Lists available preset voices.                                           | Yes  |
| `POST`   | `/api/audio/voice/clone`  | Creates a custom cloned voice from uploaded samples.                     | Yes  |
| `GET`    | `/api/audio/voice/custom` | Returns current custom voice metadata.                                   | Yes  |
| `DELETE` | `/api/audio/voice/custom` | Removes the current custom voice.                                        | Yes  |
| `PUT`    | `/api/audio/voice`        | Sets the active preset voice.                                            | Yes  |
| `PUT`    | `/api/audio/settings`     | Updates audio preferences (for example enabling/disabling custom voice). | Yes  |

#### Notifications (`/api/notifications`)

| Method | Endpoint                         | Functionality                                                       | Auth |
| ------ | -------------------------------- | ------------------------------------------------------------------- | ---- |
| `POST` | `/api/notifications`             | Creates an alert notification and triggers realtime/email delivery. | Yes  |
| `GET`  | `/api/notifications`             | Lists notifications with pagination and unread counts.              | Yes  |
| `PUT`  | `/api/notifications/:id/read`    | Marks one notification as read.                                     | Yes  |
| `PUT`  | `/api/notifications/read-all`    | Marks all notifications as read.                                    | Yes  |
| `GET`  | `/api/notifications/preferences` | Returns notification preference settings.                           | Yes  |
| `PUT`  | `/api/notifications/preferences` | Updates notification preference settings.                           | Yes  |

#### Motion Monitoring (`/api/motion`)

| Method | Endpoint                 | Functionality                                                      | Auth |
| ------ | ------------------------ | ------------------------------------------------------------------ | ---- |
| `POST` | `/api/motion`            | Logs motion events, classifies risk, and alerts on caution/danger. | Yes  |
| `GET`  | `/api/motion`            | Lists motion logs with filtering and pagination.                   | Yes  |
| `GET`  | `/api/motion/categories` | Returns supported motion categories.                               | No   |

#### Health, Status, and WebRTC

| Method | Endpoint                  | Functionality                                             | Auth |
| ------ | ------------------------- | --------------------------------------------------------- | ---- |
| `GET`  | `/health`                 | Basic backend health check.                               | No   |
| `GET`  | `/`                       | Root API metadata endpoint.                               | No   |
| `GET`  | `/api/status`             | Returns live monitor/viewer status for dashboard polling. | No   |
| `GET`  | `/api/webrtc/ice-servers` | Returns STUN/TURN ICE configuration for WebRTC setup.     | No   |

### Real-Time Events (Socket.IO)

Connect to `http://localhost:5000` via Socket.IO.

#### Notification Events

| Direction        | Event                     | Payload                                       | Description                                |
| ---------------- | ------------------------- | --------------------------------------------- | ------------------------------------------ |
| Client -> Server | `subscribe-notifications` | `firebaseUid`                                 | Join user-specific room for live alerts.   |
| Server -> Client | `new-notification`        | `{ id, type, message, snapshot, time, read }` | Pushed when a new notification is created. |

#### WebRTC Signaling Events

| Direction        | Event                      | Payload                                  | Description                                         |
| ---------------- | -------------------------- | ---------------------------------------- | --------------------------------------------------- |
| Client -> Server | `join-room`                | `roomId`                                 | Join a WebRTC room.                                 |
| Client -> Server | `broadcaster`              | `roomId`                                 | Register as camera broadcaster.                     |
| Client -> Server | `viewer`                   | `roomId`                                 | Register as stream viewer.                          |
| Client -> Server | `offer`                    | `viewerId`, `RTCSessionDescription`      | Send SDP offer to viewer.                           |
| Client -> Server | `answer`                   | `broadcasterId`, `RTCSessionDescription` | Send SDP answer to broadcaster.                     |
| Client -> Server | `ice-candidate`            | `targetId`, `RTCIceCandidate`            | Exchange ICE candidates.                            |
| Server -> Client | `broadcaster-exists`       | `broadcasterId`                          | Viewer notified that a broadcaster is already live. |
| Server -> Client | `broadcaster-ready`        | `broadcasterId`                          | Room notified broadcaster is online.                |
| Server -> Client | `broadcaster-disconnected` | -                                        | Room notified broadcaster left.                     |
| Server -> Client | `viewer-joined`            | `viewerId`                               | Broadcaster notified of a new viewer.               |
| Server -> Client | `viewer-disconnected`      | `viewerId`                               | Broadcaster notified viewer left.                   |

#### Automatic Room Pairing

Both devices derive room ID from Firebase UID:

```text
roomId = baby-${user.uid.slice(0, 12)}
```

Devices authenticated to the same account pair automatically.

### Data Models

#### User

```typescript
{
  firebaseUid: string;
  email: string;
  displayName?: string;
  phone?: string;
  customVoiceId?: string;
  enableCustomVoice: boolean;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Notification

```typescript
{
  userId: ObjectId;
  type: "motion" | "sound" | "boundary" | "unknown" | "system";
  message: string;
  snapshot?: string;
  read: boolean;
  details?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### AudioLog

```typescript
{
  userId: ObjectId;
  babyDeviceId: string;
  text: string;
  voiceId: string;
  duration?: number;
  characterCount: number;
  status: "success" | "failed";
  createdAt: Date;
}
```

#### MotionLog

```typescript
{
  userId: ObjectId;
  category: MotionCategory;
  confidence: number;
  threatLevel: "safe" | "caution" | "danger";
  threatReason: string;
  notified: boolean;
  snapshot?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Security

- Firebase JWT verification on protected routes.
- Helmet security headers.
- CORS configured for frontend origin.
- Environment variable usage with `.env` and `.gitignore`.
- User-specific resource isolation in backend queries.
- Input sanitization and validation in auth flows.
