
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Panel } from '@/types/panel';
import { AmenityList } from './AmenityList';
import { PanelStats } from './PanelStats';
import { PriceSection } from './PriceSection';
import { Info, BarChart3 } from 'lucide-react';
import { PanelImage } from './PanelImage';
import { BuildingInfo } from './BuildingInfo';
import { TechnicalData } from './TechnicalData';

interface PanelCardProps {
  panel: Panel;
  inCart: boolean;
  onAddToCart: (panel: Panel, duration: number) => void;
}

export const PanelCard: React.FC<PanelCardProps> = ({ panel, inCart, onAddToCart }) => {
  // Simulate pricing based on panel info
  const calculatePrice = (panel: Panel, days: number) => {
    // Base price calculation
    const basePrice = 100; // Base daily rate
    const locationFactor = panel.buildings?.bairro === 'Vila A' ? 1.5 : 
                          panel.buildings?.bairro === 'Centro' ? 1.3 : 1;
    
    // Apply discount based on duration
    let discount = 0;
    if (days >= 90) discount = 0.15;
    else if (days >= 60) discount = 0.10;
    else if (days >= 30) discount = 0.05;
    
    return Math.round(basePrice * locationFactor * days * (1 - discount));
  };
  
  // Generate data for panel display
  const monthlyViews = Math.floor(Math.random() * 50000) + 10000;
  const estimatedResidents = Math.floor(Math.random() * 800) + 200;
  const price = calculatePrice(panel, 30);
  const price60 = calculatePrice(panel, 60);
  const price90 = calculatePrice(panel, 90);
  const installDate = new Date(2024, Math.floor(Math.random() * 5), Math.floor(Math.random() * 28) + 1);
  const lastSync = panel.ultima_sync ? new Date(panel.ultima_sync) : new Date();
  const screenCount = Math.floor(Math.random() * 2) + 1;
  const resolution = panel.resolucao || '1080x1920';
  const mode = panel.modo || 'indoor';
  const impactScore = Math.floor(Math.random() * 50) + 50; // 50-100 scale
  const visualRating = Math.floor(Math.random() * 2) + 3; // 3-5 scale
  
  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div variants={itemVariants} className="w-full">
      <Card className="overflow-hidden border border-gray-200 hover:shadow-enhanced transition-all duration-300 hover:border-indexa-purple">
        <CardContent className="p-0">
          {/* Building image - full width */}
          <PanelImage 
            imageUrl={(panel.buildings as any)?.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'}
            altText={panel.buildings?.nome || 'Building image'} 
            status={panel.status}
            lastSync={lastSync}
            mode={mode}
            resolution={resolution}
            screenCount={screenCount}
          />
          
          <div className="p-6">
            {/* Building info */}
            <BuildingInfo 
              buildingName={panel.buildings?.nome || ''}
              address={panel.buildings?.endereco || ''}
              bairro={panel.buildings?.bairro || ''}
              impactScore={impactScore}
              mode={mode}
              installDate={installDate}
              lastSync={lastSync}
              estimatedResidents={estimatedResidents}
              visualRating={visualRating}
            />
            
            {/* Amenities row with horizontal scroll */}
            <div className="mb-6 border-b pb-4">
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Info className="h-4 w-4 mr-1.5 text-indexa-purple" />
                Comodidades do condomínio:
              </p>
              <AmenityList randomCount={Math.floor(Math.random() * 6) + 5} />
            </div>
            
            {/* Stats section */}
            <div className="mb-6 border-b pb-4">
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <BarChart3 className="h-4 w-4 mr-1.5 text-indexa-purple" />
                Métricas de audiência:
              </p>
              <PanelStats 
                estimatedResidents={estimatedResidents} 
                monthlyViews={monthlyViews}
                screenCount={screenCount}
                resolution={resolution}
                mode={mode}
              />
            </div>
            
            {/* Technical data - panel ID etc */}
            <TechnicalData 
              panelId={panel.id}
              code={panel.code}
              buildingId={panel.building_id}
            />
            
            {/* Price and CTA section */}
            <PriceSection 
              price={price}
              price60={price60}
              price90={price90}
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
