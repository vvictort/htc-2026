import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { motion } from "framer-motion";

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
  };
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

  // Sanitize input - remove any potentially harmful characters
  const sanitizeInput = (value: string): string => {
    return value
      .trim()
      .replace(/[<>]/g, "") // Remove angle brackets to prevent XSS
      .substring(0, 255); // Limit length
  };

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (password.length > 128) {
      return "Password is too long";
    }
    return null;
  };

  // Handle input change with sanitization
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    // Clear errors for this field
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
    setApiError("");
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Partial<SignUpFormData> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Display name validation (optional but sanitized)
    if (formData.displayName && formData.displayName.length > 100) {
      newErrors.displayName = "Display name is too long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError("");
    setApiSuccess("");

    // Validate form
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
        // Handle error response
        const errorData = data as ApiError;
        setApiError(errorData.error || "Sign up failed");
      } else {
        // Handle success response
        const successData = data as ApiSuccess;
        setApiSuccess(successData.message || "Account created successfully!");

        // Clear form
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          displayName: "",
        });

        // Mark as new user for onboarding redirection after login
        sessionStorage.setItem("isNewUser", "true");

        // Redirect to login after 2 seconds
        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        } else {
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Sign up error:", error);
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
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
        <p className="text-mid-gray text-center mb-6">Join BabyWatcher today</p>

        {/* Success Message */}
        {apiSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-soft-green/20 border border-soft-green rounded-lg">
            <p className="text-sm text-charcoal font-medium">✓ {apiSuccess}</p>
          </motion.div>
        )}

        {/* Error Message */}
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-soft-red/20 border border-coral rounded-lg">
            <p className="text-sm text-charcoal font-medium">⚠ {apiError}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Display Name */}
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

          {/* Email */}
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

          {/* Password */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-semibold text-charcoal mb-1.5">
              Password <span className="text-coral">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-warm-cream bg-white/50 text-charcoal placeholder:text-light-gray focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all"
            />
            {errors.password && <p className="text-xs text-coral mt-1">{errors.password}</p>}
            <p className="text-xs text-mid-gray mt-1">Minimum 6 characters</p>
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-charcoal mb-1.5">
              Confirm Password <span className="text-coral">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-warm-cream bg-white/50 text-charcoal placeholder:text-light-gray focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all"
            />
            {errors.confirmPassword && <p className="text-xs text-coral mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Link to Login */}
        <p className="text-sm text-center text-mid-gray mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-coral hover:text-coral-dark font-semibold">
            Log In
          </a>
        </p>
      </div>
    </motion.div>
  );
}
