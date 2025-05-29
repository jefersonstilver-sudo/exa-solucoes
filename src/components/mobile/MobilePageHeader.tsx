
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Menu, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onMenu?: () => void;
  actions?: React.ReactNode;
  scrollBehavior?: 'fixed' | 'hide' | 'elevate';
  className?: string;
}

const MobilePageHeader = ({
  title,
  subtitle,
  onBack,
  onMenu,
  actions,
  scrollBehavior = 'elevate',
  className
}: MobilePageHeaderProps) => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (scrollBehavior === 'hide') {
        setIsVisible(currentScrollY < lastScrollY || currentScrollY < 10);
        setLastScrollY(currentScrollY);
      }
      
      setScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, scrollBehavior]);

  const getHeaderStyle = () => {
    switch (scrollBehavior) {
      case 'fixed':
        return 'fixed top-0';
      case 'hide':
        return 'fixed top-0';
      case 'elevate':
        return 'sticky top-0';
      default:
        return 'sticky top-0';
    }
  };

  const getElevation = () => {
    if (scrollBehavior === 'elevate' && scrollY > 10) {
      return 'shadow-lg border-b';
    }
    return scrollY > 10 ? 'shadow-sm border-b' : '';
  };

  return (
    <AnimatePresence>
      {(scrollBehavior !== 'hide' || isVisible) && (
        <motion.header
          initial={{ opacity: 1, y: 0 }}
          animate={{ 
            opacity: scrollBehavior === 'hide' ? (isVisible ? 1 : 0) : 1,
            y: scrollBehavior === 'hide' ? (isVisible ? 0 : -100) : 0
          }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={cn(
            getHeaderStyle(),
            'z-40 w-full bg-white/95 backdrop-blur-md transition-all duration-300',
            getElevation(),
            className
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
            {/* Left Section */}
            <div className="flex items-center space-x-3 flex-1">
              {onBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="h-10 w-10 rounded-full hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              
              {onMenu && !onBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMenu}
                  className="h-10 w-10 rounded-full hover:bg-gray-100"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}

              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right Section */}
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
};

export default MobilePageHeader;
