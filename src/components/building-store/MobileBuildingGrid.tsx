
import React from 'react';
import { motion } from 'framer-motion';
import { Building, MapPin, Eye, Star, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface Building {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  basePrice: number;
  paineis_count?: number;
  tipo_perfil?: string;
  rating?: number;
  views_mes?: number;
}

interface MobileBuildingGridProps {
  buildings: Building[];
  isLoading: boolean;
  onAddToCart?: (building: Building) => void;
}

const MobileBuildingGrid = ({ buildings, isLoading, onAddToCart }: MobileBuildingGridProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (buildings.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum prédio encontrado</h3>
        <p className="text-gray-500">Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {buildings.map((building, index) => (
        <motion.div
          key={building.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-md transition-shadow touch-manipulation">
            <CardContent className="p-0">
              <div className="flex">
                {/* Building Image/Icon */}
                <div className="w-28 h-28 bg-gradient-to-br from-indexa-purple/10 to-indexa-purple/20 flex items-center justify-center rounded-l-lg">
                  <Building className="h-8 w-8 text-indexa-purple" />
                </div>
                
                {/* Building Info */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                      {building.nome}
                    </h3>
                    {building.rating && (
                      <div className="flex items-center ml-2">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600 ml-1">{building.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">{building.bairro}, {building.cidade}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {building.paineis_count && (
                        <Badge variant="secondary" className="text-xs">
                          {building.paineis_count} painéis
                        </Badge>
                      )}
                      {building.views_mes && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Eye className="h-3 w-3 mr-1" />
                          <span>{(building.views_mes / 1000).toFixed(0)}k</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-indexa-purple">
                        R$ {building.basePrice}
                      </div>
                      <div className="text-xs text-gray-500">por mês</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="border-t border-gray-100 p-3">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10 text-xs"
                    onClick={() => navigate(`/paineis-digitais/loja?building_id=${building.id}`)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver Painéis
                  </Button>
                  {onAddToCart && (
                    <Button
                      size="sm"
                      className="flex-1 h-10 text-xs bg-indexa-purple hover:bg-indexa-purple/90"
                      onClick={() => onAddToCart(building)}
                    >
                      Selecionar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default MobileBuildingGrid;
