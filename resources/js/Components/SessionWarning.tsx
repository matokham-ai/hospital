import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionWarningProps {
  warningMinutes?: number; // Show warning X minutes before expiry
}

export default function SessionWarning({ warningMinutes = 10 }: SessionWarningProps) {
  const { session_expires_at } = usePage().props as any;
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!session_expires_at) return;

    const checkSession = () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session_expires_at;
      const remaining = expiresAt - now;
      const remainingMinutes = Math.floor(remaining / 60);

      setTimeRemaining(remainingMinutes);

      // Show warning if less than warningMinutes remaining
      if (remainingMinutes <= warningMinutes && remainingMinutes > 0) {
        setShowWarning(true);
      } else if (remainingMinutes <= 0) {
        // Session expired - redirect to login
        router.visit('/login', {
          method: 'get',
          data: { expired: '1' },
        });
      } else {
        setShowWarning(false);
      }
    };

    // Check immediately
    checkSession();

    // Check every 30 seconds
    const interval = setInterval(checkSession, 30000);

    return () => clearInterval(interval);
  }, [session_expires_at, warningMinutes]);

  const handleExtendSession = () => {
    // Make a simple request to extend the session
    router.reload({ only: [] });
    setShowWarning(false);
  };

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Session Expiring Soon
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                  Your session will expire in <strong>{timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}</strong>.
                  Click below to continue working.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExtendSession}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-md transition"
                  >
                    <Clock className="w-4 h-4" />
                    Extend Session
                  </button>
                  <button
                    onClick={() => setShowWarning(false)}
                    className="p-1.5 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
