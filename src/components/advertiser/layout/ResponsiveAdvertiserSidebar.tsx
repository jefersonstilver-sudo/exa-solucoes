
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import AdvertiserSidebarContent from './AdvertiserSidebarContent';

interface ResponsiveAdvertiserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  isTablet?: boolean;
  isCollapsed?: boolean;
}

const ResponsiveAdvertiserSidebar = ({ 
  isOpen, 
  onClose, 
  isMobile,
  isTablet = false,
  isCollapsed = false
}: ResponsiveAdvertiserSidebarProps) => {
  
  // Debug log
  React.useEffect(() => {
    if (isMobile || isTablet) {
      console.log('📱 Sidebar Mobile/Tablet - isOpen:', isOpen);
    }
  }, [isOpen, isMobile, isTablet]);

  if (isMobile || isTablet) {
    // Mobile/Tablet: Drawer overlay
    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] bg-[#1b1719]/40 backdrop-blur-[2px]"
              onClick={onClose}
              style={{ pointerEvents: 'auto' }}
            />

            {/* Mobile Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-[110] h-full w-72 max-w-[85vw]"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="relative h-full shadow-2xl">
                <AdvertiserSidebarContent onItemClick={onClose} />
                <button
                  onClick={onClose}
                  className="absolute top-5 right-3 p-2 text-white/80 hover:bg-white/10 rounded-lg z-10 transition-colors"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: Fixed sidebar with collapse support
  return (
    <motion.div
      animate={{ width: isCollapsed ? 72 : 288 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden lg:flex fixed inset-y-0 z-30"
    >
      <AdvertiserSidebarContent isCollapsed={isCollapsed} />
    </motion.div>
  );
};

export default ResponsiveAdvertiserSidebar;
