# Backend Structure

```
backend/
├── src/
│   ├── features/           # Feature-based modules
│   │   ├── auth/          # Authentication feature
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.routes.ts
│   │   │
│   │   └── audio/         # Audio/TTS feature
│   │       ├── audio.controller.ts
│   │       └── audio.routes.ts
│   │
│   ├── shared/            # Shared resources
│   │   ├── config/        # Configuration files
│   │   │   ├── database.ts
│   │   │   └── firebase.ts
│   │   │
│   │   ├── middleware/    # Express middleware
│   │   │   └── authMiddleware.ts
│   │   │
│   │   └── models/        # MongoDB models
│   │       └── User.ts
│   │
│   └── index.ts           # Main app entry
│
├── dist/                  # Compiled JavaScript
├── .env                   # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Features

### 🔐 Auth Feature (`features/auth/`)
- User signup/login
- Firebase authentication
- MongoDB user management

### 🎵 Audio Feature (`features/audio/`)
- Text-to-speech with ElevenLabs
- Audio streaming (no storage)
- Voice management

### 📦 Shared (`shared/`)
- **config/**: Database and Firebase setup
- **middleware/**: Authentication middleware
- **models/**: MongoDB schemas

## API Endpoints

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Audio
- `POST /api/audio/stream` - Generate and stream MP3
- `GET /api/audio/voices` - Get available voices
