/**
 * EXA 2.0 — Auditoria da rede de painéis, enviada pela Sofia no WhatsApp do CEO.
 *
 * modo 'diario'  (cron 07:30): relatório completo — presença, estabilidade, hardware, rede, monitor,
 *                player, entrega de conteúdo (sistema × tela) e pedidos.
 * modo 'alerta'  (cron a cada 10 min): só o que é CRÍTICO e novo (ou que voltou ao normal). Cada problema
 *                avisa 1 vez; se continuar, lembra a cada 12 h. Instabilidade avisa no máx. 1x por dia.
 * dry_run=true:  devolve o texto sem enviar.
 *
 * Fontes (somente leitura): devices + device_offline_incidents (AnyDesk), exa2_telas_saude (vigia),
 * ExaSistema telas_saude (coletor do NUC: temperatura, disco, RAM, rede, Wi-Fi, monitor, player),
 * exa2-agenda-sync em dry_run (sistema × manifesto) e pedidos.
 * Escreve só em exa2_monitor_estado (memória dos alertas) e envia pela função zapi-send-message (agente sofia).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-exa2-cron' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const EXASISTEMA_URL = 'https://iwlscwsenzgyylopnwpu.supabase.co';
const telaDe = (id: unknown) => String(id || '').replace(/-/g, '').substring(0, 4);
const MIN = 60000;

type Sev = 'critico' | 'atencao';
interface Achado { chave: string; sev: Sev; predio: string; texto: string; lembrar_h?: number }

const brt = (d: Date | string | null | undefined, fmt: 'dh' | 'h' | 'd' = 'dh') => {
  if (!d) return '—';
  const x = new Date(new Date(d).getTime() - 3 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  const dia = `${p(x.getUTCDate())}/${p(x.getUTCMonth() + 1)}`;
  const hora = `${p(x.getUTCHours())}:${p(x.getUTCMinutes())}`;
  return fmt === 'd' ? dia : fmt === 'h' ? hora : `${dia} ${hora}`;
};
const duracao = (ms: number) => {
  const m = Math.round(ms / MIN);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h`;
  return `${Math.round(h / 24)} dias`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const main = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    const body = await req.json().catch(() => ({}));
    const modo: 'diario' | 'alerta' = body.modo === 'alerta' ? 'alerta' : 'diario';
    const dryRun = !!body.dry_run;

    // --- autenticação: cron (token do banco) ou admin logado ---
    const cronTok = req.headers.get('x-exa2-cron');
    const { data: cfg } = await main.from('exa2_config').select('valor').eq('chave', 'cron_token').maybeSingle();
    if (cronTok) {
      if (!cfg?.valor || cfg.valor !== cronTok) return json({ success: false, error: 'unauthorized' }, 401);
    } else {
      const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const { data: u } = await main.auth.getUser(jwt);
      if (!u?.user) return json({ success: false, error: 'unauthorized' }, 401);
      const { data: papeis } = await main.from('user_roles').select('role').eq('user_id', u.user.id);
      if (!(papeis || []).some((r: any) => ['admin', 'super_admin'].includes(String(r.role)))) return json({ success: false, error: 'forbidden' }, 403);
    }

    const agora = Date.now();
    const exaKey = Deno.env.get('EXASISTEMA_SERVICE_KEY');
    const telas = exaKey ? createClient(EXASISTEMA_URL, exaKey) : null;

    const [{ data: predios }, { data: devices }, { data: incid }, { data: entrega }, { data: pedidos }, saudeR, nomesR] = await Promise.all([
      main.from('buildings').select('id, nome, status'),
      main.from('devices').select('id, name, building_id, status, last_online_at, is_deleted').or('is_deleted.is.null,is_deleted.eq.false'),
      main.from('device_offline_incidents').select('device_id, started_at, resolved_at').gte('started_at', new Date(agora - 24 * 60 * MIN).toISOString()).limit(5000),
      main.from('exa2_telas_saude').select('*'),
      main.from('pedidos').select('id, status, data_inicio, data_fim, created_at, client_id, lista_predios').in('status', ['ativo', 'pago_pendente_video', 'video_aprovado', 'video_enviado', 'aguardando_video']),
      telas ? telas.from('telas_saude').select('cliente_id, dados, visto_em') : Promise.resolve({ data: [] as any[] }),
      telas ? telas.from('updates_clientes').select('cliente_id, cliente_name') : Promise.resolve({ data: [] as any[] }),
    ]);

    (predios || []).forEach((p: any) => { p.nome = String(p.nome || '').trim(); });
    const predioPor = new Map((predios || []).map((p: any) => [p.id, p]));
    const predioPorTela = new Map((predios || []).map((p: any) => [telaDe(p.id), p]));
    const ativo = (p: any) => p && String(p.status || '').toLowerCase() === 'ativo';
    const nomeTela = (t: string) => predioPorTela.get(t)?.nome || (nomesR as any).data?.find((x: any) => x.cliente_id === t)?.cliente_name || t;
    const achados: Achado[] = [];
    const ok: string[] = [];

    // ---------- 1) presença e estabilidade (AnyDesk) ----------
    const quedas = new Map<string, { n: number; offMs: number }>();
    for (const i of incid || []) {
      const q = quedas.get(i.device_id) || { n: 0, offMs: 0 };
      q.n++;
      q.offMs += (i.resolved_at ? new Date(i.resolved_at).getTime() : agora) - new Date(i.started_at).getTime();
      quedas.set(i.device_id, q);
    }
    const devsAtivos = (devices || []).filter((d: any) => d.building_id && ativo(predioPor.get(d.building_id)));
    const irmaoOnline = (d: any) => devsAtivos.some((o: any) => o.id !== d.id && o.building_id === d.building_id && String(o.status).toLowerCase() === 'online');
    let online = 0;
    const antigos: string[] = [];
    for (const d of devsAtivos) {
      const p = predioPor.get(d.building_id);
      const on = String(d.status).toLowerCase() === 'online';
      const q = quedas.get(d.id);
      if (on) online++;
      if (!on) {
        const desde = d.last_online_at ? new Date(d.last_online_at).getTime() : 0;
        if (desde && agora - desde > 30 * 24 * 60 * MIN) {
          // parado há mais de 30 dias: provavelmente retirado/substituído — lista à parte, sem alerta
          antigos.push(`${p.nome} (${d.name}, desde ${brt(d.last_online_at, 'd')})`);
        } else if (agora - desde >= 10 * MIN) {
          achados.push({ chave: `offline:${d.id}`, sev: 'critico', predio: p.nome, lembrar_h: 12,
            texto: `*${p.nome}* (${d.name}) — tela OFFLINE há ${desde ? duracao(agora - desde) : 'muito tempo'}${desde ? ` (desde ${brt(d.last_online_at)})` : ''}${irmaoOnline(d) ? '. O outro aparelho do prédio está online' : ''}` });
        }
      } else if (q && (q.n >= 6 || q.offMs >= 30 * MIN)) {
        achados.push({ chave: `instavel:${d.id}`, sev: 'atencao', predio: p.nome, lembrar_h: 24,
          texto: `*${p.nome}* (${d.name}) — instável: caiu ${q.n}x nas últimas 24 h, ${duracao(q.offMs)} fora no total. Provável internet/energia do prédio` });
      }
    }

    // ---------- 2) hardware, rede, monitor e player (coletor do NUC) ----------
    const saude = new Map(((saudeR as any).data || []).map((s: any) => [s.cliente_id, s]));
    const telasAtivas = [...new Set(devsAtivos.map((d: any) => telaDe(d.building_id)))];
    const semColetor: string[] = [];
    let tempMax: { v: number; t: string } | null = null;
    let downMin: { v: number; t: string } | null = null;
    for (const t of telasAtivas) {
      const s: any = saude.get(t);
      const nome = nomeTela(t);
      const devOn = devsAtivos.some((d: any) => telaDe(d.building_id) === t && String(d.status).toLowerCase() === 'online');
      if (!s) { semColetor.push(nome); continue; }
      const idade = agora - new Date(s.visto_em).getTime();
      if (idade > 45 * MIN) {
        if (devOn) achados.push({ chave: `semrelatorio:${t}`, sev: 'atencao', predio: nome, lembrar_h: 24, texto: `*${nome}* — online, mas sem relatório de saúde desde ${brt(s.visto_em)} (coletor parado?)` });
        continue; // dados velhos não geram alertas de hardware
      }
      const d = s.dados || {};
      const sis = d.sistema || {}, rede = d.rede || {}, mon = d.monitor || {}, pl = d.player || {};
      const T = typeof d.temp_c === 'number' ? d.temp_c : null;
      if (T !== null) {
        if (!tempMax || T > tempMax.v) tempMax = { v: T, t: nome };
        if (T >= 85) achados.push({ chave: `temp:${t}`, sev: 'critico', predio: nome, lembrar_h: 6, texto: `*${nome}* — temperatura ${T}°C (crítica, risco de travar/desligar). Ver ventilação do NUC` });
        else if (T >= 75) achados.push({ chave: `tempalta:${t}`, sev: 'atencao', predio: nome, lembrar_h: 24, texto: `*${nome}* — temperatura alta: ${T}°C` });
      }
      if (pl.main_rodando === false) achados.push({ chave: `player:${t}`, sev: 'critico', predio: nome, lembrar_h: 6, texto: `*${nome}* — o player NÃO está rodando (tela pode estar parada ou preta)` });
      if (pl.disco_gravavel === false) achados.push({ chave: `rofs:${t}`, sev: 'critico', predio: nome, lembrar_h: 12, texto: `*${nome}* — disco em modo somente leitura (não consegue baixar vídeos novos)` });
      if (mon.monitor_conectado === false) achados.push({ chave: `monitor:${t}`, sev: 'critico', predio: nome, lembrar_h: 6, texto: `*${nome}* — NUC não detecta o monitor (cabo HDMI ou monitor desligado)` });
      else if (mon.monitor_ligado === false) achados.push({ chave: `monitoroff:${t}`, sev: 'critico', predio: nome, lembrar_h: 6, texto: `*${nome}* — monitor em modo de economia/desligado pelo sistema` });
      const disco = sis.disco_uso_pct;
      if (typeof disco === 'number') {
        if (disco >= 92) achados.push({ chave: `disco:${t}`, sev: 'critico', predio: nome, lembrar_h: 12, texto: `*${nome}* — disco ${disco}% cheio` });
        else if (disco >= 80) achados.push({ chave: `discoalto:${t}`, sev: 'atencao', predio: nome, lembrar_h: 24, texto: `*${nome}* — disco ${disco}% cheio` });
      }
      if (typeof sis.ram_uso_pct === 'number' && sis.ram_uso_pct >= 90) achados.push({ chave: `ram:${t}`, sev: 'atencao', predio: nome, lembrar_h: 24, texto: `*${nome}* — memória RAM ${sis.ram_uso_pct}% usada` });
      if ((sis.boots_24h || 0) >= 2) achados.push({ chave: `reboot:${t}`, sev: 'atencao', predio: nome, lembrar_h: 24, texto: `*${nome}* — reiniciou ${sis.boots_24h}x em 24 h (energia ou travamento)` });
      if (sis.ntp_ok === false) achados.push({ chave: `ntp:${t}`, sev: 'atencao', predio: nome, lembrar_h: 24, texto: `*${nome}* — relógio sem sincronizar (programação por horário pode errar)` });
      const net = rede.internet || {}, gw = rede.gw || {};
      if (rede.sem_rota) achados.push({ chave: `semrede:${t}`, sev: 'critico', predio: nome, lembrar_h: 6, texto: `*${nome}* — NUC sem rede (sem rota padrão)` });
      else {
        if ((net.perda_pct ?? 0) >= 20) achados.push({ chave: `perda:${t}`, sev: 'atencao', predio: nome, lembrar_h: 24, texto: `*${nome}* — internet perdendo ${net.perda_pct}% dos pacotes${(gw.perda_pct ?? 0) >= 5 ? ' (falha já no roteador/rádio do prédio)' : ''}` });
        else if ((net.perda_pct ?? 0) >= 5 || (gw.perda_pct ?? 0) >= 5) achados.push({ chave: `perdaleve:${t}`, sev: 'atencao', predio: nome, lembrar_h: 24, texto: `*${nome}* — perda de pacotes: internet ${net.perda_pct ?? '?'}%, roteador ${gw.perda_pct ?? '?'}%` });
        if ((net.jitter_ms ?? 0) >= 40) achados.push({ chave: `jitter:${t}`, sev: 'atencao', predio: nome, lembrar_h: 24, texto: `*${nome}* — conexão oscilando (variação de ${net.jitter_ms} ms)` });
      }
      if (rede.tipo === 'wifi') {
        if ((rede.wifi_sinal_dbm ?? 0) <= -72) achados.push({ chave: `wifi:${t}`, sev: 'atencao', predio: nome, lembrar_h: 24, texto: `*${nome}* — Wi-Fi fraco: ${rede.wifi_sinal_dbm} dBm (${rede.wifi_banda || '?'})` });
        if (rede.wifi_banda === '2.4 GHz') achados.push({ chave: `banda:${t}`, sev: 'atencao', predio: nome, lembrar_h: 168, texto: `*${nome}* — Wi-Fi em 2.4 GHz (mais lento e com mais interferência que 5 GHz)` });
      }
      if (typeof d.download_mbps === 'number') {
        if (!downMin || d.download_mbps < downMin.v) downMin = { v: d.download_mbps, t: nome };
        if (d.download_mbps < 5) achados.push({ chave: `download:${t}`, sev: 'atencao', predio: nome, lembrar_h: 24, texto: `*${nome}* — internet lenta: ${d.download_mbps} Mbps de download` });
      }
    }

    // ---------- 3) entrega de conteúdo (vigia + sistema × tela) ----------
    for (const e of entrega || []) {
      if (!ativo(predioPor.get(e.building_id))) continue;
      if (['atrasada', 'programacao_atrasada'].includes(e.status)) {
        achados.push({ chave: `entrega:${e.cliente_id}`, sev: 'critico', predio: e.nome || nomeTela(e.cliente_id), lembrar_h: 6,
          texto: `*${e.nome || nomeTela(e.cliente_id)}* — ${e.status === 'atrasada' ? `atualização de conteúdo atrasada desde ${brt(e.pendente_desde)}` : 'tela não está tocando o vídeo que a agenda manda agora'}` });
      }
      if ((e.arquivos_faltando || 0) > 0) achados.push({ chave: `faltando:${e.cliente_id}`, sev: 'atencao', predio: e.nome, lembrar_h: 12, texto: `*${e.nome}* — ${e.arquivos_faltando} vídeo(s) ainda não baixado(s) no NUC` });
    }
    let divergencias: any[] = [];
    let syncOk = false;
    if (cfg?.valor) {
      try {
        const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/exa2-agenda-sync`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-exa2-cron': cfg.valor }, body: JSON.stringify({ dry_run: true }),
        });
        const j: any = await r.json();
        syncOk = !!j?.success && j?.modo === 'reconciliacao_com_manifesto';
        divergencias = [...(j?.correcoes || []), ...((j?.itens || []).filter((i: any) => i.mudou))];
      } catch { /* sem conferência hoje */ }
    }
    if (divergencias.length) {
      achados.push({ chave: 'divergencia', sev: 'atencao', predio: 'Conteúdo', lembrar_h: 24,
        texto: `Sistema × telas: ${divergencias.length} diferença(s) encontradas (principal, programação ou arquivo). O sincronizador corrige sozinho a cada 5 min — se aparecer de novo amanhã, algo está travando` });
    }

    // ---------- 4) pedidos ----------
    const hoje = new Date(agora - 3 * 3600 * 1000).toISOString().slice(0, 10);
    const em7 = new Date(agora - 3 * 3600 * 1000 + 7 * 24 * 60 * MIN).toISOString().slice(0, 10);
    const vencidos = (pedidos || []).filter((p: any) => p.status === 'ativo' && p.data_fim && String(p.data_fim).slice(0, 10) < hoje);
    const vencendo = (pedidos || []).filter((p: any) => p.status === 'ativo' && p.data_fim && String(p.data_fim).slice(0, 10) >= hoje && String(p.data_fim).slice(0, 10) <= em7);
    const semVideo = (pedidos || []).filter((p: any) => p.status === 'pago_pendente_video' && agora - new Date(p.created_at).getTime() > 3 * 24 * 60 * MIN);

    // ---------- memória dos alertas ----------
    const { data: estadoRows } = await main.from('exa2_monitor_estado').select('*');
    const estado = new Map((estadoRows || []).map((e: any) => [e.chave, e]));
    const ativosAgora = new Set(achados.map((a) => a.chave));
    const novos: Achado[] = [];
    const lembrar: Achado[] = [];
    for (const a of achados) {
      const e: any = estado.get(a.chave);
      if (!e || e.resolvido_em) novos.push(a);
      else if (e.notificado_em && agora - new Date(e.notificado_em).getTime() > (a.lembrar_h || 12) * 60 * MIN) lembrar.push(a);
    }
    const voltaram = (estadoRows || []).filter((e: any) => !e.resolvido_em && !ativosAgora.has(e.chave));

    // ---------- texto ----------
    const crit = achados.filter((a) => a.sev === 'critico');
    const aten = achados.filter((a) => a.sev === 'atencao');
    let texto = '';
    let enviar = false;
    if (modo === 'diario') {
      const L: string[] = [];
      L.push(`*Auditoria diária EXA — ${brt(new Date(agora), 'd')}*`);
      L.push(`${online} de ${devsAtivos.length - antigos.length} aparelhos online · ${crit.length} crítico(s) · ${aten.length} em atenção`);
      if (crit.length) { L.push('', '*CRÍTICO*'); crit.forEach((a) => L.push(`• ${a.texto}`)); }
      if (aten.length) { L.push('', '*ATENÇÃO*'); aten.forEach((a) => L.push(`• ${a.texto}`)); }
      if (antigos.length) { L.push('', '*Parados há mais de 30 dias* (confirmar se foram retirados e apagar do cadastro)'); L.push(`• ${antigos.join('; ')}`); }
      L.push('', '*Conteúdo*');
      L.push(syncOk ? (divergencias.length ? `• ${divergencias.length} diferença(s) sistema × telas (correção automática em andamento)` : '• Sistema e telas iguais em todos os prédios (principal, programação e arquivos)') : '• Não consegui conferir sistema × telas hoje');
      L.push('', '*Pedidos*');
      if (vencidos.length) L.push(`• ${vencidos.length} pedido(s) "ativo" com período já vencido: ${vencidos.map((p: any) => p.id.slice(0, 8)).join(', ')}`);
      if (vencendo.length) L.push(`• ${vencendo.length} vencendo em até 7 dias: ${vencendo.map((p: any) => `${p.id.slice(0, 8)} (${brt(String(p.data_fim).slice(0, 10) + 'T15:00:00Z', 'd')})`).join(', ')}`);
      if (semVideo.length) L.push(`• ${semVideo.length} pago(s) há mais de 3 dias sem vídeo: ${semVideo.map((p: any) => p.id.slice(0, 8)).join(', ')}`);
      if (!vencidos.length && !vencendo.length && !semVideo.length) L.push('• Nada pendente');
      L.push('', '*Hardware (telas com coletor)*');
      const comColetor = telasAtivas.length - semColetor.length;
      L.push(`• Coletor ativo em ${comColetor} de ${telasAtivas.length} telas`);
      if (tempMax) L.push(`• Maior temperatura: ${tempMax.v}°C (${tempMax.t})`);
      if (downMin) L.push(`• Internet mais lenta: ${downMin.v} Mbps (${downMin.t})`);
      if (semColetor.length) L.push(`• Sem coletor: ${semColetor.join(', ')}`);
      texto = L.join('\n');
      enviar = true;
    } else {
      const critNovos = novos.filter((a) => a.sev === 'critico');
      const critLembrar = lembrar.filter((a) => a.sev === 'critico');
      const instNovos = novos.filter((a) => a.chave.startsWith('instavel:'));
      const voltaramNotificados = voltaram.filter((e: any) => e.notificado_em && e.severidade === 'critico');
      const L: string[] = [];
      if (critNovos.length) { L.push('*Alerta EXA — problema novo*'); critNovos.forEach((a) => L.push(`• ${a.texto}`)); }
      if (instNovos.length) { if (L.length) L.push(''); L.push('*Atenção*'); instNovos.forEach((a) => L.push(`• ${a.texto}`)); }
      if (critLembrar.length) { if (L.length) L.push(''); L.push('*Ainda sem solução*'); critLembrar.forEach((a) => L.push(`• ${a.texto}`)); }
      if (voltaramNotificados.length) { if (L.length) L.push(''); L.push('*Normalizado*'); voltaramNotificados.forEach((e: any) => L.push(`• ${String(e.mensagem).split(' — ')[0]} — voltou ao normal`)); }
      texto = L.join('\n');
      enviar = L.length > 0;
    }

    // ---------- envio (Sofia) ----------
    let enviado: any = null;
    if (enviar && !dryRun) {
      const { data: ceo } = await main.from('exa_alerts_directors').select('telefone, nome').eq('ativo', true).eq('departamento', 'CEO').limit(1).maybeSingle();
      if (ceo?.telefone) {
        const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/zapi-send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
          body: JSON.stringify({ agentKey: 'sofia', phone: ceo.telefone, message: texto }),
        });
        enviado = { ok: r.ok, status: r.status };
      } else enviado = { ok: false, erro: 'CEO sem telefone em exa_alerts_directors' };
    }

    // ---------- grava memória ----------
    if (!dryRun) {
      const notificou = enviar && enviado?.ok;
      const avisados = new Set(modo === 'alerta'
        ? [...novos.filter((a) => a.sev === 'critico' || a.chave.startsWith('instavel:')), ...lembrar.filter((a) => a.sev === 'critico')].map((a) => a.chave)
        : achados.map((a) => a.chave));
      const linhas = achados.map((a) => {
        const e: any = estado.get(a.chave);
        const reabre = !e || e.resolvido_em;
        return {
          chave: a.chave, severidade: a.sev, predio: a.predio, mensagem: a.texto,
          primeiro_em: reabre ? new Date(agora).toISOString() : e.primeiro_em,
          ultimo_em: new Date(agora).toISOString(), resolvido_em: null,
          notificado_em: notificou && avisados.has(a.chave) ? new Date(agora).toISOString() : (reabre ? null : e.notificado_em),
        };
      });
      if (linhas.length) await main.from('exa2_monitor_estado').upsert(linhas, { onConflict: 'chave' });
      for (const e of voltaram) await main.from('exa2_monitor_estado').update({ resolvido_em: new Date(agora).toISOString() }).eq('chave', e.chave);
    }

    return json({ success: true, modo, dry_run: dryRun, enviado, criticos: crit.length, atencao: aten.length, novos: novos.length, voltaram: voltaram.length, texto });
  } catch (e: any) {
    console.error('[exa2-auditoria] erro', e?.message);
    return json({ success: false, error: e?.message || 'erro' }, 500);
  }
});
