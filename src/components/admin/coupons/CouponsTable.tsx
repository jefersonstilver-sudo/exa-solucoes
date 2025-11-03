
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MoreHorizontal, Edit, Trash, Eye, Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import { Coupon, CouponUsageDetail } from '@/types/coupon';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CouponsTableProps {
  coupons: Coupon[];
  isLoading: boolean;
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: boolean) => void;
  onViewUsage: (couponId: string) => Promise<CouponUsageDetail[]>;
}

const CouponsTable: React.FC<CouponsTableProps> = ({
  coupons,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewUsage
}) => {
  const [usageDetailsOpen, setUsageDetailsOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [usageDetails, setUsageDetails] = useState<CouponUsageDetail[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const isExpired = coupon.expira_em && new Date(coupon.expira_em) <= now;
    const isMaxedOut = coupon.usos_atuais >= coupon.max_usos;

    if (!coupon.ativo) {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (isMaxedOut) {
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Esgotado</Badge>;
    }
    return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
  };

  const getCategoryBadge = (categoria: string) => {
    const colors = {
      'geral': 'bg-gray-500',
      'primeira_compra': 'bg-blue-500',
      'reativacao': 'bg-purple-500',
      'vip': 'bg-yellow-500 text-black',
      'evento': 'bg-red-500',
      'promocional': 'bg-green-500'
    };
    
    return (
      <Badge className={colors[categoria as keyof typeof colors] || 'bg-gray-500'}>
        {categoria.replace('_', ' ')}
      </Badge>
    );
  };

  const handleViewUsage = async (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setLoadingUsage(true);
    setUsageDetailsOpen(true);
    
    try {
      const details = await onViewUsage(coupon.id);
      setUsageDetails(details);
    } catch (error) {
      console.error('Erro ao carregar detalhes de uso:', error);
    } finally {
      setLoadingUsage(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Desconto</TableHead>
              <TableHead>Uso</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum cupom encontrado
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-medium">
                    <div className="flex items-center gap-2">
                      {coupon.codigo}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(coupon.codigo)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(coupon.categoria)}</TableCell>
                  <TableCell>
                    {coupon.desconto_percentual}%
                    {coupon.min_meses > 1 && (
                      <div className="text-xs text-muted-foreground">
                        Min. {coupon.min_meses} meses
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {coupon.usos_atuais} / {coupon.max_usos}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full" 
                        style={{ 
                          width: `${Math.min((coupon.usos_atuais / coupon.max_usos) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.expira_em ? (
                      <div className="text-sm">
                        {format(new Date(coupon.expira_em), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sem expiração</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(coupon)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewUsage(coupon)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Usos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(coupon)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus(coupon.id, !coupon.ativo)}>
                          {coupon.ativo ? (
                            <>
                              <ToggleLeft className="mr-2 h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <ToggleRight className="mr-2 h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(coupon.id)}
                          className="text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Detalhes de Uso */}
      <Dialog open={usageDetailsOpen} onOpenChange={setUsageDetailsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes de Uso - {selectedCoupon?.codigo}</DialogTitle>
            <DialogDescription>
              Histórico de aplicações deste cupom
            </DialogDescription>
          </DialogHeader>
          
          {loadingUsage ? (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : usageDetails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Este cupom ainda não foi utilizado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Prédios</TableHead>
                  <TableHead>Valor Pedido</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Data de Uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageDetails.map((detail, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{detail.user_email}</TableCell>
                    <TableCell>{detail.user_telefone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {detail.plano_meses} {detail.plano_meses === 1 ? 'mês' : 'meses'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs overflow-auto">
                        {detail.lista_predios && detail.lista_predios.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {detail.lista_predios.map((predio, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {predio}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Nenhum</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>R$ {detail.valor_pedido.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      - R$ {detail.valor_desconto.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(detail.data_uso), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CouponsTable;
