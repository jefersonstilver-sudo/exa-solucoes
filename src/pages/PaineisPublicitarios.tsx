
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/paineis-landing/HeroSection';
import AboutPanelsSection from '@/components/paineis-landing/AboutPanelsSection';
import WhyItWorksSection from '@/components/paineis-landing/WhyItWorksSection';
import HowItWorksSection from '@/components/paineis-landing/HowItWorksSection';
import ExclusiveBenefitsSection from '@/components/paineis-landing/ExclusiveBenefitsSection';
import VideoGallerySection from '@/components/paineis-landing/VideoGallerySection';
import QRCodeTrackingSection from '@/components/paineis-landing/QRCodeTrackingSection';
import FAQSection from '@/components/paineis-landing/FAQSection';
import FinalCTASection from '@/components/paineis-landing/FinalCTASection';
import ParticleBackground from '@/components/paineis-landing/ParticleBackground';
import FloatingLogo from '@/components/paineis-landing/FloatingLogo';
import ScrollProgressBar from '@/components/paineis-landing/ScrollProgressBar';

const PaineisPublicitarios = () => {
  console.log('PaineisPublicitarios: Página atualizada com melhorias implementadas');

  useEffect(() => {
    console.log('PaineisPublicitarios: Página reorganizada - FAQ movido para final');
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
      
      {/* Seções principais da landing page - REORGANIZADA */}
      <div className="relative z-10">
        {/* 1. Hero - Vídeo ajustado e botão embaixo */}
        <HeroSection />
        
        {/* 2. O que são os Painéis - Cores uniformizadas e descrição melhorada */}
        <AboutPanelsSection />
        
        {/* 3. Por que funciona tanto? */}
        <WhyItWorksSection />
        
        {/* 4. Como Funciona */}
        <HowItWorksSection />
        
        {/* 5. Benefícios Exclusivos */}
        <ExclusiveBenefitsSection />
        
        {/* 6. Galeria Vídeo Pinceladas */}
        <VideoGallerySection />
        
        {/* 7. Rastreabilidade QR Code */}
        <QRCodeTrackingSection />
        
        {/* 8. FAQ Expansível - MOVIDO PARA FINAL */}
        <FAQSection />
        
        {/* 9. CTA Final - Botão corrigido */}
        <FinalCTASection />
      </div>
    </Layout>
  );
};

export default PaineisPublicitarios;
