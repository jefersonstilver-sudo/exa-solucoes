
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

// Configurações padrão garantidas para evitar página vazia
const DEFAULT_CONFIGS: HomepageConfig[] = [
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

const Index = () => {
  const [configs, setConfigs] = useState<HomepageConfig[]>(DEFAULT_CONFIGS);
  const [isLoading, setIsLoading] = useState(false);
  const { banners, isLoading: bannersLoading } = useHomepageBanners();

  console.log('🏠 [Index] Componente renderizando', {
    configsCount: configs.length,
    bannersCount: banners?.length || 0,
    isLoading,
    bannersLoading
  });

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setIsLoading(true);
        console.log('📊 [Index] Buscando configurações...');
        
        const { data, error } = await supabase
          .from('homepage_config')
          .select('*')
          .order('service_type');

        if (data && data.length > 0) {
          setConfigs(data);
          console.log('✅ [Index] Configs carregadas do BD:', data.length);
        } else {
          console.log('📋 [Index] Usando configs padrão');
        }
        
      } catch (error) {
        console.error('❌ [Index] Erro ao carregar configs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  // Sempre renderizar conteúdo, mesmo com loading
  return (
    <Layout>
      <section className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 pt-20 relative">
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          
          {/* Loading state simplificado */}
          {(isLoading || bannersLoading) && (
            <div className="text-center text-white mb-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Carregando conteúdo...</p>
            </div>
          )}
          
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-6">
            {/* Banner Mobile */}
            <div className="h-[300px] sm:h-[350px] md:h-[400px] bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden">
              <HomepageBannerCarousel 
                banners={banners || []} 
                className="w-full h-full"
              />
            </div>
            
            {/* Cards Mobile */}
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

          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:h-[480px]">
            {/* Banner Desktop */}
            <div className="lg:col-span-8 bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden">
              <HomepageBannerCarousel 
                banners={banners || []} 
                className="w-full h-full"
              />
            </div>

            {/* Cards Desktop */}
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
