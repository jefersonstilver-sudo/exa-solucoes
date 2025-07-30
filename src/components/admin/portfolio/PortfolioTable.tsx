import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { CampanhaPortfolio } from '@/hooks/useCampanhasPortfolio';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PortfolioTableProps {
  campanhas: CampanhaPortfolio[];
  loading: boolean;
  onEdit: (campanha: CampanhaPortfolio) => void;
  onDelete: (id: string) => void;
}

const PortfolioTable: React.FC<PortfolioTableProps> = ({
  campanhas,
  loading,
  onEdit,
  onDelete
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const getVideoThumbnail = (url: string) => {
    try {
      // Para YouTube
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('youtu.be') 
          ? url.split('/').pop()?.split('?')[0]
          : url.split('v=')[1]?.split('&')[0];
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
      
      // Para Google Drive
      if (url.includes('drive.google.com')) {
        return '/placeholder.svg'; // Placeholder para Google Drive
      }
      
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indexa-purple" />
      </div>
    );
  }

  if (campanhas.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Nenhum vídeo encontrado no portfólio.</p>
        <p className="text-sm text-gray-400">
          Adicione vídeos ao portfólio usando o botão "Adicionar Vídeo".
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Preview</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campanhas.map((campanha) => (
            <TableRow key={campanha.id}>
              <TableCell>
                <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden">
                  <img
                    src={getVideoThumbnail(campanha.url_video)}
                    alt={`Thumbnail de ${campanha.titulo}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
              </TableCell>
              
              <TableCell className="font-medium">
                <div className="max-w-[200px]">
                  <p className="truncate" title={campanha.titulo}>
                    {campanha.titulo}
                  </p>
                  {campanha.descricao && (
                    <p className="text-xs text-gray-500 truncate" title={campanha.descricao}>
                      {campanha.descricao}
                    </p>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <span className="text-sm font-medium">
                  {campanha.cliente}
                </span>
              </TableCell>
              
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {campanha.categoria}
                </Badge>
              </TableCell>
              
              <TableCell>
                <span className="text-sm text-gray-600">
                  {new Date(campanha.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </TableCell>
              
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openVideoUrl(campanha.url_video)}
                    className="h-8 w-8 p-0"
                    title="Abrir vídeo"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(campanha)}
                    className="h-8 w-8 p-0"
                    title="Editar vídeo"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir vídeo"
                        disabled={deletingId === campanha.id}
                      >
                        {deletingId === campanha.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o vídeo "{campanha.titulo}" do portfólio?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(campanha.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PortfolioTable;