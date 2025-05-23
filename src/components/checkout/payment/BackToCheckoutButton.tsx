
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface BackToCheckoutButtonProps {
  onBack: () => void;
}

const BackToCheckoutButton = ({ onBack }: BackToCheckoutButtonProps) => {
  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center text-gray-600"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Voltar para checkout
      </Button>
    </div>
  );
};

export default BackToCheckoutButton;
