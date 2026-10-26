/**
 * EXA 2.0 — Vigia de entrega das telas.
 *
 * A cada 5 min compara, por tela:
 *   versão DESEJADA  = updates_clientes.manifest_versao        (Supabase ExaSistema — o que a API publicou)
 *   versão APLICADA  = telas_heartbeat.manifest_versao         (o que o NUC confirmou com todos os arquivos)
 *   presença         = devices.status / last_online_at          (Supabase principal)
 * e grava o retrato em exa2_telas_saude + abre/fecha alertas em exa2_alertas_entrega.
 *
 * Status:
 *   sincronizada    aplicada >= desejada e sinal recente
 *   aplicando       desejada > aplicada há menos de 15 min (janela normal: o NUC sincroniza a cada 5 min)
 *   atrasada        desejada > aplicada há 15 min ou mais, com a tela online  -> ALERTA
 *   offline         tela sem sinal / device offline -> pendência aplica quando voltar
 *   sem_confirmacao player ainda na v7 (não envia confirmação) — fica explícito, nunca "verde" falso
 *
 * Prédios inativos no site são ignorados.
 * Somente leitura no ExaSistema. Escreve apenas nas tabelas exa2_* do projeto principal.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-exa2-cron' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const EXASISTEMA_URL = 'https://iwlscwsenzgyylopnwpu.supabase.co';
const ATRASO_ALERTA_MIN = 15;
const SINAL_MAX_MIN = 20; // sem sinal do player há mais que isso = não está sincronizando

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const main = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    // --- autenticação: cron (token no banco) ou admin logado ---
    const cron = req.headers.get('x-exa2-cron');
    if (cron) {
      const { data: cfg } = await main.from('exa2_config').select('valor').eq('chave', 'cron_token').maybeSingle();
      if (!cfg?.valor || cfg.valor !== cron) return json({ success: false, error: 'unauthorized' }, 401);
    } else {
      const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const { data: u } = await main.auth.getUser(jwt);
      if (!u?.user) return json({ success: false, error: 'unauthorized' }, 401);
      const { data: papeis } = await main.from('user_roles').select('role').eq('user_id', u.user.id);
      if (!(papeis || []).some((r: any) => ['admin', 'super_admin'].includes(String(r.role)))) return json({ success: false, error: 'forbidden' }, 403);
    }

    const exaKey = Deno.env.get('EXASISTEMA_SERVICE_KEY');
    if (!exaKey) return json({ success: false, error: 'EXASISTEMA_SERVICE_KEY ausente' }, 500);
    const telas = createClient(EXASISTEMA_URL, exaKey);

    const [{ data: manifestos, error: e1 }, { data: sinais, error: e2 }, { data: predios }, { data: devices }] = await Promise.all([
      telas.from('updates_clientes').select('cliente_id, cliente_name, canal_ui, manifest_versao, manifest_alterado_em'),
      telas.from('telas_heartbeat').select('*'),
      main.from('buildings').select('id, nome, status'),
      main.from('devices').select('name, building_id, status, last_online_at').neq('status', 'deleted'),
    ]);
    if (e1 || e2) throw e1 || e2;

    const agora = Date.now();
    const min = (iso?: string | null) => (iso ? (agora - new Date(iso).getTime()) / 60000 : Infinity);
    const sinalPor = new Map((sinais || []).map((h: any) => [h.cliente_id, h]));
    // UUID do prédio no site começa com o tela_id de 4 caracteres
    const predioPor = new Map((predios || []).map((b: any) => [String(b.id).replace(/-/g, '').slice(0, 4), b]));
    const devicePor = new Map<string, any>();
    (devices || []).forEach((d: any) => d.building_id && devicePor.set(d.building_id, d));

    const linhas: any[] = [];
    for (const m of manifestos || []) {
      const predio = predioPor.get(m.cliente_id);
      if (!predio) continue; // equipamento interno (bancada, sala de reunião...) — fora do vigia
      if (predio.status && !['ativo', 'active', 'instalado'].includes(String(predio.status).toLowerCase())) continue;

      const hb: any = sinalPor.get(m.cliente_id);
      const dev = devicePor.get(predio.id);
      const desejada = Number(m.manifest_versao || 1);
      const aplicada = hb?.manifest_versao != null ? Number(hb.manifest_versao) : null;
      const semSinalMin = min(hb?.visto_em);
      const deviceOffline = dev ? String(dev.status).toLowerCase() !== 'online' : false;
      const pendenteMin = min(m.manifest_alterado_em);

      let status: string;
      if (!hb) status = 'sem_confirmacao';
      else if (deviceOffline || semSinalMin > SINAL_MAX_MIN) status = 'offline';
      else if (aplicada !== null && aplicada >= desejada) status = 'sincronizada';
      else if (pendenteMin < ATRASO_ALERTA_MIN) status = 'aplicando';
      else status = 'atrasada';

      linhas.push({
        cliente_id: m.cliente_id,
        building_id: predio.id,
        nome: predio.nome || m.cliente_name,
        status,
        versao_desejada: desejada,
        versao_aplicada: aplicada,
        pendente_desde: aplicada !== null && aplicada >= desejada ? null : m.manifest_alterado_em,
        device_status: dev?.status || null,
        device_visto_em: dev?.last_online_at || null,
        sinal_em: hb?.visto_em || null,
        app_versao: hb?.app_versao || null,
        drift_seg: hb?.drift_seg ?? null,
        arquivos_faltando: hb?.arquivos_faltando ?? null,
        playlist: hb?.playlist || [],
        erro: hb?.erro || null,
        atualizado_em: new Date().toISOString(),
      });
    }

    if (linhas.length) {
      const { error } = await main.from('exa2_telas_saude').upsert(linhas, { onConflict: 'cliente_id' });
      if (error) throw error;
    }

    // --- alertas: abre quando atrasa (ou relógio desviado), fecha quando normaliza ---
    const { data: abertos } = await main.from('exa2_alertas_entrega').select('id, cliente_id, tipo').is('resolvido_em', null);
    const abertoPor = new Map((abertos || []).map((a: any) => [`${a.cliente_id}|${a.tipo}`, a]));
    const novos: any[] = [];
    const resolver: number[] = [];
    for (const l of linhas) {
      const checks: [string, boolean, string][] = [
        ['atraso', l.status === 'atrasada', `${l.nome}: tela online mas sem aplicar a versão ${l.versao_desejada} (aplicada: ${l.versao_aplicada ?? '—'})`],
        ['relogio', l.drift_seg != null && Math.abs(l.drift_seg) > 120, `${l.nome}: relógio do NUC desviado ${l.drift_seg}s`],
        ['arquivos', (l.arquivos_faltando || 0) > 0 && l.status !== 'offline', `${l.nome}: ${l.arquivos_faltando} arquivo(s) não baixados`],
      ];
      for (const [tipo, ativo, msg] of checks) {
        const k = `${l.cliente_id}|${tipo}`;
        if (ativo && !abertoPor.has(k)) novos.push({ cliente_id: l.cliente_id, building_id: l.building_id, tipo, mensagem: msg });
        if (!ativo && abertoPor.has(k)) resolver.push(abertoPor.get(k).id);
      }
    }
    if (novos.length) await main.from('exa2_alertas_entrega').insert(novos);
    if (resolver.length) await main.from('exa2_alertas_entrega').update({ resolvido_em: new Date().toISOString() }).in('id', resolver);

    const resumo: Record<string, number> = {};
    linhas.forEach((l) => (resumo[l.status] = (resumo[l.status] || 0) + 1));
    return json({ success: true, telas: linhas.length, resumo, alertas_novos: novos.length, alertas_resolvidos: resolver.length });
  } catch (e: any) {
    console.error('[exa2-vigia-telas]', e?.message);
    return json({ success: false, error: e?.message || 'erro' }, 500);
  }
});
