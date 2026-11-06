// =====================================================================
// NANDO · CRM (painel admin): lista conversas dos síndicos, mensagens, ficha do síndico,
// assumir/devolver atendimento, enviar mensagem como EXA e apagar a conversa.
// Só admin / super_admin. Nunca apaga avisos (nando_avisos) — só o histórico da conversa.
// =====================================================================
import {
  chavesTelefone, clienteIdDoPredio, db, enviarTexto, enviarDigitando, prediosDoTelefone, telefoneCanonico,
  enviarVideo, VIDEO_PAINEL_URL, LEGENDA_VIDEO_PAINEL, VIDEO_APRESENTACAO_URL,
} from "../_shared/nando-core.ts";
import { executar, type Contexto } from "../_shared/nando-agente.ts";
import { lerReferencia, revisarAviso, aprovacaoValida } from "../_shared/nando-qualidade.ts";

// ferramentas do Nando que a equipe pode usar pelo CRM na conversa de um sindico (nunca publica nem remove: isso so com o sindico)
const FERRAMENTAS_CRM = ["ver_contrato", "logo_do_predio", "ler_referencia", "criar_aviso_nando", "criar_opcoes_documento", "listar_avisos", "salvar_preferencia", "ver_arquivo"];

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (status: number, b: unknown) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const HORAS_HUMANO_PADRAO = 12;

function textoDe(m: any): string {
  const c = m?.conteudo || {};
  const anexo = c.midia && !String(c.texto || "").startsWith("[áudio") ? `[${c.midia}] ` : "";
  return (anexo + String(c.texto || "")).trim() || (c.midia ? `[${c.midia}]` : "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const sb = db();
  try {
    // --- autenticação: só admin ---
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(jwt);
    if (!u?.user) return json(401, { error: "não autenticado" });
    // has_role tem duas versões (text e app_role) e a chamada RPC fica ambígua: lê user_roles direto
    const { data: papeis } = await sb.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!(papeis || []).some((r: any) => ["admin", "super_admin"].includes(String(r.role)))) return json(403, { error: "sem permissão" });
    const { data: perfil } = await sb.from("users").select("nome, email").eq("id", u.user.id).maybeSingle().then((r) => r, () => ({ data: null }));
    const autor = (perfil as any)?.nome || (perfil as any)?.email || u.user.email || "Equipe EXA";

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const tel = body.telefone ? telefoneCanonico(String(body.telefone)) : "";

    // ---------------- lista de conversas ----------------
    if (action === "list") {
      const { data: msgs, error } = await sb.from("nando_mensagens")
        .select("id, telefone, building_id, papel, conteudo, created_at")
        .order("id", { ascending: false }).limit(3000);
      if (error) throw error;
      const porTel = new Map<string, any>();
      for (const m of msgs || []) {
        const t = m.telefone;
        if (!porTel.has(t)) porTel.set(t, { telefone: t, ultima: m, total: 0, nome_whatsapp: null, building_id: null, nao_respondidas: 0, respondida: false });
        const c = porTel.get(t);
        c.total++;
        if (!c.nome_whatsapp && m.conteudo?.nome_whatsapp) c.nome_whatsapp = m.conteudo.nome_whatsapp;
        if (!c.building_id && m.building_id) c.building_id = m.building_id;
        if (!c.respondida) { if (m.papel === "sindico") c.nao_respondidas++; else if (m.papel === "nando" || m.papel === "humano") c.respondida = true; }
      }
      const [{ data: atend }, { data: estados }, { data: predios }] = await Promise.all([
        sb.from("nando_atendimento").select("*"),
        sb.from("nando_estado").select("telefone, building_id"),
        sb.from("buildings").select("id, nome, status, nome_sindico, contato_sindico, contato_sindico_telefone, nome_vice_sindico, contato_vice_sindico, nome_contato_predio, numero_contato_predio"),
      ]);
      const atendPor = new Map((atend || []).map((x: any) => [x.telefone, x]));
      const estPor = new Map((estados || []).map((x: any) => [x.telefone, x.building_id]));
      const nomePredio = new Map((predios || []).map((b: any) => [b.id, String(b.nome).trim()]));
      // vínculo pelos contatos cadastrados no prédio (mesma regra do Nando, inclui prédios não ativos)
      const vinculos = (t: string) => {
        const k = chavesTelefone(t);
        const out: { id: string; nome: string; papel: string; nome_pessoa: string | null; status: string }[] = [];
        for (const b of predios || []) {
          const pares: [string, string | null, string | null][] = [
            ["síndico", b.nome_sindico, b.contato_sindico], ["síndico", b.nome_sindico, b.contato_sindico_telefone],
            ["vice-síndico", b.nome_vice_sindico, b.contato_vice_sindico], ["contato do prédio", b.nome_contato_predio, b.numero_contato_predio],
          ];
          for (const [papel, n, tt] of pares) {
            if (tt && chavesTelefone(tt).some((x) => k.includes(x))) { out.push({ id: b.id, nome: String(b.nome).trim(), papel, nome_pessoa: n || null, status: b.status }); break; }
          }
        }
        return out;
      };
      const conversas = [...porTel.values()].map((c) => {
        const v = vinculos(c.telefone);
        const at: any = atendPor.get(c.telefone);
        const humano = at?.modo === "humano" && (!at.humano_ate || new Date(at.humano_ate).getTime() > Date.now());
        return {
          telefone: c.telefone,
          nome: v.find((x) => x.nome_pessoa)?.nome_pessoa || c.nome_whatsapp || `+${c.telefone}`,
          nome_whatsapp: c.nome_whatsapp,
          predios: v.map((x) => ({ id: x.id, nome: x.nome, papel: x.papel })),
          predio_atual: nomePredio.get(estPor.get(c.telefone) || c.building_id) || null,
          tipo: v.length ? (v.some((x) => x.papel !== "contato do prédio") ? "sindico" : "contato") : "sem_cadastro",
          modo: humano ? "humano" : "auto",
          humano_ate: humano ? at.humano_ate : null,
          assumido_por: humano ? at.assumido_por_nome : null,
          ultima_em: c.ultima.created_at,
          preview: textoDe(c.ultima).slice(0, 120),
          ultima_papel: c.ultima.papel,
          aguardando: c.nao_respondidas,
          total: c.total,
        };
      }).sort((x, y) => (y.ultima_em || "").localeCompare(x.ultima_em || ""));
      return json(200, { conversas });
    }

    if (!tel) return json(400, { error: "telefone obrigatório" });

    // ---------------- mensagens ----------------
    if (action === "messages") {
      const { data, error } = await sb.from("nando_mensagens").select("id, papel, conteudo, created_at, building_id")
        .eq("telefone", tel).order("id", { ascending: true }).limit(500);
      if (error) throw error;
      const mensagens = (data || []).map((m: any) => ({
        id: m.id, papel: m.papel, texto: textoDe(m), autor: m.conteudo?.autor || null, created_at: m.created_at,
        midia: m.conteudo?.midia || null, // o chat do CRM abre o arquivo pela exa2-crm-chat (action midia)
      }));
      return json(200, { mensagens });
    }

    // ---------------- ficha do síndico ----------------
    if (action === "ficha") {
      const { predios } = await prediosDoTelefone(sb, tel);
      // inclui também prédios não ativos em que o número aparece (histórico)
      const ids = predios.map((p) => p.id);
      const [{ data: devs }, { data: avisos }, { data: perfis }, { data: sofia }, { data: interessado }, { data: primeira }, { data: est }] = await Promise.all([
        ids.length ? sb.from("devices").select("building_id, name, status, last_online_at").in("building_id", ids).neq("status", "deleted") : Promise.resolve({ data: [] }),
        ids.length ? sb.from("nando_avisos").select("building_id, titulo, status, inicio, fim, criado_por_nome, created_at").in("building_id", ids).order("created_at", { ascending: false }).limit(60) : Promise.resolve({ data: [] }),
        ids.length ? sb.from("nando_predio_perfil").select("*").in("building_id", ids) : Promise.resolve({ data: [] }),
        sb.from("sofia_contacts").select("id, name, role, phone").or(chavesTelefone(tel).map((k) => `phone.eq.${k}`).join(",")).limit(1),
        sb.from("sindicos_interessados").select("id, nome_predio, status, sindico_nome, sindico_whatsapp, celular, protocolo, created_at").order("created_at", { ascending: false }).limit(1000)
          .then((r) => ({ data: (r.data || []).filter((x: any) => [x.sindico_whatsapp, x.celular].some((t) => t && chavesTelefone(t).some((k) => chavesTelefone(tel).includes(k)))).map(({ sindico_whatsapp: _w, celular: _c, ...resto }: any) => resto) }), () => ({ data: [] })),
        sb.from("nando_mensagens").select("created_at, conteudo").eq("telefone", tel).order("id", { ascending: true }).limit(1),
        sb.from("nando_estado").select("building_id, confirmado, updated_at").eq("telefone", tel).maybeSingle(),
      ]);
      const { data: bInfo } = ids.length
        ? await sb.from("buildings").select("id, nome, endereco, bairro, status, numero_elevadores, quantidade_telas, nome_sindico, nome_vice_sindico, nome_contato_predio").in("id", ids)
        : { data: [] as any[] };
      const fichaPredios = predios.map((p) => {
        const b: any = (bInfo || []).find((x: any) => x.id === p.id) || {};
        const d = (devs || []).filter((x: any) => x.building_id === p.id);
        const av = (avisos || []).filter((x: any) => x.building_id === p.id);
        const perf: any = (perfis || []).find((x: any) => x.building_id === p.id) || null;
        return {
          id: p.id, nome: p.nome, codigo: p.codigo, tela_id: clienteIdDoPredio(p.id), papel: p.papel,
          endereco: [b.endereco, b.bairro].filter(Boolean).join(" · ") || null, status: b.status || null,
          telas: d.length, telas_online: d.filter((x: any) => String(x.status).toLowerCase() === "online").length,
          avisos_ativos: av.filter((x: any) => String(x.status) === "no_ar").length,
          avisos_recentes: av.slice(0, 5).map((x: any) => ({ titulo: x.titulo, status: x.status, inicio: x.inicio, fim: x.fim })),
          pausado: !!perf?.pausado,
        };
      });
      return json(200, {
        ficha: {
          telefone: tel,
          nome: predios.find((p) => p.nome_pessoa)?.nome_pessoa || primeira?.[0]?.conteudo?.nome_whatsapp || null,
          predios: fichaPredios,
          predio_atual: est?.building_id || null,
          primeira_conversa: primeira?.[0]?.created_at || null,
          sofia: sofia?.[0] || null,
          interessado: (interessado || [])[0] || null,
        },
      });
    }

    // ---------------- assumir / devolver ----------------
    if (action === "set_mode") {
      const modo = body.modo === "humano" ? "humano" : "auto";
      const horas = Math.min(Math.max(Number(body.horas) || HORAS_HUMANO_PADRAO, 1), 72);
      const { error } = await sb.from("nando_atendimento").upsert({
        telefone: tel, modo,
        humano_ate: modo === "humano" ? new Date(Date.now() + horas * 3600e3).toISOString() : null,
        assumido_por: modo === "humano" ? u.user.id : null,
        assumido_por_nome: modo === "humano" ? autor : null,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: "telefone" });
      if (error) throw error;
      await sb.from("nando_mensagens").insert({ telefone: tel, papel: "sistema", conteudo: { texto: modo === "humano" ? `${autor} assumiu o atendimento pelo CRM (Nando pausado por ${horas}h nesta conversa).` : `${autor} devolveu o atendimento ao Nando.` } });
      return json(200, { ok: true, modo });
    }

    // ---------------- apresentar o Nando a um sindico (manda como o Nando, NAO pausa) ----------------
    // texto em mensagens curtas separadas por linha em branco; fica no historico com "[apresentação]" para o Nando continuar
    if (action === "apresentar") {
      const texto = String(body.texto || "").trim();
      if (!tel || texto.length < 5) return json(400, { error: "telefone e texto obrigatorios" });
      const partes = texto.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).slice(0, 3);
      for (let i = 0; i < partes.length; i++) {
        if (i) { await enviarDigitando(sb, tel, 1500); await new Promise((r) => setTimeout(r, 1600)); }
        await enviarTexto(sb, tel, partes[i]);
      }
      await sb.from("nando_mensagens").insert({ telefone: tel, building_id: body.building_id || null, papel: "nando", conteudo: { texto: "[apresentação] " + partes.join("\n\n"), autor } });
      await sb.from("nando_atendimento").upsert({ telefone: tel, modo: "auto", humano_ate: null, assumido_por: null, assumido_por_nome: null, atualizado_em: new Date().toISOString() }, { onConflict: "telefone" });
      return json(200, { ok: true, enviadas: partes.length });
    }

    // ---------------- usar uma ferramenta do Nando na conversa do sindico (prepara; nao envia nada a ele) ----------------
    // ex.: preparar um aviso para o CEO aprovar antes de mandar ao sindico. O que foi feito fica no historico (papel sistema)
    // ---------------- teste de qualidade do Nando (v49): le referencia e passa cartoes no revisor, SEM conversa e SEM criar aviso ----------------
    // body: { midias: [{id,mime,url}], pedido, cartoes_teste: { nome: [dados...] }, aprovacoes: [{citacao, depois:[...]}] }
    if (action === "teste_qualidade") {
      const midias = Array.isArray(body.midias) ? body.midias.slice(0, 6) : [];
      const ref = midias.length ? await lerReferencia(sb, "5500000000000", midias, String(body.pedido || "")) : null;
      const revisoes: Record<string, unknown> = {};
      for (const [nome, cartoes] of Object.entries(body.cartoes_teste || {})) {
        revisoes[nome] = await revisarAviso({ pedido: String(body.pedido || ""), ref, cartoes: cartoes as any[] });
      }
      const aprov = (Array.isArray(body.aprovacoes) ? body.aprovacoes : []).map((x: any) => ({ citacao: x.citacao, erro: aprovacaoValida(String(x.citacao || ""), x.depois || []) }));
      return json(200, { ok: true, ref, revisoes, aprovacoes: aprov });
    }

    if (action === "ferramenta") {
      const nome = String(body.nome || "");
      if (!tel || !FERRAMENTAS_CRM.includes(nome)) return json(400, { error: "telefone e ferramenta permitida obrigatorios", permitidas: FERRAMENTAS_CRM });
      const { predios, nome: nomePessoa } = await prediosDoTelefone(sb, tel);
      const predioAtual = predios.find((p) => p.id === body.building_id) || (predios.length === 1 ? predios[0] : null);
      if (!predioAtual) return json(400, { error: "building_id do sindico obrigatorio", predios: predios.map((p) => ({ id: p.id, nome: p.nome })) });
      const c: Contexto = { sb, tel, nomePessoa: nomePessoa || "", admin: false, predios, predioAtual, midias: {}, registros: [], inicio: Date.now() };
      const saida: any = await executar(c, nome, body.entrada || {});
      const texto = typeof saida === "string" ? saida : saida?.texto;
      const imagens = typeof saida === "string" ? [] : (saida?.blocos || []).filter((x: any) => x.type === "image").map((x: any) => `data:${x.source.media_type};base64,${x.source.data}`);
      await sb.from("nando_mensagens").insert({ telefone: tel, building_id: predioAtual.id, papel: "sistema", conteudo: { texto: `(preparado pela equipe EXA — ${autor} — ainda NÃO mostrado ao síndico)\n${c.registros.join("\n")}\n${nome}(${JSON.stringify(body.entrada || {}).slice(0, 600)}) → ${String(texto || "").slice(0, 1500)}` } });
      return json(200, { ok: true, texto, registros: c.registros, imagens });
    }

    // ---------------- mandar um video do Nando (painel | apresentacao) como o Nando, sem pausar ----------------
    if (action === "video") {
      if (!tel) return json(400, { error: "telefone obrigatorio" });
      const painel = body.qual !== "apresentacao";
      const legenda = String(body.legenda || (painel ? LEGENDA_VIDEO_PAINEL : "🎬 Nando · a nova EXA — como funciona"));
      await enviarVideo(sb, tel, painel ? VIDEO_PAINEL_URL : VIDEO_APRESENTACAO_URL, legenda);
      const { data: ult } = await sb.from("nando_mensagens").select("id").eq("telefone", tel).eq("papel", "sindico").order("id", { ascending: false }).limit(1);
      await sb.from("nando_mensagens").insert({ telefone: tel, building_id: body.building_id || null, papel: "nando", conteudo: { texto: `(enviei o vídeo ${painel ? "do Painel do Síndico" : "de apresentação"}) ${legenda}`, autor, ate: ult?.[0]?.id || null } });
      return json(200, { ok: true });
    }

    // ---------------- falar como o Nando (NAO pausa; conta como resposta do Nando as mensagens que ja chegaram) ----------------
    if (action === "falar") {
      const texto = String(body.texto || "").trim();
      if (!tel || texto.length < 2) return json(400, { error: "telefone e texto obrigatorios" });
      const { data: ult } = await sb.from("nando_mensagens").select("id").eq("telefone", tel).eq("papel", "sindico").order("id", { ascending: false }).limit(1);
      const partes = texto.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).slice(0, 3);
      for (let i = 0; i < partes.length; i++) {
        if (i) { await enviarDigitando(sb, tel, 1500); await new Promise((r) => setTimeout(r, 1600)); }
        await enviarTexto(sb, tel, partes[i]);
      }
      await sb.from("nando_mensagens").insert({ telefone: tel, building_id: body.building_id || null, papel: "nando", conteudo: { texto: partes.join("\n\n"), autor, ate: ult?.[0]?.id || null } });
      return json(200, { ok: true, enviadas: partes.length });
    }

    // ---------------- enviar como EXA (pausa o Nando nesta conversa) ----------------
    if (action === "send") {
      const texto = String(body.texto || "").trim();
      if (!texto) return json(400, { error: "mensagem vazia" });
      const { data: ult } = await sb.from("nando_mensagens").select("id").eq("telefone", tel).eq("papel", "sindico").order("id", { ascending: false }).limit(1);
      await enviarTexto(sb, tel, texto);
      await sb.from("nando_mensagens").insert({ telefone: tel, papel: "humano", conteudo: { texto, autor, ate: ult?.[0]?.id || null } });
      const { data: at } = await sb.from("nando_atendimento").select("modo, humano_ate").eq("telefone", tel).maybeSingle();
      const ativo = at?.modo === "humano" && (!at.humano_ate || new Date(at.humano_ate).getTime() > Date.now());
      if (!ativo) {
        await sb.from("nando_atendimento").upsert({
          telefone: tel, modo: "humano", humano_ate: new Date(Date.now() + HORAS_HUMANO_PADRAO * 3600e3).toISOString(),
          assumido_por: u.user.id, assumido_por_nome: autor, atualizado_em: new Date().toISOString(),
        }, { onConflict: "telefone" });
      }
      return json(200, { ok: true });
    }

    // ---------------- apagar a conversa (não apaga avisos nem o cadastro do prédio) ----------------
    if (action === "apagar") {
      if (body.confirmar !== "apagar") return json(400, { error: "confirmação ausente" });
      const { count } = await sb.from("nando_mensagens").select("id", { count: "exact", head: true }).eq("telefone", tel);
      const r1 = await sb.from("nando_mensagens").delete().eq("telefone", tel);
      if (r1.error) throw r1.error;
      await sb.from("nando_estado").delete().eq("telefone", tel);
      await sb.from("nando_atendimento").delete().eq("telefone", tel);
      console.log(`[NANDO-CRM] conversa ${tel} apagada por ${autor} (${count} mensagens)`);
      return json(200, { ok: true, apagadas: count || 0 });
    }

    return json(400, { error: "ação desconhecida" });
  } catch (e) {
    console.error("[NANDO-CRM]", (e as Error).message);
    return json(500, { error: (e as Error).message });
  }
});
