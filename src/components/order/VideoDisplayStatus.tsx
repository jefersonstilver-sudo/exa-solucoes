
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Play, Clock, Star } from 'lucide-react';
import { useVideoDisplayStatus } from '@/hooks/useVideoDisplayStatus';

interface VideoDisplayStatusProps {
  orderId: string;
}

export const VideoDisplayStatus: React.FC<VideoDisplayStatusProps> = ({ orderId }) => {
  const { displayingVideos, loading, hasDisplayingVideos } = useVideoDisplayStatus(orderId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Status de Exibição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indexa-purple"></div>
            <span className="text-sm text-gray-600">Verificando status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Status de Exibição
          </span>
          {hasDisplayingVideos && (
            <Badge className="bg-green-600 text-white">
              <Play className="h-3 w-3 mr-1" />
              EM EXIBIÇÃO
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasDisplayingVideos ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-green-600">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-medium">Vídeos sendo exibidos nos painéis</span>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">✅ Cobrança Ativa</p>
                <p>O tempo de contrato está sendo contabilizado desde o início da exibição.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{displayingVideos.length}</div>
                <div className="text-xs text-gray-600">Vídeos em Exibição</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {displayingVideos.reduce((acc, video) => acc + video.panelCount, 0)}
                </div>
                <div className="text-xs text-gray-600">Painéis Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">24/7</div>
                <div className="text-xs text-gray-600">Disponibilidade</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Aguardando Exibição</h3>
            <p className="text-sm text-gray-600 mb-3">
              Nenhum vídeo está sendo exibido no momento.
            </p>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">⏸️ Cobrança Pausada</p>
                <p>O tempo de contrato só será contabilizado quando um vídeo aprovado estiver em exibição.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
