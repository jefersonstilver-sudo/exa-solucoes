
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';

const OnlineStoreButton: React.FC = () => {
  const navigate = useNavigate();

  const handleStoreClick = () => {
    navigate('/paineis-digitais/loja');
  };

  return (
    <Button
      onClick={handleStoreClick}
      className="bg-indexa-mint hover:bg-indexa-mint-dark text-indexa-purple font-medium rounded-full px-3 py-2 md:px-4 md:py-2 transition-all duration-200 flex items-center gap-2"
      size="sm"
    >
      <Store className="h-4 w-4" />
      <span className="text-sm">Loja Online</span>
    </Button>
  );
};

export default OnlineStoreButton;
