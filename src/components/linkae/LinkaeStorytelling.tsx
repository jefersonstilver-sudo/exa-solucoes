import React from 'react';
import { TrendingUp, Users, Target, Zap, BarChart3, Calendar, MessageCircle } from 'lucide-react';

const LinkaeStorytelling: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-gray-900">
            A Dor de Todo Empresário: <br />
            <span className="text-[#FF8A80]">"Não Sei o Que Postar"</span>
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Storytelling Principal */}
            <div className="text-lg md:text-xl text-gray-700 leading-relaxed space-y-6">
              <p>
                <strong className="text-[#F57C00]">Toda sexta-feira às 17h</strong>, você senta na frente do computador com aquela sensação familiar no estômago. 
                <span className="text-gray-900 font-semibold"> "Preciso postar alguma coisa..."</span>
              </p>
              
              <p>
                Você abre o Instagram dos concorrentes, procura inspiração no Google, até pensa em contratar alguém... 
                mas no final, sempre acaba postando <span className="text-[#FF8A80] font-semibold">a mesma coisa de sempre</span>.
              </p>
              
              <p>
                <strong className="text-gray-900">E sabe o que acontece?</strong> Seus posts passam despercebidos, seus clientes não se conectam 
                com sua marca, e você continua dependendo apenas do boca a boca.
              </p>
            </div>

            {/* Método T.A.C.C.O.H. */}
            <div className="bg-gray-50 rounded-2xl p-8 mt-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                Nosso Método T.A.C.C.O.H. Resolve Isso Definitivamente
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="flex items-start">
                  <Target className="w-5 h-5 text-[#F57C00] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Targeting Inteligente</h4>
                    <p className="text-gray-600 text-sm">Identificamos exatamente quem é seu cliente</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <BarChart3 className="w-5 h-5 text-[#FF8A80] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Análise Comportamental</h4>
                    <p className="text-gray-600 text-sm">Estudamos o que faz seu público parar o scroll</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Zap className="w-5 h-5 text-[#F57C00] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Criatividade Direcionada</h4>
                    <p className="text-gray-600 text-sm">Conteúdo que gera resultado, não só engajamento</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MessageCircle className="w-5 h-5 text-[#FF8A80] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Otimização Contínua</h4>
                    <p className="text-gray-600 text-sm">Ajustamos com base nos resultados reais</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkaeStorytelling;