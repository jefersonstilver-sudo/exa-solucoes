import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Building2,
  Truck,
  FileText,
  MessageSquare,
  History,
  Edit,
  CreditCard,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ContaPagar {
  id: string;
  nome: string;
  categoria: string;
  valor_previsto: number;
  valor_pago: number;
  data_vencimento: string;
  status: 'pago' | 'pendente' | 'atrasado' | 'parcial';
  tipo: 'fixa' | 'variavel';
  responsavel?: string;
  observacoes?: string;
}

interface ContaDetalhesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaPagar | null;
  onEdit: () => void;
  onPagar: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

interface BuildingInfo {
  id: string;
  nome: string;
  bairro: string;
}

interface FornecedorInfo {
  id: string;
  nome_fantasia: string | null;
  razao_social: string;
}

export const ContaDetalhesDrawer: React.FC<ContaDetalhesDrawerProps> = ({
  open,
  onOpenChange,
  conta,
  onEdit,
  onPagar,
  onDelete,
  canEdit = false,
  canDelete = false
}) => {
  const [activeTab, setActiveTab] = useState('resumo');
  const [buildings, setBuildings] = useState<BuildingInfo[]>([]);
  const [fornecedor, setFornecedor] = useState<FornecedorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open && conta) {
      fetchRelatedData();
    }
  }, [open, conta?.id]);

  const fetchRelatedData = async () => {
    if (!conta) return;
    setLoading(true);

    try {
      // Buscar prédios vinculados
      const { data: prediosData } = await (supabase as any)
        .from('despesas_predios')
        .select('building_id')
        .eq(conta.tipo === 'fixa' ? 'despesa_fixa_id' : 'despesa_variavel_id', conta.id);

      if (prediosData && prediosData.length > 0) {
        const buildingIds = prediosData.map((p: any) => p.building_id);
        const { data: buildingsData } = await supabase
          .from('buildings')
          .select('id, nome, bairro')
          .in('id', buildingIds);

        setBuildings(buildingsData || []);
      } else {
        setBuildings([]);
      }

      // Buscar fornecedor
      const table = conta.tipo === 'fixa' ? 'despesas_fixas' : 'despesas_variaveis';
      const { data: despesaData } = await supabase
        .from(table)
        .select('fornecedor_id')
        .eq('id', conta.id)
        .single();

      if (despesaData?.fornecedor_id) {
        const { data: fornecedorData } = await supabase
          .from('fornecedores')
          .select('id, nome_fantasia, razao_social')
          .eq('id', despesaData.fornecedor_id)
          .single();

        setFornecedor(fornecedorData);
      } else {
        setFornecedor(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados relacionados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!conta) return;
    setDeleting(true);

    try {
      const table = conta.tipo === 'fixa' ? 'despesas_fixas' : 'despesas_variaveis';
      const { error } = await supabase.from(table).delete().eq('id', conta.id);

      if (error) throw error;

      toast.success('Conta excluída com sucesso');
      setShowDeleteDialog(false);
      onOpenChange(false);
      onDelete();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pago':
        return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Pago' };
      case 'pendente':
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Pendente' };
      case 'atrasado':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Atrasado' };
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: status };
    }
  };

  if (!conta) return null;

  const statusConfig = getStatusConfig(conta.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col">
          <SheetHeader className="p-6 pb-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg font-semibold text-gray-900 truncate">
                  {conta.nome}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">
                    {conta.tipo}
                  </Badge>
                  <Badge className={`${statusConfig.bg} ${statusConfig.color} border`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(conta.valor_previsto)}
                </p>
                <p className="text-xs text-gray-500 flex items-center justify-end gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          </SheetHeader>

          <Separator className="mt-4" />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-5 mx-6 mt-4 h-9">
              <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
              <TabsTrigger value="predios" className="text-xs">Prédios</TabsTrigger>
              <TabsTrigger value="docs" className="text-xs">Docs</TabsTrigger>
              <TabsTrigger value="obs" className="text-xs">Obs</TabsTrigger>
              <TabsTrigger value="historico" className="text-xs">Log</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 p-6">
              <TabsContent value="resumo" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Categoria</p>
                    <p className="font-medium text-gray-900">{conta.categoria}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Tipo</p>
                    <p className="font-medium text-gray-900 capitalize">{conta.tipo}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Valor Previsto</p>
                    <p className="font-medium text-gray-900">{formatCurrency(conta.valor_previsto)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Valor Pago</p>
                    <p className="font-medium text-gray-900">{formatCurrency(conta.valor_pago)}</p>
                  </div>
                </div>

                {conta.responsavel && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Responsável</p>
                    <p className="font-medium text-gray-900">{conta.responsavel}</p>
                  </div>
                )}

                {conta.observacoes && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Observações</p>
                    <p className="text-sm text-gray-700">{conta.observacoes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="predios" className="mt-0 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    {/* Fornecedor */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Fornecedor
                      </p>
                      {fornecedor ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="font-medium text-blue-900">
                            {fornecedor.nome_fantasia || fornecedor.razao_social}
                          </p>
                          {fornecedor.nome_fantasia && (
                            <p className="text-xs text-blue-600 mt-1">{fornecedor.razao_social}</p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                          <p className="text-sm text-gray-500">Nenhum fornecedor vinculado</p>
                        </div>
                      )}
                    </div>

                    {/* Prédios */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Prédios Vinculados ({buildings.length})
                      </p>
                      {buildings.length > 0 ? (
                        <div className="space-y-2">
                          {buildings.map((building) => (
                            <div
                              key={building.id}
                              className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3"
                            >
                              <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{building.nome}</p>
                                <p className="text-xs text-gray-500">{building.bairro}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                          <p className="text-sm text-gray-500">Nenhum prédio vinculado</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="docs" className="mt-0">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">Nenhum documento anexado</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Anexar Comprovante
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="obs" className="mt-0">
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">Nenhuma observação registrada</p>
                </div>
              </TabsContent>

              <TabsContent value="historico" className="mt-0">
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">Histórico de alterações</p>
                  <p className="text-xs text-gray-400 mt-1">Em breve</p>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Footer com ações */}
          <div className="border-t p-4 bg-gray-50/80 flex gap-2">
            {canEdit && (
              <Button variant="outline" onClick={onEdit} className="flex-1 bg-white">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {canEdit && conta.status !== 'pago' && (
              <Button onClick={onPagar} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <CreditCard className="h-4 w-4 mr-2" />
                Pagar
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conta "{conta.nome}" será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
