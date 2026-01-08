import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, Phone, Mail, MessageSquare, DollarSign } from 'lucide-react';
import { useInadimplentes } from '@/hooks/financeiro/useInadimplentes';
import { useFinanceiroPermissions } from '@/hooks/financeiro/useFinanceiroPermissions';
import ModernSuperAdminLayout from '@/components/admin/layout/ModernSuperAdminLayout';
import { formatCurrency } from '@/utils/format';

const InadimplenciaPage: React.FC = () => {
  const { inadimplentes, loading, fetchInadimplentes, getResumo, registrarAcaoCobranca } = useInadimplentes();
  const permissions = useFinanceiroPermissions();
  const resumo = getResumo();

  useEffect(() => {
    if (permissions.canViewInadimplencia) {
      fetchInadimplentes();
    }
  }, [permissions.canViewInadimplencia]);

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case 'critico': return 'bg-red-600 text-white';
      case 'alto': return 'bg-orange-500 text-white';
      case 'medio': return 'bg-amber-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  if (!permissions.canViewInadimplencia) {
    return (
      <ModernSuperAdminLayout>
        <div className="p-6 text-center">
          <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold">Acesso Restrito</h2>
        </div>
      </ModernSuperAdminLayout>
    );
  }

  return (
    <ModernSuperAdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Central de Inadimplência</h1>
            <p className="text-muted-foreground text-sm">{inadimplentes.length} clientes inadimplentes</p>
          </div>
          <Button onClick={fetchInadimplentes} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-red-500/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total em Atraso</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(resumo.total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Críticos</p>
              <p className="text-xl font-bold">{resumo.criticos}</p>
              <p className="text-xs text-destructive">{formatCurrency(resumo.valorCriticos)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Altos</p>
              <p className="text-xl font-bold">{resumo.altos}</p>
              <p className="text-xs text-orange-500">{formatCurrency(resumo.valorAltos)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Médios/Baixos</p>
              <p className="text-xl font-bold">{resumo.medios + resumo.baixos}</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Inadimplentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Clientes Inadimplentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inadimplentes.map((cliente) => (
                <div key={cliente.client_id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/50 rounded-lg gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{cliente.cliente_nome}</p>
                      <Badge className={getRiscoColor(cliente.risco)}>{cliente.risco.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{cliente.cliente_email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cliente.cobrancas_vencidas} cobranças • {cliente.dias_atraso_max} dias de atraso
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-destructive">{formatCurrency(cliente.total_devido)}</p>
                      <p className="text-xs text-muted-foreground">{cliente.acao_recomendada}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => registrarAcaoCobranca(cliente.client_id, 'ligacao')}>
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => registrarAcaoCobranca(cliente.client_id, 'email')}>
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => registrarAcaoCobranca(cliente.client_id, 'whatsapp')}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {inadimplentes.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum cliente inadimplente 🎉</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernSuperAdminLayout>
  );
};

export default InadimplenciaPage;
