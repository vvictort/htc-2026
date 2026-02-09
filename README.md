# HTC-2026 —# Lullalink 👶🤖

**AI-Powered Baby Monitor for Generation Alpha Parents**

Lullalink is a smart baby monitoring system that uses computer vision (MoveNet pose detection via TensorFlow.js) and Generative AI (Google Gemini 2.0 Flash) to detect potential threats in real-time. It doesn't just tell you _that_ your baby is moving—it tells you _why_ success is a threat.

## 🚀 Features

Parents can watch their baby live from anywhere using cross-network WebRTC streaming with TURN server support, receive instant alerts with snapshots, and send personalized audio messages using their own cloned voice.

## Architecture

```mermaid
graph TB
    subgraph "Frontend — React + Vite + Tailwind"
        LP["🏠 Landing Page"]
        AUTH["🔐 Login / Signup"]
        DASH["📊 Dashboard"]
        BABY["👶 Baby Device<br/><i>Broadcaster.tsx</i>"]
        PARENT["👀 Parent Monitor<br/><i>Viewer.tsx</i>"]
        NOTIF["🔔 Notifications"]
        PROFILE["👤 Profile & Settings"]
    end

    subgraph "Backend — Node.js + Express + Socket.IO"
        API["REST API<br/><i>:5000/api</i>"]
        SIG["WebRTC Signaling<br/><i>Socket.IO</i>"]
        NCTRL["Notification<br/>Controller"]
        ACTRL["Audio<br/>Controller"]
        AUTHCTRL["Auth<br/>Controller"]
        MCTRL["Motion<br/>Controller"]
    end

    subgraph "OpenCV Camera Monitor (Python)"
        OPENCV["📷 OpenCV<br/>Motion Detection"]
    end

    subgraph "External Services"
        FB["🔥 Firebase Auth"]
        MONGO[("🍃 MongoDB Atlas")]
        ELEVEN["🎵 ElevenLabs<br/><i>TTS · Cloning · Music</i>"]
        GEMINI["🤖 Google Gemini<br/><i>Threat Classification</i>"]
        SG["📧 SendGrid"]
        TW["📱 Twilio"]
        TURN["🌐 TURN Server"]
    end

    BABY <--->|"WebRTC P2P<br/>Video + Audio"| PARENT
    BABY <-->|"Signaling<br/>(offer/answer/ICE)"| SIG
    PARENT <-->|"Signaling"| SIG

    OPENCV -->|"POST /api/motion<br/>{category, confidence}"| MCTRL
    MCTRL -->|"classify threat"| GEMINI
    MCTRL -->|"if caution/danger"| NCTRL
    BABY -->|"POST /notifications<br/>(snapshot)"| NCTRL
    PARENT -->|"POST /audio/stream<br/>POST /audio/lullaby"| ACTRL
    AUTH -->|"POST /auth/signup<br/>POST /auth/login"| AUTHCTRL
    DASH -->|"GET /status<br/>GET /notifications"| API
    NOTIF <-->|"Socket.IO<br/>subscribe + push"| SIG
    PROFILE -->|"PUT /notifications/preferences<br/>PUT /audio/voice"| API

    AUTHCTRL <--> FB
    AUTHCTRL <--> MONGO
    NCTRL <--> MONGO
    NCTRL --> SG
    NCTRL --> TW
    NCTRL --> SIG
    ACTRL --> ELEVEN
    ACTRL <--> MONGO
    MCTRL <--> MONGO
    MCTRL --> GEMINI
    BABY -.->|"ICE Servers"| TURN
    PARENT -.->|"ICE Servers"| TURN

    style BABY fill:#FF6F61,color:#fff,stroke:#e85d50
    style PARENT fill:#4A90D9,color:#fff,stroke:#3a7bc8
    style OPENCV fill:#10B981,color:#fff,stroke:#059669
    style ELEVEN fill:#8B5CF6,color:#fff,stroke:#7c4ddb
    style GEMINI fill:#4285F4,color:#fff,stroke:#3367D6
    style FB fill:#FFA000,color:#fff,stroke:#e69000
    style MONGO fill:#47A248,color:#fff,stroke:#3a8a3c
    style SG fill:#1A82E2,color:#fff,stroke:#1570c6
    style TW fill:#F22F46,color:#fff,stroke:#d92a3f
```

## Workflow

```mermaid
sequenceDiagram
    actor Parent as 👩 Parent Device
    actor Baby as 📱 Baby Device
    participant BE as Backend<br/>(Express + Socket.IO)
    participant DB as MongoDB
    participant FB as Firebase Auth
    participant EL as ElevenLabs
    participant SG as SendGrid
    participant TW as Twilio

    Note over Parent, Baby: 1️⃣ Authentication
    Parent->>BE: POST /api/auth/signup {email, password, phone}
    BE->>FB: createUser()
    FB-->>BE: uid + customToken
    BE->>DB: Create User document
    BE-->>Parent: {user, idToken}
    Baby->>Parent: Same account login

    Note over Parent, Baby: 2️⃣ Start Baby Camera
    Baby->>BE: Socket: join-room(baby-{uid})
    Baby->>Baby: getUserMedia(video + audio)
    Baby->>BE: Socket: broadcaster(roomId)
    BE-->>Baby: ✓ Registered as broadcaster

    Note over Parent, Baby: 3️⃣ Parent Connects
    Parent->>BE: Socket: join-room(baby-{uid})
    Parent->>BE: Socket: viewer(roomId)
    BE-->>Baby: Socket: viewer-joined(viewerId)
    Baby->>Parent: SDP Offer (via Socket.IO)
    Parent->>Baby: SDP Answer (via Socket.IO)
    Baby->>Parent: ICE Candidates ↔️
    Note over Parent, Baby: 🎥 WebRTC P2P Video Stream Established

    Note over Parent, Baby: 4️⃣ OpenCV Motion Detection
    participant CV as OpenCV Camera
    participant GM as Gemini AI
    CV->>CV: Detect baby motion category
    CV->>BE: POST /api/motion {category, confidence, snapshot}
    BE->>GM: Classify threat (safe/caution/danger)
    GM-->>BE: {threatLevel, reason}
    BE->>DB: Save MotionLog
    alt threatLevel = caution or danger
        BE->>DB: Create Notification
        BE-->>Parent: Socket: new-notification
        BE->>SG: Send email alert (async)
        BE->>TW: Send SMS alert (async)
    end

    Note over Parent, Baby: 5️⃣ Legacy Monitor Events
    Baby->>Baby: Pose detection / Sound
    Baby->>BE: POST /api/notifications {reason, snapshot}
    BE->>DB: Save notification
    BE-->>Parent: Socket: new-notification
    BE->>SG: Send email alert (async)
    BE->>TW: Send SMS alert (async)

    Note over Parent, Baby: 6️⃣ Parent Interacts
    Parent->>BE: POST /api/audio/stream {text}
    BE->>EL: TTS (eleven_turbo_v2)
    EL-->>BE: audio/mpeg stream
    BE-->>Parent: Audio blob → plays on speaker

    Parent->>BE: POST /api/audio/lullaby {vibe, length}
    BE->>EL: Music Generation (music_v1)
    EL-->>BE: audio/mpeg stream
    BE-->>Parent: Audio blob → plays lullaby
```

## Project Structure

```
htc-2026/
├── backend/                          # TypeScript Node.js API server
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/                # Authentication (Firebase + MongoDB)
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── auth.routes.ts
│   │   │   ├── audio/               # TTS, lullaby music gen, voice cloning
│   │   │   │   ├── audio.controller.ts
│   │   │   │   └── audio.routes.ts
│   │   │   ├── notifications/       # Alerts, email, SMS delivery
│   │   │   │   ├── notification.controller.ts
│   │   │   │   ├── notification.routes.ts
│   │   │   │   └── notification.service.ts
│   │   │   └── motion/              # OpenCV motion events + Gemini classification
│   │   │       ├── motion.controller.ts
│   │   │       ├── motion.routes.ts
│   │   │       └── gemini.service.ts
│   │   ├── shared/
│   │   │   ├── config/
│   │   │   │   ├── database.ts      # MongoDB Atlas connection
│   │   │   │   └── firebase.ts      # Firebase Admin SDK init
│   │   │   ├── middleware/
│   │   │   │   └── authMiddleware.ts # Firebase JWT verification
│   │   │   └── models/
│   │   │       ├── User.ts          # User profile + prefs
│   │   │       ├── Notification.ts  # Alert history + snapshots
│   │   │       ├── AudioLog.ts      # TTS usage tracking
│   │   │       └── MotionLog.ts     # Motion events + Gemini threat classification
│   │   └── index.ts                 # Express + Socket.IO + WebRTC signaling
│   └── .env
│
├── frontend/                         # React + Vite + Tailwind SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Broadcaster.tsx      # WebRTC camera broadcaster (fullscreen HUD + legacy)
│   │   │   ├── Viewer.tsx           # WebRTC stream viewer (fullscreen + legacy)
│   │   │   ├── SmoothScroll.tsx     # Lenis smooth scrolling wrapper
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx    # Email/password + Google login
│   │   │   │   └── SignUpForm.tsx   # Registration with phone support
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardLayout.tsx # Sidebar + content layout
│   │   │   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   │   │   └── DailyQuote.tsx   # Random parenting quote
│   │   │   ├── landing/             # Landing page sections
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── Features.tsx
│   │   │   │   ├── HowItWorks.tsx
│   │   │   │   ├── Stats.tsx
│   │   │   │   ├── CTA.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── BabyIcons.tsx
│   │   │   ├── onboarding/
│   │   │   │   ├── VoiceRecorder.tsx # Record audio samples for cloning
│   │   │   │   └── VoiceSelector.tsx # Select preset ElevenLabs voice
│   │   │   └── ui/
│   │   │       └── Toast.tsx        # Toast notification component
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx      # Marketing / landing page
│   │   │   ├── SignUpPage.tsx       # Registration page
│   │   │   ├── LoginPage.tsx        # Login page
│   │   │   ├── BabyDevicePage.tsx   # Baby mode — fullscreen camera broadcaster
│   │   │   ├── MonitorPage.tsx      # Parent mode — stream viewer + TTS/lullaby HUD
│   │   │   ├── DashboardPage.tsx    # Dashboard with live stats + alerts
│   │   │   ├── NotificationsPage.tsx # Notification history (real-time)
│   │   │   ├── ProfilePage.tsx      # Profile + notification prefs + voice settings
│   │   │   ├── OnboardingPage.tsx   # New user onboarding flow
│   │   │   ├── AboutPage.tsx        # About page
│   │   │   └── AuthShowcase.tsx     # Auth UI demo
│   │   │   ├── context/
│   │   │   ├── AuthContext.tsx      # Firebase + storage fallback auth
│   │   │   └── useAuth.ts          # Auth hook
│   │   ├── config/
│   │   │   └── firebase.ts         # Firebase client SDK config
│   │   ├── utils/
│   │   │   ├── api.ts              # Endpoint constants + fetch helpers
│   │   │   └── auth.ts             # Auth utility functions
│   │   └── styles/
│   │       └── fonts.css
│   └── .env
│
├── lullalink/                     # Pose detection engine (TensorFlow.js)
│   └── src/pose/PoseEngine.tsx
│
└── README.md
```

## Technology Stack

| Technology          | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| **Node.js**         | Backend runtime                                                |
| **TypeScript**      | Type-safe development (frontend & backend)                     |
| **Express**         | REST API framework                                             |
| **MongoDB Atlas**   | User profiles, notifications, audio logs, motion logs          |
| **Mongoose**        | MongoDB ODM with schemas & validation                          |
| **Firebase**        | Authentication (Admin SDK + client SDK + REST API)             |
| **Socket.IO**       | Real-time notification push + WebRTC signaling                 |
| **WebRTC**          | Peer-to-peer video streaming (STUN + TURN)                     |
| **ElevenLabs**      | TTS (`eleven_turbo_v2`), voice cloning, music gen (`music_v1`) |
| **SendGrid**        | Email notification delivery                                    |
| **Twilio**          | SMS notification delivery                                      |
| **React 19 + Vite** | Frontend SPA                                                   |
| **Tailwind CSS v4** | Utility-first styling                                          |
| **Framer Motion**   | Page & component animations                                    |
| **Lenis**           | Smooth scrolling                                               |
| **TensorFlow.js**   | Baby pose detection                                            |
| **OpenCV**          | Baby motion detection & categorization (Python)                |
| **Google Gemini**   | AI threat classification (`gemini-2.0-flash`)                  |

---

## Frontend Routes

| Route            | Page              | Description                                    |
| ---------------- | ----------------- | ---------------------------------------------- |
| `/`              | LandingPage       | Marketing page with hero, features, CTA        |
| `/signup`        | SignUpPage        | Registration (email/password + Google OAuth)   |
| `/login`         | LoginPage         | Login (email/password + Google OAuth)          |
| `/baby`          | BabyDevicePage    | Baby device — fullscreen camera broadcaster    |
| `/monitor`       | MonitorPage       | Parent device — stream viewer with HUD         |
| `/dashboard`     | DashboardPage     | Dashboard with live stats, alerts, lullaby gen |
| `/notifications` | NotificationsPage | Full notification history with real-time push  |
| `/profile`       | ProfilePage       | Profile, notification prefs, voice settings    |
| `/onboarding`    | OnboardingPage    | New user onboarding flow                       |
| `/about`         | AboutPage         | About page                                     |
| `/auth-showcase` | AuthShowcase      | Auth component demo                            |

### Key Frontend Features

#### Baby Device Mode (`/baby`)

- **Full-screen camera broadcaster** with mirrored video preview (CSS `scaleX(-1)`)
- HUD overlay: Lullalink branding + red pulse "Live" indicator + Stop button
- Floating status pills: viewer count, last notification event
- Automatic room pairing via Firebase UID
- **Screen Wake Lock API** — keeps screen on while broadcasting, re-acquires on tab visibility change

#### Parent Monitor (`/monitor`)

- **Full-screen stream viewer** with connection status indicators
- Tap-to-toggle HUD with gradient overlays
- **Right-edge floating action buttons:**
  - 🎤 **Talk to Baby** — TTS panel: type a message, sends to ElevenLabs, plays audio on baby device
  - 🎶 **Generate Lullaby** — 6 vibes × 3 durations, inline audio player + download
  - 📊 **Dashboard** — quick link
- Auto-connects to baby device on the same account

#### Dashboard (`/dashboard`)

- **Live stats row**: active monitors (polled every 10s from `/api/status`), unread notification count, server status indicator
- **Daily parenting quote**
- **Baby Monitor card** with live badge + direct link to `/monitor`
- **Recent Alerts** with snapshot thumbnails, real-time updates via Socket.IO
- **Lullaby Generator** widget (vibe + duration picker)
- Framer Motion stagger animations

#### Notifications (`/notifications`)

- Paginated notification list with color-coded types (motion/sound/boundary/unknown)
- Inline snapshot thumbnails from baby camera
- Mark single or all as read
- Real-time push via Socket.IO (`subscribe-notifications` → `new-notification`)

#### Profile & Settings (`/profile`)

- Profile details: display name, email, phone (for SMS alerts)
- Notification preferences: email / SMS / push toggle cards
- **Voice Dubbing** (tabbed UI):
  - **Preset Voices** tab — browse & select from ElevenLabs voice library
  - **My Voice Clone** tab — record audio samples, upload for cloning

### Auth System

- `AuthProvider` wraps the app, exposes `currentUser`, `token`, `loading`
- Primary: Firebase `onAuthStateChanged` → `getIdToken(user, true)` for fresh JWT
- Fallback: reads `idToken` + `user` from `localStorage`/`sessionStorage` for backend-API-only login
- `getAuthToken()` / `setAuthToken()` / `removeAuthToken()` helpers in `utils/api.ts`
- Google OAuth via `signInWithPopup` → backend `POST /api/auth/google`

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

**Response (200):** Same shape as login response with `customToken`.

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "user": {
    "uid": "firebase_uid",
    "email": "parent@example.com",
    "displayName": "Parent Name",
    "mongoId": "mongodb_id"
  }
}
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

**Voice priority:** `voiceId` param → user's custom cloned voice (if `enableCustomVoice` is true) → default ElevenLabs voice

**Model:** `eleven_turbo_v2`

#### Generate Lullaby (Music Generation)

AI-generated instrumental music, ambient sounds, and humming via ElevenLabs Music Generation API (`music_v1`).

```http
POST /api/audio/lullaby
Authorization: Bearer <token>
Content-Type: application/json

{
  "babyDeviceId": "device123",
  "vibe": "lullaby",
  "length": "medium"
}
```

**Response:** `audio/mpeg` binary stream

**Vibes:**
| Vibe | Description |
| --------- | --------------------------------------------------------------- |
| `lullaby` | Soft singing vocals, gentle humming & warm melody (with vocals) |
| `classic` | Music box melody, soft piano arpeggios & warm humming |
| `nature` | Birdsong, crickets, flowing streams with celeste melody |
| `cosmic` | Ethereal synth pads, twinkling chimes, weightless drones |
| `ocean` | Gentle waves, harp glissandos & acoustic guitar |
| `rainy` | Rain on glass, distant thunder & solo piano |

**Durations:**
| Length | Duration |
| -------- | -------- |
| `short` | 30s |
| `medium` | 60s |
| `long` | 120s |

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

Called by the baby monitor camera when an event is detected (via `Broadcaster.tsx` `sendMonitorEvent`).

```http
POST /api/notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "BOUNDARY",
  "snapshot": "base64_jpeg_without_prefix",
  "details": { "side": "left" }
}
```

**Reason codes:** `ACTIVE` → motion, `BOUNDARY` → boundary, `UNKNOWN` → unknown, `SOUND` → sound

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

**Side effects (fire-and-forget):**

- Emits `new-notification` via Socket.IO to `user:<firebaseUid>` room
- Sends email via SendGrid (if `notificationPreferences.email` is `true`)
- Sends SMS via Twilio (if `notificationPreferences.sms` is `true` and `phone` is set)

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

### Motion Events (`/api/motion`)

Receives motion categories from the OpenCV camera monitor, classifies threat level via Gemini AI, logs the event, and triggers notifications for caution/danger events.

#### Log Motion Event

```http
POST /api/motion
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "face_covered",
  "confidence": 0.92,
  "snapshot": "base64_jpeg_without_prefix",
  "metadata": { "bounding_box": [100, 50, 300, 250] }
}
```

**Valid categories:**
| Category | Description |
| ----------------- | ----------------------------------- |
| `still` | Baby lying still / sleeping |
| `slight_movement` | Minor twitching, subtle shifts |
| `rolling` | Rolling over |
| `crawling` | Crawling movement |
| `sitting_up` | Sitting up from lying position |
| `standing` | Pulling to stand / standing |
| `flailing` | Erratic arm/leg flailing |
| `crying_motion` | Body shaking associated with crying |
| `face_covered` | Face covered by blanket/object |
| `out_of_frame` | Baby moved out of camera frame |
| `unknown` | Unclassifiable motion |

**Response (201):**

```json
{
  "id": "motion_log_id",
  "category": "face_covered",
  "confidence": 0.92,
  "threatLevel": "danger",
  "threatReason": "Face appears covered — possible suffocation risk.",
  "notified": true,
  "time": "2026-02-08T12:00:00.000Z"
}
```

**Threat classification (Gemini AI):**
| Threat Level | Meaning | Notification |
| ------------ | ------------------------------------------ | ------------------------- |
| `safe` | Normal behaviour, no concern | No |
| `caution` | Unusual but not immediately dangerous | Yes (email/SMS per prefs) |
| `danger` | Potentially dangerous, immediate attention | Yes (email/SMS per prefs) |

**Side effects (caution/danger only):**

- Creates a `Notification` record
- Emits `new-notification` via Socket.IO
- Sends email via SendGrid (if `notificationPreferences.email`)
- Sends SMS via Twilio (if `notificationPreferences.sms` + `phone`)

**Fallback:** If `GEMINI_API_KEY` is not set, a rule-based classifier is used (e.g. `face_covered` → always `danger`).

#### List Motion Logs (Paginated)

```http
GET /api/motion?page=1&limit=50&threatLevel=danger&category=face_covered
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "logs": [
    {
      "id": "motion_log_id",
      "category": "face_covered",
      "confidence": 0.92,
      "threatLevel": "danger",
      "threatReason": "Face appears covered — possible suffocation risk.",
      "notified": true,
      "time": "2026-02-08T12:00:00.000Z",
      "metadata": {}
    }
  ],
  "total": 120,
  "dangerCount": 3,
  "cautionCount": 15,
  "page": 1,
  "pages": 3
}
```

#### List Valid Categories (Public)

```http
GET /api/motion/categories
```

**Response (200):**

```json
{
  "categories": [
    "still",
    "slight_movement",
    "rolling",
    "crawling",
    "sitting_up",
    "standing",
    "flailing",
    "crying_motion",
    "face_covered",
    "out_of_frame",
    "unknown"
  ]
}
```

---

### �🏥 Health & Status

```http
GET /health          →  { "status": "OK", "message": "Server is running" }
GET /                →  { "message": "Welcome to the TypeScript Express API", "version": "1.0.0", ... }
```

#### Live Server Status

```http
GET /api/status
```

**Response (200):**

```json
{
  "activeMonitors": 1,
  "totalViewers": 2,
  "activeRooms": [{ "roomId": "baby-HCL0S7LxnW", "hasCamera": true, "viewers": 2 }],
  "serverStatus": "online",
  "uptime": 3600.5
}
```

Data is ephemeral (in-memory via Socket.IO rooms), not persisted in MongoDB. Dashboard polls this every 10 seconds.

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

- Custom TURN server via env vars: `TURN_SERVER_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`
- Falls back to free openrelay.metered.ca TURN servers if env vars are not set
- Both Broadcaster and Viewer fetch ICE servers at mount

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

**Used by:** DashboardPage (recent alerts card), NotificationsPage (live list updates)

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

Both devices auto-derive the room ID from the user's Firebase UID:

```
roomId = `baby-${user.uid.slice(0, 12)}`
```

Devices on the **same account** connect automatically without manual room entry.

### Two-Device Setup

| Device Role | URL Path   | Component      | Function                                                            |
| ----------- | ---------- | -------------- | ------------------------------------------------------------------- |
| **Baby**    | `/baby`    | BabyDevicePage | Fullscreen camera broadcaster with mirrored preview, HUD, wake lock |
| **Parent**  | `/monitor` | MonitorPage    | Fullscreen stream viewer with HUD (TTS talk-to-baby + lullaby gen)  |

1. On the **baby device**: Navigate to `/baby`, log in, tap **Start Baby Camera**
2. On the **parent device**: Navigate to `/monitor`, tap **Watch Baby Stream**
3. Both devices auto-pair via the same account — no room ID needed
4. Parent HUD provides TTS (talk to baby) and lullaby generation buttons over the live feed
5. Baby device keeps screen on via Wake Lock API

---

## Database Schemas

### User

```typescript
{
  firebaseUid: string;              // Firebase Auth UID (unique, indexed)
  email: string;                     // Unique, lowercase, trimmed
  displayName?: string;              // Trimmed
  phone?: string;                    // For SMS alerts (E.164 format), trimmed
  customVoiceId?: string;            // ElevenLabs cloned voice ID
  enableCustomVoice: boolean;        // Default: true
  notificationPreferences: {
    email: boolean;                  // Default: true
    sms: boolean;                    // Default: false
    push: boolean;                   // Default: true
  };
  createdAt: Date;                   // Auto (timestamps)
  updatedAt: Date;
}
```

### Notification

```typescript
{
  userId: ObjectId;                  // Ref → User (indexed)
  type: "motion" | "sound" | "boundary" | "unknown" | "system";
  message: string;
  snapshot?: string;                 // Base64 JPEG (320px thumbnail)
  read: boolean;                    // Default: false
  details?: Record<string, unknown>; // Arbitrary metadata
  createdAt: Date;                   // Auto (timestamps)
  updatedAt: Date;
}
// Compound index: { userId: 1, createdAt: -1 }
```

### AudioLog

```typescript
{
  userId: ObjectId;                  // Ref → User
  babyDeviceId: string;
  text: string;                      // Capped at 1000 chars
  voiceId: string;
  duration?: number;
  characterCount: number;
  status: "success" | "failed";      // Default: "success"
  createdAt: Date;                   // Auto (timestamps)
}
```

### MotionLog

```typescript
{
  userId: ObjectId;                  // Ref → User (indexed)
  category: MotionCategory;          // One of 11 predefined categories
  confidence: number;                // 0–1, from OpenCV detector
  threatLevel: "safe" | "caution" | "danger";  // Gemini classification
  threatReason: string;              // Gemini's explanation
  notified: boolean;                 // Whether alert was sent
  snapshot?: string;                 // Base64 JPEG thumbnail
  metadata?: Record<string, unknown>; // Extra data (bounding boxes, etc.)
  createdAt: Date;                   // Auto (timestamps)
  updatedAt: Date;
}
// Indexes: { userId: 1, createdAt: -1 }, { userId: 1, threatLevel: 1 }
```

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Firebase project (Admin SDK + Web API key)
- ElevenLabs API key
- Google Gemini API key (for AI threat classification)
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

# Google Gemini (AI threat classification)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

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

### Dependencies

**Backend:** `express`, `mongoose`, `firebase-admin`, `socket.io`, `cors`, `helmet`, `morgan`, `dotenv`, `formidable`

**Frontend:** `react`, `react-dom`, `react-router-dom`, `firebase`, `socket.io-client`, `tailwindcss`, `@tailwindcss/vite`, `framer-motion`, `lenis`, `@tensorflow/tfjs-core`, `@tensorflow/tfjs-backend-webgl`, `@tensorflow-models/pose-detection`

---

## API Response Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 201  | Created (signup, voice clone, notif) |
| 400  | Bad Request (missing/invalid data)   |
| 401  | Unauthorized (invalid/missing token) |
| 404  | Not Found                            |
| 500  | Internal Server Error                |

## Security

- Firebase JWT token verification on all protected routes
- Helmet.js security headers
- CORS configured for frontend origin
- Environment variable protection (`.env` + `.gitignore`)
- User-specific resource isolation (users can only access their own data)
- Input sanitization on signup (strips `<>`, max 255 chars, email regex, password 6-128 chars)

---

**Built with ❤️ for parents and babies**
