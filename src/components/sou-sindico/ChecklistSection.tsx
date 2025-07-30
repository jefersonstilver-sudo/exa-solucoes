import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ChecklistSectionProps {
  isVisible: boolean;
}

const ChecklistSection: React.FC<ChecklistSectionProps> = ({ isVisible }) => {
  const requirements = [
    { id: 1, text: "Possui elevador social", description: "Necessário para instalação do painel digital" },
    { id: 2, text: "Mais de 20 unidades", description: "Tamanho mínimo para viabilidade do projeto" },
    { id: 3, text: "Síndico ativo no WhatsApp", description: "Ferramenta principal de gestão" },
    { id: 4, text: "Localizado em Foz do Iguaçu", description: "Área de atuação inicial do projeto" }
  ];

  return (
    <section className={`min-h-[60vh] py-20 px-4 bg-gray-800/50 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Seu Prédio Se Encaixa?
          </span>
        </h2>
        
        <p className="text-xl text-gray-300 mb-16">
          Verifique se seu condomínio atende aos requisitos para modernização gratuita
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {requirements.map((requirement, index) => (
            <div 
              key={requirement.id}
              className={`bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-green-500/30 transform transition-all duration-500 delay-${index * 100} hover:scale-105 hover:border-green-400/50`}
            >
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {requirement.text}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {requirement.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 p-8 bg-gradient-to-br from-green-900/30 to-blue-900/30 rounded-3xl border border-green-500/30">
          <h3 className="text-2xl font-bold text-green-400 mb-4">
            ✅ Seu prédio se encaixa perfeitamente!
          </h3>
          <p className="text-lg text-gray-300">
            Parabéns! Você está qualificado para receber a instalação gratuita dos painéis digitais.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ChecklistSection;