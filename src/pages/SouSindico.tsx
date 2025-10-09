import React from 'react';
import Layout from '@/components/layout/Layout';
import ExaSection from '@/components/exa/base/ExaSection';
import ExaCard from '@/components/exa/base/ExaCard';
import ExaCTA from '@/components/exa/base/ExaCTA';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Monitor, Zap, TrendingUp, Building } from 'lucide-react';

const benefits = [
  {
    icon: Monitor,
    title: 'Substituição de Murais Impressos',
    description: 'Acabe com o trabalho de imprimir e fixar avisos. Tudo digital, limpo e organizado.',
  },
  {
    icon: Zap,
    title: 'Publicação Rápida',
    description: 'Publique comunicados instantaneamente através do painel online.',
  },
  {
    icon: TrendingUp,
    title: 'Painel Limpo e Atualizado',
    description: 'Informações sempre atualizadas, sem papel acumulado ou desatualizado.',
  },
  {
    icon: Building,
    title: 'Valoriza o Espaço Físico',
    description: 'Elevadores modernos e elegantes, aumentando o valor percebido do condomínio.',
  },
];

const SouSindico = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <Layout className="bg-gradient-to-br from-gray-50 to-gray-100">
      <ExaSection background="transparent" className="min-h-screen py-24">
        <div 
          ref={ref}
          className={`space-y-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Hero */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <h1 className="font-montserrat font-extrabold text-5xl lg:text-6xl text-exa-purple">
              Informação Organizada,<br />
              <span className="text-exa-blue">Elevador Valorizado</span>
            </h1>
            <p className="font-poppins text-xl lg:text-2xl text-gray-700">
              Modernize a comunicação do seu condomínio com painéis digitais EXA. Avisos, comunicados e informações úteis em um só lugar.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <ExaCard key={index} variant="light">
                <benefit.icon className="w-12 h-12 text-exa-purple mb-4" />
                <h3 className="font-montserrat font-semibold text-2xl text-exa-black mb-3">
                  {benefit.title}
                </h3>
                <p className="font-poppins text-gray-600 text-lg">
                  {benefit.description}
                </p>
              </ExaCard>
            ))}
          </div>

          {/* Features List */}
          <div className="bg-gradient-to-br from-exa-purple to-exa-purple/90 rounded-3xl p-12 text-white max-w-4xl mx-auto">
            <h2 className="font-montserrat font-bold text-3xl mb-8 text-center">
              O que você ganha com a EXA:
            </h2>
            <ul className="space-y-4 font-poppins text-lg">
              <li className="flex items-start space-x-3">
                <span className="text-exa-yellow text-2xl">✓</span>
                <span>Painel digital moderno sem custo de instalação</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-exa-yellow text-2xl">✓</span>
                <span>Acesso ao sistema de gestão de conteúdo</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-exa-yellow text-2xl">✓</span>
                <span>Manutenção e suporte técnico inclusos</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-exa-yellow text-2xl">✓</span>
                <span>Conteúdos úteis automatizados (clima, câmbio, notícias)</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-exa-yellow text-2xl">✓</span>
                <span>Possibilidade de geração de receita com publicidade</span>
              </li>
            </ul>
          </div>

          {/* CTA Final */}
          <div className="text-center space-y-6 bg-white rounded-3xl p-12 shadow-lg max-w-4xl mx-auto">
            <h2 className="font-montserrat font-bold text-3xl text-exa-purple">
              Quer ter a EXA no seu prédio?
            </h2>
            <p className="font-poppins text-lg text-gray-600">
              Entre em contato conosco e descubra como modernizar a comunicação do seu condomínio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <ExaCTA variant="primary" size="lg" to="/contato">
                Solicitar Visita
              </ExaCTA>
              <ExaCTA variant="outline" size="lg" href="https://wa.me/5545999999999">
                Falar no WhatsApp
              </ExaCTA>
            </div>
          </div>
        </div>
      </ExaSection>
    </Layout>
  );
};

export default SouSindico;
