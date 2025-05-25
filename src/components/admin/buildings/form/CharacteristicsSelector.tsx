
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CARACTERISTICAS_OPTIONS = [
  'Piscina',
  'Academia',
  'Churrasqueira',
  'Playground',
  'Salão de festas',
  'Quadra poliesportiva',
  'Espaço gourmet',
  'Brinquedoteca',
  'Sala de jogos',
  'Espaço pet',
  'Coworking',
  'Cinema',
  'Spa / Sauna',
  'Área verde / jardim',
  'Deck com espreguiçadeiras'
];

interface CharacteristicsSelectorProps {
  selectedCharacteristics: string[];
  onToggle: (caracteristica: string) => void;
}

const CharacteristicsSelector: React.FC<CharacteristicsSelectorProps> = ({
  selectedCharacteristics,
  onToggle
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Características de Lazer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {CARACTERISTICAS_OPTIONS.map((caracteristica) => (
            <Button
              key={caracteristica}
              type="button"
              variant={selectedCharacteristics.includes(caracteristica) ? "default" : "outline"}
              size="sm"
              onClick={() => onToggle(caracteristica)}
              className="justify-start text-xs h-8 px-2"
            >
              {caracteristica}
            </Button>
          ))}
        </div>
        
        {selectedCharacteristics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedCharacteristics.map((caracteristica) => (
              <Badge key={caracteristica} variant="secondary" className="text-xs">
                {caracteristica}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CharacteristicsSelector;
