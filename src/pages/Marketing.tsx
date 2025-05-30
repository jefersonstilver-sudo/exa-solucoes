
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, TrendingUp, Target, Users, BarChart3, Lightbulb } from 'lucide-react';

const Marketing = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-[#3C1361] mb-6">
              Marketing Digital Estratégico
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transformamos sua marca em referência no mercado através de estratégias 
              personalizadas e resultados mensuráveis.
            </p>
            <Button 
              size="lg" 
              className="bg-[#3C1361] hover:bg-[#3C1361]/90 text-white px-8 py-3 text-lg"
            >
              <Coffee className="h-5 w-5 mr-2" />
              Agendar Reunião
            </Button>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-[#3C1361] mb-12">
              Nossos Serviços
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-[#3C1361] mb-4" />
                  <CardTitle>Estratégia Digital</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Desenvolvimento de estratégias completas para fortalecer sua presença digital.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Target className="h-10 w-10 text-[#3C1361] mb-4" />
                  <CardTitle>Campanhas Direcionadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Criação de campanhas segmentadas para atingir seu público-alvo com precisão.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Users className="h-10 w-10 text-[#3C1361] mb-4" />
                  <CardTitle>Gestão de Redes Sociais</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Administração completa das suas redes sociais com conteúdo engajador.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-[#3C1361] mb-4" />
                  <CardTitle>Analytics e Relatórios</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Monitoramento detalhado com relatórios claros sobre o desempenho.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Lightbulb className="h-10 w-10 text-[#3C1361] mb-4" />
                  <CardTitle>Consultoria Criativa</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Desenvolvimento de ideias inovadoras para destacar sua marca.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Coffee className="h-10 w-10 text-[#3C1361] mb-4" />
                  <CardTitle>Consultoria Personalizada</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Atendimento direto com nossos especialistas para soluções sob medida.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-[#3C1361] text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Pronto para Transformar Seu Marketing?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Vamos tomar um café e conversar sobre como podemos impulsionar seus resultados.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-[#3C1361] hover:bg-gray-100 px-8 py-3 text-lg"
            >
              <Coffee className="h-5 w-5 mr-2" />
              Agendar Reunião Gratuita
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Marketing;
