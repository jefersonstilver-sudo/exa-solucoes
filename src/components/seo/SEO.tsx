import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  ogImageAlt?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
  nofollow?: boolean;
  structuredData?: object[];
}

const SEO: React.FC<SEOProps> = ({
  title = 'EXA | Publicidade Inteligente em Elevadores - Foz do Iguaçu',
  description = 'Transforme elevadores em mídia premium. Alcance milhares de moradores diariamente em prédios de alto padrão.',
  keywords = 'painel digital elevador, publicidade elevador foz iguaçu, mídia indoor condomínio, digital signage elevador, tela publicidade prédio',
  canonical,
  ogType = 'website',
  ogImage = 'https://examidia.com.br/og-image.jpg?v=2',
  ogImageAlt = 'EXA - Publicidade Inteligente em Elevadores',
  twitterCard = 'summary_large_image',
  noindex = false,
  nofollow = false,
  structuredData = [],
}) => {
  const siteUrl = 'https://examidia.com.br';
  const currentUrl = canonical || `${siteUrl}${window.location.pathname}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={currentUrl} />
      
      {/* Robots */}
      {(noindex || nofollow) && (
        <meta 
          name="robots" 
          content={`${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`} 
        />
      )}
      
      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:site_name" content="EXA Publicidade Inteligente" />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={ogImageAlt} />
      
      {/* Additional Meta */}
      <meta name="author" content="EXA Publicidade Inteligente" />
      <meta name="geo.region" content="BR-PR" />
      <meta name="geo.placename" content="Foz do Iguaçu" />
      <meta name="geo.position" content="-25.5163;-54.5854" />
      <meta name="ICBM" content="-25.5163, -54.5854" />
      
      {/* Structured Data */}
      {structuredData.map((schema, index) => (
        <script key={`schema-${index}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
