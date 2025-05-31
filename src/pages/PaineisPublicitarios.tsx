
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/paineis-landing/HeroSection';
import AboutPanelsSection from '@/components/paineis-landing/AboutPanelsSection';
import WhyItWorksSection from '@/components/paineis-landing/WhyItWorksSection';
import HowItWorksSection from '@/components/paineis-landing/HowItWorksSection';
import ExclusiveBenefitsSection from '@/components/paineis-landing/ExclusiveBenefitsSection';
import FAQSection from '@/components/paineis-landing/FAQSection';
import VideoGallerySection from '@/components/paineis-landing/VideoGallerySection';
import QRCodeTrackingSection from '@/components/paineis-landing/QRCodeTrackingSection';
import TrustSection from '@/components/paineis-landing/TrustSection';
import FinalCTASection from '@/components/paineis-landing/FinalCTASection';
import ParticleBackground from '@/components/paineis-landing/ParticleBackground';
import FloatingLogo from '@/components/paineis-landing/FloatingLogo';
import ScrollProgressBar from '@/components/paineis-landing/ScrollProgressBar';

const PaineisPublicitarios = () => {
  console.log('PaineisPublicitarios: Iniciando página com todas as melhorias aplicadas');

  useEffect(() => {
    console.log('PaineisPublicitarios: Página montada com todas as novas features');
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
        {/* 1. Hero - Vídeo maior e botão de fullscreen */}
        <HeroSection />
        
        {/* 2. O que são os Painéis - Cores das imagens aplicadas */}
        <AboutPanelsSection />
        
        {/* 3. Por que funciona tanto? */}
        <WhyItWorksSection />
        
        {/* 4. Como Funciona */}
        <HowItWorksSection />
        
        {/* 5. Benefícios Exclusivos - Protocolo removido */}
        <ExclusiveBenefitsSection />
        
        {/* 6. FAQ Expansível - 10 perguntas frequentes */}
        <FAQSection />
        
        {/* 7. Galeria Vídeo Pinceladas */}
        <VideoGallerySection />
        
        {/* 8. Rastreabilidade QR Code - Nova seção */}
        <QRCodeTrackingSection />
        
        {/* 9. Quem confia já está dentro */}
        <TrustSection />
        
        {/* 10. CTA Final - Sem urgência artificial */}
        <FinalCTASection />
      </div>
    </Layout>
  );
};

export default PaineisPublicitarios;
