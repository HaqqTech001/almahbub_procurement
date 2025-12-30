// Tutorial configuration for all pages
// Each page has specific steps that guide users through key features

export interface TutorialStep {
  target: string;
  content: string;
  title: string;
  disableBeacon?: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const tutorialSteps: Record<string, TutorialStep[]> = {
  '/': [
    {
      target: '.tour-hero-title',
      content: 'Welcome to Almahbub Procurement. We connect buyers with trusted suppliers for all your business needs.',
      title: 'Welcome to Almahbub',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-categories',
      content: 'Browse our extensive catalog of product categories to find exactly what you need for your business.',
      title: 'Browse Categories',
      placement: 'bottom',
    },
    {
      target: '.tour-services',
      content: 'Learn about our comprehensive procurement services designed to streamline your purchasing process.',
      title: 'Our Services',
      placement: 'top',
    },
    {
      target: '.tour-cta',
      content: 'Ready to get started? Create your first procurement request in just a few simple steps.',
      title: 'Get Started',
      placement: 'bottom',
    },
  ],
  '/dashboard': [
    {
      target: '.tour-welcome',
      content: 'This is your personal dashboard where you can monitor all your procurement activities at a glance.',
      title: 'Your Dashboard',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-stats',
      content: 'Quick overview of your active requests, total spending, and pending approvals. Click any card for details.',
      title: 'Quick Stats',
      placement: 'bottom',
    },
    {
      target: '.tour-recent-requests',
      content: 'View your most recent procurement requests and their current status. Click to view full details.',
      title: 'Recent Requests',
      placement: 'top',
    },
    {
      target: '.tour-quick-actions',
      content: 'Create new requests or access frequently used features instantly from this quick actions panel.',
      title: 'Quick Actions',
      placement: 'left',
    },
  ],
  '/my-requests': [
    {
      target: '.tour-requests-header',
      content: 'Manage all your procurement requests in one place. Track status, view details, or create new requests.',
      title: 'My Requests',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-filter-tabs',
      content: 'Filter requests by status to quickly find what you are looking for. All, Active, Completed, or Cancelled.',
      title: 'Filter by Status',
      placement: 'bottom',
    },
    {
      target: '.tour-search-bar',
      content: 'Search through your requests by request number, product name, or date range.',
      title: 'Search Requests',
      placement: 'bottom',
    },
    {
      target: '.tour-create-request-btn',
      content: 'Need something new? Click here to create a fresh procurement request with detailed specifications.',
      title: 'Create New Request',
      placement: 'left',
    },
  ],
  '/requests/new': [
    {
      target: '.tour-form-header',
      content: 'Fill in the details of what you need. Be as specific as possible to get accurate quotes.',
      title: 'New Request Form',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-item-list',
      content: 'Add all the items you need to this list. Include quantity, specifications, and any preferred brands.',
      title: 'Add Items',
      placement: 'top',
    },
    {
      target: '.tour-upload-section',
      content: 'Upload reference documents, quotes from other suppliers, or technical specifications here.',
      title: 'Upload Documents',
      placement: 'top',
    },
    {
      target: '.tour-delivery-address',
      content: 'Specify where and when you need your items delivered. Accurate information prevents delays.',
      title: 'Delivery Details',
      placement: 'top',
    },
    {
      target: '.tour-submit-btn',
      content: 'Review all details and submit your request. Our team will review and respond within 24 hours.',
      title: 'Submit Request',
      placement: 'left',
    },
  ],
  '/requests/:id': [
    {
      target: '.tour-request-header',
      content: 'View complete details of your procurement request including all items and specifications.',
      title: 'Request Details',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-request-timeline',
      content: 'Track your request progress through each stage from submission to completion.',
      title: 'Progress Timeline',
      placement: 'top',
    },
    {
      target: '.tour-request-summary',
      content: 'View the cost breakdown including subtotal, taxes, and total estimated amount.',
      title: 'Cost Summary',
      placement: 'left',
    },
    {
      target: '.tour-delivery-info',
      content: 'Check the delivery address and expected delivery date for this request.',
      title: 'Delivery Information',
      placement: 'left',
    },
  ],
  '/chat': [
    {
      target: '.tour-chat-header',
      content: 'Your central hub for all communications with our procurement team and suppliers.',
      title: 'Chat System',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-conversations',
      content: 'View all your active conversations. Click on any conversation to open the chat.',
      title: 'Conversations',
      placement: 'right',
    },
    {
      target: '.tour-chat-input',
      content: 'Type your message here. You can attach images, documents, or use quick reply templates.',
      title: 'Send Messages',
      placement: 'top',
    },
    {
      target: '.tour-call-buttons',
      content: 'Need to talk directly? Use voice or video call buttons to start a real-time conversation.',
      title: 'Voice & Video Calls',
      placement: 'left',
    },
  ],
  '/announcements': [
    {
      target: '.tour-announcements-header',
      content: 'Stay updated with the latest news, policy changes, and special offers from Almahbub.',
      title: 'Announcements',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-announcement-cards',
      content: 'Click on any announcement to read the full details and see if there are any required actions.',
      title: 'Read Announcements',
      placement: 'bottom',
    },
    {
      target: '.tour-reactions',
      content: 'React to announcements with emojis to show you have read and understood the message.',
      title: 'React to Updates',
      placement: 'top',
    },
    {
      target: '.tour-replies',
      content: 'Have questions or need clarification? Click to reply directly to any announcement.',
      title: 'Reply to Updates',
      placement: 'top',
    },
  ],
  '/categories': [
    {
      target: '.tour-categories-header',
      content: 'Explore our comprehensive catalog of product and service categories.',
      title: 'Categories',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-category-cards',
      content: 'Click on any category to browse specific products and services available.',
      title: 'Browse Products',
      placement: 'bottom',
    },
    {
      target: '.tour-search-products',
      content: 'Search for specific products within categories using keywords or specifications.',
      title: 'Search Products',
      placement: 'bottom',
    },
  ],
  '/profile': [
    {
      target: '.tour-profile-header',
      content: 'Manage your personal information, company details, and account preferences.',
      title: 'Your Profile',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-company-info',
      content: 'Keep your company information up to date for accurate billing and delivery.',
      title: 'Company Details',
      placement: 'top',
    },
    {
      target: '.tour-notification-settings',
      content: 'Control how and when you receive notifications about requests and announcements.',
      title: 'Notification Settings',
      placement: 'top',
    },
    {
      target: '.tour-password-section',
      content: 'Update your password regularly to keep your account secure.',
      title: 'Security',
      placement: 'top',
    },
  ],
  '/help': [
    {
      target: '.tour-help-header',
      content: 'Find answers to common questions or contact our support team directly.',
      title: 'Help Center',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-faq-section',
      content: 'Browse frequently asked questions organized by category for quick answers.',
      title: 'FAQs',
      placement: 'top',
    },
    {
      target: '.tour-contact-support',
      content: 'Can not find what you need? Contact our support team and we will get back to you within 24 hours.',
      title: 'Contact Support',
      placement: 'top',
    },
  ],
  // Authenticated pages (after login)
  '/announcements/:id': [
    {
      target: '.announcement-title',
      title: 'Announcement Details',
      content: 'This is the full announcement. Read all the details about company updates, maintenance notices, or special promotions here.',
      placement: 'bottom',
    },
    {
      target: '.announcement-content',
      title: 'Announcement Content',
      content: 'The main content of the announcement is displayed here. You can see all text, formatted sections, and important information.',
      placement: 'top',
    },
    {
      target: '.announcement-media',
      title: 'Attached Media',
      content: 'Any images, documents, or files attached to this announcement appear here. Click on images to view them fullscreen.',
      placement: 'top',
    },
    {
      target: '.reply-section',
      title: 'Reply to Announcement',
      content: 'Use this section to reply to the announcement. Your response will be visible to the admin team and other users.',
      placement: 'top',
    },
  ],
  '/orders/new': [
    {
      target: '.order-form-header',
      title: 'Create Procurement Order',
      content: 'This form lets you submit a new procurement request. Fill in all required details to help us process your order efficiently.',
      placement: 'bottom',
    },
    {
      target: '.product-selection',
      title: 'Product Selection',
      content: 'Select the products or services you want to procure. You can browse categories, search for specific items, and add them to your order.',
      placement: 'top',
    },
    {
      target: '.quantity-budget',
      title: 'Quantity & Budget',
      content: 'Specify how many units you need and your budget constraints. This helps ensure your request gets approved quickly.',
      placement: 'top',
    },
    {
      target: '.file-upload',
      title: 'Attach Files',
      content: 'Upload any relevant documents, specifications, or files that help explain your procurement request.',
      placement: 'top',
    },
    {
      target: '.submit-order',
      title: 'Submit Request',
      content: 'Once you\'ve filled in all details, review your order and click submit. You\'ll receive updates as your request is processed.',
      placement: 'top',
    },
  ],
  // '/profile': [
  //   {
  //     target: '.profile-header',
  //     title: 'Your Profile',
  //     content: 'This page shows your account information. You can view and update your personal details, contact information, and preferences.',
  //     placement: 'bottom',
  //   },
  //   {
  //     target: '.profile-details',
  //     title: 'Account Details',
  //     content: 'Your name, email, phone, and company information are displayed here. Keep this information up to date for better communication.',
  //     placement: 'top',
  //   },
  //   {
  //     target: '.profile-actions',
  //     title: 'Account Actions',
  //     content: 'You can update your password, notification preferences, and other account settings from this section.',
  //     placement: 'top',
  //   },
  // ],
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
