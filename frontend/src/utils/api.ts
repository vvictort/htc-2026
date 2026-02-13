export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AUTH_ENDPOINTS = {
    SIGNUP: `${API_BASE_URL}/auth/signup`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    ME: `${API_BASE_URL}/auth/me`,
};

export const AUDIO_ENDPOINTS = {
    LULLABY: `${API_BASE_URL}/audio/lullaby`,
    STREAM: `${API_BASE_URL}/audio/stream`,
    VOICES: `${API_BASE_URL}/audio/voices`,
};

export const WEBRTC_ENDPOINTS = {
    ICE_SERVERS: `${API_BASE_URL}/webrtc/ice-servers`,
};

export const STATUS_ENDPOINT = `${API_BASE_URL}/status`;

export const MOTION_ENDPOINTS = {
    CREATE: `${API_BASE_URL}/motion`,
    LIST: `${API_BASE_URL}/motion`,
};

export const NOTIFICATION_ENDPOINTS = {
    LIST: `${API_BASE_URL}/notifications`,
    CREATE: `${API_BASE_URL}/notifications`,
    READ_ALL: `${API_BASE_URL}/notifications/read-all`,
    READ: (id: string) => `${API_BASE_URL}/notifications/${id}/read`,
    PREFERENCES: `${API_BASE_URL}/notifications/preferences`,
};

export async function apiCall<T>(
    endpoint: string,
    options?: RequestInit
): Promise<{ data?: T; error?: string; status: number }> {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                error: data.error || 'Request failed',
                status: response.status,
            };
        }

        return {
            data,
            status: response.status,
        };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Network error',
            status: 0,
        };
    }
}

export function getAuthToken(): string | null {
    return localStorage.getItem('idToken') || sessionStorage.getItem('idToken');
}

export function setAuthToken(token: string, rememberMe: boolean = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('idToken', token);
}

export function removeAuthToken(): void {
    localStorage.removeItem('idToken');
    sessionStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
    return getAuthToken() !== null;
}
