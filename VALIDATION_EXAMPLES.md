# Form Validation Examples

This document shows examples of how the form validation works with specific test cases.

## Sign Up Form Validation

### Test Case 1: Empty Fields
**Input:**
- Email: (empty)
- Password: (empty)
- Confirm Password: (empty)

**Result:**
```
❌ Email: "Email is required"
❌ Password: "Password is required"
❌ Confirm Password: "Please confirm your password"
```

### Test Case 2: Invalid Email Format
**Input:**
- Email: "notanemail"
- Password: "password123"
- Confirm Password: "password123"

**Result:**
```
❌ Email: "Please enter a valid email address"
✅ Password: Valid
✅ Confirm Password: Valid
```

### Test Case 3: Short Password
**Input:**
- Email: "user@example.com"
- Password: "12345"
- Confirm Password: "12345"

**Result:**
```
✅ Email: Valid
❌ Password: "Password must be at least 6 characters"
✅ Confirm Password: Matches (but password invalid)
```

### Test Case 4: Password Mismatch
**Input:**
- Email: "user@example.com"
- Password: "password123"
- Confirm Password: "password456"

**Result:**
```
✅ Email: Valid
✅ Password: Valid
❌ Confirm Password: "Passwords do not match"
```

### Test Case 5: XSS Attempt (Sanitized)
**Input:**
- Email: "<script>alert('xss')</script>@example.com"
- Password: "password123"
- Display Name: "<img src=x onerror=alert(1)>"

**After Sanitization:**
```
Email: "scriptalert('xss')/script@example.com"
Display Name: "img src=x onerror=alert(1)"
```
Note: Angle brackets are removed automatically

### Test Case 6: Valid Submission
**Input:**
- Email: "john.doe@example.com"
- Password: "securePass123"
- Confirm Password: "securePass123"
- Display Name: "John Doe"

**Result:**
```
✅ All validations pass
→ API call made
→ Success message shown
→ Redirect to login in 2 seconds
```

**API Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "uid": "firebase-uid-12345",
    "email": "john.doe@example.com",
    "displayName": "John Doe"
  }
}
```

### Test Case 7: Duplicate Email
**Input:**
- Email: "existing@example.com" (already registered)
- Password: "password123"
- Confirm Password: "password123"

**Result:**
```
✅ Client validation passes
→ API call made
❌ Backend error: "Email already exists"
```

**API Response (400):**
```json
{
  "error": "Email already exists"
}
```

---

## Login Form Validation

### Test Case 1: Empty Fields
**Input:**
- Email: (empty)
- Password: (empty)

**Result:**
```
❌ Email: "Email is required"
❌ Password: "Password is required"
```

### Test Case 2: Invalid Email Format
**Input:**
- Email: "not.an.email"
- Password: "password123"

**Result:**
```
❌ Email: "Please enter a valid email address"
✅ Password: Valid (format)
```

### Test Case 3: Valid Format, Wrong Credentials
**Input:**
- Email: "user@example.com"
- Password: "wrongpassword"

**Result:**
```
✅ Client validation passes
→ API call made
❌ Backend error: "Invalid email or password"
```

**API Response (401):**
```json
{
  "error": "Invalid email or password"
}
```

### Test Case 4: Non-existent Email
**Input:**
- Email: "nonexistent@example.com"
- Password: "password123"

**Result:**
```
✅ Client validation passes
→ API call made
❌ Backend error: "Invalid email or password"
```
Note: Same error message for security (don't reveal if email exists)

### Test Case 5: Valid Login
**Input:**
- Email: "john.doe@example.com"
- Password: "securePass123"
- Remember Me: ✓ Checked

**Result:**
```
✅ All validations pass
→ API call made
✅ Success! Tokens stored in localStorage
→ Redirect to /monitor in 0.5 seconds
```

**API Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "uid": "firebase-uid-12345",
    "email": "john.doe@example.com",
    "displayName": "John Doe",
    "mongoId": "mongodb-id-67890"
  },
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "AMf-vBzX...",
  "expiresIn": "3600"
}
```

**Stored in localStorage:**
```javascript
localStorage.getItem('idToken')      // "eyJhbGciOiJSUzI1NiIs..."
localStorage.getItem('refreshToken') // "AMf-vBzX..."
localStorage.getItem('user')         // '{"uid":"...","email":"...",...}'
```

### Test Case 6: Valid Login (Without Remember Me)
**Input:**
- Email: "jane@example.com"
- Password: "mypass123"
- Remember Me: ☐ Not checked

**Result:**
```
✅ All validations pass
→ API call made
✅ Success! Tokens stored in sessionStorage
→ Redirect to /monitor in 0.5 seconds
```

**Stored in sessionStorage (cleared when browser closes):**
```javascript
sessionStorage.getItem('idToken')      // "eyJhbGciOiJSUzI1NiIs..."
sessionStorage.getItem('refreshToken') // "AMf-vBzX..."
sessionStorage.getItem('user')         // '{"uid":"...","email":"...",...}'
```

---

## Network Error Handling

### Test Case: Backend Not Running
**Input:**
- Any valid form data
- Backend server is stopped

**Result:**
```
✅ Client validation passes
→ API call attempted
❌ Network error caught
Error message: "Network error. Please check your connection and try again."
```

### Test Case: Invalid API URL
**Environment:**
```env
VITE_API_URL=http://wrong-url:9999/api
```

**Result:**
```
✅ Client validation passes
→ API call attempted
❌ Network error (connection refused)
Error message: "Network error. Please check your connection and try again."
```

---

## Input Sanitization Examples

### Example 1: HTML Tags Removed
**Before Sanitization:**
```javascript
displayName = "<b>Bold Name</b>"
email = "<script>alert('xss')</script>@test.com"
```

**After Sanitization:**
```javascript
displayName = "bBold Name/b"
email = "scriptalert('xss')/script@test.com"
```

### Example 2: Whitespace Trimmed
**Before Sanitization:**
```javascript
email = "  user@example.com  "
displayName = "  John Doe  "
```

**After Sanitization:**
```javascript
email = "user@example.com"
displayName = "John Doe"
```

### Example 3: Length Limited
**Before Sanitization:**
```javascript
password = "a".repeat(300) // 300 characters
```

**After Sanitization:**
```javascript
password.length === 255 // Truncated to 255 characters
```

---

## Real-Time Validation

The forms validate as you type:

### Scenario 1: Typing Email
```
User types: "john"
→ No error yet (still typing)

User types: "john@"
→ No error yet (still typing)

User types: "john@example"
→ No error yet (still typing)

User clicks submit:
→ ❌ "Please enter a valid email address"

User types: "john@example.com"
→ ✅ Error cleared, validation passes
```

### Scenario 2: Password Confirmation
```
Password: "password123"
Confirm: "pass"
→ Error shown immediately: "Passwords do not match"

User continues typing in Confirm: "password123"
→ ✅ Error cleared automatically
```

---

## Backend Error Messages

The forms display backend errors directly to users:

| Backend Error | User Sees |
|--------------|-----------|
| `"Email and password are required"` | ⚠ Email and password are required |
| `"Password must be at least 6 characters"` | ⚠ Password must be at least 6 characters |
| `"Email already exists"` | ⚠ Email already exists |
| `"Invalid email or password"` | ⚠ Invalid email or password |
| `"Firebase API key not configured"` | ⚠ Firebase API key not configured |
| Custom error with `help` field | ⚠ Error message<br><small>Help text here</small> |

---

## Loading States

While API call is in progress:

**Sign Up Button:**
```
Before: "Sign Up"
During: "Creating Account..." (button disabled, slightly faded)
After Success: "Sign Up" (button enabled, success message above)
After Error: "Sign Up" (button enabled, error message above)
```

**Login Button:**
```
Before: "Log In"
During: "Logging In..." (button disabled, slightly faded)
After Success: "Log In" (button enabled, redirect happens)
After Error: "Log In" (button enabled, error message above)
```

---

## Success Flow Animation

### Sign Up Success
```
1. Form submits ✓
2. Loading spinner (0.5s)
3. API responds with 201 Created
4. Success message fades in (green background):
   "✓ User created successfully!"
5. Form fields clear
6. Wait 2 seconds
7. Page redirects to /login
```

### Login Success
```
1. Form submits ✓
2. Loading spinner (0.3s)
3. API responds with 200 OK
4. Tokens stored in localStorage/sessionStorage
5. Wait 0.5 seconds (no visible message)
6. Page redirects to /monitor
```

---

## Testing Checklist

Use these test cases to verify everything works:

### Sign Up Form
- [ ] Submit empty form → Shows all required field errors
- [ ] Enter invalid email → Shows email format error
- [ ] Enter short password (< 6 chars) → Shows password length error
- [ ] Passwords don't match → Shows mismatch error
- [ ] Try XSS in inputs → Input is sanitized
- [ ] Valid form → Successfully creates user
- [ ] Duplicate email → Shows "Email already exists" error
- [ ] Network error → Shows network error message

### Login Form
- [ ] Submit empty form → Shows required field errors
- [ ] Enter invalid email format → Shows email error
- [ ] Wrong password → Shows "Invalid email or password"
- [ ] Non-existent email → Shows "Invalid email or password"
- [ ] Valid login with "Remember Me" → Stores in localStorage
- [ ] Valid login without "Remember Me" → Stores in sessionStorage
- [ ] Network error → Shows network error message

### Navigation
- [ ] Click "Log In" link on signup page → Goes to /login
- [ ] Click "Sign Up" link on login page → Goes to /signup
- [ ] Click "Back to Home" → Goes to /
- [ ] After signup → Redirects to /login
- [ ] After login → Redirects to /monitor

---

## Conclusion

The forms provide comprehensive validation and error handling at every step:
1. **Client-side validation** - Instant feedback
2. **Input sanitization** - Security protection
3. **Backend validation** - Server-side checks
4. **Error display** - Clear user messages
5. **Success handling** - Smooth redirects

All edge cases are covered, and users always know what's happening!
