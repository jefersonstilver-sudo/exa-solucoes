
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
  if (isMobile || isTablet) {
    // Mobile/Tablet: Drawer overlay
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onClose}
            />

            {/* Mobile/Tablet Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] lg:hidden"
            >
              <div className="relative h-full">
                <AdvertiserSidebarContent onItemClick={onClose} />
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg z-10"
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

  // Desktop: Static sidebar with collapse support (always visible)
  return (
    <motion.div
      animate={{ width: isCollapsed ? 64 : 320 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden lg:flex min-h-screen"
    >
      <AdvertiserSidebarContent isCollapsed={isCollapsed} />
    </motion.div>
  );
};

export default ResponsiveAdvertiserSidebar;
