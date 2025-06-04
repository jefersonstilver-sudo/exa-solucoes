
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Panel } from '@/types/panel';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Users, Eye, Monitor, Building, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCartManager } from '@/hooks/useCartManager';

interface PanelCardProps {
  panel: Panel;
  inCart: boolean; // Keep for backward compatibility
  onAddToCart: (panel: Panel, duration: number) => void;
}

export const PanelCard: React.FC<PanelCardProps> = ({ panel, onAddToCart }) => {
  // Connect to cart manager - simplified approach
  const { isItemInCart, initialLoadDone } = useCartManager();
  
  // Simple check if item is in cart
  const inCart = initialLoadDone ? isItemInCart(panel.id) : false;

  console.log('🛒 [PanelCard] Renderizando:', {
    panelId: panel.id,
    buildingName: panel.buildings?.nome,
    inCart,
    initialLoadDone
  });

  // Calculate price for 30 days (base price)
  const calculatePrice = () => {
    // Check if condominiumProfile is string or object and extract profile type
    const isCommercial = typeof panel.buildings?.condominiumProfile === 'string' 
      ? panel.buildings.condominiumProfile === 'commercial'
      : panel.buildings?.condominiumProfile?.type === 'commercial';
      
    // Base price range between R$250 - R$380
    const basePrice = isCommercial ? 350 : 280;
    // Add slight variation based on panel ID to make prices look unique
    const priceVariation = parseInt(panel.id.slice(-2), 16) % 40; // 0-39 variation
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
  
  // Distance display (mock data for now)
  const displayDistance = panel.distance ? `${(panel.distance / 1000).toFixed(1)}km` : null;
  
  // Check if condominiumProfile is string or object and extract profile type
  const isCommercial = typeof panel.buildings?.condominiumProfile === 'string' 
    ? panel.buildings.condominiumProfile === 'commercial'
    : panel.buildings?.condominiumProfile?.type === 'commercial';
  
  // Animation variants
  const containerVariants = {
    hover: { 
      y: -5,
      boxShadow: "0 20px 25px -5px rgba(60, 19, 97, 0.2), 0 10px 10px -5px rgba(60, 19, 97, 0.1)",
      transition: { duration: 0.3 }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97, transition: { duration: 0.1 } }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!inCart) {
      console.log('🛒 [PanelCard] Chamando onAddToCart');
      onAddToCart(panel, 30); // Default to 30 days
    } else {
      console.log('🛒 [PanelCard] Item já está no carrinho');
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      whileHover="hover"
      className="w-full"
    >
      <Card className="overflow-hidden border border-gray-200 hover:border-[#3C1361]/50 rounded-2xl">
        <CardContent className="p-0">
          {/* Building image - full width */}
          <div className="relative w-full h-56 overflow-hidden">
            <img 
              src={(panel.buildings as any)?.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'}
              alt={panel.buildings?.nome || 'Building image'} 
              className="w-full h-full object-cover"
            />
            
            {/* Building profile badge */}
            <div className="absolute top-4 left-4">
              <Badge 
                className="bg-[#3C1361]/90 text-white py-1 px-3 text-xs font-medium rounded-full"
              >
                {isCommercial ? 'Comercial' : 'Residencial'}
              </Badge>
            </div>

            {/* Distance badge if available */}
            {displayDistance && (
              <div className="absolute top-4 right-4">
                <Badge 
                  className="bg-[#00FFAB]/90 text-[#3C1361] py-1 px-3 text-xs font-medium rounded-full"
                >
                  A {displayDistance} do local
                </Badge>
              </div>
            )}
          </div>
          
          <div className="p-6">
            {/* Building name and address */}
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              {panel.buildings?.nome || 'Edifício Sem Nome'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {panel.buildings?.endereco || ''}, {panel.buildings?.bairro || ''}
            </p>
            
            <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-1 text-[#3C1361]" />
                <span>{towers} {towers === 1 ? 'torre' : 'torres'}</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div>
                <span>{apartments} apartamentos</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl py-3 px-2">
                <div className="flex items-center justify-center text-[#3C1361] mb-1">
                  <Users className="h-4 w-4" />
                </div>
                <p className="text-gray-900 font-semibold text-lg">{estimatedResidents}</p>
                <p className="text-gray-500 text-xs text-center">moradores</p>
              </div>
              
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl py-3 px-2">
                <div className="flex items-center justify-center text-[#3C1361] mb-1">
                  <Eye className="h-4 w-4" />
                </div>
                <p className="text-gray-900 font-semibold text-lg">
                  {(monthlyViews / 1000).toFixed(1)}k
                </p>
                <p className="text-gray-500 text-xs text-center">visualizações/mês</p>
              </div>
              
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl py-3 px-2">
                <div className="flex items-center justify-center text-[#3C1361] mb-1">
                  <Monitor className="h-4 w-4" />
                </div>
                <p className="text-gray-900 font-semibold text-lg">{screenCount}</p>
                <p className="text-gray-500 text-xs text-center">
                  {screenCount === 1 ? 'tela' : 'telas'}
                </p>
              </div>
            </div>
            
            {/* Price and CTA section */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-500">Preço para 30 dias</p>
                <p className="text-xl font-bold text-[#3C1361]">
                  R$ {price.toLocaleString('pt-BR')}
                </p>
              </div>
              
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button 
                  className={`px-5 py-5 rounded-xl flex gap-2 ${
                    inCart 
                      ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                      : 'bg-[#00FFAB] hover:bg-[#00FFAB]/90 text-[#3C1361]'
                  }`}
                  onClick={handleAddToCart}
                  disabled={inCart}
                >
                  {inCart ? (
                    <>
                      <Check className="h-5 w-5" />
                      Adicionado
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Adicionar ao carrinho
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
