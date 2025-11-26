import React from 'react';
import { X } from 'lucide-react';
import AdvertiserSidebarContent from './AdvertiserSidebarContent';
import { motion, AnimatePresence } from 'framer-motion';

interface AdvertiserMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdvertiserMobileSidebar = ({ isOpen, onClose }: AdvertiserMobileSidebarProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay com animação */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sidebar com animação deslizante */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[280px] sm:w-80"
            onClick={e => e.stopPropagation()}
          >
            <AdvertiserSidebarContent onItemClick={onClose} />
            
            {/* Botão de fechar moderno */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AdvertiserMobileSidebar;
