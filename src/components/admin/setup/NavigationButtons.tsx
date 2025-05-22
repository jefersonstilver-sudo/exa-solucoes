
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const NavigationButtons: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between pt-4">
      <Button variant="outline" onClick={() => navigate('/')}>
        Voltar para Home
      </Button>
      <Button onClick={() => navigate('/admin')} className="flex items-center gap-1">
        Ir para Admin <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default NavigationButtons;
