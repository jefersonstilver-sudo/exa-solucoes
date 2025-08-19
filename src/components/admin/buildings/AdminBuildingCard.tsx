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
        return <Badge className="bg-green-500 text-white">
            ✅ Ativo
          </Badge>;
      case 'manutenção':
        return <Badge className="bg-orange-500 text-white">
            🔧 Manutenção
          </Badge>;
      case 'instalação':
        return <Badge className="bg-blue-500 text-white">
            🔨 Instalação
          </Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">
            ⚠️ Inativo
          </Badge>;
    }
  };

  // New building metrics
  const buildingMetrics = {
    paineis_ativos: building.paineis_ativos || 0,
    vendas_mes_atual: building.vendas_mes_atual || 0
  };
  return <Card className={`transition-all duration-200 hover:shadow-lg ${building.status === 'manutenção' ? 'border-orange-200 bg-orange-50/30' : building.status === 'instalação' ? 'border-blue-200 bg-blue-50/30' : building.status === 'inativo' ? 'border-gray-200 bg-gray-50/30' : 'border-gray-200'}`}>
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
            {building.status === 'manutenção' && <Badge variant="outline" className="text-orange-600 border-orange-300">
                Indisponível Temporariamente
              </Badge>}
            {building.status === 'instalação' && <Badge variant="outline" className="text-blue-600 border-blue-300">
                Em Breve Disponível
              </Badge>}
            {building.status === 'inativo' && <Badge variant="outline" className="text-gray-600 border-gray-300">
                Fora de Operação
              </Badge>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Image Section */}
          <div className="lg:col-span-3">
            <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
              {building.imagem_principal ? <img src={getImageUrl(building.imagem_principal)} alt={building.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Image className="h-8 w-8" />
                </div>}
            </div>
            {typeof videoCount === 'number' && <div className="mt-2 flex items-center text-sm text-gray-700">
                <Video className="h-4 w-4 mr-1 text-green-600" />
                <span>Em exibição: {videoCount}</span>
              </div>}
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
                  <span className="text-gray-500">Elevadores:</span>
                  <p className="font-medium">{building.numero_elevadores || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Blocos:</span>
                  <p className="font-medium">{building.numero_blocos || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Padrão:</span>
                  <p className="font-medium">{building.padrao_publico || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <p className="font-medium">{building.venue_type || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Contato</h4>
              <div className="space-y-1 text-sm">
                {building.contato_telefone && <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{building.contato_telefone}</span>
                  </div>}
                {building.contato_email && <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{building.contato_email}</span>
                  </div>}
              </div>
            </div>
          </div>
          
          {/* Metrics and Price Section */}
          <div className="lg:col-span-3 space-y-4">
            {/* Building Metrics */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Métricas</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    <Monitor className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-sm text-gray-600">Painéis Ativos</span>
                  </div>
                  <span className="font-bold text-green-600">{buildingMetrics.paineis_ativos}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-sm text-gray-600">Vendas do Mês</span>
                  </div>
                  <span className="font-bold text-blue-600">{buildingMetrics.vendas_mes_atual}</span>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                Preço Base
              </h4>
              <div className="text-center">
                <span className="text-2xl font-bold text-green-600">
                  {building.preco_base ? 
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(building.preco_base) : 
                    'Não definido'
                  }
                </span>
                <p className="text-xs text-gray-500 mt-1">por mês</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onView(building)} className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Ver Detalhes
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => onEdit(building)} className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            
            

            <Button variant="outline" size="sm" onClick={() => onImageManager(building)} className="flex items-center gap-1">
              <Image className="h-4 w-4" />
              Imagens
            </Button>

            
            <Button variant="destructive" size="sm" onClick={() => onDelete(building)} className="flex items-center gap-1">
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default AdminBuildingCard;