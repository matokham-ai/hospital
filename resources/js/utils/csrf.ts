import { usePage } from '@inertiajs/react';

/**
 * Get the CSRF token from the page props
 */
export function getCsrfToken(): string {
    const { props } = usePage();
    return (props as any).csrf_token || '';
}

/**
 * Create headers with CSRF token for API requests
 */
export function getCsrfHeaders(): Record<string, string> {
    return {
        'X-CSRF-TOKEN': getCsrfToken(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
}

/**
 * Add CSRF token to form data
 */
export function addCsrfToFormData(formData: FormData): FormData {
    formData.append('_token', getCsrfToken());
    return formData;
}