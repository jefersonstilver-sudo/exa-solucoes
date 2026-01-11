/**
 * TabResumo - Visão executiva rápida do lançamento
 * Campos imutáveis, apenas visualização
 */

import React from 'react';
import { 
  Calendar, 
  CreditCard, 
  Building2, 
  Tag, 
  User,
  Wallet,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LancamentoDossie } from '../types';

interface TabResumoProps {
  lancamento: LancamentoDossie;
}

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  muted?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value, muted }) => (
  <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/80 border border-gray-100">
    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-medium ${muted ? 'text-gray-400' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  </div>
);

const TabResumo: React.FC<TabResumoProps> = ({ lancamento }) => {
  const isEntrada = lancamento.tipo === 'entrada';

  return (
    <div className="p-6 space-y-6">
      {/* Description */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
          Descrição
        </h3>
        <p className="text-base text-gray-900 font-medium">
          {lancamento.descricao || 'Sem descrição'}
        </p>
        {lancamento.cliente && (
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {lancamento.cliente}
          </p>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard
          icon={<Wallet className="h-4 w-4" />}
          label="Valor"
          value={
            <span className={isEntrada ? 'text-emerald-600' : 'text-red-600'}>
              {formatCurrency(lancamento.valor)}
            </span>
          }
        />

        <InfoCard
          icon={<Calendar className="h-4 w-4" />}
          label="Data"
          value={format(new Date(lancamento.data), 'dd/MM/yyyy', { locale: ptBR })}
        />

        <InfoCard
          icon={<CreditCard className="h-4 w-4" />}
          label="Método"
          value={lancamento.metodo_pagamento || '—'}
          muted={!lancamento.metodo_pagamento}
        />

        <InfoCard
          icon={<Building2 className="h-4 w-4" />}
          label="Origem"
          value={lancamento.origem?.toUpperCase() || 'Manual'}
        />

        <InfoCard
          icon={<Tag className="h-4 w-4" />}
          label="Categoria"
          value={lancamento.categoria_nome || 'Não categorizado'}
          muted={!lancamento.categoria_nome}
        />

        <InfoCard
          icon={lancamento.conciliado ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          label="Conciliação"
          value={
            lancamento.conciliado ? (
              <span className="text-emerald-600">Conciliado</span>
            ) : (
              <span className="text-amber-600">Pendente</span>
            )
          }
        />
      </div>

      {/* Additional info for ASAAS entries */}
      {lancamento.tipo_receita && (
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Classificação da Receita
          </h3>
          <div className="flex gap-2">
            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              lancamento.tipo_receita === 'fixa' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              Receita {lancamento.tipo_receita === 'fixa' ? 'Fixa' : 'Variável'}
            </span>
            {lancamento.recorrente && (
              <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">
                Recorrente
              </span>
            )}
          </div>
        </div>
      )}

      {/* Status details */}
      {lancamento.status_original && lancamento.status_original !== lancamento.status && (
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
            Status Original
          </h3>
          <p className="text-sm text-gray-600">
            {lancamento.status_original}
          </p>
        </div>
      )}
    </div>
  );
};

export default TabResumo;
