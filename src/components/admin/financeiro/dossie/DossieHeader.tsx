/**
 * DossieHeader - Header fixo do Dossiê Financeiro
 * Exibe informações imutáveis e ações principais
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ArrowUpCircle, 
  ArrowDownCircle,
  CheckCircle2,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LancamentoDossie } from './types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DossieHeaderProps {
  lancamento: LancamentoDossie;
  onClose: () => void;
  onConciliar: () => void;
  saving?: boolean;
}

const DossieHeader: React.FC<DossieHeaderProps> = ({
  lancamento,
  onClose,
  onConciliar,
  saving
}) => {
  const isEntrada = lancamento.tipo === 'entrada';
  const isAsaas = lancamento.origem === 'asaas' || lancamento.origem === 'asaas_saida';

  const getOrigemLabel = () => {
    switch (lancamento.origem) {
      case 'asaas': return 'ASAAS';
      case 'asaas_saida': return 'ASAAS Saída';
      case 'despesa': return 'Despesa';
      case 'assinatura': return 'Assinatura';
      case 'manual': return 'Manual';
      default: return lancamento.origem;
    }
  };

  const getStatusColor = () => {
    if (lancamento.conciliado) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (lancamento.status === 'realizado') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  const getStatusLabel = () => {
    if (lancamento.conciliado) return 'Conciliado';
    if (lancamento.status === 'realizado') return 'Realizado';
    return 'Pendente';
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b">
      {/* Top bar with close and actions */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Fechar</span>
        </button>

        <div className="flex items-center gap-2">
          {!lancamento.conciliado && (
            <Button
              onClick={onConciliar}
              disabled={saving}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Conciliar
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {lancamento.conciliado && (
                <DropdownMenuItem onClick={onConciliar}>
                  Desfazer conciliação
                </DropdownMenuItem>
              )}
              {isAsaas && lancamento.origem_id && (
                <DropdownMenuItem asChild>
                  <a 
                    href={`https://www.asaas.com/customerPayment/view/${lancamento.origem_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver no ASAAS
                  </a>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main header content */}
      <div className="px-6 py-5">
        {/* Type indicator */}
        <div className="flex items-center gap-2 mb-3">
          {isEntrada ? (
            <div className="flex items-center gap-1.5 text-emerald-600">
              <ArrowUpCircle className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Entrada</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-red-600">
              <ArrowDownCircle className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Saída</span>
            </div>
          )}
        </div>

        {/* Value and date */}
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className={`text-3xl font-bold tracking-tight ${isEntrada ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(lancamento.valor)}
            </h2>
            {lancamento.valor_liquido && lancamento.valor_liquido !== lancamento.valor && (
              <p className="text-sm text-gray-500 mt-0.5">
                Líquido: {formatCurrency(lancamento.valor_liquido)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-medium text-gray-900">
              {format(new Date(lancamento.data), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(lancamento.data), "EEEE", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={getStatusColor()}>
            {getStatusLabel()}
          </Badge>
          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
            {getOrigemLabel()}
          </Badge>
          {lancamento.metodo_pagamento && (
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
              {lancamento.metodo_pagamento}
            </Badge>
          )}
          {lancamento.recorrente && (
            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
              Recorrente
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default DossieHeader;
