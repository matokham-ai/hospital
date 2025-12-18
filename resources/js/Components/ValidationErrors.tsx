import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationErrorsProps {
    errors: Record<string, string | string[]>;
    className?: string;
    title?: string;
    showIcon?: boolean;
}

/**
 * ValidationErrors Component
 * 
 * Displays validation errors in a consistent format.
 * Can show errors as a list or inline with form fields.
 * 
 * Requirement 7.5: Validation error display
 */
export default function ValidationErrors({
    errors,
    className,
    title = 'Please correct the following errors:',
    showIcon = true,
}: ValidationErrorsProps) {
    const errorEntries = Object.entries(errors);

    if (errorEntries.length === 0) {
        return null;
    }

    // Flatten error messages (handle both string and string[] values)
    const errorMessages = errorEntries.flatMap(([field, messages]) => {
        const messageArray = Array.isArray(messages) ? messages : [messages];
        return messageArray.map(message => ({
            field,
            message,
        }));
    });

    return (
        <div
            className={cn(
                'rounded-lg border-2 border-red-300 bg-red-50 p-4',
                className
            )}
            role="alert"
            aria-live="assertive"
        >
            <div className="flex items-start gap-3">
                {showIcon && (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-900 mb-2">
                        {title}
                    </h3>
                    <ul className="space-y-1">
                        {errorMessages.map((error, index) => (
                            <li
                                key={`${error.field}-${index}`}
                                className="text-sm text-red-800 flex items-start gap-2"
                            >
                                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>
                                    <span className="font-medium capitalize">
                                        {error.field.replace(/_/g, ' ')}:
                                    </span>{' '}
                                    {error.message}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

/**
 * FieldError Component
 * 
 * Displays a single field error inline with a form field.
 */
interface FieldErrorProps {
    error?: string | string[];
    className?: string;
}

export function FieldError({ error, className }: FieldErrorProps) {
    if (!error) {
        return null;
    }

    const errorMessage = Array.isArray(error) ? error[0] : error;

    return (
        <p
            className={cn('text-xs text-red-600 mt-1 flex items-center gap-1', className)}
            role="alert"
        >
            <XCircle className="w-3 h-3 flex-shrink-0" />
            <span>{errorMessage}</span>
        </p>
    );
}

/**
 * InlineValidationError Component
 * 
 * Displays validation error as an inline banner.
 */
interface InlineValidationErrorProps {
    message: string;
    className?: string;
}

export function InlineValidationError({
    message,
    className,
}: InlineValidationErrorProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200',
                className
            )}
            role="alert"
        >
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{message}</p>
        </div>
    );
}
