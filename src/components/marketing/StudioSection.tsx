
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Camera } from 'lucide-react';

const StudioSection: React.FC = () => {
  const studioEquipment = [
    { name: "Chroma Key 360º", description: "Cenários infinitos" },
    { name: "Teleprompter", description: "Gravações fluidas" },
    { name: "Painéis Touch", description: "Controle de iluminação" },
    { name: "Blackmagic 6K", description: "Qualidade cinematográfica" },
    { name: "DRONE", description: "Tomadas aéreas únicas" }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            🎬 Conteúdos Sensoriais, <span className="bg-gradient-to-r from-indexa-mint to-indexa-purple bg-clip-text text-transparent">Gravados em Estúdio Cinematográfico</span>
          </h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20 max-w-4xl mx-auto">
            <p className="text-xl text-white/90 leading-relaxed">
              Utilizamos técnicas de resposta sensorial para criar vídeos que emocionam, prendem atenção e permanecem na memória.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-indexa-mint/20 to-indexa-purple/20 backdrop-blur-sm rounded-xl p-4 border border-indexa-mint/30">
              <p className="text-lg text-white font-medium">🎯 <strong>Um de cada tipo.</strong></p>
            </div>
            <div className="bg-gradient-to-r from-indexa-purple/20 to-indexa-mint/20 backdrop-blur-sm rounded-xl p-4 border border-indexa-purple/30">
              <p className="text-lg text-white font-medium">📌 <strong>Para cada pilar.</strong></p>
            </div>
            <div className="bg-gradient-to-r from-indexa-mint/20 to-indexa-purple/20 backdrop-blur-sm rounded-xl p-4 border border-indexa-mint/30">
              <p className="text-lg text-white font-medium">🚀 <strong>Para que nenhuma empresa dependa de sorte na comunicação.</strong></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {studioEquipment.map((equipment, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:scale-105 hover:shadow-2xl hover:bg-white/20 transition-all duration-300 group">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-br from-indexa-mint to-indexa-purple p-3 rounded-full mb-4 mx-auto w-fit group-hover:shadow-lg group-hover:shadow-indexa-mint/50 transition-all duration-300">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-indexa-mint">{equipment.name}</h3>
                <p className="text-white/80 text-sm">{equipment.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-indexa-mint/20 to-indexa-purple/20 backdrop-blur-sm rounded-xl p-6 border border-indexa-mint/30 inline-block">
            <p className="text-lg text-white font-medium">
              Da essência ao resultado, você está em boas mãos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudioSection;
