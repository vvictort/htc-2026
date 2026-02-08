import { createContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, getIdToken, type User } from "firebase/auth";
import { auth } from "../config/firebase";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  token: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  token: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const idToken = await getIdToken(user);
        setToken(idToken);
        // Sync token to session/local storage for existing API calls
        sessionStorage.setItem("idToken", idToken);
      } else {
        setToken(null);
        sessionStorage.removeItem("idToken");
        localStorage.removeItem("idToken");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
