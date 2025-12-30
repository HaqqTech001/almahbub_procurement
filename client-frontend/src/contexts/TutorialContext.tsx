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
}

interface TutorialStep {
  target: string;
  content: string;
  title: string;
  disableBeacon?: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

// Page-specific tutorial configurations
const PAGE_TUTORIALS: Record<string, TutorialStep[]> = {
  '/': [
    {
      target: '.dashboard-hero',
      title: 'Welcome to Procurement Platform',
      content: 'This is your main dashboard where you can see an overview of all procurement activities, statistics, and quick access to key features.',
      placement: 'bottom'
    },
    {
      target: '.stats-cards',
      title: 'Quick Statistics',
      content: 'Here you can see key metrics at a glance: total orders, pending requests, approved orders, and total spent. These numbers update in real-time.',
      placement: 'top'
    },
    {
      target: '.recent-orders',
      title: 'Recent Orders',
      content: 'This section shows your most recent procurement orders. Click on any order to view details, track status, or manage the request.',
      placement: 'top'
    }
  ],
  '/announcements': [
    {
      target: '.announcements-header',
      title: 'Announcements Center',
      content: 'This page displays all company announcements and updates. Stay informed about important news, maintenance schedules, and new features.',
      placement: 'bottom'
    },
    {
      target: '.announcement-filters',
      title: 'Filter Announcements',
      content: 'Use these filters to find announcements by type (info, maintenance, update, urgent, promotion) or search by keywords.',
      placement: 'bottom'
    },
    {
      target: '.announcement-cards',
      title: 'Announcement Cards',
      content: 'Each card shows the announcement title, type badge, and preview. Click on any card to read the full announcement and see attached media.',
      placement: 'top'
    }
  ],
  '/announcements/:id': [
    {
      target: '.announcement-title',
      title: 'Announcement Details',
      content: 'This is the full announcement. Read all the details about company updates, maintenance notices, or special promotions here.',
      placement: 'bottom'
    },
    {
      target: '.announcement-content',
      title: 'Announcement Content',
      content: 'The main content of the announcement is displayed here. You can see all text, formatted sections, and important information.',
      placement: 'top'
    },
    {
      target: '.announcement-media',
      title: 'Attached Media',
      content: 'Any images, documents, or files attached to this announcement appear here. Click on images to view them fullscreen.',
      placement: 'top'
    },
    {
      target: '.reply-section',
      title: 'Reply to Announcement',
      content: 'Use this section to reply to the announcement. Your response will be visible to the admin team and other users.',
      placement: 'top'
    }
  ],
  '/chat': [
    {
      target: '.chat-header',
      title: 'Customer Support Chat',
      content: 'This is your direct line to customer support. Admin team members are available to help with any procurement questions or issues.',
      placement: 'bottom'
    },
    {
      target: '.chat-messages',
      title: 'Message History',
      content: 'All your conversations with the support team appear here. Messages are saved so you can reference previous discussions.',
      placement: 'top'
    },
    {
      target: '.chat-input',
      title: 'Send Messages',
      content: 'Type your message here and press enter or click the send button. You can also attach files, use emoji, and share images.',
      placement: 'top'
    },
    {
      target: '.chat-actions',
      title: 'Additional Actions',
      content: 'Need to talk in real-time? Use the phone or video icons to initiate voice or video calls with support staff.',
      placement: 'left'
    }
  ],
  '/orders': [
    {
      target: '.orders-header',
      title: 'Order Management',
      content: 'This page shows all your procurement orders. Track status, view details, and manage your purchasing requests.',
      placement: 'bottom'
    },
    {
      target: '.order-filters',
      title: 'Filter & Search Orders',
      content: 'Quickly find specific orders using filters by status (pending, processing, approved, rejected, completed) or search by keyword.',
      placement: 'bottom'
    },
    {
      target: '.order-timeline',
      title: 'Order Timeline',
      content: 'Each order shows its current status and timeline. Click on an order to see detailed tracking information and updates.',
      placement: 'top'
    },
    {
      target: '.create-order-btn',
      title: 'Create New Order',
      content: 'Ready to make a new procurement request? Click this button to start creating a new order with products, quantities, and budget details.',
      placement: 'left'
    }
  ],
  '/orders/new': [
    {
      target: '.order-form-header',
      title: 'Create Procurement Order',
      content: 'This form lets you submit a new procurement request. Fill in all required details to help us process your order efficiently.',
      placement: 'bottom'
    },
    {
      target: '.product-selection',
      title: 'Product Selection',
      content: 'Select the products or services you want to procure. You can browse categories, search for specific items, and add them to your order.',
      placement: 'top'
    },
    {
      target: '.quantity-budget',
      title: 'Quantity & Budget',
      content: 'Specify how many units you need and your budget constraints. This helps ensure your request gets approved quickly.',
      placement: 'top'
    },
    {
      target: '.file-upload',
      title: 'Attach Files',
      content: 'Upload any relevant documents, specifications, or files that help explain your procurement request.',
      placement: 'top'
    },
    {
      target: '.submit-order',
      title: 'Submit Request',
      content: 'Once you\'ve filled in all details, review your order and click submit. You\'ll receive updates as your request is processed.',
      placement: 'top'
    }
  ]
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const STORAGE_KEY = 'onboarding_progress';
const TUTORIAL_START_KEY = 'tutorial_start_timestamp';
const TUTORIAL_EXPIRY_HOURS = 48; // Tutorial automatically hides after 48 hours

// Inner component that uses useLocation - will be rendered inside Router context
const TutorialTracker: React.FC<{ children: ReactNode; setContextData: (data: any) => void }> = ({ 
  children, 
  setContextData 
}) => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [completedPages, setCompletedPages] = useState<string[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

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
  }, []);

  // Get current page tutorial steps
  const getCurrentPageSteps = useCallback((): TutorialStep[] => {
    // Check for exact match
    if (PAGE_TUTORIALS[location.pathname]) {
      return PAGE_TUTORIALS[location.pathname];
    }
    
    // Check for parameterized routes
    for (const [path, pageSteps] of Object.entries(PAGE_TUTORIALS)) {
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
    setCompletedPages([]);
    setIsFirstVisit(true);
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
    });
  }, [run, steps, completedPages, isFirstVisit, setContextData, markPageAsSeen, restartTutorial, resetAllTutorials]);

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
    };
  }
  return context;
};

export { PAGE_TUTORIALS, STORAGE_KEY };
