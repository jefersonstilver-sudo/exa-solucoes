/**
 * InvestimentosPage - Gestão de Investimentos (CAPEX)
 * Design neutro, minimalista, sem gradientes
 */

import React, { useEffect, useState } from 'react';
import ModernSuperAdminLayout from '@/components/admin/layout/ModernSuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useInvestimentos, Investimento, NovoInvestimento } from '@/hooks/financeiro/useInvestimentos';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Building2, 
  Clock, 
  CheckCircle2,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

const InvestimentosPage = () => {
  const navigate = useNavigate();
  const basePath = useAdminBasePath();
  const { investimentos, loading, totais, fetchInvestimentos } = useInvestimentos();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  useEffect(() => {
    fetchInvestimentos();
  }, [fetchInvestimentos]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'planejado':
        return { label: 'Planejado', className: 'border-blue-500 text-blue-700 bg-white' };
      case 'em_execucao':
        return { label: 'Em Execução', className: 'border-amber-500 text-amber-700 bg-white' };
      case 'concluido':
        return { label: 'Concluído', className: 'border-emerald-500 text-emerald-700 bg-white' };
      case 'cancelado':
        return { label: 'Cancelado', className: 'border-red-500 text-red-700 bg-white' };
      default:
        return { label: 'Indefinido', className: 'border-gray-300 text-gray-600 bg-white' };
    }
  };

  const filteredInvestimentos = investimentos.filter(inv => {
    const matchesSearch = inv.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <h1 className="text-lg font-semibold text-gray-900">Investimentos</h1>
            <p className="text-sm text-gray-500">Gestão de CAPEX e investimentos estratégicos</p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-white border-l-4 border-l-gray-400">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">Total Investido</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.total)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">Planejado</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.planejado)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">Em Execução</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.emExecucao)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">Retorno Esperado</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.retornoEsperado)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar investimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['todos', 'planejado', 'em_execucao', 'concluido', 'cancelado'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="whitespace-nowrap"
              >
                {status === 'todos' ? 'Todos' : getStatusConfig(status).label}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de Investimentos */}
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                {filteredInvestimentos.length} investimento(s)
              </CardTitle>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Investimento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : filteredInvestimentos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum investimento encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvestimentos.map((inv) => {
                  const statusConfig = getStatusConfig(inv.status);
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{inv.descricao}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(inv.data), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={statusConfig.className}>
                          {statusConfig.label}
                        </Badge>
                        <p className="font-semibold text-gray-900">{formatCurrency(inv.valor)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModernSuperAdminLayout>
  );
};

export default InvestimentosPage;
