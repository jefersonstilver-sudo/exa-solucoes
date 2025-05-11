
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
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getPanelsByLocation } from '@/services/supabase';
import { getLocationCoordinates } from '@/services/geocoding';

export default function PanelStore() {
  const { toast } = useToast();
  const [searchLocation, setSearchLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
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
  const { data: panels, isLoading, error, refetch } = useQuery({
    queryKey: ['panels', filters, selectedLocation],
    queryFn: async () => {
      if (!selectedLocation) {
        // Return all panels if no location selected, limited to prevent overloading
        const { data, error } = await supabase
          .from('painels') // Using "painels" which is the correct table name in the TypeScript types
          .select(`
            id, 
            code,
            building_id,
            status,
            ultima_sync,
            resolucao,
            modo,
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
        
        // Properly map the data to ensure type compatibility
        if (Array.isArray(data)) {
          const mappedPanels = data.map(item => ({
            ...item,
            buildings: item.buildings as any // Cast to any first to avoid type issues
          }));
          console.log('Default panels loaded:', mappedPanels.length);
          return mappedPanels as Panel[];
        } else {
          console.log('No panels found in default query');
          return [] as Panel[];
        }
      }
      
      try {
        // Use our helper function that properly maps the types
        const locationPanels = await getPanelsByLocation(
          selectedLocation.lat, 
          selectedLocation.lng, 
          filters.radius
        );
        console.log(`Found ${locationPanels.length} panels near selected location`);
        return locationPanels;
      } catch (err) {
        console.error('Error fetching panels by location:', err);
        return [] as Panel[];
      }
    },
    enabled: true
  });

  const handleSearch = async (location: string) => {
    if (!location.trim()) {
      toast({
        variant: "destructive",
        title: "Localização vazia",
        description: "Por favor, digite um endereço ou bairro para buscar.",
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
      console.log('Searching for location:', location);
      
      // Get coordinates from address using our geocoding service
      const coordinates = await getLocationCoordinates(location);
      
      if (!coordinates) {
        toast({
          variant: "destructive",
          title: "Localização não encontrada",
          description: `Não foi possível encontrar "${location}". Tente um endereço mais específico.`,
        });
        setIsSearching(false);
        return;
      }
      
      console.log('Found coordinates:', coordinates);
      
      // Update selected location and search text
      setSelectedLocation(coordinates);
      setSearchLocation(location);
      
      // Refresh data query with new coordinates
      await refetch();
      
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
    } finally {
      setIsSearching(false);
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

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    // Special handling for neighborhood filter
    if (newFilters.neighborhood === 'all') {
      newFilters.neighborhood = '';
    }
    setFilters(prev => ({...prev, ...newFilters}));
  };

  const handleClearLocation = () => {
    setSelectedLocation(null);
    setSearchLocation('');
    toast({
      title: "Busca limpa",
      description: "Mostrando todos os painéis disponíveis",
    });
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
                  loading={isLoading || isSearching}
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
              loading={isLoading || isSearching}
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
                  {isLoading || isSearching ? 'Buscando painéis...' : 
                    panels && panels.length > 0
                      ? `${panels.length} painéis encontrados` 
                      : 'Nenhum painel encontrado'}
                </h2>
                {selectedLocation && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="truncate max-w-[200px]">{searchLocation}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleClearLocation}
                      className="h-6 w-6 p-0 rounded-full"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Limpar localização</span>
                    </Button>
                  </div>
                )}
              </div>
              
              <PanelList 
                panels={panels || []} 
                isLoading={isLoading || isSearching} 
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
