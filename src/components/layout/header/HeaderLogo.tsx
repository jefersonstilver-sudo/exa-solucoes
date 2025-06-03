
import React from 'react';
import UnifiedLogo from '@/components/layout/UnifiedLogo';

const HeaderLogo: React.FC = () => {
  return (
    <UnifiedLogo 
      size="lg" 
      linkTo="/" 
      variant="light"
      className="py-2"
    />
  );
};

export default HeaderLogo;
