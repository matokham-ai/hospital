import { router } from '@inertiajs/react';

/**
 * Check if the current session is still valid
 */
export function checkSession(): Promise<boolean> {
    return fetch('/api/session-check', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    })
    .then(response => response.ok)
    .catch(() => false);
}

/**
 * Handle session expiration by redirecting to login
 */
export function handleSessionExpired(): void {
    // Clear any local storage or session storage if needed
    localStorage.removeItem('user_preferences');
    
    // Redirect to login page
    router.visit('/login', {
        method: 'get',
        data: {},
        replace: true,
    });
}

/**
 * Refresh the session to prevent expiration
 */
export function refreshSession(): Promise<void> {
    return fetch('/api/session-refresh', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Session refresh failed');
        }
    })
    .catch(() => {
        handleSessionExpired();
    });
}

/**
 * Set up automatic session refresh
 */
export function setupSessionRefresh(intervalMinutes: number = 30): void {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    setInterval(() => {
        checkSession().then(isValid => {
            if (!isValid) {
                handleSessionExpired();
            } else {
                refreshSession();
            }
        });
    }, intervalMs);
}