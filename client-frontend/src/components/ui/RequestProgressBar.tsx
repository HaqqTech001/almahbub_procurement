import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle, FileText, Search, CheckCircle as CheckCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RequestProgressBarProps {
  currentStatus: string;
  className?: string;
}

interface StatusStep {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STATUS_STEPS: StatusStep[] = [
  {
    key: 'received',
    label: 'Request Received',
    description: 'Your request has been submitted',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    key: 'reviewing',
    label: 'Under Review',
    description: 'Our team is reviewing your request',
    icon: <Clock className="h-5 w-5" />,
  },
  {
    key: 'in_discussion',
    label: 'In Discussion',
    description: 'Discussing requirements and clarifications',
    icon: <AlertCircle className="h-5 w-5" />,
  },
  {
    key: 'sourcing',
    label: 'Sourcing',
    description: 'Finding the best suppliers and prices',
    icon: <Search className="h-5 w-5" />,
  },
  {
    key: 'completed',
    label: 'Completed',
    description: 'Your request has been fulfilled',
    icon: <CheckCircleIcon className="h-5 w-5" />,
  },
];

const STATUS_ORDER = ['received', 'reviewing', 'in_discussion', 'sourcing', 'completed'];

const RequestProgressBar: React.FC<RequestProgressBarProps> = ({ currentStatus, className }) => {
  // Normalize status (handle different formats)
  const normalizedStatus = currentStatus?.toLowerCase() || 'received';
  
  // Handle cancelled/rejected requests
  const isCancelled = normalizedStatus === 'cancelled' || normalizedStatus === 'rejected';
  const isCompleted = normalizedStatus === 'completed';
  
  // Find current step index
  const currentIndex = STATUS_ORDER.indexOf(normalizedStatus);
  
  const getStepStatus = (index: number) => {
    if (isCancelled) {
      // For cancelled requests, show all steps as cancelled
      return 'cancelled';
    }
    if (index < currentIndex) {
      return 'completed';
    }
    if (index === currentIndex) {
      return 'current';
    }
    return 'pending';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 bg-green-100 border-green-300';
      case 'current':
        return 'text-cyan-600 bg-cyan-100 border-cyan-400';
      case 'cancelled':
        return 'text-red-500 bg-red-100 border-red-300';
      default:
        return 'text-gray-400 bg-gray-100 border-gray-300';
    }
  };

  const getLineColor = (index: number) => {
    if (isCancelled) {
      return 'bg-gray-200';
    }
    if (index < currentIndex) {
      return 'bg-green-500';
    }
    return 'bg-gray-200';
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Bar - Horizontal Layout */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
          {!isCancelled && (
            <div 
              className="h-full bg-green-500 transition-all duration-500 ease-in-out"
              style={{ width: `${(currentIndex / (STATUS_ORDER.length - 1)) * 100}%` }}
            />
          )}
        </div>

        {/* Steps */}
        <div className="flex justify-between">
          {STATUS_STEPS.map((step, index) => {
            const stepStatus = getStepStatus(index);
            
            return (
              <div key={step.key} className="flex flex-col items-center">
                {/* Step Circle */}
                <div 
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                    getStepColor(stepStatus)
                  )}
                >
                  {stepStatus === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : stepStatus === 'cancelled' ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                
                {/* Step Label - Hidden on small screens */}
                <div className="hidden md:block mt-3 text-center">
                  <p className={cn(
                    'text-sm font-medium',
                    stepStatus === 'completed' || stepStatus === 'current' ? 'text-gray-900' : 'text-gray-500'
                  )}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 max-w-[100px]">
                    {step.description}
                  </p>
                </div>

                {/* Mobile Label */}
                <div className="md:hidden mt-2 text-center">
                  <p className={cn(
                    'text-xs font-medium',
                    stepStatus === 'completed' || stepStatus === 'current' ? 'text-gray-900' : 'text-gray-500'
                  )}>
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Summary */}
      {isCancelled && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-sm text-red-700 font-medium">
            This request has been cancelled and is no longer active.
          </p>
        </div>
      )}

      {/* Status Explanation */}
      {!isCancelled && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            <strong>Current Status:</strong> {STATUS_STEPS[currentIndex]?.label || 'Unknown'}
            <span className="mx-2 text-gray-400">•</span>
            {STATUS_STEPS[currentIndex]?.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default RequestProgressBar;
