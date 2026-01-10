import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import { useFluxoCaixa } from '@/hooks/financeiro/useFluxoCaixa';
import { useFinanceiroPermissions } from '@/hooks/financeiro/useFinanceiroPermissions';
import { formatCurrency } from '@/utils/format';

const FluxoCaixaPage: React.FC = () => {
  const { loading, resumo, projecao30d, projecao60d, projecao90d, fetchFluxoCaixa, gerarFluxoDespesasFixas } = useFluxoCaixa();
  const permissions = useFinanceiroPermissions();
  const [periodo, setPeriodo] = useState<'30' | '60' | '90'>('30');

  useEffect(() => {
    if (permissions.canView) {
      fetchFluxoCaixa();
    }
  }, [permissions.canView]);

  const projecaoAtual = periodo === '30' ? projecao30d : periodo === '60' ? projecao60d : projecao90d;

  const totalEntradas = projecaoAtual.reduce((sum, p) => sum + p.entradas, 0);
  const totalSaidas = projecaoAtual.reduce((sum, p) => sum + p.saidas, 0);
  const saldoFinal = projecaoAtual.length > 0 ? projecaoAtual[projecaoAtual.length - 1]?.saldoAcumulado || 0 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Minimalista */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Fluxo de Caixa</h1>
            <p className="text-sm text-gray-500">Projeção de entradas e saídas</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={gerarFluxoDespesasFixas} 
              variant="ghost" 
              size="sm"
              className="text-gray-600 hover:text-gray-900 hover:bg-white/60"
            >
              Atualizar Despesas
            </Button>
            <Button 
              onClick={() => fetchFluxoCaixa()} 
              disabled={loading} 
              variant="ghost" 
              size="sm"
              className="text-gray-600 hover:text-gray-900 hover:bg-white/60"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Cards de Resumo - Glassmorphism */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Saldo Atual */}
          <div className={`
            backdrop-blur-sm bg-white/70 rounded-2xl p-4 
            border border-white/50 shadow-sm
            ${resumo.saldoAtual >= 0 ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500'}
          `}>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">Saldo Atual</span>
            </div>
            <p className={`text-2xl font-bold ${resumo.saldoAtual >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatCurrency(resumo.saldoAtual)}
            </p>
          </div>

          {/* Entradas Projetadas */}
          <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-4 border border-white/50 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-gray-500 font-medium">Entradas</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(resumo.entradasProjetadas)}
            </p>
          </div>

          {/* Saídas Projetadas */}
          <div className="backdrop-blur-sm bg-white/70 rounded-2xl p-4 border border-white/50 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-xs text-gray-500 font-medium">Saídas</span>
            </div>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(resumo.saidasProjetadas)}
            </p>
          </div>

          {/* Saldo Projetado */}
          <div className={`
            backdrop-blur-sm bg-white/70 rounded-2xl p-4 
            border border-white/50 shadow-sm
            ${resumo.saldoProjetado >= 0 ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-amber-500'}
          `}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">Saldo Projetado</span>
            </div>
            <p className={`text-2xl font-bold ${resumo.saldoProjetado >= 0 ? 'text-gray-900' : 'text-amber-600'}`}>
              {formatCurrency(resumo.saldoProjetado)}
            </p>
          </div>
        </div>

        {/* Projeção por Período - Card Glass */}
        <div className="backdrop-blur-sm bg-white/70 rounded-2xl border border-white/50 shadow-sm overflow-hidden">
          {/* Header com Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Projeção de Caixa</h2>
            
            {/* Period Selector Pills */}
            <div className="flex gap-1 p-1 bg-gray-100/80 rounded-xl">
              {(['30', '60', '90'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg transition-all
                    ${periodo === p 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'}
                  `}
                >
                  {p} dias
                </button>
              ))}
            </div>
          </div>

          {/* Resumo do Período */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50/50">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total Entradas</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalEntradas)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total Saídas</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(totalSaidas)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Saldo Final</p>
              <p className={`text-lg font-bold ${saldoFinal >= 0 ? 'text-gray-900' : 'text-amber-600'}`}>
                {formatCurrency(saldoFinal)}
              </p>
            </div>
          </div>

          {/* Lista de Movimentações */}
          <div className="p-4">
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
              {projecaoAtual.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-gray-100/50 hover:bg-white/80 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(item.data).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'short' 
                    })}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    {item.entradas > 0 && (
                      <span className="text-emerald-600 font-medium">
                        +{formatCurrency(item.entradas)}
                      </span>
                    )}
                    {item.saidas > 0 && (
                      <span className="text-red-600 font-medium">
                        -{formatCurrency(item.saidas)}
                      </span>
                    )}
                    <span className={`font-bold min-w-24 text-right ${
                      item.saldoAcumulado >= 0 ? 'text-gray-900' : 'text-amber-600'
                    }`}>
                      {formatCurrency(item.saldoAcumulado)}
                    </span>
                  </div>
                </div>
              ))}
              
              {projecaoAtual.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-gray-400 text-sm">Nenhuma movimentação projetada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FluxoCaixaPage;
