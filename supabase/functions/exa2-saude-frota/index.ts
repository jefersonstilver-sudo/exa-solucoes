/**
 * EXA 2.0 — Visão da FROTA de painéis (entrada da página Painéis EXA).
 *
 * Para cada painel (devices) junta:
 *   - AnyDesk (devices.status / last_online_at) e quedas dos últimos 7 dias (device_offline_incidents)
 *   - última leitura do coletor do NUC (ExaSistema telas_saude): vigia de rede, motivo do último boot,
 *     temperatura, perda de pacotes (operadora × roteador do prédio), velocidade, tela/monitor/player
 *   - último heartbeat do player (ExaSistema telas_heartbeat): versão e se o conteúdo está em dia
 * e devolve um ESTADO + CAUSA em português para cada painel (regras fixas, sem IA).
 *
 * Com { ia: true } também pede ao modelo um resumo do "Técnico EXA" escrito SÓ a partir desses fatos.
 * Somente leitura. Acesso: admin / super_admin.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const EXASISTEMA_URL = 'https://iwlscwsenzgyylopnwpu.supabase.co';
const telaDe = (id: unknown) => String(id || '').replace(/-/g, '').substring(0, 4);
const MIN = 60000;

type Estado = 'sem_sinal' | 'sem_imagem' | 'internet_ruim' | 'quente' | 'instavel' | 'sem_diagnostico' | 'tocando';
const PESO: Record<Estado, number> = { sem_sinal: 0, sem_imagem: 1, internet_ruim: 2, quente: 3, instavel: 4, sem_diagnostico: 5, tocando: 6 };

const fmtDur = (ms: number) => {
  const m = Math.max(0, Math.round(ms / MIN));
  return m < 60 ? `${m} min` : m < 2880 ? `${Math.round(m / 6) / 10} h` : `${Math.round(m / 1440)} dias`;
};
const hora = (iso?: string | null) => iso ? new Date(new Date(iso).getTime() - 3 * 3600 * 1000).toISOString().slice(11, 16) : '?';

async function paginar<T>(q: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const out: T[] = [];
  for (let de = 0; de < 20000; de += 1000) {
    const { data, error } = await q(de, de + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const main = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    // Sistema (Sofia lendo os painéis para o CEO): token interno de exa2_config; só leitura, como para o admin
    const cronTok = req.headers.get('x-exa2-cron');
    let sistemaOk = false;
    if (cronTok) {
      const { data: cfg } = await main.from('exa2_config').select('valor').eq('chave', 'cron_token').maybeSingle();
      if (!cfg?.valor || cfg.valor !== cronTok) return json({ success: false, error: 'unauthorized' }, 401);
      sistemaOk = true;
    }
    if (!sistemaOk) {
      const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const { data: u } = await main.auth.getUser(jwt);
      if (!u?.user) return json({ success: false, error: 'unauthorized' }, 401);
      const { data: papeis } = await main.from('user_roles').select('role').eq('user_id', u.user.id);
      if (!(papeis || []).some((r: any) => ['admin', 'super_admin'].includes(String(r.role)))) return json({ success: false, error: 'forbidden' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const agora = Date.now();
    const desde7 = new Date(agora - 7 * 24 * 60 * MIN).toISOString();

    const exaKey = Deno.env.get('EXASISTEMA_SERVICE_KEY');
    const telas = exaKey ? createClient(EXASISTEMA_URL, exaKey) : null;

    const [devs, incs, saudeR, hbR] = await Promise.all([
      paginar<any>((a, b) => main.from('devices')
        .select('id, name, condominio_name, address, provider, status, last_online_at, building_id, anydesk_client_id, device_group_id, empresa_elevador_id, metadata')
        .or('is_deleted.is.null,is_deleted.eq.false').order('name').range(a, b)),
      paginar<any>((a, b) => main.from('device_offline_incidents')
        .select('device_id, started_at, resolved_at, causa').gte('started_at', desde7).order('started_at', { ascending: true }).range(a, b)),
      telas ? telas.from('telas_saude').select('cliente_id, nuc_id, anydesk_id, visto_em, dados') : Promise.resolve({ data: [] as any[] }),
      telas ? telas.from('telas_heartbeat').select('cliente_id, app_versao, sync_ok, erro, arquivos_faltando, visto_em, ultimo_sync_ok_em') : Promise.resolve({ data: [] as any[] }),
    ]);

    const saude: any[] = (saudeR as any).data || [];
    const hbs = new Map<string, any>(((hbR as any).data || []).map((h: any) => [String(h.cliente_id), h]));
    const incPorDev = new Map<string, any[]>();
    for (const i of incs) { if (!incPorDev.has(i.device_id)) incPorDev.set(i.device_id, []); incPorDev.get(i.device_id)!.push(i); }

    // operadora escrita de jeitos diferentes ("NEWOESTE" / "New Oeste") vira um nome só: o mais usado
    const contagem = new Map<string, Map<string, number>>();
    for (const d of devs) {
      const rot = String(d.provider || '').trim().replace(/\s+/g, ' ').toUpperCase();
      if (!rot) continue;
      const k = rot.replace(/[^A-Z0-9]/g, '');
      const m = contagem.get(k) || new Map<string, number>();
      m.set(rot, (m.get(rot) || 0) + 1 + (rot.includes(' ') ? 0.5 : 0));
      contagem.set(k, m);
    }
    const operadoraDe = (prov: unknown) => {
      const rot = String(prov || '').trim().replace(/\s+/g, ' ').toUpperCase();
      if (!rot) return null;
      const m = contagem.get(rot.replace(/[^A-Z0-9]/g, ''));
      return m ? [...m.entries()].sort((a, b) => b[1] - a[1])[0][0] : rot;
    };

    const paineis = devs.map((dev: any) => {
      const tela = String(dev.metadata?.auditoria?.tela_id || telaDe(dev.building_id) || '');
      const anydesk = String(dev.anydesk_client_id || '').replace(/\D/g, '');
      const daTela = saude.filter((s) => String(s.cliente_id) === tela);
      const s = daTela.find((a) => a.anydesk_id && String(a.anydesk_id) === anydesk) || (daTela.length === 1 ? daTela[0] : null);
      const d = s?.dados || {};
      const r = d.rede || {};
      const vg = d.vigia || {};
      const hb = tela ? hbs.get(tela) : null;
      const quedas = incPorDev.get(dev.id) || [];
      const q24 = quedas.filter((i) => new Date(i.started_at).getTime() > agora - 24 * 60 * MIN).length;
      const foraMs = quedas.reduce((acc, i) => acc + ((i.resolved_at ? new Date(i.resolved_at).getTime() : agora) - new Date(i.started_at).getTime()), 0);
      const aberta = [...quedas].reverse().find((i) => !i.resolved_at);
      const causaRegistrada = [...quedas].reverse().find((i) => i.causa)?.causa || null;

      const coletorMin = s?.visto_em ? (agora - new Date(s.visto_em).getTime()) / MIN : null;
      const coletorVivo = coletorMin !== null && coletorMin < 35;
      const temp = typeof d.temp_c === 'number' ? d.temp_c : null;
      const perdaNet = r.internet?.perda_pct ?? null;
      const perdaGw = r.gw?.perda_pct ?? null;
      const ev = vg.eventos_24h || {};
      const semGw = Number(ev.SEM_GATEWAY || 0), oper = Number(ev.OPERADORA || 0), semCabo = Number(ev.SEM_CABO || 0), semRota = Number(ev.SEM_ROTA || 0);
      const telaPreta = d.tela?.preta === true;
      const telaParada = d.tela?.mudou === false;
      const semMonitor = d.monitor?.monitor_conectado === false;
      const playerParado = d.player?.main_rodando === false;

      // por que cai (diário do vigia nas últimas 24 h)
      let porqueCai: string | null = null;
      if (semGw + oper + semCabo + semRota > 0) {
        const maior = Math.max(semGw, oper, semCabo, semRota);
        if (maior === semGw) porqueCai = `o rádio/roteador do prédio some (${semGw}× em 24 h${vg.cabo?.sinal ? ', com o cabo ligado' : ''})`;
        else if (maior === oper) porqueCai = `a operadora cai (o roteador responde, a internet não; ${oper}× em 24 h)`;
        else if (maior === semCabo) porqueCai = `o cabo/placa de rede perde sinal (${semCabo}× em 24 h)`;
        else porqueCai = `o NUC fica sem rota de rede (${semRota}× em 24 h)`;
      }

      let estado: Estado = 'tocando';
      let causa = 'Funcionando normalmente.';
      const tipoBoot = d.boot?.tipo as string | undefined;

      if (dev.status === 'offline' && !coletorVivo) {
        estado = 'sem_sinal';
        const desde = aberta?.started_at || dev.last_online_at;
        causa = `Sem sinal há ${fmtDur(agora - new Date(desde || agora).getTime())} (desde ${hora(desde)}). `;
        if (!s) causa += 'Sem coletor instalado: não dá para saber se é energia ou internet.';
        else if (vg.estado_agora && vg.estado_agora !== 'OK') causa += `Última leitura do vigia: ${vg.estado_agora}${porqueCai ? ` — ${porqueCai}` : ''}.`;
        else causa += 'O NUC também parou de enviar diagnóstico: falta de energia, internet do prédio ou NUC travado.';
      } else if (telaPreta || semMonitor || playerParado) {
        estado = 'sem_imagem';
        causa = semMonitor ? 'O NUC não detecta o monitor (HDMI solto ou monitor desligado).'
          : playerParado ? 'O programa da tela não está rodando.'
          : 'A tela está preta na captura do NUC.';
      } else if ((quedas.length >= 15 || q24 >= 5) && porqueCai) {
        estado = 'instavel';
        causa = `${q24} quedas nas últimas 24 h, ${quedas.length} em 7 dias: ${porqueCai}.`;
      } else if ((perdaNet ?? 0) >= 20 || (perdaGw ?? 0) >= 5) {
        estado = 'internet_ruim';
        causa = (perdaGw ?? 0) >= 5
          ? `Perda de ${perdaGw}% já dentro do prédio (roteador/rádio/cabo).`
          : `Operadora com ${perdaNet}% de perda; o roteador do prédio está limpo.`;
      } else if ((temp ?? 0) >= 85) {
        estado = 'quente';
        causa = `${temp} °C: precisa de ventilação no local do NUC.`;
      } else if (quedas.length >= 15 || q24 >= 5) {
        estado = 'instavel';
        causa = `${quedas.length} quedas em 7 dias (${q24} nas últimas 24 h).`;
      } else if (!s) {
        estado = 'sem_diagnostico';
        causa = 'Coletor de diagnóstico ainda não instalado neste NUC.';
      } else if (dev.status === 'offline' && coletorVivo) {
        causa = 'Tocando normalmente; só o AnyDesk está fora.';
      } else if (porqueCai) {
        causa = `Tocando. Nas últimas 24 h ${porqueCai}.`;
      }
      if (estado !== 'sem_sinal' && telaParada && !telaPreta && estado === 'tocando') causa += ' A imagem não mudou entre duas capturas (pode estar congelada).';

      return {
        id: dev.id,
        nome: dev.name,
        condominio: dev.condominio_name,
        endereco: dev.address || null,
        operadora: operadoraDe(dev.provider),
        grupo_id: dev.device_group_id || null,
        building_id: dev.building_id || null,
        anydesk: dev.anydesk_client_id || null,
        status_anydesk: dev.status,
        visto_anydesk_em: dev.last_online_at,
        estado,
        causa,
        porque_cai: porqueCai,
        causa_registrada: causaRegistrada,
        quedas_7d: quedas.length,
        quedas_24h: q24,
        fora_7d: fmtDur(foraMs),
        fora_7d_min: Math.round(foraMs / MIN),
        coletor: s ? { visto_em: s.visto_em, vivo: coletorVivo, versao: d.coletor || null } : null,
        temp_c: temp,
        perda_internet_pct: perdaNet,
        perda_roteador_pct: perdaGw,
        lat_ms: r.internet?.lat_ms ?? null,
        download_mbps: d.download_mbps ?? null,
        conexao: r.tipo || null,
        vigia: s ? { estado: vg.estado_agora || null, eventos_24h: ev, reboots_7d: vg.reboots_7d ?? null, cabo: vg.cabo || null } : null,
        ultimo_boot: d.boot ? { tipo: tipoBoot || null, ligou_em: d.boot.ligou_em || null } : null,
        player: hb ? { versao: hb.app_versao, conteudo_ok: hb.sync_ok, faltando: hb.arquivos_faltando, visto_em: hb.visto_em, pendencia: hb.erro || null } : null,
      };
    }).sort((a: any, b: any) => PESO[a.estado as Estado] - PESO[b.estado as Estado] || b.quedas_7d - a.quedas_7d);

    let tecnico: string | null = null;
    // a análise considera só as telas do grupo "Prédios" (internos, bancada e estoque ficam de fora)
    const { data: grupos } = await main.from('device_groups').select('id, nome');
    const gPredios = (grupos || []).find((g: any) => /^pr[eé]dios$/i.test(String(g.nome || '').trim()));
    const daRede = gPredios ? paineis.filter((p: any) => p.grupo_id === gPredios.id) : paineis;
    if (body.ia) tecnico = await resumoTecnico(daRede).catch((e) => { console.error('[frota] ia', e?.message); return null; });

    return json({ success: true, gerado_em: new Date().toISOString(), paineis, tecnico });
  } catch (e: any) {
    console.error('[exa2-saude-frota] erro', e?.message);
    return json({ success: false, error: e?.message || 'erro' }, 500);
  }
});

/** Resumo do "Técnico EXA": o modelo só reescreve os fatos calculados acima, sem inventar. */
async function resumoTecnico(paineis: any[]): Promise<string | null> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) return null;
  const fatos = paineis.filter((p) => p.estado !== 'tocando' || p.quedas_7d >= 5).slice(0, 40).map((p) =>
    `${p.nome} | operadora ${p.operadora || '?'} | estado ${p.estado} | ${p.causa} | quedas 7d ${p.quedas_7d} (fora ${p.fora_7d})` +
    `${p.temp_c ? ` | ${p.temp_c}°C` : ''}${p.perda_internet_pct != null ? ` | perda internet ${p.perda_internet_pct}% roteador ${p.perda_roteador_pct}%` : ''}`);
  const porOperadora: Record<string, { total: number; ruins: number }> = {};
  for (const p of paineis) {
    const k = p.operadora || 'sem operadora';
    porOperadora[k] = porOperadora[k] || { total: 0, ruins: 0 };
    porOperadora[k].total++;
    if (['sem_sinal', 'internet_ruim', 'instavel'].includes(p.estado)) porOperadora[k].ruins++;
  }
  const prompt = `Você é o técnico de campo da EXA Mídia (telas em elevadores, cada tela tem um NUC ligado por cabo a um rádio/roteador do prédio).
Escreva em português do Brasil, frases curtas, para o dono da empresa ler no celular.
Use SOMENTE os fatos abaixo. Não invente causas, números nem ações que não decorram deles. Se algo for incerto, diga que é provável.
Formato:
1) Uma frase de manchete (o mais importante agora).
2) Até 5 linhas começando com "• " com o que fazer, em ordem de prioridade, citando o prédio.
3) Uma linha "Operadoras:" resumindo qual está pior.

Painéis com problema ou muitas quedas (nome | operadora | estado | causa | quedas):
${fatos.join('\n') || 'nenhum'}

Total de painéis: ${paineis.length}. Por operadora (total / com problema): ${Object.entries(porOperadora).map(([k, v]) => `${k} ${v.total}/${v.ruins}`).join(', ')}.`;
  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: [{ role: 'user', content: prompt }], temperature: 0.2 }),
  });
  if (!r.ok) throw new Error(`ia ${r.status}`);
  const j = await r.json();
  return j?.choices?.[0]?.message?.content?.trim() || null;
}
