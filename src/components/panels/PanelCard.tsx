
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Panel } from '@/types/panel';
import { AmenityList } from './AmenityList';
import { PanelStats } from './PanelStats';
import { PriceSection } from './PriceSection';

interface PanelCardProps {
  panel: Panel;
  inCart: boolean;
  onAddToCart: (panel: Panel, duration: number) => void;
}

export const PanelCard: React.FC<PanelCardProps> = ({ panel, inCart, onAddToCart }) => {
  // Simulate pricing based on panel info
  const calculatePrice = (panel: Panel) => {
    // In a real implementation, this would come from the backend
    // Here we're using a simple formula for demonstration
    const basePrice = 100; // Base daily rate
    const locationFactor = panel.buildings?.bairro === 'Vila A' ? 1.5 : 
                          panel.buildings?.bairro === 'Centro' ? 1.3 : 1;
    
    return Math.round(basePrice * locationFactor * 30);
  };
  
  // Generate random estimated residents
  const getRandomResidents = () => {
    return Math.floor(Math.random() * 800) + 200; // 200-1000 residents
  };

  // Generate values for panel display
  const visualizacoes = Math.floor(Math.random() * 50000) + 10000;
  const estimatedResidents = getRandomResidents();
  const price = calculatePrice(panel);

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={itemVariants} className="w-full">
      <Card className="overflow-hidden border border-[#eaeaea] hover:shadow-lg transition-all duration-300">
        <CardContent className="p-0">
          {/* Building image - full width */}
          <div className="relative h-64 w-full">
            <img 
              src={(panel.buildings as any)?.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'} 
              alt={panel.buildings?.nome || 'Building image'}
              className="h-full w-full object-cover"
            />
            
            {/* Status indicator - small dot at top right */}
            <div className="absolute top-4 right-4 bg-white rounded-full shadow-md px-3 py-1.5 flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${panel.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              <span className="text-xs font-medium text-gray-800">
                {panel.status === 'online' ? 'Ativo' : 'Em instalação'}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {/* Building name */}
            <h3 className="text-xl font-semibold text-gray-800 mb-1.5">
              {panel.buildings?.nome || 'Nome do Edifício'}
            </h3>
            
            {/* Address */}
            <div className="flex items-start mb-5">
              <p className="text-gray-600">
                {panel.buildings?.endereco || 'Endereço'}, {panel.buildings?.bairro || 'Bairro'}
              </p>
            </div>
            
            {/* Amenities row with horizontal scroll */}
            <AmenityList randomCount={Math.floor(Math.random() * 6) + 2} />
            
            {/* Stats section */}
            <PanelStats 
              estimatedResidents={estimatedResidents} 
              monthlyViews={visualizacoes} 
            />
            
            {/* Price and CTA section */}
            <PriceSection 
              price={price} 
              inCart={inCart} 
              panel={panel} 
              onAddToCart={onAddToCart} 
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
