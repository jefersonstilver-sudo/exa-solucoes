
import React from 'react';
import UnifiedLogo from '@/components/layout/UnifiedLogo';

const HeaderLogo: React.FC = () => {
  return (
    <UnifiedLogo 
      size="custom" 
      linkTo="/" 
      variant="light"
      className="w-32 h-32 py-2"
    />
  );
};

export default HeaderLogo;
