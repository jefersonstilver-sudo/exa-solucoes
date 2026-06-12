import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, X, Building2, CheckCircle2 } from 'lucide-react';

const CARACTERISTICAS_OPCOES = [
  'Piscina', 'Academia', 'Churrasqueira', 'Playground', 'Salão de festas',
  'Quadra poliesportiva', 'Espaço gourmet', 'Brinquedoteca', 'Sala de jogos',
  'Espaço pet', 'Coworking', 'Cinema', 'Spa/Sauna', 'Área verde',
  'Deck com espreguiçadeiras'
];

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

interface FormState {
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  tipo_predio: string;
  numero_unidades: string;
  numero_andares: string;
  numero_blocos: string;
  sindico_nome: string;
  sindico_contato: string;
  vice_sindico_nome: string;
  vice_sindico_contato: string;
  contato_portaria: string;
  telefone_principal: string;
  caracteristicas: string[];
  outras_caracteristicas: string;
}

const initialState: FormState = {
  nome: '', endereco: '', bairro: '', cidade: '', estado: '',
  tipo_predio: '', numero_unidades: '', numero_andares: '', numero_blocos: '',
  sindico_nome: '', sindico_contato: '', vice_sindico_nome: '', vice_sindico_contato: '',
  contato_portaria: '', telefone_principal: '',
  caracteristicas: [], outras_caracteristicas: ''
};

const CadastroPredioPublico: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [fotos, setFotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleCaracteristica = (c: string) => {
    setForm(prev => ({
      ...prev,
      caracteristicas: prev.caracteristicas.includes(c)
        ? prev.caracteristicas.filter(x => x !== c)
        : [...prev.caracteristicas, c]
    }));
  };

  const handleFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFotos(prev => [...prev, ...files].slice(0, 10));
    e.target.value = '';
  };

  const removeFoto = (i: number) => setFotos(prev => prev.filter((_, idx) => idx !== i));

  const uploadFotos = async (cadastroId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of fotos) {
      const ext = file.name.split('.').pop();
      const path = `cadastro-externo/${cadastroId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('building-images').upload(path, file, {
        cacheControl: '3600', upsert: false
      });
      if (error) {
        console.error('upload foto', error);
        continue;
      }
      const { data } = supabase.storage.from('building-images').getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.endereco.trim()) {
      toast.error('O endereço é obrigatório');
      return;
    }
    setSubmitting(true);
    try {
      const { data: inserted, error } = await (supabase as any)
        .from('predios_cadastro_externo')
        .insert({
          nome: form.nome || null,
          endereco: form.endereco,
          bairro: form.bairro || null,
          cidade: form.cidade || null,
          estado: form.estado || null,
          tipo_predio: form.tipo_predio || null,
          numero_unidades: form.numero_unidades ? parseInt(form.numero_unidades) : null,
          numero_andares: form.numero_andares ? parseInt(form.numero_andares) : null,
          numero_blocos: form.numero_blocos ? parseInt(form.numero_blocos) : null,
          sindico_nome: form.sindico_nome || null,
          sindico_contato: form.sindico_contato || null,
          vice_sindico_nome: form.vice_sindico_nome || null,
          vice_sindico_contato: form.vice_sindico_contato || null,
          contato_portaria: form.contato_portaria || null,
          telefone_principal: form.telefone_principal || null,
          caracteristicas: form.caracteristicas,
          outras_caracteristicas: form.outras_caracteristicas || null,
          fotos_urls: []
        })
        .select('id')
        .single();

      if (error || !inserted) throw error || new Error('Erro ao salvar');

      if (fotos.length > 0) {
        const urls = await uploadFotos(inserted.id);
        if (urls.length > 0) {
          await (supabase as any)
            .from('predios_cadastro_externo')
            .update({ fotos_urls: urls })
            .eq('id', inserted.id);
        }
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao enviar cadastro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#7D1818] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[#C7141A]/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#C7141A]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Cadastro recebido!</h2>
          <p className="text-white/70 text-sm mb-6">
            Nossa equipe vai analisar as informações do seu prédio e entrar em contato em breve.
          </p>
          <button
            onClick={() => { setForm(initialState); setFotos([]); setSuccess(false); }}
            className="text-[#C7141A] hover:text-[#B40D1A] text-sm font-medium"
          >
            Cadastrar outro prédio
          </button>
        </div>
      </div>
    );
  }

  const inputCls = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C7141A] focus:ring-2 focus:ring-[#C7141A]/30 transition";
  const labelCls = "block text-sm font-medium text-white/80 mb-1.5";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#7D1818] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center mb-6">
          <img src={EXA_LOGO_URL} alt="EXA" className="h-12 w-auto" />
        </div>
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C7141A]/20 mb-4">
            <Building2 className="w-7 h-7 text-[#C7141A]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            Cadastro de Prédio
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Preencha as informações do prédio para iniciarmos a análise. Apenas o endereço é obrigatório.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Dados Básicos</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nome do prédio</label>
                <input className={inputCls} value={form.nome} onChange={e => update('nome', e.target.value)} placeholder="Ex: Residencial Solar do Jardim" />
              </div>
              <div>
                <label className={labelCls}>Endereço completo *</label>
                <input className={inputCls} value={form.endereco} onChange={e => update('endereco', e.target.value)} required placeholder="Rua, número, complemento" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Bairro</label>
                  <input className={inputCls} value={form.bairro} onChange={e => update('bairro', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input className={inputCls} value={form.cidade} onChange={e => update('cidade', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <input className={inputCls} value={form.estado} onChange={e => update('estado', e.target.value)} maxLength={2} placeholder="UF" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Tipo de prédio</label>
                <select className={inputCls} value={form.tipo_predio} onChange={e => update('tipo_predio', e.target.value)}>
                  <option value="" className="bg-slate-900">Selecione</option>
                  <option value="Residencial" className="bg-slate-900">🏠 Residencial</option>
                  <option value="Comercial" className="bg-slate-900">🏢 Comercial</option>
                </select>
              </div>
            </div>
          </section>

          {/* Dados Estruturais */}
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Dados Estruturais</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Número de unidades</label>
                <input type="number" min={0} className={inputCls} value={form.numero_unidades} onChange={e => update('numero_unidades', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Número de andares</label>
                <input type="number" min={0} className={inputCls} value={form.numero_andares} onChange={e => update('numero_andares', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Número de blocos</label>
                <input type="number" min={0} className={inputCls} value={form.numero_blocos} onChange={e => update('numero_blocos', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Contatos */}
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Contatos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nome do síndico</label>
                <input className={inputCls} value={form.sindico_nome} onChange={e => update('sindico_nome', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Contato do síndico</label>
                <input className={inputCls} value={form.sindico_contato} onChange={e => update('sindico_contato', e.target.value)} placeholder="Telefone ou e-mail" />
              </div>
              <div>
                <label className={labelCls}>Nome do vice-síndico</label>
                <input className={inputCls} value={form.vice_sindico_nome} onChange={e => update('vice_sindico_nome', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Contato do vice-síndico</label>
                <input className={inputCls} value={form.vice_sindico_contato} onChange={e => update('vice_sindico_contato', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Contato da portaria</label>
                <input className={inputCls} value={form.contato_portaria} onChange={e => update('contato_portaria', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Telefone principal do prédio</label>
                <input className={inputCls} value={form.telefone_principal} onChange={e => update('telefone_principal', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Características */}
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-1">Características de lazer</h2>
            <p className="text-xs text-white/50 mb-4">Marque tudo que o prédio possui</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {CARACTERISTICAS_OPCOES.map(c => {
                const active = form.caracteristicas.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleCaracteristica(c)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                      active
                        ? 'bg-[#C7141A] border-[#C7141A] text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <div>
              <label className={labelCls}>Outras características</label>
              <input className={inputCls} value={form.outras_caracteristicas} onChange={e => update('outras_caracteristicas', e.target.value)} placeholder="Algo que não está na lista?" />
            </div>
          </section>

          {/* Fotos */}
          <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-1">Fotos do prédio</h2>
            <p className="text-xs text-white/50 mb-4">Até 10 imagens (fachada, áreas comuns, hall)</p>

            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/15 rounded-xl cursor-pointer hover:border-[#C7141A]/50 hover:bg-white/5 transition">
              <Upload className="w-6 h-6 text-white/40 mb-2" />
              <span className="text-sm text-white/60">Clique para enviar fotos</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFotos} />
            </label>

            {fotos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
                {fotos.map((f, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-[#C7141A]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-[#C7141A] hover:bg-[#B40D1A] text-white font-bold shadow-2xl shadow-[#C7141A]/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando…</> : 'Enviar cadastro'}
          </button>

          <p className="text-center text-xs text-white/40 pt-2">
            Ao enviar, você concorda que a EXA Mídia entre em contato sobre este cadastro.
          </p>
        </form>
      </div>
    </div>
  );
};

export default CadastroPredioPublico;
