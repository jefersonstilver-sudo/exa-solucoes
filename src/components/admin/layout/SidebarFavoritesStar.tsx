import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarFavoritesStarProps {
  isFavorite: boolean;
  onClick: (e: React.MouseEvent) => void;
  collapsed?: boolean;
  canAddMore?: boolean;
}

export function SidebarFavoritesStar({ 
  isFavorite, 
  onClick, 
  collapsed,
  canAddMore = true
}: SidebarFavoritesStarProps) {
  if (collapsed) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isFavorite && !canAddMore) return;
    onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md",
        "transition-all duration-200 ease-out",
        "opacity-0 group-hover:opacity-100",
        "hover:scale-110 active:scale-95",
        isFavorite && "opacity-100",
        !canAddMore && !isFavorite && "cursor-not-allowed opacity-30"
      )}
      title={isFavorite ? "Remover dos favoritos" : canAddMore ? "Adicionar aos favoritos" : "Limite de favoritos atingido"}
    >
      <Star
        className={cn(
          "h-3.5 w-3.5 transition-all duration-200",
          isFavorite 
            ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]" 
            : "text-red-200/40 hover:text-yellow-400/80"
        )}
      />
    </button>
  );
}
