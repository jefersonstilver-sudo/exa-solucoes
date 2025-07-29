import React from 'react';
import { TrendingUp, Users, Target, Zap, BarChart3, Calendar, MessageCircle } from 'lucide-react';

const LinkaeStorytelling: React.FC = () => {
  return (
    <section className="h-[80vh] flex items-center justify-center bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-12 text-gray-900">
            A Dor de Todo Empresário: <br />
            <span className="text-[#FF8A80]">"Não Sei o Que Postar"</span>
          </h2>
          
          <div className="max-w-5xl mx-auto space-y-10">
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

            {/* Casos Específicos por Nicho */}
            <div className="grid md:grid-cols-3 gap-6 my-12">
              <div className="bg-gray-50 rounded-xl p-6 text-left">
                <TrendingUp className="w-8 h-8 text-[#F57C00] mb-3" />
                <h4 className="font-bold text-gray-900 mb-2">Loja em Foz do Iguaçu</h4>
                <p className="text-sm text-gray-600">"Meus posts não geram vendas. Vejo meus concorrentes bombando e eu aqui postando foto de produto..."</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 text-left">
                <Users className="w-8 h-8 text-[#FF8A80] mb-3" />
                <h4 className="font-bold text-gray-900 mb-2">Restaurante no Centro</h4>
                <p className="text-sm text-gray-600">"Posto a comida toda hora mas o pessoal não vem. Como criar aquela fome que faz o cliente sair de casa?"</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 text-left">
                <Calendar className="w-8 h-8 text-[#F57C00] mb-3" />
                <h4 className="font-bold text-gray-900 mb-2">Eventos no Paraguai</h4>
                <p className="text-sm text-gray-600">"Preciso criar buzz, expectativa. Meus eventos estão vazios porque ninguém nem fica sabendo..."</p>
              </div>
            </div>
            
            {/* Método T.A.C.C.O.H. */}
            <div className="bg-gradient-to-r from-[#FF8A80]/10 to-[#F57C00]/10 rounded-2xl p-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Nosso Método T.A.C.C.O.H. Resolve Isso Definitivamente
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div>
                  <div className="flex items-center mb-3">
                    <Target className="w-6 h-6 text-[#F57C00] mr-3" />
                    <h4 className="font-bold text-gray-900">Targeting Inteligente</h4>
                  </div>
                  <p className="text-gray-700">Identificamos exatamente quem é seu cliente e onde ele está online</p>
                </div>
                
                <div>
                  <div className="flex items-center mb-3">
                    <BarChart3 className="w-6 h-6 text-[#FF8A80] mr-3" />
                    <h4 className="font-bold text-gray-900">Análise Comportamental</h4>
                  </div>
                  <p className="text-gray-700">Estudamos o que realmente faz seu público parar o scroll e agir</p>
                </div>
                
                <div>
                  <div className="flex items-center mb-3">
                    <Zap className="w-6 h-6 text-[#F57C00] mr-3" />
                    <h4 className="font-bold text-gray-900">Criatividade Direcionada</h4>
                  </div>
                  <p className="text-gray-700">Conteúdo criativo que gera resultado, não só engajamento vazio</p>
                </div>
                
                <div>
                  <div className="flex items-center mb-3">
                    <MessageCircle className="w-6 h-6 text-[#FF8A80] mr-3" />
                    <h4 className="font-bold text-gray-900">Otimização Contínua</h4>
                  </div>
                  <p className="text-gray-700">Ajustamos a estratégia com base nos resultados reais</p>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-xl text-gray-700">
                  <strong className="text-[#F57C00]">Transformamos</strong> sua dor em oportunidade com planejamento estratégico, 
                  <strong className="text-[#FF8A80]"> criatividade direcionada</strong> e conteúdo que realmente vende.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkaeStorytelling;