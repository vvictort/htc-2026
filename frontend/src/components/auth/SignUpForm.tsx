import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { signInWithCustomToken, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

interface ApiError {
  error: string;
  details?: string;
}

interface ApiSuccess {
  message: string;
  user: {
    uid: string;
    email: string;
    displayName?: string;
    mongoId?: string;
  };
  idToken?: string;
  refreshToken?: string;
  customToken?: string;
}

interface SignUpFormProps {
  onSuccess?: () => void;
}

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [formData, setFormData] = useState<SignUpFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });
  const [errors, setErrors] = useState<Partial<SignUpFormData>>({});
  const [apiError, setApiError] = useState<string>("");
  const [apiSuccess, setApiSuccess] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (password.length > 128) {
      return "Password is too long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*()_+\-=[]{}|;:,.<>?]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const getPasswordRequirements = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=[]{}|;:,.<>?]/.test(password),
    };
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
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SignUpFormData> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.displayName && formData.displayName.length > 100) {
      newErrors.displayName = "Display name is too long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError("");
    setApiSuccess("");

    if (!validateForm()) {
      return;
    }
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName || undefined,
        }),
      });



      const data: ApiError | ApiSuccess = await response.json();

      if (!response.ok) {
        const errorData = data as ApiError;
        setApiError(errorData.error || "Sign up failed");
      } else {
        const successData = data as ApiSuccess;
        setApiSuccess(successData.message || "Account created successfully!");

        if (successData.customToken) {
          try {
            const userCredential = await signInWithCustomToken(auth, successData.customToken);
            const idToken = await userCredential.user.getIdToken();

            localStorage.setItem("idToken", idToken);
            if (successData.refreshToken) {
              localStorage.setItem("refreshToken", successData.refreshToken);
            }
            localStorage.setItem("user", JSON.stringify(successData.user));

            console.log("✅ Successfully swapped custom token for ID token");
          } catch (authError) {
            console.error("Failed to sign in with custom token:", authError);
            setApiError("Account created, but auto-login failed. Please log in manually.");
          }
        }

        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          displayName: "",
        });

        sessionStorage.setItem("isNewUser", "true");

        if (onSuccess) {
          setTimeout(onSuccess, 1000);
        } else {
          setTimeout(() => {
            window.location.href = "/onboarding";
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Sign up error:", error);
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setApiError("");
    setApiSuccess("");
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
        setApiError(errorData.error || "Google sign-up failed");
        return;
      }
      const successData = data as ApiSuccess;

      localStorage.setItem("idToken", idToken);
      if (successData.refreshToken) {
        localStorage.setItem("refreshToken", successData.refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(successData.user));

      console.log("Google sign-up successful:", successData.user);

      setApiSuccess("Account created successfully! Redirecting...");
      if (onSuccess) {
        setTimeout(onSuccess, 1000);
      } else {
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      }
    } catch (error: any) {
      console.error("Google sign-up error:", error);

      if (error.code === "auth/popup-closed-by-user") {
        setApiError("Sign-up cancelled");
      } else if (error.code === "auth/network-request-failed") {
        setApiError("Network error. Please check your connection.");
      } else if (error.code === "auth/popup-blocked") {
        setApiError("Popup blocked. Please allow popups for this site.");
      } else {
        setApiError("Google sign-up failed. Please try again.");
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
        <h2 className="text-3xl font-extrabold text-charcoal mb-2 text-center">Create Account</h2>
        <p className="text-mid-gray text-center mb-6">Join Lullalink today</p>
        {apiSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-soft-green/20 border border-soft-green rounded-lg">
            <p className="text-sm text-charcoal font-medium">✓ {apiSuccess}</p>
          </motion.div>
        )}
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-soft-red/20 border border-coral rounded-lg">
            <p className="text-sm text-charcoal font-medium">⚠ {apiError}</p>
          </motion.div>
        )}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="displayName" className="block text-sm font-semibold text-charcoal mb-1.5">
              Display Name <span className="text-mid-gray font-normal">(optional)</span>
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-4 py-2.5 rounded-lg border border-warm-cream bg-white/50 text-charcoal placeholder:text-light-gray focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all"
            />
            {errors.displayName && <p className="text-xs text-coral mt-1">{errors.displayName}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-1.5">
              Email Address <span className="text-coral">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-warm-cream bg-white/50 text-charcoal placeholder:text-light-gray focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all"
            />
            {errors.email && <p className="text-xs text-coral mt-1">{errors.email}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-semibold text-charcoal mb-1.5">
              Password <span className="text-coral">*</span>
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
            {formData.password && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-charcoal mb-1.5">Password must contain:</p>
                {Object.entries({
                  minLength: "At least 8 characters",
                  hasUppercase: "One uppercase letter (A-Z)",
                  hasLowercase: "One lowercase letter (a-z)",
                  hasNumber: "One number (0-9)",
                  hasSpecial: "One special character (!@#$%^&*...)",
                }).map(([key, label]) => {
                  const requirements = getPasswordRequirements(formData.password);
                  const isMet = requirements[key as keyof typeof requirements];
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className={`text-xs ${isMet ? "text-soft-green" : "text-mid-gray"}`}>
                        {isMet ? "✓" : "○"}
                      </span>
                      <span className={`text-xs ${isMet ? "text-soft-green font-medium" : "text-mid-gray"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-charcoal mb-1.5">
              Confirm Password <span className="text-coral">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-warm-cream bg-white/50 text-charcoal placeholder:text-light-gray focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all pr-12"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-coral transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                {showConfirmPassword ? (
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
            {errors.confirmPassword && <p className="text-xs text-coral mt-1">{errors.confirmPassword}</p>}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>{" "}
        <p className="text-sm text-center text-mid-gray mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-coral hover:text-coral-dark font-semibold">
            Log In
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
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading || isLoading}
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
            <span className="text-sm font-medium">{isGoogleLoading ? "Signing up..." : "Sign up with Google"}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
