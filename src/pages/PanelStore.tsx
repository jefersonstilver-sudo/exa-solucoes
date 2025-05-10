
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Filter, CheckCircle, X, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import PanelMap from '@/components/panels/PanelMap';
import PanelFilters from '@/components/panels/PanelFilters';
import PanelList from '@/components/panels/PanelList';
import PanelCart from '@/components/panels/PanelCart';
import { Panel } from '@/types/panel';
import { FilterOptions } from '@/types/filter';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function PanelStore() {
  const { toast } = useToast();
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [cartItems, setCartItems] = useState<{panel: Panel, duration: number}[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    radius: 5000, // 5km default
    neighborhood: '',
    status: ['online'],
    buildingProfile: [],
    facilities: [],
    minMonthlyViews: 0
  });
  
  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('panelCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to load cart from localStorage', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('panelCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Fetch panels based on filters
  const { data: panels, isLoading, error } = useQuery({
    queryKey: ['panels', filters, selectedLocation],
    queryFn: async () => {
      if (!selectedLocation) {
        // Return all panels if no location selected, limited to prevent overloading
        const { data, error } = await supabase
          .from('painels')
          .select(`
            id, 
            code,
            building_id,
            status,
            ultima_sync,
            buildings:building_id (
              id,
              nome,
              endereco,
              bairro,
              latitude,
              longitude,
              status
            )
          `)
          .eq('status', 'online')
          .limit(40);
          
        if (error) throw error;
        return data || [];
      }
      
      // Use RPC function to get panels within radius
      const { data, error } = await supabase.rpc('get_panels_by_location', {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        radius_meters: filters.radius
      });
      
      if (error) throw error;
      return data || [];
    },
    enabled: true
  });

  const handleSearch = async (location: string) => {
    try {
      // Simulate geocoding (in real implementation, use a geocoding service)
      // For demo purposes, use random coordinates around São Paulo
      const randomLat = -23.5505 + (Math.random() - 0.5) * 0.1;
      const randomLng = -46.6333 + (Math.random() - 0.5) * 0.1;
      
      setSelectedLocation({ lat: randomLat, lng: randomLng });
      setSearchLocation(location);
      
      toast({
        title: "Localização encontrada",
        description: `Mostrando resultados próximos a "${location}"`,
      });
    } catch (error) {
      console.error("Erro ao buscar localização:", error);
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: "Não foi possível encontrar esta localização. Tente novamente.",
      });
    }
  };

  const handleAddToCart = (panel: Panel, duration: number = 30) => {
    setCartItems(prev => {
      // Check if panel is already in cart
      const exists = prev.some(item => item.panel.id === panel.id);
      if (exists) {
        return prev.map(item => 
          item.panel.id === panel.id 
            ? {...item, duration} 
            : item
        );
      } else {
        return [...prev, { panel, duration }];
      }
    });
    
    toast({
      title: "Painel adicionado ao carrinho",
      description: `${panel.buildings?.nome} adicionado com duração de ${duration} dias`,
    });
  };

  const handleRemoveFromCart = (panelId: string) => {
    setCartItems(prev => prev.filter(item => item.panel.id !== panelId));
    
    toast({
      title: "Painel removido",
      description: "Item removido do carrinho com sucesso",
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos do carrinho",
    });
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(prev => ({...prev, ...newFilters}));
  };

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <h2 className="text-2xl font-semibold text-red-500 mb-4">Erro ao carregar painéis</h2>
          <p className="text-muted-foreground mb-6">
            Ocorreu um problema ao buscar os painéis disponíveis. Por favor, tente novamente.
          </p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-indexa-purple mb-6">
          Painéis Digitais
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Mobile Filter Trigger */}
          <div className="lg:hidden w-full mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] sm:w-[350px] overflow-y-auto">
                <PanelFilters 
                  filters={filters} 
                  onFilterChange={handleFilterChange}
                  onSearch={handleSearch}
                  loading={isLoading}
                />
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-3 xl:col-span-2">
            <PanelFilters 
              filters={filters} 
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              loading={isLoading}
            />
          </div>
          
          {/* Panel Results */}
          <div className="lg:col-span-6 xl:col-span-7">
            {/* Map View */}
            <div className="mb-6 rounded-lg overflow-hidden h-[350px] border shadow-sm">
              <PanelMap 
                panels={panels || []} 
                selectedLocation={selectedLocation}
                onAddToCart={handleAddToCart}
              />
            </div>
            
            {/* List View */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {isLoading ? 'Buscando painéis...' : 
                    panels?.length 
                      ? `${panels.length} painéis encontrados` 
                      : 'Nenhum painel encontrado'}
                </h2>
                {selectedLocation && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="truncate max-w-[200px]">{searchLocation}</span>
                  </div>
                )}
              </div>
              
              <PanelList 
                panels={panels || []} 
                isLoading={isLoading} 
                cartItems={cartItems}
                onAddToCart={handleAddToCart}
              />
            </div>
          </div>
          
          {/* Cart Sidebar */}
          <div className="lg:col-span-3">
            <PanelCart 
              cartItems={cartItems} 
              onRemove={handleRemoveFromCart} 
              onClear={handleClearCart}
              onChangeDuration={(panelId, duration) => {
                setCartItems(prev => prev.map(item => 
                  item.panel.id === panelId 
                    ? {...item, duration} 
                    : item
                ));
              }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
