/**
 * Cartão de uma tela nova (TV Android, mini PC, navegador) dentro de Painéis EXA, no mesmo visual dos
 * painéis dos elevadores: ao vivo / sem sinal / esperando conexão. Aberto, troca o local (prédio ou
 * estabelecimento) e o grupo na hora, e dá os atalhos de recarregar e abrir em Telas.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { MonitorSmartphone, RefreshCw, Settings2, Link2 } from 'lucide-react';
import { infoLayout } from './catalogo';
import { telaAoVivo, type TelaEquipe } from './useTelasEquipe';

const hm = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');
const desde = (iso?: string | null) => {
  if (!iso) return '';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return `há ${Math.max(1, min)} min`;
  const d = new Date(iso);
  return Date.now() - d.getTime() < 20 * 3600000 ? `desde ${hm(iso)}` : `desde ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
};
const aparelho = (t: TelaEquipe) => {
  const i = t.info || {};
  const p = (t.plataforma || '').toLowerCase();
  const nome = p.startsWith('android') ? 'Android' : p.startsWith('windows') ? 'Windows' : p.startsWith('linux') ? 'Linux' : 'Navegador';
  return [nome, i.fabricante && i.modelo ? `${i.fabricante} ${i.modelo}` : null].filter(Boolean).join(' · ');
};

export function estadoTela(t: TelaEquipe): 'aguardando' | 'ao_vivo' | 'sem_sinal' {
  if (t.status !== 'ativa' || !t.building_id) return 'aguardando';
  return telaAoVivo(t) ? 'ao_vivo' : 'sem_sinal';
}

const VISUAL = {
  ao_vivo: { fundo: '#F3FBF6', borda: 'rgba(46,155,98,0.28)', seloFundo: '#E3F4EA', seloCor: '#1E6B47', rotulo: 'Ao vivo' },
  sem_sinal: { fundo: '#FDF4F3', borda: 'rgba(176,38,29,0.30)', seloFundo: '#FBE3E0', seloCor: '#B0261D', rotulo: 'Sem sinal' },
  aguardando: { fundo: '#FFF9EE', borda: 'rgba(154,83,0,0.28)', seloFundo: '#FCF1DF', seloCor: '#9A5300', rotulo: 'Esperando conexão' },
};

export function TelaNoPaineis({ t, aberto, onAlternar, locais, grupos, semColunaGrupo, onAtualizar, onComando, onAbrirTelas, onConectar }: {
  t: TelaEquipe;
  aberto: boolean;
  onAlternar: () => void;
  locais: { id: string; nome: string }[];
  grupos: { id: string; nome: string }[];
  semColunaGrupo: boolean;
  onAtualizar: (patch: Partial<TelaEquipe>) => Promise<{ message: string } | null>;
  onComando: (tipo: 'recarregar') => Promise<{ message: string } | null>;
  onAbrirTelas: () => void;
  onConectar: (codigo: string) => void;
}) {
  const e = estadoTela(t);
  const v = VISUAL[e];
  const [salvando, setSalvando] = useState('');
  const local = t.building_id ? locais.find((l) => l.id === t.building_id)?.nome : null;
  const lay = infoLayout(t.layout);
  const s = t.saude || {};

  const salvar = async (campo: 'building_id' | 'device_group_id', valor: string) => {
    setSalvando(campo);
    const erro = await onAtualizar({ [campo]: valor || null } as Partial<TelaEquipe>);
    setSalvando('');
    if (erro) toast.error('Não consegui salvar', { description: erro.message });
    else toast.success(campo === 'building_id' ? 'Local da tela atualizado' : 'Grupo da tela atualizado', { description: campo === 'building_id' ? 'A programação muda em até 1 minuto.' : undefined });
  };

  return (
    <div className="overflow-hidden rounded-[20px] border shadow-[0_10px_24px_-22px_rgba(70,20,20,0.35)]" style={{ background: v.fundo, borderColor: v.borda }}>
      <button type="button" onClick={onAlternar} aria-expanded={aberto} className="flex w-full flex-col gap-2 p-4 text-left">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-[15px] font-extrabold leading-tight">
            {t.nome || (e === 'aguardando' ? `TV nova · código ${t.codigo || '…'}` : 'Tela')}
          </span>
          <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold" style={{ background: v.seloFundo, color: v.seloCor }}>
            {e === 'ao_vivo' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
            {v.rotulo}{e === 'sem_sinal' && t.ultimo_sinal ? ` ${desde(t.offline_desde || t.ultimo_sinal)}` : ''}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-[#6A6B70]">
          <MonitorSmartphone className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Tela nova · {aparelho(t)}{e !== 'aguardando' ? ` · ${lay.id} ${lay.nome}` : ''}</span>
        </span>
        {e === 'aguardando' ? (
          <span className="text-[13px] leading-snug text-[#5A3A00]">Esta TV abriu o app e está mostrando o código <b>{t.codigo || '…'}</b>. Toque para conectar.</span>
        ) : (
          <span className="truncate text-[13px] text-[#3F4044]">
            {local ? `Local: ${local}` : 'Sem local'}{t.tocando?.titulo && e === 'ao_vivo' ? ` · tocando ${t.tocando.cliente || t.tocando.titulo}` : ''}
          </span>
        )}
      </button>
      {aberto && (
        <div className="space-y-3 border-t border-black/[0.06] bg-white/60 p-4">
          {e === 'aguardando' ? (
            <button type="button" onClick={() => onConectar(t.codigo || '')} className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#9C1E1E] px-3 text-sm font-bold text-white">
              <Link2 className="h-4 w-4" />Conectar esta tela (código {t.codigo})
            </button>
          ) : (
            <>
              <label className="block">
                <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">Prédio / estabelecimento</span>
                <select value={t.building_id || ''} disabled={salvando === 'building_id'} onChange={(ev) => salvar('building_id', ev.target.value)}
                  className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold disabled:opacity-60">
                  {!t.building_id && <option value="">Escolha o local…</option>}
                  {locais.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">Grupo em Painéis EXA</span>
                <select value={t.device_group_id || ''} disabled={semColunaGrupo || salvando === 'device_group_id'} onChange={(ev) => salvar('device_group_id', ev.target.value)}
                  className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold disabled:opacity-60">
                  <option value="">Sem grupo (Telas novas)</option>
                  {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
                </select>
                {semColunaGrupo && <span className="mt-1 block text-[11px] font-semibold text-[#9A5300]">Falta rodar o SQL dos grupos de telas no Supabase.</span>}
              </label>
              <p className="text-xs text-[#8A8B90]">
                Último sinal {t.ultimo_sinal ? desde(t.ultimo_sinal) : '—'}
                {s.conexao ? ` · internet ${s.conexao}${s.mbps ? ` ${s.mbps} Mb/s` : ''}` : ''}
                {typeof s.videos_no_aparelho === 'number' ? ` · ${s.videos_no_aparelho} vídeo(s) no aparelho` : ''}
                {t.info?.chrome ? ` · navegador Chrome ${t.info.chrome}` : ''}
                {t.conectada_por === 'cliente' ? ' · conectada pelo cliente' : ''}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={async () => { const er = await onComando('recarregar'); if (er) toast.error('Não consegui mandar', { description: er.message }); else toast.success('A TV recarrega em até 1 minuto'); }}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold">
                  <RefreshCw className="h-4 w-4" />Recarregar
                </button>
                <button type="button" onClick={onAbrirTelas} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#17181A] px-3 text-sm font-bold text-white">
                  <Settings2 className="h-4 w-4" />Abrir a tela
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
