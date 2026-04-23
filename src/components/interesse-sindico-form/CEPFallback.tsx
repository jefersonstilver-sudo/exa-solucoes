import React, { useState } from 'react';
import { Loader2, Search } from 'lucide-react';

export interface ViaCEPResult {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

interface Props {
  onResult: (data: ViaCEPResult) => void;
}

export const CEPFallback: React.FC<Props> = ({ onResult }) => {
  const [open, setOpen] = useState(false);
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCEP = (v: string) => {
    const d = v.replace(/\D/g, '').substring(0, 8);
    if (d.length <= 5) return d;
    return `${d.substring(0, 5)}-${d.substring(5)}`;
  };

  const buscar = async () => {
    setError(null);
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      setError('CEP precisa ter 8 dígitos');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await r.json();
      if (data.erro) {
        setError('CEP não encontrado');
      } else {
        onResult({
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          uf: data.uf || '',
          cep: `${digits.substring(0, 5)}-${digits.substring(5)}`,
        });
      }
    } catch {
      setError('Erro ao buscar CEP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-[var(--exa-red,#c7141a)] hover:underline"
        >
          Prefere digitar o CEP?
        </button>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <label className="sif-label" htmlFor="cep-input">CEP</label>
          <div className="flex gap-2">
            <input
              id="cep-input"
              type="text"
              inputMode="numeric"
              value={cep}
              onChange={(e) => setCep(formatCEP(e.target.value))}
              placeholder="00000-000"
              className="sif-input"
            />
            <button type="button" onClick={buscar} disabled={loading} className="sif-btn-secondary px-4 shrink-0">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>
          {error && <p className="sif-error" role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default CEPFallback;
