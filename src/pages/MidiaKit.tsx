import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';

const MidiaKit = () => {
  return (
    <Layout className="bg-gradient-to-br from-black via-gray-900 to-black">
      <SEO
        title="Mídia Kit | EXA Soluções Digitais"
        description="Conheça nosso portfólio completo, números e diferenciais. Baixe nosso mídia kit e descubra como a EXA pode transformar sua estratégia de publicidade digital."
        keywords="mídia kit, portfólio EXA, publicidade digital, dados EXA, números EXA"
        canonical="https://www.examidia.com.br/midia-kit"
        ogType="website"
        ogImage="https://www.examidia.com.br/og-image.png"
      />

      <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <Link to="/quem-somos">
              <Button
                variant="ghost"
                className="text-white hover:text-exa-yellow hover:bg-white/10 mb-6 group"
              >
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Voltar para Quem Somos
              </Button>
            </Link>

            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-exa-yellow/20 to-red-500/20 px-4 py-2 rounded-full border border-exa-yellow/30"
              >
                <FileText className="h-5 w-5 text-exa-yellow" />
                <span className="text-white font-medium">Mídia Kit Oficial</span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-exa-yellow to-red-500 bg-clip-text text-transparent">
                Conheça a EXA em Números
              </h1>
              
              <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto">
                Explore nosso portfólio completo, alcance, diferenciais e cases de sucesso. 
                Descubra por que somos líderes em mídia digital indoor.
              </p>
            </div>
          </motion.div>

          {/* Embed do Canva com design melhorado */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-r from-exa-yellow/10 via-red-500/10 to-purple-500/10 rounded-2xl blur-3xl -z-10" />
            
            {/* Main container */}
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-8 shadow-2xl">
              {/* Iframe wrapper */}
              <div className="relative w-full overflow-hidden rounded-xl shadow-2xl bg-black/20"
                   style={{ 
                     paddingTop: '56.25%', // 16:9 aspect ratio
                     height: 0 
                   }}>
                <iframe
                  loading="lazy"
                  className="absolute top-0 left-0 w-full h-full border-0"
                  src="https://www.canva.com/design/DAG3SayUelg/Ix2U8fPwsre1fPVeb7Q1Lw/view?embed"
                  allowFullScreen
                  allow="fullscreen"
                  title="EXA Mídia Kit"
                />
              </div>

              {/* Download button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <a
                  href="https://www.canva.com/design/DAG3SayUelg/Ix2U8fPwsre1fPVeb7Q1Lw/view?utm_content=DAG3SayUelg&utm_campaign=designshare&utm_medium=embeds&utm_source=link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-exa-yellow to-red-500 hover:from-exa-yellow/90 hover:to-red-500/90 text-black font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Download className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                    Abrir Mídia Kit Completo
                  </Button>
                </a>

                <div className="flex items-center space-x-2 text-gray-400 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>Desenvolvido no Canva</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Features grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: 'Alcance Real',
                description: 'Dados atualizados sobre nosso alcance e público impactado',
                icon: '📊'
              },
              {
                title: 'Cases de Sucesso',
                description: 'Exemplos reais de campanhas que geraram resultados',
                icon: '🎯'
              },
              {
                title: 'Diferenciais',
                description: 'Por que a EXA é a escolha certa para sua marca',
                icon: '⭐'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-16 text-center bg-gradient-to-r from-exa-yellow/10 to-red-500/10 border border-exa-yellow/20 rounded-2xl p-8 md:p-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Pronto para levar sua marca ao próximo nível?
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Entre em contato conosco e descubra como a EXA pode transformar sua estratégia de publicidade digital
            </p>
            <Link to="/contato">
              <Button
                size="lg"
                className="bg-white hover:bg-gray-100 text-black font-bold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Falar com Especialista
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default MidiaKit;
