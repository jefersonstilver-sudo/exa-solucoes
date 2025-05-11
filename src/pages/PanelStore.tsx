
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
import { motion } from 'framer-motion';

const mockPanels = [
  {
    id: "1",
    code: "FOZ-VILA-A-01",
    building_id: "b1",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "4K",
    modo: "Interno",
    buildings: {
      id: "b1",
      nome: "Edifício Cataratas",
      endereco: "Av. Paraná, 1500",
      bairro: "Vila A",
      latitude: -25.5046,
      longitude: -54.5784,
      status: "ativo"
    }
  },
  {
    id: "2",
    code: "FOZ-CENTRO-01",
    building_id: "b2",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "1080p",
    modo: "Externo",
    buildings: {
      id: "b2",
      nome: "Shopping Cataratas",
      endereco: "Av. Costa e Silva, 185",
      bairro: "Centro",
      latitude: -25.516,
      longitude: -54.5784,
      status: "ativo"
    }
  },
  {
    id: "3", 
    code: "FOZ-JD-FLORES-01",
    building_id: "b3",
    status: "installing",
    ultima_sync: new Date().toISOString(),
    resolucao: "1080p",
    modo: "Interno",
    buildings: {
      id: "b3",
      nome: "Condomínio Flor do Iguaçu",
      endereco: "Rua das Orquídeas, 350",
      bairro: "Jardim das Flores",
      latitude: -25.5258,
      longitude: -54.5754,
      status: "ativo"
    }
  },
  {
    id: "4",
    code: "FOZ-MORFAN-01",
    building_id: "b4",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "4K",
    modo: "Interno",
    buildings: {
      id: "b4",
      nome: "Morfan Tower",
      endereco: "Av. Jorge Schimmelpfeng, 500",
      bairro: "Centro",
      latitude: -25.5196,
      longitude: -54.5864,
      status: "ativo"
    }
  },
  {
    id: "5",
    code: "FOZ-VILAB-01",
    building_id: "b5",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "1080p",
    modo: "Interno",
    buildings: {
      id: "b5",
      nome: "Residencial Iguaçu",
      endereco: "Rua Rio de Janeiro, 720",
      bairro: "Vila B",
      latitude: -25.5086,
      longitude: -54.5684,
      status: "ativo"
    }
  },
  {
    id: "6",
    code: "FOZ-MORUMBI-01",
    building_id: "b6",
    status: "installing",
    ultima_sync: new Date().toISOString(),
    resolucao: "4K",
    modo: "Externo",
    buildings: {
      id: "b6",
      nome: "Shopping Catuaí Palladium",
      endereco: "Av. Presidente Tancredo Neves, 8000",
      bairro: "Morumbi",
      latitude: -25.5416,
      longitude: -54.5384,
      status: "ativo"
    }
  },
  {
    id: "7",
    code: "FOZ-KLP-01",
    building_id: "b7",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "1080p",
    modo: "Interno",
    buildings: {
      id: "b7",
      nome: "Edifício Itaipu",
      endereco: "Rua Maringá, 300",
      bairro: "KLP",
      latitude: -25.5327,
      longitude: -54.5594,
      status: "ativo"
    }
  },
  {
    id: "8",
    code: "FOZ-CENTRO-02",
    building_id: "b8",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "4K",
    modo: "Interno",
    buildings: {
      id: "b8",
      nome: "Hotel Bourbon Cataratas",
      endereco: "Av. das Cataratas, 2345",
      bairro: "Centro",
      latitude: -25.5139,
      longitude: -54.5927,
      status: "ativo"
    }
  },
  {
    id: "9",
    code: "FOZ-TRESLAGOAS-01",
    building_id: "b9",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "1080p",
    modo: "Externo",
    buildings: {
      id: "b9",
      nome: "Shopping Três Lagoas",
      endereco: "Av. Silvio Américo Sasdelli, 1500",
      bairro: "Três Lagoas",
      latitude: -25.4846,
      longitude: -54.5684,
      status: "ativo"
    }
  },
  {
    id: "10",
    code: "FOZ-PORTOMEIRA-01",
    building_id: "b10",
    status: "installing",
    ultima_sync: new Date().toISOString(),
    resolucao: "4K",
    modo: "Interno",
    buildings: {
      id: "b10",
      nome: "Complexo Marco das Três Fronteiras",
      endereco: "Rua Edmundo de Barros, 1000",
      bairro: "Porto Meira",
      latitude: -25.5477,
      longitude: -54.5880,
      status: "ativo"
    }
  }
];

export default function PanelStore() {
  const { toast } = useToast();
  const [searchLocation, setSearchLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [cartItems, setCartItems] = useState<{panel: Panel, duration: number}[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    radius: 5000, // 5km default
    neighborhood: 'all',
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
      try {
        // For demo purposes, we'll use the mock panels
        // This would be replaced with actual API calls in production
        console.log("Using mock data instead of actual API calls");
        
        // Apply filters to mock data
        let filteredPanels = [...mockPanels];
        
        // Filter by status
        if (filters.status.length > 0) {
          filteredPanels = filteredPanels.filter(panel => 
            filters.status.includes(panel.status === 'installing' ? 'installing' : 'online')
          );
        }
        
        // Filter by neighborhood
        if (filters.neighborhood && filters.neighborhood !== 'all') {
          filteredPanels = filteredPanels.filter(panel => 
            panel.buildings?.bairro === filters.neighborhood
          );
        }
        
        // If we have a selected location, simulate proximity filtering
        if (selectedLocation) {
          console.log(`Filtering panels near selected location: ${selectedLocation.lat}, ${selectedLocation.lng}`);
          
          // Simple distance calculation for demonstration
          filteredPanels = filteredPanels.map(panel => {
            if (panel.buildings?.latitude && panel.buildings?.longitude) {
              const distance = Math.sqrt(
                Math.pow(panel.buildings.latitude - selectedLocation.lat, 2) + 
                Math.pow(panel.buildings.longitude - selectedLocation.lng, 2)
              ) * 111000; // Rough conversion to meters
              
              return { ...panel, distance };
            }
            return panel;
          }).filter(panel => (panel as any).distance <= filters.radius);
        }
        
        return filteredPanels;
      } catch (err) {
        console.error('Error fetching panels:', err);
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <h1 className="text-3xl font-bold text-[#7C3AED] mb-6">
          Painéis Digitais
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Mobile Filter Trigger */}
          <div className="lg:hidden w-full mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full border-[#7C3AED] text-[#7C3AED]">
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
          <div className="hidden lg:block lg:col-span-3 xl:col-span-3">
            <PanelFilters 
              filters={filters} 
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              loading={isLoading || isSearching}
            />
          </div>
          
          {/* Panel Results */}
          <div className="lg:col-span-6 xl:col-span-6">
            {/* Map View */}
            <div className="mb-6 rounded-lg overflow-hidden h-[350px] border shadow-md">
              <PanelMap 
                panels={panels || []} 
                selectedLocation={selectedLocation}
                onAddToCart={handleAddToCart}
              />
            </div>
            
            {/* Location info and search status */}
            <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold text-[#7C3AED]">
                {isLoading || isSearching ? (
                  <div className="flex items-center">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Buscando painéis...
                  </div>
                ) : panels && panels.length > 0 ? (
                  <>{panels.length} painéis encontrados</>
                ) : (
                  <>Nenhum painel encontrado</>
                )}
              </h2>
              {selectedLocation && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-sm bg-[#7C3AED]/10 px-2 py-1 rounded-md">
                    <MapPin className="w-4 h-4 mr-1 text-[#7C3AED]" />
                    <span className="truncate max-w-[200px] text-[#7C3AED]">{searchLocation}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearLocation}
                    className="h-6 w-6 p-0 rounded-full hover:bg-red-100 hover:text-red-500"
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
          
          {/* Cart Sidebar */}
          <div className="lg:col-span-3 xl:col-span-3">
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
      </motion.div>
    </Layout>
  );
}
