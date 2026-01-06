import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface TutorialContextType {
  run: boolean;
  setRun: (run: boolean) => void;
  steps: TutorialStep[];
  setSteps: (steps: TutorialStep[]) => void;
  completedPages: string[];
  markPageAsSeen: (path: string) => void;
  restartTutorial: () => void;
  isFirstVisit: boolean;
  resetAllTutorials: () => void;
  isAuthenticated: boolean;
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
}

interface TutorialStep {
  target: string;
  content: string;
  title: string;
  disableBeacon?: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const STORAGE_KEY = 'onboarding_progress';
const TUTORIAL_START_KEY = 'tutorial_start_timestamp';
const TUTORIAL_EXPIRY_HOURS = 48; // Tutorial automatically hides after 48 hours
const FIRST_LOGIN_KEY = 'first_login_completed';

// Inner component that uses useLocation - will be rendered inside Router context
const TutorialTracker: React.FC<{ children: ReactNode; setContextData: (data: any) => void }> = ({ 
  children, 
  setContextData 
}) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [completedPages, setCompletedPages] = useState<string[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasCompletedFirstLogin, setHasCompletedFirstLogin] = useState(false);

  // Load saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedPages(parsed);
        setIsFirstVisit(parsed.length === 0);
      } catch (e) {
        console.error('Error parsing tutorial progress:', e);
      }
    }

    // Check if this is the first login
    const firstLoginCompleted = localStorage.getItem(FIRST_LOGIN_KEY);
    setHasCompletedFirstLogin(!!firstLoginCompleted);
  }, []);

  // Check if user has seen dashboard tutorial
  const hasSeenDashboard = completedPages.includes('/dashboard');

  // Trigger welcome modal on first dashboard visit
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/dashboard' && !hasCompletedFirstLogin && !hasSeenDashboard) {
      // Show welcome modal instead of step-by-step tutorial
      // Small delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 500);
      
      return () => clearTimeout(timer);
    } else if (location.pathname !== '/dashboard') {
      // Close welcome modal when navigating away from dashboard
      setShowWelcome(false);
    }
  }, [isAuthenticated, location.pathname, hasCompletedFirstLogin, hasSeenDashboard]);

  // Mark first login as completed
  const completeFirstLogin = useCallback(() => {
    localStorage.setItem(FIRST_LOGIN_KEY, 'true');
    setHasCompletedFirstLogin(true);
    setShowWelcome(false);
  }, []);

  // Get current page tutorial steps
  const getCurrentPageSteps = useCallback((): TutorialStep[] => {
    // Import dynamically to avoid circular dependency
    const { getStepsForPath } = require('@/config/tutorialSteps');
    
    // Check for exact match
    const exactSteps = getStepsForPath(location.pathname);
    if (exactSteps.length > 0) {
      return exactSteps;
    }
    
    // Check for parameterized routes
    for (const [path, pageSteps] of Object.entries(require('@/config/tutorialSteps').tutorialSteps)) {
      if (path.includes(':')) {
        const pathParts = location.pathname.split('/');
        const patternParts = path.split('/');
        
        if (pathParts.length === patternParts.length) {
          let match = true;
          for (let i = 0; i < pathParts.length; i++) {
            if (patternParts[i].startsWith(':') || pathParts[i] === patternParts[i]) {
              continue;
            }
            match = false;
            break;
          }
          if (match) {
            return pageSteps;
          }
        }
      }
    }
    
    return [];
  }, [location.pathname]);

  // Check if user has seen tutorial for current page, if authenticated, and if tutorial hasn't expired
  useEffect(() => {
    // Only show tutorial if user is authenticated
    if (!isAuthenticated) {
      setRun(false);
      setSteps([]);
      return;
    }

    const currentPath = location.pathname;
    const pageSteps = getCurrentPageSteps();

    if (pageSteps.length > 0) {
      // Check if tutorial has expired (48 hours from first login)
      const tutorialStartStr = localStorage.getItem(TUTORIAL_START_KEY);
      const now = Date.now();

      // If no tutorial start timestamp, set it now (first time user sees tutorial)
      if (!tutorialStartStr) {
        localStorage.setItem(TUTORIAL_START_KEY, now.toString());
      } else {
        const tutorialStart = parseInt(tutorialStartStr);
        const hoursSinceStart = (now - tutorialStart) / (1000 * 60 * 60);

        // If more than 48 hours have passed, hide the tutorial permanently
        if (hoursSinceStart > TUTORIAL_EXPIRY_HOURS) {
          setSteps([]);
          setRun(false);
          return;
        }
      }

      const hasSeen = completedPages.includes(currentPath);
      setIsFirstVisit(!hasSeen);

      if (!hasSeen) {
        setSteps(pageSteps);
        setRun(true);
      } else {
        setSteps([]);
        setRun(false);
      }
    } else {
      setSteps([]);
      setRun(false);
    }
  }, [location.pathname, completedPages, isAuthenticated, getCurrentPageSteps]);

  const markPageAsSeen = useCallback((path: string) => {
    if (!completedPages.includes(path)) {
      const newCompleted = [...completedPages, path];
      setCompletedPages(newCompleted);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newCompleted));
      } catch (e) {
        console.error('Error saving tutorial progress:', e);
      }
    }
  }, [completedPages]);

  const restartTutorial = useCallback(() => {
    const currentPath = location.pathname;
    const newCompleted = completedPages.filter(p => p !== currentPath);
    setCompletedPages(newCompleted);
    setRun(true);
  }, [completedPages, location.pathname]);

  const resetAllTutorials = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FIRST_LOGIN_KEY);
    localStorage.removeItem(TUTORIAL_START_KEY);
    setCompletedPages([]);
    setIsFirstVisit(true);
    setHasCompletedFirstLogin(false);
    setShowWelcome(false);
  }, []);

  // Update context data for parent component
  useEffect(() => {
    setContextData({
      run,
      setRun,
      steps,
      setSteps,
      completedPages,
      markPageAsSeen,
      restartTutorial,
      isFirstVisit,
      resetAllTutorials,
      isAuthenticated,
      showWelcome,
      setShowWelcome: (show: boolean) => {
        setShowWelcome(show);
        if (!show) {
          completeFirstLogin();
        }
      },
    });
  }, [run, steps, completedPages, isFirstVisit, setContextData, markPageAsSeen, restartTutorial, resetAllTutorials, isAuthenticated, showWelcome, completeFirstLogin]);

  return <>{children}</>;
};

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contextData, setContextData] = useState<TutorialContextType | null>(null);

  // Provide context with default values until location is available
  const defaultContext: TutorialContextType = {
    run: false,
    setRun: () => {},
    steps: [],
    setSteps: () => {},
    completedPages: [],
    markPageAsSeen: () => {},
    restartTutorial: () => {},
    isFirstVisit: true,
    resetAllTutorials: () => {},
    isAuthenticated: false,
    showWelcome: false,
    setShowWelcome: () => {},
  };

  const value = contextData || defaultContext;

  return (
    <TutorialContext.Provider value={value}>
      <TutorialTracker setContextData={setContextData}>
        {children}
      </TutorialTracker>
    </TutorialContext.Provider>
  );
};

export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    // Return default values if context is not yet available
    return {
      run: false,
      setRun: () => {},
      steps: [],
      setSteps: () => {},
      completedPages: [],
      markPageAsSeen: () => {},
      restartTutorial: () => {},
      isFirstVisit: true,
      resetAllTutorials: () => {},
      isAuthenticated: false,
      showWelcome: false,
      setShowWelcome: () => {},
    };
  }
  return context;
};

export { STORAGE_KEY, FIRST_LOGIN_KEY };
