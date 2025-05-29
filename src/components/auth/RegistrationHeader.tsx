
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const RegistrationHeader: React.FC = () => {
  return (
    <CardHeader className="space-y-1 text-center">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <CardTitle className="text-2xl font-bold text-indexa-purple flex items-center justify-center gap-2">
          <UserPlus size={24} /> Crie sua conta
        </CardTitle>
        <CardDescription className="text-gray-600">
          Preencha os dados abaixo para começar a usar a plataforma
        </CardDescription>
      </motion.div>
    </CardHeader>
  );
};

export default RegistrationHeader;
