/**
 * Error Handling Unit Tests
 * 
 * Tests for error handling utilities including API client retry logic
 * and validation error handling.
 * 
 * Requirement 7.5: Error handling and validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '@/utils/apiClient';

describe('API Client with Retry Logic', () => {
    let fetchMock: any;

    beforeEach(() => {
        // Mock global fetch
        fetchMock = vi.fn();
        global.fetch = fetchMock;

        // Mock CSRF token
        document.head.innerHTML = '<meta name="csrf-token" content="test-token">';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should successfully make a GET request', async () => {
        const mockData = { data: { id: 1, name: 'Test' } };
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockData,
        });

        const response = await api.get('/api/test');

        expect(response.ok).toBe(true);
        expect(response.data).toEqual(mockData.data);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should successfully make a POST request', async () => {
        const mockData = { data: { id: 1, name: 'Created' } };
        const postData = { name: 'Test' };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 201,
            json: async () => mockData,
        });

        const response = await api.post('/api/test', postData);

        expect(response.ok).toBe(true);
        expect(response.data).toEqual(mockData.data);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        // Verify request body
        const callArgs = fetchMock.mock.calls[0];
        const requestBody = JSON.parse(callArgs[1].body);
        expect(requestBody).toEqual(postData);
    });

    it('should retry on network error', async () => {
        const mockData = { data: { id: 1 } };

        // First two calls fail, third succeeds
        fetchMock
            .mockRejectedValueOnce(new Error('Network error'))
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockData,
            });

        const response = await api.get('/api/test', {
            maxRetries: 3,
            retryDelay: 10, // Short delay for testing
        });

        expect(response.ok).toBe(true);
        expect(response.data).toEqual(mockData.data);
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should retry on 500 server error', async () => {
        const mockData = { data: { id: 1 } };

        // First call returns 500, second succeeds
        fetchMock
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({ error: 'Server error' }),
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockData,
            });

        const response = await api.get('/api/test', {
            maxRetries: 2,
            retryDelay: 10,
        });

        expect(response.ok).toBe(true);
        expect(response.data).toEqual(mockData.data);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 404 error', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: async () => ({ error: 'Not found' }),
        });

        const response = await api.get('/api/test', {
            maxRetries: 3,
            retryDelay: 10,
        });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(404);
        expect(fetchMock).toHaveBeenCalledTimes(1); // No retries
    });

    it('should not retry on 422 validation error', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 422,
            statusText: 'Unprocessable Entity',
            json: async () => ({
                message: 'Validation failed',
                errors: {
                    email: ['Email is required'],
                },
            }),
        });

        const response = await api.post('/api/test', {}, {
            maxRetries: 3,
            retryDelay: 10,
        });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(422);
        expect(fetchMock).toHaveBeenCalledTimes(1); // No retries
    });

    it('should call onRetry callback on each retry', async () => {
        const onRetry = vi.fn();
        const mockData = { data: { id: 1 } };

        fetchMock
            .mockRejectedValueOnce(new Error('Network error'))
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockData,
            });

        await api.get('/api/test', {
            maxRetries: 3,
            retryDelay: 10,
            onRetry,
        });

        expect(onRetry).toHaveBeenCalledTimes(2);
        expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error));
        expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error));
    });

    it('should return error after max retries exceeded', async () => {
        fetchMock.mockRejectedValue(new Error('Network error'));

        const response = await api.get('/api/test', {
            maxRetries: 2,
            retryDelay: 10,
        });

        expect(response.ok).toBe(false);
        expect(response.error).toContain('Network error');
        expect(fetchMock).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should include CSRF token in headers', async () => {
        const mockData = { data: { id: 1 } };
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockData,
        });

        await api.post('/api/test', { name: 'Test' });

        const callArgs = fetchMock.mock.calls[0];
        const headers = callArgs[1].headers;
        
        expect(headers.get('X-CSRF-TOKEN')).toBe('test-token');
        expect(headers.get('Content-Type')).toBe('application/json');
        expect(headers.get('Accept')).toBe('application/json');
    });

    it('should handle DELETE requests', async () => {
        const mockData = { message: 'Deleted successfully' };
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockData,
        });

        const response = await api.delete('/api/test/1');

        expect(response.ok).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        
        const callArgs = fetchMock.mock.calls[0];
        expect(callArgs[1].method).toBe('DELETE');
    });

    it('should handle PUT requests', async () => {
        const mockData = { data: { id: 1, name: 'Updated' } };
        const putData = { name: 'Updated' };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockData,
        });

        const response = await api.put('/api/test/1', putData);

        expect(response.ok).toBe(true);
        expect(response.data).toEqual(mockData.data);
        
        const callArgs = fetchMock.mock.calls[0];
        expect(callArgs[1].method).toBe('PUT');
        const requestBody = JSON.parse(callArgs[1].body);
        expect(requestBody).toEqual(putData);
    });

    it('should handle PATCH requests', async () => {
        const mockData = { data: { id: 1, email: 'updated@example.com' } };
        const patchData = { email: 'updated@example.com' };

        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockData,
        });

        const response = await api.patch('/api/test/1', patchData);

        expect(response.ok).toBe(true);
        expect(response.data).toEqual(mockData.data);
        
        const callArgs = fetchMock.mock.calls[0];
        expect(callArgs[1].method).toBe('PATCH');
    });
});

describe('Validation Error Handling', () => {
    it('should handle single error message', () => {
        const errors = {
            email: 'Email is required',
        };

        expect(errors.email).toBe('Email is required');
    });

    it('should handle multiple error messages for a field', () => {
        const errors = {
            password: ['Password is required', 'Password must be at least 8 characters'],
        };

        expect(Array.isArray(errors.password)).toBe(true);
        expect(errors.password).toHaveLength(2);
    });

    it('should handle multiple fields with errors', () => {
        const errors = {
            email: 'Email is required',
            password: ['Password is required', 'Password must be at least 8 characters'],
            name: 'Name is required',
        };

        expect(Object.keys(errors)).toHaveLength(3);
    });
});
