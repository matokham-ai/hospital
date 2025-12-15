import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Keyboard } from 'lucide-react';
import { KeyboardShortcut, formatShortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
    shortcuts: KeyboardShortcut[];
}

/**
 * KeyboardShortcutsModal Component
 * 
 * Displays a help modal showing all available keyboard shortcuts.
 * Requirement 8.6: Display keyboard shortcuts help modal
 */
export default function KeyboardShortcutsModal({
    isOpen,
    onClose,
    shortcuts,
}: KeyboardShortcutsModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Keyboard className="w-6 h-6 text-blue-600" />
                        Keyboard Shortcuts
                    </DialogTitle>
                    <DialogDescription>
                        Use these keyboard shortcuts to navigate and perform actions quickly in the consultation interface.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="space-y-3">
                        {shortcuts.map((shortcut, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {shortcut.description}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {formatShortcut(shortcut).split(' + ').map((key, keyIndex, array) => (
                                        <span key={keyIndex} className="flex items-center">
                                            <kbd className="px-3 py-1.5 text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">
                                                {key}
                                            </kbd>
                                            {keyIndex < array.length - 1 && (
                                                <span className="mx-1 text-gray-400">+</span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Additional tips */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Keyboard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                                    Pro Tips
                                </h4>
                                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                    <li>Keyboard shortcuts work throughout the consultation interface</li>
                                    <li>Press <kbd className="px-2 py-0.5 text-xs font-semibold bg-white border border-blue-300 rounded">?</kbd> anytime to view this help</li>
                                    <li>Some shortcuts may not work while typing in text fields (except save)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
