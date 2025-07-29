import React from 'react';
import { useNavigate } from 'react-router-dom';

const ExaFinalCTASection: React.FC = () => {
  const navigate = useNavigate();

  const handleScheduleMeeting = () => {
    navigate('/linkae');
  };

  const handleViewLocations = () => {
    navigate('/paineis-digitais/loja');
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center py-16 sm:py-20 lg:py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
      </div>

      {/* Main content container with card effect */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl drop-shadow-2xl border border-white/20 p-8 sm:p-12 lg:p-16 text-center" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)'}}>:
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-orbitron font-black text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-600 bg-clip-text mb-8 sm:mb-12 lg:mb-16 leading-tight tracking-wide drop-shadow-2xl">
            Agende uma Reunião Gratuita
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-exo-2 font-light text-slate-700 mb-12 sm:mb-16 lg:mb-20 max-w-5xl mx-auto leading-relaxed tracking-wide">
            Descubra como a EXA pode revolucionar sua estratégia de marketing para empresários de todos os portes
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <button 
              onClick={handleScheduleMeeting}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-exo-2 font-bold px-12 sm:px-14 py-6 sm:py-7 rounded-xl text-base sm:text-lg md:text-xl transition-all duration-300 hover:shadow-xl hover:scale-105 w-full sm:w-auto min-h-[72px] touch-manipulation tracking-wide shadow-2xl hover:shadow-purple-500/30"
            >
              Agendar Reunião Gratuita
            </button>
            <button 
              onClick={handleViewLocations}
              className="border-2 border-purple-400 text-purple-600 font-exo-2 font-semibold px-12 sm:px-14 py-6 sm:py-7 rounded-xl text-base sm:text-lg md:text-xl transition-all duration-300 hover:bg-purple-50 hover:shadow-xl hover:scale-105 w-full sm:w-auto min-h-[72px] touch-manipulation tracking-wide"
            >
              Ver Localizações Disponíveis
            </button>
          </div>

          <div className="text-center">
            <p className="font-exo-2 font-light text-gray-600 text-sm sm:text-base md:text-lg tracking-wide">
              Sem taxas ocultas • Analytics inclusos • Suporte dedicado
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaFinalCTASection;