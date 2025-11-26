import React, { useState, useEffect } from 'react';
import { BuildingStore, getImageUrl } from '@/services/buildingStoreService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, X, Eye, Users, Monitor, ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/SimpleCartContext';
import { adaptBuildingToPanel } from '@/services/buildingToPanelAdapter';
import { toast } from 'sonner';

interface MobileBuildingSheetProps {
  building: BuildingStore;
  onClose: () => void;
}

const MobileBuildingSheet: React.FC<MobileBuildingSheetProps> = ({ building, onClose }) => {
  const navigate = useNavigate();
  const { addToCart, isItemInCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [inCartLocal, setInCartLocal] = useState(false);

  useEffect(() => {
    setInCartLocal(isItemInCart(building.id));
  }, [building.id, isItemInCart]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getDisplayStatus = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'instalação' || normalizedStatus === 'instalacao') {
      return 'PRE VENDA';
    }
    return status || 'N/A';
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'ativo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'instalação':
      case 'instalacao':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inativo':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manutencao':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR');
  };

  const handleViewDetails = () => {
    navigate(`/loja/${building.id}`);
  };

  const handleAddToCart = async () => {
    if (inCartLocal || isAdding) return;

    setIsAdding(true);
    try {
      const panel = adaptBuildingToPanel(building);
      addToCart(panel, 30);
      setInCartLocal(true);
      toast.success('Prédio adicionado ao carrinho!');
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-[10001] pointer-events-none"
    >
      <div className="px-4 pb-safe pointer-events-auto">
        <Card className="bg-background/95 backdrop-blur-xl shadow-2xl border-2 border-border/40 rounded-t-3xl overflow-hidden mb-4">
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-border" />
          </div>

          {/* Building Image */}
          <div className="relative h-36 overflow-hidden">
            <img 
              src={getImageUrl(building.imagem_principal) || '/placeholder.svg'} 
              alt={building.nome}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Status Badge on Image */}
            <div className="absolute top-3 left-3">
              <Badge 
                variant="outline" 
                className={`text-xs px-2.5 py-1 font-semibold backdrop-blur-sm ${getStatusColor(building.status)}`}
              >
                {getDisplayStatus(building.status)}
              </Badge>
            </div>

            {/* Close Button on Image */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="absolute top-3 right-3 text-white hover:bg-white/20 h-8 w-8 p-0 flex-shrink-0 rounded-full backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <CardContent className="p-4 space-y-3">
            {/* Header */}
            <div>
              <h3 className="font-bold text-xl text-foreground leading-tight mb-2">
                {building.nome}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{building.bairro}</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 py-3 border-y border-border">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">Público</p>
                <p className="text-base font-bold text-foreground">
                  {formatNumber(building.publico_estimado || 0)}
                </p>
              </div>

              <div className="text-center border-l border-r border-border">
                <div className="flex items-center justify-center mb-2">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">Exibições/mês</p>
                <p className="text-base font-bold text-foreground">
                  {formatNumber(building.visualizacoes_mes || 0)}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Monitor className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">Telas</p>
                <p className="text-base font-bold text-foreground">
                  {building.numero_elevadores || 0}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground font-medium">A partir de</span>
              <span className="font-bold text-2xl text-primary">
                {formatPrice(building.preco_base || 0)}
                <span className="text-sm text-muted-foreground font-normal">/mês</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={handleViewDetails}
                variant="outline"
                className="w-full h-11 text-base font-semibold border-2"
              >
                Ver Detalhes
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={inCartLocal || isAdding}
                className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 disabled:opacity-70"
              >
                {isAdding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Adicionando...
                  </>
                ) : inCartLocal ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    No Carrinho
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default MobileBuildingSheet;
