import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Link, Code, ExternalLink, Trash2, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { generateCommercialPath, generatePanelPath, generateEmbedPath } from '@/utils/buildingSlugUtils';
import { generatePublicUrl } from '@/config/domain';

interface BuildingActionsDropdownProps {
  buildingName: string;
  buildingCode: string;
  onDelete: () => void;
}

const BuildingActionsDropdown: React.FC<BuildingActionsDropdownProps> = ({
  buildingName,
  buildingCode,
  onDelete
}) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`, { duration: 3000 });
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const panelUrl = generatePublicUrl(generatePanelPath(buildingName, buildingCode));
  const commercialUrl = generatePublicUrl(generateCommercialPath(buildingName, buildingCode));
  const embedUrl = generatePublicUrl(generateEmbedPath(buildingName, buildingCode));
  const embedCode = `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => copyToClipboard(panelUrl, 'Link Limpo')}>
          <Link className="h-4 w-4 mr-2" />
          Copiar Link Limpo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openInNewTab(panelUrl)}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir Painel
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => copyToClipboard(commercialUrl, 'Link Comercial')}>
          <Monitor className="h-4 w-4 mr-2" />
          Copiar Link Comercial
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openInNewTab(commercialUrl)}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir Comercial
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => copyToClipboard(embedCode, 'Código Embed')}>
          <Code className="h-4 w-4 mr-2" />
          Copiar Embed
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onDelete}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir Prédio
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BuildingActionsDropdown;
