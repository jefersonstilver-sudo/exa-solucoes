/**
 * TabOrigem - Detalhes da origem e conciliação
 * Exibe dados do ASAAS ou despesa original
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  CheckCircle2, 
  XCircle,
  Link2,
  Calendar,
  User,
  CreditCard,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LancamentoDossie } from '../types';

interface TabOrigemProps {
  lancamento: LancamentoDossie;
  onConciliar: () => void;
  onReconciliar: () => void;
  saving?: boolean;
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  </div>
);

const TabOrigem: React.FC<TabOrigemProps> = ({
  lancamento,
  onConciliar,
  onReconciliar,
  saving
}) => {
  const isAsaas = lancamento.origem === 'asaas' || lancamento.origem === 'asaas_saida';
  const isDespesa = lancamento.origem === 'despesa' || lancamento.origem === 'assinatura';

  return (
    <div className="p-6 space-y-6">
      {/* Origin Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Origem do Lançamento</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {isAsaas ? 'Transação importada do ASAAS' : 
             isDespesa ? 'Parcela de despesa/assinatura' : 
             'Lançamento manual'}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {lancamento.origem?.toUpperCase()}
        </Badge>
      </div>

      {/* ASAAS Details */}
      {isAsaas && lancamento.origem_id && (
        <div className="space-y-0 bg-gray-50 rounded-xl p-4">
          <DetailRow
            icon={<Hash className="h-4 w-4 text-gray-400" />}
            label="ID ASAAS"
            value={
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {lancamento.origem_id}
              </code>
            }
          />

          {lancamento.cliente && (
            <DetailRow
              icon={<User className="h-4 w-4 text-gray-400" />}
              label="Cliente"
              value={lancamento.cliente}
            />
          )}

          <DetailRow
            icon={<Calendar className="h-4 w-4 text-gray-400" />}
            label="Data do Pagamento"
            value={format(new Date(lancamento.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          />

          {lancamento.metodo_pagamento && (
            <DetailRow
              icon={<CreditCard className="h-4 w-4 text-gray-400" />}
              label="Método"
              value={lancamento.metodo_pagamento}
            />
          )}

          {lancamento.status_original && (
            <DetailRow
              icon={<CheckCircle2 className="h-4 w-4 text-gray-400" />}
              label="Status Original"
              value={lancamento.status_original}
            />
          )}

          <div className="pt-4 mt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              asChild
            >
              <a
                href={`https://www.asaas.com/customerPayment/view/${lancamento.origem_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver no ASAAS
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Despesa Details */}
      {isDespesa && (
        <div className="space-y-0 bg-gray-50 rounded-xl p-4">
          <DetailRow
            icon={<Hash className="h-4 w-4 text-gray-400" />}
            label="ID da Parcela"
            value={
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {lancamento.id}
              </code>
            }
          />

          <DetailRow
            icon={<Calendar className="h-4 w-4 text-gray-400" />}
            label="Data de Vencimento"
            value={format(new Date(lancamento.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          />

          {lancamento.descricao && (
            <DetailRow
              icon={<Link2 className="h-4 w-4 text-gray-400" />}
              label="Descrição"
              value={lancamento.descricao}
            />
          )}
        </div>
      )}

      {/* Conciliation Status */}
      <div className="pt-4 border-t">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Conciliação</h3>
        
        {lancamento.conciliado ? (
          <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">Lançamento Conciliado</p>
                {lancamento.conciliado_at && (
                  <p className="text-xs text-emerald-600">
                    em {format(new Date(lancamento.conciliado_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReconciliar}
              disabled={saving}
              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
            >
              Desfazer
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700">Pendente de Conciliação</p>
                <p className="text-xs text-amber-600">
                  Confirme com o extrato bancário
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={onConciliar}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Conciliar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabOrigem;
