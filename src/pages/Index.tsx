
import React from 'react';
import Layout from '@/components/layout/Layout';
import ServiceCard from '@/components/ui/service-card';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

const Index = () => {
  const scrollToPaineis = () => {
    // Scroll para a seção de painéis digitais
    document.getElementById('paineis-digitais')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[500px] -mt-8 mb-12 overflow-hidden rounded-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80)` 
          }}
        >
          <div className="absolute inset-0 bg-indexa-purple-dark bg-opacity-60"></div>
        </div>
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 max-w-3xl">
            Mídia Digital em Condomínios com Alta Performance
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl">
            Contrate, envie o vídeo e impacte milhares de pessoas por mês.
          </p>
          <Button 
            onClick={scrollToPaineis}
            className="bg-indexa-mint text-indexa-purple-dark rounded-full text-lg px-8 py-6 font-semibold hover:scale-105 transition-transform"
          >
            Ver Painéis Disponíveis
            <ArrowDown className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Cards de Serviço */}
      <section className="py-12" id="paineis-digitais">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ServiceCard
            title="Marketing"
            backgroundImage="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80"
            buttonText="Agende um café"
            buttonIcon="calendar"
          />
          <ServiceCard
            title="Produtora"
            backgroundImage="https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&q=80"
            buttonText="Nossos trabalhos"
            buttonIcon="monitor"
          />
          <ServiceCard
            title="Painéis Publicitários"
            backgroundImage="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80"
            buttonText="Saiba mais"
            buttonIcon="info"
          />
        </div>
      </section>
    </Layout>
  );
};

export default Index;
