import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreVertical, RefreshCw, Link2Off, ExternalLink, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { DesconectarPainelDialog } from './DesconectarPainelDialog';

interface PainelWithStatus {
  id: string;
  code: string;
  numero_painel?: string;
  building_id?: string;
  status: string;
  status_vinculo?: string;
  created_at: string;
  buildings?: {
    id: string;
    nome: string;
    endereco: string;
    bairro: string;
  };
  statusInfo: {
    status: string;
    ultimo_heartbeat?: string;
    url_atual?: string;
    erro_ultimo?: string;
  };
}

interface PaineisTableProps {
  paineis: PainelWithStatus[];
  onRefetch: () => void;
}

export const PaineisTable = ({ paineis, onRefetch }: PaineisTableProps) => {
  const [desconectarDialogOpen, setDesconectarDialogOpen] = useState(false);
  const [painelSelecionado, setPainelSelecionado] = useState<{
    id: string;
    numero_painel: string;
    status_vinculo?: string;
  } | null>(null);

  const getStatusBadge = (status: string, statusVinculo?: string) => {
    // Priorizar status_vinculo se existir
    if (statusVinculo === 'aguardando_codigo') {
      return <Badge variant="secondary">Aguardando Código</Badge>;
    }
    if (statusVinculo === 'conectado') {
      return <Badge className="bg-green-500">Conectado</Badge>;
    }
    if (status === 'desconectado') {
      return <Badge variant="destructive">Desconectado</Badge>;
    }

    // Fallback para status antigo
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'error':
        return <Badge className="bg-orange-500">Erro</Badge>;
      default:
        return <Badge variant="secondary">Aguardando Vinculação</Badge>;
    }
  };

  const handleDesconectar = (painel: PainelWithStatus) => {
    setPainelSelecionado({
      id: painel.id,
      numero_painel: painel.numero_painel || painel.code,
      status_vinculo: painel.status_vinculo
    });
    setDesconectarDialogOpen(true);
  };

  const handleComando = async (painelId: string, comando: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('executar-comando-remoto', {
        body: {
          painel_id: painelId,
          comando,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Comando enviado com sucesso!');
        onRefetch();
      } else {
        throw new Error(data?.error || 'Erro ao enviar comando');
      }
    } catch (error: any) {
      console.error('Erro ao enviar comando:', error);
      toast.error(error.message || 'Erro ao enviar comando');
    }
  };

  if (paineis.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum painel cadastrado ainda.
      </div>
    );
  }

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Prédio</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Último Heartbeat</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paineis.map((painel) => (
          <TableRow key={painel.id}>
            <TableCell className="font-mono text-sm">{painel.code}</TableCell>
            <TableCell>
              {painel.buildings ? (
                <div>
                  <p className="font-medium">{painel.buildings.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {painel.buildings.bairro}
                  </p>
                </div>
              ) : (
                <span className="text-muted-foreground">Não vinculado</span>
              )}
            </TableCell>
            <TableCell>{getStatusBadge(painel.statusInfo.status, painel.status_vinculo)}</TableCell>
            <TableCell>
              {painel.statusInfo.ultimo_heartbeat ? (
                <span className="text-sm">
                  {formatDistanceToNow(new Date(painel.statusInfo.ultimo_heartbeat), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">Nunca</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleComando(painel.id, 'reiniciar_app')}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reiniciar App
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleComando(painel.id, 'desvincular')}>
                    <Link2Off className="mr-2 h-4 w-4" />
                    Desvincular
                  </DropdownMenuItem>
                  {painel.statusInfo.url_atual && (
                    <DropdownMenuItem asChild>
                      <a href={painel.statusInfo.url_atual} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver Conteúdo
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDesconectar(painel)}
                    className="text-destructive focus:text-destructive"
                  >
                    <WifiOff className="mr-2 h-4 w-4" />
                    Desconectar Painel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    
    <DesconectarPainelDialog
      open={desconectarDialogOpen}
      onOpenChange={setDesconectarDialogOpen}
      painel={painelSelecionado}
      onPainelDesconectado={() => {
        onRefetch();
        setPainelSelecionado(null);
      }}
    />
  </>
  );
};
