import React, { useState, useEffect } from 'react';

interface Props {
  onShiftChange?: (shift: string) => void;
  currentShift?: string;
}

export default function ShiftToggle({ onShiftChange, currentShift }: Props) {
  const [selectedShift, setSelectedShift] = useState(currentShift || 'day');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Auto-detect shift based on time
  useEffect(() => {
    const hour = currentTime.getHours();
    let autoShift = 'day';
    
    if (hour >= 6 && hour < 18) {
      autoShift = 'day';
    } else {
      autoShift = 'night';
    }

    if (!currentShift) {
      setSelectedShift(autoShift);
    }
  }, [currentTime, currentShift]);

  const handleShiftChange = (shift: string) => {
    setSelectedShift(shift);
    if (onShiftChange) {
      onShiftChange(shift);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getShiftIcon = (shift: string) => {
    switch (shift) {
      case 'day': return '☀️';
      case 'night': return '🌙';
      default: return '🕐';
    }
  };

  const getShiftTime = (shift: string) => {
    switch (shift) {
      case 'day': return '6:00 AM - 6:00 PM';
      case 'night': return '6:00 PM - 6:00 AM';
      default: return '';
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Current Date & Time */}
      <div className="text-right">
        <div className="text-sm font-medium text-gray-900">
          {formatTime(currentTime)}
        </div>
        <div className="text-xs text-gray-600">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* Shift Toggle */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleShiftChange('day')}
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${selectedShift === 'day'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
          title={`Day Shift: ${getShiftTime('day')}`}
        >
          <span>{getShiftIcon('day')}</span>
          <span>Day</span>
        </button>
        
        <button
          onClick={() => handleShiftChange('night')}
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${selectedShift === 'night'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
          title={`Night Shift: ${getShiftTime('night')}`}
        >
          <span>{getShiftIcon('night')}</span>
          <span>Night</span>
        </button>
      </div>

      {/* Shift Info */}
      <div className="text-xs text-gray-500">
        <div className="font-medium">
          {selectedShift === 'day' ? 'Day Shift' : 'Night Shift'}
        </div>
        <div>
          {getShiftTime(selectedShift)}
        </div>
      </div>
    </div>
  );
}