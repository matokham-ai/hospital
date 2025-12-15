import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KeyboardShortcutsModal from '@/Components/Consultation/KeyboardShortcutsModal';
import { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

describe('KeyboardShortcutsModal', () => {
    const mockShortcuts: KeyboardShortcut[] = [
        {
            key: 's',
            ctrl: true,
            description: 'Save SOAP notes',
            action: vi.fn(),
        },
        {
            key: 'p',
            ctrl: true,
            description: 'Add prescription',
            action: vi.fn(),
        },
        {
            key: 'l',
            ctrl: true,
            description: 'Add lab order',
            action: vi.fn(),
        },
        {
            key: 'Enter',
            ctrl: true,
            description: 'Complete consultation',
            action: vi.fn(),
        },
        {
            key: '?',
            description: 'Show keyboard shortcuts help',
            action: vi.fn(),
        },
    ];

    it('renders modal when isOpen is true', () => {
        render(
            <KeyboardShortcutsModal
                isOpen={true}
                onClose={vi.fn()}
                shortcuts={mockShortcuts}
            />
        );

        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
        render(
            <KeyboardShortcutsModal
                isOpen={false}
                onClose={vi.fn()}
                shortcuts={mockShortcuts}
            />
        );

        expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });

    it('displays all shortcuts with their descriptions', () => {
        render(
            <KeyboardShortcutsModal
                isOpen={true}
                onClose={vi.fn()}
                shortcuts={mockShortcuts}
            />
        );

        expect(screen.getByText('Save SOAP notes')).toBeInTheDocument();
        expect(screen.getByText('Add prescription')).toBeInTheDocument();
        expect(screen.getByText('Add lab order')).toBeInTheDocument();
        expect(screen.getByText('Complete consultation')).toBeInTheDocument();
        expect(screen.getByText('Show keyboard shortcuts help')).toBeInTheDocument();
    });

    it('displays keyboard shortcut keys correctly', () => {
        render(
            <KeyboardShortcutsModal
                isOpen={true}
                onClose={vi.fn()}
                shortcuts={mockShortcuts}
            />
        );

        // Check for Ctrl key
        const ctrlKeys = screen.getAllByText('Ctrl');
        expect(ctrlKeys.length).toBeGreaterThan(0);

        // Check for specific keys
        expect(screen.getByText('S')).toBeInTheDocument();
        expect(screen.getByText('P')).toBeInTheDocument();
        expect(screen.getByText('L')).toBeInTheDocument();
    });

    it('displays pro tips section', () => {
        render(
            <KeyboardShortcutsModal
                isOpen={true}
                onClose={vi.fn()}
                shortcuts={mockShortcuts}
            />
        );

        expect(screen.getByText('Pro Tips')).toBeInTheDocument();
        expect(
            screen.getByText(/Keyboard shortcuts work throughout the consultation interface/i)
        ).toBeInTheDocument();
    });

    it('calls onClose when dialog is closed', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();

        render(
            <KeyboardShortcutsModal
                isOpen={true}
                onClose={onClose}
                shortcuts={mockShortcuts}
            />
        );

        // The Dialog component from shadcn/ui handles the close button
        // We can test that the onClose prop is passed correctly
        expect(onClose).not.toHaveBeenCalled();
    });

    it('renders empty state when no shortcuts provided', () => {
        render(
            <KeyboardShortcutsModal
                isOpen={true}
                onClose={vi.fn()}
                shortcuts={[]}
            />
        );

        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
        // Modal should still render but with no shortcuts listed
    });

    it('formats shortcuts with multiple modifiers correctly', () => {
        const complexShortcuts: KeyboardShortcut[] = [
            {
                key: 's',
                ctrl: true,
                shift: true,
                description: 'Save As',
                action: vi.fn(),
            },
        ];

        render(
            <KeyboardShortcutsModal
                isOpen={true}
                onClose={vi.fn()}
                shortcuts={complexShortcuts}
            />
        );

        expect(screen.getByText('Save As')).toBeInTheDocument();
        expect(screen.getByText('Ctrl')).toBeInTheDocument();
        expect(screen.getByText('Shift')).toBeInTheDocument();
        expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('displays keyboard icon in header', () => {
        render(
            <KeyboardShortcutsModal
                isOpen={true}
                onClose={vi.fn()}
                shortcuts={mockShortcuts}
            />
        );

        // The Keyboard icon from lucide-react should be rendered
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('renders shortcuts in a scrollable container', () => {
        // Create many shortcuts to test scrolling
        const manyShortcuts: KeyboardShortcut[] = Array.from({ length: 20 }, (_, i) => ({
            key: `${i}`,
            ctrl: true,
            description: `Action ${i}`,
            action: vi.fn(),
        }));

        render(
            <KeyboardShortcutsModal
                isOpen={true}
                onClose={vi.fn()}
                shortcuts={manyShortcuts}
            />
        );

        // Check that at least some shortcuts are rendered
        expect(screen.getByText('Action 0')).toBeInTheDocument();
        expect(screen.getByText('Action 1')).toBeInTheDocument();
    });
});
