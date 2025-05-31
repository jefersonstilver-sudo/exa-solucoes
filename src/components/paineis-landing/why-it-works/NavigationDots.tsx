
import React from 'react';

interface NavigationDotsProps {
  itemsCount: number;
  activeIndex: number;
  onDotClick: (index: number) => void;
}

const NavigationDots: React.FC<NavigationDotsProps> = ({
  itemsCount,
  activeIndex,
  onDotClick
}) => {
  return (
    <div className="flex justify-center mt-8 sm:mt-12 space-x-2 sm:space-x-3">
      {Array.from({ length: itemsCount }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
            index === activeIndex 
              ? 'bg-indexa-mint scale-125' 
              : 'bg-white/30 hover:bg-white/50'
          }`}
        />
      ))}
    </div>
  );
};

export default NavigationDots;
