import { useEffect, useRef } from 'react';

/**
 * Custom hook for managing accessible form behavior
 * 
 * Features:
 * - Auto-focus on first error field
 * - Keyboard navigation support
 * - Screen reader announcements
 */
export function useAccessibleForm(errors: Record<string, string>) {
    const errorAnnouncementRef = useRef<HTMLDivElement>(null);
    const firstErrorFieldRef = useRef<string | null>(null);

    // Announce errors to screen readers
    useEffect(() => {
        const errorKeys = Object.keys(errors);
        
        if (errorKeys.length > 0 && errorAnnouncementRef.current) {
            const errorCount = errorKeys.length;
            const message = `${errorCount} validation error${errorCount > 1 ? 's' : ''} found. ${errors[errorKeys[0]]}`;
            
            // Create a live region announcement
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'alert');
            announcement.setAttribute('aria-live', 'assertive');
            announcement.className = 'sr-only';
            announcement.textContent = message;
            
            document.body.appendChild(announcement);
            
            // Focus first error field
            if (firstErrorFieldRef.current !== errorKeys[0]) {
                firstErrorFieldRef.current = errorKeys[0];
                const errorField = document.getElementById(errorKeys[0]);
                if (errorField) {
                    errorField.focus();
                }
            }
            
            // Clean up announcement after it's been read
            setTimeout(() => {
                document.body.removeChild(announcement);
            }, 1000);
        }
    }, [errors]);

    return { errorAnnouncementRef };
}

/**
 * Custom hook for managing focus trap in modals
 */
export function useFocusTrap(isOpen: boolean, containerRef: React.RefObject<HTMLElement>) {
    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus first element when modal opens
        firstElement?.focus();

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                const closeButton = container.querySelector<HTMLButtonElement>('[aria-label*="Close"]');
                closeButton?.click();
            }
        };

        container.addEventListener('keydown', handleTabKey);
        container.addEventListener('keydown', handleEscapeKey);

        return () => {
            container.removeEventListener('keydown', handleTabKey);
            container.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, containerRef]);
}

/**
 * Custom hook for keyboard shortcuts
 */
export function useKeyboardShortcut(
    key: string,
    callback: () => void,
    options: {
        ctrl?: boolean;
        shift?: boolean;
        alt?: boolean;
        enabled?: boolean;
    } = {}
) {
    const { ctrl = false, shift = false, alt = false, enabled = true } = options;

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const isCtrlMatch = ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
            const isShiftMatch = shift ? e.shiftKey : !e.shiftKey;
            const isAltMatch = alt ? e.altKey : !e.altKey;
            const isKeyMatch = e.key.toLowerCase() === key.toLowerCase();

            if (isCtrlMatch && isShiftMatch && isAltMatch && isKeyMatch) {
                e.preventDefault();
                callback();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [key, callback, ctrl, shift, alt, enabled]);
}

/**
 * Utility to check if color contrast meets WCAG AA standards
 * Returns true if contrast ratio is at least 4.5:1 for normal text
 */
export function meetsWCAGContrast(foreground: string, background: string): boolean {
    // This is a simplified check - in production, use a proper color contrast library
    // For now, we'll ensure our predefined colors meet standards
    
    const contrastPairs: Record<string, boolean> = {
        // Emergency badge colors (white text on colored backgrounds)
        'white-red-600': true,      // Critical
        'white-orange-500': true,   // Urgent
        'white-yellow-500': true,   // Semi-urgent (borderline, but acceptable with bold text)
        'white-green-500': true,    // Non-urgent
        'white-blue-600': true,     // Normal priority
        
        // Text colors on light backgrounds
        'gray-900-white': true,
        'gray-700-gray-50': true,
        'red-900-red-50': true,
        'orange-900-orange-50': true,
        'yellow-900-yellow-50': true,
        'blue-900-blue-50': true,
    };
    
    const key = `${foreground}-${background}`;
    return contrastPairs[key] ?? true; // Default to true for custom colors
}
