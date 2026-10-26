import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Lock, MapPin, Monitor, Search, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import type { AgendaSlot } from '@/lib/agenda/agendaEngine';

export interface PredioInfo {
  id: string;
  nome: string;
  bairro?: string;
  endereco?: string;
  imagem_principal?: string;
  imageurl?: string;
  quantidade_telas?: number;
  numero_elevadores?: number;
  publico_estimado?: number;
}

const imgUrl = (b: PredioInfo): string | null => {
  const p = b.imagem_principal || b.imageurl;
  if (!p) return null;
  if (p.startsWith('http')) return p;
  return supabase.storage.from('building-images').getPublicUrl(p).data.publicUrl;
};

interface Props {
  predios: PredioInfo[];
  noAr: AgendaSlot | null;
}

export const PrediosTab: React.FC<Props> = ({ predios, noAr }) => {
  const [q, setQ] = useState('');
  const [aberto, setAberto] = useState<PredioInfo | null>(null);
  const lista = useMemo(
    () =>
      predios
        .filter((b) => `${b.nome} ${b.bairro || ''}`.toLowerCase().includes(q.trim().toLowerCase()))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [predios, q],
  );
  const telas = predios.reduce((s, b) => s + (b.quantidade_telas || b.numero_elevadores || 0), 0);
  const publico = predios.reduce((s, b) => s + (b.publico_estimado || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { i: Building2, n: predios.length, l: 'prédios' },
          { i: Monitor, n: telas || '—', l: 'telas' },
          { i: Users, n: publico ? publico.toLocaleString('pt-BR') : '—', l: 'pessoas/mês' },
        ].map(({ i: I, n, l }) => (
          <div key={l} className="rounded-2xl border border-gray-200 bg-white p-3 text-center">
            <I className="mx-auto mb-1 h-4 w-4 text-[#9C1E1E]" />
            <div className="text-lg font-extrabold leading-none text-gray-900">{n}</div>
            <div className="text-[11px] font-semibold text-gray-500">{l}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar prédio ou bairro…" className="flex-1 bg-transparent text-sm outline-none" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((b) => {
          const img = imgUrl(b);
          return (
            <button key={b.id} onClick={() => setAberto(b)} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:shadow-md">
              <div className="relative h-36 bg-gradient-to-br from-gray-700 to-gray-900">
                {img ? (
                  <img src={img} alt={b.nome} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                ) : (
                  <Building2 className="absolute inset-0 m-auto h-10 w-10 text-white/40" />
                )}
                {noAr && (
                  <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[10.5px] font-bold text-white backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Seu anúncio no ar
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <div className="font-extrabold text-gray-900">{b.nome}</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" /> {b.bairro || 'Foz do Iguaçu'}
                  {(b.quantidade_telas || b.numero_elevadores) ? <> · {b.quantidade_telas || b.numero_elevadores} tela(s)</> : null}
                </div>
                <div className="mt-2 text-xs font-bold text-[#9C1E1E]">Ver como aparece na tela →</div>
              </div>
            </button>
          );
        })}
      </div>
      {!lista.length && <p className="py-8 text-center text-sm text-gray-500">Nenhum prédio encontrado.</p>}

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{aberto?.nome}</DialogTitle>
          </DialogHeader>
          {aberto && <ReplicaTela predio={aberto} noAr={noAr} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ReplicaTela: React.FC<{ predio: PredioInfo; noAr: AgendaSlot | null }> = ({ predio, noAr }) => {
  const [agora, setAgora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-[#2a0a12] shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(130%_90%_at_30%_10%,#b8243f,transparent_60%),linear-gradient(160deg,#5c0f1f,#2a0a12)]" />
        <span className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> AO VIVO
        </span>
        <div className="absolute inset-0 grid grid-cols-[1.55fr_1fr] grid-rows-[auto_1fr_auto] gap-2 p-3">
          <div className="flex flex-col justify-center rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-white backdrop-blur-sm">
            <div className="text-base font-extrabold leading-none sm:text-xl">{agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-[9px] opacity-85 sm:text-[10px]">{agora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}</div>
          </div>
          <div className="flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-2 text-center text-[9px] font-bold text-white/90 backdrop-blur-sm sm:text-[11px]">
            {predio.nome}
          </div>
          <div className="relative overflow-hidden rounded-lg bg-black">
            {noAr?.url ? (
              <video key={noAr.url} src={noAr.url} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white/60">Sem vídeo no ar</div>
            )}
            <span className="absolute left-2 top-2 rounded bg-black/45 px-2 py-0.5 text-[9px] font-bold text-white">▶ Seu anúncio</span>
          </div>
          <div className="row-span-2 flex items-center justify-center rounded-lg border border-dashed border-white/30 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.08),rgba(255,255,255,.08)_10px,rgba(255,255,255,.04)_10px,rgba(255,255,255,.04)_20px)] p-2 text-center text-white">
            <div className="text-[9px] font-bold leading-relaxed sm:text-[11px]">
              <Lock className="mx-auto mb-1 h-4 w-4" />
              Área do condomínio
              <br />
              <span className="font-medium opacity-80">visível só para moradores</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 truncate rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[9px] text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Informações da cidade em tempo real
          </div>
        </div>
      </div>
      <p className="mt-3 rounded-xl border border-[#9C1E1E]/15 bg-[#9C1E1E]/5 px-3 py-2.5 text-xs text-gray-700">
        É assim que o seu anúncio aparece nas telas do <b>{predio.nome}</b>. A área de avisos do condomínio fica oculta aqui porque é privada dos moradores.
      </p>
    </div>
  );
};
