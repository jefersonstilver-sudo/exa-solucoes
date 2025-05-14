
import React from 'react';
import { X, Users, Eye, Monitor, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Panel } from '@/types/panel';

interface CartItemProps {
  item: { panel: Panel; duration: number };
  onRemove: (panelId: string) => void;
  onChangeDuration: (panelId: string, duration: number) => void;
  calculatePrice: (panel: Panel, days: number) => number;
}

const durationOptions = [30, 60, 90, 180, 365];

const CartItem: React.FC<CartItemProps> = ({ 
  item, 
  onRemove, 
  onChangeDuration,
  calculatePrice 
}) => {
  // Função para tornar o número mais agradável visualmente
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };
  
  // Determinar os tipos de tags baseados no nome do prédio
  const getBuildingTags = (buildingName: string | undefined): string[] => {
    if (!buildingName) return ['Comercial'];
    
    const tags = [];
    if (buildingName.toLowerCase().includes('edifício') || 
        buildingName.toLowerCase().includes('residencial')) {
      tags.push('Residencial');
    } else {
      tags.push('Comercial');
    }
    
    // Adicionar tags baseadas no hash do nome para simular dados reais
    const hash = buildingName.length % 3;
    if (hash === 0) tags.push('Shopping');
    if (hash === 1) tags.push('Corporativo');
    if (hash === 2) tags.push('Premium');
    
    return tags;
  };
  
  // Gerar valores fictícios baseados no ID do painel
  const getViewerStats = (panelId: string) => {
    const hash = panelId.length;
    return {
      residents: 400 + (hash * 17) % 800,
      monthlyViews: 25000 + (hash * 523) % 30000,
      screens: 1 + (hash % 3)
    };
  };
  
  const stats = getViewerStats(item.panel.id);
  const tags = getBuildingTags(item.panel.buildings?.nome);
  const durationText = item.duration === 30 ? '1 mês' : 
                        item.duration === 365 ? '1 ano' : 
                        (item.duration / 30) + ' meses';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
      layout
      className="mb-3"
    >
      <Card className="border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="flex flex-col">
            <div className="w-full h-36 md:h-32 bg-gray-100 relative overflow-hidden">
              <img 
                src={item.panel.buildings?.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'} 
                alt={item.panel.buildings?.nome || 'Building image'}
                className="w-full h-full object-cover"
                aria-label="Imagem do prédio"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 bg-white/70 text-gray-500 hover:text-red-600 hover:bg-white rounded-full"
                onClick={() => onRemove(item.panel.id)}
                aria-label="Remover item"
              >
                <X className="h-3 w-3" />
              </Button>
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                <h4 className="font-bold text-white text-sm md:text-base line-clamp-1">
                  {item.panel.buildings?.nome || 'Painel Digital'}
                </h4>
                <p className="text-xs text-white/90 mt-0.5 line-clamp-1">
                  {item.panel.buildings?.endereco || 'Endereço não disponível'}
                </p>
              </div>
            </div>
            
            <div className="p-3">
              <div className="flex gap-1 mb-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-[#3C1361]/10 text-[#3C1361] text-xs border-none">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="flex items-center text-xs text-gray-500">
                  <Users className="h-3 w-3 mr-1 text-[#3C1361]" />
                  <span>{formatNumber(stats.residents)} moradores</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Eye className="h-3 w-3 mr-1 text-[#3C1361]" />
                  <span>{formatNumber(stats.monthlyViews)}/mês</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Monitor className="h-3 w-3 mr-1 text-[#3C1361]" />
                  <span>{stats.screens} {stats.screens === 1 ? 'tela' : 'telas'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                <div>
                  <Select
                    value={item.duration.toString()}
                    onValueChange={(value) => onChangeDuration(item.panel.id, parseInt(value))}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs bg-gray-50 border-gray-100">
                      <SelectValue placeholder={durationText} />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((days) => (
                        <SelectItem key={days} value={days.toString()}>
                          {days === 30 ? '1 mês' : 
                           days === 365 ? '1 ano' : 
                           `${Math.floor(days/30)} meses`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <p className="text-base font-bold text-[#3C1361]">
                  {formatCurrency(calculatePrice(item.panel, item.duration))}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CartItem;
