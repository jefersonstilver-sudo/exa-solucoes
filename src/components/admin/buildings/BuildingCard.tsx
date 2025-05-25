
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  MapPin, 
  Users, 
  Monitor, 
  Eye, 
  Edit, 
  Camera, 
  Trash2, 
  Star,
  DollarSign,
  Calculator,
  UserCircle,
  Phone,
  Wifi,
  WifiOff,
  Settings as SettingsIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return (
          <Badge className="bg-green-500/90 text-white border-0 shadow-md">
            Ativo
          </Badge>
        );
      case 'inativo':
        return (
          <Badge className="bg-gray-500/90 text-white border-0 shadow-md">
            Inativo
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-white/90 shadow-md">
            {status}
          </Badge>
        );
    }
  };

  const getPadraoPublicoBadge = (padrao: string) => {
    const styles = {
      alto: 'bg-purple-500/90 text-white border-0 shadow-md',
      medio: 'bg-blue-500/90 text-white border-0 shadow-md',
      normal: 'bg-gray-500/90 text-white border-0 shadow-md'
    };
    
    return (
      <Badge className={styles[padrao as keyof typeof styles] || styles.normal}>
        {padrao.charAt(0).toUpperCase() + padrao.slice(1)}
      </Badge>
    );
  };

  const getLocationTypeBadge = (type: string) => {
    return (
      <Badge className="bg-indigo-500/90 text-white border-0 shadow-md">
        {type === 'residential' ? 'Residencial' : 'Comercial'}
      </Badge>
    );
  };

  // Calcular estatísticas dos painéis (simulado - seria buscado do backend)
  const getPanelStats = () => {
    const totalPanels = building.quantidade_telas || 0;
    // Simular distribuição de status dos painéis
    const online = Math.floor(totalPanels * 0.7);
    const offline = Math.floor(totalPanels * 0.2);
    const maintenance = totalPanels - online - offline;

    return { total: totalPanels, online, offline, maintenance };
  };

  const panelStats = getPanelStats();
  const primaryImage = getImageUrl(building.imagem_principal);
  const totalImages = [building.imagem_principal, building.imagem_2, building.imagem_3, building.imagem_4].filter(Boolean).length;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row h-full">
          {/* Seção da Imagem */}
          <div className="relative w-full md:w-2/5 h-48 md:h-auto bg-gradient-to-br from-indexa-purple/10 to-indexa-purple/5">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={building.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-16 w-16 text-indexa-purple/30" />
              </div>
            )}
            
            {/* Badges sobrepostos */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {getStatusBadge(building.status)}
              {getLocationTypeBadge(building.location_type)}
            </div>
            
            <div className="absolute top-3 right-3">
              {getPadraoPublicoBadge(building.padrao_publico)}
            </div>
            
            {/* Indicador de fotos */}
            {totalImages > 0 && (
              <div className="absolute bottom-3 left-3 flex items-center space-x-1">
                <Camera className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                  {totalImages} foto{totalImages !== 1 ? 's' : ''}
                </span>
                {building.imagem_principal && (
                  <Star className="h-4 w-4 text-yellow-400" />
                )}
              </div>
            )}
          </div>

          {/* Seção de Informações */}
          <div className="flex-1 p-6">
            <div className="flex flex-col h-full">
              {/* Cabeçalho */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{building.nome}</h3>
                <div className="flex items-start space-x-2 text-gray-600">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{building.bairro}</div>
                    <div className="text-sm opacity-75">{building.endereco}</div>
                  </div>
                </div>
              </div>

              {/* Métricas em Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-gray-500">Unidades</span>
                  </div>
                  <div className="font-bold text-blue-600">{building.numero_unidades}</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Eye className="h-4 w-4 text-purple-600" />
                    <span className="text-xs text-gray-500">Público</span>
                  </div>
                  <div className="font-bold text-purple-600">{building.publico_estimado}</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Monitor className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs text-gray-500">Painéis</span>
                  </div>
                  <div className="font-bold text-indigo-600">{panelStats.total}</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Calculator className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-gray-500">Views/mês</span>
                  </div>
                  <div className="font-bold text-orange-600 text-sm">
                    {building.visualizacoes_mes?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>

              {/* Status dos Painéis */}
              {panelStats.total > 0 && (
                <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                  <div className="flex items-center space-x-1 mb-2">
                    <Monitor className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Status dos Painéis</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs">
                    {panelStats.online > 0 && (
                      <div className="flex items-center space-x-1">
                        <Wifi className="h-3 w-3 text-green-500" />
                        <span className="text-green-600 font-medium">{panelStats.online} Online</span>
                      </div>
                    )}
                    {panelStats.offline > 0 && (
                      <div className="flex items-center space-x-1">
                        <WifiOff className="h-3 w-3 text-red-500" />
                        <span className="text-red-600 font-medium">{panelStats.offline} Offline</span>
                      </div>
                    )}
                    {panelStats.maintenance > 0 && (
                      <div className="flex items-center space-x-1">
                        <SettingsIcon className="h-3 w-3 text-yellow-500" />
                        <span className="text-yellow-600 font-medium">{panelStats.maintenance} Manutenção</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informações de Contato */}
              {(building.nome_sindico || building.contato_sindico || building.nome_vice_sindico || 
                building.contato_vice_sindico || building.nome_contato_predio || building.numero_contato_predio) && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-1 mb-2">
                    <UserCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Contatos</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    {building.nome_sindico && (
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">Síndico:</span>
                        <span>{building.nome_sindico}</span>
                        {building.contato_sindico && (
                          <>
                            <Phone className="h-3 w-3 ml-1" />
                            <span>{building.contato_sindico}</span>
                          </>
                        )}
                      </div>
                    )}
                    {building.nome_vice_sindico && (
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">Vice:</span>
                        <span>{building.nome_vice_sindico}</span>
                        {building.contato_vice_sindico && (
                          <>
                            <Phone className="h-3 w-3 ml-1" />
                            <span>{building.contato_vice_sindico}</span>
                          </>
                        )}
                      </div>
                    )}
                    {building.nome_contato_predio && (
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">Prédio:</span>
                        <span>{building.nome_contato_predio}</span>
                        {building.numero_contato_predio && (
                          <>
                            <Phone className="h-3 w-3 ml-1" />
                            <span>{building.numero_contato_predio}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preço */}
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-xl font-bold text-green-600">
                    {formatPrice(building.preco_base)}
                  </span>
                  <span className="text-sm text-gray-500">preço base</span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center space-x-2 mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView(building)}
                  className="flex items-center space-x-1"
                >
                  <Eye className="h-3 w-3" />
                  <span>Ver</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(building)}
                  className="flex items-center space-x-1"
                >
                  <Edit className="h-3 w-3" />
                  <span>Editar</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onImageManager(building)}
                  className="flex items-center space-x-1"
                >
                  <Camera className="h-3 w-3" />
                  <span>Fotos</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(building)}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Excluir</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingCard;
