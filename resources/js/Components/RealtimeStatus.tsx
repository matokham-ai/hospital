import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function RealtimeStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Check if Echo is available and properly configured
    if (window.Echo && window.Echo.connector && window.Echo.connector.pusher) {
      try {
        setShowStatus(true); // Show status indicator when Echo is configured
        
        // Listen for connection events
        window.Echo.connector.pusher.connection.bind('connected', () => {
          setIsConnected(true);
          setLastUpdate(new Date());
          console.log('✅ Real-time connection established');
        });

        window.Echo.connector.pusher.connection.bind('disconnected', () => {
          setIsConnected(false);
          console.log('⚠️ Real-time connection lost');
        });

        // Check initial connection state
        if (window.Echo.connector.pusher.connection.state === 'connected') {
          setIsConnected(true);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.warn('Real-time status component error:', error);
        setIsConnected(false);
        setShowStatus(false);
      }
    } else {
      // Echo not available or not configured - hide the component
      setIsConnected(false);
      setShowStatus(false);
    }

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  // Don't render anything if Echo is not configured
  if (!showStatus) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
        isConnected 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Live Updates Active</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Connecting...</span>
          </>
        )}
        {lastUpdate && (
          <span className="text-xs opacity-75">
            {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
