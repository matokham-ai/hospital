import { router } from '@inertiajs/react';

/**
 * Handle API errors, especially session expiration
 */
export function handleApiError(error: any): void {
    if (error.response) {
        const status = error.response.status;
        
        switch (status) {
            case 401:
                // Unauthorized - session expired
                console.warn('Session expired, redirecting to login...');
                router.visit('/login', {
                    method: 'get',
                    replace: true,
                });
                break;
                
            case 419:
                // CSRF token mismatch
                console.warn('CSRF token expired, refreshing page...');
                window.location.reload();
                break;
                
            case 403:
                // Forbidden
                console.error('Access denied');
                break;
                
            case 422:
                // Validation error
                console.warn('Validation error:', error.response.data);
                break;
                
            case 500:
                // Server error
                console.error('Server error:', error.response.data);
                break;
                
            default:
                console.error('API error:', error.response.data);
        }
    } else {
        console.error('Network error:', error.message);
    }
}

/**
 * Wrapper for Inertia form submissions with error handling
 */
export function submitWithErrorHandling(
    submitFunction: () => void,
    onError?: (error: any) => void
): void {
    try {
        submitFunction();
    } catch (error) {
        handleApiError(error);
        if (onError) {
            onError(error);
        }
    }
}