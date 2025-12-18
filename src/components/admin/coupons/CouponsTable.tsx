
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
import CouponDetailsHoverCard from './CouponDetailsHoverCard';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { toast } from 'sonner';

interface CouponsTableProps {
  coupons: Coupon[];
  isLoading: boolean;
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: boolean) => void;
  onViewUsage: (couponId: string) => Promise<CouponUsageDetail[]>;
  isSuperAdmin?: boolean;
}

const CouponsTable: React.FC<CouponsTableProps> = ({
  coupons,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewUsage,
  isSuperAdmin = false
}) => {
  const { isMobile } = useAdvancedResponsive();
  const [usageDetailsOpen, setUsageDetailsOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [usageDetails, setUsageDetails] = useState<CouponUsageDetail[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const isExpired = coupon.expira_em && new Date(coupon.expira_em) <= now;
    const isMaxedOut = coupon.usos_atuais >= coupon.max_usos;

    if (!coupon.ativo) {
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inativo</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Expirado</Badge>;
    }
    if (isMaxedOut) {
      return <Badge variant="outline" className="border-orange-500 text-orange-500 text-[10px] px-1.5 py-0">Esgotado</Badge>;
    }
    return <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">Ativo</Badge>;
  };

  const getCategoryBadge = (categoria: string) => {
    const colors: Record<string, string> = {
      'geral': 'bg-gray-100 text-gray-700',
      'primeiro_pedido': 'bg-blue-100 text-blue-700',
      'fidelidade': 'bg-purple-100 text-purple-700',
      'especial': 'bg-yellow-100 text-yellow-700',
      'parceiro': 'bg-[#9C1E1E]/10 text-[#9C1E1E]',
      'promocional': 'bg-emerald-100 text-emerald-700',
      'cortesia': 'bg-pink-100 text-pink-700'
    };
    
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors[categoria] || 'bg-gray-100 text-gray-700'}`}>
        {categoria.replace('_', ' ')}
      </span>
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
    toast.success('Código copiado!');
  };

  if (isLoading) {
    if (isMobile) {
      return (
        <div className="space-y-2 px-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-3 animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      );
    }

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

  // Mobile: Card-based layout
  if (isMobile) {
    return (
      <>
        <div className="space-y-2 px-3">
          {coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl">
              Nenhum cupom encontrado
            </div>
          ) : (
            coupons.map((coupon) => (
              <div 
                key={coupon.id} 
                className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-3 shadow-sm"
              >
                {/* Header do card */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#9C1E1E] text-sm">
                      {coupon.codigo}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={() => copyCode(coupon.codigo)}
                    >
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                  {getStatusBadge(coupon)}
                </div>
                
                {/* Info compacta */}
                <div className="flex items-center justify-between text-xs mb-2">
                  {getCategoryBadge(coupon.categoria)}
                  <span className="font-semibold text-emerald-600">{coupon.desconto_percentual}% OFF</span>
                </div>
                
                {/* Barra de uso */}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
                  <span>{coupon.usos_atuais}/{coupon.max_usos} usos</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-[#9C1E1E] h-1 rounded-full transition-all" 
                      style={{ width: `${Math.min((coupon.usos_atuais / coupon.max_usos) * 100, 100)}%` }} 
                    />
                  </div>
                </div>
                
                {/* Ações compactas */}
                <div className="flex gap-1.5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-8 text-xs border-gray-200" 
                    onClick={() => onEdit(coupon)}
                  >
                    <Edit className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0 border-gray-200" 
                    onClick={() => handleViewUsage(coupon)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
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
                      {isSuperAdmin && (
                        <DropdownMenuItem onClick={() => onDelete(coupon.id)} className="text-destructive">
                          <Trash className="mr-2 h-4 w-4" />
                          Deletar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dialog de Detalhes de Uso - Mobile */}
        <Dialog open={usageDetailsOpen} onOpenChange={setUsageDetailsOpen}>
          <DialogContent className="max-w-[95vw] max-h-[80vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base">Usos - {selectedCoupon?.codigo}</DialogTitle>
              <DialogDescription className="text-xs">
                Histórico de aplicações
              </DialogDescription>
            </DialogHeader>
            
            {loadingUsage ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
                ))}
              </div>
            ) : usageDetails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Este cupom ainda não foi utilizado
              </div>
            ) : (
              <div className="space-y-2">
                {usageDetails.map((detail, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium truncate flex-1">{detail.user_email}</span>
                      <Badge 
                        variant={detail.status_compra.includes('não finalizada') ? 'outline' : 'default'}
                        className="text-[9px] ml-2"
                      >
                        {detail.status_compra}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>R$ {detail.valor_pedido.toFixed(2)}</span>
                      <span className="text-emerald-600 font-medium">-R$ {detail.valor_desconto.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {format(new Date(detail.data_uso), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop: Table layout
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
                      <CouponDetailsHoverCard coupon={coupon}>
                        <span className="font-semibold text-[#9C1E1E]">
                          {coupon.codigo}
                        </span>
                      </CouponDetailsHoverCard>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(coupon.codigo)}
                        className="h-6 w-6 p-0 hover:bg-[#9C1E1E]/10"
                        title="Copiar código"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${
                      coupon.categoria === 'geral' ? 'bg-gray-500' :
                      coupon.categoria === 'primeiro_pedido' ? 'bg-blue-500' :
                      coupon.categoria === 'fidelidade' ? 'bg-purple-500' :
                      coupon.categoria === 'especial' ? 'bg-yellow-500 text-black' :
                      coupon.categoria === 'parceiro' ? 'bg-[#9C1E1E]' :
                      coupon.categoria === 'promocional' ? 'bg-green-500' :
                      coupon.categoria === 'cortesia' ? 'bg-pink-500' : 'bg-gray-500'
                    }`}>
                      {coupon.categoria.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {coupon.desconto_percentual}%
                    {coupon.min_meses > 1 && (
                      <div className="text-xs text-muted-foreground">
                        Min. {coupon.min_meses} meses
                      </div>
                    )}
                    {(coupon.min_predios || coupon.max_predios) && (
                      <div className="text-xs text-muted-foreground">
                        {coupon.min_predios && coupon.max_predios 
                          ? `${coupon.min_predios} a ${coupon.max_predios} prédios`
                          : coupon.min_predios 
                          ? `Mín. ${coupon.min_predios} prédios`
                          : `Máx. ${coupon.max_predios} prédios`
                        }
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {coupon.usos_atuais} / {coupon.max_usos}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className="bg-[#9C1E1E] h-1 rounded-full" 
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
                  <TableCell>
                    {(() => {
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
                      return <Badge className="bg-emerald-600">Ativo</Badge>;
                    })()}
                  </TableCell>
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
                        {isSuperAdmin && (
                          <DropdownMenuItem 
                            onClick={() => onDelete(coupon.id)}
                            className="text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Deletar
                          </DropdownMenuItem>
                        )}
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
                  <TableHead>Status</TableHead>
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
                      <Badge 
                        variant={detail.status_compra.includes('não finalizada') ? 'outline' : 'default'}
                        className={detail.status_compra.includes('não finalizada') ? 'border-orange-500 text-orange-600' : ''}
                      >
                        {detail.status_compra}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {detail.plano_meses ? (
                        <Badge variant="outline">
                          {detail.plano_meses} {detail.plano_meses === 1 ? 'mês' : 'meses'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
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
                          <span className="text-muted-foreground text-sm">-</span>
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
