
import React from 'react';
import { Building, MapPin, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSelectedBuildingsDetails } from '@/hooks/useSelectedBuildingsDetails';
import { BuildingCard } from './BuildingCard';
import { Skeleton } from '@/components/ui/skeleton';

interface SelectedBuildingsSectionProps {
  listaPredios: string[];
  className?: string;
}

export const SelectedBuildingsSection: React.FC<SelectedBuildingsSectionProps> = ({
  listaPredios,
  className = ""
}) => {
  const { buildings, loading, error } = useSelectedBuildingsDetails(listaPredios);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2 text-blue-500" />
            Locais Selecionados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2 text-blue-500" />
            Locais Selecionados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar os detalhes dos locais selecionados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (buildings.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2 text-blue-500" />
            Locais Selecionados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              Nenhum local foi encontrado para este pedido.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const totalPublico = buildings.reduce((sum, building) => 
    sum + (building.publico_estimado || 0), 0
  );

  const totalUnidades = buildings.reduce((sum, building) => 
    sum + (building.numero_unidades || 0), 0
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Building className="h-5 w-5 mr-2 text-blue-500" />
            Locais Selecionados ({buildings.length})
          </div>
          <div className="text-sm text-gray-600 font-normal">
            {totalPublico > 0 && `${totalPublico.toLocaleString()} pessoas`}
            {totalUnidades > 0 && ` • ${totalUnidades} unidades`}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildings.map((building, index) => (
            <BuildingCard 
              key={building.id} 
              building={building} 
              index={index}
            />
          ))}
        </div>
        
      </CardContent>
    </Card>
  );
};
