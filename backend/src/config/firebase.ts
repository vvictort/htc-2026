import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
    try {
        // Check if required environment variables are set
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!projectId || !clientEmail || !privateKey) {
            console.warn('Firebase configuration is missing - running without Firebase auth');
            return;
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });

        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        console.warn('Continuing without Firebase authentication');
    }
};

export { admin, initializeFirebase };
