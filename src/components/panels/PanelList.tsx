
import React from 'react';
import { Check, CheckCircle, Building, MapPin, Users, Eye, Monitor, Star, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Panel } from '@/types/panel';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PanelListProps {
  panels: Panel[];
  isLoading: boolean;
  cartItems: {panel: Panel, duration: number}[];
  onAddToCart: (panel: Panel, duration?: number) => void;
}

// Array de amenidades de condomínio para exibição
const amenities = [
  { icon: '🏋️', name: 'Academia' },
  { icon: '🏊', name: 'Piscina' },
  { icon: '🎉', name: 'Salão de Festas' },
  { icon: '🐶', name: 'Pet Place' },
  { icon: '🥩', name: 'Área de Churrasqueira' },
  { icon: '🧒', name: 'Playground' }
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
  const calculatePrice = (panel: Panel) => {
    // In a real implementation, this would come from the backend
    // Here we're using a simple formula for demonstration
    const basePrice = 100; // Base daily rate
    const locationFactor = panel.buildings?.bairro === 'Vila A' ? 1.5 : 
                          panel.buildings?.bairro === 'Centro' ? 1.3 : 1;
    
    return Math.round(basePrice * locationFactor * 30);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Generate random amenities for each panel
  const getRandomAmenities = () => {
    const shuffled = [...amenities].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 6) + 2); // 2-6 amenities
  };
  
  // Generate random estimated residents
  const getRandomResidents = () => {
    return Math.floor(Math.random() * 800) + 200; // 200-1000 residents
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

  const buttonVariants = {
    initial: { scale: 1 },
    added: { scale: [1, 1.1, 1], transition: { duration: 0.3 } }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="overflow-hidden border border-gray-200">
            <CardContent className="p-0">
              <div className="h-64 bg-gray-200 animate-pulse"></div>
              <div className="p-6 space-y-4">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-5 w-full" />
                <div className="flex gap-2 overflow-x-auto py-2">
                  {[1, 2, 3, 4].map(a => (
                    <Skeleton key={a} className="h-8 w-20 flex-shrink-0" />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
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
      className="space-y-6"
    >
      {panels.map(panel => {
        // Gerar dados simulados para cada painel
        const visualizacoes = Math.floor(Math.random() * 50000) + 10000;
        const randomAmenities = getRandomAmenities();
        const estimatedResidents = getRandomResidents();
        const price = calculatePrice(panel);
        const inCart = isPanelInCart(panel.id);
        
        return (
          <motion.div key={panel.id} variants={itemVariants} className="w-full">
            <Card className="overflow-hidden border border-[#eaeaea] hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                {/* Building image - full width */}
                <div className="relative h-64 w-full bg-gradient-to-r from-gray-700 to-gray-900">
                  <img 
                    src={(panel.buildings as any)?.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'} 
                    alt={panel.buildings?.nome || 'Building image'}
                    className="h-full w-full object-cover"
                  />
                  
                  {/* Status indicator - small dot at top right (mantido por ser relevante) */}
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
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-1.5 flex-shrink-0" />
                    <p className="text-gray-600">
                      {panel.buildings?.endereco || 'Endereço'}, {panel.buildings?.bairro || 'Bairro'}
                    </p>
                  </div>
                  
                  {/* Amenities row with horizontal scroll */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Comodidades do condomínio:</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {randomAmenities.map((amenity, idx) => (
                        <TooltipProvider key={idx}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className="flex items-center gap-1.5 py-1.5 px-3 whitespace-nowrap border-gray-200 bg-gray-50"
                              >
                                <span>{amenity.icon}</span>
                                <span>{amenity.name}</span>
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{amenity.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                  
                  {/* Stats section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Residents */}
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-lg font-semibold text-gray-800">+{estimatedResidents}</p>
                        <p className="text-sm text-gray-500">moradores impactados</p>
                      </div>
                    </div>
                    
                    {/* Monthly views */}
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-lg font-semibold text-gray-800">+{visualizacoes.toLocaleString('pt-BR')}</p>
                        <p className="text-sm text-gray-500">views/mês</p>
                      </div>
                    </div>
                    
                    {/* Screens */}
                    <div className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-lg font-semibold text-gray-800">1</p>
                        <p className="text-sm text-gray-500">tela instalada</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price and CTA section */}
                  <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-gray-100">
                    <div className="mb-4 sm:mb-0">
                      <p className="text-sm text-gray-500 mb-1">Preço por 30 dias:</p>
                      <p className="text-2xl font-bold text-indexa-purple">{formatCurrency(price)}</p>
                    </div>
                    
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={inCart ? "added" : "add"}
                        variants={buttonVariants}
                        initial="initial"
                        animate={inCart ? "added" : "initial"}
                        className="relative"
                      >
                        <Button 
                          className={`transition-all text-base px-6 py-6 rounded-full ${
                            inCart
                              ? 'bg-green-600 hover:bg-green-700 hover:scale-105' 
                              : 'bg-[#00ffb7] hover:bg-[#00e6a5] text-gray-800 hover:scale-105 hover:shadow-lg'
                          }`}
                          onClick={() => !inCart && onAddToCart(panel, 30)}
                          disabled={inCart}
                        >
                          {inCart ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5" />
                              <span>Adicionado</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>Adicionar ao carrinho</span>
                              <ArrowUpRight className="h-5 w-5" />
                            </div>
                          )}
                        </Button>
                      </motion.div>
                    </AnimatePresence>
                  </div>
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
