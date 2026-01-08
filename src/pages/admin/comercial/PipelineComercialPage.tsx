import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowLeft, DollarSign, Users, ExternalLink, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { usePipelineComercial } from '@/hooks/comercial/usePipelineComercial';
import { cn } from '@/lib/utils';

const PipelineComercialPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: pipeline, loading } = usePipelineComercial();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/super_admin/comercial')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-7 w-7 text-green-600" />
                Pipeline Comercial
              </h1>
              <p className="text-muted-foreground mt-1">
                Visão Kanban do funil de vendas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total no Pipeline</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {loading ? '...' : pipeline.totalPipeline.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Pipeline Visual (Kanban) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-[400px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {pipeline.colunas.map(coluna => (
              <Card 
                key={coluna.id}
                className="h-fit min-h-[400px]"
              >
                <CardHeader 
                  className="rounded-t-lg"
                  style={{ backgroundColor: `${coluna.cor}15` }}
                >
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: coluna.cor }}
                      />
                      <span>{coluna.titulo}</span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ backgroundColor: `${coluna.cor}25` }}
                    >
                      {coluna.quantidade}
                    </Badge>
                  </CardTitle>
                  <div className="text-lg font-bold" style={{ color: coluna.cor }}>
                    R$ {coluna.valor.toLocaleString('pt-BR')}
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <ScrollArea className="h-[300px]">
                    {coluna.quantidade === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Nenhum item</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Placeholder para cards individuais - em uma versão completa, 
                            buscaria os itens de cada coluna */}
                        {Array.from({ length: Math.min(coluna.quantidade, 5) }).map((_, idx) => (
                          <div 
                            key={idx}
                            className={cn(
                              "p-3 rounded-lg border bg-white cursor-pointer",
                              "hover:shadow-md transition-all"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="w-2 h-2 rounded-full bg-gray-300" />
                              <Badge variant="outline" className="text-xs">
                                {coluna.titulo}
                              </Badge>
                            </div>
                            <div className="h-2 bg-gray-100 rounded w-3/4 mb-2" />
                            <div className="h-2 bg-gray-100 rounded w-1/2" />
                          </div>
                        ))}
                        {coluna.quantidade > 5 && (
                          <Button variant="ghost" size="sm" className="w-full text-xs">
                            +{coluna.quantidade - 5} mais
                          </Button>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{pipeline.totalPropostas}</p>
              <p className="text-sm text-muted-foreground">Total de Oportunidades</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">R$ {pipeline.totalPipeline.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-muted-foreground">Valor Total Pipeline</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">
                {pipeline.totalPropostas > 0 
                  ? `R$ ${Math.round(pipeline.totalPipeline / pipeline.totalPropostas).toLocaleString('pt-BR')}`
                  : 'R$ 0'
                }
              </p>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold">
                {pipeline.colunas.find(c => c.id === 'em_negociacao')?.quantidade || 0}
              </p>
              <p className="text-sm text-muted-foreground">Em Negociação</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PipelineComercialPage;
