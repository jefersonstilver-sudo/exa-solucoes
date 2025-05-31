
import React from 'react';
import { Award, Star, Sparkles } from 'lucide-react';

interface ExclusiveBenefitsSectionProps {
  isVisible: boolean;
}

const ExclusiveBenefitsSection: React.FC<ExclusiveBenefitsSectionProps> = ({ isVisible }) => {
  return (
    <section className={`py-20 px-4 bg-gray-800/30 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-16">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Vantagens Exclusivas
          </span>
        </h2>
        
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-12 rounded-3xl border border-purple-500/30">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Award className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-yellow-400">Valor Agregado ao Prédio</h3>
              <p className="text-gray-300">Mais conexão com os moradores</p>
            </div>
            
            <div className="text-center">
              <Star className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Melhores Prédios Selecionados</h3>
              <p className="text-gray-300">Elevador passa a ser moderno</p>
            </div>
            
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Pré-lançamento</h3>
              <p className="text-gray-300">Benefícios garantidos para pioneiros</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExclusiveBenefitsSection;
