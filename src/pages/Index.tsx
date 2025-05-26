
import React from 'react';
import Layout from '@/components/layout/Layout';
import ServiceCard from '@/components/ui/service-card';

const Index = () => {
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
        </div>
      </section>
    </Layout>
  );
};

export default Index;
