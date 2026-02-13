import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";

interface LoginFormData {
  email: string;
  password: string;
}

interface ApiError {
  error: string;
  details?: string;
  help?: string;
}

interface ApiSuccess {
  message: string;
  user: {
    uid: string;
    email: string;
    displayName?: string;
    mongoId: string;
  };
  idToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [apiError, setApiError] = useState<string>("");
  const [apiHelp, setApiHelp] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const sanitizeInput = (value: string): string => {
    return value
      .trim()
      .replace(/[<>]/g, "")
      .substring(0, 255);
  };
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
    setApiError("");
    setApiHelp("");
  };
  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError("");
    setApiHelp("");
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data: ApiError | ApiSuccess = await response.json();

      if (!response.ok) {
        const errorData = data as ApiError;
        setApiError(errorData.error || "Login failed");
        if (errorData.help) {
          setApiHelp(errorData.help);
        }
      } else {
        const successData = data as ApiSuccess;
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("idToken", successData.idToken);
        storage.setItem("refreshToken", successData.refreshToken);
        storage.setItem("user", JSON.stringify(successData.user));

        console.log("Login successful:", successData.user);
        if (onSuccess) {
          onSuccess();
        } else {
          const isNewUser = sessionStorage.getItem("isNewUser") === "true";
          if (isNewUser) {
            sessionStorage.removeItem("isNewUser");
            setTimeout(() => {
              window.location.href = "/onboarding";
            }, 500);
          } else {
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setApiError("");
    setApiHelp("");
    setIsGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: idToken,
        }),
      });

      const data: ApiError | ApiSuccess = await response.json();

      if (!response.ok) {
        const errorData = data as ApiError;
        setApiError(errorData.error || "Google sign-in failed");
        if (errorData.help) {
          setApiHelp(errorData.help);
        }
        return;
      }
      const successData = data as ApiSuccess;
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("idToken", successData.idToken);
      if (successData.refreshToken) {
        storage.setItem("refreshToken", successData.refreshToken);
      }
      storage.setItem("user", JSON.stringify(successData.user));

      console.log("Google sign-in successful:", successData.user);
      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          window.location.href = "/monitor";
        }, 500);
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);

      if (error.code === "auth/popup-closed-by-user") {
        setApiError("Sign-in cancelled");
      } else if (error.code === "auth/network-request-failed") {
        setApiError("Network error. Please check your connection.");
      } else if (error.code === "auth/popup-blocked") {
        setApiError("Popup blocked. Please allow popups for this site.");
      } else {
        setApiError("Google sign-in failed. Please try again.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-card border border-white/60 shadow-[0_20px_50px_rgba(31,29,43,0.15)] p-8">
        <h2 className="text-3xl font-extrabold text-charcoal mb-2 text-center">Welcome Back</h2>
        <p className="text-mid-gray text-center mb-6">Log in to your Lullalink account</p>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-soft-red/20 border border-coral rounded-lg">
            <p className="text-sm text-charcoal font-medium">⚠ {apiError}</p>
            {apiHelp && <p className="text-xs text-mid-gray mt-1">{apiHelp}</p>}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-4 py-2.5 rounded-lg border border-warm-cream bg-white/50 text-charcoal placeholder:text-light-gray focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all"
            />
            {errors.email && <p className="text-xs text-coral mt-1">{errors.email}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-semibold text-charcoal mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-lg border border-warm-cream bg-white/50 text-charcoal placeholder:text-light-gray focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all pr-12"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-coral transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-xs text-coral mt-1">{errors.password}</p>}
          </div>
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-warm-cream text-coral focus:ring-coral/50 cursor-pointer"
              />
              <span className="text-sm text-mid-gray">Remember me</span>
            </label>
            <a href="/forgot-password" className="text-sm text-coral hover:text-coral-dark font-semibold">
              Forgot password?
            </a>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? "Logging In..." : "Log In"}
          </button>
        </form>
        <p className="text-sm text-center text-mid-gray mt-6">
          Don't have an account?{" "}
          <a href="/signup" className="text-coral hover:text-coral-dark font-semibold">
            Sign Up
          </a>
        </p>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-warm-cream"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-light-gray">Or continue with</span>
          </div>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-warm-cream bg-white/50 text-charcoal hover:bg-warm-cream/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-sm font-medium">{isGoogleLoading ? "Signing in..." : "Sign in with Google"}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
