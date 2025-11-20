import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, TrendingDown, AlertTriangle } from 'lucide-react';

export const RelatorioIRIS = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Indicadores de Risco
            </CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Em breve</div>
            <p className="text-xs text-muted-foreground mt-1">
              Análise de riscos operacionais
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Moral dos Síndicos
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Em breve</div>
            <p className="text-xs text-muted-foreground mt-1">
              Score médio de satisfação
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Situações Críticas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Em breve</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requer atenção executiva
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            O dashboard executivo da IRIS incluirá métricas de alto nível,
            análise de tendências e insights estratégicos sobre o relacionamento
            com síndicos e qualidade do atendimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
