import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api, type UseApiOptions } from '@/utils/apiClient';

/**
 * useApiClient Hook
 * 
 * Provides API client methods with automatic toast notifications
 * and retry logic for failed requests.
 * 
 * Requirement 7.5: Implement retry logic and toast notifications for API calls
 */
export function useApiClient() {
    const { toast } = useToast();

    const handleResponse = useCallback(
        (response: any, options?: UseApiOptions) => {
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
        [toast]
    );

    const get = useCallback(
        async <T = any>(url: string, options?: UseApiOptions) => {
            const response = await api.get<T>(url, {
                ...options,
                onRetry: (attempt, error) => {
                    console.log(`Retrying request (attempt ${attempt})...`, error);
                    if (options?.onRetry) {
                        options.onRetry(attempt, error);
                    }
                },
            });
            return handleResponse(response, options);
        },
        [handleResponse]
    );

    const post = useCallback(
        async <T = any>(url: string, data?: any, options?: UseApiOptions) => {
            const response = await api.post<T>(url, data, {
                ...options,
                onRetry: (attempt, error) => {
                    console.log(`Retrying request (attempt ${attempt})...`, error);
                    if (options?.onRetry) {
                        options.onRetry(attempt, error);
                    }
                },
            });
            return handleResponse(response, options);
        },
        [handleResponse]
    );

    const put = useCallback(
        async <T = any>(url: string, data?: any, options?: UseApiOptions) => {
            const response = await api.put<T>(url, data, {
                ...options,
                onRetry: (attempt, error) => {
                    console.log(`Retrying request (attempt ${attempt})...`, error);
                    if (options?.onRetry) {
                        options.onRetry(attempt, error);
                    }
                },
            });
            return handleResponse(response, options);
        },
        [handleResponse]
    );

    const patch = useCallback(
        async <T = any>(url: string, data?: any, options?: UseApiOptions) => {
            const response = await api.patch<T>(url, data, {
                ...options,
                onRetry: (attempt, error) => {
                    console.log(`Retrying request (attempt ${attempt})...`, error);
                    if (options?.onRetry) {
                        options.onRetry(attempt, error);
                    }
                },
            });
            return handleResponse(response, options);
        },
        [handleResponse]
    );

    const del = useCallback(
        async <T = any>(url: string, options?: UseApiOptions) => {
            const response = await api.delete<T>(url, {
                ...options,
                onRetry: (attempt, error) => {
                    console.log(`Retrying request (attempt ${attempt})...`, error);
                    if (options?.onRetry) {
                        options.onRetry(attempt, error);
                    }
                },
            });
            return handleResponse(response, options);
        },
        [handleResponse]
    );

    return {
        get,
        post,
        put,
        patch,
        delete: del,
    };
}
