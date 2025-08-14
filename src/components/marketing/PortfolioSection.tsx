
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import { useCampanhasPortfolio } from '@/hooks/useCampanhasPortfolio';

const PortfolioSection: React.FC = () => {
  const { campanhas } = useCampanhasPortfolio();
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Filtrar campanhas por categoria
  const filteredCampanhas = selectedCategory === 'Todos' 
    ? campanhas 
    : campanhas.filter(campanha => campanha.categoria === selectedCategory);

  const categories = ['Todos', ...Array.from(new Set(campanhas.map(c => c.categoria)))];

  if (campanhas.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            Portfólio de <span className="bg-gradient-to-r from-indexa-mint to-indexa-purple bg-clip-text text-transparent">Campanhas Estratégicas</span>
          </h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
            <p className="text-xl text-white/90">
              Empresas que já dominam o mercado com nossa metodologia
            </p>
          </div>

          {/* Filtros por categoria */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`${
                  selectedCategory === category 
                    ? 'bg-gradient-to-r from-indexa-mint to-indexa-purple text-white hover:shadow-lg hover:shadow-indexa-mint/30' 
                    : 'border-indexa-mint text-indexa-mint hover:bg-indexa-mint/10 bg-white/10 backdrop-blur-sm'
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampanhas.slice(0, 9).map((campanha) => (
            <Card key={campanha.id} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:scale-105 hover:shadow-2xl hover:bg-white/20 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="aspect-video bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-lg mb-4 flex items-center justify-center relative overflow-hidden shadow-lg">
                  {campanha.url_video ? (
                    <video
                      className="w-full h-full object-cover"
                      src={campanha.url_video}
                      muted
                      loop
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => e.currentTarget.pause()}
                    />
                  ) : (
                    <Play className="h-12 w-12 text-white" />
                  )}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{campanha.titulo}</h3>
                <p className="text-indexa-mint font-semibold mb-2">{campanha.cliente}</p>
                <Badge variant="outline" className="border-indexa-mint text-indexa-mint mb-3 bg-white/10 backdrop-blur-sm">
                  {campanha.categoria}
                </Badge>
                {campanha.descricao && (
                  <p className="text-white/80 text-sm line-clamp-2">{campanha.descricao}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
