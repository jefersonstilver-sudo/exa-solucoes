
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Panel } from '@/types/panel';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Users, Eye, Monitor, Building, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MobilePanelCardProps {
  panel: Panel;
  inCart: boolean;
  onAddToCart: (panel: Panel, duration: number) => void;
}

export const MobilePanelCard: React.FC<MobilePanelCardProps> = ({ 
  panel, 
  inCart, 
  onAddToCart 
}) => {
  // Calculate price for 30 days (base price)
  const calculatePrice = () => {
    const isCommercial = typeof panel.buildings?.condominiumProfile === 'string' 
      ? panel.buildings.condominiumProfile === 'commercial'
      : panel.buildings?.condominiumProfile?.type === 'commercial';
      
    const basePrice = isCommercial ? 350 : 280;
    const priceVariation = parseInt(panel.id.slice(-2), 16) % 40;
    return basePrice + priceVariation;
  };
  
  // Generate data for panel display
  const price = calculatePrice();
  const monthlyViews = Math.floor(Math.random() * 50000) + 10000;
  const estimatedResidents = Math.floor(Math.random() * 800) + 200;
  const screenCount = Math.floor(Math.random() * 2) + 1;
  
  // Building details
  const towers = Math.floor(Math.random() * 3) + 1;
  const apartments = Math.floor(Math.random() * 150) + 50;
  
  // Distance display
  const displayDistance = panel.distance ? `${(panel.distance / 1000).toFixed(1)}km` : null;
  
  // Check if commercial
  const isCommercial = typeof panel.buildings?.condominiumProfile === 'string' 
    ? panel.buildings.condominiumProfile === 'commercial'
    : panel.buildings?.condominiumProfile?.type === 'commercial';
  
  // Handle add to cart with animation
  const handleAddToCart = () => {
    if (!inCart) {
      onAddToCart(panel, 30); // Default to 30 days
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border border-gray-200 hover:border-[#3C1361]/30 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300">
        <CardContent className="p-0">
          {/* Building image - Mobile optimized aspect ratio */}
          <div className="relative w-full aspect-[16/9] overflow-hidden">
            <img 
              src={(panel.buildings as any)?.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'}
              alt={panel.buildings?.nome || 'Building image'} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Badges positioned for mobile */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              <Badge 
                className="bg-[#3C1361]/90 text-white py-1 px-2 text-xs font-medium rounded-lg backdrop-blur-sm"
              >
                {isCommercial ? 'Comercial' : 'Residencial'}
              </Badge>

              {displayDistance && (
                <Badge 
                  className="bg-[#00FFAB]/90 text-[#3C1361] py-1 px-2 text-xs font-medium rounded-lg backdrop-blur-sm"
                >
                  {displayDistance}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="p-4">
            {/* Building name and address - Mobile optimized */}
            <div className="mb-3">
              <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">
                {panel.buildings?.nome || 'Edifício Sem Nome'}
              </h3>
              <div className="flex items-start text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">
                  {panel.buildings?.endereco || ''}, {panel.buildings?.bairro || ''}
                </span>
              </div>
            </div>
            
            {/* Building details - Simplified for mobile */}
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-1 text-[#3C1361]" />
                <span>{towers} torre{towers > 1 ? 's' : ''}</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div>
                <span>{apartments} apts</span>
              </div>
            </div>
            
            {/* Metrics section - 2x2 grid for mobile */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl py-3">
                <div className="flex items-center justify-center text-[#3C1361] mb-1">
                  <Users className="h-4 w-4" />
                </div>
                <p className="text-gray-900 font-semibold text-base">{estimatedResidents}</p>
                <p className="text-gray-500 text-xs text-center">moradores</p>
              </div>
              
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl py-3">
                <div className="flex items-center justify-center text-[#3C1361] mb-1">
                  <Eye className="h-4 w-4" />
                </div>
                <p className="text-gray-900 font-semibold text-base">
                  {(monthlyViews / 1000).toFixed(1)}k
                </p>
                <p className="text-gray-500 text-xs text-center">views/mês</p>
              </div>
            </div>
            
            {/* Price section - Mobile optimized */}
            <div className="bg-gradient-to-r from-[#3C1361]/5 to-[#00FFAB]/5 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">30 dias</p>
                  <p className="text-xl font-bold text-[#3C1361]">
                    R$ {price.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">{screenCount} tela{screenCount > 1 ? 's' : ''}</p>
                  <Monitor className="h-6 w-6 text-[#3C1361] ml-auto" />
                </div>
              </div>
            </div>
            
            {/* CTA Button - Full width for mobile */}
            <Button 
              className={`w-full h-12 rounded-xl flex gap-2 items-center justify-center font-medium transition-all duration-200 ${
                inCart 
                  ? 'bg-green-100 text-green-700 hover:bg-green-100 cursor-default' 
                  : 'bg-[#00FFAB] hover:bg-[#00FFAB]/90 text-[#3C1361] hover:scale-[1.02] active:scale-[0.98]'
              }`}
              onClick={handleAddToCart}
              disabled={inCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {inCart ? 'Adicionado ao carrinho' : 'Adicionar ao carrinho'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
