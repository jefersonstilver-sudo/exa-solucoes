import React, { useMemo } from 'react';
import { useSindicoFormStore } from './formStore';
import {
  stepPredioSchema,
  INTERNET_OPS,
  ELEVADOR_EMPRESAS,
  CASA_MAQUINAS,
  INTERNET_OPS_LABELS,
  ELEVADOR_LABELS,
  CASA_MAQUINAS_LABELS,
} from './schema';
import EnderecoAutocomplete, { ParsedAddress } from './EnderecoAutocomplete';
import MiniMapa from './MiniMapa';
import CEPFallback, { ViaCEPResult } from './CEPFallback';
import ChoiceCard from './ChoiceCard';
import { ArrowRight, Info, Wifi, Cog, Building2 } from 'lucide-react';

interface Props {
  onNext: () => void;
}

export const StepPredio: React.FC<Props> = ({ onNext }) => {
  const { predio, setPredio } = useSindicoFormStore();

  const handleAddressSelected = (a: ParsedAddress) => {
    setPredio({
      logradouro: a.logradouro,
      numero: a.numero,
      bairro: a.bairro,
      cidade: a.cidade,
      uf: a.uf,
      cep: a.cep,
      latitude: a.latitude,
      longitude: a.longitude,
      googlePlaceId: a.googlePlaceId,
    });
  };

  const handleCEPResult = (r: ViaCEPResult) => {
    setPredio({
      logradouro: r.logradouro,
      bairro: r.bairro,
      cidade: r.cidade,
      uf: r.uf,
      cep: r.cep,
      latitude: null,
      longitude: null,
    });
  };

  const toggleInternet = (op: typeof INTERNET_OPS[number]) => {
    const cur = predio.internetOps || [];
    setPredio({
      internetOps: cur.includes(op) ? cur.filter((o) => o !== op) : [...cur, op],
    });
  };

  const validation = useMemo(() => stepPredioSchema.safeParse(predio), [predio]);
  const isValid = validation.success;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Dados do prédio</h2>
        <p className="text-sm text-white/55 mt-1">Vamos identificar o local da instalação.</p>
      </div>

      {/* Nome */}
      <div>
        <label className="sif-label" htmlFor="nomePredio">Nome do prédio</label>
        <input
          id="nomePredio"
          type="text"
          className="sif-input"
          value={predio.nomePredio || ''}
          onChange={(e) => setPredio({ nomePredio: e.target.value })}
          placeholder="Ex: Edifício Itaipu"
          maxLength={120}
        />
      </div>

      {/* Endereço Google + CEP fallback */}
      <div>
        <EnderecoAutocomplete onSelect={handleAddressSelected} />
        <CEPFallback onResult={handleCEPResult} />
      </div>

      {/* Mini-mapa */}
      {predio.latitude && predio.longitude && (
        <MiniMapa lat={predio.latitude} lng={predio.longitude} />
      )}

      {/* Campos editáveis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="sif-label" htmlFor="logradouro">Logradouro</label>
          <input id="logradouro" type="text" className="sif-input"
            value={predio.logradouro || ''} onChange={(e) => setPredio({ logradouro: e.target.value })} />
        </div>
        <div>
          <label className="sif-label" htmlFor="numero">Número</label>
          <input id="numero" type="text" inputMode="numeric" className="sif-input"
            value={predio.numero || ''} onChange={(e) => setPredio({ numero: e.target.value })} />
        </div>
        <div>
          <label className="sif-label" htmlFor="complemento">Complemento (opcional)</label>
          <input id="complemento" type="text" className="sif-input"
            value={predio.complemento || ''} onChange={(e) => setPredio({ complemento: e.target.value })} />
        </div>
        <div>
          <label className="sif-label" htmlFor="bairro">Bairro</label>
          <input id="bairro" type="text" className="sif-input"
            value={predio.bairro || ''} onChange={(e) => setPredio({ bairro: e.target.value })} />
        </div>
        <div>
          <label className="sif-label" htmlFor="cep">CEP</label>
          <input id="cep" type="text" inputMode="numeric" className="sif-input"
            value={predio.cep || ''} onChange={(e) => setPredio({ cep: e.target.value })} placeholder="00000-000" />
        </div>
        <div className="sm:col-span-2 grid grid-cols-[1fr_80px] gap-3">
          <div>
            <label className="sif-label" htmlFor="cidade">Cidade</label>
            <input id="cidade" type="text" className="sif-input"
              value={predio.cidade || ''} onChange={(e) => setPredio({ cidade: e.target.value })} />
          </div>
          <div>
            <label className="sif-label" htmlFor="uf">UF</label>
            <input id="uf" type="text" maxLength={2} className="sif-input uppercase"
              value={predio.uf || ''} onChange={(e) => setPredio({ uf: e.target.value.toUpperCase() })} />
          </div>
        </div>
      </div>

      {/* Números do prédio */}
      <div>
        <h3 className="text-sm font-semibold text-white/85 mb-3 flex items-center gap-2">
          <Building2 size={16} className="text-[var(--exa-red,#c7141a)]" /> Estrutura
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="sif-label" htmlFor="andares">Andares</label>
            <input id="andares" type="number" inputMode="numeric" min={2} className="sif-input"
              value={predio.andares ?? ''} onChange={(e) => setPredio({ andares: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
          <div>
            <label className="sif-label" htmlFor="blocos">Blocos</label>
            <input id="blocos" type="number" inputMode="numeric" min={1} className="sif-input"
              value={predio.blocos ?? 1} onChange={(e) => setPredio({ blocos: Number(e.target.value) })} />
          </div>
          <div>
            <label className="sif-label" htmlFor="unidades">Unidades totais</label>
            <input id="unidades" type="number" inputMode="numeric" min={1} className="sif-input"
              value={predio.unidades ?? ''} onChange={(e) => setPredio({ unidades: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
          <div>
            <label className="sif-label" htmlFor="elevadoresSociais">Elevadores sociais</label>
            <input id="elevadoresSociais" type="number" inputMode="numeric" min={1} className="sif-input"
              value={predio.elevadoresSociais ?? ''} onChange={(e) => setPredio({ elevadoresSociais: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
        </div>
      </div>

      {/* Internet (multi) */}
      <div>
        <h3 className="text-sm font-semibold text-white/85 mb-3 flex items-center gap-2">
          <Wifi size={16} className="text-[var(--exa-red,#c7141a)]" /> Operadoras de internet disponíveis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="group" aria-label="Operadoras de internet">
          {INTERNET_OPS.map((op) => (
            <ChoiceCard
              key={op}
              type="checkbox"
              selected={(predio.internetOps || []).includes(op)}
              onClick={() => toggleInternet(op)}
              label={INTERNET_OPS_LABELS[op]}
            />
          ))}
        </div>
      </div>

      {/* Elevador (radio) */}
      <div>
        <h3 className="text-sm font-semibold text-white/85 mb-3 flex items-center gap-2">
          <Cog size={16} className="text-[var(--exa-red,#c7141a)]" /> Empresa de manutenção do elevador
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Empresa de elevador">
          {ELEVADOR_EMPRESAS.map((emp) => (
            <ChoiceCard
              key={emp}
              selected={predio.elevadorEmpresa === emp}
              onClick={() => setPredio({ elevadorEmpresa: emp })}
              label={ELEVADOR_LABELS[emp]}
            />
          ))}
        </div>
      </div>

      {/* Casa de máquinas */}
      <div>
        <h3 className="text-sm font-semibold text-white/85 mb-3">Casa de máquinas</h3>
        <div className="space-y-2" role="radiogroup" aria-label="Casa de máquinas">
          {CASA_MAQUINAS.map((c) => (
            <ChoiceCard
              key={c}
              selected={predio.casaMaquinas === c}
              onClick={() => setPredio({ casaMaquinas: c })}
              label={CASA_MAQUINAS_LABELS[c]}
            />
          ))}
        </div>
        <div className="sif-info-box mt-3 flex gap-2">
          <Info size={16} className="text-[var(--exa-red,#c7141a)] shrink-0 mt-0.5" />
          <p>
            <strong className="text-white/90">Por que perguntamos?</strong> A EXA precisa saber onde vai instalar o
            modem da operadora de internet contratada. Com casa de máquinas, instalação é padrão. Sem casa de máquinas,
            usamos um gabinete específico resistente a umidade.
          </p>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          aria-disabled={!isValid}
          className="sif-btn-primary w-full flex items-center justify-center gap-2"
        >
          Continuar <ArrowRight size={18} />
        </button>
        {!isValid && (
          <p className="sif-help text-center mt-2">Preencha todos os campos obrigatórios para continuar.</p>
        )}
      </div>
    </div>
  );
};

export default StepPredio;
