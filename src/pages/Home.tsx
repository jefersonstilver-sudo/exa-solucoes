import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { organizationSchema, webSiteSchema, createBreadcrumbSchema, createFAQSchema, homeFAQs } from '@/components/seo/schemas';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import AdminAccessButton from '@/components/admin/AdminAccessButton';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userProfile, hasRole, isLoading } = useAuth();
  
  // INDEXA: Verificação super admin baseada APENAS em JWT claims
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const isRegularAdmin = hasRole('admin') && !isSuperAdmin;

  // REDIRECIONAMENTO AUTOMÁTICO PARA SUPER ADMIN - IMEDIATO
  useEffect(() => {
    // Só executa se não estiver carregando e o usuário estiver logado
    if (!isLoading && isLoggedIn && isSuperAdmin) {
      console.log('🚀 INDEXA HOME: Super admin detectado - Redirecionamento IMEDIATO para /super_admin');
      
      // Redirecionamento IMEDIATO sem delay nem toast
      navigate('/super_admin', { replace: true });
    }
  }, [isLoading, isLoggedIn, isSuperAdmin, navigate]);

  console.log('🔧 INDEXA Home - Estado baseado em JWT:', {
    userEmail: userProfile?.email,
    userRole: userProfile?.role,
    isSuperAdmin,
    isRegularAdmin,
    isLoggedIn,
    isLoading
  });

  // Mostrar loading apenas durante carregamento inicial
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9C1E1E] mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Se é super admin, não renderiza nada (vai ser redirecionado)
  if (isLoggedIn && isSuperAdmin) {
    return null;
  }

  return (
    <Layout>
      <SEO
        title="Painéis Digitais para Elevadores em Foz do Iguaçu | EXA Publicidade Inteligente"
        description="Anuncie em painéis digitais HD de 21&quot; nos elevadores de Foz do Iguaçu. Alcance milhares de pessoas diariamente com mídia indoor de alto impacto. Planos a partir de R$297/mês. Instalação gratuita para síndicos."
        keywords="painel digital elevador foz iguaçu, publicidade elevador, mídia indoor, anúncio prédio residencial, outdoor digital, marketing condomínio, painéis publicitários digitais"
        canonical="https://exa.com.br/"
        ogImage="https://exa.com.br/og-home.jpg"
        structuredData={[
          organizationSchema,
          webSiteSchema,
          createBreadcrumbSchema([
            { name: 'Início', url: 'https://exa.com.br/' }
          ]),
          createFAQSchema(homeFAQs)
        ]}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 leading-tight">
                Sua mídia digital em{' '}
                <span className="bg-gradient-to-r from-[#9C1E1E] to-[#180A0A] bg-clip-text text-transparent">
                  painéis de alto impacto
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Conectando marcas e audiências com tecnologia e performance. <a href="/comparativo-outdoor" className="text-[#9C1E1E] hover:underline font-semibold">Veja por que somos 5x mais eficientes que outdoors tradicionais</a>.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-16">
                <Button
                  onClick={() => navigate('/loja')}
                  size="lg"
                  className="bg-gradient-to-r from-[#9C1E1E] to-[#180A0A] hover:from-[#D72638] hover:to-[#9C1E1E] text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  Começar agora
                </Button>
                <Button
                  onClick={() => navigate('/planos')}
                  variant="outline"
                  size="lg"
                  className="border-2 border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E] hover:text-white px-8 py-4 text-lg font-semibold transition-all duration-300"
                >
                  Ver planos
                </Button>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-[#9C1E1E] to-[#180A0A] rounded-full flex items-center justify-center mb-6 mx-auto">
                    <span className="text-white text-2xl font-bold">🎯</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Alto Impacto</h3>
                  <p className="text-gray-600">Painéis estrategicamente posicionados para máxima visibilidade. <a href="/loja" className="text-[#9C1E1E] hover:underline">Veja os prédios disponíveis</a>.</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-[#9C1E1E] to-[#180A0A] rounded-full flex items-center justify-center mb-6 mx-auto">
                    <span className="text-white text-2xl font-bold">📊</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Performance</h3>
                  <p className="text-gray-600">Métricas em tempo real para otimizar suas campanhas. <a href="/sou-sindico" className="text-[#9C1E1E] hover:underline">Síndicos, saiba mais sobre como funciona</a>.</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-[#9C1E1E] to-[#180A0A] rounded-full flex items-center justify-center mb-6 mx-auto">
                    <span className="text-white text-2xl font-bold">🚀</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Tecnologia</h3>
                  <p className="text-gray-600">Plataforma moderna e intuitiva para gestão completa</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Access Section */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              {/* Login access for non-logged users */}
              {!isLoggedIn && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-8"
                >
                  <h3 className="text-2xl font-semibold mb-4 text-gray-900">Já tem uma conta?</h3>
                  <p className="text-gray-600 mb-6">Acesse sua conta para gerenciar suas campanhas</p>
                  <Button
                    onClick={() => navigate('/login')}
                    variant="outline"
                    size="lg"
                    className="border-2 border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E] hover:text-white px-8 py-3"
                  >
                    Fazer Login
                  </Button>
                </motion.div>
              )}
              
              {/* INDEXA: AdminAccessButton unificado baseado em JWT - apenas para admins regulares */}
              {isLoggedIn && isRegularAdmin && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-2xl font-semibold mb-4 text-gray-900">Acesso Administrativo</h3>
                  <p className="text-gray-600 mb-6">Gerencie o sistema como administrador</p>
                  <AdminAccessButton />
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Home;
