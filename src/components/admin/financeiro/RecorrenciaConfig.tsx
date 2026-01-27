import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Repeat, CalendarClock, TrendingUp, Bell } from 'lucide-react';

export type RecorrenciaTipo = 'infinita' | 'limitada' | 'personalizada';
export type ReajusteTipo = 'nenhum' | 'ipca' | 'igpm' | 'fixo';
export type Periodicidade = 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';

const DIAS_SEMANA = [
  { value: 'seg', label: 'Seg' },
  { value: 'ter', label: 'Ter' },
  { value: 'qua', label: 'Qua' },
  { value: 'qui', label: 'Qui' },
  { value: 'sex', label: 'Sex' },
  { value: 'sab', label: 'Sáb' },
  { value: 'dom', label: 'Dom' },
];

export interface RecorrenciaConfigData {
  recorrencia_tipo: RecorrenciaTipo;
  total_parcelas: number | null;
  intervalo_dias: number | null;
  dias_semana: string[];
  lembrete_dias: number;
  reajuste_tipo: ReajusteTipo;
  reajuste_percentual: number | null;
}

interface RecorrenciaConfigProps {
  config: RecorrenciaConfigData;
  onChange: (config: RecorrenciaConfigData) => void;
  periodicidade: Periodicidade;
  className?: string;
}

export const RecorrenciaConfig: React.FC<RecorrenciaConfigProps> = ({
  config,
  onChange,
  periodicidade,
  className = '',
}) => {
  const updateConfig = (updates: Partial<RecorrenciaConfigData>) => {
    onChange({ ...config, ...updates });
  };

  const toggleDiaSemana = (dia: string) => {
    const dias = config.dias_semana.includes(dia)
      ? config.dias_semana.filter(d => d !== dia)
      : [...config.dias_semana, dia];
    updateConfig({ dias_semana: dias });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tipo de Recorrência */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <Repeat className="h-3.5 w-3.5" />
          Tipo de Recorrência
        </Label>
        <div className="flex gap-2">
          {(['infinita', 'limitada', 'personalizada'] as RecorrenciaTipo[]).map((tipo) => (
            <Badge
              key={tipo}
              variant={config.recorrencia_tipo === tipo ? 'default' : 'outline'}
              className={`cursor-pointer flex-1 justify-center py-2 text-xs capitalize transition-all ${
                config.recorrencia_tipo === tipo
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
              }`}
              onClick={() => updateConfig({ recorrencia_tipo: tipo })}
            >
              {tipo}
            </Badge>
          ))}
        </div>
      </div>

      {/* Se Limitada - Número de Parcelas */}
      {config.recorrencia_tipo === 'limitada' && (
        <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Label htmlFor="total-parcelas" className="text-sm font-medium text-blue-700">
            Número de Parcelas
          </Label>
          <Input
            id="total-parcelas"
            type="number"
            min={1}
            max={120}
            value={config.total_parcelas || ''}
            onChange={(e) => updateConfig({ total_parcelas: parseInt(e.target.value) || null })}
            placeholder="Ex: 12"
            className="bg-white border-blue-200"
          />
          <p className="text-xs text-blue-600">
            A despesa será encerrada após {config.total_parcelas || 'X'} parcela(s).
          </p>
        </div>
      )}

      {/* Se Personalizada - Intervalo em Dias */}
      {config.recorrencia_tipo === 'personalizada' && (
        <div className="space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
          <Label htmlFor="intervalo-dias" className="text-sm font-medium text-purple-700">
            A cada quantos dias?
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-purple-600">A cada</span>
            <Input
              id="intervalo-dias"
              type="number"
              min={1}
              max={365}
              value={config.intervalo_dias || ''}
              onChange={(e) => updateConfig({ intervalo_dias: parseInt(e.target.value) || null })}
              placeholder="45"
              className="w-20 bg-white border-purple-200"
            />
            <span className="text-sm text-purple-600">dias</span>
          </div>
        </div>
      )}

      {/* Se Semanal - Dias da Semana */}
      {periodicidade === 'semanal' && (
        <div className="space-y-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <Label className="text-sm font-medium text-amber-700">
            Dias da Semana (opcional)
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {DIAS_SEMANA.map((dia) => (
              <Badge
                key={dia.value}
                variant={config.dias_semana.includes(dia.value) ? 'default' : 'outline'}
                className={`cursor-pointer px-3 py-1.5 text-xs transition-all ${
                  config.dias_semana.includes(dia.value)
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-white hover:bg-amber-100 text-gray-700 border-amber-200'
                }`}
                onClick={() => toggleDiaSemana(dia.value)}
              >
                {dia.label}
              </Badge>
            ))}
          </div>
          {config.dias_semana.length > 0 && (
            <p className="text-xs text-amber-600">
              Parcelas serão geradas em: {config.dias_semana.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Lembrete */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <Bell className="h-3.5 w-3.5" />
          Lembrete antes do vencimento
        </Label>
        <Select
          value={String(config.lembrete_dias)}
          onValueChange={(v) => updateConfig({ lembrete_dias: parseInt(v) })}
        >
          <SelectTrigger className="bg-gray-50 border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Sem lembrete</SelectItem>
            <SelectItem value="1">1 dia antes</SelectItem>
            <SelectItem value="3">3 dias antes</SelectItem>
            <SelectItem value="5">5 dias antes</SelectItem>
            <SelectItem value="7">1 semana antes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reajuste Automático */}
      <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5" />
          Reajuste Automático (opcional)
        </Label>
        <Select
          value={config.reajuste_tipo}
          onValueChange={(v) => updateConfig({ reajuste_tipo: v as ReajusteTipo })}
        >
          <SelectTrigger className="bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nenhum">Sem reajuste</SelectItem>
            <SelectItem value="ipca">IPCA (anual)</SelectItem>
            <SelectItem value="igpm">IGP-M (anual)</SelectItem>
            <SelectItem value="fixo">Percentual fixo</SelectItem>
          </SelectContent>
        </Select>

        {config.reajuste_tipo === 'fixo' && (
          <div className="flex items-center gap-2 mt-2">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={config.reajuste_percentual || ''}
              onChange={(e) => updateConfig({ reajuste_percentual: parseFloat(e.target.value) || null })}
              placeholder="5.00"
              className="w-24 bg-white border-gray-200"
            />
            <span className="text-sm text-gray-600">% ao ano</span>
          </div>
        )}

        {config.reajuste_tipo !== 'nenhum' && (
          <p className="text-xs text-gray-500">
            O valor será reajustado automaticamente na data de aniversário da despesa.
          </p>
        )}
      </div>
    </div>
  );
};
