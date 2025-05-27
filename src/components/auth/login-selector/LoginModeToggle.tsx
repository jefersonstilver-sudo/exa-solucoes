
import React from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck } from 'lucide-react';

type LoginMode = 'client' | 'admin';

interface LoginModeToggleProps {
  mode: LoginMode;
  onToggle: () => void;
}

const LoginModeToggle: React.FC<LoginModeToggleProps> = ({ mode, onToggle }) => {
  return (
    <div className="flex items-center">
      <div 
        className={`h-7 w-14 rounded-full p-1 cursor-pointer transition-colors ${
          mode === 'admin' ? 'bg-amber-500' : 'bg-indexa-mint'
        }`}
        onClick={onToggle}
      >
        <motion.div 
          className="h-5 w-5 rounded-full bg-white"
          animate={{ x: mode === 'admin' ? 0 : 28 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
      
      <span className="text-sm ml-2 flex items-center">
        {mode === 'admin' ? (
          <>
            <ShieldCheck className="h-4 w-4 mr-1" />
            Administrador
          </>
        ) : (
          <>
            <User className="h-4 w-4 mr-1" />
            Anunciante
          </>
        )}
      </span>
    </div>
  );
};

export default LoginModeToggle;
