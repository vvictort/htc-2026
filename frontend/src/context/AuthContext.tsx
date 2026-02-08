import { createContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, getIdToken, type User } from "firebase/auth";
import { auth } from "../config/firebase";

interface StoredUser {
  uid: string;
  email: string;
  displayName?: string;
  mongoId?: string;
}

interface AuthContextType {
  currentUser: User | StoredUser | null;
  loading: boolean;
  token: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  token: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Firebase client SDK login (e.g. Google popup)
        try {
          const idToken = await getIdToken(user, true);
          console.log("AuthContext: Got Firebase token for", user.email);
          setCurrentUser(user);
          setToken(idToken);
          sessionStorage.setItem("idToken", idToken);
          localStorage.setItem("idToken", idToken);
        } catch (error) {
          console.error("AuthContext: Failed to get Firebase token", error);
          // Fall through to check storage
          checkStorageAuth();
        }
      } else {
        // No Firebase user — check if logged in via backend API
        console.log("AuthContext: No Firebase user, checking storage...");
        checkStorageAuth();
      }
      setLoading(false);
    });

    function checkStorageAuth() {
      const storedToken = localStorage.getItem("idToken") || sessionStorage.getItem("idToken");
      const storedUserStr = localStorage.getItem("user") || sessionStorage.getItem("user");

      if (storedToken && storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr) as StoredUser;
          console.log("AuthContext: Found stored auth for", storedUser.email);
          setCurrentUser(storedUser);
          setToken(storedToken);
        } catch {
          console.log("AuthContext: Invalid stored user data, clearing");
          setCurrentUser(null);
          setToken(null);
        }
      } else {
        console.log("AuthContext: No stored auth found");
        setCurrentUser(null);
        setToken(null);
      }
    }

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
