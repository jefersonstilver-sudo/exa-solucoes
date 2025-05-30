
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
  button_text: string;
  button_icon: 'calendar' | 'monitor' | 'info';
  href: string;
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
          console.error('Erro ao buscar configurações:', error);
          // Fallback para configurações padrão
          setConfigs([
            {
              id: '1',
              service_type: 'marketing',
              title: 'Marketing',
              image_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80',
              button_text: 'Agende um café',
              button_icon: 'calendar',
              href: '/marketing'
            },
            {
              id: '2',
              service_type: 'produtora',
              title: 'Produtora',
              image_url: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&q=80',
              button_text: 'Nossos trabalhos',
              button_icon: 'monitor',
              href: '/produtora'
            },
            {
              id: '3',
              service_type: 'paineis',
              title: 'Painéis Publicitários',
              image_url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80',
              button_text: 'Saiba mais',
              button_icon: 'info',
              href: '/paineis-digitais/loja'
            }
          ]);
        } else {
          setConfigs(data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <section className="py-16 px-4 min-h-[calc(100vh-200px)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indexa-purple" />
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Cards de Serviço com background image */}
      <section 
        className="py-16 px-4 relative min-h-[calc(100vh-200px)] flex items-center" 
        style={{
          backgroundImage: "url('https://cdn.pixabay.com/photo/2015/05/04/20/03/purple-wallpaper-752886_1280.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Add a semi-transparent overlay for better card visibility */}
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {configs.map((config) => (
              <ServiceCard
                key={config.id}
                title={config.title}
                backgroundImage={config.image_url}
                buttonText={config.button_text}
                buttonIcon={config.button_icon}
                href={config.href}
              />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
