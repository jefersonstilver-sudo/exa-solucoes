import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Filter, Search, Loader2, X, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import MiniMap from '@/components/panels/MiniMap';
import PanelFilters from '@/components/panels/PanelFilters';
import PanelList from '@/components/panels/PanelList';
import { Panel, Building as BuildingType } from '@/types/panel';
import { FilterOptions } from '@/types/filter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getPanelsByLocation } from '@/services/supabase';
import { getLocationCoordinates } from '@/services/geocoding';
import { motion } from 'framer-motion';

// Mock buildings images (simulating generated images)
const buildingImages = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1465804575741-338df8554e02?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2073&q=80",
  "https://images.unsplash.com/photo-1554435493-93422e8d1a41?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1577760258779-e8b26808c42f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1613492636024-9430710a84f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
  "https://images.unsplash.com/photo-1510964430293-3e3096075e2c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1624025308270-9323bf9a175d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1698075357677-673b9011f3e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1427751840561-9852520f8ce8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2076&q=80",
  "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
];

// Mock panels data with assigned images
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
      status: "ativo",
      imageUrl: buildingImages[0]
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
].map((panel, index) => ({
  ...panel,
  buildings: {
    ...(panel.buildings as BuildingType),
    imageUrl: buildingImages[index % buildingImages.length]
  }
}));

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
          
          try {
            // In a real application, we would use the Supabase RPC function
            // For now, let's simulate the distance calculation
            if (process.env.NODE_ENV === 'production') {
              // This would be the real implementation using Supabase
              const result = await supabase.rpc('get_panels_by_location', {
                lat: selectedLocation.lat,
                lng: selectedLocation.lng,
                radius_meters: filters.radius
              });
              
              if (result.error) {
                throw result.error;
              }

              // Map the API response to match our Panel type
              return (result.data || []).map(panel => {
                // Ensure status is one of the allowed values
                let validStatus: 'online' | 'offline' | 'maintenance' | 'installing' = 'offline';
                if (panel.status === 'online') validStatus = 'online';
                else if (panel.status === 'maintenance') validStatus = 'maintenance';
                else if (panel.status === 'installing') validStatus = 'installing';
                
                // Convert the buildings JSON to our Building type
                const buildings = panel.buildings as any;
                
                return {
                  ...panel,
                  status: validStatus,
                  buildings: buildings as Building
                } as Panel;
              });
            }
          } catch (error) {
            console.error("Error fetching panels from API:", error);
            // Fall back to mock data with distance calculation
          }
          
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
        
        return filteredPanels as Panel[];
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
    <Layout 
      cartItems={cartItems} 
      onRemoveFromCart={handleRemoveFromCart} 
      onClearCart={handleClearCart}
      onChangeDuration={(panelId, duration) => {
        setCartItems(prev => prev.map(item => 
          item.panel.id === panelId 
            ? {...item, duration} 
            : item
        ));
      }}
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        {/* Search section */}
        <div className="bg-white rounded-lg shadow-sm mb-6 border border-gray-200">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold text-indexa-purple mb-4">
              Encontre Painéis Digitais
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm mb-1 text-gray-500">Digite o bairro ou localização desejada</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:ring-indexa-purple focus:border-indexa-purple focus:outline-none"
                    placeholder="Bairro, endereço ou ponto de referência"
                    disabled={isSearching}
                  />
                  {searchLocation && (
                    <button
                      onClick={() => setSearchLocation('')}
                      className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleSearch(searchLocation)}
                    disabled={isSearching || !searchLocation}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white bg-indexa-purple p-1 rounded-md hover:bg-indexa-purple-dark disabled:bg-gray-300"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm mb-1 text-gray-500">Data de início</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border rounded-md focus:ring-indexa-purple focus:border-indexa-purple focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1 text-gray-500">Período</label>
                <select
                  className="w-full px-4 py-2 border rounded-md focus:ring-indexa-purple focus:border-indexa-purple focus:outline-none appearance-none"
                  defaultValue="30"
                >
                  <option value="30">30 dias</option>
                  <option value="60">60 dias</option>
                  <option value="90">90 dias</option>
                </select>
              </div>
            </div>
            
            {selectedLocation && (
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-1 text-indexa-purple" />
                  <span className="text-indexa-purple">{searchLocation}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">
                    {panels?.length || 0} resultados no raio de {filters.radius / 1000} km
                  </span>
                  <select 
                    className="px-2 py-1 text-sm border rounded-md focus:outline-none"
                    value={filters.radius}
                    onChange={(e) => handleFilterChange({ radius: Number(e.target.value) })}
                  >
                    <option value="500">500m</option>
                    <option value="1000">1km</option>
                    <option value="3000">3km</option>
                    <option value="5000">5km</option>
                    <option value="10000">10km</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filters and mini-map column */}
          <div className="lg:col-span-3 xl:col-span-3 space-y-6">
            {/* Mini Map */}
            <div className="hidden lg:block">
              <MiniMap 
                panels={panels || []} 
                selectedLocation={selectedLocation}
                onAddToCart={handleAddToCart}
              />
            </div>
            
            {/* Mobile Filter Trigger */}
            <div className="lg:hidden w-full">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full border-indexa-purple text-indexa-purple">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrar por
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
            <div className="hidden lg:block">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 sticky top-24">
                <h2 className="font-bold text-lg mb-4 text-gray-800">Filtrar por</h2>
                <PanelFilters 
                  filters={filters} 
                  onFilterChange={handleFilterChange}
                  onSearch={handleSearch}
                  loading={isLoading || isSearching}
                />
              </div>
            </div>
          </div>
          
          {/* Panel Results */}
          <div className="lg:col-span-9 xl:col-span-9">
            {/* Loading and result count */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-indexa-purple">
                {isLoading || isSearching ? (
                  <div className="flex items-center">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Buscando painéis...
                  </div>
                ) : panels && panels.length > 0 ? (
                  <>Painéis disponíveis</>
                ) : (
                  <>Nenhum painel encontrado</>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <select className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indexa-purple">
                  <option>Ordenar por: Relevância</option>
                  <option>Ordenar por: Maior Preço</option>
                  <option>Ordenar por: Menor Preço</option>
                  <option>Ordenar por: Mais visualizações</option>
                </select>
              </div>
            </div>
            
            {/* Custom Panel List in vertical layout */}
            {isLoading || isSearching ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="h-40 bg-gray-200 rounded-lg"></div>
                      <div className="md:col-span-2 space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-10 bg-gray-200 rounded w-1/3 mt-6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : panels && panels.length > 0 ? (
              <div className="space-y-5">
                {panels.map((panel) => (
                  <motion.div
                    key={panel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="h-48 md:h-full relative">
                        <img 
                          src={(panel.buildings as any).imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'}
                          alt={panel.buildings?.nome}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-semibold shadow-sm">
                          {panel.status === 'online' 
                            ? <span className="text-green-600 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1 inline-block"></span>Online</span>
                            : <span className="text-orange-600 flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-1 inline-block"></span>Instalando</span>
                          }
                        </div>
                      </div>
                      
                      <div className="p-4 md:col-span-2 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{panel.buildings?.nome}</h3>
                            <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                              ID: {panel.code}
                            </div>
                          </div>
                          
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="w-4 h-4 mr-2 text-indexa-purple" />
                            <span>{panel.buildings?.endereco}, {panel.buildings?.bairro}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            <div className="flex items-center text-sm">
                              <Building className="w-4 h-4 mr-1 text-gray-500" />
                              <span>Modo: {panel.modo}</span>
                            </div>
                            
                            <div className="flex items-center text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-gray-500"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
                              <span>Resolução: {panel.resolucao}</span>
                            </div>
                            
                            {(panel as any).distance && (
                              <div className="flex items-center text-sm">
                                <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                                <span>Distância: {Math.round((panel as any).distance)} m</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mt-2">
                          <div className="flex items-center gap-2">
                            <select 
                              className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-indexa-purple"
                              defaultValue="30"
                              onChange={(e) => {
                                // Update duration in cart if already added
                                const item = cartItems.find(item => item.panel.id === panel.id);
                                if (item) {
                                  setCartItems(cartItems.map(item => 
                                    item.panel.id === panel.id 
                                      ? {...item, duration: Number(e.target.value)} 
                                      : item
                                  ));
                                }
                              }}
                            >
                              <option value="30">30 dias</option>
                              <option value="60">60 dias</option>
                              <option value="90">90 dias</option>
                            </select>
                            
                            <Button 
                              className="bg-indexa-mint text-indexa-purple hover:bg-indexa-mint/80"
                              onClick={() => handleAddToCart(panel, 30)}
                            >
                              {cartItems.some(item => item.panel.id === panel.id) ? 'Atualizar no carrinho' : 'Adicionar ao carrinho'}
                            </Button>
                          </div>
                          
                          <div className="text-sm ml-auto">
                            <div className="font-medium">Preço diário estimado</div>
                            <div className="text-lg font-bold text-indexa-purple">R$ {(Math.random() * (70 - 30) + 30).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">Nenhum painel encontrado</h3>
                  <p className="text-gray-500 max-w-md">
                    Não encontramos painéis com os filtros atuais. Tente ajustar os filtros ou buscar em outra localização.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
