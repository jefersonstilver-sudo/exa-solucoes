/**
 * EXA 2.0 — Diagnóstico completo de um painel (para a aba "Diagnóstico" da página Painéis).
 *
 * Entrada: { device_id } (devices.id) e { horas } (padrão 24, máx. 168).
 * Junta, para aquele NUC:
 *   - coletor de saúde do NUC (ExaSistema telas_saude / telas_saude_log): temperatura, disco, RAM, rede,
 *     Wi-Fi, velocidade, monitor, player — a cada 15 min
 *   - quedas do AnyDesk (device_offline_incidents)
 *   - entrega de conteúdo (ExaSistema telas_heartbeat / telas_heartbeat_log)
 * e devolve: estado atual, série para gráficos e um LOG de eventos já interpretado, incluindo a causa
 * provável de cada queda (cruzando AnyDesk × coletor × tempo ligado do NUC).
 * Somente leitura. Acesso: admin / super_admin.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const EXASISTEMA_URL = 'https://iwlscwsenzgyylopnwpu.supabase.co';
const telaDe = (id: unknown) => String(id || '').replace(/-/g, '').substring(0, 4);
const MIN = 60000;

type Nivel = 'critico' | 'atencao' | 'info' | 'ok';
interface Evento { em: string; fim?: string | null; nivel: Nivel; tipo: string; titulo: string; detalhe?: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const main = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: u } = await main.auth.getUser(jwt);
    if (!u?.user) return json({ success: false, error: 'unauthorized' }, 401);
    const { data: papeis } = await main.from('user_roles').select('role').eq('user_id', u.user.id);
    if (!(papeis || []).some((r: any) => ['admin', 'super_admin'].includes(String(r.role)))) return json({ success: false, error: 'forbidden' }, 403);

    const body = await req.json().catch(() => ({}));
    const horas = Math.min(168, Math.max(1, Number(body.horas) || 24));
    const desde = new Date(Date.now() - horas * 60 * MIN).toISOString();
    const { data: dev } = await main.from('devices').select('id, name, building_id, anydesk_client_id, status, last_online_at, metadata').eq('id', body.device_id).maybeSingle();
    if (!dev) return json({ success: false, error: 'painel não encontrado' }, 404);
    const tela = String(body.cliente_id || dev.metadata?.auditoria?.tela_id || telaDe(dev.building_id) || '');
    const anydesk = String(dev.anydesk_client_id || '').replace(/\D/g, '');

    const exaKey = Deno.env.get('EXASISTEMA_SERVICE_KEY');
    if (!exaKey) return json({ success: false, error: 'EXASISTEMA_SERVICE_KEY ausente' }, 500);
    const telas = createClient(EXASISTEMA_URL, exaKey);

    const [atuaisR, logR, hbR, hbLogR, incR] = await Promise.all([
      telas.from('telas_saude').select('*').eq('cliente_id', tela),
      telas.from('telas_saude_log').select('*').eq('cliente_id', tela).gte('visto_em', desde).order('visto_em', { ascending: true }).limit(2000),
      telas.from('telas_heartbeat').select('*').eq('cliente_id', tela).maybeSingle(),
      telas.from('telas_heartbeat_log').select('manifest_versao, sync_ok, arquivos_faltando, drift_seg, visto_em').eq('cliente_id', tela).gte('visto_em', desde).order('visto_em', { ascending: true }).limit(3000),
      main.from('device_offline_incidents').select('started_at, resolved_at, status, causa, resolucao').eq('device_id', dev.id).gte('started_at', desde).order('started_at', { ascending: true }).limit(2000),
    ]);

    // qual NUC é este? (prédio com 2+ NUCs compartilha o código de tela) — casa pelo ID do AnyDesk
    const atuais: any[] = atuaisR.data || [];
    const meu = atuais.find((a) => a.anydesk_id && String(a.anydesk_id) === anydesk) || (atuais.length === 1 ? atuais[0] : null);
    const nuc = meu?.nuc_id ?? null;
    const amostras: any[] = (logR.data || []).filter((l: any) => nuc === null ? atuais.length <= 1 : (l.nuc_id ?? '') === nuc);

    // ---------- série para gráficos ----------
    const serie = amostras.map((l: any) => {
      const d = l.dados || {}; const r = d.rede || {}; const s = d.sistema || {};
      return {
        t: l.visto_em,
        temp: d.temp_c ?? null,
        perda_net: r.internet?.perda_pct ?? null,
        lat_net: r.internet?.lat_ms ?? null,
        jitter: r.internet?.jitter_ms ?? null,
        perda_gw: r.gw?.perda_pct ?? null,
        lat_gw: r.gw?.lat_ms ?? null,
        perda_api: r.api_telas?.perda_pct ?? null,
        sinal: r.wifi_sinal_dbm ?? null,
        download: d.download_mbps ?? null,
        disco: s.disco_uso_pct ?? null,
        ram: s.ram_uso_pct ?? null,
        load: s.load1 ?? null,
        uptime_h: s.uptime_h ?? null,
        monitor: d.monitor?.monitor_conectado === false ? 'desconectado' : d.monitor?.monitor_ligado === false ? 'desligado' : (d.monitor?.monitor_conectado ? 'ok' : null),
        player: d.player?.main_rodando === false ? 'parado' : d.player?.main_rodando ? 'ok' : null,
      };
    });

    // ---------- log de eventos ----------
    const ev: Evento[] = [];
    const fmtDur = (ms: number) => { const m = Math.round(ms / MIN); return m < 60 ? `${m} min` : m < 2880 ? `${Math.round(m / 6) / 10} h` : `${Math.round(m / 1440)} dias`; };
    const tAm = amostras.map((a: any) => new Date(a.visto_em).getTime());

    // quedas do AnyDesk com causa provável
    for (const i of incR.data || []) {
      const ini = new Date(i.started_at).getTime();
      const fim = i.resolved_at ? new Date(i.resolved_at).getTime() : Date.now();
      const dur = fim - ini;
      const durante = amostras.filter((a: any, k: number) => tAm[k] > ini + 2 * MIN && tAm[k] < fim - 2 * MIN);
      const depois = amostras.find((a: any, k: number) => tAm[k] >= fim);
      let antes: any = null; for (let k = 0; k < amostras.length && tAm[k] <= ini; k++) antes = amostras[k];
      let causa = 'Sem dados do NUC para diagnosticar (coletor ainda não instalado)';
      let nivel: Nivel = dur >= 10 * MIN ? 'critico' : 'atencao';
      if (amostras.length) {
        if (durante.length) {
          causa = 'O NUC continuou ligado e com internet (o coletor enviou dados durante a queda): falha só no AnyDesk, a tela não parou';
          nivel = 'info';
        } else if (depois) {
          const up = (depois.dados?.sistema?.uptime_h ?? 999) * 3600 * 1000;
          const ligadoDesde = new Date(depois.visto_em).getTime() - up;
          if (ligadoDesde > ini - 2 * MIN) causa = `O NUC desligou/reiniciou (voltou ligado às ${new Date(ligadoDesde - 3 * 3600 * 1000).toISOString().slice(11, 16)}): falta de energia no prédio ou travamento`;
          else {
            const g = antes?.dados?.rede?.gw?.perda_pct;
            causa = `O NUC ficou ligado o tempo todo, mas sem internet${typeof g === 'number' && g >= 5 ? ' — o roteador/rádio do prédio já estava perdendo pacotes antes' : ''}: queda da internet do prédio (operadora, roteador ou rádio)`;
          }
        } else if (!i.resolved_at) causa = 'Ainda fora. O NUC não envia dados: sem energia, sem internet ou desligado';
      }
      ev.push({ em: i.started_at, fim: i.resolved_at, nivel, tipo: 'queda', titulo: `${i.resolved_at ? 'Queda' : 'OFFLINE agora'} — ${fmtDur(dur)}`, detalhe: causa });
    }

    // anomalias do coletor (agrupa amostras seguidas do mesmo problema em 1 evento)
    const abertos = new Map<string, Evento>();
    const marca = (chave: string, cond: boolean, t: string, nivel: Nivel, titulo: string, detalhe: string) => {
      const e = abertos.get(chave);
      if (cond) { if (!e) { const n = { em: t, fim: null, nivel, tipo: chave, titulo, detalhe }; abertos.set(chave, n); ev.push(n); } else { e.fim = t; } }
      else if (e) { e.fim = e.fim || t; abertos.delete(chave); }
    };
    let prevUp: number | null = null, prevRede = '';
    for (let k = 0; k < amostras.length; k++) {
      const a = amostras[k]; const d = a.dados || {}; const r = d.rede || {}; const s = d.sistema || {}; const t = a.visto_em;
      const pn = r.internet?.perda_pct ?? 0, pg = r.gw?.perda_pct ?? 0;
      marca('perda', pn >= 5 || pg >= 5, t, pn >= 20 ? 'critico' : 'atencao', 'Perda de pacotes', `internet ${pn}% · roteador ${pg}%${pg >= 5 ? ' (problema dentro do prédio: roteador/rádio/cabo)' : ' (problema na operadora)'}`);
      marca('latencia', (r.internet?.lat_ms ?? 0) >= 150 || (r.internet?.jitter_ms ?? 0) >= 40, t, 'atencao', 'Internet lenta/oscilando', `latência ${r.internet?.lat_ms ?? '?'} ms · variação ${r.internet?.jitter_ms ?? '?'} ms`);
      marca('temp', (d.temp_c ?? 0) >= 75, t, (d.temp_c ?? 0) >= 85 ? 'critico' : 'atencao', 'Temperatura alta', `${d.temp_c}°C`);
      marca('monitor', d.monitor?.monitor_conectado === false || d.monitor?.monitor_ligado === false, t, 'critico', 'Monitor sem imagem', d.monitor?.monitor_conectado === false ? 'NUC não detecta o monitor (HDMI/monitor desligado)' : 'monitor em economia de energia');
      marca('player', d.player?.main_rodando === false, t, 'critico', 'Player parado', 'o programa da tela não estava rodando');
      marca('disco', (s.disco_uso_pct ?? 0) >= 85 || d.player?.disco_gravavel === false, t, 'critico', 'Disco', d.player?.disco_gravavel === false ? 'somente leitura' : `${s.disco_uso_pct}% cheio`);
      marca('wifi', r.tipo === 'wifi' && (r.wifi_sinal_dbm ?? 0) <= -72, t, 'atencao', 'Wi-Fi fraco', `${r.wifi_sinal_dbm} dBm (${r.wifi_banda})`);
      marca('ntp', s.ntp_ok === false, t, 'atencao', 'Relógio fora de sincronia', 'programação por horário pode errar');
      if (prevUp !== null && typeof s.uptime_h === 'number' && s.uptime_h < prevUp) ev.push({ em: t, nivel: 'atencao', tipo: 'reinicio', titulo: 'NUC reiniciou', detalhe: `ligado há ${Math.round(s.uptime_h * 60)} min nesta leitura` });
      if (typeof s.uptime_h === 'number') prevUp = s.uptime_h;
      const assinatura = [r.tipo, r.iface, r.wifi_banda, r.gateway, r.ip_publico].join('|');
      if (prevRede && assinatura !== prevRede) ev.push({ em: t, nivel: 'info', tipo: 'rede', titulo: 'Mudança na rede', detalhe: `${r.tipo || '?'} ${r.iface || ''} ${r.wifi_banda || ''} · gateway ${r.gateway || '?'} · IP ${r.ip_publico || '?'}` });
      prevRede = assinatura;
      if (k > 0 && tAm[k] - tAm[k - 1] > 40 * MIN) ev.push({ em: amostras[k - 1].visto_em, fim: t, nivel: 'atencao', tipo: 'silencio', titulo: `NUC sem enviar diagnóstico por ${fmtDur(tAm[k] - tAm[k - 1])}`, detalhe: 'sem energia, sem internet ou coletor parado nesse intervalo' });
    }

    // conteúdo: versões aplicadas
    let vAnt: number | null = null;
    for (const h of hbLogR.data || []) {
      if (h.sync_ok && h.manifest_versao != null && h.manifest_versao !== vAnt) {
        if (vAnt !== null) ev.push({ em: h.visto_em, nivel: 'ok', tipo: 'conteudo', titulo: `Conteúdo atualizado (versão ${vAnt} → ${h.manifest_versao})`, detalhe: (h.arquivos_faltando || 0) > 0 ? `${h.arquivos_faltando} arquivo(s) ainda baixando` : 'todos os arquivos no NUC' });
        vAnt = h.manifest_versao;
      }
      if (h.sync_ok === false) ev.push({ em: h.visto_em, nivel: 'atencao', tipo: 'sync', titulo: 'Falha ao sincronizar conteúdo', detalhe: 'o NUC tentou e não conseguiu falar com o servidor' });
    }

    ev.sort((a, b) => new Date(b.em).getTime() - new Date(a.em).getTime());

    // ---------- resumo do período ----------
    const quedas = (incR.data || []);
    const offMs = quedas.reduce((acc: number, i: any) => acc + ((i.resolved_at ? new Date(i.resolved_at).getTime() : Date.now()) - Math.max(new Date(i.started_at).getTime(), Date.now() - horas * 60 * MIN)), 0);
    const med = (k: string) => { const v = serie.map((x: any) => x[k]).filter((x: any) => typeof x === 'number'); return v.length ? Math.round((v.reduce((a: number, b: number) => a + b, 0) / v.length) * 10) / 10 : null; };
    const max = (k: string) => { const v = serie.map((x: any) => x[k]).filter((x: any) => typeof x === 'number'); return v.length ? Math.max(...v) : null; };

    return json({
      success: true,
      painel: { id: dev.id, nome: dev.name, tela, anydesk: dev.anydesk_client_id, status: dev.status, last_online_at: dev.last_online_at },
      coletor: meu ? { instalado: true, visto_em: meu.visto_em, nuc_id: meu.nuc_id } : { instalado: false, outros_nucs_da_tela: atuais.length },
      atual: meu?.dados || null,
      heartbeat: hbR.data || null,
      resumo: {
        horas,
        quedas: quedas.length,
        tempo_fora: fmtDur(offMs),
        disponibilidade_pct: Math.max(0, Math.round((1 - offMs / (horas * 60 * MIN)) * 1000) / 10),
        amostras: amostras.length,
        temp_media: med('temp'), temp_max: max('temp'),
        perda_media: med('perda_net'), lat_media: med('lat_net'),
        download_ultimo: [...serie].reverse().find((x: any) => typeof x.download === 'number')?.download ?? null,
        reinicios: ev.filter((e) => e.tipo === 'reinicio').length,
      },
      serie,
      eventos: ev.slice(0, 500),
    });
  } catch (e: any) {
    console.error('[exa2-saude-painel] erro', e?.message);
    return json({ success: false, error: e?.message || 'erro' }, 500);
  }
});
