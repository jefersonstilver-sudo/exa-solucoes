
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
      variant="ghost"
      className="text-white hover:bg-white/20 hover:text-indexa-mint rounded-lg h-10 px-4 flex items-center gap-2 transition-all duration-200"
    >
      <Store className="h-4 w-4" />
      <span className="hidden sm:inline">Loja</span>
    </Button>
  );
};

export default OnlineStoreButton;
