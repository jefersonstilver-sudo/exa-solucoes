import React from 'react';
import { Heart, TrendingUp, Users, Lightbulb, Target, Zap } from 'lucide-react';

const LinkaeStorytelling: React.FC = () => {
  return (
    <section className="h-[80vh] flex items-center justify-center bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 text-gray-900">
            A Dor de Todo Empresário: <br />
            <span className="text-[#FF8A80]">"Não Sei o Que Postar"</span>
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-8 text-lg md:text-xl text-gray-700 leading-relaxed">
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
            
            <div className="bg-gradient-to-r from-[#FF8A80]/10 to-[#F57C00]/10 rounded-2xl p-8 mt-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Nosso Método T.A.C.C.O.H. Resolve Isso Definitivamente
              </h3>
              <p className="text-lg text-gray-700">
                <strong className="text-[#F57C00]">Transformamos</strong> sua dor em oportunidade com planejamento estratégico, 
                <strong className="text-[#FF8A80]"> criatividade direcionada</strong> e conteúdo que realmente vende.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkaeStorytelling;