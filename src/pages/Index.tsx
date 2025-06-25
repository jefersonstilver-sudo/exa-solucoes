
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import ServiceCard from '@/components/ui/service-card';
import { HomepageBannerCarousel } from '@/components/ui/homepage-banner';
import { supabase } from '@/integrations/supabase/client';
import { useHomepageBanners } from '@/hooks/useHomepageBanners';
import { Loader2 } from 'lucide-react';

interface HomepageConfig {
  id: string;
  service_type: string;
  title: string;
  image_url: string;
  href: string;
  updated_at: string;
}

const Index = () => {
  const [configs, setConfigs] = useState<HomepageConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { banners, isLoading: bannersLoading } = useHomepageBanners();

  useEffect(() => {
    console.log('🏠 [Index] Componente Index montado');
    
    const fetchConfigs = async () => {
      try {
        console.log('📊 [Index] Buscando configurações da homepage...');
        
        const { data, error } = await supabase
          .from('homepage_config')
          .select('*')
          .order('service_type');

        if (error) {
          console.log('⚠️ [Index] Erro ao buscar configs, usando fallback:', error);
        }

        // Sempre usar configs padrão para garantir que a página não fique vazia
        const defaultConfigs = [
          {
            id: '1',
            service_type: 'marketing',
            title: 'Marketing Digital',
            image_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80',
            href: '/marketing',
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            service_type: 'produtora',
            title: 'Produtora de Vídeos',
            image_url: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&q=80',
            href: '/produtora',
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            service_type: 'paineis',
            title: 'Painéis Publicitários',
            image_url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80',
            href: '/paineis-digitais/loja',
            updated_at: new Date().toISOString()
          }
        ];

        setConfigs(data && data.length > 0 ? data : defaultConfigs);
        console.log('✅ [Index] Configs definidas:', data?.length || defaultConfigs.length);
        
      } catch (error) {
        console.error('❌ [Index] Erro crítico ao carregar configs:', error);
        setConfigs([
          {
            id: '1',
            service_type: 'marketing',
            title: 'Marketing Digital',
            image_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80',
            href: '/marketing',
            updated_at: new Date().toISOString()
          }
        ]);
      } finally {
        setIsLoading(false);
        console.log('🏁 [Index] Carregamento finalizado');
      }
    };

    fetchConfigs();
  }, []);

  console.log('🔄 [Index] Status do carregamento:', { 
    isLoading, 
    bannersLoading, 
    configsCount: configs.length,
    bannersCount: banners?.length || 0 
  });

  if (isLoading || bannersLoading) {
    return (
      <Layout>
        <section className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 pt-20 flex items-center justify-center">
          <div className="text-center text-white">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Carregando página inicial...</p>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 pt-20 relative">
        {/* Conteúdo principal sempre visível */}
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          
          {/* Mobile: Banner no topo + Cards empilhados */}
          <div className="lg:hidden space-y-6">
            {/* Banner no mobile - sempre renderiza algo */}
            <div className="h-[300px] sm:h-[350px] md:h-[400px] bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden">
              {banners && banners.length > 0 ? (
                <HomepageBannerCarousel 
                  banners={banners} 
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-center p-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Bem-vindo à Indexa</h2>
                    <p className="text-lg opacity-90">Soluções completas em marketing digital</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Cards empilhados no mobile */}
            <div className="grid grid-cols-1 gap-4">
              {configs.map((config) => (
                <ServiceCard
                  key={config.id}
                  title={config.title}
                  backgroundImage={config.image_url}
                  href={config.href}
                  className="h-[180px] shadow-xl"
                />
              ))}
            </div>
          </div>

          {/* Desktop: Banner central + Cards na lateral */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:h-[480px]">
            {/* Banner central - 8 colunas */}
            <div className="lg:col-span-8 bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden">
              {banners && banners.length > 0 ? (
                <HomepageBannerCarousel 
                  banners={banners} 
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-center p-8">
                  <div>
                    <h2 className="text-3xl font-bold mb-6">Bem-vindo à Indexa</h2>
                    <p className="text-xl opacity-90">Soluções completas em marketing digital</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cards empilhados na lateral - 4 colunas */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {configs.map((config) => (
                <ServiceCard
                  key={config.id}
                  title={config.title}
                  backgroundImage={config.image_url}
                  href={config.href}
                  className="h-[150px] flex-1 shadow-xl"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
