
import React from 'react';
import ProgressHeader from './progress/ProgressHeader';
import DesktopProgressSteps from './progress/DesktopProgressSteps';
import MobileProgressSteps from './progress/MobileProgressSteps';
import ProgressBar from './progress/ProgressBar';

interface UnifiedCheckoutProgressProps {
  currentStep: number;
}

const UnifiedCheckoutProgress: React.FC<UnifiedCheckoutProgressProps> = ({ currentStep }) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-sm border p-4">
      <ProgressHeader currentStep={currentStep} />
      <DesktopProgressSteps currentStep={currentStep} />
      <MobileProgressSteps currentStep={currentStep} />
      <ProgressBar currentStep={currentStep} />
    </div>
  );
};

export default UnifiedCheckoutProgress;
