import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { organizationSchema, createBreadcrumbSchema } from '@/components/seo/schemas';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, ArrowRight } from 'lucide-react';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
}

const blogPosts: BlogPost[] = [
  {
    slug: 'case-sucesso-academia',
    title: 'Case: Como Academia Local Cresceu 300% com Painéis em Elevadores',
    excerpt: 'História real de uma academia que investiu R$ 800 e conquistou 64 novos alunos em 60 dias. ROI de 4.700%. Estratégias replicáveis.',
    date: '2025-01-24',
    category: 'Case de Sucesso',
    readTime: '14 min'
  },
  {
    slug: 'erros-anunciar-condominios',
    title: '10 Erros Fatais ao Anunciar em Condomínios',
    excerpt: 'Descubra os 10 erros que destroem campanhas em elevadores e como evitá-los. Multiplique seu ROI em 300-500%.',
    date: '2025-01-23',
    category: 'Estratégia',
    readTime: '18 min'
  },
  {
    slug: 'calcular-roi-elevadores',
    title: 'Como Calcular ROI de Publicidade em Elevadores',
    excerpt: 'Aprenda fórmulas práticas, benchmarks reais e estratégias para maximizar retorno. Calculadora interativa incluída.',
    date: '2025-01-22',
    category: 'ROI & Performance',
    readTime: '12 min'
  },
  {
    slug: 'midia-indoor-vs-outdoor',
    title: 'Mídia Indoor vs Outdoor: Guia Completo Para Escolher',
    excerpt: 'Comparação detalhada: custos, ROI, casos de uso. Tabela comparativa completa + estratégia híbrida recomendada.',
    date: '2025-01-21',
    category: 'Comparativos',
    readTime: '15 min'
  },
  {
    slug: 'publicidade-elevadores-roi',
    title: '5 Motivos Para Anunciar em Elevadores: ROI Comprovado',
    excerpt: 'Descubra por que anúncios em elevadores geram até 500% de ROI. Dados reais e estratégias comprovadas.',
    date: '2025-01-20',
    category: 'ROI & Performance',
    readTime: '8 min'
  }
];

const BlogIndex = () => {
  return (
    <Layout>
      <SEO
        title="Blog EXA - Guias e Estratégias de Publicidade em Painéis Digitais"
        description="Aprenda as melhores práticas de publicidade em elevadores, estratégias de ROI, tendências de mídia indoor e como maximizar seus resultados com painéis digitais."
        keywords="blog publicidade digital, estratégias mídia indoor, ROI publicidade elevador, tendências DOOH, guia anúncio prédio"
        canonical="https://www.examidia.com.br/blog"
        structuredData={[
          organizationSchema,
          createBreadcrumbSchema([
            { name: 'Início', url: 'https://www.examidia.com.br/' },
            { name: 'Blog', url: 'https://www.examidia.com.br/blog' }
          ])
        ]}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-4 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          {/* Hero do Blog */}
          <header className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-exa-purple to-exa-purple-dark bg-clip-text text-transparent">
              Blog EXA
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Estratégias, insights e guias completos para maximizar seus resultados com publicidade em painéis digitais
            </p>
          </header>

          {/* Grid de Posts */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link 
                key={post.slug} 
                to={`/blog/${post.slug}`}
                className="group"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-white">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-exa-mint/20 text-exa-purple">
                        {post.category}
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-exa-purple transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(post.date).toLocaleDateString('pt-BR')}
                      </div>
                      <span>{post.readTime}</span>
                    </div>

                    <div className="flex items-center text-exa-purple font-semibold group-hover:translate-x-2 transition-transform">
                      Ler artigo
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* CTA Final */}
          <div className="mt-16 text-center p-8 bg-gradient-to-r from-exa-purple to-exa-purple-dark rounded-2xl text-white">
            <h2 className="text-3xl font-bold mb-4">
              Pronto para começar sua campanha?
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Explore nossos planos e encontre o ideal para seu negócio
            </p>
            <Link 
              to="/loja"
              className="inline-block px-8 py-3 bg-exa-mint text-exa-purple-dark font-semibold rounded-lg hover:bg-exa-mint-dark transition-colors"
            >
              Ver Planos Disponíveis
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BlogIndex;
