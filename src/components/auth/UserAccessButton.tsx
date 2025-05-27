
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

const UserAccessButton: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    console.log('🔐 UserAccessButton: Navegando para /login');
    navigate('/login');
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        onClick={handleLoginClick}
        variant="ghost"
        className="text-white hover:bg-white/20 rounded-full h-10 px-4 flex items-center gap-2"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Entrar</span>
        <LogIn className="h-4 w-4" />
      </Button>
    </motion.div>
  );
};

export default UserAccessButton;
