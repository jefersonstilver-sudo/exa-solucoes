
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/paineis-landing/HeroSection';
import AboutPanelsSection from '@/components/paineis-landing/AboutPanelsSection';
import WhyItWorksSection from '@/components/paineis-landing/WhyItWorksSection';
import HowItWorksSection from '@/components/paineis-landing/HowItWorksSection';
import ExclusiveBenefitsSection from '@/components/paineis-landing/ExclusiveBenefitsSection';
import ObjectionsSection from '@/components/paineis-landing/ObjectionsSection';
import VideoGallerySection from '@/components/paineis-landing/VideoGallerySection';
import ExclusivitySection from '@/components/paineis-landing/ExclusivitySection';
import TrustSection from '@/components/paineis-landing/TrustSection';
import Protocol573040Section from '@/components/paineis-landing/Protocol573040Section';
import FinalCTASection from '@/components/paineis-landing/FinalCTASection';
import ParticleBackground from '@/components/paineis-landing/ParticleBackground';
import FloatingLogo from '@/components/paineis-landing/FloatingLogo';
import ScrollProgressBar from '@/components/paineis-landing/ScrollProgressBar';

const PaineisPublicitarios = () => {
  console.log('PaineisPublicitarios: Iniciando página reconstruída');

  useEffect(() => {
    console.log('PaineisPublicitarios: Página montada com sucesso');
    // Scroll suave para toda a página
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Cleanup
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <Layout>
      {/* Background com partículas */}
      <ParticleBackground />
      
      {/* Logo flutuante 3D */}
      <FloatingLogo />
      
      {/* Barra de progresso do scroll */}
      <ScrollProgressBar />
      
      {/* Seções principais da landing page */}
      <div className="relative z-10">
        {/* 1. Hero - Impacto Visual Imediato */}
        <HeroSection />
        
        {/* 2. O que são os Painéis da Indexa? */}
        <AboutPanelsSection />
        
        {/* 3. Por que funciona tanto? */}
        <WhyItWorksSection />
        
        {/* 4. Como Funciona */}
        <HowItWorksSection />
        
        {/* 5. Benefícios Exclusivos */}
        <ExclusiveBenefitsSection />
        
        {/* 6. Respostas às Objeções */}
        <ObjectionsSection />
        
        {/* 7. Galeria Vídeo Pinceladas */}
        <VideoGallerySection />
        
        {/* 8. Exclusividade por segmento */}
        <ExclusivitySection />
        
        {/* 9. Quem confia já está dentro */}
        <TrustSection />
        
        {/* 10. Protocolo 573040 */}
        <Protocol573040Section />
        
        {/* 11. CTA Final */}
        <FinalCTASection />
      </div>
    </Layout>
  );
};

export default PaineisPublicitarios;
