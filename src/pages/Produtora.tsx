
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Film, Camera, Mic, Edit3, Award } from 'lucide-react';

const Produtora = () => {
  const portfolioItems = [
    {
      title: "Campanha Institucional",
      description: "Vídeo institucional para empresa de tecnologia",
      image: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&q=80",
      category: "Institucional"
    },
    {
      title: "Produto Launch",
      description: "Lançamento de produto com motion graphics",
      image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80",
      category: "Comercial"
    },
    {
      title: "Evento Corporativo",
      description: "Cobertura completa de evento empresarial",
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80",
      category: "Eventos"
    },
    {
      title: "Campanha Publicitária",
      description: "Série de vídeos para redes sociais",
      image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80",
      category: "Social Media"
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section 
          className="py-20 px-4 relative"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="max-w-6xl mx-auto text-center relative z-10">
            <h1 className="text-5xl font-bold text-white mb-6">
              Produtora Audiovisual
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Criamos conteúdo audiovisual de alta qualidade que conecta, 
              emociona e gera resultados para sua marca.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-[#3C1361] hover:bg-gray-100 px-8 py-3 text-lg"
            >
              <Film className="h-5 w-5 mr-2" />
              Ver Nosso Portfolio
            </Button>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-[#3C1361] mb-12">
              Nossos Serviços
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Camera className="h-12 w-12 text-[#3C1361] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Produção de Vídeo</h3>
                  <p className="text-gray-600">
                    Vídeos institucionais, comerciais e promocionais com qualidade cinematográfica.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Edit3 className="h-12 w-12 text-[#3C1361] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Edição e Pós-Produção</h3>
                  <p className="text-gray-600">
                    Edição profissional, motion graphics, colorização e finalização.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Mic className="h-12 w-12 text-[#3C1361] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Áudio Profissional</h3>
                  <p className="text-gray-600">
                    Captação, tratamento e mixagem de áudio com equipamentos de ponta.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-[#3C1361] mb-12">
              Portfolio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {portfolioItems.map((item, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="relative">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <Play className="h-16 w-16 text-white opacity-80" />
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="bg-[#3C1361] text-white px-3 py-1 rounded-full text-sm">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Awards Section */}
        <section className="py-16 px-4 bg-[#3C1361] text-white">
          <div className="max-w-4xl mx-auto text-center">
            <Award className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6">
              Reconhecimento e Qualidade
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Nossos trabalhos já foram premiados em festivais nacionais e internacionais, 
              garantindo a excelência que sua marca merece.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-[#3C1361] hover:bg-gray-100 px-8 py-3 text-lg"
            >
              <Film className="h-5 w-5 mr-2" />
              Solicitar Orçamento
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Produtora;
