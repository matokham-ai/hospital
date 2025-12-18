import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, formatShortcut, KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
    let mockAction: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockAction = vi.fn();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should call action when correct key combination is pressed', () => {
        const shortcuts: KeyboardShortcut[] = [
            {
                key: 's',
                ctrl: true,
                description: 'Save',
                action: mockAction,
            },
        ];

        renderHook(() => useKeyboardShortcuts(shortcuts, true));

        // Simulate Ctrl+S
        const event = new KeyboardEvent('keydown', {
            key: 's',
            ctrlKey: true,
            bubbles: true,
        });

        window.dispatchEvent(event);

        expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should not call action when shortcuts are disabled', () => {
        const shortcuts: KeyboardShortcut[] = [
            {
                key: 's',
                ctrl: true,
                description: 'Save',
                action: mockAction,
            },
        ];

        renderHook(() => useKeyboardShortcuts(shortcuts, false));

        // Simulate Ctrl+S
        const event = new KeyboardEvent('keydown', {
            key: 's',
            ctrlKey: true,
            bubbles: true,
        });

        window.dispatchEvent(event);

        expect(mockAction).not.toHaveBeenCalled();
    });

    it('should handle multiple shortcuts', () => {
        const saveAction = vi.fn();
        const printAction = vi.fn();

        const shortcuts: KeyboardShortcut[] = [
            {
                key: 's',
                ctrl: true,
                description: 'Save',
                action: saveAction,
            },
            {
                key: 'p',
                ctrl: true,
                description: 'Print',
                action: printAction,
            },
        ];

        renderHook(() => useKeyboardShortcuts(shortcuts, true));

        // Simulate Ctrl+S
        window.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 's',
                ctrlKey: true,
                bubbles: true,
            })
        );

        expect(saveAction).toHaveBeenCalledTimes(1);
        expect(printAction).not.toHaveBeenCalled();

        // Simulate Ctrl+P
        window.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
            })
        );

        expect(printAction).toHaveBeenCalledTimes(1);
        expect(saveAction).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should handle shortcuts without modifiers', () => {
        const shortcuts: KeyboardShortcut[] = [
            {
                key: '?',
                description: 'Help',
                action: mockAction,
            },
        ];

        renderHook(() => useKeyboardShortcuts(shortcuts, true));

        // Simulate ? key
        const event = new KeyboardEvent('keydown', {
            key: '?',
            bubbles: true,
        });

        window.dispatchEvent(event);

        expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should handle Enter key with Ctrl modifier', () => {
        const shortcuts: KeyboardShortcut[] = [
            {
                key: 'Enter',
                ctrl: true,
                description: 'Submit',
                action: mockAction,
            },
        ];

        renderHook(() => useKeyboardShortcuts(shortcuts, true));

        // Simulate Ctrl+Enter
        const event = new KeyboardEvent('keydown', {
            key: 'Enter',
            ctrlKey: true,
            bubbles: true,
        });

        window.dispatchEvent(event);

        expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should not trigger when wrong modifier is pressed', () => {
        const shortcuts: KeyboardShortcut[] = [
            {
                key: 's',
                ctrl: true,
                description: 'Save',
                action: mockAction,
            },
        ];

        renderHook(() => useKeyboardShortcuts(shortcuts, true));

        // Simulate just 's' without Ctrl
        const event = new KeyboardEvent('keydown', {
            key: 's',
            bubbles: true,
        });

        window.dispatchEvent(event);

        expect(mockAction).not.toHaveBeenCalled();
    });

    it('should cleanup event listeners on unmount', () => {
        const shortcuts: KeyboardShortcut[] = [
            {
                key: 's',
                ctrl: true,
                description: 'Save',
                action: mockAction,
            },
        ];

        const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts, true));

        unmount();

        // Simulate Ctrl+S after unmount
        const event = new KeyboardEvent('keydown', {
            key: 's',
            ctrlKey: true,
            bubbles: true,
        });

        window.dispatchEvent(event);

        // Action should not be called after unmount
        expect(mockAction).not.toHaveBeenCalled();
    });
});

describe('formatShortcut', () => {
    it('should format shortcut with Ctrl modifier', () => {
        const shortcut: KeyboardShortcut = {
            key: 's',
            ctrl: true,
            description: 'Save',
            action: vi.fn(),
        };

        expect(formatShortcut(shortcut)).toBe('Ctrl + S');
    });

    it('should format shortcut with multiple modifiers', () => {
        const shortcut: KeyboardShortcut = {
            key: 's',
            ctrl: true,
            shift: true,
            description: 'Save As',
            action: vi.fn(),
        };

        expect(formatShortcut(shortcut)).toBe('Ctrl + Shift + S');
    });

    it('should format shortcut without modifiers', () => {
        const shortcut: KeyboardShortcut = {
            key: '?',
            description: 'Help',
            action: vi.fn(),
        };

        expect(formatShortcut(shortcut)).toBe('?');
    });

    it('should format shortcut with Alt modifier', () => {
        const shortcut: KeyboardShortcut = {
            key: 'f',
            alt: true,
            description: 'File menu',
            action: vi.fn(),
        };

        expect(formatShortcut(shortcut)).toBe('Alt + F');
    });

    it('should format Enter key correctly', () => {
        const shortcut: KeyboardShortcut = {
            key: 'Enter',
            ctrl: true,
            description: 'Submit',
            action: vi.fn(),
        };

        expect(formatShortcut(shortcut)).toBe('Ctrl + ENTER');
    });
});
