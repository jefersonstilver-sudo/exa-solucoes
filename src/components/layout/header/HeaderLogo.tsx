
import React from 'react';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { useLocation } from 'react-router-dom';

const HeaderLogo: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const isStoreRoute = pathname.startsWith('/loja') || pathname.startsWith('/paineis-digitais/loja') || pathname.startsWith('/building-store');
  const isExaRoute = pathname.startsWith('/exa') || pathname.startsWith('/sou-sindico');

  const HEXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Publicidade%20Inteligente%20(800%20x%20800%20px).png';
  const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

  return (
    <UnifiedLogo 
      size="custom" 
      linkTo="/" 
      variant="light"
      className="w-32 h-auto py-2"
      showSubtitle={true}
      logoUrl={(isStoreRoute || isExaRoute) ? EXA_LOGO_URL : undefined}
      altText={(isStoreRoute || isExaRoute) ? 'EXA Logo' : undefined}
    />
  );
};

export default HeaderLogo;
