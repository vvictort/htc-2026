# Authentication Components

This directory contains the authentication forms for the BabyWatcher application.

## Components

### 1. SignUpForm
A fully validated sign-up form with input sanitization and user feedback.

**Location:** `src/components/auth/SignUpForm.tsx`

**Features:**
- Input sanitization (removes XSS vectors)
- Email format validation
- Password strength validation (min 6 characters)
- Password confirmation matching
- Optional display name field
- Real-time field validation
- Success/error messaging with animations
- Loading states
- Automatic redirect to login after successful signup

**Props:** None (self-contained)

**Usage:**
```tsx
import { SignUpForm } from '@/components/auth';

function SignUpPage() {
  return <SignUpForm />;
}
```

### 2. LoginForm
A secure login form with credential validation and token management.

**Location:** `src/components/auth/LoginForm.tsx`

**Features:**
- Input sanitization
- Email format validation
- Remember me functionality (localStorage vs sessionStorage)
- Token storage management
- Detailed error messages from backend
- Help text for Firebase configuration issues
- Social login UI (Google, GitHub - disabled for future implementation)
- Automatic redirect to dashboard after successful login

**Props:** None (self-contained)

**Usage:**
```tsx
import { LoginForm } from '@/components/auth';

function LoginPage() {
  return <LoginForm />;
}
```

## Security Features

### Input Sanitization
Both forms sanitize all user input to prevent XSS attacks:
- Removes angle brackets (`<>`)
- Trims whitespace
- Limits input length (max 255 characters)

```typescript
const sanitizeInput = (value: string): string => {
    return value
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .substring(0, 255);   // Limit length
};
```

### Validation Rules

**Email:**
- Required field
- Must match email format regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Password (Sign Up):**
- Required field
- Minimum 6 characters
- Maximum 128 characters
- Must match confirmation password

**Password (Login):**
- Required field
- No length restrictions (handled by backend)

**Display Name (Sign Up):**
- Optional field
- Maximum 100 characters

## API Integration

Both forms communicate with the backend API endpoints:

**Sign Up Endpoint:**
```
POST /api/auth/signup
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"  // optional
}
```

**Login Endpoint:**
```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123"
}
```

The API base URL is configured via environment variable:
```env
VITE_API_URL=http://localhost:5000/api
```

## User Feedback

### Success Messages
- Displayed with green background and checkmark icon
- Animated entrance (fade + slide)
- Auto-redirect after 2 seconds (signup) or 0.5 seconds (login)

### Error Messages
- Displayed with red/coral background and warning icon
- Shows specific error from backend
- Includes help text when available
- Field-level errors shown below inputs

### Loading States
- Button text changes to "Creating Account..." or "Logging In..."
- Button is disabled during API call
- Prevents multiple submissions

## Token Management

After successful login, the following data is stored:

```typescript
// Storage type depends on "Remember Me" checkbox
const storage = rememberMe ? localStorage : sessionStorage;

// Stored items:
storage.setItem('idToken', successData.idToken);
storage.setItem('refreshToken', successData.refreshToken);
storage.setItem('user', JSON.stringify(successData.user));
```

**Token Structure:**
- `idToken`: Firebase JWT token for authenticated requests
- `refreshToken`: Token for refreshing the idToken
- `user`: User object with uid, email, displayName, mongoId

## Styling

Forms use the BabyWatcher design system:

**Colors:**
- `--color-coral`: Primary action color
- `--color-charcoal`: Text color
- `--color-mid-gray`: Secondary text
- `--color-warm-cream`: Border/background
- `--color-soft-red`: Error messages
- `--color-soft-green`: Success messages

**Components:**
- `.btn-primary`: Primary action button with gradient
- Custom input styling with focus states
- Backdrop blur effects with transparency
- Smooth transitions and animations

## Testing

See `AUTH_API_TESTING.md` in the root directory for:
- curl commands to test endpoints
- PowerShell test script
- Bash test script
- Complete testing checklist

## Pages

The forms are used in dedicated pages:

**Sign Up Page:** `/signup`
- Full-screen centered layout
- Logo at top
- Form in center
- "Back to Home" link at bottom

**Login Page:** `/login`
- Same layout as Sign Up page
- Additional "Forgot Password?" link
- Social login options (UI only, disabled)

## Accessibility

- Proper `<label>` elements with `htmlFor` attributes
- `required` attributes on required fields
- `autocomplete` attributes for browser autofill
- Focus states with visible outlines
- Keyboard navigation support
- ARIA-compliant form structure

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- CSS custom properties
- Flexbox layout
- Backdrop filters

## Future Enhancements

- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Google OAuth integration
- [ ] GitHub OAuth integration
- [ ] Password strength indicator
- [ ] Show/hide password toggle
- [ ] Rate limiting on client side
- [ ] CAPTCHA integration
- [ ] Profile picture upload during signup

## Error Handling

### Network Errors
```typescript
catch (error) {
    setApiError('Network error. Please check your connection and try again.');
}
```

### Backend Errors
```typescript
if (!response.ok) {
    const errorData = data as ApiError;
    setApiError(errorData.error || 'Operation failed');
    if (errorData.help) {
        setApiHelp(errorData.help);
    }
}
```

### Validation Errors
```typescript
const newErrors: Partial<FormData> = {};
if (!formData.email) {
    newErrors.email = 'Email is required';
}
setErrors(newErrors);
```

## Dependencies

- `react`: UI framework
- `framer-motion`: Animations
- `react-router-dom`: Navigation (via pages)

No additional form libraries required - validation is built-in.
