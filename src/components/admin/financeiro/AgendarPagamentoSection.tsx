import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Clock, CheckCircle2 } from 'lucide-react';

export type ModoAcao = 'pagar_agora' | 'agendar';

interface AgendarPagamentoSectionProps {
  modoAcao: ModoAcao;
  onModoChange: (modo: ModoAcao) => void;
  dataAgendada: string;
  onDataAgendadaChange: (data: string) => void;
  autoPagar: boolean;
  onAutoPagarChange: (auto: boolean) => void;
  className?: string;
}

export const AgendarPagamentoSection: React.FC<AgendarPagamentoSectionProps> = ({
  modoAcao,
  onModoChange,
  dataAgendada,
  onDataAgendadaChange,
  autoPagar,
  onAutoPagarChange,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Seleção de modo */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Ação</Label>
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onModoChange('pagar_agora')}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              modoAcao === 'pagar_agora'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CheckCircle2 className={`h-5 w-5 ${modoAcao === 'pagar_agora' ? 'text-emerald-600' : 'text-gray-400'}`} />
            <div>
              <p className="font-medium text-sm">Pagar Agora</p>
              <p className="text-xs text-gray-500">Registrar como pago</p>
            </div>
          </div>
          <div
            onClick={() => onModoChange('agendar')}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              modoAcao === 'agendar'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CalendarClock className={`h-5 w-5 ${modoAcao === 'agendar' ? 'text-blue-600' : 'text-gray-400'}`} />
            <div>
              <p className="font-medium text-sm">Agendar</p>
              <p className="text-xs text-gray-500">Pagar em data futura</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campos de agendamento */}
      {modoAcao === 'agendar' && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="space-y-2">
            <Label htmlFor="data-agendada" className="text-sm font-medium text-blue-700 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Data do Pagamento Agendado
            </Label>
            <Input
              id="data-agendada"
              type="date"
              value={dataAgendada}
              onChange={(e) => onDataAgendadaChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="bg-white border-blue-200"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={autoPagar}
                onCheckedChange={(checked) => onAutoPagarChange(!!checked)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Marcar como pago automaticamente
                </p>
                <p className="text-xs text-blue-600">
                  O sistema marcará a conta como paga na data agendada.
                </p>
              </div>
            </label>

            {!autoPagar && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                <Clock className="h-4 w-4 text-amber-600" />
                <p className="text-xs text-amber-700">
                  Você receberá um lembrete na data para confirmar o pagamento.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
