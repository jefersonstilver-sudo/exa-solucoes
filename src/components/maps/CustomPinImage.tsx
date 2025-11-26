import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomPinImageProps {
  buildingId: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

const CustomPinImage: React.FC<CustomPinImageProps> = ({ 
  buildingId, 
  isHovered = false, 
  isSelected = false 
}) => {
  const [isInCart, setIsInCart] = useState(false);
  const [cartVersion, setCartVersion] = useState(0);

  // Check if building is in cart
  useEffect(() => {
    const checkCartStatus = () => {
      try {
        const cartState = (window as any).__simpleCart;
        const inCart = cartState?.isItemInCart?.(buildingId) || false;
        setIsInCart(inCart);
      } catch (error) {
        console.error('Error checking cart status:', error);
      }
    };

    checkCartStatus();

    // Listen for cart updates
    const handleCartUpdate = (event: any) => {
      checkCartStatus();
      setCartVersion(v => v + 1);
    };

    window.addEventListener('cart:updated', handleCartUpdate);
    return () => window.removeEventListener('cart:updated', handleCartUpdate);
  }, [buildingId, cartVersion]);

  // Determine scale based on state
  const getScale = () => {
    if (isSelected) return 1.3;
    if (isHovered) return 1.15;
    return 1;
  };

  // Determine Y offset based on state
  const getYOffset = () => {
    if (isSelected) return -5;
    if (isHovered) return -3;
    return 0;
  };

  // Pin source
  const pinSrc = isInCart ? '/images/pin-verde.png' : '/images/pin-vermelho.png';

  return (
    <div className="relative w-8 h-10" style={{ pointerEvents: 'none' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`pin-${isInCart ? 'green' : 'red'}-${buildingId}`}
          initial={{ 
            scale: 0.5, 
            rotate: isInCart ? -180 : 0, 
            opacity: 0 
          }}
          animate={{ 
            scale: getScale(),
            rotate: 0,
            opacity: 1,
            y: getYOffset(),
          }}
          exit={{ 
            scale: 0.5, 
            rotate: isInCart ? 0 : 180, 
            opacity: 0 
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 0.4
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <img 
            src={pinSrc} 
            alt="Building pin" 
            className="w-full h-full object-contain"
            draggable={false}
          />
          
          {/* Pulse effect for green pins */}
          {isInCart && (
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.6, 0, 0.6]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <img 
                src="/images/pin-verde.png" 
                alt="Pulse" 
                className="w-full h-full object-contain"
                draggable={false}
              />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Shadow effect */}
      {(isHovered || isSelected) && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: isSelected ? 1.2 : 1, 
            opacity: isSelected ? 0.4 : 0.3 
          }}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-black/30 rounded-full blur-sm"
        />
      )}
    </div>
  );
};

export default CustomPinImage;
