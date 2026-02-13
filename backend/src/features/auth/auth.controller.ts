import { Request, Response } from "express";
import { admin } from "../../shared/config/firebase";
import User from "../../shared/models/User";

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

export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters long" });
      return;
    }

    if (!/[A-Z]/.test(password)) {
      res.status(400).json({ error: "Password must contain at least one uppercase letter" });
      return;
    }

    if (!/[a-z]/.test(password)) {
      res.status(400).json({ error: "Password must contain at least one lowercase letter" });
      return;
    }

    if (!/[0-9]/.test(password)) {
      res.status(400).json({ error: "Password must contain at least one number" });
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      res
        .status(400)
        .json({ error: "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)" });
      return;
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || undefined,
    });

    const newUser = new User({
      firebaseUid: userRecord.uid,
      email: userRecord.email,
      displayName: displayName || undefined,
    });
    await newUser.save();
    console.log(`✓ User created in MongoDB: ${userRecord.uid}`);

    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    res.status(201).json({
      message: "User created successfully",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        mongoId: newUser._id,
      },
      customToken: customToken,
    });
  } catch (error: any) {
    console.error("Sign up error:", error);

    if (error.code === "auth/email-already-exists") {
      res.status(400).json({ error: "Email already exists" });
      return;
    }

    if (error.code === 11000) {
      res.status(400).json({ error: "User already exists in database" });
      return;
    }

    res.status(500).json({ error: "Failed to create user", details: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const apiKey = process.env.FIREBASE_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: "Firebase API key not configured" });
      return;
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    );

    const data = (await response.json()) as FirebaseAuthResponse | FirebaseErrorResponse;

    if (!response.ok) {
      const errorData = data as FirebaseErrorResponse;
      const errorMessage = errorData.error?.message || "Login failed";
      console.error("Firebase login error:", errorData.error);

      if (errorMessage.includes("INVALID_PASSWORD") || errorMessage.includes("EMAIL_NOT_FOUND")) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      if (errorMessage.includes("API key not valid")) {
        res.status(400).json({
          error: "Invalid Firebase API key. Check your .env file",
          details: errorMessage,
        });
        return;
      }

      res.status(400).json({
        error: errorMessage,
        help: "Make sure Email/Password auth is enabled in Firebase Console",
      });
      return;
    }

    const authData = data as FirebaseAuthResponse;
    const userRecord = await admin.auth().getUser(authData.localId);

    let mongoUser = await User.findOne({ firebaseUid: authData.localId });

    if (!mongoUser) {
      mongoUser = new User({
        firebaseUid: authData.localId,
        email: userRecord.email,
        displayName: userRecord.displayName,
      });
      await mongoUser.save();
      console.log(`✓ Created MongoDB record for existing Firebase user: ${authData.localId}`);
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        mongoId: mongoUser._id,
      },
      idToken: authData.idToken,
      refreshToken: authData.refreshToken,
      expiresIn: authData.expiresIn,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed", details: error.message });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userRecord = await admin.auth().getUser(req.user.uid);

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
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user info" });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ error: "Google ID token is required" });
      return;
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userRecord = await admin.auth().getUser(uid);

    let mongoUser = await User.findOne({ firebaseUid: uid });
    let isNewUser = false;

    if (!mongoUser) {
      mongoUser = new User({
        firebaseUid: uid,
        email: userRecord.email,
        displayName: userRecord.displayName || userRecord.email?.split("@")[0],
      });
      await mongoUser.save();
      isNewUser = true;
      console.log(`✓ Created MongoDB record for Google user: ${uid}`);
    }

    const customToken = await admin.auth().createCustomToken(uid);

    res.status(200).json({
      message: isNewUser ? "Account created successfully" : "Google login successful",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        mongoId: mongoUser._id,
      },
      idToken: idToken,
      customToken: customToken,
      expiresIn: "3600",
    });
  } catch (error: any) {
    console.error("Google auth error:", error);

    if (error.code === "auth/id-token-expired") {
      res.status(401).json({ error: "Google token expired. Please sign in again." });
      return;
    }

    if (error.code === "auth/invalid-id-token") {
      res.status(401).json({ error: "Invalid Google token" });
      return;
    }

    res.status(500).json({ error: "Google authentication failed", details: error.message });
  }
};
