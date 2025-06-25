
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
          setConfigs([
            {
              id: '1',
              service_type: 'marketing',
              title: 'Marketing',
              image_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80',
              href: '/marketing',
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              service_type: 'produtora',
              title: 'Produtora',
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
          ]);
        } else {
          console.log('✅ [Index] Configs carregadas:', data?.length || 0);
          setConfigs(data || []);
        }
      } catch (error) {
        console.error('❌ [Index] Erro crítico ao carregar configs:', error);
        // Set fallback configs mesmo em caso de erro crítico
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

  useEffect(() => {
    console.log('🎨 [Index] Status dos banners:', {
      bannersLoading,
      bannersCount: banners?.length || 0,
      banners: banners?.map(b => ({ id: b.id, title: b.title })) || []
    });
  }, [banners, bannersLoading]);

  console.log('🔄 [Index] Renderizando - Loading:', { isLoading, bannersLoading });

  if (isLoading || bannersLoading) {
    return (
      <Layout>
        <section className="py-16 px-4 min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Carregando página inicial...</p>
          </div>
        </section>
      </Layout>
    );
  }

  console.log('🎯 [Index] Renderizando página completa');

  return (
    <Layout>
      <section 
        className="py-4 md:py-16 px-4 relative min-h-screen flex items-center pt-20 lg:pt-16" 
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          minHeight: "100vh"
        }}
      >
        {/* Overlay escuro para melhor contraste */}
        <div className="absolute inset-0 bg-black/30"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          {/* Mobile: Banner no topo + Cards empilhados verticalmente */}
          <div className="lg:hidden space-y-6">
            {/* Banner no mobile */}
            <div className="h-[300px] sm:h-[350px] md:h-[400px]">
              <HomepageBannerCarousel 
                banners={banners} 
                className="w-full h-full"
              />
            </div>
            
            {/* Cards empilhados no mobile */}
            <div className="grid grid-cols-1 gap-4">
              {configs.map((config) => (
                <ServiceCard
                  key={config.id}
                  title={config.title}
                  backgroundImage={config.image_url}
                  href={config.href}
                  className="h-[180px] shadow-lg"
                />
              ))}
            </div>
          </div>

          {/* Desktop: Banner central + Cards na lateral direita */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:h-[480px]">
            {/* Área central para banner - 8 colunas */}
            <div className="lg:col-span-8">
              <HomepageBannerCarousel 
                banners={banners} 
                className="w-full h-full shadow-2xl"
              />
            </div>

            {/* Cards empilhados na lateral direita - 4 colunas */}
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
