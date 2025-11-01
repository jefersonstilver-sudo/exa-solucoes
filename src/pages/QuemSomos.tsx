import React from 'react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import HeroQuemSomos from '@/components/exa/quem-somos/HeroQuemSomos';
import EssenciaSection from '@/components/exa/quem-somos/EssenciaSection';
import ValoresSection from '@/components/exa/quem-somos/ValoresSection';
import DadosInstitucionaisSection from '@/components/exa/quem-somos/DadosInstitucionaisSection';

const QuemSomos = () => {
  const companySchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "EXA Soluções Digitais LTDA",
    "image": "https://www.examidia.com.br/og-image.png",
    "legalName": "EXA Soluções Digitais LTDA",
    "taxID": "52.499.450/0001-60",
    "@id": "https://www.examidia.com.br",
    "url": "https://www.examidia.com.br",
    "telephone": "+554591415856",
    "email": "contato@examidia.com.br",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Avenida Paraná, 974 - Sala 301",
      "addressLocality": "Foz do Iguaçu",
      "addressRegion": "PR",
      "postalCode": "85852-000",
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "-25.5163",
      "longitude": "-54.5854"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    },
    "sameAs": [
      "https://www.instagram.com/exa.publicidade",
      "https://wa.me/554591415856"
    ],
    "description": "EXA Soluções Digitais LTDA - Publicidade inteligente em elevadores de Foz do Iguaçu. Conectamos tecnologia, informação e pessoas com comunicação não invasiva e ética."
  };

  return (
    <Layout className="bg-white">
      <SEO
        title="Quem Somos | EXA Soluções Digitais LTDA"
        description="Conheça a EXA Soluções Digitais, empresa de publicidade inteligente de Foz do Iguaçu que conecta pessoas e informação com ética, inovação e propósito."
        keywords="EXA, publicidade digital, Foz do Iguaçu, mídia indoor, Secovi Paraná, painéis digitais, publicidade em elevadores"
        canonical="https://www.examidia.com.br/quem-somos"
        ogType="website"
        ogImage="https://www.examidia.com.br/og-image.png"
        structuredData={[companySchema]}
      />
      
      <div className="w-full">
        <HeroQuemSomos />
        <EssenciaSection />
        <ValoresSection />
        <DadosInstitucionaisSection />
      </div>
    </Layout>
  );
};

export default QuemSomos;
