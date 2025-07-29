import React from 'react';
import { Building2, ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SouSindicoLinkSection: React.FC = () => {
  const navigate = useNavigate();

  const handleSindicoClick = () => {
    navigate('/sou-sindico');
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl border border-white/20 p-6 sm:p-8 lg:p-12 text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
          </div>
          
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
            Você é <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Síndico</span>?
          </h2>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
            Descubra como <strong>modernizar seu prédio</strong> e gerar receita extra com painéis digitais EXA.
            Sem custos para o condomínio, apenas benefícios.
          </p>
          
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex items-center justify-center text-green-300 text-sm sm:text-base">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span>Receita Extra para o Condomínio</span>
            </div>
            <div className="flex items-center justify-center text-blue-300 text-sm sm:text-base">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span>Modernização Gratuita</span>
            </div>
            <div className="flex items-center justify-center text-purple-300 text-sm sm:text-base">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span>Valorização do Imóvel</span>
            </div>
          </div>
          
          <button
            onClick={handleSindicoClick}
            className="group bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-sm sm:text-base lg:text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto"
          >
            <span className="flex items-center justify-center">
              <span>Ver Como Modernizar Meu Prédio</span>
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </button>
          
          <p className="text-xs sm:text-sm text-gray-400 mt-3 sm:mt-4 leading-relaxed">
            ✨ Consulta gratuita • 🏢 Sem compromisso • 📈 Resultados comprovados
          </p>
        </div>
      </div>
    </section>
  );
};

export default SouSindicoLinkSection;