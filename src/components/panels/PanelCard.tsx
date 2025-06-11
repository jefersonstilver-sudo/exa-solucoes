
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Panel } from '@/types/panel';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Users, Eye, Monitor, Building, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCartManager } from '@/hooks/useCartManager';
import { useButtonAnimation } from '@/hooks/useButtonAnimation';
import { getPanelPrice } from '@/utils/checkoutUtils';

interface PanelCardProps {
  panel: Panel;
  inCart: boolean; // Keep for backward compatibility
  onAddToCart: (panel: Panel, duration: number) => void;
}

export const PanelCard: React.FC<PanelCardProps> = ({ panel, onAddToCart }) => {
  const [isAdding, setIsAdding] = useState(false);
  const { isAnimating, isPressed, startAnimation } = useButtonAnimation();
  
  // Connect to cart manager - simplified approach
  const { isItemInCart, initialLoadDone, setIsOpen } = useCartManager();
  
  // Simple check if item is in cart
  const inCart = initialLoadDone ? isItemInCart(panel.id) : false;

  console.log('🛒 [PanelCard] Renderizando:', {
    panelId: panel.id,
    buildingName: panel.buildings?.nome,
    inCart,
    initialLoadDone,
    isAdding
  });

  // Use UNIFIED price calculation from checkoutUtils
  const price = getPanelPrice(panel, 30); // 30 days default
  
  // Generate mock data for panel display
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

  // Handle add to cart with instant feedback
  const handleAddToCart = async () => {
    if (inCart || isAdding) {
      console.log('🛒 [PanelCard] Item já está no carrinho ou sendo adicionado');
      return;
    }
    
    try {
      console.log('🛒 [PanelCard] Iniciando adição ao carrinho');
      
      // Start loading and animation immediately
      setIsAdding(true);
      startAnimation();
      
      // Call the add to cart function with correct price
      await onAddToCart(panel, 30); // Default to 30 days
      
      console.log('🛒 [PanelCard] Item adicionado com sucesso');
      
      // Open cart drawer after adding
      setTimeout(() => {
        setIsOpen(true);
      }, 500);
      
      // Reset loading after animation
      setTimeout(() => {
        setIsAdding(false);
      }, 1000);
      
    } catch (error) {
      console.error('🛒 [PanelCard] Erro ao adicionar:', error);
      setIsAdding(false);
    }
  };

  // Determinar estado do botão
  const getButtonState = () => {
    if (isAdding) return 'loading';
    if (inCart) return 'added';
    return 'normal';
  };

  const buttonState = getButtonState();

  return (
    <motion.div 
      variants={containerVariants}
      whileHover="hover"
      className="w-full"
      animate={isAnimating ? {
        scale: [1, 1.02, 1],
      } : {}}
      transition={{ duration: 0.6 }}
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

            {/* Success animation overlay */}
            {isAnimating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                  className="bg-white rounded-full p-4 shadow-lg"
                >
                  <Check className="h-8 w-8 text-green-600" />
                </motion.div>
              </motion.div>
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
                animate={
                  isAnimating 
                    ? { 
                        scale: [1, 1.05, 1], 
                        backgroundColor: ['#3C1361', '#22c55e', '#3C1361']
                      } 
                    : isPressed 
                      ? { scale: 1.02 }
                      : { scale: 1 }
                }
                transition={{ 
                  duration: isAnimating ? 0.8 : 0.2,
                  ease: "easeInOut"
                }}
              >
                <Button 
                  className={`px-5 py-5 rounded-xl flex gap-2 transition-all duration-300 ${
                    buttonState === 'loading'
                      ? 'bg-[#3C1361]/80 text-white cursor-wait' 
                      : buttonState === 'added' 
                        ? 'bg-green-500 text-white hover:bg-green-500' 
                        : 'bg-[#00FFAB] hover:bg-[#00FFAB]/90 text-[#3C1361]'
                  }`}
                  onClick={handleAddToCart}
                  disabled={buttonState === 'added' || buttonState === 'loading'}
                >
                  {buttonState === 'loading' ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Adicionando...
                    </>
                  ) : buttonState === 'added' ? (
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
