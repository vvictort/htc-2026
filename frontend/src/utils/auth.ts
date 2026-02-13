/**
 * Authentication Helper Functions
 * 
 * Provides utilities to check authentication status and manage redirects
 */

import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export function isAuthenticated(): boolean {
    const localToken = localStorage.getItem('idToken');
    const sessionToken = sessionStorage.getItem('idToken');
    return !!(localToken || sessionToken);
}

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

export function getAuthToken(): string | null {
    return localStorage.getItem('idToken') || sessionStorage.getItem('idToken');
}

export async function logout(): Promise<void> {
    try {
        await signOut(auth);
        console.log('✓ Signed out from Firebase');
    } catch (error) {
        console.error('Firebase signout error:', error);
    }
    
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('customToken');
    localStorage.removeItem('user');
    
    sessionStorage.removeItem('idToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('customToken');
    sessionStorage.removeItem('user');
    
    console.log('✓ Cleared all authentication data');
}
