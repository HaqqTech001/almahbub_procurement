import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  FileText, 
  MessageCircle, 
  ShoppingBag, 
  ArrowRight,
  X
} from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { setShowWelcome } = useTutorial();

  // Close modal when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    setShowWelcome(false);
    onClose();
  };

  const handleGetStarted = () => {
    setShowWelcome(false);
    onClose();
    navigate('/requests/new');
  };

  const handleViewRequests = () => {
    setShowWelcome(false);
    onClose();
    navigate('/my-requests');
  };

  const handleBrowseCategories = () => {
    setShowWelcome(false);
    onClose();
    navigate('/categories');
  };

  const handleContactSupport = () => {
    setShowWelcome(false);
    onClose();
    navigate('/chat');
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F4C5C] to-[#1A3A47] p-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Welcome to Almahbub! 👋</h2>
          <p className="text-white/80 text-lg">
            We are glad to have you here. Let us help you get started with your procurement journey.
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-gray-600 mb-6 text-center">
            What would you like to do today? Choose an option below to get started:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Request */}
            <button
              onClick={handleGetStarted}
              className="flex items-start p-4 bg-gray-50 hover:bg-cyan-50 border-2 border-gray-100 hover:border-cyan-200 rounded-xl transition-all duration-200 text-left group"
            >
              <div className="w-12 h-12 bg-[#0F4C5C] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-[#0F4C5C]">Create New Request</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Submit a new procurement request for products or services
                </p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto text-gray-300 group-hover:text-[#0F4C5C] group-hover:translate-x-1 transition-all" />
            </button>

            {/* View My Requests */}
            <button
              onClick={handleViewRequests}
              className="flex items-start p-4 bg-gray-50 hover:bg-cyan-50 border-2 border-gray-100 hover:border-cyan-200 rounded-xl transition-all duration-200 text-left group"
            >
              <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-cyan-600">View My Requests</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Track status and details of your existing requests
                </p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto text-gray-300 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Browse Categories */}
            <button
              onClick={handleBrowseCategories}
              className="flex items-start p-4 bg-gray-50 hover:bg-cyan-50 border-2 border-gray-100 hover:border-cyan-200 rounded-xl transition-all duration-200 text-left group"
            >
              <div className="w-12 h-12 bg-[#E3B505] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-[#E3B505]">Browse Categories</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Explore available product categories and services
                </p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto text-gray-300 group-hover:text-[#E3B505] group-hover:translate-x-1 transition-all" />
            </button>

            {/* Contact Support */}
            <button
              onClick={handleContactSupport}
              className="flex items-start p-4 bg-gray-50 hover:bg-cyan-50 border-2 border-gray-100 hover:border-cyan-200 rounded-xl transition-all duration-200 text-left group"
            >
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-green-600">Contact Support</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Chat with our team for help or questions
                </p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* Skip Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
            >
              Skip for now - I know my way around
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t">
          <p className="text-xs text-gray-400 text-center">
            You can access these quick actions from your dashboard anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
