
import React from 'react';
import Layout from '@/components/layout/Layout';
import ServiceCard from '@/components/ui/service-card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <Layout>
      <div className="bg-indexa-gradient bg-indexa-wave">
        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-16 pb-32 text-white">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
              Transforme sua comunicação com a Indexa
            </h1>
            <p className="text-xl opacity-90 mb-8 animate-slide-in">
              Soluções inovadoras de marketing digital, produção audiovisual e painéis publicitários para elevar sua marca ao próximo nível.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="bg-indexa-mint text-indexa-purple-dark hover:bg-opacity-90">
                Conheça nossos serviços
                <ArrowRight size={16} className="ml-1" />
              </Button>
              <Button variant="outline" className="text-white border-white hover:bg-white hover:bg-opacity-10">
                Entre em contato
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Services Section */}
      <section className="container mx-auto px-6 py-16 -mt-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ServiceCard
            title="Marketing"
            backgroundImage="/public/lovable-uploads/0b464c46-e1d7-4cde-8f2e-ffded8c109a1.png"
            buttonText="Agende um café"
            buttonIcon="calendar"
          />
          <ServiceCard
            title="Produtora"
            backgroundImage="/public/lovable-uploads/0b464c46-e1d7-4cde-8f2e-ffded8c109a1.png"
            buttonText="Nossos trabalhos"
            buttonIcon="monitor"
          />
          <ServiceCard
            title="Painéis Publicitários"
            backgroundImage="/public/lovable-uploads/0b464c46-e1d7-4cde-8f2e-ffded8c109a1.png"
            buttonText="Saiba mais"
            buttonIcon="info"
          />
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-indexa-purple">Sobre a Indexa</h2>
            <p className="text-gray-700 mb-6">
              A Indexa é uma plataforma integrada de publicidade digital em ambientes residenciais, 
              com telas fixas instaladas em prédios (NUC + monitor).
            </p>
            <p className="text-gray-700 mb-6">
              Nossa missão é transformar ideias em resultados através do marketing digital, produção 
              audiovisual e publicidade inovadora, conectando marcas com seu público-alvo de maneira eficiente e mensurável.
            </p>
            <Button className="bg-indexa-purple hover:bg-indexa-purple-dark text-white">
              Conheça nossa história
              <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
          <div className="relative">
            <div className="bg-indexa-purple-light/10 h-64 md:h-80 w-full rounded-lg absolute -top-4 -right-4"></div>
            <div className="bg-indexa-purple/20 h-64 md:h-80 w-full rounded-lg border border-indexa-purple/30 relative flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-indexa-purple mb-2">Quer integrar sua marca?</h3>
                <p className="text-gray-600 mb-4">
                  Acesse nossa loja de painéis digitais e descubra como expandir seu alcance.
                </p>
                <Button className="bg-indexa-mint text-indexa-purple-dark hover:bg-opacity-90">
                  Visitar loja
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indexa-gradient py-16 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para transformar sua comunicação?</h2>
          <p className="max-w-2xl mx-auto text-lg mb-8 opacity-90">
            Entre em contato com nosso time de especialistas e descubra como podemos ajudar sua marca a alcançar novos patamares.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-white text-indexa-purple hover:bg-opacity-90">
              Agende uma consultoria
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:bg-opacity-10">
              Conheça nossos painéis
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
