import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Image, Trash2, MapPin, Phone, Mail, Monitor, DollarSign, Video, Play, Code, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateCommercialPath, generatePanelPath, generateEmbedPath } from '@/utils/buildingSlugUtils';
interface AdminBuildingCardProps {
  building: any;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
  onViewCampaigns?: (building: any) => void;
  onViewPlaylist?: (building: any) => void;
  videoCount?: number;
}
const AdminBuildingCard: React.FC<AdminBuildingCardProps> = ({
  building,
  onView,
  onEdit,
  onImageManager,
  onDelete,
  onViewCampaigns,
  onViewPlaylist,
  videoCount
}) => {
  console.log('🏢 [ADMIN BUILDING CARD] Renderizando prédio:', building.nome, 'Status:', building.status);
  console.log('📊 [ADMIN BUILDING CARD] Dados do prédio:', {
    id: building.id,
    numero_elevadores: building.numero_elevadores,
    numero_unidades: building.numero_unidades,
    publico_estimado: building.publico_estimado,
    vendas_mes_atual: building.vendas_mes_atual
  });
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

  // Building metrics conectadas aos dados reais
  const buildingMetrics = {
    numero_telas: building.numero_elevadores || 0, // Número de telas definido no cadastro
    vendas_mes_atual: building.vendas_mes_atual || 0
  };
  return <Card className={`transition-all duration-200 hover:shadow-lg ${building.status === 'manutenção' ? 'border-orange-200 bg-orange-50/30' : building.status === 'instalação' ? 'border-blue-200 bg-blue-50/30' : building.status === 'inativo' ? 'border-gray-200 bg-gray-50/30' : 'border-gray-200'}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-gray-900">{building.nome}</h3>
              {building.codigo_predio && (
                <Badge variant="outline" className="text-xs font-mono bg-slate-100 border-slate-300 text-slate-700">
                  <Hash className="h-3 w-3 mr-1" />
                  {building.codigo_predio}
                </Badge>
              )}
            </div>
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
            
            {/* Indicador de vídeos em exibição - EMBAIXO da foto */}
            {typeof videoCount === 'number' && (
              <div className="mt-3">
                {videoCount > 0 ? (
                  <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-lg p-3 border border-slate-600 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex-shrink-0">
                          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                          <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full">
                            <Video className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold text-sm leading-tight">
                            {videoCount} {videoCount === 1 ? 'vídeo' : 'vídeos'}
                          </div>
                          <div className="text-slate-300 text-xs leading-tight flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            Ao vivo agora
                          </div>
                        </div>
                      </div>
                      {onViewPlaylist && (
                        <button
                          onClick={() => onViewPlaylist(building)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md border border-white/20 transition-all font-medium backdrop-blur-sm hover:scale-105"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Ver
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Video className="h-4 w-4" />
                      <span className="text-xs font-medium">Sem vídeos no momento</span>
                    </div>
                  </div>
                )}
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
                  <span className="text-gray-500">Público Aprox.:</span>
                  <p className="font-medium">{building.publico_estimado || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Telas:</span>
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
                    <span className="text-sm text-gray-600">Número de Telas</span>
                  </div>
                  <span className="font-bold text-green-600">{buildingMetrics.numero_telas}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-2 text-purple-600" />
                    <span className="text-sm text-gray-600">Exibições/Mês</span>
                  </div>
                  <span className="font-bold text-purple-600">{(building.visualizacoes_mes || 0).toLocaleString('pt-BR')}</span>
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

            <Button 
              size="sm" 
              onClick={() => {
                const buildingCode = building.codigo_predio || '000';
                const url = `${window.location.origin}${generatePanelPath(building.nome, buildingCode)}`;
                window.open(url, '_blank');
                navigator.clipboard.writeText(url);
                import('@/hooks/use-toast').then(({ toast }) => {
                  toast({
                    title: "Link Limpo aberto!",
                    description: "Link copiado para área de transferência",
                  });
                });
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Link Limpo
            </Button>
            
            <Button 
              size="sm" 
              onClick={() => {
                const buildingCode = building.codigo_predio || '000';
                const url = `${window.location.origin}${generateEmbedPath(building.nome, buildingCode)}`;
                const embedCode = `<iframe src="${url}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
                navigator.clipboard.writeText(embedCode);
                import('@/hooks/use-toast').then(({ toast }) => {
                  toast({
                    title: "Código Embed copiado!",
                    description: "Cole em qualquer site ou sistema",
                  });
                });
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              <Code className="h-4 w-4" />
              Embed
            </Button>
            
            <Button 
              size="sm" 
              onClick={() => {
                const buildingCode = building.codigo_predio || '000';
                console.log('🔗 [LINK COMERCIAL] Gerando link:', {
                  nome: building.nome,
                  codigo: buildingCode,
                  codigo_original: building.codigo_predio
                });
                const url = `${window.location.origin}${generateCommercialPath(building.nome, buildingCode)}`;
                console.log('🌐 [LINK COMERCIAL] URL gerada:', url);
                window.open(url, '_blank');
                navigator.clipboard.writeText(url);
                import('@/hooks/use-toast').then(({ toast }) => {
                  toast({
                    title: "Link Comercial aberto!",
                    description: "Link copiado para área de transferência",
                  });
                });
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Monitor className="h-4 w-4" />
              Link Comercial
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default AdminBuildingCard;