/**
 * TabHistorico - Auditoria completa do lançamento
 * READ-ONLY - Exibe timeline de todas as alterações
 */

import React from 'react';
import { 
  Clock, 
  User, 
  Edit3, 
  CheckCircle2, 
  XCircle,
  Tag,
  FileText,
  Mic,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HistoricoEntry } from '../types';

interface TabHistoricoProps {
  historico: HistoricoEntry[];
}

const getActionIcon = (acao: string) => {
  switch (acao) {
    case 'conciliado':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'reconciliado':
      return <XCircle className="h-4 w-4 text-amber-500" />;
    case 'categoria_alterada':
    case 'tipo_receita_alterado':
    case 'recorrencia_alterada':
      return <Tag className="h-4 w-4 text-blue-500" />;
    case 'comprovante_anexado':
    case 'comprovante_removido':
      return <FileText className="h-4 w-4 text-purple-500" />;
    case 'observacao_adicionada':
      return <Edit3 className="h-4 w-4 text-gray-500" />;
    case 'audio_adicionado':
      return <Mic className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
};

const getActionLabel = (acao: string) => {
  switch (acao) {
    case 'conciliado':
      return 'Lançamento conciliado';
    case 'reconciliado':
      return 'Conciliação desfeita';
    case 'categoria_alterada':
      return 'Categoria alterada';
    case 'tipo_receita_alterado':
      return 'Tipo de receita alterado';
    case 'recorrencia_alterada':
      return 'Recorrência alterada';
    case 'comprovante_anexado':
      return 'Comprovante anexado';
    case 'comprovante_removido':
      return 'Comprovante removido';
    case 'observacao_adicionada':
      return 'Observação adicionada';
    case 'audio_adicionado':
      return 'Áudio gravado';
    default:
      return acao;
  }
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return formatValue(parsed);
    } catch {
      return value || '—';
    }
  }
  return String(value);
};

const TabHistorico: React.FC<TabHistoricoProps> = ({ historico }) => {
  if (historico.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nenhuma alteração registrada</p>
          <p className="text-xs text-gray-400 mt-1">
            Todas as alterações serão registradas aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">
          Histórico de Alterações
        </h3>
        <span className="text-xs text-gray-400">
          {historico.length} registro{historico.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-0">
        {historico.map((entry, index) => (
          <div
            key={entry.id}
            className="relative pl-8 pb-6"
          >
            {/* Timeline line */}
            {index < historico.length - 1 && (
              <div className="absolute left-[13px] top-6 bottom-0 w-px bg-gray-200" />
            )}
            
            {/* Timeline icon */}
            <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
              {getActionIcon(entry.acao)}
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {getActionLabel(entry.acao)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <User className="h-3 w-3" />
                <span>{entry.usuario_nome || 'Sistema'}</span>
                <span>•</span>
                <span>
                  {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              {/* Field changes */}
              {entry.campo_alterado && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs">
                  <p className="text-gray-500 mb-1">Campo: {entry.campo_alterado}</p>
                  <div className="flex items-center gap-2">
                    {entry.valor_anterior !== null && entry.valor_anterior !== undefined && (
                      <>
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded">
                          {formatValue(entry.valor_anterior)}
                        </span>
                        <span className="text-gray-400">→</span>
                      </>
                    )}
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded">
                      {formatValue(entry.valor_novo)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer notice */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Este histórico é imutável e não pode ser alterado
        </p>
      </div>
    </div>
  );
};

export default TabHistorico;
