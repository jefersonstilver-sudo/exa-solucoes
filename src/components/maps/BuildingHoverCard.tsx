import React, { useState, useRef, useCallback } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Building2, 
  Users, 
  Monitor,
  ShoppingCart,
  Plus,
  Check,
  Loader2
} from 'lucide-react';
import type { BuildingStore } from '@/services/buildingStoreService';
import { getImageUrl } from '@/services/buildingStoreService';
import { convertBuildingToPanel } from '@/services/buildingToPanelService';
import { useCartOptional } from '@/hooks/useCartOptional';
import { toast } from 'sonner';
import { getOptimalCardSide, getDynamicSideOffset, type CardSide } from '@/utils/cardPositioning';

interface BuildingHoverCardProps {
  building: BuildingStore;
  children: React.ReactNode;
  side?: CardSide;
}

const BuildingHoverCard: React.FC<BuildingHoverCardProps> = ({
  building,
  children,
  side
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [dynamicSide, setDynamicSide] = useState<CardSide>(side || 'top');
  const [inCartLocal, setInCartLocal] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const cart = useCartOptional();

  // Keep local inCart in sync (works even when rendered outside provider)
  const computeInCart = useCallback(() => {
    try {
      const c: any = cart || (window as any).__simpleCart;
      if (c?.isItemInCart) {
        return c.isItemInCart(building.id);
      }
      // Fallback: read from storage
      const raw = localStorage.getItem('simple_cart');
      if (!raw) return false;
      const items = JSON.parse(raw) as Array<{ panel: { id: string } } & any>;
      return Array.isArray(items) && items.some(i => i?.panel?.id === building.id);
    } catch {
      return false;
    }
  }, [cart, building.id]);

  React.useEffect(() => {
    setInCartLocal(computeInCart());
  }, [computeInCart]);

  React.useEffect(() => {
    const handler = () => setInCartLocal(computeInCart());
    window.addEventListener('cart:updated' as any, handler);
    return () => window.removeEventListener('cart:updated' as any, handler);
  }, [computeInCart]);

  // Smart positioning when hover card opens
  const handleOpenChange = useCallback((open: boolean) => {
    if (open && triggerRef.current && !side) {
      const optimalSide = getOptimalCardSide(triggerRef.current);
      setDynamicSide(optimalSide);
      setInCartLocal(computeInCart());
    }
  }, [side, computeInCart]);

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ativo': return 'default';
      case 'manutenção': return 'secondary';
      case 'inativo': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ativo': return 'Ativo';
      case 'manutenção': return 'Manutenção';
      case 'inativo': return 'Inativo';
      default: return 'Status não definido';
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return 'R$ 280';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (inCartLocal || isAdding) return;

    const targetCart: any = cart || (window as any).__simpleCart;
    if (!targetCart) {
      toast.error('Carrinho indisponível no momento');
      return;
    }
    
    try {
      setIsAdding(true);
      const panel = convertBuildingToPanel(building);
      await targetCart.addToCart(panel, 30);
      setInCartLocal(true);
      toast.success(`${building.nome} adicionado ao carrinho!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(`Erro ao adicionar ${building.nome} ao carrinho`);
    } finally {
      setIsAdding(false);
    }
  };

  const getButtonContent = () => {
    if (isAdding) {
      return (
        <>
          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
          Adicionando...
        </>
      );
    }
    
    if (inCartLocal) {
      return (
        <>
          <Check className="h-3 w-3 mr-2" />
          No Carrinho
        </>
      );
    }
    
    return (
      <>
        <Plus className="h-3 w-3 mr-2" />
        Adicionar
        <ShoppingCart className="h-3 w-3 ml-1" />
      </>
    );
  };

  return (
    <HoverCard openDelay={300} closeDelay={150} onOpenChange={handleOpenChange}>
      <HoverCardTrigger asChild>
        <div ref={triggerRef}>
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        side={side || dynamicSide} 
        sideOffset={getDynamicSideOffset()}
        align="center"
        avoidCollisions
        collisionPadding={12}
        className="w-72 sm:w-80 max-h-[85vh] overflow-auto p-0 bg-gradient-to-br from-white to-purple-50/30 border border-purple-200 shadow-2xl shadow-purple-500/20 rounded-xl backdrop-blur-sm"
      >
        <div className="relative">
          {/* 3D Purple Header with Building Image */}
          <div className="relative h-40 bg-gradient-to-br from-purple-600 via-[#3C1361] to-purple-800 overflow-hidden">
            {/* 3D Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
            
            {building.imagem_principal ? (
              <div className="relative h-full">
                <img 
                  src={getImageUrl(building.imagem_principal)} 
                  alt={building.nome}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-12 w-12 text-white/60" />
              </div>
            )}
            
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <Badge 
                variant={getStatusVariant(building.status)} 
                className="bg-white/90 text-purple-900 border-white/50 shadow-lg backdrop-blur-sm"
              >
                {getStatusLabel(building.status)}
              </Badge>
            </div>

            {/* Building Info Overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h3 className="font-bold text-lg mb-1 drop-shadow-sm">
                {building.nome}
              </h3>
              <div className="flex items-center text-white/90 text-sm">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {building.endereco}{building.bairro && `, ${building.bairro}`}
                </span>
              </div>
            </div>
          </div>

          {/* Content with 3D effect */}
          <div className="p-5 bg-gradient-to-b from-white to-gray-50/50">
            {/* Público impactado - pequeno e centralizado */}
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-lg px-3 py-2 shadow-md border border-gray-100">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <Users className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-900 font-medium">
                      {building.publico_estimado ? 
                        building.publico_estimado.toLocaleString('pt-BR') : 
                        building.padrao_publico || 'Público Geral'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Section with 3D effect */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 mb-4 shadow-inner border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 mb-1 font-medium">💰 A partir de</p>
                  <p className="text-2xl font-bold text-[#3C1361]">
                    {formatPrice(building.preco_base)}
                    <span className="text-sm font-normal text-purple-500">/mês</span>
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {building.quantidade_telas} painel{building.quantidade_telas !== 1 ? 'éis' : ''} disponível{building.quantidade_telas !== 1 ? 'eis' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button with 3D effect */}
            <Button
              onClick={handleAddToCart}
              disabled={inCartLocal || isAdding}
              className={`w-full py-2.5 sm:py-3 font-semibold text-xs sm:text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                !cart && !(window as any).__simpleCart
                  ? 'bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed' 
                  : isAdding 
                    ? 'bg-[#3C1361]/80 text-white cursor-wait' 
                    : inCartLocal 
                      ? 'bg-green-500 hover:bg-green-500 text-white cursor-default' 
                      : 'bg-gradient-to-r from-[#3C1361] to-purple-700 hover:from-[#3C1361]/90 hover:to-purple-600 text-white hover:scale-[1.02] active:scale-95'
              }`}
            >
              {(!cart && !(window as any).__simpleCart) ? (
                <>
                  <Plus className="h-3 w-3 mr-2" />
                  Carrinho Indisponível
                </>
              ) : (
                getButtonContent()
              )}
            </Button>

            {/* Amenities */}
            {((building.amenities && building.amenities.length > 0) || (building.caracteristicas && building.caracteristicas.length > 0)) && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex flex-wrap gap-1">
                  {(building.caracteristicas || building.amenities || []).slice(0, 3).map((item, index) => (
                    <span 
                      key={index}
                      className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full border border-purple-200"
                    >
                      {item}
                    </span>
                  ))}
                  {(building.caracteristicas || building.amenities || []).length > 3 && (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      +{(building.caracteristicas || building.amenities || []).length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default BuildingHoverCard;