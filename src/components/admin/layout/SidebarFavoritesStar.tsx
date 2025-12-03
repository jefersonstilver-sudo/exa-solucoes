import React from 'react';
import { Star } from 'lucide-react';

interface SidebarFavoritesStarProps {
  isFavorite: boolean;
  onToggle: () => void;
  collapsed: boolean;
}

export const SidebarFavoritesStar = ({ isFavorite, onToggle, collapsed }: SidebarFavoritesStarProps) => {
  if (collapsed) return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`p-1 rounded transition-all duration-200 ${
        isFavorite 
          ? 'opacity-100 text-amber-400 hover:text-amber-300' 
          : 'opacity-0 group-hover:opacity-100 text-white/30 hover:text-amber-300 hover:bg-white/5'
      }`}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Star className={`h-3 w-3 transition-transform duration-150 hover:scale-110 ${isFavorite ? 'fill-amber-400' : ''}`} />
    </button>
  );
};

export default SidebarFavoritesStar;
