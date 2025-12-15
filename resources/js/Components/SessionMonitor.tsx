import { useEffect } from 'react';
import { setupSessionRefresh } from '@/utils/session';

interface SessionMonitorProps {
    refreshIntervalMinutes?: number;
}

export default function SessionMonitor({ refreshIntervalMinutes = 30 }: SessionMonitorProps) {
    useEffect(() => {
        // Set up automatic session refresh
        setupSessionRefresh(refreshIntervalMinutes);
        
        // Clean up on unmount
        return () => {
            // Note: setInterval cleanup is handled by the browser when the page unloads
        };
    }, [refreshIntervalMinutes]);

    // This component doesn't render anything visible
    return null;
}