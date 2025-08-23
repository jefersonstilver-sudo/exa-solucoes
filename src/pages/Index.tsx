
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ServiceCard from '@/components/ui/service-card';
import { HomepageBannerCarousel } from '@/components/ui/homepage-banner';
import { supabase } from '@/integrations/supabase/client';
import { useHomepageBanners } from '@/hooks/useHomepageBanners';
import LogoTicker from '@/components/exa/LogoTicker';
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
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Index component mounted, starting data fetch...');
    
    // 🔗 [CONFIRMACAO-FALLBACK] Detectar tokens de confirmação na URL raiz
    const checkForConfirmationTokens = () => {
      const hash = window.location.hash;
      if (hash.includes('access_token=') && hash.includes('type=signup')) {
        console.log('🎯 [CONFIRMACAO-FALLBACK] Tokens de confirmação detectados na raiz, redirecionando para /confirmacao');
        // Preservar o hash com os tokens e redirecionar
        navigate('/confirmacao' + hash);
        return true;
      }
      return false;
    };

    // Se encontrou tokens, não precisa carregar configs
    if (checkForConfirmationTokens()) {
      return;
    }
    
    const fetchConfigs = async () => {
      try {
        console.log('Fetching homepage configs from Supabase...');
        const { data, error } = await supabase
          .from('homepage_config')
          .select('*')
          .order('service_type');

        if (error) {
          console.error('Error fetching homepage configs:', error);
          console.log('Using fallback data due to Supabase error');
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
          console.log('Successfully fetched configs:', data);
          const normalized = (data || []).map((c) => c.href === '/linkae' ? { ...c, title: 'Marketing' } : c);
          setConfigs(normalized);
        }
      } catch (error) {
        console.error('Unexpected error during fetch:', error);
        console.log('Using fallback data due to unexpected error');
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
      } finally {
        console.log('Finished loading homepage configs');
        setIsLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  if (isLoading || bannersLoading) {
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
        className="py-4 md:py-16 px-4 relative min-h-screen flex items-center pt-28 lg:pt-24" 
        style={{
          backgroundImage: "url('https://cdn.pixabay.com/photo/2015/05/04/20/03/purple-wallpaper-752886_1280.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          {/* Mobile: Banner no topo + Cards empilhados verticalmente */}
          <div className="lg:hidden space-y-4">
            {/* Banner no mobile - aumentando altura significativamente */}
            <div className="h-[300px] sm:h-[350px] md:h-[400px]">
              <HomepageBannerCarousel 
                banners={banners} 
                className="w-full h-full"
              />
            </div>
            
            {/* Cards empilhados no mobile */}
            <div className="grid grid-cols-1 gap-3">
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
          </div>

          {/* Desktop: Banner central + Cards na lateral direita */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:h-[480px]">
            {/* Área central para banner - 8 colunas */}
            <div className="lg:col-span-8">
              <HomepageBannerCarousel 
                banners={banners} 
                className="w-full h-full"
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
                  className="h-[150px] flex-1"
                />
              ))}
            </div>
          </div>
          
          {/* Logo Ticker Section - Positioned after main content */}
          <div className="mt-8 lg:mt-12">
            <LogoTicker 
              speed={50}
              direction="ltr"
              pauseOnHover={true}
            />
            <div className="text-center mt-4">
              <h2 className="text-lg font-light text-white/40 font-inter tracking-wide">
                Nossos clientes e parceiros
              </h2>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
