
import React from 'react';
import Layout from '@/components/layout/Layout';
import ServiceCard from '@/components/ui/service-card';

const Index = () => {
  return (
    <Layout useGradientBackground>
      {/* Cards de Serviço with background image */}
      <section 
        className="py-16 px-4 relative" 
        style={{
          backgroundImage: "url('https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/Fundo%20do%20site/ChatGPT%20Image%2019%20de%20abr.%20de%202025,%2000_16_28.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9GdW5kbyBkbyBzaXRlL0NoYXRHUFQgSW1hZ2UgMTkgZGUgYWJyLiBkZSAyMDI1LCAwMF8xNl8yOC5wbmciLCJpYXQiOjE3NDcyMjkzMDYsImV4cCI6MTc3ODc2NTMwNn0._maYLuaSYRS-klLFH2om4rHyFrpAQpHeSAmi5mopWrA')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Add a semi-transparent overlay for better card visibility */}
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
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
