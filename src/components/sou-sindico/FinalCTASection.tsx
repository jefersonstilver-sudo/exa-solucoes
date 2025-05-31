
import React from 'react';
import { Building2 } from 'lucide-react';

interface FinalCTASectionProps {
  isVisible: boolean;
}

const FinalCTASection: React.FC<FinalCTASectionProps> = ({ isVisible }) => {
  console.log('🏢 SindicoFinalCTA: Renderizando SEM footer próprio');
  
  return (
    <section className={`py-20 px-4 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Modernize seu prédio com tecnologia + WhatsApp.
          </span>
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Preencha o formulário e nossa equipe entrará em contato via WhatsApp.
        </p>
        
        <div className="mt-16 pt-8 border-t border-gray-700">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              INDEXA MÍDIA
            </span>
          </div>
          {/* REMOVIDO: Copyright - apenas o footer principal do Layout deve ter */}
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
