import React, { useEffect, useRef } from 'react';
import LinkaeHero from '@/components/linkae/LinkaeHero';
import LinkaeStorytelling from '@/components/linkae/LinkaeStorytelling';
import Layout from '@/components/layout/Layout';
import LinkaeDeliverables from '@/components/linkae/LinkaeDeliverables';
import LinkaeHowItWorks from '@/components/linkae/LinkaeHowItWorks';
import LinkaeWhy from '@/components/linkae/LinkaeWhy';
import LinkaeFinalCTA from '@/components/linkae/LinkaeFinalCTA';

const Linkae = () => {
  console.log('📱 LINKAÊ: Inicializando página Social Media com tema claro');
  
  const formRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Basic SEO for this page
    const prevTitle = document.title;
    document.title = 'Sobre a Linkaê | Social Media estratégica da Indexa';

    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', 'Linkaê by Indexa: social media estratégica, tráfego pago, vídeos, storytelling e marca para sua empresa crescer sem enrolação.');
    if (!metaDesc.parentNode) document.head.appendChild(metaDesc);

    const linkCanonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    linkCanonical.setAttribute('href', window.location.href);
    if (!linkCanonical.parentNode) document.head.appendChild(linkCanonical);

    return () => {
      document.title = prevTitle;
    };
  }, []);

  const scrollToForm = () => {
    console.log('📱 LINKAÊ: Scroll para formulário');
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white text-gray-900">
        <LinkaeHero onScrollToForm={scrollToForm} />
        <main>
          <LinkaeStorytelling />
          <LinkaeDeliverables />
          <LinkaeHowItWorks />
          <LinkaeWhy />
          <LinkaeFinalCTA />
        </main>
      </div>
    </Layout>
  );
};

export default Linkae;
