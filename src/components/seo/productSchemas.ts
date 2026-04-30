// Product Schemas for EXA Plans

export const planoEssencialSchema = {
  "@type": "Product",
  "name": "Plano Essencial - Anúncio em 1 Prédio",
  "description": "Publicidade em painel digital 21\" em 1 prédio premium de Foz do Iguaçu. 502 exibições por dia · 15.060 por mês por painel, com taxa de visualização de 95%.",
  "brand": {
    "@type": "Brand",
    "name": "EXA Publicidade Inteligente"
  },
  "offers": {
    "@type": "Offer",
    "price": "297",
    "priceCurrency": "BRL",
    "availability": "https://schema.org/InStock",
    "url": "https://www.examidia.com.br/loja?plano=1",
    "priceValidUntil": "2025-12-31",
    "seller": {
      "@id": "https://www.examidia.com.br/#organization"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "34"
  }
};

export const planoExpansaoSchema = {
  "@type": "Product",
  "name": "Plano Expansão - Anúncio em 3 Prédios",
  "description": "Publicidade em painéis digitais 21\" em 3 prédios premium de Foz do Iguaçu. 502 exibições por dia · 15.060 por mês em cada painel.",
  "brand": {
    "@type": "Brand",
    "name": "EXA Publicidade Inteligente"
  },
  "offers": {
    "@type": "Offer",
    "price": "697",
    "priceCurrency": "BRL",
    "availability": "https://schema.org/InStock",
    "url": "https://www.examidia.com.br/loja?plano=3",
    "priceValidUntil": "2025-12-31",
    "seller": {
      "@id": "https://www.examidia.com.br/#organization"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "56"
  }
};

export const planoPremiumSchema = {
  "@type": "Product",
  "name": "Plano Premium - Anúncio em 6 Prédios",
  "description": "Publicidade em painéis digitais 21\" em 6 prédios premium de Foz do Iguaçu. 502 exibições por dia · 15.060 por mês em cada painel.",
  "brand": {
    "@type": "Brand",
    "name": "EXA Publicidade Inteligente"
  },
  "offers": {
    "@type": "Offer",
    "price": "1297",
    "priceCurrency": "BRL",
    "availability": "https://schema.org/InStock",
    "url": "https://www.examidia.com.br/loja?plano=6",
    "priceValidUntil": "2025-12-31",
    "seller": {
      "@id": "https://www.examidia.com.br/#organization"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "78"
  }
};

export const planoDominioSchema = {
  "@type": "Product",
  "name": "Plano Domínio - Anúncio em 12 Prédios",
  "description": "Publicidade em painéis digitais 21\" em 12 prédios premium de Foz do Iguaçu. 502 exibições por dia · 15.060 por mês em cada painel.",
  "brand": {
    "@type": "Brand",
    "name": "EXA Publicidade Inteligente"
  },
  "offers": {
    "@type": "Offer",
    "price": "2397",
    "priceCurrency": "BRL",
    "availability": "https://schema.org/InStock",
    "url": "https://www.examidia.com.br/loja?plano=12",
    "priceValidUntil": "2025-12-31",
    "seller": {
      "@id": "https://www.examidia.com.br/#organization"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5.0",
    "reviewCount": "42"
  }
};

export const heroVideoSchema = {
  "@type": "VideoObject",
  "name": "Como Funciona a EXA - Publicidade em Painéis Digitais de Elevadores",
  "description": "Veja como nossos painéis digitais 21\" transformam elevadores em mídia premium. Alcance público de alto padrão com 95% de taxa de visualização em Foz do Iguaçu.",
  "thumbnailUrl": "https://www.examidia.com.br/android-chrome-512x512.png",
  "uploadDate": "2025-01-20",
  "duration": "PT1M45S",
  "contentUrl": "https://indexa.net.br/wp-content/uploads/2025/01/indexa_exa.mp4",
  "embedUrl": "https://www.examidia.com.br/",
  "publisher": {
    "@id": "https://www.examidia.com.br/#organization"
  }
};
