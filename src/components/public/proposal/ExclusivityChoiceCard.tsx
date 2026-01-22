import React from 'react';
import { Card } from '@/components/ui/card';
import { Shield, Users, Check, Crown, Lock, Star } from 'lucide-react';

interface ExclusivityChoiceCardProps {
  segmento: string;
  valorNormal: number;
  valorComExclusividade: number;
  fidelidadeNormal: number;
  fidelidadeComExclusividade: number;
  percentualExtra: number;
  durationMonths: number;
  escolhido: boolean | null;
  onChoose: (escolheuExclusividade: boolean) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function ExclusivityChoiceCard({
  segmento,
  valorNormal,
  valorComExclusividade,
  fidelidadeNormal,
  fidelidadeComExclusividade,
  percentualExtra,
  durationMonths,
  escolhido,
  onChoose,
}: ExclusivityChoiceCardProps) {
  return (
    <Card className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] rounded-lg">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-800">
            Exclusividade de Segmento Disponível
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-500">
            Bloqueie concorrentes do segmento <strong className="text-[#9C1E1E]">{segmento}</strong>
          </p>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Option 1: Standard */}
        <div
          onClick={() => onChoose(false)}
          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
            escolhido === false
              ? 'border-slate-600 bg-slate-50 shadow-md'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          {escolhido === false && (
            <div className="absolute -top-2 -right-2 p-1 bg-slate-600 rounded-full">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-slate-500" />
            <span className="font-semibold text-sm text-slate-700">Proposta Padrão</span>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Fidelidade</p>
              <p className="text-lg font-bold text-slate-700">
                {formatCurrency(fidelidadeNormal)}<span className="text-xs font-normal text-slate-400">/mês</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase">À Vista ({durationMonths}x)</p>
              <p className="text-sm font-semibold text-slate-600">
                {formatCurrency(valorNormal)}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Concorrentes podem anunciar nos mesmos prédios
            </p>
          </div>
        </div>

        {/* Option 2: With Exclusivity */}
        <div
          onClick={() => onChoose(true)}
          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
            escolhido === true
              ? 'border-[#9C1E1E] bg-gradient-to-br from-red-50 to-white shadow-lg'
              : 'border-slate-200 hover:border-[#9C1E1E]/50 bg-white'
          }`}
        >
          {/* Badge Recommended */}
          <div className="absolute -top-2 left-3 bg-gradient-to-r from-[#9C1E1E] to-[#7D1818] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star className="h-2.5 w-2.5" />
            RECOMENDADO
          </div>

          {escolhido === true && (
            <div className="absolute -top-2 -right-2 p-1 bg-[#9C1E1E] rounded-full">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-3 mt-2">
            <Crown className="h-4 w-4 text-[#9C1E1E]" />
            <span className="font-semibold text-sm text-[#7D1818]">Com Exclusividade</span>
            <span className="text-[9px] bg-[#9C1E1E]/10 text-[#9C1E1E] px-1.5 py-0.5 rounded font-medium">
              +{percentualExtra}%
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-[#9C1E1E]/60 uppercase">Fidelidade</p>
              <p className="text-lg font-bold text-[#9C1E1E]">
                {formatCurrency(fidelidadeComExclusividade)}<span className="text-xs font-normal text-[#9C1E1E]/60">/mês</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#9C1E1E]/60 uppercase">À Vista ({durationMonths}x)</p>
              <p className="text-sm font-semibold text-[#7D1818]">
                {formatCurrency(valorComExclusividade)}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#9C1E1E]/10 space-y-1">
            <p className="text-[10px] text-[#7D1818] flex items-center gap-1 font-medium">
              <Lock className="h-3 w-3" />
              Segmento "{segmento}" BLOQUEADO
            </p>
            <p className="text-[10px] text-[#9C1E1E]/70 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Concorrentes impedidos de anunciar
            </p>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
        <p className="text-[10px] sm:text-xs text-slate-500 text-center">
          💡 A exclusividade garante que <strong>nenhum concorrente</strong> do seu segmento anuncie nos mesmos prédios durante sua campanha.
        </p>
      </div>
    </Card>
  );
}
