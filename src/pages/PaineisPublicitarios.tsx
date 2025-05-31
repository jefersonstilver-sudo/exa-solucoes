
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

const PaineisPublicitarios = () => {
  console.log('PaineisPublicitarios: Página refatorada para melhor responsividade');

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.overflowX = 'auto';
      document.documentElement.style.overflowX = 'auto';
    };
  }, []);

  return (
    <Layout>
      <div className="relative overflow-x-hidden w-full">
        <HeroSection />
        <AboutPanelsSection />
        <WhyItWorksSection />
        <HowItWorksSection />
        <ExclusiveBenefitsSection />
        <VideoGallerySection />
        <QRCodeTrackingSection />
        <FAQSection />
        <FinalCTASection />
      </div>
    </Layout>
  );
};

export default PaineisPublicitarios;
