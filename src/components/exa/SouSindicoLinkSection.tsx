import React from 'react';
import { Building2, ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SouSindicoLinkSection: React.FC = () => {
  const navigate = useNavigate();

  const handleSindicoClick = () => {
    navigate('/sou-sindico');
  };

  return (
    <section className="py-16 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl border border-white/20 p-8 md:p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Você é <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Síndico</span>?
          </h2>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Descubra como <strong>modernizar seu prédio</strong> e gerar receita extra com painéis digitais EXA.
            Sem custos para o condomínio, apenas benefícios.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center text-green-300">
              <Star className="h-5 w-5 mr-2" />
              <span>Receita Extra para o Condomínio</span>
            </div>
            <div className="flex items-center text-blue-300">
              <Star className="h-5 w-5 mr-2" />
              <span>Modernização Gratuita</span>
            </div>
            <div className="flex items-center text-purple-300">
              <Star className="h-5 w-5 mr-2" />
              <span>Valorização do Imóvel</span>
            </div>
          </div>
          
          <button
            onClick={handleSindicoClick}
            className="group bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold py-4 px-8 rounded-full text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            <span className="flex items-center justify-center">
              Ver Como Modernizar Meu Prédio
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </button>
          
          <p className="text-sm text-gray-400 mt-4">
            ✨ Consulta gratuita • 🏢 Sem compromisso • 📈 Resultados comprovados
          </p>
        </div>
      </div>
    </section>
  );
};

export default SouSindicoLinkSection;