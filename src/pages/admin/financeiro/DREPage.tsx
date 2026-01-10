import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  FileText,
  DollarSign,
  Minus,
  Equal,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/format';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinanceiroPermissions } from '@/hooks/financeiro/useFinanceiroPermissions';
import { toast } from 'sonner';

interface DREData {
  receita_bruta: number;
  impostos: number;
  custos_operacionais: number;
  despesas_fixas: number;
  despesas_variaveis: number;
  resultado_periodo: number;
}

const DREPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState<DREData | null>(null);
  const [mesAnterior, setMesAnterior] = useState<DREData | null>(null);
  const permissions = useFinanceiroPermissions();

  const fetchDRE = async () => {
    setLoading(true);
    try {
      const hoje = new Date();
      const inicioMesAtual = startOfMonth(hoje);
      const fimMesAtual = endOfMonth(hoje);
      const inicioMesAnterior = startOfMonth(subMonths(hoje, 1));
      const fimMesAnterior = endOfMonth(subMonths(hoje, 1));

      // Buscar dados do mês atual
      const [parcelasAtual, despesasFixasAtual, despesasVariaveisAtual] = await Promise.all([
        supabase
          .from('parcelas')
          .select('valor_final')
          .eq('status', 'pago')
          .gte('data_pagamento', inicioMesAtual.toISOString())
          .lte('data_pagamento', fimMesAtual.toISOString()),
        supabase
          .from('despesas_fixas')
          .select('valor')
          .gte('data_vencimento', inicioMesAtual.toISOString())
          .lte('data_vencimento', fimMesAtual.toISOString()),
        supabase
          .from('despesas_variaveis')
          .select('valor')
          .gte('data_vencimento', inicioMesAtual.toISOString())
          .lte('data_vencimento', fimMesAtual.toISOString())
      ]);

      // Buscar dados do mês anterior
      const [parcelasAnterior, despesasFixasAnterior, despesasVariaveisAnterior] = await Promise.all([
        supabase
          .from('parcelas')
          .select('valor_final')
          .eq('status', 'pago')
          .gte('data_pagamento', inicioMesAnterior.toISOString())
          .lte('data_pagamento', fimMesAnterior.toISOString()),
        supabase
          .from('despesas_fixas')
          .select('valor')
          .gte('data_vencimento', inicioMesAnterior.toISOString())
          .lte('data_vencimento', fimMesAnterior.toISOString()),
        supabase
          .from('despesas_variaveis')
          .select('valor')
          .gte('data_vencimento', inicioMesAnterior.toISOString())
          .lte('data_vencimento', fimMesAnterior.toISOString())
      ]);

      // Calcular DRE mês atual
      const receitaAtual = (parcelasAtual.data || []).reduce((acc: number, p: any) => acc + (p.valor_final || 0), 0);
      const fixasAtual = (despesasFixasAtual.data || []).reduce((acc: number, d: any) => acc + (d.valor || 0), 0);
      const variaveisAtual = (despesasVariaveisAtual.data || []).reduce((acc: number, d: any) => acc + (d.valor || 0), 0);
      const impostosAtual = receitaAtual * 0.0693; // Simples Nacional estimado
      const custosOpAtual = receitaAtual * 0.05; // 5% custos operacionais estimados
      
      setMesAtual({
        receita_bruta: receitaAtual,
        impostos: impostosAtual,
        custos_operacionais: custosOpAtual,
        despesas_fixas: fixasAtual,
        despesas_variaveis: variaveisAtual,
        resultado_periodo: receitaAtual - impostosAtual - custosOpAtual - fixasAtual - variaveisAtual
      });

      // Calcular DRE mês anterior
      const receitaAnterior = (parcelasAnterior.data || []).reduce((acc: number, p: any) => acc + (p.valor_final || 0), 0);
      const fixasAnterior = (despesasFixasAnterior.data || []).reduce((acc: number, d: any) => acc + (d.valor || 0), 0);
      const variaveisAnterior = (despesasVariaveisAnterior.data || []).reduce((acc: number, d: any) => acc + (d.valor || 0), 0);
      const impostosAnterior = receitaAnterior * 0.0693;
      const custosOpAnterior = receitaAnterior * 0.05;
      
      setMesAnterior({
        receita_bruta: receitaAnterior,
        impostos: impostosAnterior,
        custos_operacionais: custosOpAnterior,
        despesas_fixas: fixasAnterior,
        despesas_variaveis: variaveisAnterior,
        resultado_periodo: receitaAnterior - impostosAnterior - custosOpAnterior - fixasAnterior - variaveisAnterior
      });

    } catch (error) {
      console.error('Erro ao buscar DRE:', error);
      toast.error('Erro ao carregar DRE');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDRE();
  }, []);

  const calcularVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / Math.abs(anterior)) * 100;
  };

  const renderLinha = (
    label: string, 
    valorAtual: number, 
    valorAnterior: number, 
    isPositive: boolean = true,
    isTotal: boolean = false,
    icon?: React.ReactNode
  ) => {
    const variacao = calcularVariacao(valorAtual, valorAnterior);
    const variacaoPositiva = isPositive ? variacao >= 0 : variacao <= 0;

    return (
      <div className={`flex items-center justify-between py-4 ${isTotal ? 'border-t-2 border-primary/20 pt-6' : 'border-b border-border/50'}`}>
        <div className="flex items-center gap-3">
          {icon}
          <span className={`${isTotal ? 'font-bold text-lg' : 'font-medium'}`}>{label}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right min-w-[120px]">
            <p className={`${isTotal ? 'text-xl font-bold' : 'text-base font-semibold'} ${
              isTotal && valorAtual >= 0 ? 'text-emerald-600' : isTotal && valorAtual < 0 ? 'text-destructive' : ''
            }`}>
              {formatCurrency(valorAtual)}
            </p>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </div>
          <div className="text-right min-w-[120px] opacity-60">
            <p className="text-sm">{formatCurrency(valorAnterior)}</p>
            <p className="text-xs text-muted-foreground">Mês anterior</p>
          </div>
          <div className="min-w-[80px]">
            <Badge className={`${variacaoPositiva ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
              {variacaoPositiva ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {Math.abs(variacao).toFixed(1)}%
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  if (!permissions.canView) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center">
          <Receipt className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar o DRE.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10">
            <Receipt className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">DRE Gerencial</h1>
            <p className="text-muted-foreground text-sm">
              Demonstrativo de Resultado • {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
        <Button onClick={fetchDRE} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* DRE Card */}
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Demonstrativo de Resultado do Exercício
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {renderLinha(
                '(+) Receita Bruta',
                mesAtual?.receita_bruta || 0,
                mesAnterior?.receita_bruta || 0,
                true,
                false,
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              )}
              {renderLinha(
                '(-) Impostos',
                mesAtual?.impostos || 0,
                mesAnterior?.impostos || 0,
                false,
                false,
                <Minus className="h-4 w-4 text-orange-500" />
              )}
              {renderLinha(
                '(-) Custos Operacionais',
                mesAtual?.custos_operacionais || 0,
                mesAnterior?.custos_operacionais || 0,
                false,
                false,
                <Minus className="h-4 w-4 text-orange-500" />
              )}
              {renderLinha(
                '(-) Despesas Fixas',
                mesAtual?.despesas_fixas || 0,
                mesAnterior?.despesas_fixas || 0,
                false,
                false,
                <Minus className="h-4 w-4 text-orange-500" />
              )}
              {renderLinha(
                '(-) Despesas Variáveis',
                mesAtual?.despesas_variaveis || 0,
                mesAnterior?.despesas_variaveis || 0,
                false,
                false,
                <Minus className="h-4 w-4 text-orange-500" />
              )}
              {renderLinha(
                '(=) Resultado do Período',
                mesAtual?.resultado_periodo || 0,
                mesAnterior?.resultado_periodo || 0,
                true,
                true,
                <Equal className="h-5 w-5 text-primary" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards de Margem */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Margem Bruta</span>
            </div>
            <p className="text-2xl font-bold">
              {mesAtual?.receita_bruta 
                ? (((mesAtual.receita_bruta - mesAtual.custos_operacionais) / mesAtual.receita_bruta) * 100).toFixed(1)
                : '0'}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Margem Operacional</span>
            </div>
            <p className="text-2xl font-bold">
              {mesAtual?.receita_bruta 
                ? (((mesAtual.receita_bruta - mesAtual.custos_operacionais - mesAtual.despesas_fixas - mesAtual.despesas_variaveis) / mesAtual.receita_bruta) * 100).toFixed(1)
                : '0'}%
            </p>
          </CardContent>
        </Card>
        <Card className={`backdrop-blur-sm ${mesAtual?.resultado_periodo && mesAtual.resultado_periodo >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Margem Líquida</span>
            </div>
            <p className={`text-2xl font-bold ${mesAtual?.resultado_periodo && mesAtual.resultado_periodo >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {mesAtual?.receita_bruta 
                ? ((mesAtual.resultado_periodo / mesAtual.receita_bruta) * 100).toFixed(1)
                : '0'}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DREPage;
