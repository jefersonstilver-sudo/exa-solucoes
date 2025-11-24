import React from 'react';
import { Menu, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MobileCRMHeaderProps {
  unreadCount: number;
  onMenuClick: () => void;
  onSearchClick: () => void;
  onRefreshClick: () => void;
}

export const MobileCRMHeader: React.FC<MobileCRMHeaderProps> = ({
  unreadCount,
  onMenuClick,
  onSearchClick,
  onRefreshClick
}) => {
  return (
    <header className="whatsapp-header pt-safe sticky top-0 z-50 shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-white hover:bg-white/10 touch-manipulation h-10 w-10"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div>
            <h1 className="text-white font-semibold text-lg">CRM Unificado</h1>
            <p className="text-white/80 text-xs">Exa Soluções</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearchClick}
            className="text-white hover:bg-white/10 touch-manipulation h-10 w-10"
          >
            <Search className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefreshClick}
            className="text-white hover:bg-white/10 touch-manipulation h-10 w-10"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>

          {unreadCount > 0 && (
            <div className="relative">
              <Badge className="bg-white text-[#25D366] hover:bg-white/90 badge-pulse min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
