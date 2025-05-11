
import React from 'react';
import { Check, CheckCircle, Building, MapPin, User, Clock, Monitor, Star, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Panel } from '@/types/panel';
import { motion } from 'framer-motion';

interface PanelListProps {
  panels: Panel[];
  isLoading: boolean;
  cartItems: {panel: Panel, duration: number}[];
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const durationOptions = [
  { days: 30, discount: 0 },
  { days: 60, discount: 5 },
  { days: 90, discount: 10 }
];

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
  
  // Simulate pricing based on panel info
  const calculatePrice = (panel: Panel, days = 30) => {
    // In a real implementation, this would come from the backend
    // Here we're using a simple formula for demonstration
    const basePrice = 100; // Base daily rate
    const locationFactor = panel.buildings?.bairro === 'Vila A' ? 1.5 : 
                          panel.buildings?.bairro === 'Centro' ? 1.3 : 1;
    
    return Math.round(basePrice * locationFactor * days);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex flex-wrap gap-2 mb-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="flex items-center mb-2">
                  <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
                <div className="flex items-center mb-4">
                  <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
                <Skeleton className="h-10 w-full" />
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
        className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
      >
        <Building className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-semibold mb-1">Nenhum painel encontrado</h3>
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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
    >
      {panels.map(panel => {
        const visualizacoes = Math.floor(Math.random() * 5000) + 1000;
        const rating = (Math.floor(Math.random() * 10) + 40) / 10; // Between 4.0 and 5.0
        
        return (
          <motion.div key={panel.id} variants={itemVariants}>
            <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full">
              <CardContent className="p-0">
                {/* Placeholder building facade image */}
                <div className="relative h-44 bg-gradient-to-r from-[#7C3AED]/80 to-[#7C3AED] flex items-center justify-center">
                  <Building className="h-16 w-16 text-white/80" />
                  
                  {/* Status badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className={`${panel.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {panel.status === 'online' ? 'Ativo' : 'Instalando'}
                    </Badge>
                  </div>
                  
                  {/* Rating */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white text-gray-800 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {rating.toFixed(1)}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-1">{panel.buildings?.nome || 'Nome do Prédio'}</h3>
                  <div className="flex items-start mb-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {panel.buildings?.endereco || 'Endereço'}, {panel.buildings?.bairro || 'Bairro'}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="bg-gray-50">
                      {panel.resolucao || '1080p'}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50">
                      {panel.buildings?.bairro || 'Bairro'}
                    </Badge>
                    {panel.modo && (
                      <Badge variant="outline" className="bg-gray-50">
                        {panel.modo}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Monitor className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm">1 tela</span>
                    </div>
                    
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm font-medium">
                        {visualizacoes.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">views/mês</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">
                      Atualizado: {panel.ultima_sync ? new Date(panel.ultima_sync).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {durationOptions.map(option => {
                      const price = calculatePrice(panel, option.days);
                      const discountedPrice = price * (1 - (option.discount / 100));
                      
                      return (
                        <div
                          key={option.days}
                          className="border rounded-lg p-2 text-center cursor-pointer hover:border-[#7C3AED] hover:shadow-md transition-all"
                          onClick={() => onAddToCart(panel, option.days)}
                        >
                          <div className="font-medium text-sm mb-1">{option.days} dias</div>
                          <div className="text-sm font-semibold">
                            {formatCurrency(discountedPrice)}
                            {option.discount > 0 && (
                              <span className="block text-xs text-green-600">-{option.discount}%</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <Button 
                    className={`w-full transition-all hover:scale-105 duration-200 ${
                      isPanelInCart(panel.id) 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-[#7C3AED] hover:bg-[#00F894]'
                    }`}
                    onClick={() => onAddToCart(panel)}
                    disabled={isPanelInCart(panel.id)}
                  >
                    {isPanelInCart(panel.id) ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Adicionado ao carrinho
                      </>
                    ) : (
                      <>
                        Adicionar ao carrinho
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default PanelList;
