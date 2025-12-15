# Error Handling and Validation Guide

This guide explains how to use the error handling and validation features implemented for the consultation enhancement feature.

## Components

### 1. ErrorBoundary

The `ErrorBoundary` component catches JavaScript errors anywhere in the child component tree and displays a fallback UI.

**Usage:**

```tsx
import ErrorBoundary from '@/Components/ErrorBoundary';

function MyComponent() {
    return (
        <ErrorBoundary
            onError={(error, errorInfo) => {
                // Optional: Log to external service
                console.error('Error caught:', error);
            }}
        >
            <YourComponent />
        </ErrorBoundary>
    );
}
```

**Custom Fallback:**

```tsx
<ErrorBoundary
    fallback={
        <div>
            <h1>Custom Error Message</h1>
            <p>Something went wrong in this section.</p>
        </div>
    }
>
    <YourComponent />
</ErrorBoundary>
```

### 2. ValidationErrors

The `ValidationErrors` component displays validation errors in a consistent format.

**Usage:**

```tsx
import ValidationErrors from '@/Components/ValidationErrors';

function MyForm() {
    const [errors, setErrors] = useState({
        email: 'Email is required',
        password: ['Password is required', 'Password must be at least 8 characters'],
    });

    return (
        <form>
            <ValidationErrors errors={errors} />
            {/* Form fields */}
        </form>
    );
}
```

**Field-level errors:**

```tsx
import { FieldError } from '@/Components/ValidationErrors';

<div>
    <Input {...props} />
    <FieldError error={errors.fieldName} />
</div>
```

**Inline errors:**

```tsx
import { InlineValidationError } from '@/Components/ValidationErrors';

<InlineValidationError message="This action cannot be completed" />
```

### 3. API Client with Retry Logic

The `useApiClient` hook provides API methods with automatic retry logic and toast notifications.

**Basic Usage:**

```tsx
import { useApiClient } from '@/hooks/useApiClient';

function MyComponent() {
    const api = useApiClient();

    const handleSubmit = async () => {
        const response = await api.post('/api/endpoint', data, {
            showSuccessToast: true,
            successMessage: 'Data saved successfully',
            showErrorToast: true,
            errorMessage: 'Failed to save data',
            maxRetries: 3,
            retryDelay: 1000,
        });

        if (response.ok) {
            // Handle success
            console.log(response.data);
        }
    };

    return <button onClick={handleSubmit}>Submit</button>;
}
```

**Advanced Usage with Retry Callback:**

```tsx
const response = await api.post('/api/endpoint', data, {
    maxRetries: 5,
    retryDelay: 2000,
    onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt}:`, error.message);
        // Show loading indicator or update UI
    },
    retryOn: [408, 429, 500, 502, 503, 504], // HTTP status codes to retry
});
```

**All HTTP Methods:**

```tsx
// GET request
const response = await api.get('/api/users');

// POST request
const response = await api.post('/api/users', { name: 'John' });

// PUT request
const response = await api.put('/api/users/1', { name: 'Jane' });

// PATCH request
const response = await api.patch('/api/users/1', { email: 'jane@example.com' });

// DELETE request
const response = await api.delete('/api/users/1');
```

## Complete Example: Prescription Form with Error Handling

```tsx
import React, { useState } from 'react';
import { useApiClient } from '@/hooks/useApiClient';
import ValidationErrors from '@/Components/ValidationErrors';
import { FieldError } from '@/Components/ValidationErrors';
import ErrorBoundary from '@/Components/ErrorBoundary';

function PrescriptionFormExample() {
    const api = useApiClient();
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsLoading(true);

        try {
            const response = await api.post(
                '/api/prescriptions',
                formData,
                {
                    showSuccessToast: true,
                    successMessage: 'Prescription saved successfully',
                    maxRetries: 3,
                    retryDelay: 1000,
                    onRetry: (attempt) => {
                        console.log(`Retrying... (${attempt}/3)`);
                    },
                }
            );

            if (response.ok) {
                // Handle success
                console.log('Prescription created:', response.data);
            } else {
                // Handle validation errors
                if (response.status === 422) {
                    setErrors(response.data?.errors || {});
                }
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ErrorBoundary>
            <form onSubmit={handleSubmit}>
                <ValidationErrors errors={errors} />

                <div>
                    <label>Drug Name</label>
                    <input type="text" name="drug_name" />
                    <FieldError error={errors.drug_name} />
                </div>

                <div>
                    <label>Dosage</label>
                    <input type="text" name="dosage" />
                    <FieldError error={errors.dosage} />
                </div>

                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Prescription'}
                </button>
            </form>
        </ErrorBoundary>
    );
}
```

## Toast Notifications

Toast notifications are automatically shown for API requests when using `useApiClient`. You can customize them:

```tsx
const response = await api.post('/api/endpoint', data, {
    showSuccessToast: true,
    successMessage: 'Custom success message',
    showErrorToast: true,
    errorMessage: 'Custom error message',
});
```

To disable automatic toasts:

```tsx
const response = await api.post('/api/endpoint', data, {
    showSuccessToast: false,
    showErrorToast: false,
});
```

## Retry Configuration

The API client supports configurable retry logic:

- `maxRetries`: Maximum number of retry attempts (default: 3)
- `retryDelay`: Base delay in milliseconds between retries (default: 1000ms)
- `retryOn`: Array of HTTP status codes to retry on (default: [408, 429, 500, 502, 503, 504])
- `onRetry`: Callback function called on each retry attempt

The retry delay uses exponential backoff:
- Attempt 1: 1000ms
- Attempt 2: 2000ms
- Attempt 3: 4000ms
- etc.

## Best Practices

1. **Always wrap top-level components with ErrorBoundary**
   ```tsx
   <ErrorBoundary>
       <YourApp />
   </ErrorBoundary>
   ```

2. **Use ValidationErrors for form-level errors**
   ```tsx
   <ValidationErrors errors={errors} />
   ```

3. **Use FieldError for field-level errors**
   ```tsx
   <FieldError error={errors.fieldName} />
   ```

4. **Configure retry logic based on operation criticality**
   - Critical operations: Higher maxRetries (5+)
   - Non-critical operations: Lower maxRetries (2-3)

5. **Provide meaningful error messages**
   ```tsx
   errorMessage: 'Failed to save prescription. Please check your input and try again.'
   ```

6. **Handle both network and validation errors**
   ```tsx
   if (!response.ok) {
       if (response.status === 422) {
           // Validation errors
           setErrors(response.data?.errors);
       } else {
           // Other errors (already shown via toast)
       }
   }
   ```

## Requirement Coverage

This implementation satisfies Requirement 7.5:
- ✅ Error boundary components
- ✅ Validation error display
- ✅ Toast notifications for success/error messages
- ✅ Retry logic for failed API calls
