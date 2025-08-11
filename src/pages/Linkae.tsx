import React, { useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import LinkaeHeroNew from '@/components/linkae-new/LinkaeHeroNew';
import LinkaeSolutionSection from '@/components/linkae-new/LinkaeSolutionSection';
import CTAFormSection from '@/components/linkae-new/CTAFormSection';

const Linkae = () => {
  const formRef = useRef<HTMLElement>(null);

  // SEO básico sem dependências externas
  useEffect(() => {
    document.title = 'LinkAE: Ideias e calendário de conteúdo | Indexa';

    const desc = 'Acabe com o “não sei o que postar”. A LinkAE cria seu calendário inteligente com ideias, artes e legendas prontas — toda semana.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    if (meta) meta.setAttribute('content', desc);

    const linkRelCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const canonicalHref = `${window.location.origin}/linkae`;
    if (!linkRelCanonical) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonicalHref);
      document.head.appendChild(link);
    } else {
      linkRelCanonical.setAttribute('href', canonicalHref);
    }
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout>
      <main className="min-h-screen bg-white text-gray-900">
        <LinkaeHeroNew onScrollToForm={scrollToForm} />
        <LinkaeSolutionSection />
        <CTAFormSection formRef={formRef} />
      </main>
    </Layout>
  );
};

export default Linkae;
