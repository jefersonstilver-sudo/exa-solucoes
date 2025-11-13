import React, { ReactNode } from 'react';
import Layout from '@/components/layout/Layout';
import UnifiedCheckoutProgress from './UnifiedCheckoutProgress';

interface CheckoutLayoutProps {
  children: ReactNode;
  currentStep: number;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
  showProgress?: boolean;
}

const CheckoutLayout: React.FC<CheckoutLayoutProps> = ({ 
  children, 
  currentStep,
  maxWidth = '6xl',
  showProgress = true
}) => {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl'
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white sm:bg-gradient-to-br sm:from-gray-50 sm:via-gray-50 sm:to-gray-100">
        {/* Header com Progress integrado - Abaixo do Header Principal */}
        {showProgress && (
          <div className="sticky top-20 z-20 bg-white shadow-sm border-b py-2 sm:py-4">
            <div className={`container mx-auto px-2 sm:px-4 ${maxWidthClasses[maxWidth]}`}>
              <UnifiedCheckoutProgress currentStep={currentStep} />
            </div>
          </div>
        )}

        {/* Main Content - Espaçamento superior para compensar header fixo */}
        <div className={`container mx-auto px-2 py-2 sm:px-4 sm:py-4 ${maxWidthClasses[maxWidth]}`}>
          {children}
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutLayout;
