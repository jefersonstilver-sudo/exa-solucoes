
import React from 'react';
import { Panel } from '@/types/panel';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { PanelCard } from './PanelCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PanelListProps {
  panels: Panel[];
  isLoading: boolean;
  cartItems: {panel: Panel, duration: number}[];
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const PanelList: React.FC<PanelListProps> = ({ 
  panels, 
  isLoading, 
  cartItems, 
  onAddToCart 
}) => {
  // Calculate if a panel is in cart
  const isPanelInCart = (panelId: string) => {
    return cartItems.some(item => item.panel.id === panelId);
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="overflow-hidden border border-gray-200 rounded-2xl">
            <CardContent className="p-0">
              <div className="h-64 bg-gray-200 animate-pulse"></div>
              <div className="p-4 space-y-4">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-6 w-24" />
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-10 w-36" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (panels.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center"
      >
        <div className="mx-auto h-12 w-12 text-gray-400 mb-3">🏙️</div>
        <h3 className="text-lg font-semibold mb-1 text-[#2B0A3D]">Nenhum painel encontrado</h3>
        <p className="text-muted-foreground mb-4">
          Tente ajustar seus filtros ou buscar em outra localização.
        </p>
        <p className="text-sm text-muted-foreground">
          Dica: Amplie o raio de busca ou remova alguns filtros para ver mais resultados.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Sort selector */}
      <div className="flex justify-end mb-4">
        <Select defaultValue="price-asc">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price-asc">Preço: menor para maior</SelectItem>
            <SelectItem value="price-desc">Preço: maior para menor</SelectItem>
            <SelectItem value="views-desc">Mais visualizações</SelectItem>
            <SelectItem value="popular">Mais populares</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {panels.map(panel => (
          <PanelCard
            key={panel.id}
            panel={panel}
            inCart={isPanelInCart(panel.id)}
            onAddToCart={onAddToCart}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default PanelList;
