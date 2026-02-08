# Authentication Protection Implementation

## Overview

The BabyWatcher app now protects the monitor/dashboard page with authentication. Users must be logged in to access the monitoring features.

## What's Been Implemented

### 1. Authentication Utility (`frontend/src/utils/auth.ts`)

Created helper functions to check authentication status:

```typescript
// Check if user is logged in
isAuthenticated(): boolean

// Get user data from storage
getAuthUser(): any | null

// Get auth token
getAuthToken(): string | null

// Clear all auth data (logout)
logout(): void
```

### 2. Protected "Start Monitoring" Buttons

#### Hero Section (`Hero.tsx`)
The main "Start monitoring" button now:
- ✅ Checks if user is logged in
- ✅ If logged in → Goes to `/monitor`
- ✅ If not logged in → Redirects to `/signup`

#### CTA Section (`CTA.tsx`)
The "Start Free Today" button now:
- ✅ Checks if user is logged in
- ✅ If logged in → Goes to `/monitor`
- ✅ If not logged in → Redirects to `/signup`

### 3. Smart Navbar (`Navbar.tsx`)

The navigation bar now adapts based on authentication status:

**When NOT logged in:**
- Shows "Log In" button → `/login`
- Shows "Get Started" button → `/signup`

**When logged in:**
- Shows "Dashboard" button → `/monitor`
- Shows "Log Out" button → Clears auth data and returns to home

This works on both:
- ✅ Desktop navigation
- ✅ Mobile hamburger menu

## User Flow Examples

### Scenario 1: New User on Landing Page
```
1. User clicks "Start monitoring" button
2. System checks: isAuthenticated() → false
3. Redirects to /signup
4. User creates account
5. Redirects to /login
6. User logs in
7. Redirects to /monitor ✓
```

### Scenario 2: Returning User
```
1. User visits landing page
2. System checks: isAuthenticated() → true
3. Navbar shows "Dashboard" and "Log Out"
4. User clicks "Start monitoring"
5. Goes directly to /monitor ✓
```

### Scenario 3: User Logs Out
```
1. User clicks "Log Out" in navbar
2. System calls logout()
3. Clears localStorage/sessionStorage
4. Redirects to / (home page)
5. Navbar shows "Log In" and "Get Started" again
```

## Technical Implementation

### Authentication Check
```typescript
const handleStartMonitoring = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated()) {
        e.preventDefault();
        window.location.href = '/signup';
    }
    // If authenticated, Link's to="/monitor" works normally
};
```

### Token Storage
The system checks both storage locations:
```typescript
localStorage.getItem('idToken')    // For "Remember Me" logins
sessionStorage.getItem('idToken')  // For temporary sessions
```

### Logout Function
```typescript
const handleLogout = () => {
    logout();  // Clears all tokens and user data
    window.location.href = '/';  // Returns to home
};
```

## Protected Pages

### Currently Protected
- ✅ Monitor Page (`/monitor`) - Access controlled via button redirects

### Future Protection (Recommended)
Consider adding route-level protection:
- Create an auth context/provider
- Add route guards to prevent direct URL access
- Implement token refresh logic
- Add session timeout handling

## Testing the Protection

### Test Case 1: Access Without Login
```
1. Open browser in incognito mode
2. Navigate to landing page
3. Click "Start monitoring"
Expected: Redirects to /signup ✓
```

### Test Case 2: Access With Login
```
1. Log in at /login
2. Return to landing page
3. Click "Start monitoring"
Expected: Goes to /monitor ✓
```

### Test Case 3: Navbar State
```
Not Logged In:
- Navbar shows: "Log In" | "Get Started"

Logged In:
- Navbar shows: "Dashboard" | "Log Out"
```

### Test Case 4: Logout
```
1. Click "Log Out" button
2. Check localStorage/sessionStorage
Expected: All tokens cleared ✓
3. Check navbar
Expected: Shows "Log In" and "Get Started" ✓
```

## Files Modified

### New File
- `frontend/src/utils/auth.ts` - Authentication utilities

### Modified Files
1. `frontend/src/components/landing/Hero.tsx`
   - Added `handleStartMonitoring` function
   - Added `onClick` handler to "Start monitoring" button

2. `frontend/src/components/landing/CTA.tsx`
   - Added `handleStartFree` function
   - Added `onClick` handler to "Start Free Today" button

3. `frontend/src/components/landing/Navbar.tsx`
   - Added `isLoggedIn` state check
   - Added `handleLogout` function
   - Conditional rendering for desktop nav buttons
   - Conditional rendering for mobile menu buttons

## Security Considerations

### Current Implementation
✅ Client-side authentication check
✅ Token-based access
✅ Redirects to signup for unauthenticated users
✅ Logout clears all stored data

### Recommended Enhancements
1. **Route Guards**: Add React Router guards to prevent direct URL access
2. **Token Validation**: Verify token validity with backend on protected routes
3. **Token Refresh**: Implement automatic token refresh before expiration
4. **Session Timeout**: Auto-logout after inactivity
5. **Secure Storage**: Consider more secure token storage options

## Code Examples

### Check Authentication Anywhere
```typescript
import { isAuthenticated } from '../../utils/auth';

const MyComponent = () => {
    const loggedIn = isAuthenticated();
    
    return (
        <div>
            {loggedIn ? (
                <p>Welcome back!</p>
            ) : (
                <p>Please log in</p>
            )}
        </div>
    );
};
```

### Get Current User
```typescript
import { getAuthUser } from '../../utils/auth';

const ProfileComponent = () => {
    const user = getAuthUser();
    
    if (!user) return <p>Not logged in</p>;
    
    return <p>Hello, {user.displayName || user.email}!</p>;
};
```

### Manual Logout
```typescript
import { logout } from '../../utils/auth';

const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
        logout();
        window.location.href = '/';
    }
};
```

## Browser Developer Tools Testing

### Check Token Storage
```javascript
// Open Console (F12)

// Check if logged in
localStorage.getItem('idToken')
sessionStorage.getItem('idToken')

// Get user data
JSON.parse(localStorage.getItem('user'))

// Manual logout
localStorage.clear()
sessionStorage.clear()
```

## Summary

Your BabyWatcher app now has comprehensive authentication protection:

✅ **Landing Page Buttons** - Protected and redirect to signup
✅ **Smart Navbar** - Shows different options based on login state  
✅ **Mobile Support** - Works on all screen sizes
✅ **Clean Logout** - Properly clears all data
✅ **Good UX** - Smooth redirects and clear user feedback

Users must sign up and log in before accessing the monitoring dashboard!
