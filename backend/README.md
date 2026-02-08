# Backend - TypeScript Express MongoDB API

A TypeScript-based Node.js backend using Express and MongoDB Atlas.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your MongoDB Atlas credentials:

```bash
cp .env.example .env
```

Edit `.env` and replace the placeholders:
- `<username>` - Your MongoDB Atlas username
- `<password>` - Your MongoDB Atlas password
- `<cluster>` - Your cluster URL
- `<database>` - Your database name

### 3. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm run watch` - Watch mode for TypeScript compilation
- `npm run lint` - Run ESLint

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (database, etc.)
│   ├── controllers/     # Route controllers
│   ├── models/          # MongoDB/Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript (generated)
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore rules
├── package.json        # Project dependencies
└── tsconfig.json       # TypeScript configuration
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api` - API welcome message

## Technologies

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB ODM
- **dotenv** - Environment variable management
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Security headers
- **morgan** - HTTP request logger
