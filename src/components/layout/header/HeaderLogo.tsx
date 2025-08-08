
import React from 'react';
import UnifiedLogo from '@/components/layout/UnifiedLogo';

const HeaderLogo: React.FC = () => {
  return (
    <UnifiedLogo 
      size="custom" 
      linkTo="/" 
      variant="light"
      className="w-32 h-auto py-2"
      showSubtitle={true}
    />
  );
};

export default HeaderLogo;
