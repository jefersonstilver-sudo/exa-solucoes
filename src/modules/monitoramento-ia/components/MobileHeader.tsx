import { Menu } from 'lucide-react';

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export const MobileHeader = ({ onMenuClick }: MobileHeaderProps) => {
  return (
    <>
      {/* Header Mobile - FIXO NO TOPO */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-[#9C1E1E] via-[#B02424] to-[#9C1E1E] shadow-lg pt-[env(safe-area-inset-top,0px)]">
        <div className="relative flex items-center justify-between px-4 py-3">
          {/* Botão Hambúrguer */}
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>

          {/* Logo EXA no Centro */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <img 
              src={EXA_LOGO_URL}
              alt="EXA"
              className="h-10 w-auto brightness-0 invert"
            />
          </div>

          {/* Espaço à direita para manter simetria */}
          <div className="w-10" />
        </div>
      </div>

      {/* Spacer para compensar header fixo */}
      <div className="lg:hidden h-[60px]" />
    </>
  );
};
