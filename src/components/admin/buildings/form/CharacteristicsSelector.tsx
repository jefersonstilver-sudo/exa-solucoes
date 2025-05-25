
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

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
  const [customInput, setCustomInput] = useState('');

  const handleAddCustom = () => {
    if (customInput.trim() && !selectedCharacteristics.includes(customInput.trim())) {
      onToggle(customInput.trim());
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  };

  const isCustomCharacteristic = (characteristic: string) => {
    return !CARACTERISTICAS_OPTIONS.includes(characteristic);
  };

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

        {/* Campo "Outros" */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar característica personalizada..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-sm"
            />
            <Button
              type="button"
              onClick={handleAddCustom}
              disabled={!customInput.trim() || selectedCharacteristics.includes(customInput.trim())}
              size="sm"
              variant="outline"
              className="px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {selectedCharacteristics.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Características selecionadas:</h4>
            <div className="flex flex-wrap gap-1">
              {selectedCharacteristics.map((caracteristica) => (
                <Badge 
                  key={caracteristica} 
                  variant={isCustomCharacteristic(caracteristica) ? "default" : "secondary"} 
                  className="text-xs flex items-center gap-1"
                >
                  {caracteristica}
                  {isCustomCharacteristic(caracteristica) && (
                    <button
                      type="button"
                      onClick={() => onToggle(caracteristica)}
                      className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CharacteristicsSelector;
