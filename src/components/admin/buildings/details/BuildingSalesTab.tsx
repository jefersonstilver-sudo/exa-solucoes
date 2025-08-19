
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Play, Pause } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';

interface BuildingSalesTabProps {
  sales: any[];
  loading?: boolean;
}

const BuildingSalesTab: React.FC<BuildingSalesTabProps> = ({ sales, loading = false }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getClientName = (sale: any) => {
    const email = sale.client?.email || sale.email || 'Email não encontrado';
    return email.split('@')[0] || 'Cliente';
  };

  const getVideoStatus = (sale: any) => {
    const videos = sale.pedido_videos || [];
    const approvedVideos = videos.filter((v: any) => v.approval_status === 'approved');
    const activeVideos = videos.filter((v: any) => v.is_active && v.approval_status === 'approved');
    
    if (activeVideos.length > 0) {
      return { status: 'Em Exibição', variant: 'default' as const, icon: Play };
    } else if (approvedVideos.length > 0) {
      return { status: 'Pausado', variant: 'secondary' as const, icon: Pause };
    } else if (videos.some((v: any) => v.approval_status === 'pending')) {
      return { status: 'Aguardando Aprovação', variant: 'outline' as const, icon: RefreshCw };
    } else {
      return { status: 'Sem Vídeo', variant: 'destructive' as const, icon: Pause };
    }
  };

  const getFirstApprovedVideoDate = (sale: any) => {
    const videos = sale.pedido_videos || [];
    const approvedVideos = videos
      .filter((v: any) => v.approval_status === 'approved' && v.approved_at)
      .sort((a: any, b: any) => new Date(a.approved_at).getTime() - new Date(b.approved_at).getTime());
    
    return approvedVideos.length > 0 ? approvedVideos[0].approved_at : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas Realizadas ({sales.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-indexa-purple mr-2" />
            <span className="text-gray-600">Carregando vendas...</span>
          </div>
        ) : sales.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Data Compra</TableHead>
                <TableHead>Início Campanha</TableHead>
                <TableHead>Primeiro Vídeo</TableHead>
                <TableHead>Status Vídeo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale: any) => {
                const videoStatus = getVideoStatus(sale);
                const firstVideoDate = getFirstApprovedVideoDate(sale);
                const StatusIcon = videoStatus.icon;
                
                return (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getClientName(sale)}</div>
                        <div className="text-sm text-muted-foreground">
                          {sale.client?.email || sale.email || ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(sale.created_at)}</TableCell>
                    <TableCell>{formatDate(sale.data_inicio)}</TableCell>
                    <TableCell>{formatDate(firstVideoDate)}</TableCell>
                    <TableCell>
                      <Badge variant={videoStatus.variant} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {videoStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(sale.valor_total)}</TableCell>
                    <TableCell>{sale.plano_meses} meses</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/pedidos/${sale.id}`)}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-500 py-8">
            Nenhuma venda registrada para este prédio
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BuildingSalesTab;
