
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import ServiceCard from '@/components/ui/service-card';
import { supabase } from '@/integrations/supabase/client';
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

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const { data, error } = await supabase
          .from('homepage_config')
          .select('*')
          .order('service_type');

        if (error) {
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
          setConfigs(data || []);
        }
      } catch (error) {
        // Silent error handling for performance
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <section className="py-16 px-4 min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indexa-purple" />
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section 
        className="py-4 md:py-16 px-4 relative min-h-screen flex items-center" 
        style={{
          backgroundImage: "url('https://cdn.pixabay.com/photo/2015/05/04/20/03/purple-wallpaper-752886_1280.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          {/* Mobile: Cards empilhados verticalmente */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {configs.map((config) => (
              <ServiceCard
                key={config.id}
                title={config.title}
                backgroundImage={config.image_url}
                href={config.href}
                className="h-[180px]"
              />
            ))}
          </div>

          {/* Desktop: Banner central + Cards na lateral direita */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:h-[480px]">
            {/* Área central para banner - 8 colunas */}
            <div className="lg:col-span-8 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-r from-indexa-purple/20 to-purple-600/20 rounded-2xl border-2 border-dashed border-white/30 flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-3xl font-bold mb-4">Espaço para Banner Rotativo</h2>
                  <p className="text-lg opacity-80">Área reservada para conteúdo principal</p>
                </div>
              </div>
            </div>

            {/* Cards empilhados na lateral direita - 4 colunas */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {configs.map((config) => (
                <ServiceCard
                  key={config.id}
                  title={config.title}
                  backgroundImage={config.image_url}
                  href={config.href}
                  className="h-[150px] flex-1"
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
