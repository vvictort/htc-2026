# HTC-2026 - Baby Monitor Application 👶🎵

A modern baby monitor application with real-time audio messaging and voice cloning capabilities. Parents can send text messages that are converted to audio using their own voice, creating a personalized and comforting experience for babies.

## Project Structure

```
htc-2026/
├── backend/                      # TypeScript Node.js API server
│   ├── src/
│   │   ├── features/            # Feature-based modules
│   │   │   ├── auth/           # Authentication feature
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── auth.routes.ts
│   │   │   └── audio/          # Audio/TTS feature
│   │   │       ├── audio.controller.ts
│   │   │       └── audio.routes.ts
│   │   │
│   │   ├── shared/             # Shared resources
│   │   │   ├── config/         # Configuration files
│   │   │   │   ├── database.ts
│   │   │   │   └── firebase.ts
│   │   │   ├── middleware/     # Express middleware
│   │   │   │   └── authMiddleware.ts
│   │   │   └── models/         # MongoDB models
│   │   │       └── User.ts
│   │   │
│   │   └── index.ts            # Main app entry point
│   │
│   ├── dist/                   # Compiled JavaScript output
│   ├── .env                    # Environment variables
│   ├── .gitignore             # Git ignore rules
│   ├── package.json           # Dependencies & scripts
│   ├── tsconfig.json          # TypeScript configuration
│   └── node_modules/          # Installed packages
│
└── README.md                   # This file
```

## Backend Overview

### Technology Stack

| Technology     | Version   | Purpose                          |
| -------------- | --------- | -------------------------------- |
| **Node.js**    | 18+       | JavaScript runtime               |
| **TypeScript** | 5.3.3     | Type-safe development            |
| **Express**    | 4.18.2    | Web framework                    |
| **MongoDB**    | Atlas     | Database (Mongoose 8.0.3)        |
| **Firebase**   | Admin SDK | Authentication & user management |
| **ElevenLabs** | API v1    | Text-to-speech & voice cloning   |
| **Formidable** | Latest    | Multipart file uploads           |

### Additional Packages
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logging
- **dotenv** - Environment variable management
- **ts-node-dev** - Development hot reload
- **formidable** - Multipart form data parsing

## RESTful API Endpoints

Base URL: `http://localhost:5000`

### 🔐 Authentication

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "securePassword123",
  "displayName": "Parent Name"
}
```
**Response:**
```json
{
  "message": "User created successfully",
  "firebaseUid": "firebase_uid_here",
  "mongoUserId": "mongodb_id_here",
  "email": "parent@example.com"
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
**Response:**
```json
{
  "message": "Login successful",
  "token": "firebase_jwt_token",
  "user": {
    "uid": "firebase_uid",
    "email": "parent@example.com",
    "mongoUserId": "mongodb_id"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <firebase-token>
```
**Response:**
```json
{
  "_id": "mongodb_id",
  "firebaseUid": "firebase_uid",
  "email": "parent@example.com",
  "displayName": "Parent Name",
  "customVoiceId": "elevenlabs_voice_id",
  "createdAt": "2026-02-07T...",
  "updatedAt": "2026-02-07T..."
}
```

---

### 🎵 Audio / Text-to-Speech

#### Generate & Stream Audio
```http
POST /api/audio/stream
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "text": "Hello sweetie, time for your nap!",
  "babyDeviceId": "device123",
  "voiceId": "optional-voice-id"  // Optional: Override voice
}
```
**Response:** MP3 audio file (streamed directly)

**Behavior:**
- If user has `customVoiceId` → uses custom voice automatically
- If `voiceId` provided → uses specified voice
- Otherwise → uses default voice

#### Get Available Voices
```http
GET /api/audio/voices
Authorization: Bearer <firebase-token>
```
**Response:**
```json
{
  "voices": [
    {
      "voice_id": "abc123",
      "name": "Rachel",
      "category": "premade",
      "description": "..."
    }
  ]
}
```

---

### 🎤 Voice Cloning / Dubbing

#### Create Custom Voice
```http
POST /api/audio/voice/clone
Authorization: Bearer <firebase-token>
Content-Type: multipart/form-data

Form Fields:
- name: "Mom's Voice" (required)
- description: "My custom voice" (optional)
- samples: [audio_file_1.mp3, audio_file_2.mp3] (required)
```
**Response:**
```json
{
  "message": "Custom voice created successfully",
  "voiceId": "elevenlabs_voice_id",
  "voiceName": "Mom's Voice",
  "user": {
    "id": "mongodb_id",
    "email": "parent@example.com",
    "customVoiceId": "elevenlabs_voice_id"
  }
}
```

**Requirements:**
- Audio samples: 1-3 minutes total
- Formats: MP3, WAV, FLAC, OGG
- Quality: Clear audio, minimal background noise

#### Get Custom Voice Details
```http
GET /api/audio/voice/custom
Authorization: Bearer <firebase-token>
```
**Response:**
```json
{
  "voice_id": "abc123xyz",
  "name": "Mom's Voice",
  "category": "cloned",
  "samples": [...],
  "settings": {...}
}
```

#### Delete Custom Voice
```http
DELETE /api/audio/voice/custom
Authorization: Bearer <firebase-token>
```
**Response:**
```json
{
  "message": "Custom voice deleted successfully"
}
```

---

### 🏥 Health & Status

#### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

#### Root Endpoint
```http
GET /
```
**Response:**
```json
{
  "message": "Welcome to the TypeScript Express API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "api": "/api"
  }
}
```

## Database Schema

### User Model
```typescript
{
  firebaseUid: string;       // Unique Firebase authentication UID
  email: string;             // User email (unique)
  displayName?: string;      // Optional display name
  customVoiceId?: string;    // ElevenLabs custom voice ID (optional)
  createdAt: Date;           // Auto-generated timestamp
  updatedAt: Date;           // Auto-updated timestamp
}
```

**Indexes:**
- `firebaseUid` (unique)
- `email` (unique)

## Features

### 🔐 Secure Authentication
- Firebase Authentication with JWT tokens
- Password hashing via Firebase (scrypt algorithm)
- Protected routes with middleware verification
- MongoDB user reference documents

### 🎵 Text-to-Speech
- High-quality audio generation via ElevenLabs
- Multiple voice options
- Direct MP3 streaming (no storage overhead)
- Supports custom voice models

### 🎤 Voice Cloning
- Parent voice duplication from audio samples
- Automatic voice selection for authenticated users
- ElevenLabs voice cloning API integration
- Per-user voice management (create, view, delete)

### 📡 Audio Streaming
- Real-time audio delivery
- No database storage (512MB Atlas free tier optimization)
- Direct buffer streaming to devices
- Device-specific routing via `babyDeviceId`

## Setup & Installation

### Prerequisites
- Node.js 18 or higher
- MongoDB Atlas account
- Firebase project with Admin SDK
- ElevenLabs API key

### Environment Variables

Create `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Web API
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=default_voice_id
```

### Installation

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Development

```bash
# Start with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

Server runs on `http://localhost:5000`

## API Response Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 201  | Created (signup, voice clone)        |
| 400  | Bad Request (missing/invalid data)   |
| 401  | Unauthorized (invalid/missing token) |
| 404  | Not Found (resource doesn't exist)   |
| 500  | Internal Server Error                |

## Security Features

✅ Firebase JWT token verification  
✅ Helmet.js security headers  
✅ CORS enabled for frontend  
✅ Environment variable protection  
✅ Firebase scrypt password hashing  
✅ User-specific resource isolation  
✅ Temporary file cleanup  

## Limitations & Considerations

### MongoDB Atlas Free Tier
- 512MB storage limit
- Audio NOT stored in database (streamed only)
- User metadata only

### ElevenLabs Free Tier
- 10,000 characters/month for TTS
- Limited voice cloning quota
- Uses `eleven_turbo_v2` model

### Firebase
- Per-project rate limits apply
- Authentication quotas

## Documentation

- **Backend README:** [backend/README.md](backend/README.md)
- **Architecture:** [backend/STRUCTURE.md](backend/STRUCTURE.md)
- **Voice Cloning Guide:** [backend/VOICE_DUBBING.md](backend/VOICE_DUBBING.md)

## Technology Decisions

### Why TypeScript?
- Type safety reduces runtime errors
- Better IDE support and autocomplete
- Easier refactoring and maintenance

### Why Feature-Based Architecture?
- Clear separation of concerns
- Scalable structure
- Easy to locate related code
- Supports team collaboration



### Why ElevenLabs?
- High-quality voice synthesis
- Voice cloning capabilities
- Simple REST API
- Multiple voice options

### Why Audio Streaming?
- MongoDB free tier only 512MB
- Audio files would quickly exceed storage
- Real-time delivery to devices
- No cleanup required

## Workflow

### Parent Authentication
```
1. Parent signs up with email/password
   ↓
2. Firebase creates authentication record
   ↓
3. Backend creates MongoDB user document
   ↓
4. Parent receives JWT token
```

### Voice Cloning Setup
```
1. Parent uploads audio samples (1-3 minutes)
   ↓
2. Backend sends to ElevenLabs API
   ↓
3. ElevenLabs creates custom voice
   ↓
4. Voice ID saved to user's MongoDB document
```

### Sending Audio Message
```
1. Parent enters text message
   ↓
2. Backend checks for user's custom voice
   ↓
3. Generates audio with ElevenLabs
   ↓
4. Streams MP3 to baby's device
   ↓
5. Baby hears parent's voice
```

## Future Enhancements

- 🔄 WebSocket support for real-time notifications
- 📱 Mobile app integration
- 🔊 Audio playback history
- 👥 Multiple baby device management
- 🎨 Voice effect customization
- 📊 Usage analytics dashboard

## Contributing

1. Create feature branch
2. Make changes with TypeScript
3. Test all endpoints
4. Update documentation
5. Submit pull request

## License

MIT

## Contact

For questions or support, contact the development team.

---

**Built with ❤️ for parents and babies**