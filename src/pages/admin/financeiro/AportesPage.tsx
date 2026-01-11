/**
 * AportesPage - Histórico de Aportes de Sócios
 * READ-ONLY com opção de registrar novo (INSERT only)
 * Design neutro, minimalista
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAportes, AporteSocio } from '@/hooks/financeiro/useAportes';
import { 
  Users, 
  Plus, 
  ArrowLeft,
  Wallet,
  HandCoins,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

const AportesPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const { aportes, loading, totais, porSocio, fetchAportes } = useAportes();
  const [tipoFilter, setTipoFilter] = useState<string>('todos');

  useEffect(() => {
    fetchAportes();
  }, [fetchAportes]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTipoConfig = (tipo: string) => {
    switch (tipo) {
      case 'capital':
        return { 
          label: 'Capital', 
          icon: Wallet,
          className: 'border-emerald-500 text-emerald-700 bg-white' 
        };
      case 'emprestimo':
        return { 
          label: 'Empréstimo', 
          icon: HandCoins,
          className: 'border-blue-500 text-blue-700 bg-white' 
        };
      case 'reinvestimento':
        return { 
          label: 'Reinvestimento', 
          icon: RefreshCw,
          className: 'border-purple-500 text-purple-700 bg-white' 
        };
      default:
        return { 
          label: tipo, 
          icon: Wallet,
          className: 'border-gray-300 text-gray-600 bg-white' 
        };
    }
  };

  const filteredAportes = aportes.filter(a => {
    return tipoFilter === 'todos' || a.tipo === tipoFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(buildPath('financeiro'))}
          className="h-9 w-9 rounded-xl bg-white/60 hover:bg-white border border-gray-200/50 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Aportes de Sócios</h1>
          <p className="text-sm text-gray-500">Histórico imutável de capital investido</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white shadow-sm border-l-4 border-l-gray-300">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Total Aportado</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.total)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Capital</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.capital)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Empréstimos</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.emprestimo)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Reinvestimento</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totais.reinvestimento)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por Sócio */}
      {Object.keys(porSocio).length > 0 && (
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Por Sócio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(porSocio).map(([nome, valores]) => (
                <div key={nome} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <p className="font-medium text-gray-900 mb-2">{nome}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-emerald-600">Capital: {formatCurrency(valores.capital)}</span>
                    <span className="text-blue-600">Emp: {formatCurrency(valores.emprestimo)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {['todos', 'capital', 'emprestimo', 'reinvestimento'].map((tipo) => (
          <Button
            key={tipo}
            variant={tipoFilter === tipo ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTipoFilter(tipo)}
            className={`whitespace-nowrap h-9 ${tipoFilter !== tipo ? 'bg-white' : ''}`}
          >
            {tipo === 'todos' ? 'Todos' : getTipoConfig(tipo).label}
          </Button>
        ))}
      </div>

      {/* Lista de Aportes */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              {filteredAportes.length} aporte(s) registrado(s)
            </CardTitle>
            <Button size="sm" className="gap-2 h-9 shadow-sm">
              <Plus className="h-4 w-4" />
              Registrar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : filteredAportes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum aporte registrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAportes.map((aporte) => {
                const tipoConfig = getTipoConfig(aporte.tipo);
                const IconComponent = tipoConfig.icon;
                return (
                  <div
                    key={aporte.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{aporte.motivo}</p>
                        <p className="text-sm text-gray-500">
                          {aporte.socio_nome || 'Sócio não identificado'} • {format(new Date(aporte.data), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={tipoConfig.className}>
                        {tipoConfig.label}
                      </Badge>
                      <p className="font-semibold text-emerald-600">+{formatCurrency(aporte.valor)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nota de Imutabilidade */}
      <p className="text-xs text-gray-400 text-center">
        Aportes são registros imutáveis e não podem ser editados ou excluídos após criação.
      </p>
    </div>
  );
};

export default AportesPage;
