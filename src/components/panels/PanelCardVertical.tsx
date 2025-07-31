
import React from 'react';
import { motion } from 'framer-motion';
import { Panel } from '@/types/panel';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Users, Eye, Monitor, Building, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PanelCardVerticalProps {
  panel: Panel;
  inCart: boolean;
  onAddToCart: (panel: Panel, duration: number) => void;
}

const PanelCardVertical: React.FC<PanelCardVerticalProps> = ({ panel, inCart, onAddToCart }) => {
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
      boxShadow: "0 20px 25px -5px rgba(60, 19, 97, 0.1), 0 10px 10px -5px rgba(60, 19, 97, 0.05)",
      transition: { duration: 0.3 }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97, transition: { duration: 0.1 } }
  };

  // Handle add to cart with animation
  const handleAddToCart = () => {
    if (!inCart) {
      onAddToCart(panel, 30); // Default to 30 days
    }
  };

  // Get tags from audience_profile if available or fallback to tags
  const getTags = () => {
    // Verificar se audience_profile existe e é um array
    if (panel.buildings?.audience_profile && Array.isArray(panel.buildings.audience_profile)) {
      return panel.buildings.audience_profile;
    }
    
    // Fallback para tags se audience_profile não estiver disponível
    if (panel.buildings?.tags && Array.isArray(panel.buildings.tags)) {
      return panel.buildings.tags;
    }
    
    // Fallback para um valor padrão baseado no condominiumProfile
    return [isCommercial ? 'Comercial' : 'Residencial'];
  };

  return (
    <motion.div 
      id={`panel-${panel.id}`} // Add ID for map selection targeting
      variants={containerVariants}
      whileHover="hover"
      className="w-full"
    >
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="md:flex">
          {/* Building image - left side */}
          <div className="relative w-full aspect-square md:w-2/5 md:h-auto overflow-hidden">
            <img 
              src={(panel.buildings as any)?.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'}
              alt={panel.buildings?.nome || 'Building image'} 
              className="w-full h-full object-cover md:absolute md:inset-0"
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
          
          {/* Content - right side */}
          <div className="p-6 md:w-3/5 md:flex md:flex-col">
            <div className="flex-1">
              {/* Building name and address */}
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
                {panel.buildings?.nome || 'Edifício Sem Nome'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {panel.buildings?.endereco || ''}, {panel.buildings?.bairro || ''}
              </p>
              
              {/* Building details - number of towers and apartments */}
              <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-1 text-[#3C1361]" />
                  <span>{panel.buildings?.towers || 1} {(panel.buildings?.towers || 1) === 1 ? 'torre' : 'torres'}</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div>
                  <span>{panel.buildings?.apartments || 96} apartamentos</span>
                </div>
              </div>
              
              {/* Tags - usando getTags() para obter tags de várias possíveis fontes */}
              <div className="flex flex-wrap gap-2 mb-4">
                {getTags().map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-[#3C1361]/10 border-none text-[#3C1361] flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
              
              {/* Metrics section - 3 columns */}
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
            </div>
            
            {/* Price and CTA section */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
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
                  className={`px-6 py-6 rounded-xl flex gap-2 ${
                    inCart 
                      ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                      : 'bg-[#00FFAB] hover:bg-[#00FFAB]/90 text-[#3C1361]'
                  }`}
                  onClick={handleAddToCart}
                  disabled={inCart}
                >
                  {inCart ? (
                    <>
                      <ShoppingCart className="h-5 w-5" />
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
        </div>
      </div>
    </motion.div>
  );
};

export default PanelCardVertical;
