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
  status: 'pago' | 'pendente' | 'atrasado' | 'parcial' | 'agendado';
  tipo: 'fixa' | 'variavel';
  responsavel?: string;
  observacoes?: string;
  data_pagamento?: string;
  data_pagamento_agendado?: string;
  auto_pagar_na_data?: boolean;
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
        return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', borderColor: 'border-emerald-200', label: 'Pago' };
      case 'pendente':
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', borderColor: 'border-amber-200', label: 'Pendente' };
      case 'atrasado':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', borderColor: 'border-red-200', label: 'Atrasado' };
      default:
        return { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50', borderColor: 'border-slate-200', label: status };
    }
  };

  if (!conta) return null;

  const statusConfig = getStatusConfig(conta.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col bg-white">
          {/* Header com visual aprimorado */}
          <SheetHeader className="p-6 pb-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg font-semibold text-slate-900 truncate">
                  {conta.nome}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="capitalize bg-white border-slate-200 text-slate-600">
                    {conta.tipo}
                  </Badge>
                  <Badge className={`${statusConfig.bg} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(conta.valor_previsto)}
                </p>
                <p className="text-xs text-slate-500 flex items-center justify-end gap-1.5 mt-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-5 mx-6 mt-4 h-10 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger value="resumo" className="text-xs rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Resumo</TabsTrigger>
              <TabsTrigger value="predios" className="text-xs rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Prédios</TabsTrigger>
              <TabsTrigger value="docs" className="text-xs rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Docs</TabsTrigger>
              <TabsTrigger value="obs" className="text-xs rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Obs</TabsTrigger>
              <TabsTrigger value="historico" className="text-xs rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Log</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 p-6">
              <TabsContent value="resumo" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Categoria</p>
                    <p className="font-semibold text-slate-900">{conta.categoria}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Tipo</p>
                    <p className="font-semibold text-slate-900 capitalize">{conta.tipo}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Valor Previsto</p>
                    <p className="font-semibold text-slate-900">{formatCurrency(conta.valor_previsto)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Valor Pago</p>
                    <p className="font-semibold text-emerald-600">{formatCurrency(conta.valor_pago)}</p>
                  </div>
                </div>

                {conta.responsavel && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Responsável</p>
                    <p className="font-medium text-slate-900">{conta.responsavel}</p>
                  </div>
                )}

                {conta.observacoes && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Observações</p>
                    <p className="text-sm text-slate-700">{conta.observacoes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="predios" className="mt-0 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <>
                    {/* Fornecedor */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Fornecedor
                      </p>
                      {fornecedor ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="font-semibold text-blue-900">
                            {fornecedor.nome_fantasia || fornecedor.razao_social}
                          </p>
                          {fornecedor.nome_fantasia && (
                            <p className="text-xs text-blue-600 mt-1">{fornecedor.razao_social}</p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                          <p className="text-sm text-slate-500">Nenhum fornecedor vinculado</p>
                        </div>
                      )}
                    </div>

                    {/* Prédios */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Prédios Vinculados ({buildings.length})
                      </p>
                      {buildings.length > 0 ? (
                        <div className="space-y-2">
                          {buildings.map((building) => (
                            <div
                              key={building.id}
                              className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3"
                            >
                              <div className="h-10 w-10 rounded-lg bg-slate-200 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-slate-500" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 text-sm">{building.nome}</p>
                                <p className="text-xs text-slate-500">{building.bairro}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                          <p className="text-sm text-slate-500">Nenhum prédio vinculado</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="docs" className="mt-0">
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">Nenhum documento</p>
                  <p className="text-sm text-slate-400 mb-4">Anexe comprovantes aqui</p>
                  <Button variant="outline" size="sm" className="border-slate-200">
                    Anexar Comprovante
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="obs" className="mt-0">
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">Sem observações</p>
                  <p className="text-sm text-slate-400">Nenhuma anotação registrada</p>
                </div>
              </TabsContent>

              <TabsContent value="historico" className="mt-0">
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <History className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">Histórico</p>
                  <p className="text-sm text-slate-400">Em breve disponível</p>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Footer com ações */}
          <div className="border-t border-slate-200 p-4 bg-slate-50 flex gap-2">
            {canEdit && (
              <Button 
                variant="outline" 
                onClick={onEdit} 
                className="flex-1 bg-white border-slate-200 hover:bg-slate-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {canEdit && conta.status !== 'pago' && (
              <Button 
                onClick={onPagar} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
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
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Esta ação não pode ser desfeita. A conta "{conta.nome}" será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="border-slate-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
