import React, { useEffect, useContext, useCallback } from 'react';
import Joyride, { STATUS, CallBackProps, TooltipRenderProps } from 'react-joyride';
import { useLocation } from 'react-router-dom';
import { useTutorial } from '@/contexts/TutorialContext';
import { getStepsForPath } from '@/config/tutorialSteps';
import { useAuthStore } from '@/stores/authStore';

interface JoyrideStep {
  target: string;
  content: string;
  title: string;
  disableBeacon?: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const CustomTooltip: React.FC<TooltipRenderProps> = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
}) => {
  return (
    <div
      {...tooltipProps}
      className="bg-white rounded-xl shadow-2xl border border-gray-100 p-6 max-w-md"
    >
      <div className="mb-4">
        {step.title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {step.title}
          </h3>
        )}
        <p className="text-gray-600 text-sm leading-relaxed">{step.content}</p>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            Step {index + 1}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Back
            </button>
          )}
          
          {continuous && (
            <button
              {...primaryProps}
              className="px-4 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
            >
              Next
            </button>
          )}
          
          {!continuous && (
            <button
              {...closeProps}
              className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Done
            </button>
          )}
          
          <button
            {...backProps}
            data-type="skip"
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

const TutorialManager: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const {
    run,
    setRun,
    setSteps,
    markPageAsSeen,
    completedPages,
  } = useTutorial();

  // Get steps for current path
  const currentPath = location.pathname;
  const steps = getStepsForPath(currentPath);

  useEffect(() => {
    // Only show tutorial if user is authenticated and hasn't seen this page
    if (isAuthenticated && steps.length > 0 && !completedPages.includes(currentPath)) {
      setSteps(steps as JoyrideStep[]);
      setRun(true);
    } else {
      setRun(false);
    }
  }, [currentPath, steps, completedPages, isAuthenticated]);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status } = data;
      const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

      if (finishedStatuses.includes(status)) {
        setRun(false);
        markPageAsSeen(currentPath);
      }
    },
    [currentPath, markPageAsSeen, setRun]
  );

  // Don't render anything if not authenticated or no steps
  if (!isAuthenticated || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={steps as JoyrideStep[]}
      run={run}
      continuous
      showSkipButton
      showProgress
      showCloseButton
      callback={handleCallback}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          primaryColor: '#0891b2',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          overlayColor: 'rgba(0, 0, 0, 0.4)',
          spotlightShadow: '0 0 20px rgba(0, 0, 0, 0.15)',
          zIndex: 10000,
          beaconSize: 36,
          beaconInner: '#0891b2',
          beaconOuter: 'rgba(8, 145, 178, 0.4)',
          buttonTextColor: '#ffffff',
          width: 400,
        },
      }}
      spotlightOptions={{
        interactionType: 'hover',
        disableOverlay: false,
      }}
    />
  );
};

export default TutorialManager;
