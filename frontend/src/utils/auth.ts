/**
 * Authentication Helper Functions
 * 
 * Provides utilities to check authentication status and manage redirects
 */

// Check if user is authenticated by looking for stored tokens
export function isAuthenticated(): boolean {
    const localToken = localStorage.getItem('idToken');
    const sessionToken = sessionStorage.getItem('idToken');
    return !!(localToken || sessionToken);
}

// Get the authenticated user data from storage
export function getAuthUser(): any | null {
    const localUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
    const userString = localUser || sessionUser;
    
    if (!userString) return null;
    
    try {
        return JSON.parse(userString);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

// Get the auth token
export function getAuthToken(): string | null {
    return localStorage.getItem('idToken') || sessionStorage.getItem('idToken');
}

// Logout - clear all auth data
export function logout(): void {
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('idToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
}
