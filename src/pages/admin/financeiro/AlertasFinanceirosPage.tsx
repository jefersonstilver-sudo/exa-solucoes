/**
 * AlertasFinanceirosPage - Central de Alertas Financeiros
 * Gestão de alertas com ações: Resolver, Ignorar
 * Design neutro, minimalista
 */

import React, { useEffect, useState } from 'react';
import ModernSuperAdminLayout from '@/components/admin/layout/ModernSuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAlertasFinanceiros } from '@/hooks/financeiro/useAlertasFinanceiros';
import { 
  Bell, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

const AlertasFinanceirosPage = () => {
  const navigate = useNavigate();
  const basePath = useAdminBasePath();
  const { alertas, loading, contadores, fetchAlertas, resolverAlerta } = useAlertasFinanceiros();
  const [activeTab, setActiveTab] = useState('ativos');

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  const getNivelConfig = (nivel: string) => {
    switch (nivel) {
      case 'critico':
        return { 
          label: 'Crítico', 
          icon: AlertTriangle,
          borderClass: 'border-l-red-500',
          badgeClass: 'border-red-500 text-red-700 bg-white'
        };
      case 'alerta':
        return { 
          label: 'Alerta', 
          icon: Bell,
          borderClass: 'border-l-amber-500',
          badgeClass: 'border-amber-500 text-amber-700 bg-white'
        };
      case 'info':
        return { 
          label: 'Info', 
          icon: Bell,
          borderClass: 'border-l-blue-500',
          badgeClass: 'border-blue-500 text-blue-700 bg-white'
        };
      default:
        return { 
          label: nivel, 
          icon: Bell,
          borderClass: 'border-l-gray-300',
          badgeClass: 'border-gray-300 text-gray-600 bg-white'
        };
    }
  };

  const filteredAlertas = alertas.filter(a => {
    if (activeTab === 'ativos') return a.ativo && !a.resolvido;
    if (activeTab === 'resolvidos') return a.resolvido;
    if (activeTab === 'inativos') return !a.ativo;
    return true;
  });

  const handleResolver = async (id: string) => {
    await resolverAlerta(id, 'Resolvido manualmente');
  };

  return (
    <ModernSuperAdminLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`${basePath}/financeiro`)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Alertas Financeiros</h1>
            <p className="text-sm text-gray-500">Central de monitoramento e ações</p>
          </div>
        </div>

        {/* Cards de Contadores */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-white border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">Ativos</p>
              <p className="text-2xl font-semibold text-gray-900">{contadores.ativos}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">Resolvidos</p>
              <p className="text-2xl font-semibold text-gray-900">{contadores.resolvidos}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-l-4 border-l-gray-400">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">Críticos</p>
              <p className="text-2xl font-semibold text-gray-900">{contadores.criticos}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4 bg-white">
            <TabsTrigger value="ativos" className="flex-1 gap-2">
              <AlertTriangle className="h-4 w-4" />
              Ativos ({contadores.ativos})
            </TabsTrigger>
            <TabsTrigger value="resolvidos" className="flex-1 gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Resolvidos
            </TabsTrigger>
            <TabsTrigger value="inativos" className="flex-1 gap-2">
              <XCircle className="h-4 w-4" />
              Inativos
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card className="bg-white">
              <CardContent className="p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                  </div>
                ) : filteredAlertas.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum alerta {activeTab}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAlertas.map((alerta) => {
                      const nivelConfig = getNivelConfig(alerta.nivel);
                      const IconComponent = nivelConfig.icon;
                      return (
                        <div
                          key={alerta.id}
                          className={`p-4 rounded-lg border-l-4 ${nivelConfig.borderClass} bg-white border border-gray-100`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center mt-0.5">
                                <IconComponent className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-900">{alerta.titulo}</p>
                                  <Badge variant="outline" className={nivelConfig.badgeClass}>
                                    {nivelConfig.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{alerta.mensagem}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(alerta.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                  {alerta.valor_referencia && (
                                    <span>Valor: R$ {alerta.valor_referencia.toLocaleString('pt-BR')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {activeTab === 'ativos' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResolver(alerta.id)}
                                  className="gap-1"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Resolver
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {alerta.resolvido && alerta.resolucao_nota && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Resolução:</span> {alerta.resolucao_nota}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernSuperAdminLayout>
  );
};

export default AlertasFinanceirosPage;
