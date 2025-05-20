
import React from 'react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  onClick: () => void;
  isBackToStore: boolean;
}

const BackButton = ({ onClick, isBackToStore }: BackButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      className="text-gray-600"
    >
      {isBackToStore ? 'Voltar para loja' : 'Voltar'}
    </Button>
  );
};

export default BackButton;
