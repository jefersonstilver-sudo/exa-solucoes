
import React from 'react';
import { Button } from '@/components/ui/button';

interface ContinueButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isLoading: boolean;
}

const ContinueButton = ({ 
  onClick, 
  isDisabled, 
  isLoading 
}: ContinueButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={isDisabled || isLoading}
      className="bg-[#9C1E1E] hover:bg-[#7A1818] text-white px-6 py-2.5 rounded-md shadow-md hover:shadow-lg transition-all"
    >
      {isLoading ? (
        <>
          <span className="mr-2">Processando...</span>
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </>
      ) : (
        <>Continuar</>
      )}
    </Button>
  );
};

export default ContinueButton;
