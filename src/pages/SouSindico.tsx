import React from 'react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { organizationSchema, createFAQSchema, createBreadcrumbSchema, sindicoFAQs } from '@/components/seo/schemas';
import SindicoHeroSection from '@/components/exa/sindico/SindicoHeroSection';
import NovaComunicacaoSection from '@/components/exa/sindico/NovaComunicacaoSection';
import ComoFuncionaSection from '@/components/exa/sindico/ComoFuncionaSection';
import BeneficiosCondominioSection from '@/components/exa/sindico/BeneficiosCondominioSection';
import DesignValorizaSection from '@/components/exa/sindico/DesignValorizaSection';
import PainelInteligenteSection from '@/components/exa/sindico/PainelInteligenteSection';
import CredibilidadeSection from '@/components/exa/sindico/CredibilidadeSection';
import ExpansaoImpactoSection from '@/components/exa/sindico/ExpansaoImpactoSection';
import CTAFinalSindicoSection from '@/components/exa/sindico/CTAFinalSindicoSection';
import LogoTicker from '@/components/exa/LogoTicker';
import AnimatedBackground from '@/components/exa/sindico/AnimatedBackground';
import ExaSection from '@/components/exa/base/ExaSection';
import { Link } from 'react-router-dom';
const SouSindico = () => {
  return <Layout>
      <SEO
        title="Painel Digital GRÁTIS para Seu Condomínio | EXA Foz do Iguaçu"
        description="Síndicos de Foz: ganhe um painel digital 21&quot; GRATUITO para seu prédio. Modernize a comunicação, valorize o condomínio e ainda gere receita com anúncios. Sem custos de instalação."
        keywords="painel digital gratuito condomínio, comunicação visual síndico, modernizar condomínio foz iguaçu, painel aviso elevador grátis, tecnologia condomínio gratuita, como modernizar condomínio sem custo"
        canonical="https://exa.com.br/sou-sindico"
        ogImage="https://exa.com.br/og-sindico.jpg"
        structuredData={[
          organizationSchema,
          createBreadcrumbSchema([
            { name: 'Início', url: 'https://exa.com.br/' },
            { name: 'Sou Síndico', url: 'https://exa.com.br/sou-sindico' }
          ]),
          createFAQSchema(sindicoFAQs)
        ]}
      />
      <AnimatedBackground>
        <SindicoHeroSection />
        <NovaComunicacaoSection />
        <ComoFuncionaSection />
        <BeneficiosCondominioSection />
        <DesignValorizaSection />
        <PainelInteligenteSection />
        <CredibilidadeSection />
        <ExpansaoImpactoSection />
        
        {/* Internal Linking Section */}
        <ExaSection background="light" className="py-12">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h2 className="font-montserrat font-bold text-2xl text-[#9C1E1E]">
              Quer Saber Mais Sobre Publicidade em Elevadores?
            </h2>
            <p className="text-gray-700 font-poppins text-lg">
              Descubra <Link to="/comparativo-outdoor" className="text-[#9C1E1E] hover:underline font-semibold">por que painéis em elevadores superam outdoors tradicionais</Link> em taxa de atenção e ROI. Ou <Link to="/loja" className="text-[#9C1E1E] hover:underline font-semibold">veja os prédios disponíveis em nossa loja online</Link> e comece a anunciar hoje mesmo.
            </p>
          </div>
        </ExaSection>
        
        <CTAFinalSindicoSection />
      </AnimatedBackground>
    </Layout>;
};
export default SouSindico;