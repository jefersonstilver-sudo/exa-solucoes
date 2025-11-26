import React, { useState, useEffect } from 'react';

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
    const handleCartUpdate = () => {
      checkCartStatus();
    };

    window.addEventListener('cart:updated', handleCartUpdate);
    return () => window.removeEventListener('cart:updated', handleCartUpdate);
  }, [buildingId]);

  // Determine scale based on state
  const getScale = () => {
    if (isSelected) return 1.3;
    if (isHovered) return 1.15;
    return 1;
  };

  // Determine transform based on state
  const getTransform = () => {
    const scale = getScale();
    let translateY = 0;
    if (isSelected) translateY = -5;
    else if (isHovered) translateY = -3;
    
    return `scale(${scale}) translateY(${translateY}px)`;
  };

  // Pin source
  const pinSrc = isInCart ? '/images/pin-verde.png' : '/images/pin-vermelho.png';

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ 
        width: '32px', 
        height: '40px',
        pointerEvents: 'none'
      }}
    >
      <img 
        src={pinSrc} 
        alt="Building pin" 
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: getTransform(),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: isInCart ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' : 'none'
        }}
        draggable={false}
      />
      
      {/* Shadow effect */}
      {(isHovered || isSelected) && (
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '24px',
            height: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '50%',
            filter: 'blur(4px)',
            opacity: isSelected ? 0.4 : 0.3
          }}
        />
      )}
    </div>
  );
};

export default CustomPinImage;
