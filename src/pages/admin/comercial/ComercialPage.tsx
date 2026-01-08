import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, TrendingUp, AlertTriangle, Users, CheckSquare, ExternalLink, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { useChecklistComercial, ChecklistItem } from '@/hooks/comercial/useChecklistComercial';
import { usePipelineComercial } from '@/hooks/comercial/usePipelineComercial';
import { usePropostasRisco } from '@/hooks/comercial/usePropostasRisco';
import { useAtividadeEquipe } from '@/hooks/comercial/useAtividadeEquipe';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { cn } from '@/lib/utils';

const ChecklistItemCard: React.FC<{ item: ChecklistItem }> = ({ item }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => navigate(item.link_acao)}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
        item.prioridade === 'urgente' && "bg-red-50 border-red-200 hover:bg-red-100",
        item.prioridade === 'importante' && "bg-amber-50 border-amber-200 hover:bg-amber-100",
        item.prioridade === 'normal' && "bg-gray-50 border-gray-200 hover:bg-gray-100"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-sm truncate",
          item.prioridade === 'urgente' && "text-red-800",
          item.prioridade === 'importante' && "text-amber-800",
          item.prioridade === 'normal' && "text-gray-800"
        )}>
          {item.titulo}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {item.descricao}
        </p>
      </div>
      {item.valor && (
        <Badge variant="outline" className="ml-2 shrink-0">
          R$ {item.valor.toLocaleString('pt-BR')}
        </Badge>
      )}
      <ArrowRight className="h-4 w-4 ml-2 text-muted-foreground shrink-0" />
    </div>
  );
};

const ComercialPage: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo } = useUserPermissions();
  const { data: checklist, loading: loadingChecklist } = useChecklistComercial();
  const { data: pipeline, loading: loadingPipeline } = usePipelineComercial();
  const { propostas: propostasRisco, loading: loadingRisco } = usePropostasRisco();
  const { vendedores, loading: loadingEquipe } = useAtividadeEquipe();

  const isGerente = ['super_admin', 'admin'].includes(userInfo.role || '');

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-7 w-7 text-red-600" />
              Área Comercial
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão operacional completa — o que fazer agora
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/super_admin/comercial/checklist')}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Checklist Detalhado
            </Button>
            <Button 
              onClick={() => navigate('/super_admin/comercial/pipeline')}
              className="bg-red-600 hover:bg-red-700"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Pipeline Visual
            </Button>
          </div>
        </div>

        {/* BLOCO 1: Checklist Comercial do Dia */}
        <Card className="border-2 border-red-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Checklist Comercial do Dia
              {!loadingChecklist && (
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white">
                  {checklist.total} itens
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {loadingChecklist ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : checklist.total === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p className="font-medium text-green-700">Tudo em dia!</p>
                <p className="text-sm">Nenhuma ação pendente no momento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Urgentes */}
                {checklist.urgentes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                      🔴 AÇÃO IMEDIATA ({checklist.urgentes.length})
                    </h4>
                    <div className="space-y-2">
                      {checklist.urgentes.slice(0, 5).map(item => (
                        <ChecklistItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Importantes */}
                {checklist.importantes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
                      🟡 ACOMPANHAMENTO ({checklist.importantes.length})
                    </h4>
                    <div className="space-y-2">
                      {checklist.importantes.slice(0, 3).map(item => (
                        <ChecklistItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Ver mais */}
                {checklist.total > 8 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-red-600"
                    onClick={() => navigate('/super_admin/comercial/checklist')}
                  >
                    Ver todos os {checklist.total} itens
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BLOCO 2: Pipeline Comercial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Pipeline Comercial
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPipeline ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {pipeline.colunas.map(coluna => (
                    <div 
                      key={coluna.id}
                      className={cn("p-3 rounded-lg border", coluna.bgColor)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: coluna.cor }}
                          />
                          <span className="font-medium text-sm">{coluna.titulo}</span>
                          <Badge variant="outline" className="text-xs">
                            {coluna.quantidade}
                          </Badge>
                        </div>
                        <span className="font-bold text-sm">
                          R$ {coluna.valor.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total Pipeline</span>
                      <span className="font-bold text-xl text-green-600">
                        R$ {pipeline.totalPipeline.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* BLOCO 3: Propostas em Risco */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Propostas em Risco
                {!loadingRisco && propostasRisco.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {propostasRisco.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRisco ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : propostasRisco.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckSquare className="h-10 w-10 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">Nenhuma proposta em risco</p>
                </div>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {propostasRisco.map(proposta => (
                      <div
                        key={proposta.id}
                        onClick={() => navigate(`/super_admin/propostas/${proposta.id}`)}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                          proposta.tipo_risco === 'aceita_sem_avanco' && "bg-red-50 border-red-300",
                          proposta.tipo_risco === 'vencendo' && "bg-amber-50 border-amber-300",
                          proposta.tipo_risco === 'sem_resposta' && "bg-gray-50 border-gray-300"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{proposta.client_name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {proposta.dias_parado} dias
                              {proposta.tipo_risco === 'aceita_sem_avanco' && (
                                <span className="text-red-600 font-medium ml-1">• CRÍTICO</span>
                              )}
                            </p>
                          </div>
                          <span className="font-bold text-sm">
                            R$ {proposta.valor.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* BLOCO 4: Atividade da Equipe (apenas para gerentes) */}
        {isGerente && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Atividade da Equipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEquipe ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              ) : vendedores.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm">Nenhum vendedor encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {vendedores.slice(0, 8).map(vendedor => (
                    <div
                      key={vendedor.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        vendedor.sem_atividade_hoje 
                          ? "bg-red-50 border-red-200" 
                          : "bg-white border-gray-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={cn(
                            vendedor.sem_atividade_hoje ? "bg-red-200" : "bg-gray-200"
                          )}>
                            {vendedor.nome.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{vendedor.nome}</p>
                          {vendedor.sem_atividade_hoje && (
                            <p className="text-xs text-red-600 font-medium">⚠️ Sem atividade hoje</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{vendedor.tarefas_pendentes} tarefas</span>
                        <span>{vendedor.propostas_ativas} propostas</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default ComercialPage;
