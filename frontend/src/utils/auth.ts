/**
 * Authentication Helper Functions
 * 
 * Provides utilities to check authentication status and manage redirects
 */

import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

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

// Logout - clear all auth data and sign out from Firebase
export async function logout(): Promise<void> {
    try {
        // Sign out from Firebase
        await signOut(auth);
        console.log('✓ Signed out from Firebase');
    } catch (error) {
        console.error('Firebase signout error:', error);
        // Continue with local cleanup even if Firebase signout fails
    }
    
    // Clear all authentication data from localStorage
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('customToken');
    localStorage.removeItem('user');
    
    // Clear all authentication data from sessionStorage
    sessionStorage.removeItem('idToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('customToken');
    sessionStorage.removeItem('user');
    
    console.log('✓ Cleared all authentication data');
}
