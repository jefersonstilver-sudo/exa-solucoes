import React from 'react';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

/** Botão hambúrguer: no computador recolhe/expande o menu lateral; no celular abre o menu. */
const AdminMenuButton = ({ className }: { className?: string }) => {
  const { toggleSidebar, state, isMobile, openMobile } = useSidebar();
  const aberto = isMobile ? openMobile : state === 'expanded';
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={aberto ? 'Recolher menu' : 'Abrir menu'}
      aria-expanded={aberto}
      title={aberto ? 'Recolher menu (Ctrl+B)' : 'Abrir menu (Ctrl+B)'}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4231C] focus-visible:ring-offset-2',
        className
      )}
    >
      <Menu className="h-5 w-5" />
    </button>
  );
};

export default AdminMenuButton;
