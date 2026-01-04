import React from 'react';
import { FileText, Image, FileSpreadsheet, FileArchive, File, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FileCardProps {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: Date;
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  name,
  type,
  size,
  createdAt,
  onView,
  onDownload,
  onDelete
}) => {
  const getFileConfig = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return { 
        icon: FileText, 
        bgColor: 'bg-red-100', 
        iconColor: 'text-red-600',
        label: 'PDF'
      };
    }
    if (fileType.startsWith('image/')) {
      return { 
        icon: Image, 
        bgColor: 'bg-blue-100', 
        iconColor: 'text-blue-600',
        label: 'Imagem'
      };
    }
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
      return { 
        icon: FileSpreadsheet, 
        bgColor: 'bg-emerald-100', 
        iconColor: 'text-emerald-600',
        label: 'Planilha'
      };
    }
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) {
      return { 
        icon: FileArchive, 
        bgColor: 'bg-amber-100', 
        iconColor: 'text-amber-600',
        label: 'Arquivo'
      };
    }
    return { 
      icon: File, 
      bgColor: 'bg-gray-100', 
      iconColor: 'text-gray-600',
      label: 'Documento'
    };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const config = getFileConfig(type);
  const Icon = config.icon;

  return (
    <div className="group bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bgColor)}>
          <Icon className={cn("w-5 h-5", config.iconColor)} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>Visualizar</DropdownMenuItem>
            <DropdownMenuItem onClick={onDownload}>Download</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h4 className="text-sm font-medium text-foreground truncate mb-1" title={name}>
        {name}
      </h4>
      
      <p className="text-xs text-muted-foreground">
        {formatFileSize(size)} • {format(createdAt, 'dd MMM yyyy', { locale: ptBR })}
      </p>
    </div>
  );
};

export default FileCard;
