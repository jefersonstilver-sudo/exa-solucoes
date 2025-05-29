
import React from 'react';
import { Video, Play, CheckCircle, XCircle, Clock, Star, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface OrderVideo {
  id: string;
  slot_position: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  selected_for_display: boolean;
  created_at: string;
  approved_at?: string;
  rejection_reason?: string;
  video_data?: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
  };
}

interface RealOrderVideosCardProps {
  videos: OrderVideo[];
  orderId: string;
}

export const RealOrderVideosCard: React.FC<RealOrderVideosCardProps> = ({ videos, orderId }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (video: OrderVideo) => {
    if (video.selected_for_display && video.approval_status === 'approved') {
      return <Badge className="bg-green-600 text-white text-xs">EXIBINDO AGORA</Badge>;
    }
    
    if (video.approval_status === 'approved') {
      return <Badge className="bg-green-100 text-green-800 text-xs">Aprovado</Badge>;
    }
    
    if (video.approval_status === 'rejected') {
      return <Badge className="bg-red-100 text-red-800 text-xs">Rejeitado</Badge>;
    }
    
    if (video.approval_status === 'pending') {
      return <Badge className="bg-orange-100 text-orange-800 text-xs">Pendente</Badge>;
    }
    
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-gray-900 flex items-center">
          <Video className="h-5 w-5 mr-2 text-indexa-purple" />
          Gestão de Vídeos
        </CardTitle>
        <CardDescription className="text-gray-600">
          {videos.length} {videos.length === 1 ? 'vídeo enviado' : 'vídeos enviados'} para este pedido
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {videos.length === 0 ? (
          <div className="text-center py-8">
            <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum vídeo foi enviado ainda</p>
            <p className="text-sm text-gray-500 mt-1">
              O cliente precisa enviar um vídeo de até 15 segundos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div key={video.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-indexa-purple/20 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-indexa-purple">{video.slot_position}</span>
                      </div>
                      {getStatusIcon(video.approval_status)}
                      {video.selected_for_display && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {video.video_data?.nome || `Vídeo ${video.slot_position}`}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Enviado em {formatDate(video.created_at)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(video)}
                </div>

                {video.video_data && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Duração:</span>
                        <span className="text-gray-900">{formatDuration(video.video_data.duracao)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Orientação:</span>
                        <span className="text-gray-900">{video.video_data.orientacao}</span>
                      </div>
                      {video.approved_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Aprovado em:</span>
                          <span className="text-gray-900">{formatDate(video.approved_at)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(video.video_data!.url, '_blank')}
                        className="w-full"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Visualizar
                      </Button>
                      
                      {video.approval_status === 'pending' && (
                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprovar
                          </Button>
                          <Button variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-50">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {video.rejection_reason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">
                      <strong>Motivo da rejeição:</strong> {video.rejection_reason}
                    </p>
                  </div>
                )}

                {video.selected_for_display && video.approval_status === 'approved' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-green-600 fill-current" />
                      <p className="text-green-800 text-sm font-medium">
                        Este vídeo está selecionado para exibição nos painéis
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
