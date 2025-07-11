import React from 'react';
import { Play, MapPin, Users, Clock } from 'lucide-react';

const ExaShowcaseSection: React.FC = () => {
  const showcaseVideos = [
    {
      id: 1,
      title: "Campanha Shopping Center",
      location: "Shopping Vila Olimpia",
      audience: "50K pessoas/dia",
      duration: "30 dias",
      videoUrl: "/assets/exa/showcase1.mp4",
      thumbnail: "/assets/exa/showcase1-thumb.jpg",
      results: "+340% em vendas"
    },
    {
      id: 2,
      title: "Lançamento de Produto",
      location: "Av. Paulista",
      audience: "120K pessoas/dia",
      duration: "15 dias",
      videoUrl: "/assets/exa/showcase2.mp4",
      thumbnail: "/assets/exa/showcase2-thumb.jpg",
      results: "+250% brand awareness"
    },
    {
      id: 3,
      title: "Campanha B2B",
      location: "Centro Empresarial",
      audience: "30K executivos/dia",
      duration: "45 dias",
      videoUrl: "/assets/exa/showcase3.mp4",
      thumbnail: "/assets/exa/showcase3-thumb.jpg",
      results: "+180% leads qualificados"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Cases de <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Sucesso</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Veja como a EXA transformou campanhas publicitárias em resultados extraordinários.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {showcaseVideos.map((video) => (
            <div
              key={video.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden hover:border-yellow-500/50 transition-all duration-300 group"
            >
              <div className="relative">
                <video
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  poster={video.thumbnail}
                  muted
                  loop
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => e.currentTarget.pause()}
                >
                  <source src={video.videoUrl} type="video/mp4" />
                </video>
                
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Play className="h-12 w-12 text-white" />
                </div>
                
                <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                  {video.results}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">{video.title}</h3>
                
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                    {video.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-green-400" />
                    {video.audience}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-purple-400" />
                    {video.duration}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 backdrop-blur-sm p-8 rounded-2xl border border-yellow-500/20">
            <h3 className="text-2xl font-bold mb-4">Resultados que Falam por Si</h3>
            <p className="text-gray-300 text-lg mb-6">
              Mais de 500 campanhas bem-sucedidas em todo o Brasil
            </p>
            <button className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold px-8 py-3 rounded-full hover:shadow-lg transition-all duration-300">
              Ver Mais Cases
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaShowcaseSection;