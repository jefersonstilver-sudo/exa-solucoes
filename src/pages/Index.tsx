
import React from 'react';
import Layout from '@/components/layout/Layout';
import ServiceCard from '@/components/ui/service-card';

const Index = () => {
  return (
    <Layout>
      {/* Cards de Serviço - Agora como conteúdo principal */}
      <section className="py-12 flex items-center justify-center min-h-[calc(100vh-320px)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
