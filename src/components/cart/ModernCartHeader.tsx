
import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModernCartHeaderProps {
  itemCount: number;
  onClear: () => void;
}

const ModernCartHeader: React.FC<ModernCartHeaderProps> = ({ 
  itemCount, 
  onClear 
}) => {
  return (
    <div className="relative bg-gradient-to-r from-[#3C1361] to-[#4A1A6B] text-white p-6 shadow-lg">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full -translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-12 translate-y-12" />
      </div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="relative"
          >
            <div className="bg-white/20 p-3 rounded-full">
              <ShoppingCart className="h-6 w-6" />
            </div>
            
            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
          
          <div>
            <h2 className="text-xl font-bold">Seu Carrinho</h2>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary" 
                className="bg-[#00D4AA] text-[#3C1361] border-none font-semibold"
              >
                {itemCount} {itemCount === 1 ? 'painel' : 'painéis'}
              </Badge>
              <span className="text-white/70 text-sm">
                selecionado{itemCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        
        {itemCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClear}
              className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200"
              title="Limpar carrinho"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar tudo
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ModernCartHeader;
