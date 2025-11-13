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
  Loader2,
  Navigation,
  Eye
} from 'lucide-react';
import type { BuildingStore } from '@/services/buildingStoreService';
import { getImageUrl } from '@/services/buildingStoreService';
import { adaptBuildingToPanel } from '@/services/buildingToPanelAdapter';
import { useCartOptional } from '@/hooks/useCartOptional';
import { toast } from 'sonner';
import { getOptimalCardSide, getDynamicSideOffset, type CardSide } from '@/utils/cardPositioning';
import { calculateDistance, formatDistance } from '@/utils/distanceCalculator';

interface BuildingHoverCardProps {
  building: BuildingStore;
  children: React.ReactNode;
  side?: CardSide;
  businessLocation?: { lat: number; lng: number } | null;
}

const BuildingHoverCard: React.FC<BuildingHoverCardProps> = ({
  building,
  children,
  side,
  businessLocation
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
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'ativo': return 'default';
      case 'manutenção': return 'secondary';
      case 'instalação':
      case 'instalacao': return 'outline';
      case 'inativo': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'ativo': return 'Ativo';
      case 'manutenção': return 'Manutenção';
      case 'instalação':
      case 'instalacao': return 'PRE VENDA';
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

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR');
  };

  // Calculate distance to business location
  const getBuildingDistance = () => {
    if (!businessLocation) return null;
    
    // Get building coordinates (manual takes priority)
    const buildingLat = building.manual_latitude || building.latitude;
    const buildingLng = building.manual_longitude || building.longitude;
    
    if (!buildingLat || !buildingLng || buildingLat === 0 || buildingLng === 0) {
      return null;
    }
    
    const distance = calculateDistance(
      businessLocation.lat,
      businessLocation.lng,
      buildingLat,
      buildingLng
    );
    
    return formatDistance(distance);
  };

  const distance = getBuildingDistance();

  const handleAddToCart = async () => {
    if (inCartLocal || isAdding) return;

    const targetCart: any = cart || (window as any).__simpleCart;
    if (!targetCart) {
      toast.error('Carrinho indisponível no momento');
      return;
    }
    
    try {
      setIsAdding(true);
      const panel = adaptBuildingToPanel(building);
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
        sideOffset={20}
        align="center"
        alignOffset={0}
        avoidCollisions={true}
        collisionPadding={{ top: 120, bottom: 30, left: 30, right: 30 }}
        sticky="always"
        className="w-72 sm:w-80 max-h-[70vh] overflow-y-auto p-0 bg-white border border-gray-200 shadow-2xl rounded-xl z-[9999]"
        style={{ maxWidth: 'calc(100vw - 40px)' }}
      >
        <div className="relative">
          {/* Header with Building Image */}
          <div className="relative h-40 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 overflow-hidden">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
            
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
            
            {/* Building Info Overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h3 className="font-bold text-lg mb-1 drop-shadow-sm">
                {building.nome}
              </h3>
              <div className="flex items-center justify-between text-white/90 text-sm">
                <div className="flex items-center flex-1 min-w-0">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {building.endereco}{building.bairro && `, ${building.bairro}`}
                  </span>
                </div>
                
                {/* Distance indicator */}
                {distance && (
                  <div className="flex items-center ml-2 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <Navigation className="h-3 w-3 mr-1" />
                    <span className="text-xs font-medium whitespace-nowrap">
                      {distance}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 bg-white">

            {/* Métricas em Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center bg-gray-50 border border-gray-200 p-3 rounded-md">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-xs text-gray-600 mb-0.5">Público</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatNumber(building.publico_estimado || 0)}
                </p>
              </div>

              <div className="text-center bg-gray-50 border border-gray-200 p-3 rounded-md">
                <div className="flex items-center justify-center mb-1">
                  <Eye className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-xs text-gray-600 mb-0.5">Exibições</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatNumber(building.visualizacoes_mes || 0)}
                </p>
              </div>

              <div className="text-center bg-gray-50 border border-gray-200 p-3 rounded-md">
                <div className="flex items-center justify-center mb-1">
                  <Monitor className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-xs text-gray-600 mb-0.5">Telas</p>
                <p className="text-sm font-bold text-gray-900">
                  {building.numero_elevadores || 0}
                </p>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1 font-medium">A partir de</p>
                  <p className="text-2xl font-bold text-[#9C1E1E]">
                    {formatPrice(building.preco_base)}
                    <span className="text-sm font-normal text-gray-500">/mês</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleAddToCart}
              disabled={inCartLocal || isAdding}
              className={`w-full py-2.5 sm:py-3 font-semibold text-xs sm:text-sm transition-all duration-200 ${
                !cart && !(window as any).__simpleCart
                  ? 'bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed' 
                  : isAdding 
                    ? 'bg-[#9C1E1E]/80 text-white cursor-wait' 
                    : inCartLocal 
                      ? 'bg-green-500 hover:bg-green-500 text-white cursor-default' 
                      : 'bg-[#9C1E1E] hover:bg-[#9C1E1E]/90 text-white hover:scale-105 active:scale-95'
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
                      className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md border border-gray-200"
                    >
                      {item}
                    </span>
                  ))}
                  {(building.caracteristicas || building.amenities || []).length > 3 && (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
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