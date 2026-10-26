import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCw, ShieldQuestion, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * EXA 2.0 — Entrega nas telas (admin).
 * Fonte: exa2_telas_saude (escrita pelo vigia a cada 5 min) e exa2_alertas_entrega.
 * "Sincronizada" só aparece quando o NUC CONFIRMOU a versão com todos os arquivos — nunca por suposição.
 */
type Saude = {
  cliente_id: string; building_id: string | null; nome: string | null; status: string;
  versao_desejada: number | null; versao_aplicada: number | null; pendente_desde: string | null;
  device_status: string | null; sinal_em: string | null; app_versao: string | null; drift_seg: number | null;
  arquivos_faltando: number | null; playlist: { titulo?: string; origem?: string }[]; erro: string | null; atualizado_em: string;
};
type Alerta = { id: number; cliente_id: string; tipo: string; mensagem: string; criado_em: string };

const STATUS: Record<string, { label: string; cls: string; icon: React.ElementType; desc: string }> = {
  atrasada: { label: 'Atrasada', cls: 'bg-red-50 text-red-800 border-red-200', icon: AlertTriangle, desc: 'Online, mas não aplicou a última mudança há 15 min ou mais' },
  aplicando: { label: 'Aplicando', cls: 'bg-blue-50 text-blue-800 border-blue-200', icon: Clock, desc: 'Mudança enviada há menos de 15 min (o NUC sincroniza a cada 5 min)' },
  offline: { label: 'Offline', cls: 'bg-gray-100 text-gray-700 border-gray-200', icon: WifiOff, desc: 'Sem sinal: aplica quando voltar' },
  sem_confirmacao: { label: 'Sem confirmação', cls: 'bg-amber-50 text-amber-800 border-amber-200', icon: ShieldQuestion, desc: 'Player antigo (v7): toca, mas não confirma o que aplicou' },
  sincronizada: { label: 'Confirmada', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2, desc: 'O NUC confirmou a versão atual com todos os arquivos' },
};
const ORDEM = ['atrasada', 'aplicando', 'offline', 'sem_confirmacao', 'sincronizada'];
const ha = (iso: string | null) => {
  if (!iso) return '—';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? 'agora' : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} d`;
};

const EntregaTelasPage: React.FC = () => {
  const [telas, setTelas] = useState<Saude[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const [t, a] = await Promise.all([
      (supabase as any).from('exa2_telas_saude').select('*'),
      (supabase as any).from('exa2_alertas_entrega').select('id, cliente_id, tipo, mensagem, criado_em').is('resolvido_em', null).order('criado_em', { ascending: false }),
    ]);
    if (t.error) setErro(t.error.message); else { setErro(null); setTelas(t.data || []); }
    setAlertas(a.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
    const i = setInterval(carregar, 30000);
    return () => clearInterval(i);
  }, [carregar]);

  const ordenadas = useMemo(
    () => [...telas].sort((x, y) => ORDEM.indexOf(x.status) - ORDEM.indexOf(y.status) || (x.nome || '').localeCompare(y.nome || '')),
    [telas],
  );
  const cont = (s: string) => telas.filter((t) => t.status === s).length;
  const ultima = telas.reduce((m, t) => (t.atualizado_em > m ? t.atualizado_em : m), '');

  return (
    <div className="space-y-5 p-4 md:p-6">
      <Helmet><title>Entrega nas telas | EXA Admin</title></Helmet>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Entrega nas telas</h1>
          <p className="text-sm text-gray-500">O que o servidor mandou × o que cada elevador confirmou. Vigia roda a cada 5 min · última leitura {ha(ultima || null)}.</p>
        </div>
        <button onClick={carregar} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </button>
      </div>

      {erro && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">Não foi possível ler a saúde das telas: {erro}</div>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {ORDEM.map((s) => {
          const c = STATUS[s]; const I = c.icon;
          return (
            <div key={s} className={`rounded-2xl border p-4 ${c.cls}`} title={c.desc}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><I className="h-4 w-4" />{c.label}</div>
              <div className="mt-1 text-3xl font-extrabold">{cont(s)}</div>
              <div className="mt-1 text-[11px] leading-snug opacity-80">{c.desc}</div>
            </div>
          );
        })}
      </div>

      {alertas.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-white">
          <div className="border-b border-red-100 px-4 py-2.5 text-sm font-bold text-red-800">Alertas abertos ({alertas.length})</div>
          <ul className="divide-y divide-gray-100">
            {alertas.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="text-gray-800">{a.mensagem}</span>
                <span className="shrink-0 text-xs text-gray-500">{a.tipo} · {ha(a.criado_em)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2.5">Prédio</th><th className="px-4 py-2.5">Situação</th><th className="px-4 py-2.5">Versão</th>
                  <th className="px-4 py-2.5">Tocando agora</th><th className="px-4 py-2.5">Último sinal</th><th className="px-4 py-2.5">Player</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordenadas.map((t) => {
                  const c = STATUS[t.status] || STATUS.sem_confirmacao;
                  return (
                    <tr key={t.cliente_id} className="align-top">
                      <td className="px-4 py-3"><div className="font-semibold text-gray-900">{(t.nome || '').trim() || t.cliente_id}</div><div className="text-xs text-gray-400">tela {t.cliente_id}</div></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${c.cls}`}>{c.label}</span>
                        {t.pendente_desde && t.status !== 'sincronizada' && <div className="mt-1 text-xs text-gray-500">mudança pendente {ha(t.pendente_desde)}</div>}
                        {(t.arquivos_faltando || 0) > 0 && <div className="mt-1 text-xs text-red-700">{t.arquivos_faltando} arquivo(s) faltando</div>}
                        {t.drift_seg != null && Math.abs(t.drift_seg) > 120 && <div className="mt-1 text-xs text-red-700">relógio desviado {t.drift_seg}s</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">enviada v{t.versao_desejada ?? '—'}<br />confirmada {t.versao_aplicada != null ? `v${t.versao_aplicada}` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">
                        {(t.playlist || []).length ? (t.playlist || []).slice(0, 4).map((p, i) => <div key={i} className="truncate max-w-[260px]">{p.titulo}{p.origem ? <span className="text-gray-400"> · {p.origem}</span> : null}</div>) : <span className="text-gray-400">só o player v8 informa</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{ha(t.sinal_em)}<div className="text-gray-400">{t.device_status || ''}</div></td>
                      <td className="px-4 py-3 text-xs text-gray-600">{t.app_versao || 'v7'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntregaTelasPage;
