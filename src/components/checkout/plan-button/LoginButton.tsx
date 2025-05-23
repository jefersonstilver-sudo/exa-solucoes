
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoginButtonProps {
  onClick: () => void;
}

const LoginButton = ({ onClick }: LoginButtonProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-10 flex justify-center"
    >
      <Button 
        size="lg" 
        className="px-8 py-6 bg-amber-500 hover:bg-amber-600"
        onClick={onClick}
      >
        Faça login para continuar
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </motion.div>
  );
};

export default LoginButton;
