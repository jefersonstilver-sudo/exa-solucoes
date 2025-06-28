
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
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Portfólio de <span className="text-[#00FFAB]">Campanhas Estratégicas</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Empresas que já dominam o mercado com nossa metodologia
          </p>

          {/* Filtros por categoria */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`${
                  selectedCategory === category 
                    ? 'bg-[#00FFAB] text-[#3C1361] hover:bg-[#00FFAB]/90' 
                    : 'border-[#00FFAB] text-[#00FFAB] hover:bg-[#00FFAB]/10'
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampanhas.slice(0, 9).map((campanha) => (
            <Card key={campanha.id} className="bg-white border-gray-200 text-gray-900 hover:scale-105 hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="aspect-video bg-gradient-to-br from-[#3C1361] to-[#00FFAB] rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
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
                <h3 className="text-xl font-bold mb-2">{campanha.titulo}</h3>
                <p className="text-[#00FFAB] font-semibold mb-2">{campanha.cliente}</p>
                <Badge variant="outline" className="border-[#00FFAB] text-[#00FFAB] mb-3">
                  {campanha.categoria}
                </Badge>
                {campanha.descricao && (
                  <p className="text-gray-600 text-sm line-clamp-2">{campanha.descricao}</p>
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
