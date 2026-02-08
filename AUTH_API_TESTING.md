# Auth API Testing Guide

This guide provides curl commands to test the authentication API endpoints.

## Prerequisites

- Backend server running on `http://localhost:5000`
- curl installed (or use WSL on Windows)

## API Endpoints

### 1. Sign Up (Create New User)

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"  // optional
}
```

**Success Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "uid": "firebase-uid-here",
    "email": "user@example.com",
    "displayName": "John Doe"
  }
}
```

**Error Responses:**
- `400` - Validation error (missing fields, weak password, email already exists)
- `500` - Server error

**Test Commands:**

```bash
# Basic signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123","displayName":"Test User"}'

# Signup without display name
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"another@example.com","password":"securepass123"}'

# Test validation - short password (should fail)
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123"}'

# Test duplicate email (should fail if user exists)
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123"}'
```

---

### 2. Login (Authenticate User)

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "uid": "firebase-uid-here",
    "email": "user@example.com",
    "displayName": "John Doe",
    "mongoId": "mongodb-id-here"
  },
  "idToken": "firebase-id-token",
  "refreshToken": "firebase-refresh-token",
  "expiresIn": "3600"
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Server error

**Test Commands:**

```bash
# Successful login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123"}'

# Invalid password (should fail)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"wrongpassword"}'

# Non-existent email (should fail)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"password123"}'

# Missing fields (should fail)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com"}'
```

---

### 3. Get Current User (Protected Route)

**Endpoint:** `GET /api/auth/me`

**Headers Required:**
```
Authorization: Bearer <idToken>
```

**Success Response (200):**
```json
{
  "user": {
    "uid": "firebase-uid-here",
    "email": "user@example.com",
    "displayName": "John Doe",
    "emailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "mongoId": "mongodb-id-here"
  }
}
```

**Test Commands:**

```bash
# First, login to get a token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123"}' \
  | grep -o '"idToken":"[^"]*"' \
  | cut -d'"' -f4)

# Then use the token to access protected route
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Without token (should fail with 401)
curl -X GET http://localhost:5000/api/auth/me
```

---

## Complete Test Script

Save this as `test-auth-api.sh` and run it:

```bash
#!/bin/bash

echo "=== Testing Auth API Endpoints ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Sign Up
echo -e "${YELLOW}Test 1: Sign Up${NC}"
curl -s -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser'$(date +%s)'@example.com","password":"password123","displayName":"Test User"}' \
  | jq .
echo ""

# Test 2: Login with valid credentials
echo -e "${YELLOW}Test 2: Login (Valid Credentials)${NC}"
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123"}')
echo $RESPONSE | jq .
TOKEN=$(echo $RESPONSE | jq -r '.idToken // empty')
echo ""

# Test 3: Login with invalid credentials
echo -e "${YELLOW}Test 3: Login (Invalid Credentials)${NC}"
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"wrongpassword"}' \
  | jq .
echo ""

# Test 4: Get current user (protected)
if [ ! -z "$TOKEN" ]; then
    echo -e "${YELLOW}Test 4: Get Current User (With Token)${NC}"
    curl -s -X GET http://localhost:5000/api/auth/me \
      -H "Authorization: Bearer $TOKEN" \
      | jq .
    echo ""
fi

# Test 5: Get current user without token
echo -e "${YELLOW}Test 5: Get Current User (Without Token - Should Fail)${NC}"
curl -s -X GET http://localhost:5000/api/auth/me | jq .
echo ""

echo -e "${GREEN}=== Tests Complete ===${NC}"
```

---

## Frontend Forms

The frontend forms include:

### Security Features:
1. **Input Sanitization**
   - Removes angle brackets to prevent XSS attacks
   - Trims whitespace
   - Limits input length (max 255 characters)

2. **Validation**
   - Email format validation using regex
   - Password length validation (min 6, max 128 characters)
   - Password confirmation matching
   - Real-time field validation

3. **User Feedback**
   - Success messages with animations
   - Detailed error messages from backend
   - Field-level error display
   - Loading states during API calls

4. **Best Practices**
   - Uses proper HTML input types (email, password)
   - Includes autocomplete attributes
   - Accessible labels and ARIA attributes
   - Disabled submit button during loading
   - Remember me functionality with localStorage/sessionStorage

### Form Locations:
- Sign Up Form: `/signup`
- Login Form: `/login`

### Usage:
```tsx
import { SignUpForm, LoginForm } from './components/auth';

// Use in your pages
<SignUpForm />
<LoginForm />
```

---

## Environment Variables

Make sure your `.env` file has:

```env
# Backend
PORT=5000
FIREBASE_API_KEY=your-firebase-api-key
MONGODB_URI=your-mongodb-uri

# Frontend
VITE_API_URL=http://localhost:5000/api
```

---

## Testing Checklist

- [ ] Sign up with valid data
- [ ] Sign up with duplicate email (should fail)
- [ ] Sign up with short password (should fail)
- [ ] Sign up without required fields (should fail)
- [ ] Login with valid credentials
- [ ] Login with invalid password (should fail)
- [ ] Login with non-existent email (should fail)
- [ ] Login without required fields (should fail)
- [ ] Access protected route with valid token
- [ ] Access protected route without token (should fail)
- [ ] Test XSS prevention in form inputs
- [ ] Test password confirmation validation
- [ ] Test remember me functionality
