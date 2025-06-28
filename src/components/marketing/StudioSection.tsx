
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
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            🎬 Conteúdos Sensoriais, <span className="text-[#00FFAB]">Gravados em Estúdio Cinematográfico</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
            Utilizamos técnicas de resposta sensorial para criar vídeos que emocionam, prendem atenção e permanecem na memória.
          </p>
          <div className="text-lg text-gray-900 space-y-2">
            <p>🎯 <strong>Um de cada tipo.</strong></p>
            <p>📌 <strong>Para cada pilar.</strong></p>
            <p>🚀 <strong>Para que nenhuma empresa dependa de sorte na comunicação.</strong></p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {studioEquipment.map((equipment, index) => (
            <Card key={index} className="bg-white border-gray-200 text-gray-900 hover:scale-105 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <Camera className="h-8 w-8 text-[#00FFAB] mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">{equipment.name}</h3>
                <p className="text-gray-600 text-sm">{equipment.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-lg text-gray-600">
          Da essência ao resultado, você está em boas mãos.
        </p>
      </div>
    </section>
  );
};

export default StudioSection;
