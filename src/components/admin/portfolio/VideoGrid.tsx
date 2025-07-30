import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, ExternalLink, Play } from 'lucide-react';
import { CampanhaPortfolio } from '@/hooks/useCampanhasPortfolio';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface VideoGridProps {
  videos: CampanhaPortfolio[];
  loading: boolean;
  onEdit: (video: CampanhaPortfolio) => void;
  onDelete: (id: string) => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  loading,
  onEdit,
  onDelete
}) => {
  const getVideoThumbnail = (url: string): string => {
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        
        if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1]?.split(/[?&]/)[0];
        } else if (url.includes('youtube.com')) {
          const urlParams = new URLSearchParams(url.split('?')[1]);
          videoId = urlParams.get('v') || '';
        }
        
        if (videoId) {
          return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      }
      
      // Para outros tipos (Google Drive, Vimeo), usar placeholder
      return '/placeholder.svg';
    } catch {
      return '/placeholder.svg';
    }
  };

  const openVideoUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="aspect-video bg-muted animate-pulse" />
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-dashed">
        <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum vídeo nesta categoria</h3>
        <p className="text-muted-foreground">
          Adicione vídeos para começar a construir seu portfólio nesta categoria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <Card key={video.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
          {/* Preview do vídeo */}
          <div className="relative aspect-video bg-muted">
            <img
              src={getVideoThumbnail(video.url_video)}
              alt={`Preview de ${video.titulo}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
            
            {/* Overlay com botão de play */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                size="sm"
                onClick={() => openVideoUrl(video.url_video)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Assistir
              </Button>
            </div>
            
            {/* Badge da categoria */}
            <div className="absolute top-2 left-2">
              <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium">
                {video.categoria}
              </span>
            </div>
          </div>

          {/* Conteúdo do card */}
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-medium line-clamp-2 text-sm">
                {video.titulo}
              </h3>
              
              <p className="text-xs text-muted-foreground">
                Cliente: {video.cliente}
              </p>
              
              {video.descricao && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {video.descricao}
                </p>
              )}
              
              <div className="text-xs text-muted-foreground">
                Criado em {new Date(video.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(video)}
                className="flex-1"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Editar
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir vídeo</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o vídeo "{video.titulo}"? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(video.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VideoGrid;