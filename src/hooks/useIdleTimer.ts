import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export function useIdleTimer() {
  const { signOut } = useAuth();
  const timeoutRef = useRef<number>();

  const resetTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      toast.error('Session expired due to inactivity');
      signOut();
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click'
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Set up event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [signOut]);
}