import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ExaForm from '@/components/exa/ExaForm';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ExaFormPage: React.FC = () => {
  const navigate = useNavigate();

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

  const handleGoBack = () => {
    navigate('/exa');
  };

  return (
    <Layout className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="min-h-screen relative overflow-x-hidden w-full">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar para EXA
            </button>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-orbitron font-black text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-600 bg-clip-text mb-6 leading-tight tracking-wide">
              Publique nos Melhores Pontos
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Conecte sua marca aos locais com maior fluxo de pessoas através da nossa rede de painéis digitais inteligentes
            </p>
          </div>

          {/* Form Container */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 p-8 md:p-12">
              <ExaForm />
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-20 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-12">
              Por que escolher a EXA?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">📍</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Localizações Premium</h4>
                <p className="text-gray-300">
                  Pontos estratégicos com alto fluxo de pessoas em condomínios e empresas
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">📊</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Analytics Completos</h4>
                <p className="text-gray-300">
                  Acompanhe o desempenho da sua campanha com métricas detalhadas
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">⚡</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Gestão Simplificada</h4>
                <p className="text-gray-300">
                  Plataforma intuitiva para gerenciar suas campanhas publicitárias
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExaFormPage;