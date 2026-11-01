/**
 * Quais câmeras ao vivo a TV mostra e por quanto tempo cada uma: rodízio entre as escolhidas (com o tempo de
 * cada) ou uma câmera fixa, sem trocar. Usado pela equipe (Telas) e pelo restaurante (Minhas telas). Síndico não.
 * Fica em exa_telas.config.cameras = { ids: [url da câmera…], segundos }.
 */
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, Video } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const FUNCAO = 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa-tela';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk';

export interface CamerasConfig { ids: string[]; segundos: number | null }
type Cam = { url: string; nome: string };

let cacheLista: Cam[] | null = null;
async function listaDeCameras(): Promise<Cam[]> {
  if (cacheLista) return cacheLista;
  const r = await fetch(FUNCAO, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` }, body: JSON.stringify({ acao: 'cameras_lista' }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !Array.isArray(j.cameras)) throw new Error(j.erro || 'Não consegui carregar as câmeras');
  cacheLista = j.cameras;
  return cacheLista!;
}

/** Texto curto para o cartão da tela. */
export function resumoCameras(cfg?: Partial<CamerasConfig> | null, nomes?: Map<string, string>) {
  const ids = cfg?.ids || [];
  if (ids.length === 1) return `${nomes?.get(ids[0]) || '1 câmera'} · fixa`;
  const seg = cfg?.segundos ? ` · ${cfg.segundos} s cada` : '';
  return ids.length ? `${ids.length} câmeras${seg}` : `Todas as câmeras${seg}`;
}

const TEMPOS = [10, 15, 20, 30, 60, 120];

export function EscolherCameras({ titulo, atual, onFechar, onSalvar }: {
  titulo: string; atual?: Partial<CamerasConfig> | null; onFechar: () => void; onSalvar: (c: CamerasConfig) => Promise<void>;
}) {
  const [lista, setLista] = useState<Cam[] | null>(null);
  const [erro, setErro] = useState('');
  const [ids, setIds] = useState<string[]>(atual?.ids || []);
  const [modo, setModo] = useState<'rodizio' | 'fixa'>((atual?.ids || []).length === 1 ? 'fixa' : 'rodizio');
  const [seg, setSeg] = useState<number>(Number(atual?.segundos) || 15);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { listaDeCameras().then(setLista).catch((e) => setErro((e as Error).message)); }, []);

  const alternar = (u: string) => {
    if (modo === 'fixa') { setIds([u]); return; }
    setIds((x) => (x.includes(u) ? x.filter((y) => y !== u) : [...x, u]));
  };
  const salvar = async () => {
    if (modo === 'fixa' && ids.length !== 1) { toast.error('Escolha a câmera que fica fixa'); return; }
    setSalvando(true);
    try {
      await onSalvar({ ids: modo === 'fixa' ? ids.slice(0, 1) : ids, segundos: modo === 'fixa' ? null : seg });
      toast.success('Câmeras salvas', { description: 'A TV muda em até 1 minuto.' });
      onFechar();
    } catch (e) { toast.error((e as Error).message || 'Não consegui salvar'); } finally { setSalvando(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onFechar(); }}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-h-[92vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Câmeras · {titulo}</DialogTitle>
          <DialogDescription>Quais câmeras ao vivo aparecem nesta TV e por quanto tempo cada uma.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-[14px]">
          <div className="grid grid-cols-2 gap-2">
            {([['rodizio', 'Rodízio', 'Troca entre as câmeras escolhidas'], ['fixa', 'Uma fixa', 'Uma câmera só, sem trocar']] as const).map(([v, t, sub]) => (
              <button key={v} type="button" aria-pressed={modo === v} onClick={() => { setModo(v); if (v === 'fixa' && ids.length > 1) setIds(ids.slice(0, 1)); }}
                className={`rounded-2xl border p-3 text-left ${modo === v ? 'border-[#9C1E1E] bg-[#9C1E1E]/[0.05] ring-2 ring-[#9C1E1E]/25' : 'border-black/10'}`}>
                <b className="block">{t}</b><span className="text-[12px] text-[#5E5F63]">{sub}</span>
              </button>
            ))}
          </div>

          <div>
            <span className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">
              {modo === 'fixa' ? 'Qual câmera' : 'Quais câmeras (nenhuma marcada = todas)'}
            </span>
            {erro && <p className="text-[13px] text-[#B0261D]">{erro}</p>}
            {!lista && !erro && <p className="text-[13px] text-[#6A6B70]">Carregando câmeras…</p>}
            <div className="space-y-1.5">
              {(lista || []).map((c) => {
                const on = ids.includes(c.url);
                const ordem = modo === 'rodizio' && on ? ids.indexOf(c.url) + 1 : 0;
                return (
                  <button key={c.url} type="button" onClick={() => alternar(c.url)} aria-pressed={on}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${on ? 'border-[#9C1E1E] bg-[#9C1E1E]/[0.04]' : 'border-black/10 hover:border-black/25'}`}>
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-extrabold ${on ? 'bg-[#9C1E1E] text-white' : 'border border-black/20'}`}>
                      {on ? (ordem || <Check className="h-3.5 w-3.5" />) : null}
                    </span>
                    <Video className="h-4 w-4 shrink-0 text-[#8b8285]" />
                    <span className="min-w-0 flex-1 truncate font-semibold">{c.nome}</span>
                  </button>
                );
              })}
            </div>
            {modo === 'rodizio' && ids.length > 1 && <p className="mt-1.5 text-[12px] text-[#6A6B70]">O número mostra a ordem do rodízio (a ordem em que você tocou).</p>}
          </div>

          {modo === 'rodizio' && (
            <div>
              <span className="mb-2 block text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">Tempo de cada câmera</span>
              <div className="flex flex-wrap gap-2">
                {TEMPOS.map((t) => (
                  <button key={t} type="button" aria-pressed={seg === t} onClick={() => setSeg(t)}
                    className={`h-10 rounded-xl px-3.5 text-[13px] font-bold ${seg === t ? 'bg-[#17181A] text-white' : 'border border-black/10 bg-white'}`}>{t < 60 ? `${t} s` : `${t / 60} min`}</button>
                ))}
              </div>
              <p className="mt-1.5 text-[12px] text-[#6A6B70]">No layout intercalado (H6), é também quanto tempo a câmera fica na tela entre os anúncios.</p>
            </div>
          )}

          <div className="sticky bottom-0 z-10 -mx-6 -mb-2 flex justify-end border-t border-black/[0.06] bg-white/95 px-6 py-3 backdrop-blur">
            <button type="button" disabled={salvando} onClick={salvar} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#9C1E1E] px-5 text-sm font-bold text-white disabled:opacity-50">
              <Check className="h-4 w-4" />{salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
