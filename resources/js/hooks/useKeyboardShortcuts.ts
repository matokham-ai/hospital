import { useEffect, useCallback } from 'react';

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    description: string;
    action: () => void;
}

/**
 * useKeyboardShortcuts Hook
 * 
 * Manages keyboard shortcuts for the consultation interface.
 * Requirement 8.6: Support keyboard shortcuts for common actions
 * 
 * @param shortcuts - Array of keyboard shortcut configurations
 * @param enabled - Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
    shortcuts: KeyboardShortcut[],
    enabled: boolean = true
) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Don't trigger shortcuts when typing in input fields (except Ctrl+S for save)
            const target = event.target as HTMLElement;
            const isInputField = 
                target.tagName === 'INPUT' || 
                target.tagName === 'TEXTAREA' || 
                target.isContentEditable;

            // Allow Ctrl+S even in input fields
            const isCtrlS = event.ctrlKey && event.key.toLowerCase() === 's';

            if (isInputField && !isCtrlS) {
                return;
            }

            // Check each shortcut
            for (const shortcut of shortcuts) {
                const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatches = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
                const altMatches = shortcut.alt ? event.altKey : !event.altKey;
                const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;

                if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        },
        [shortcuts, enabled]
    );

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown, enabled]);
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());

    return parts.join(' + ');
}
