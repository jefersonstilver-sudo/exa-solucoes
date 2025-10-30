// Schema.org structured data templates

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "LocalBusiness"],
  "@id": "https://exa.com.br/#organization",
  "name": "EXA Publicidade Inteligente",
  "legalName": "EXA Mídia Digital LTDA",
  "alternateName": ["EXA", "EXA Publicidade", "EXA Digital"],
  "description": "Líder em publicidade inteligente em elevadores de Foz do Iguaçu",
  "url": "https://exa.com.br",
  "logo": "https://exa.com.br/logo.png",
  "image": [
    "https://exa.com.br/painel-elevador.jpg",
    "https://exa.com.br/instalacao-predio.jpg"
  ],
  "telephone": "+55 45 3027-1234",
  "email": "contato@exa.com.br",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Av. Brasil, 1234",
    "addressLocality": "Foz do Iguaçu",
    "addressRegion": "PR",
    "postalCode": "85851-000",
    "addressCountry": "BR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "-25.5163",
    "longitude": "-54.5854"
  },
  "areaServed": {
    "@type": "GeoCircle",
    "geoMidpoint": {
      "@type": "GeoCoordinates",
      "latitude": "-25.5163",
      "longitude": "-54.5854"
    },
    "geoRadius": "50000"
  },
  "priceRange": "R$297 - R$1997",
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "opens": "08:00",
    "closes": "17:00"
  },
  "sameAs": [
    "https://instagram.com/exapublicidade",
    "https://facebook.com/exapublicidade",
    "https://linkedin.com/company/exa"
  ]
};

export const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://exa.com.br/#website",
  "url": "https://exa.com.br",
  "name": "EXA Publicidade Inteligente",
  "publisher": {
    "@id": "https://exa.com.br/#organization"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://exa.com.br/busca?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export const createBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const createFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

export const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Publicidade em Painéis Digitais",
  "provider": { "@id": "https://exa.com.br/#organization" },
  "areaServed": "Foz do Iguaçu, PR, Brasil",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Planos de Publicidade EXA",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Plano Mensal - 1 Prédio",
          "description": "Anúncios em painel digital de 1 prédio premium"
        },
        "price": "297",
        "priceCurrency": "BRL",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Plano Trimestral - 3 Prédios",
          "description": "Anúncios em painéis digitais de 3 prédios premium"
        },
        "price": "697",
        "priceCurrency": "BRL",
        "availability": "https://schema.org/InStock"
      }
    ]
  }
};

export const homeFAQs = [
  {
    question: "Quanto custa anunciar em painéis digitais de elevadores em Foz do Iguaçu?",
    answer: "Os planos da EXA começam em R$297/mês para 1 prédio. Oferecemos pacotes de 1, 3, 5, 10 ou 20+ prédios com descontos progressivos. Teste grátis por 30 dias."
  },
  {
    question: "Como funciona a publicidade em elevadores?",
    answer: "Instalamos painéis digitais 21 polegadas HD nos elevadores de prédios premium. Seus anúncios são exibidos automaticamente durante todo o dia, alcançando milhares de moradores em momentos de atenção exclusiva."
  },
  {
    question: "Quais são os benefícios de anunciar em elevadores?",
    answer: "Alta taxa de visualização (95%), público de alta renda, audiência cativa durante 20-60 segundos, repetição diária, segmentação por perfil de prédio e rastreamento em tempo real."
  },
  {
    question: "O painel digital é realmente gratuito para síndicos?",
    answer: "Sim! Fornecemos, instalamos e mantemos o painel 21 polegadas sem nenhum custo para o condomínio. Você moderniza a comunicação e ainda pode gerar receita com anúncios locais."
  },
  {
    question: "Quais tipos de empresas anunciam em elevadores?",
    answer: "Imobiliárias, academias, restaurantes, clínicas médicas, pet shops, escolas, mercados, salões de beleza e qualquer negócio que queira alcançar moradores de prédios premium."
  }
];

export const sindicoFAQs = [
  {
    question: "O painel digital é realmente gratuito para o condomínio?",
    answer: "Sim! A EXA fornece, instala e mantém o painel digital 21 polegadas sem nenhum custo para o condomínio. Não há taxa de instalação, mensalidade ou manutenção."
  },
  {
    question: "Como funciona a instalação do painel?",
    answer: "Nossa equipe técnica agenda e realiza a instalação completa em até 48 horas. O painel é fixado de forma segura e profissional, sem danos ao elevador."
  },
  {
    question: "O condomínio pode escolher o que aparece no painel?",
    answer: "Sim! O síndico tem controle total sobre avisos e comunicados do condomínio, que aparecem intercalados com anúncios comerciais. Gerenciamento simples via WhatsApp ou plataforma web."
  },
  {
    question: "Qual o tamanho e consumo de energia do painel?",
    answer: "O painel tem 21 polegadas, tela HD e consumo de apenas 15W (menos que uma lâmpada LED). Design elegante que valoriza o ambiente do elevador."
  },
  {
    question: "O que acontece se o painel apresentar defeito?",
    answer: "A EXA é responsável por toda manutenção e reparos, sem custo para o condomínio. Garantia total e suporte técnico em até 24 horas."
  }
];

export const lojaFAQs = [
  {
    question: "Qual o alcance mensal de um painel em 1 prédio?",
    answer: "Em média, cada painel alcança 300-500 moradores mensalmente, com taxa de visualização de 95%. Cada morador vê seu anúncio múltiplas vezes ao dia."
  },
  {
    question: "Posso escolher em quais prédios anunciar?",
    answer: "Sim! Você seleciona os prédios por localização, perfil de moradores e características. Temos prédios em todas as regiões de Foz do Iguaçu."
  },
  {
    question: "Como funciona a criação do anúncio?",
    answer: "Você pode enviar seu material pronto ou usar nosso serviço de criação profissional (incluso nos planos). Formatos aceitos: imagem ou vídeo até 30 segundos."
  },
  {
    question: "Posso cancelar ou pausar minha campanha?",
    answer: "Sim! Flexibilidade total. Cancele ou pause a qualquer momento sem multas. Planos mensais sem fidelidade."
  },
  {
    question: "Como acompanho os resultados?",
    answer: "Painel de controle em tempo real mostrando impressões, horários de pico, performance por prédio e métricas de engajamento. Relatórios semanais por email."
  }
];
