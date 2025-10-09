import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../hooks/useUser';
import Modal from './ui/Modal';

const SessionTimeout = () => {
  const { user, logout, isAuthenticated } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerId, setTimerId] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [warningTime, setWarningTime] = useState(5 * 60 * 1000); // 5 minutes warning
  const [sessionTimeout, setSessionTimeout] = useState(30 * 60 * 1000); // 30 minutes total

  // Reset activity timer
  const resetActivityTimer = useCallback(() => {
    setLastActivity(Date.now());
    
    // Clear existing timer
    if (timerId) {
      clearTimeout(timerId);
    }
    
    // Set new timer for warning
    const warningTimer = setTimeout(() => {
      if (isAuthenticated) {
        const timeRemaining = sessionTimeout - (Date.now() - lastActivity);
        if (timeRemaining > 0) {
          setTimeLeft(Math.ceil(timeRemaining / 1000));
          setIsModalOpen(true);
          
          // Set final logout timer
          const logoutTimer = setTimeout(() => {
            handleLogout();
          }, warningTime);
          
          setTimerId(logoutTimer);
        }
      }
    }, sessionTimeout - warningTime);
    
    setTimerId(warningTimer);
  }, [isAuthenticated, lastActivity, sessionTimeout, warningTime, timerId]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    if (isAuthenticated) {
      resetActivityTimer();
    }
  }, [isAuthenticated, resetActivityTimer]);

  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
    setIsModalOpen(false);
    if (timerId) {
      clearTimeout(timerId);
    }
  }, [logout, timerId]);

  // Extend session
  const extendSession = useCallback(() => {
    setIsModalOpen(false);
    resetActivityTimer();
  }, [resetActivityTimer]);

  // Set up activity listeners
  useEffect(() => {
    if (isAuthenticated) {
      // Add event listeners for user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        document.addEventListener(event, handleActivity, { passive: true });
      });

      // Initialize timer
      resetActivityTimer();

      // Cleanup
      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity);
        });
        if (timerId) {
          clearTimeout(timerId);
        }
      };
    }
  }, [isAuthenticated, handleActivity, resetActivityTimer, timerId]);

  // Update countdown
  useEffect(() => {
    let countdownInterval;
    if (isModalOpen && timeLeft > 0) {
      countdownInterval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [isModalOpen, timeLeft, handleLogout]);

  // Auto-logout when user becomes unauthenticated
  useEffect(() => {
    if (!isAuthenticated && isModalOpen) {
      setIsModalOpen(false);
      if (timerId) {
        clearTimeout(timerId);
      }
    }
  }, [isAuthenticated, isModalOpen, timerId]);

  if (!isAuthenticated) {
    return null;
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
      title="Session About to Expire"
      className="session-timeout-modal"
    >
      <div className="text-center py-6">
        <div className="text-6xl mb-4">⏰</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Your session is about to expire
        </h3>
        <p className="text-gray-600 mb-6">
          For your security, your session will timeout in {formatTime(timeLeft)} due to inactivity.
        </p>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-red-700 font-medium">Session Timeout Warning</span>
          </div>
          <p className="text-red-600 text-sm">
            Please choose to continue your session or logout securely.
          </p>
        </div>

        <div className="flex space-x-4 justify-center">
          <button
            onClick={extendSession}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Continue Session
          </button>
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Logout Securely
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p>Tip: Keep your session active by clicking or typing periodically.</p>
          <p className="mt-1">For maximum security, always logout when done using your account.</p>
        </div>
      </div>
    </Modal>
  );
};

export default SessionTimeout;