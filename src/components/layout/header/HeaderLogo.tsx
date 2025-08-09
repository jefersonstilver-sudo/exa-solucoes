
import React from 'react';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { useLocation } from 'react-router-dom';

const HeaderLogo: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const isStoreRoute = pathname.startsWith('/loja') || pathname.startsWith('/paineis-digitais/loja') || pathname.startsWith('/building-store');

  const HEXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Publicidade%20Inteligente.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL1B1YmxpY2lkYWRlIEludGVsaWdlbnRlLnBuZyIsImlhdCI6MTc1NDcwNTY1NywiZXhwIjozMTcwODMxNjk2NTd9.rqTXEyHO9yJI3r3lJMWMnnGw5ddS3wOR4BrkPqYxi1s';

  return (
    <UnifiedLogo 
      size="custom" 
      linkTo="/" 
      variant="light"
      className="w-32 h-auto py-2"
      showSubtitle={true}
      logoUrl={isStoreRoute ? HEXA_LOGO_URL : undefined}
      altText={isStoreRoute ? 'HEXA Logo' : undefined}
    />
  );
};

export default HeaderLogo;
