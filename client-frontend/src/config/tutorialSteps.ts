// Tutorial configuration - Action-oriented workflow tutorial for new users
// Focuses on helping users accomplish tasks, not explaining obvious UI elements

export interface TutorialStep {
  target: string;
  content: string;
  title: string;
  disableBeacon?: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const tutorialSteps: Record<string, TutorialStep[]> = {
  // Dashboard - Main entry point after login
  '/dashboard': [
    {
      target: '.tour-quick-actions',
      content: 'Start here! These quick actions let you create new procurement requests or find what you need fast. Click "Create Request" to submit your first request.',
      title: 'Quick Actions',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-create-request-btn',
      content: 'Ready to request something? Click this button to start a new procurement request. You can specify items, quantities, delivery address, and your budget.',
      title: 'Create New Request',
      placement: 'left',
    },
    {
      target: '.tour-my-requests-link',
      content: 'View and track all your procurement requests here. See status, details, and communicate with our team about any request.',
      title: 'View Your Requests',
      placement: 'bottom',
    },
    {
      target: '.tour-chat-link',
      content: 'Need help or have questions? Click here to chat with our support team directly. We are available 24/7 to assist you.',
      title: 'Get Support',
      placement: 'bottom',
    },
    {
      target: '.tour-categories-link',
      content: 'Browse available product categories to see what we can procure for you. Click to explore iPhones, medical equipment, machinery, and more.',
      title: 'Browse Categories',
      placement: 'bottom',
    },
  ],
  // My Requests page
  '/my-requests': [
    {
      target: '.tour-create-request-btn',
      content: 'Create a new procurement request. Fill in the details of what you need, and our team will get you quotes from suppliers.',
      title: 'Create New Request',
      disableBeacon: true,
      placement: 'left',
    },
    {
      target: '.tour-filter-tabs',
      content: 'Quickly filter your requests by status: Active (pending), Completed, or Cancelled. Find exactly what you are looking for in seconds.',
      title: 'Filter by Status',
      placement: 'bottom',
    },
    {
      target: '.tour-search-bar',
      content: 'Search any request by request number, product name, or date. No need to scroll through all your requests.',
      title: 'Search Requests',
      placement: 'bottom',
    },
  ],
  // Create Request page
  '/requests/new': [
    {
      target: '.tour-item-list',
      content: 'Add all items you need to procure. Include product names, quantities, and any specific brand or specifications you prefer.',
      title: 'Add Request Items',
      disableBeacon: true,
      placement: 'top',
    },
    {
      target: '.tour-budget-section',
      content: 'Set your estimated budget (optional) to help us provide you with accurate quotes. You can choose NGN or USD.',
      title: 'Set Budget (Optional)',
      placement: 'top',
    },
    {
      target: '.tour-delivery-address',
      content: 'Enter the complete delivery address. Accurate information ensures your items arrive at the right location on time.',
      title: 'Delivery Details',
      placement: 'top',
    },
    {
      target: '.tour-upload-section',
      content: 'Upload reference documents, quotes, or specifications to help us understand exactly what you need.',
      title: 'Attach Documents',
      placement: 'top',
    },
    {
      target: '.tour-submit-btn',
      content: 'Review all details and submit your request. Our team will review and respond with supplier quotes within 24 hours.',
      title: 'Submit Request',
      placement: 'left',
    },
  ],
  // Request Detail page
  '/requests/:id': [
    {
      target: '.tour-request-timeline',
      content: 'Track your request progress through each stage: Received → Reviewing → Sourcing → Completed. Click to see updates.',
      title: 'Track Progress',
      disableBeacon: true,
      placement: 'top',
    },
    {
      target: '.tour-request-summary',
      content: 'View the cost breakdown including your budget (if set), subtotal, taxes, and estimated total.',
      title: 'Cost Details',
      placement: 'left',
    },
    {
      target: '.tour-chat-link',
      content: 'Have questions about this request? Click here to chat with our support team directly.',
      title: 'Contact Support',
      placement: 'left',
    },
  ],
  // Chat page
  '/chat': [
    {
      target: '.tour-chat-input',
      content: 'Type your message here and press Enter to send. You can ask questions about requests, get quotes, or request updates.',
      title: 'Send Messages',
      disableBeacon: true,
      placement: 'top',
    },
    {
      target: '.tour-call-support',
      content: 'Need to talk directly? Use the phone or video buttons to start a voice or video call with our support team.',
      title: 'Call Support',
      placement: 'left',
    },
  ],
  // Categories page
  '/categories': [
    {
      target: '.tour-category-cards',
      content: 'Browse our product categories. Click on any category to see available products or start a procurement request for that category.',
      title: 'Browse Categories',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-create-from-category',
      content: 'Found what you need? Click the "Create Request" button on any category to start a request for products in that category.',
      title: 'Quick Request',
      placement: 'right',
    },
  ],
};

// Helper function to get steps for current route
export const getStepsForPath = (path: string): TutorialStep[] => {
  // Check for exact match first
  if (tutorialSteps[path]) {
    return tutorialSteps[path];
  }

  // Check for dynamic route patterns
  for (const pattern of Object.keys(tutorialSteps)) {
    if (pattern.includes(':')) {
      // Convert route pattern to regex
      const regexPattern = pattern.replace(/:[^\/]+/g, '[^/]+');
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(path)) {
        return tutorialSteps[pattern];
      }
    }
  }

  return [];
};

// Tutorial configuration for the welcome modal on dashboard
export const dashboardWelcomeSteps: TutorialStep[] = [
  {
    target: '.tour-quick-actions',
    content: 'Welcome! These quick actions help you get things done fast. Create requests, view your history, or browse products.',
    title: 'Welcome to Your Dashboard',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '.tour-create-request-btn',
    content: 'Click here to create a new procurement request. It is the fastest way to get started with your first order.',
    title: 'Create Your First Request',
    placement: 'bottom',
  },
  {
    target: '.tour-my-requests-link',
    content: 'All your requests are stored here. Track status, view details, and communicate with our team.',
    title: 'Track Your Requests',
    placement: 'bottom',
  },
];
