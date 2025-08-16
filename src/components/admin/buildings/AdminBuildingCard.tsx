
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Image, Trash2, MapPin, Phone, Mail, Monitor, DollarSign, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminBuildingCardProps {
  building: any;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
  onViewCampaigns?: (building: any) => void;
  videoCount?: number;
}

const AdminBuildingCard: React.FC<AdminBuildingCardProps> = ({
  building,
  onView,
  onEdit,
  onImageManager,
  onDelete,
  onViewCampaigns,
  videoCount
}) => {
  console.log('🏢 [ADMIN BUILDING CARD] Renderizando prédio:', building.nome, 'Status:', building.status);

  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return (
          <Badge className="bg-green-500 text-white">
            ✅ Ativo
          </Badge>
        );
      case 'manutenção':
        return (
          <Badge className="bg-orange-500 text-white">
            🔧 Manutenção
          </Badge>
        );
      case 'instalação':
        return (
          <Badge className="bg-blue-500 text-white">
            🔨 Instalação
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white">
            ⚠️ Inativo
          </Badge>
        );
    }
  };

  // Calculate panel stats directly
  const panelStats = {
    total: building.quantidade_telas || 0,
    occupied: building.paineis_ocupados || 0,
    available: (building.quantidade_telas || 0) - (building.paineis_ocupados || 0)
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg ${
      building.status === 'manutenção' ? 'border-orange-200 bg-orange-50/30' : 
      building.status === 'instalação' ? 'border-blue-200 bg-blue-50/30' : 
      building.status === 'inativo' ? 'border-gray-200 bg-gray-50/30' : 
      'border-gray-200'
    }`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{building.nome}</h3>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{building.endereco}, {building.bairro}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(building.status)}
            {building.status === 'manutenção' && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Indisponível Temporariamente
              </Badge>
            )}
            {building.status === 'instalação' && (
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                Em Breve Disponível
              </Badge>
            )}
            {building.status === 'inativo' && (
              <Badge variant="outline" className="text-gray-600 border-gray-300">
                Fora de Operação
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Image Section */}
          <div className="lg:col-span-3">
            <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
              {building.imagem_principal ? (
                <img 
                  src={getImageUrl(building.imagem_principal)} 
                  alt={building.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Image className="h-8 w-8" />
                </div>
              )}
            </div>
            {typeof videoCount === 'number' && (
              <div className="mt-2 flex items-center text-sm text-gray-700">
                <Video className="h-4 w-4 mr-1 text-green-600" />
                <span>Em exibição: {videoCount}</span>
              </div>
            )}
          </div>
          
          {/* Info Section */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Informações Básicas</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Andares:</span>
                  <p className="font-medium">{building.numero_andares || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Unidades:</span>
                  <p className="font-medium">{building.numero_unidades || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Padrão:</span>
                  <p className="font-medium">{building.padrao_publico || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Categoria:</span>
                  <p className="font-medium">{building.categoria || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Contato</h4>
              <div className="space-y-1 text-sm">
                {building.contato_telefone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{building.contato_telefone}</span>
                  </div>
                )}
                {building.contato_email && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{building.contato_email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Metrics and Price Section */}
          <div className="lg:col-span-3 space-y-4">
            {/* Panel Metrics */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Monitor className="h-4 w-4 mr-2" />
                Painéis
              </h4>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">{panelStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ocupados:</span>
                  <span className="font-medium text-red-600">{panelStats.occupied}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Disponíveis:</span>
                  <span className="font-medium text-green-600">{panelStats.available}</span>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Preços
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">7 dias:</span>
                  <span className="font-medium">R$ {building.preco_7_dias || '0,00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">15 dias:</span>
                  <span className="font-medium">R$ {building.preco_15_dias || '0,00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">30 dias:</span>
                  <span className="font-medium">R$ {building.preco_30_dias || '0,00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(building)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              Ver Detalhes
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(building)}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onImageManager(building)}
              className="flex items-center gap-1"
            >
              <Image className="h-4 w-4" />
              Imagens
            </Button>

            {onViewCampaigns && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewCampaigns(building)}
                className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                <Video className="h-4 w-4" />
                Campanhas Ativas
              </Button>
            )}
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(building)}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminBuildingCard;
