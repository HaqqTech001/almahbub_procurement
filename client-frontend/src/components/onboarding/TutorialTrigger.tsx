import React, { useState } from 'react';
import { HelpCircle, X, Play, ChevronRight } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { useLocation } from 'react-router-dom';

const TutorialTrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { restartTutorial, resetAllTutorials, isFirstVisit, completedPages } = useTutorial();
  const location = useLocation();

  const handleRestart = () => {
    restartTutorial();
    setIsOpen(false);
  };

  const handleResetAll = () => {
    if (window.confirm('This will restart tutorials for all pages. Are you sure?')) {
      resetAllTutorials();
      setIsOpen(false);
    }
  };

  const totalTutorials = 10; // Total number of pages with tutorials
  const completedCount = completedPages.length;
  const progress = Math.round((completedCount / totalTutorials) * 100);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        aria-label="Help & Tutorials"
        title="Help & Tutorials"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Tutorial Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-white" />
                <span className="text-white font-medium text-sm">Help & Tutorials</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Section */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Onboarding Progress</span>
                <span className="text-xs font-medium text-teal-600">{completedCount}/{totalTutorials} pages</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-3">
              {isFirstVisit ? (
                <button
                  onClick={handleRestart}
                  className="w-full flex items-center justify-between px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Play className="w-4 h-4" />
                    Start Tour
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleRestart}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Play className="w-4 h-4" />
                    Restart This Tour
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleResetAll}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
              >
                <span className="flex items-center gap-2 text-sm">
                  <X className="w-4 h-4" />
                  Reset All Tutorials
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Need more help? Contact our support team
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TutorialTrigger;
