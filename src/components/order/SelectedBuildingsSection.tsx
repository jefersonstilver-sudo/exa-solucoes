
import React, { useState } from 'react';
import { Building, MapPin, AlertCircle, ChevronDown, ChevronUp, Grid, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSelectedBuildingsDetails } from '@/hooks/useSelectedBuildingsDetails';
import { BuildingCard } from './BuildingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SelectedBuildingsSectionProps {
  listaPredios: string[];
  className?: string;
}

export const SelectedBuildingsSection: React.FC<SelectedBuildingsSectionProps> = ({
  listaPredios,
  className = ""
}) => {
  const { buildings, loading, error } = useSelectedBuildingsDetails(listaPredios);
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(listaPredios.length > 10 ? 'list' : 'grid');

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

  const totalTelas = buildings.reduce((sum, building) => 
    sum + (building.quantidade_telas || building.numero_elevadores || 0), 0
  );

  const totalVisualizacoes = buildings.reduce((sum, building) => 
    sum + (building.visualizacoes_mes || 0), 0
  );

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/30 active:bg-muted/50 rounded p-2 -m-2">
              <CardTitle className="flex items-center text-sm sm:text-base md:text-lg">
                <Building className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                <span className="hidden xs:inline">Locais Selecionados</span>
                <span className="xs:hidden">Locais</span>
                {isExpanded ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </CardTitle>
              <div className="text-sm text-gray-600 font-normal">
                {buildings.length} {buildings.length === 1 ? 'local' : 'locais'}
                {totalTelas > 0 && ` • ${totalTelas} ${totalTelas === 1 ? 'tela' : 'telas'}`}
                {totalVisualizacoes > 0 && ` • ${totalVisualizacoes.toLocaleString()} exibições/mês`}
              </div>
            </div>
          </CollapsibleTrigger>
        </Collapsible>
      </CardHeader>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent>
            {/* Toggle View Mode */}
            {buildings.length > 5 && (
              <div className="flex justify-end mb-4 gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="flex items-center gap-2"
                >
                  <Grid className="h-4 w-4" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  Lista
                </Button>
              </div>
            )}
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {buildings.map((building, index) => (
                  <BuildingCard 
                    key={building.id} 
                    building={building} 
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {buildings.map((building, index) => (
                  <div key={building.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="bg-blue-600 text-white px-2.5 py-1.5 rounded text-sm font-medium min-w-[32px] text-center">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{building.nome}</h4>
                        <p className="text-sm text-gray-600">{building.endereco}, {building.bairro}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {/* Número de Telas */}
                      <div className="flex items-center gap-1 text-gray-700">
                        <span className="font-medium">{building.quantidade_telas || 0}</span>
                        <span className="text-gray-500">{(building.quantidade_telas || 0) === 1 ? 'tela' : 'telas'}</span>
                      </div>
                      
                      {/* Pessoas Impactadas */}
                      <div className="flex items-center gap-1 text-gray-700">
                        <span className="font-medium">{(building.publico_estimado || 0).toLocaleString()}</span>
                        <span className="text-gray-500">pessoas</span>
                      </div>
                      
                      {/* Exibições por Mês */}
                      <div className="flex items-center gap-1 text-gray-700">
                        <span className="font-medium">{(building.visualizacoes_mes || 0).toLocaleString()}</span>
                        <span className="text-gray-500">exib/mês</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
