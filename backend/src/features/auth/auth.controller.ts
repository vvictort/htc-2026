import { Request, Response } from 'express';
import { admin } from '../../shared/config/firebase';
import User from '../../shared/models/User';

// Firebase REST API response types
interface FirebaseAuthResponse {
    localId: string;
    idToken: string;
    refreshToken: string;
    expiresIn: string;
}

interface FirebaseErrorResponse {
    error?: {
        message: string;
    };
}

// Sign up - Create new user with Firebase Auth
export const signUp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, displayName } = req.body;

        // Validate input
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }

        // Create user in Firebase Auth (Firebase handles password hashing automatically with scrypt)
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: displayName || undefined,
        });

        // Create MongoDB reference for this Firebase user
        const newUser = new User({
            firebaseUid: userRecord.uid,
            email: userRecord.email,
            displayName: displayName || undefined,
        });
        await newUser.save();
        console.log(`✓ User created in MongoDB: ${userRecord.uid}`);

        // Generate custom token for immediate login
        const customToken = await admin.auth().createCustomToken(userRecord.uid);

        res.status(201).json({
            message: 'User created successfully',
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                mongoId: newUser._id,
            },
            customToken: customToken,
        });
    } catch (error: any) {
        console.error('Sign up error:', error);

        if (error.code === 'auth/email-already-exists') {
            res.status(400).json({ error: 'Email already exists' });
            return;
        }

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            res.status(400).json({ error: 'User already exists in database' });
            return;
        }

        res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
};

// Login - Verify credentials using Firebase REST API and return token
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const apiKey = process.env.FIREBASE_API_KEY;

        if (!apiKey) {
            res.status(500).json({ error: 'Firebase API key not configured' });
            return;
        }

        // Call Firebase REST API to verify credentials
        const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    returnSecureToken: true,
                }),
            }
        );

        const data = await response.json() as FirebaseAuthResponse | FirebaseErrorResponse;

        if (!response.ok) {
            const errorData = data as FirebaseErrorResponse;
            const errorMessage = errorData.error?.message || 'Login failed';
            console.error('Firebase login error:', errorData.error);

            if (errorMessage.includes('INVALID_PASSWORD') || errorMessage.includes('EMAIL_NOT_FOUND')) {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }

            if (errorMessage.includes('API key not valid')) {
                res.status(400).json({
                    error: 'Invalid Firebase API key. Check your .env file',
                    details: errorMessage
                });
                return;
            }

            res.status(400).json({
                error: errorMessage,
                help: 'Make sure Email/Password auth is enabled in Firebase Console'
            });
            return;
        }

        // Get user details from Firebase Admin
        const authData = data as FirebaseAuthResponse;
        const userRecord = await admin.auth().getUser(authData.localId);

        // Get or create MongoDB user record
        let mongoUser = await User.findOne({ firebaseUid: authData.localId });

        if (!mongoUser) {
            // Create MongoDB record if it doesn't exist (for legacy users)
            mongoUser = new User({
                firebaseUid: authData.localId,
                email: userRecord.email,
                displayName: userRecord.displayName,
            });
            await mongoUser.save();
            console.log(`✓ Created MongoDB record for existing Firebase user: ${authData.localId}`);
        }

        res.status(200).json({
            message: 'Login successful',
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                mongoId: mongoUser._id, // MongoDB reference ID
            },
            idToken: authData.idToken,
            refreshToken: authData.refreshToken,
            expiresIn: authData.expiresIn,
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
};

// Get current user info (requires authentication)
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const userRecord = await admin.auth().getUser(req.user.uid);

        // Get MongoDB user data
        const mongoUser = await User.findOne({ firebaseUid: req.user.uid });

        res.status(200).json({
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                emailVerified: userRecord.emailVerified,
                createdAt: userRecord.metadata.creationTime,
                mongoId: mongoUser?._id,
            },
        });
    } catch (error: any) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
};

// Google OAuth Login/Sign-Up - Verify Google ID token and return custom token
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idToken } = req.body;

        // Validate input
        if (!idToken) {
            res.status(400).json({ error: 'Google ID token is required' });
            return;
        }

        // Verify the Google ID token using Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Get user details from Firebase
        const userRecord = await admin.auth().getUser(uid);

        // Get or create MongoDB user record
        let mongoUser = await User.findOne({ firebaseUid: uid });
        let isNewUser = false;

        if (!mongoUser) {
            // Create MongoDB record for new Google user
            mongoUser = new User({
                firebaseUid: uid,
                email: userRecord.email,
                displayName: userRecord.displayName || userRecord.email?.split('@')[0],
            });
            await mongoUser.save();
            isNewUser = true;
            console.log(`✓ Created MongoDB record for Google user: ${uid}`);
        }

        // Generate a custom token (optional, for refresh purposes)
        const customToken = await admin.auth().createCustomToken(uid);

        res.status(200).json({
            message: isNewUser ? 'Account created successfully' : 'Google login successful',
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                photoURL: userRecord.photoURL,
                mongoId: mongoUser._id,
            },
            idToken: idToken, // Return the same token
            customToken: customToken,
            expiresIn: '3600', // Google tokens expire in 1 hour
        });
    } catch (error: any) {
        console.error('Google auth error:', error);

        if (error.code === 'auth/id-token-expired') {
            res.status(401).json({ error: 'Google token expired. Please sign in again.' });
            return;
        }

        if (error.code === 'auth/invalid-id-token') {
            res.status(401).json({ error: 'Invalid Google token' });
            return;
        }

        res.status(500).json({ error: 'Google authentication failed', details: error.message });
    }
};
