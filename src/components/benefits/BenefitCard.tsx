import React from 'react';
import { Button } from '@/components/ui/button';
import type { BenefitOption } from '@/types/providerBenefits';

interface BenefitCardProps {
  option: BenefitOption;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

// Mapeamento de strings para emojis animados
const getIconEmoji = (icon: string): string => {
  const iconMap: Record<string, string> = {
    'Car': '🚗',
    'Music': '🎵',
    'Gift': '🎁',
    'ShoppingBag': '🛍️',
    'ShoppingCart': '🛒',
    'Shirt': '👕',
    'Footprints': '👣',
    'Heels': '👠',
    'Package': '📦',
    'Store': '🏪',
    'CreditCard': '💳',
    'Utensils': '🍽️',
    'UtensilsCrossed': '🍔',
    'Coffee': '☕',
    'Pizza': '🍕',
    'Sandwich': '🥪',
    'IceCream': '🍦',
    'Popcorn': '🍿',
    'Ticket': '🎟️',
    'Film': '🎬',
    'Gamepad': '🎮',
    'Book': '📚',
    'Dumbbell': '🏋️',
    'Bike': '🚴',
    'Bus': '🚌',
    'Train': '🚆',
    'Plane': '✈️',
    'Fuel': '⛽',
    'PawPrint': '🐾',
    'Heart': '❤️',
    'Sparkles': '✨',
    'Star': '⭐',
    // Marcas específicas
    'McDonald\'s': '🍔',
    'McDonalds': '🍔',
    'Madero': '🍔',
    'Jeronimo': '🍔',
    'Zé Delivery': '🍺',
    'ZeDelivery': '🍺',
    'Ze Delivery': '🍺',
    'Netflix': '🎬',
    // Mapeamentos alternativos do banco de dados
    'Beef': '🍔',
    'Beer': '🍺',
    'Tv': '🎬',
    'IceCream2': '🍦',
    'Popcorn2': '🍿',
  };
  
  // Se o ícone já for um emoji, retorna ele
  if (/\p{Emoji}/u.test(icon)) {
    return icon;
  }
  
  // Caso contrário, busca no mapeamento
  return iconMap[icon] || icon;
};

const BenefitCard: React.FC<BenefitCardProps> = ({ option, onSelect, disabled = false }) => {
  // Determina a cor do card baseado no delivery_days
  const cardColorClass = option.delivery_days === 1 
    ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200' 
    : 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200';
  
  return (
    <div className={`group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 ${cardColorClass}`}>
      <div className="relative p-5 flex flex-col items-center text-center gap-3 min-h-[200px]">
        {/* Ícone GRANDE E ANIMADO */}
        <div className="flex-shrink-0 my-2">
          <div className="text-7xl transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 animate-bounce" style={{ animationDuration: '2s' }}>
            {getIconEmoji(option.icon)}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 space-y-1">
          <h3 className="font-bold text-lg text-gray-900 leading-tight">
            {option.name}
          </h3>
          {option.subtitle && (
            <p className="text-xs text-gray-600">
              {option.subtitle}
            </p>
          )}
        </div>

        {/* Button */}
        <Button
          onClick={() => onSelect(option.id)}
          disabled={disabled}
          className="w-full bg-[#DC2626] hover:bg-[#991b1b] text-white font-bold text-sm px-4 py-5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          Escolher
        </Button>
      </div>
    </div>
  );
};

export default BenefitCard;
