import React from 'react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { organizationSchema, createFAQSchema, createBreadcrumbSchema, lojaFAQs } from '@/components/seo/schemas';
import BuildingStoreLayout from '@/components/building-store/BuildingStoreLayout';
import BuildingStoreHeader from '@/components/building-store/BuildingStoreHeader';
import useBuildingStore from '@/hooks/useBuildingStore';
import FloatingCTA from '@/components/exa/FloatingCTA';
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BuildingStore = () => {
  console.log('🏢 [BUILDING STORE] Página da loja carregada');
  const navigate = useNavigate();
  const { isAdminAccount, isLoading: permissionsLoading } = useDynamicPermissions();

  const buildings = useBuildingStore(state => state.buildings);
  const isLoading = useBuildingStore(state => state.isLoading);
  const error = useBuildingStore(state => state.error);
  const searchLocation = useBuildingStore(state => state.searchLocation);
  const setSearchLocation = useBuildingStore(state => state.setSearchLocation);
  const selectedLocation = useBuildingStore(state => state.selectedLocation);
  const isSearching = useBuildingStore(state => state.isSearching);
  const filters = useBuildingStore(state => state.filters);
  const handleFilterChange = useBuildingStore(state => state.handleFilterChange);
  const handleSearch = useBuildingStore(state => state.handleSearch);
  const handleClearLocation = useBuildingStore(state => state.handleClearLocation);
  const initializeStore = useBuildingStore(state => state.initializeStore);
  const sortOption = useBuildingStore(state => state.sortOption);
  const setSortOption = useBuildingStore(state => state.setSortOption);

  // Initialize store on mount
  React.useEffect(() => {
    console.log('🚀 [BUILDING STORE] Inicializando store');
    initializeStore();
  }, [initializeStore]);

  // Bloquear admins de adicionar ao carrinho - notificar uma vez
  React.useEffect(() => {
    if (!permissionsLoading && isAdminAccount) {
      toast.warning(
        'Você está logado como administrador. Contas administrativas não podem realizar compras.',
        { duration: 5000, id: 'admin-block-warning' }
      );
    }
  }, [isAdminAccount, permissionsLoading]);

  // Log do estado atual
  React.useEffect(() => {
    console.log('🔄 [BUILDING STORE] === ESTADO ATUAL ===');
    console.log('🔄 [BUILDING STORE] buildings.length:', buildings.length);
    console.log('🔄 [BUILDING STORE] isLoading:', isLoading);
    console.log('🔄 [BUILDING STORE] error:', error);
  }, [buildings, isLoading, error]);

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col">
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
            <h2 className="text-2xl font-semibold text-red-500 mb-4">
              Erro ao carregar prédios
            </h2>
            <p className="text-muted-foreground mb-6">
              Ocorreu um problema ao buscar os prédios disponíveis.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-[#9C1E1E] text-white rounded-md hover:bg-[#9C1E1E]/80"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Anuncie em Painéis Digitais de Elevadores | A partir de R$297/mês - EXA"
        description="Alcance 10.000+ pessoas em prédios premium de Foz do Iguaçu. Anúncios em painéis digitais 21&quot; HD nos elevadores. Segmentação por perfil, rastreamento em tempo real. Planos a partir de R$297."
        keywords="anunciar painel digital, preço publicidade elevador, quanto custa anúncio prédio, contratar mídia indoor, publicidade elevador preço, anúncio prédio residencial, mídia indoor foz iguaçu"
        canonical="https://www.examidia.com.br/loja"
        ogImage="https://www.examidia.com.br/og-loja.jpg"
        structuredData={[
          organizationSchema,
          createBreadcrumbSchema([
            { name: 'Início', url: 'https://www.examidia.com.br/' },
            { name: 'Loja', url: 'https://www.examidia.com.br/loja' }
          ]),
          createFAQSchema(lojaFAQs)
        ]}
      />
      {/* Container principal - com espaçamento para o header */}
      <div className="min-h-screen w-full pt-20">
        <div className="w-full">
        <BuildingStoreLayout
          buildings={buildings}
          isLoading={isLoading}
          isSearching={isSearching}
          searchLocation={searchLocation}
          setSearchLocation={setSearchLocation}
          selectedLocation={selectedLocation}
          filters={filters}
          handleFilterChange={handleFilterChange}
          handleSearch={handleSearch}
          handleClearLocation={handleClearLocation}
          sortOption={sortOption}
          setSortOption={setSortOption}
        />
        </div>
      </div>
      <FloatingCTA variant="compact" />
    </Layout>
  );
};

export default BuildingStore;
