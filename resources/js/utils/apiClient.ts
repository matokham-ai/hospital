/**
 * API Client Utility with Retry Logic
 * 
 * Provides a wrapper around fetch with automatic retry logic for failed requests.
 * Implements exponential backoff for retries.
 * 
 * Requirement 7.5: Implement retry logic for failed API calls
 */

interface ApiClientOptions extends RequestInit {
    maxRetries?: number;
    retryDelay?: number;
    retryOn?: number[]; // HTTP status codes to retry on
    onRetry?: (attempt: number, error: Error) => void;
}

interface ApiResponse<T = any> {
    ok: boolean;
    status: number;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt: number, baseDelay: number): number => {
    return baseDelay * Math.pow(2, attempt - 1);
};

/**
 * Get CSRF token from meta tag
 */
const getCsrfToken = (): string => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

/**
 * Make an API request with retry logic
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options with retry configuration
 * @returns Promise with the response data
 */
export async function apiClient<T = any>(
    url: string,
    options: ApiClientOptions = {}
): Promise<ApiResponse<T>> {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        retryOn = [408, 429, 500, 502, 503, 504], // Timeout, Rate limit, Server errors
        onRetry,
        ...fetchOptions
    } = options;

    // Set default headers
    const headers = new Headers(fetchOptions.headers);
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }
    if (!headers.has('X-CSRF-TOKEN')) {
        headers.set('X-CSRF-TOKEN', getCsrfToken());
    }

    const requestOptions: RequestInit = {
        ...fetchOptions,
        headers,
        credentials: fetchOptions.credentials || 'same-origin',
    };

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= maxRetries) {
        try {
            const response = await fetch(url, requestOptions);
            
            // If response is ok, parse and return
            if (response.ok) {
                const data = await response.json();
                return {
                    ok: true,
                    status: response.status,
                    data: data.data || data,
                    message: data.message,
                };
            }

            // Check if we should retry based on status code
            if (attempt < maxRetries && retryOn.includes(response.status)) {
                attempt++;
                const delay = getRetryDelay(attempt, retryDelay);
                
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                if (onRetry) {
                    onRetry(attempt, error);
                }
                
                console.warn(`API request failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
                await sleep(delay);
                continue;
            }

            // Non-retryable error or max retries reached
            const errorData = await response.json().catch(() => ({}));
            return {
                ok: false,
                status: response.status,
                error: errorData.error || errorData.message || response.statusText,
                message: errorData.message,
            };

        } catch (error) {
            lastError = error as Error;
            
            // Network errors are retryable
            if (attempt < maxRetries) {
                attempt++;
                const delay = getRetryDelay(attempt, retryDelay);
                
                if (onRetry) {
                    onRetry(attempt, lastError);
                }
                
                console.warn(`API request failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`, error);
                await sleep(delay);
                continue;
            }

            // Max retries reached
            return {
                ok: false,
                status: 0,
                error: lastError.message || 'Network error occurred',
            };
        }
    }

    // Should never reach here, but TypeScript needs it
    return {
        ok: false,
        status: 0,
        error: lastError?.message || 'Unknown error occurred',
    };
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
    get: <T = any>(url: string, options?: ApiClientOptions) => {
        return apiClient<T>(url, { ...options, method: 'GET' });
    },

    post: <T = any>(url: string, data?: any, options?: ApiClientOptions) => {
        return apiClient<T>(url, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    put: <T = any>(url: string, data?: any, options?: ApiClientOptions) => {
        return apiClient<T>(url, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    patch: <T = any>(url: string, data?: any, options?: ApiClientOptions) => {
        return apiClient<T>(url, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    delete: <T = any>(url: string, options?: ApiClientOptions) => {
        return apiClient<T>(url, { ...options, method: 'DELETE' });
    },
};

/**
 * Hook for using API client with toast notifications
 */
export interface UseApiOptions extends ApiClientOptions {
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
    errorMessage?: string;
}

/**
 * Create an API client instance with toast integration
 * This can be used in React components with the useToast hook
 */
export function createApiClientWithToast(toast: any) {
    return {
        get: async <T = any>(url: string, options?: UseApiOptions) => {
            const response = await api.get<T>(url, options);
            
            if (!response.ok && options?.showErrorToast !== false) {
                toast({
                    title: 'Error',
                    description: options?.errorMessage || response.error || 'Request failed',
                    variant: 'destructive',
                });
            } else if (response.ok && options?.showSuccessToast) {
                toast({
                    title: 'Success',
                    description: options?.successMessage || response.message || 'Request successful',
                    variant: 'default',
                });
            }
            
            return response;
        },

        post: async <T = any>(url: string, data?: any, options?: UseApiOptions) => {
            const response = await api.post<T>(url, data, options);
            
            if (!response.ok && options?.showErrorToast !== false) {
                toast({
                    title: 'Error',
                    description: options?.errorMessage || response.error || 'Request failed',
                    variant: 'destructive',
                });
            } else if (response.ok && options?.showSuccessToast) {
                toast({
                    title: 'Success',
                    description: options?.successMessage || response.message || 'Request successful',
                    variant: 'default',
                });
            }
            
            return response;
        },

        put: async <T = any>(url: string, data?: any, options?: UseApiOptions) => {
            const response = await api.put<T>(url, data, options);
            
            if (!response.ok && options?.showErrorToast !== false) {
                toast({
                    title: 'Error',
                    description: options?.errorMessage || response.error || 'Request failed',
                    variant: 'destructive',
                });
            } else if (response.ok && options?.showSuccessToast) {
                toast({
                    title: 'Success',
                    description: options?.successMessage || response.message || 'Request successful',
                    variant: 'default',
                });
            }
            
            return response;
        },

        patch: async <T = any>(url: string, data?: any, options?: UseApiOptions) => {
            const response = await api.patch<T>(url, data, options);
            
            if (!response.ok && options?.showErrorToast !== false) {
                toast({
                    title: 'Error',
                    description: options?.errorMessage || response.error || 'Request failed',
                    variant: 'destructive',
                });
            } else if (response.ok && options?.showSuccessToast) {
                toast({
                    title: 'Success',
                    description: options?.successMessage || response.message || 'Request successful',
                    variant: 'default',
                });
            }
            
            return response;
        },

        delete: async <T = any>(url: string, options?: UseApiOptions) => {
            const response = await api.delete<T>(url, options);
            
            if (!response.ok && options?.showErrorToast !== false) {
                toast({
                    title: 'Error',
                    description: options?.errorMessage || response.error || 'Request failed',
                    variant: 'destructive',
                });
            } else if (response.ok && options?.showSuccessToast) {
                toast({
                    title: 'Success',
                    description: options?.successMessage || response.message || 'Request successful',
                    variant: 'default',
                });
            }
            
            return response;
        },
    };
}
