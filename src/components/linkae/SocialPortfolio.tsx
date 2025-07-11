import React, { useState } from 'react';

const SocialPortfolio: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Casos de sucesso reais dos nossos clientes
  const campaigns = [
    {
      id: 1,
      title: "Transformação Digital Completa",
      client: "Cliente Confidencial",
      category: "E-commerce",
      videoUrl: "/assets/portfolio/social1.mp4",
      thumbnail: "/assets/portfolio/social1-thumb.jpg",
      description: "ROI de 400% em campanhas pagas + 250% crescimento orgânico"
    },
    {
      id: 2,
      title: "Estratégia de Autoridade",
      client: "Profissional Liberal",
      category: "Consultoria",
      videoUrl: "/assets/portfolio/social2.mp4",
      thumbnail: "/assets/portfolio/social2-thumb.jpg",
      description: "De 500 para 50k seguidores qualificados em 6 meses"
    },
    {
      id: 3,
      title: "Lançamento de Produto",
      client: "Startup Tech",
      category: "Tecnologia",
      videoUrl: "/assets/portfolio/social3.mp4",
      thumbnail: "/assets/portfolio/social3-thumb.jpg",
      description: "1M+ de alcance orgânico no lançamento"
    }
  ];

  const categories = ['Todos', ...Array.from(new Set(campaigns.map(c => c.category)))];
  const filteredCampaigns = selectedCategory === 'Todos' 
    ? campaigns.slice(0, 6) 
    : campaigns.filter(c => c.category === selectedCategory).slice(0, 6);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Cases de <span className="text-linkae-pink">Sucesso</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-12">
            Resultados reais de clientes que transformaram seus negócios com nossa estratégia
          </p>
          
          {/* Filtros de categoria */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-[#00B377] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Portfolio */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCampaigns.map((campaign) => (
            <div 
              key={campaign.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
            >
              <div className="relative">
                <video
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  poster={campaign.thumbnail}
                  muted
                  loop
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => e.currentTarget.pause()}
                >
                  <source src={campaign.videoUrl} type="video/mp4" />
                </video>
                <div className="absolute top-4 right-4">
                  <span className="bg-[#00FFAB] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {campaign.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{campaign.title}</h3>
                <p className="text-[#00B377] font-semibold mb-3">{campaign.client}</p>
                <p className="text-gray-600 text-sm">{campaign.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialPortfolio;