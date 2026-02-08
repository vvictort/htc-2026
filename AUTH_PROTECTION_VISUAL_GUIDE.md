# Authentication Protection - Visual Guide

## 🎯 What Changed

### Before (No Protection)
```
Landing Page
├── "Start monitoring" button → /monitor (always works)
├── "Start Free Today" button → /monitor (always works)
└── Navbar: "Log In" | "Get Started" (static)
```

### After (Protected)
```
Landing Page (Not Logged In)
├── "Start monitoring" button → /signup (redirects)
├── "Start Free Today" button → /signup (redirects)
└── Navbar: "Log In" | "Get Started"

Landing Page (Logged In)
├── "Start monitoring" button → /monitor (allowed)
├── "Start Free Today" button → /monitor (allowed)
└── Navbar: "Dashboard" | "Log Out"
```

---

## 🔄 User Flow Diagrams

### Flow 1: New User Journey
```
┌─────────────────┐
│  Landing Page   │
│  [Not Logged]   │
└────────┬────────┘
         │ Click "Start monitoring"
         ↓
  ❌ Not authenticated
         ↓
┌─────────────────┐
│   /signup       │
│  Create Account │
└────────┬────────┘
         │ Submit form
         ↓
┌─────────────────┐
│   /login        │
│  Enter Creds    │
└────────┬────────┘
         │ Submit form
         ↓
  ✅ Authenticated!
         ↓
┌─────────────────┐
│   /monitor      │
│   Dashboard     │
└─────────────────┘
```

### Flow 2: Returning User Journey
```
┌─────────────────┐
│  Landing Page   │
│  [Logged In]    │
└────────┬────────┘
         │ Click "Start monitoring"
         ↓
  ✅ Already authenticated
         ↓
┌─────────────────┐
│   /monitor      │
│   Dashboard     │
└─────────────────┘
```

### Flow 3: Logout Journey
```
┌─────────────────┐
│  Any Page       │
│  [Logged In]    │
└────────┬────────┘
         │ Click "Log Out"
         ↓
  🗑️  Clear tokens
         ↓
┌─────────────────┐
│  Landing Page   │
│  [Not Logged]   │
└─────────────────┘
```

---

## 🎨 UI Changes

### Navbar - Not Logged In
```
┌─────────────────────────────────────────────────────────────┐
│ 👶 BabyWatcher  [Home] [Features] [How] [Contact]           │
│                                            [Log In] [Get Started] │
└─────────────────────────────────────────────────────────────┘
```

### Navbar - Logged In
```
┌─────────────────────────────────────────────────────────────┐
│ 👶 BabyWatcher  [Home] [Features] [How] [Contact]           │
│                                        [Dashboard] [Log Out]     │
└─────────────────────────────────────────────────────────────┘
```

### Hero Section - Not Logged In
```
┌────────────────────────────────────────────────┐
│  Watch over your little one                    │
│  with claymorphic ease                         │
│                                                │
│  [Start monitoring] → Redirects to /signup     │
│  [Explore features]                            │
└────────────────────────────────────────────────┘
```

### Hero Section - Logged In
```
┌────────────────────────────────────────────────┐
│  Watch over your little one                    │
│  with claymorphic ease                         │
│                                                │
│  [Start monitoring] → Goes to /monitor         │
│  [Explore features]                            │
└────────────────────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### Scenario A: Unauthenticated User Clicks "Start monitoring"
```
State: localStorage.idToken = null
Action: Click "Start monitoring"
Expected: Redirect to /signup
Result: ✅ Works!
```

### Scenario B: Authenticated User Clicks "Start monitoring"
```
State: localStorage.idToken = "eyJhbGc..."
Action: Click "Start monitoring"
Expected: Navigate to /monitor
Result: ✅ Works!
```

### Scenario C: User Logs Out
```
State: localStorage.idToken = "eyJhbGc..."
Action: Click "Log Out"
Expected: 
  - localStorage cleared
  - Redirect to /
  - Navbar shows "Log In" and "Get Started"
Result: ✅ Works!
```

### Scenario D: Direct URL Access to /monitor
```
State: localStorage.idToken = null
Action: Type "localhost:5173/monitor" in browser
Expected: Page loads (no server-side protection yet)
Recommendation: Add route guards in future
Result: ⚠️ Currently allowed (client-side only)
```

---

## 📱 Mobile Experience

### Mobile Menu - Not Logged In
```
┌─────────────────────┐
│ ☰ Menu              │
├─────────────────────┤
│ Home                │
│ Features            │
│ How It Works        │
│ Contact             │
├─────────────────────┤
│ [Log In]            │
│ [Get Started]       │
└─────────────────────┘
```

### Mobile Menu - Logged In
```
┌─────────────────────┐
│ ☰ Menu              │
├─────────────────────┤
│ Home                │
│ Features            │
│ How It Works        │
│ Contact             │
├─────────────────────┤
│ [Dashboard]         │
│ [Log Out]           │
└─────────────────────┘
```

---

## 🔍 Code Snippets

### Authentication Check (Hero.tsx)
```typescript
const handleStartMonitoring = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated()) {
        e.preventDefault();           // Stop navigation
        window.location.href = '/signup';  // Redirect to signup
    }
    // If authenticated, normal Link navigation happens
};

// Usage:
<Link to="/monitor" onClick={handleStartMonitoring}>
    Start monitoring
</Link>
```

### Navbar Authentication State (Navbar.tsx)
```typescript
const isLoggedIn = isAuthenticated();

// Conditional rendering:
{isLoggedIn ? (
    <>
        <Link to="/monitor">Dashboard</Link>
        <button onClick={handleLogout}>Log Out</button>
    </>
) : (
    <>
        <Link to="/login">Log In</Link>
        <Link to="/signup">Get Started</Link>
    </>
)}
```

### Logout Handler (Navbar.tsx)
```typescript
const handleLogout = () => {
    logout();  // Clear all tokens from storage
    window.location.href = '/';  // Go back to home
};
```

---

## 💾 Storage Structure

### When Logged In (Remember Me = true)
```javascript
localStorage {
    idToken: "eyJhbGciOiJSUzI1NiIs...",
    refreshToken: "AMf-vBzX...",
    user: '{"uid":"abc123","email":"user@example.com",...}'
}
```

### When Logged In (Remember Me = false)
```javascript
sessionStorage {
    idToken: "eyJhbGciOiJSUzI1NiIs...",
    refreshToken: "AMf-vBzX...",
    user: '{"uid":"abc123","email":"user@example.com",...}'
}
```

### When Logged Out
```javascript
localStorage { }  // Empty
sessionStorage { }  // Empty
```

---

## 🎯 Implementation Checklist

- [x] Create `auth.ts` utility with helper functions
- [x] Add authentication check to Hero "Start monitoring" button
- [x] Add authentication check to CTA "Start Free Today" button
- [x] Update Navbar to show different buttons based on auth state
- [x] Update mobile menu to show different buttons based on auth state
- [x] Implement logout functionality
- [x] Test all authentication flows
- [x] Document implementation

---

## 🚀 Next Steps (Future Enhancements)

### 1. Route Guards
```typescript
// Create ProtectedRoute component
<Route path="/monitor" element={
    <ProtectedRoute>
        <MonitorPage />
    </ProtectedRoute>
} />
```

### 2. Auth Context
```typescript
// Create AuthContext for global state
const { user, isAuthenticated, login, logout } = useAuth();
```

### 3. Token Refresh
```typescript
// Auto-refresh token before expiration
if (tokenExpiresSoon()) {
    await refreshToken();
}
```

### 4. Session Timeout
```typescript
// Auto-logout after 30 minutes of inactivity
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
```

---

## 📊 Summary

**Files Created:**
- ✅ `frontend/src/utils/auth.ts` (5 functions)

**Files Modified:**
- ✅ `frontend/src/components/landing/Hero.tsx` (added protection)
- ✅ `frontend/src/components/landing/CTA.tsx` (added protection)
- ✅ `frontend/src/components/landing/Navbar.tsx` (added dynamic state)

**Features Added:**
- ✅ Authentication-protected buttons
- ✅ Dynamic navbar based on login state
- ✅ Logout functionality
- ✅ Mobile menu support
- ✅ Smooth user redirects

**User Experience:**
- 🎉 Seamless authentication flow
- 🎉 Clear visual feedback
- 🎉 Intuitive navigation
- 🎉 Mobile-friendly

Your authentication system is now fully functional! 🚀
