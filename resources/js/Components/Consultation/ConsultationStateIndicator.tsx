import React from 'react';
import { useConsultationState } from '@/hooks/consultation';

/**
 * Component to display consultation state indicators
 * Shows dirty state and last saved timestamp
 * Requirement 6.6: Display isDirty flag and lastSaved timestamp
 */
export default function ConsultationStateIndicator() {
  const { isDirty, lastSaved, isAutoSaving } = useConsultationState();

  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Auto-saving indicator */}
      {isAutoSaving && (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Saving...</span>
        </div>
      )}
      
      {/* Dirty state indicator */}
      {!isAutoSaving && isDirty && (
        <div className="flex items-center gap-2 text-amber-600">
          <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
          <span>Unsaved changes</span>
        </div>
      )}
      
      {/* Clean state indicator */}
      {!isAutoSaving && !isDirty && lastSaved && (
        <div className="flex items-center gap-2 text-green-600">
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
          <span>Saved</span>
        </div>
      )}
      
      {/* Last saved timestamp */}
      {lastSaved && (
        <span className="text-gray-500">
          Last saved: {formatLastSaved(lastSaved)}
        </span>
      )}
    </div>
  );
}
