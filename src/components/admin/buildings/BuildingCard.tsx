
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import BuildingImageSection from './card/BuildingImageSection';
import BuildingInfoSection from './card/BuildingInfoSection';

interface BuildingCardProps {
  building: any;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
}

const BuildingCard: React.FC<BuildingCardProps> = ({
  building,
  onView,
  onEdit,
  onImageManager,
  onDelete
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row h-full">
          <BuildingImageSection building={building} />
          <BuildingInfoSection
            building={building}
            onView={onView}
            onEdit={onEdit}
            onImageManager={onImageManager}
            onDelete={onDelete}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingCard;
