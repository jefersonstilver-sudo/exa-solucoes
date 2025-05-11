
import React from 'react';

interface AmenityListProps {
  randomCount?: number;
  isCommercial?: boolean;
}

export const AmenityList: React.FC<AmenityListProps> = ({ 
  randomCount = 3,
  isCommercial = false
}) => {
  // Residential amenities
  const residentialAmenities = [
    'Academia', 'Piscina', 'Sauna', 'Playground', 'Salão de Festas',
    'Churrasqueira', 'Espaço Gourmet', 'Brinquedoteca', 'Cinema',
    'Pet Place', 'Quadra', 'Lavanderia', 'Coworking'
  ];
  
  // Commercial venue features/categories
  const commercialCategories = [
    'Alimentação', 'Entretenimento', 'Moda', 'Tecnologia', 'Serviços',
    'Saúde', 'Beleza', 'Cinema', 'Varejo', 'Educação', 'Finanças',
    'Lazer', 'Esportes', 'Família', 'Turismo', 'Luxo'
  ];
  
  const amenitiesList = isCommercial ? commercialCategories : residentialAmenities;
  
  // Randomly select a subset of amenities
  const getRandomAmenities = () => {
    const shuffled = [...amenitiesList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, randomCount || 3);
  };
  
  const amenities = getRandomAmenities();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
      {amenities.map((amenity, index) => (
        <div 
          key={index} 
          className={`
            whitespace-nowrap px-3 py-2 rounded-full text-xs font-medium
            ${isCommercial 
              ? 'bg-[#00F894]/10 text-[#00F894]' 
              : 'bg-[#7C3AED]/10 text-[#7C3AED]'}
          `}
        >
          {amenity}
        </div>
      ))}
    </div>
  );
};
