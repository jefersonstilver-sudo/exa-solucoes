
import React from 'react';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { useLocation } from 'react-router-dom';

const HeaderLogo: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const isStoreRoute = pathname.startsWith('/loja') || pathname.startsWith('/paineis-digitais/loja') || pathname.startsWith('/building-store');
  const isExaRoute = pathname.startsWith('/exa');

  const HEXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Publicidade%20Inteligente%20(800%20x%20800%20px).png';
  const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Exa%20sozinha.png';

  return (
    <UnifiedLogo 
      size="custom" 
      linkTo="/" 
      variant="light"
      className="w-32 h-auto py-2"
      showSubtitle={true}
      logoUrl={isStoreRoute ? HEXA_LOGO_URL : isExaRoute ? EXA_LOGO_URL : undefined}
      altText={isStoreRoute ? 'HEXA Logo' : isExaRoute ? 'EXA Logo' : undefined}
    />
  );
};

export default HeaderLogo;
