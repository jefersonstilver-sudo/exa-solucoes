/**
 * TaskFAB - Floating Action Button para criar tarefas no mobile
 * Design Apple-style com animação suave
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TaskFABProps {
  onClick: () => void;
  visible?: boolean;
  className?: string;
}

export const TaskFAB: React.FC<TaskFABProps> = ({
  onClick,
  visible = true,
  className
}) => {
  if (!visible) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.3
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        // Posicionamento fixo
        "fixed bottom-6 right-6 z-50",
        // Tamanho e forma
        "h-14 w-14 rounded-full",
        // Cores e estilo
        "bg-blue-600 hover:bg-blue-700 text-white",
        // Sombra Apple-style
        "shadow-lg shadow-blue-600/30",
        // Animação
        "transition-colors duration-200",
        // Touch
        "touch-manipulation",
        // Flex para centralizar ícone
        "flex items-center justify-center",
        className
      )}
      aria-label="Criar nova tarefa"
    >
      <motion.div
        whileHover={{ rotate: 90 }}
        transition={{ duration: 0.2 }}
      >
        <Plus className="h-6 w-6" />
      </motion.div>
    </motion.button>
  );
};

export default TaskFAB;
