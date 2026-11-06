// EXA (06/11/2026) — RELATÓRIO DO PEDIDO (área do anunciante › Relatórios e aba Relatório do pedido).
// Tudo que o anunciante precisa saber do contrato: período, prédios e telas, exibições calculadas pela programação
// (os painéis não registram cada exibição; decisão do Jeferson em 06/11: número pela programação, apresentado como entregue,
// calculado pela programação real de cada prédio, dia a dia — sem desconto de queda de internet: o NUC segue tocando), histórico
// de vídeos publicados e a programação atual.
// Acesso: o dono do pedido (JWT) ou a equipe (inclusive "ver como cliente").
// POST { acao: "lista", cliente_id? }  → pedidos do cliente
// POST { acao: "relatorio", pedido_id } → relatório completo
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const uuid = (v: unknown) => String(v || "").replace(/[^0-9a-f-]/gi, "").slice(0, 36);
const DIA = 86400_000;
const EQUIPE = ["super_admin", "admin", "admin_financeiro", "admin_departamental", "comercial"];
const TOCAM = ["ativo", "video_aprovado", "finalizado", "expirado", "concluido"];
// pedidos editoriais da EXA (rodízio Notícias Brasil → Notícias Foz → Curiosidades; 1 por rodada)
const EDITORIAIS = ["c08f3154-e0dc-4c39-b8a2-721d8acdde7f", "9cb8da99-ddb3-491c-b58c-63871eadc4cb", "7a4dc868-0ecd-4969-a1ec-5589d399b7c4"];
const STATUS_VISIVEIS = ["ativo", "video_aprovado", "pago", "pago_pendente_video", "expirado", "finalizado", "concluido", "cancelado"];

// dia (yyyy-mm-dd) no horário de Brasília
const diaBR = (t: number) => new Date(t - 3 * 3600_000).toISOString().slice(0, 10);
const inicioDiaBR = (d: string) => Date.parse(d + "T03:00:00Z");

const SUPA = Deno.env.get("SUPABASE_URL")!;
// nome do arquivo da automação semanal do cinema: video-vertical-15s-qui11-qui18-jun.mp4 → dias 11 a 18/jun
const PADRAO_CINEMA = /video-(?:vertical-)?(?:15s-)?(seg|ter|qua|qui|sex|sab|dom)(\d{2})-(seg|ter|qua|qui|sex|sab|dom)(\d{2})-([a-z]{3})/;
const fotoPredio = (path?: string | null) => !path ? null : String(path).startsWith("http") ? path : `${SUPA}/storage/v1/object/public/building-images/${path}`;
const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const dm = (iso: string) => { const d = new Date(Date.parse(iso) - 3 * 3600_000); return `${String(d.getUTCDate()).padStart(2, "0")}/${MES[d.getUTCMonth()]}`; };
function tituloVideo(v: any): string {
  if (v.serie === "cinema") {
    const m = decodeURIComponent(String(v.url || "").split("/").pop() || "").toLowerCase().match(PADRAO_CINEMA);
    if (m) {
      const i = MES.indexOf(m[5]);
      return Number(m[4]) < Number(m[2]) && i >= 0
        ? `Programação do cinema · ${m[2]}/${m[5]} a ${m[4]}/${MES[(i + 1) % 12]}`
        : `Programação do cinema · ${m[2]} a ${m[4]}/${m[5]}`;
    }
    if (!v.periodo) return "Programação do cinema";
    return v.situacao === "no_ar" ? `Programação do cinema · desde ${dm(v.periodo.de)}` : `Programação do cinema · ${dm(v.periodo.de)} a ${dm(v.periodo.ate)}`;
  }
  if (/okto/i.test(v.nome)) return "Oktoberfest";
  let t = String(v.nome || "").replace(/^v[ií]deo\s*\d*\s*/i, "").replace(/\bv\d+\b/gi, "").replace(/\s+/g, " ").trim();
  if (t.length < 6) t = (v.serie === "hotel" ? "Hotel Cataratas Park" : "Campanha") + (t ? ` · ${t}` : "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function serieDoPedido(ped: any, vids: any[]): string {
  const n = String(ped.nome_pedido || "") + " " + vids.map((v) => v.nome).join(" ");
  return /cine|cinema/i.test(n) ? "cinema" : "geral";
}

function serie(nome: string): string {
  const n = String(nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/\bcine|cinema/.test(n)) return "cinema";
  if (/hotel|day ?use|resort|cafe da manha|park/.test(n)) return "hotel";
  return "geral";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(jwt);
    if (!u?.user) return json(401, { ok: false, erro: "Entre na sua conta para ver o relatório." });
    const { data: papeis } = await sb.from("user_roles").select("role").eq("user_id", u.user.id);
    const equipe = (papeis || []).some((r: any) => EQUIPE.includes(String(r.role)));
    const b = await req.json().catch(() => ({}));

    if (b.acao === "lista") {
      const cliente = equipe && b.cliente_id ? uuid(b.cliente_id) : u.user.id;
      const { data } = await sb.from("pedidos").select("id,nome_pedido,status,tipo_produto,data_inicio,data_fim,lista_predios,created_at")
        .eq("client_id", cliente).in("status", STATUS_VISIVEIS).order("data_inicio", { ascending: false, nullsFirst: false });
      return json(200, { ok: true, pedidos: (data || []).filter((p: any) => p.data_inicio).map((p: any) => ({
        id: p.id, nome: p.nome_pedido || "Campanha EXA", status: p.status, produto: String(p.tipo_produto || "horizontal").includes("vertical") ? "vertical_premium" : "horizontal",
        inicio: p.data_inicio, fim: p.data_fim, predios: (p.lista_predios || []).length,
      })) });
    }

    // ------------------------------------------------------------------ relatório
    const pid = uuid(b.pedido_id);
    const { data: ped } = await sb.from("pedidos").select("*").eq("id", pid).maybeSingle();
    if (!ped) return json(404, { ok: false, erro: "Pedido não encontrado." });
    if (!equipe && ped.client_id !== u.user.id) return json(403, { ok: false, erro: "Este pedido não é da sua conta." });

    // guarda a miniatura capturada no navegador (só cria, nunca sobrescreve; só JPEG pequeno; vídeo tem que existir)
    if (b.acao === "miniatura") {
      const vid = uuid(b.video_id);
      const m = String(b.imagem || "").match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
      if (!vid || !m) return json(400, { ok: false });
      const bytes = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0));
      if (bytes.length < 2000 || bytes.length > 350000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return json(400, { ok: false });
      const { data: ja } = await sb.from("video_miniaturas").select("video_id").eq("video_id", vid).maybeSingle();
      if (ja) return json(200, { ok: true, ja: true });
      const { data: existe } = await sb.from("videos").select("id").eq("id", vid).maybeSingle();
      if (!existe) return json(404, { ok: false });
      const path = `${vid}.jpg`;
      const up = await sb.storage.from("video-miniaturas").upload(path, bytes, { contentType: "image/jpeg", upsert: false });
      if (up.error && !/exists/i.test(up.error.message)) return json(500, { ok: false });
      await sb.from("video_miniaturas").insert({ video_id: vid, path });
      return json(200, { ok: true });
    }
    if (!ped.data_inicio) return json(200, { ok: true, pendente: true, pedido: { id: ped.id, nome: ped.nome_pedido }, aviso: "A campanha ainda não começou: o relatório aparece a partir do primeiro dia no ar." });

    const vertical = String(ped.tipo_produto || "").toLowerCase().includes("vertical");
    // nome da empresa para o relatório (marca do cliente → empresa do cadastro → nome do pedido); nunca o nome da pessoa
    const [{ data: marca }, { data: usr }] = await Promise.all([
      sb.from("marcas_clientes").select("empresa").eq("client_id", ped.client_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      sb.from("users").select("empresa_nome").eq("id", ped.client_id).maybeSingle(),
    ]);
    const empresa = String(marca?.empresa || usr?.empresa_nome || "").trim() || null;
    const { data: confs } = await sb.from("configuracoes_exibicao").select("horas_operacao_dia").limit(1);
    const horas = Number(confs?.[0]?.horas_operacao_dia) || 24; // telas ligadas 24 h (Jeferson, 06/11/2026)
    const segDia = horas * 3600;

    const hoje = Date.now();
    const ini = inicioDiaBR(String(ped.data_inicio).slice(0, 10));
    const fimContrato = ped.data_fim ? inicioDiaBR(String(ped.data_fim).slice(0, 10)) + DIA - 1 : hoje;
    const fim = Math.min(hoje, fimContrato);
    const dias: string[] = [];
    for (let t = ini; t <= fim; t += DIA) dias.push(diaBR(t + 3600_000));

    // prédios e telas
    const ids: string[] = (ped.lista_predios || []).filter(Boolean);
    const { data: predios } = ids.length ? await sb.from("buildings").select("id,nome,bairro,quantidade_telas,publico_estimado,status,imagem_principal,latitude,longitude,manual_latitude,manual_longitude").in("id", ids).neq("status", "interno").not("nome", "ilike", "%teste%") : { data: [] as any[] }; // telas internas da EXA (entrada, sala de reunião, tablet) não entram no relatório do cliente
    const { data: devs } = ids.length ? await sb.from("devices").select("id,building_id,is_deleted").in("building_id", ids) : { data: [] as any[] };
    const devsPorPredio = new Map<string, number>();
    for (const d of devs || []) if (!d.is_deleted) devsPorPredio.set(d.building_id, (devsPorPredio.get(d.building_id) || 0) + 1);

    // PROGRAMAÇÃO REAL DE CADA PRÉDIO, DIA A DIA (mesma regra do player v22 dos painéis, public/painel-web/ui/scripts/propagandas.js):
    // rodada = todos os horizontais (1 vídeo por pedido) com 1 vertical premium a cada 3 horizontais, 1 editorial
    // (Brasil → Foz → Curiosidades) e mais 1 vertical no fim; os verticais revezam entre si.
    // Quedas de internet não contam como tela apagada: o NUC continua tocando o que já baixou (decisão do Jeferson, 06/11).
    const { data: outros } = ids.length ? await sb.from("pedidos").select("id,status,tipo_produto,data_inicio,data_fim,lista_predios,blocked_at,is_test_order")
      .overlaps("lista_predios", ids).not("data_inicio", "is", null) : { data: [] as any[] };
    const tocam = (outros || []).filter((o: any) => o.id === ped.id || (!o.is_test_order && (TOCAM.includes(o.status) || o.status === "bloqueado")));
    const { data: durs } = tocam.length ? await sb.from("pedido_videos").select("pedido_id,videos(duracao)").eq("is_active", true).in("pedido_id", tocam.map((o: any) => o.id)) : { data: [] as any[] };
    const durPedido = new Map<string, number>();
    for (const x of durs || []) { const s = Number((x as any).videos?.duracao); if (s > 0) durPedido.set(x.pedido_id, Math.min(90, Math.max(5, s))); }
    const ehVert = (o: any) => String(o.tipo_produto || "").toLowerCase().includes("vertical");
    const dur = (o: any) => durPedido.get(o.id) || (EDITORIAIS.includes(o.id) ? 50 : ehVert(o) ? 15 : 10);
    const noDia = (o: any, d: string) => {
      const t = inicioDiaBR(d) + 12 * 3600_000;
      if (t < inicioDiaBR(String(o.data_inicio).slice(0, 10))) return false;
      if (o.data_fim && t > inicioDiaBR(String(o.data_fim).slice(0, 10)) + DIA) return false;
      if (o.status === "bloqueado" && o.id !== ped.id && (!o.blocked_at || Date.parse(o.blocked_at) <= t)) return false;
      return true;
    };
    const duracao = dur(ped);
    // exibições do NOSSO pedido por tela num dia, num prédio
    const programaDia = (bid: string, d: string) => {
      const ativos = tocam.filter((o: any) => (o.lista_predios || []).includes(bid) && noDia(o, d));
      if (!ativos.some((o: any) => o.id === ped.id)) ativos.push(ped);
      const ed = ativos.filter((o: any) => EDITORIAIS.includes(o.id));
      const hor = ativos.filter((o: any) => !EDITORIAIS.includes(o.id) && !ehVert(o));
      const ver = ativos.filter((o: any) => !EDITORIAIS.includes(o.id) && ehVert(o));
      const nH = hor.length, nE = ed.length, nP = ver.length;
      const media = (l: any[]) => (l.length ? l.reduce((a, o) => a + dur(o), 0) / l.length : 0);
      let rodada: number, porRodada: number, vPorRodada = 0;
      if (!nH && !nE) { rodada = ver.reduce((a, o) => a + dur(o), 0); porRodada = 1; }
      else {
        vPorRodada = nP ? (nH > 0 ? Math.floor((nH - 1) / 3) : 0) + 1 : 0;
        rodada = hor.reduce((a, o) => a + dur(o), 0) + (nE ? media(ed) : 0) + vPorRodada * media(ver);
        porRodada = vertical ? vPorRodada / nP : 1;
      }
      const exib = rodada > 0 ? (segDia / rodada) * porRodada : 0;
      return { exib, rodada, nH, nP, vPorRodada };
    };

    const porMes = new Map<string, { exibicoes: number; dias: number }>();
    const porDia = new Map<string, number>();
    let totalExib = 0, somaTelaDia = 0, contTelaDia = 0, rodadaHoje = 0, nRod = 0;
    const rodadasHoje: { nH: number; nP: number; vPorRodada: number; rodada: number }[] = [];
    const ultimoDia = dias[dias.length - 1];
    const linhasPredios = (predios || []).map((p: any) => {
      const telas = Math.max(1, Number(p.quantidade_telas) || devsPorPredio.get(p.id) || 1);
      let exib = 0, hojeTela = 0;
      for (const d of dias) {
        const x = programaDia(p.id, d);
        const e = Math.round(x.exib * telas);
        exib += e; somaTelaDia += x.exib; contTelaDia++;
        porDia.set(d, (porDia.get(d) || 0) + e);
        if (d === ultimoDia) { hojeTela = x.exib; rodadaHoje += x.rodada; nRod++; rodadasHoje.push(x); }
      }
      totalExib += exib;
      return {
        id: p.id, nome: String(p.nome || "").trim(), bairro: p.bairro || "", telas, exibicoes: exib,
        por_dia_tela: Math.round(hojeTela),
        participacao: Math.round(((hojeTela * duracao) / segDia) * 1000) / 10, // % do tempo da tela hoje
        horas_tela: Math.round((exib * duracao) / 360) / 10,
        publico: Number(p.publico_estimado) || 0,
        foto: fotoPredio(p.imagem_principal),
        lat: Number(p.manual_latitude ?? p.latitude) || null, lng: Number(p.manual_longitude ?? p.longitude) || null,
      };
    }).sort((a: any, b: any) => b.exibicoes - a.exibicoes);
    for (const [d, e] of porDia) {
      const m = d.slice(0, 7); const v = porMes.get(m) || { exibicoes: 0, dias: 0 };
      v.exibicoes += e; v.dias += 1; porMes.set(m, v);
    }
    const exibDiaTela = Math.round(linhasPredios.length ? linhasPredios.reduce((a: number, p: any) => a + p.por_dia_tela, 0) / linhasPredios.length : 0);
    const ciclo = Math.round(nRod ? rodadaHoje / nRod : 0);
    // a rodada "típica" de hoje (mediana dos prédios) para o desenho "como sua marca aparece"
    const tipica = [...rodadasHoje].sort((a, b) => a.rodada - b.rodada)[Math.floor(rodadasHoje.length / 2)] || { nH: 0, nP: 1, vPorRodada: 1, rodada: 0 };
    // ===================== VÍDEOS =====================
    // Fonte da verdade, quando existe: video_management_logs (o sincronizador grava 1 linha por MINUTO em que um vídeo
    // programado substitui o principal: video_from = principal do momento, video_to = o que está tocando). Desde 03/08/2026.
    // Dia sem linha = o principal tocou o dia todo. Antes do primeiro registro: sequência de publicações da conta.
    const { data: pvs } = await sb.from("pedido_videos").select("video_id,is_active,selected_for_display,is_base_video,approval_status,approved_at,created_at,videos(id,nome,duracao,orientacao,created_at,url)").eq("pedido_id", pid);
    const atuais = new Map<string, any>((pvs || []).map((x: any) => [x.video_id, x]));
    const { data: regras } = await sb.from("campaign_video_schedules").select("video_id,campaign_schedule_rules(days_of_week,start_time,end_time,is_all_day,is_active,rule_type,label),campaigns_advanced!inner(pedido_id)").eq("campaigns_advanced.pedido_id", pid);
    const regrasPorVideo = new Map<string, any[]>();
    for (const r of regras || []) regrasPorVideo.set(r.video_id, [...(regrasPorVideo.get(r.video_id) || []), ...((r as any).campaign_schedule_rules || []).filter((x: any) => x.is_active)]);

    const logs: { f: string | null; t: string | null; at: string }[] = [];
    for (let off = 0; off < 400000; off += 1000) {
      const { data: lg } = await sb.from("video_management_logs").select("video_from_id,video_to_id,created_at")
        .eq("pedido_id", pid).gte("created_at", new Date(ini).toISOString()).order("created_at").range(off, off + 999);
      for (const x of lg || []) logs.push({ f: x.video_from_id, t: x.video_to_id, at: x.created_at });
      if (!lg || lg.length < 1000) break;
    }
    // minutos por vídeo por dia + principal do dia + horários/dias da semana em que cada programado tocou
    const minDia = new Map<string, Map<string, number>>();
    const baseDia = new Map<string, Map<string, number>>();
    const horasVid = new Map<string, Set<number>>(), semVid = new Map<string, Set<number>>();
    for (const x of logs) {
      const t = Date.parse(x.at); const d = diaBR(t);
      if (x.t) { const m = minDia.get(d) || new Map(); m.set(x.t, (m.get(x.t) || 0) + 1); minDia.set(d, m);
        const br = new Date(t - 3 * 3600_000); (horasVid.get(x.t) || horasVid.set(x.t, new Set()).get(x.t)!).add(br.getUTCHours()); (semVid.get(x.t) || semVid.set(x.t, new Set()).get(x.t)!).add(br.getUTCDay()); }
      if (x.f) { const b = baseDia.get(d) || new Map(); b.set(x.f, (b.get(x.f) || 0) + 1); baseDia.set(d, b); }
    }
    const primeiroLog = logs.length ? diaBR(Date.parse(logs[0].at)) : null;

    // vídeos envolvidos: da conta do cliente + os que aparecem nos registros (podem estar em outra conta, ex.: Conta Interna)
    const { data: hist } = await sb.from("videos").select("id,nome,duracao,orientacao,created_at,origem,url")
      .eq("client_id", ped.client_id).gte("created_at", new Date(ini - 7 * DIA).toISOString()).lte("created_at", new Date(fim).toISOString()).order("created_at");
    const idsLog = [...new Set(logs.flatMap((x) => [x.f, x.t]).filter(Boolean) as string[])];
    const { data: deLog } = idsLog.length ? await sb.from("videos").select("id,nome,duracao,orientacao,created_at,origem,url").in("id", idsLog) : { data: [] as any[] };
    // vídeos do cinema que a equipe subiu pela Conta Interna da EXA (ex.: "3 setembro" = cine_3_de_setembro.mp4):
    // não ficam no pedido depois de trocados, mas foram o principal da semana
    const CONTA_INTERNA = "de96cfa9-9dbe-4ead-be94-3647e345d2de";
    let internos: any[] = [];
    const seriePrincipal = serieDoPedido(ped, hist || []);
    if (seriePrincipal === "cinema") {
      const { data: ci } = await sb.from("videos").select("id,nome,duracao,orientacao,created_at,origem,url").eq("client_id", CONTA_INTERNA)
        .gte("created_at", new Date(ini - 7 * DIA).toISOString()).lte("created_at", new Date(fim).toISOString());
      internos = (ci || []).filter((v: any) => {
        const arq = decodeURIComponent(String(v.url || "").split("/").pop() || "").toLowerCase();
        // automação semanal do cinema: Video-[VERTICAL-][15s-]qui11-qui18-jun.mp4 (só a orientação do pedido)
        const semanal = PADRAO_CINEMA.test(arq) && (vertical ? /vertical/.test(arq) || v.orientacao === "vertical" : !/vertical/.test(arq));
        return semanal || /\bcine\b|cinema|catarat/i.test(String(v.nome)) || /(^|[_\-\s])cine([_\-\s.]|$)/.test(arq);
      });
    }
    const todos = new Map<string, any>();
    for (const v of [...(hist || []), ...(deLog || []), ...internos]) todos.set(v.id, { ...v, serieForcada: internos.some((x) => x.id === v.id) ? "cinema" : undefined });
    for (const x of pvs || []) if (x.videos) todos.set(x.video_id, x.videos);
    const ordenados = [...todos.values()].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

    // principal de cada dia SEM registro de troca, antes dos registros: o último vídeo publicado da série principal
    const pvBase = (pvs || []).find((x: any) => x.is_base_video);
    let ultimoBase: string | null = null;
    const minutosPorVideoDia = new Map<string, Map<string, number>>(); // dia -> vídeo -> minutos
    for (const d of dias) {
      const m = new Map<string, number>();
      const prog = minDia.get(d);
      const bases = baseDia.get(d);
      if (bases && bases.size) ultimoBase = [...bases.entries()].sort((a, b) => b[1] - a[1])[0][0];
      else {
        // dia sem registro de troca: o principal é o último da série principal publicado até este dia
        // (antes dos registros) ou o principal anterior, a não ser que um vídeo novo da série tenha entrado depois dele
        const t = inicioDiaBR(d) + DIA;
        const cand = ordenados.filter((v) => Date.parse(v.created_at) <= t && !/\bteste?\b/i.test(v.nome) && ((hist || []).some((h: any) => h.id === v.id) || v.serieForcada));
        const daSerie = cand.filter((v) => seriePrincipal === "cinema" ? (v.serieForcada || serie(v.nome)) === "cinema" : (v.serieForcada || serie(v.nome)) !== "hotel");
        const novo = (daSerie[daSerie.length - 1] || cand[cand.length - 1]) || null;
        const atual = ultimoBase ? todos.get(ultimoBase) : null;
        if (!primeiroLog || d < primeiroLog || !atual) ultimoBase = novo?.id || ultimoBase;
        else if (novo && Date.parse(novo.created_at) > Date.parse(atual.created_at) && novo.id !== ultimoBase) ultimoBase = novo.id;
      }
      if (d === dias[dias.length - 1] && pvBase && !(bases && bases.size)) ultimoBase = pvBase.video_id;
      let usados = 0;
      if (prog) for (const [vid, mins] of prog) { const v = Math.min(1440, mins); m.set(vid, v); usados += v; }
      if (ultimoBase) m.set(ultimoBase, (m.get(ultimoBase) || 0) + Math.max(0, 1440 - usados));
      else m.set("__inicio", 1440);
      minutosPorVideoDia.set(d, m);
    }

    // exibições, período real e horários de cada vídeo
    const acum = new Map<string, { exib: number; de: string; ate: string; dias: number }>();
    for (const d of dias) {
      const m = minutosPorVideoDia.get(d)!; const tot = [...m.values()].reduce((a, b) => a + b, 0) || 1;
      for (const [vid, mins] of m) {
        if (mins <= 0) continue;
        const a = acum.get(vid) || { exib: 0, de: d, ate: d, dias: 0 };
        a.exib += (porDia.get(d) || 0) * (mins / tot); a.ate = d; a.dias += 1; acum.set(vid, a);
      }
    }
    const SEM = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
    const descreverRegras = (rs: any[]) => rs.map((r) => {
      const d = Array.isArray(r.days_of_week) && r.days_of_week.length && r.days_of_week.length < 7 ? r.days_of_week.map((n: number) => SEM[n]).join(", ") : "todos os dias";
      const h = r.is_all_day || !r.start_time ? "o dia todo" : `${String(r.start_time).slice(0, 5)}–${String(r.end_time || "").slice(0, 5)}`;
      return `${d}, ${h}`;
    }).join(" · ");
    const minutosProgramados = (vid: string) => { let n = 0; for (const m of minDia.values()) n += m.get(vid) || 0; return n; };
    const minutosTotais = (vid: string) => { let n = 0; for (const m of minutosPorVideoDia.values()) n += m.get(vid) || 0; return n || 1; };
    const horarioDoLog = (vid: string) => {
      const hs = horasVid.get(vid), ss = semVid.get(vid); if (!hs || !hs.size) return null;
      const h = [...hs].sort((a, b) => a - b);
      const faixa = h.length >= 23 ? "o dia todo" : `${String(h[0]).padStart(2, "0")}h–${String((h[h.length - 1] + 1) % 24).padStart(2, "0")}h`;
      const dd = ss && ss.size < 7 ? [...ss].sort().map((n) => SEM[n]).join(", ") : "todos os dias";
      return `${dd}, ${faixa}`;
    };
    const videos: any[] = [];
    for (const v of ordenados) {
      if (/\bteste?\b/i.test(v.nome)) continue;
      const pv = atuais.get(v.id); const a = acum.get(v.id);
      const noAr = !!(pv && pv.is_active !== false && pv.selected_for_display !== false && (pv.approval_status || "approved") === "approved" && (pv.is_base_video || (minDia.get(dias[dias.length - 1])?.has(v.id))));
      if (!a && !pv) continue; // nunca foi ao ar neste pedido
      const rs = regrasPorVideo.get(v.id) || [];
      videos.push({
        id: v.id, nome: String(v.nome || "Vídeo").trim(), url: v.url || null, emPedido: !!pv, publicado_em: v.created_at, duracao: Number(v.duracao) || duracao,
        orientacao: v.orientacao || (vertical ? "vertical" : "horizontal"), serie: v.serieForcada || serie(v.nome),
        situacao: noAr ? "no_ar" : a ? (pv ? "pausado" : "substituido") : "pausado",
        principal: !!pv?.is_base_video,
        programacao: rs.length ? descreverRegras(rs) : (minutosProgramados(v.id) >= 0.5 * minutosTotais(v.id) ? horarioDoLog(v.id) : null) || (noAr ? "todos os dias, o dia todo" : null),
        periodo: a ? { de: new Date(inicioDiaBR(a.de)).toISOString(), ate: new Date(Math.min(fim, inicioDiaBR(a.ate) + DIA - 1)).toISOString() } : null,
        dias_no_ar: a?.dias || 0,
        exibicoes: a ? Math.round(a.exib) : undefined,
      });
    }
    // vídeo sem série enviado junto com um do hotel (ex.: "vídeo 1 café hotel" + "vídeo 2 tarde") é do hotel
    for (const v of videos) if (v.serie === "geral" && !/okto/i.test(v.nome) && videos.some((w) => w.serie === "hotel" && Math.abs(Date.parse(w.publicado_em) - Date.parse(v.publicado_em)) < 3600_000)) v.serie = "hotel";
    // o mesmo vídeo enviado mais de uma vez (mesmo nome em até 48 h): soma num só
    for (let i = videos.length - 1; i > 0; i--) {
      const j = videos.findIndex((w, k) => k < i && w.nome.toLowerCase() === videos[i].nome.toLowerCase() && Math.abs(Date.parse(w.publicado_em) - Date.parse(videos[i].publicado_em)) < 2 * DIA);
      if (j < 0) continue;
      const [a, b] = [videos[j], videos[i]]; const fica = b.situacao === "no_ar" || b.principal ? b : a; const sai = fica === a ? b : a;
      fica.exibicoes = (fica.exibicoes || 0) + (sai.exibicoes || 0); fica.dias_no_ar = Math.max(fica.dias_no_ar, sai.dias_no_ar);
      if (sai.periodo) fica.periodo = fica.periodo ? { de: [fica.periodo.de, sai.periodo.de].sort()[0], ate: [fica.periodo.ate, sai.periodo.ate].sort()[1] } : sai.periodo;
      videos.splice(videos.indexOf(sai), 1);
    }
    // dias antes do primeiro vídeo que ainda existe no sistema (o arquivo do início da campanha foi trocado/apagado)
    const ini0 = acum.get("__inicio");
    if (ini0 && ini0.exib > 0) videos.unshift({
      id: "__inicio", nome: "Vídeo do início da campanha", url: null, emPedido: false, publicado_em: new Date(ini).toISOString(), duracao,
      orientacao: vertical ? "vertical" : "horizontal", serie: "geral", situacao: "substituido", principal: false, programacao: null, arquivo_antigo: true,
      periodo: { de: new Date(inicioDiaBR(ini0.de)).toISOString(), ate: new Date(inicioDiaBR(ini0.ate) + DIA - 1).toISOString() }, dias_no_ar: ini0.dias, exibicoes: Math.round(ini0.exib),
    });
    for (const v of videos) v.titulo = v.id === "__inicio" ? "Vídeo do início da campanha" : tituloVideo(v);
    // miniaturas já guardadas (cache permanente)
    const idsVideos = videos.map((v) => v.id).filter((id) => id !== "__inicio");
    const { data: minis } = idsVideos.length ? await sb.from("video_miniaturas").select("video_id,path").in("video_id", idsVideos) : { data: [] as any[] };
    const miniDe = new Map((minis || []).map((m: any) => [m.video_id, `${SUPA}/storage/v1/object/public/video-miniaturas/${m.path}`]));
    for (const v of videos) v.miniatura = miniDe.get(v.id) || null;
    const noAr = videos.filter((v) => v.situacao === "no_ar");

    // publicações por mês e por série (ex.: programação semanal do cinema)
    const pubMes = new Map<string, number>();
    for (const v of videos) { const m = diaBR(Date.parse(v.publicado_em)).slice(0, 7); pubMes.set(m, (pubMes.get(m) || 0) + 1); }
    const series: Record<string, { videos: number; semanas: number }> = {};
    for (const v of videos) {
      const s = series[v.serie] || { videos: 0, semanas: 0 }; s.videos += 1; series[v.serie] = s;
    }
    for (const k of Object.keys(series)) {
      const semanas = new Set(videos.filter((v) => v.serie === k).map((v) => { const t = Date.parse(v.publicado_em); return Math.floor((t - 3 * 3600_000 + 3 * DIA) / (7 * DIA)); }));
      series[k].semanas = semanas.size;
    }

    const telas = linhasPredios.reduce((a: number, p: any) => a + p.telas, 0);
    const diasNoAr = dias.length;
    const totalDias = Math.max(1, Math.round((fimContrato - ini) / DIA));
    return json(200, {
      ok: true,
      gerado_em: new Date().toISOString(),
      pedido: {
        id: ped.id, nome: ped.nome_pedido || "Campanha EXA", status: ped.status, cliente: empresa || ped.nome_pedido || ped.client_name || null, empresa, client_id: ped.client_id,
        produto: vertical ? "vertical_premium" : "horizontal", inicio: ped.data_inicio, fim: ped.data_fim, plano_meses: ped.plano_meses,
        dias_no_ar: diasNoAr, dias_restantes: ped.data_fim ? Math.max(0, Math.ceil((fimContrato - hoje) / DIA)) : null,
        progresso: Math.min(100, Math.round((diasNoAr / totalDias) * 100)),
      },
      rodada_tipica: { horizontais: tipica.nH, verticais: tipica.nP, verticais_por_rodada: tipica.vPorRodada, segundos: Math.round(tipica.rodada) },
      formato: {
        produto: vertical ? "Vertical Premium (tela cheia 1080×1920)" : "Horizontal (1080×890)",
        duracao_s: duracao, horas_dia: horas, ciclo_s: ciclo, exibicoes_dia_tela: exibDiaTela,
        tela_cheia: vertical,
        participacao: Math.round(((exibDiaTela * duracao) / segDia) * 1000) / 10,
        minutos_dia_tela: Math.round((exibDiaTela * duracao) / 60),
      },
      totais: {
        predios: linhasPredios.length, telas, exibicoes: totalExib, horas_tela: Math.round((totalExib * duracao) / 360) / 10,
        media_dia: diasNoAr ? Math.round(totalExib / diasNoAr) : 0,
        publico: linhasPredios.reduce((a: number, p: any) => a + (p.publico || 0), 0),
        videos_publicados: videos.length, videos_no_ar: noAr.length,
      },
      meses: [...porMes.entries()].sort().map(([mes, v]) => ({ mes, ...v })),
      dias: [...porDia.entries()].sort().slice(-90).map(([dia, exibicoes]) => ({ dia, exibicoes })),
      predios: linhasPredios,
      videos: videos.reverse(),
      publicacoes: { por_mes: [...pubMes.entries()].sort().map(([mes, qtd]) => ({ mes, qtd })), series },
      metodologia: `Calculado pela programação de cada tela, dia a dia: os painéis funcionam ${horas} h por dia e tocam em rodadas com todos os anúncios horizontais do prédio, ${vertical ? "o Vertical Premium em tela cheia a cada 3 anúncios horizontais e de novo no fim da rodada (revezando com os outros verticais do prédio)" : "um vertical em tela cheia a cada 3 horizontais"} e um conteúdo editorial. Para cada prédio contamos os anúncios que estavam no ar em cada dia, a duração de cada vídeo e o número de telas. Hoje uma rodada leva em média ${ciclo} s e sua marca aparece cerca de ${exibDiaTela} vezes por tela por dia, ${Math.round((exibDiaTela * duracao) / 60)} minutos por dia em cada tela.`,
    });
  } catch (e) {
    console.error("[RELATORIO]", (e as Error).message);
    return json(500, { ok: false, erro: "Não consegui montar o relatório agora. Tente de novo em instantes." });
  }
});
