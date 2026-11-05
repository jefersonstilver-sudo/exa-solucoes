// EXA (05/11/2026) — CONTRATO DE CADA PRÉDIO (admin › Prédios › Ver › Contrato).
// Só admin/super_admin (JWT do site). Ações (POST { acao, ... }):
//  resumo                       → { predios: { [building_id]: { contrato: bool, pedido: status|null } } } (selo nos cards)
//  listar   { building_id }     → contratos (com link de 10 min), pedidos, sugestão de dados (mesmo síndico de outros prédios)
//  previa   { building_id, dados } → PDF do contrato (base64) para conferir antes de pedir
//  solicitar{ building_id, dados } → agenda o pedido (dia útil 9h–18h sai na hora; senão próximo dia útil 9h)
//  enviar_agora { pedido_id }   → manda já, sem esperar o horário
//  cancelar { pedido_id }       → cancela pedido em aberto (e o envelope na ClickSign, se já saiu)
//  anexar   { building_id, titulo, assinado_em?, assinante_nome?, pdf_base64 } → guarda um contrato assinado manualmente
//  desativar{ contrato_id }     → tira um contrato do ar (fica no histórico)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  BUCKET, ABERTOS, proximoEnvio, quandoTexto, validarDados, pdfDoPedido, b64, enviarPedido,
} from "../_shared/predio-contratos.ts";
import { formatarCnpj } from "../_shared/predio-contrato-modelo.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const uuid = (v: unknown) => String(v || "").replace(/[^0-9a-f-]/gi, "").slice(0, 36);
const dig = (v: unknown) => String(v || "").replace(/\D/g, "");

function limparDados(d: any) {
  return {
    condominio_nome: String(d?.condominio_nome || "").trim().slice(0, 160),
    condominio_cnpj: formatarCnpj(dig(d?.condominio_cnpj)),
    condominio_endereco: String(d?.condominio_endereco || "").trim().slice(0, 300),
    signatario_nome: String(d?.signatario_nome || "").trim().replace(/\s+/g, " ").slice(0, 120),
    signatario_email: String(d?.signatario_email || "").trim().toLowerCase().slice(0, 160),
    signatario_telefone: dig(d?.signatario_telefone).slice(0, 15) || null,
    signatario_cargo: String(d?.signatario_cargo || "Síndico(a)").trim().slice(0, 40),
    qtd_paineis: Math.max(1, Math.min(10, Number(d?.qtd_paineis) || 1)),
  };
}

async function listar(sb: any, bid: string) {
  const { data: predio } = await sb.from("buildings")
    .select("id,nome,endereco,bairro,nome_sindico,contato_sindico,nome_vice_sindico,contato_vice_sindico,nome_contato_predio,numero_contato_predio,quantidade_telas")
    .eq("id", bid).maybeSingle();
  if (!predio) return json(404, { ok: false, erro: "prédio não encontrado" });
  const [{ data: contratos }, { data: pedidos }] = await Promise.all([
    sb.from("predio_contratos").select("id,titulo,arquivo_path,assinado_em,assinante_nome,assinante_email,ativo,criado_em,criado_por,clicksign_envelope_id").eq("building_id", bid).order("criado_em", { ascending: false }),
    sb.from("predio_contrato_pedidos").select("*").eq("building_id", bid).order("criado_em", { ascending: false }).limit(10),
  ]);
  const comLink = await Promise.all((contratos || []).map(async (c: any) => {
    const nome = `${c.titulo || "Contrato"}.pdf`.replace(/[\\/:*?"<>|]/g, "");
    const [{ data: v }, { data: d }] = await Promise.all([
      sb.storage.from(BUCKET).createSignedUrl(c.arquivo_path, 600),
      sb.storage.from(BUCKET).createSignedUrl(c.arquivo_path, 600, { download: nome }),
    ]);
    return { ...c, ver: v?.signedUrl || null, baixar: d?.signedUrl || null };
  }));

  // sugestão: último pedido com dados; senão, o mesmo síndico em outros prédios (telefone igual) → quem assinou lá
  const ultimo = (pedidos || []).find((p: any) => p.condominio_cnpj || p.signatario_email);
  const tels = [predio.contato_sindico, predio.contato_vice_sindico, predio.numero_contato_predio].map(dig).filter((t) => t.length >= 10).map((t) => t.slice(-8));
  let mesmos: any[] = [];
  if (tels.length) {
    const { data: outros } = await sb.from("buildings").select("id,nome,contato_sindico,contato_vice_sindico,numero_contato_predio").neq("id", bid);
    const ids = (outros || []).filter((o: any) => [o.contato_sindico, o.contato_vice_sindico, o.numero_contato_predio].map(dig).some((t: string) => t.length >= 8 && tels.includes(t.slice(-8))));
    if (ids.length) {
      const { data: cs } = await sb.from("predio_contratos").select("building_id,assinante_nome,assinante_email,assinado_em").in("building_id", ids.map((o: any) => o.id)).eq("ativo", true);
      mesmos = (cs || []).filter((c: any) => c.assinante_nome).map((c: any) => ({ ...c, predio: ids.find((o: any) => o.id === c.building_id)?.nome }));
    }
  }
  const porNome = new Map<string, any>();
  for (const m of mesmos) { const k = String(m.assinante_nome).toLowerCase(); const v = porNome.get(k) || { nome: m.assinante_nome, email: m.assinante_email, predios: [] as string[] }; v.predios.push(String(m.predio || "").trim()); if (!v.email && m.assinante_email) v.email = m.assinante_email; porNome.set(k, v); }
  const mesmoSindico = [...porNome.values()].sort((a, b) => b.predios.length - a.predios.length);
  const s0 = mesmoSindico[0];
  const telSind = dig(predio.contato_sindico) || dig(predio.contato_vice_sindico) || dig(predio.numero_contato_predio);
  const sugestao = ultimo ? limparDados(ultimo) : {
    condominio_nome: String(predio.nome || "").trim(),
    condominio_cnpj: "",
    condominio_endereco: [predio.endereco, predio.bairro].filter(Boolean).join(" - ").replace(/\s+/g, " ").trim(),
    signatario_nome: s0?.nome || "",
    signatario_email: s0?.email || "",
    signatario_telefone: telSind || "",
    signatario_cargo: "Síndico(a)",
    qtd_paineis: Math.max(1, Number(predio.quantidade_telas) || 1),
  };
  const proxima = proximoEnvio();
  return json(200, {
    ok: true, predio: { id: predio.id, nome: String(predio.nome).trim(), sindico: predio.nome_sindico, vice: predio.nome_vice_sindico, contato: predio.nome_contato_predio },
    contratos: comLink, pedidos: pedidos || [], sugestao, mesmo_sindico: mesmoSindico,
    envio: { quando: proxima.toISOString(), texto: quandoTexto(proxima) },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(jwt);
    if (!u?.user) return json(401, { ok: false, erro: "não autenticado" });
    const { data: papeis } = await sb.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!(papeis || []).some((r: any) => ["admin", "super_admin"].includes(String(r.role)))) return json(403, { ok: false, erro: "sem permissão" });
    const quem = u.user.email || "admin";
    const b = await req.json().catch(() => ({}));
    const bid = uuid(b.building_id);

    switch (b.acao) {
      case "resumo": {
        const [{ data: c }, { data: p }] = await Promise.all([
          sb.from("predio_contratos").select("building_id").eq("ativo", true),
          sb.from("predio_contrato_pedidos").select("building_id,status").in("status", ABERTOS),
        ]);
        const out: Record<string, { contrato: boolean; pedido: string | null }> = {};
        for (const x of c || []) out[x.building_id] = { contrato: true, pedido: null };
        for (const x of p || []) out[x.building_id] = { contrato: out[x.building_id]?.contrato || false, pedido: x.status };
        return json(200, { ok: true, predios: out });
      }
      case "listar": return await listar(sb, bid);
      case "previa": {
        const d = limparDados(b.dados);
        const erro = validarDados(d);
        if (erro) return json(400, { ok: false, erro });
        return json(200, { ok: true, pdf_base64: b64(await pdfDoPedido(d)) });
      }
      case "solicitar": {
        const { data: predio } = await sb.from("buildings").select("id,nome").eq("id", bid).maybeSingle();
        if (!predio) return json(404, { ok: false, erro: "prédio não encontrado" });
        const d = limparDados(b.dados);
        const erro = validarDados(d);
        if (erro) return json(400, { ok: false, erro });
        const quando = proximoEnvio();
        const { data: aberto } = await sb.from("predio_contrato_pedidos").select("id,status").eq("building_id", bid).in("status", ABERTOS).maybeSingle();
        if (aberto && ["enviando", "enviado"].includes(aberto.status)) return json(409, { ok: false, erro: "Já existe um contrato enviado para assinatura neste prédio. Cancele o pedido atual antes de pedir outro." });
        const campos = { ...d, status: "agendado", agendado_para: quando.toISOString(), erro: null, criado_por: quem, atualizado_em: new Date().toISOString() };
        const { data: ped, error } = aberto
          ? await sb.from("predio_contrato_pedidos").update(campos).eq("id", aberto.id).select("*").single()
          : await sb.from("predio_contrato_pedidos").insert({ ...campos, building_id: bid, origem: "admin" }).select("*").single();
        if (error) return json(500, { ok: false, erro: error.message });
        let envio: any = null;
        if (quando.getTime() <= Date.now() + 60_000) envio = await enviarPedido(sb, ped.id);
        return json(200, { ok: true, pedido_id: ped.id, agendado_para: quando.toISOString(), quando: quandoTexto(quando), enviado: !!envio?.ok, erro_envio: envio && !envio.ok ? envio.erro : null });
      }
      case "enviar_agora": {
        const id = uuid(b.pedido_id);
        await sb.from("predio_contrato_pedidos").update({ agendado_para: new Date().toISOString() }).eq("id", id).eq("status", "agendado");
        const r = await enviarPedido(sb, id);
        return json(r.ok ? 200 : 400, { ok: r.ok, erro: r.erro });
      }
      case "cancelar": {
        const id = uuid(b.pedido_id);
        const { data: p } = await sb.from("predio_contrato_pedidos").select("*").eq("id", id).maybeSingle();
        if (!p) return json(404, { ok: false, erro: "pedido não encontrado" });
        let aviso = null;
        if (p.status === "enviado" && p.clicksign_envelope_id) {
          const t = Deno.env.get("CLICKSIGN_ACCESS_TOKEN") || "";
          const r = await fetch(`https://app.clicksign.com/api/v3/envelopes/${p.clicksign_envelope_id}`, {
            method: "PATCH", headers: { "Content-Type": "application/vnd.api+json", Accept: "application/vnd.api+json", Authorization: t },
            body: JSON.stringify({ data: { id: p.clicksign_envelope_id, type: "envelopes", attributes: { status: "canceled" } } }),
          }).catch(() => null);
          if (!r?.ok) aviso = "Não consegui cancelar o envelope na ClickSign; cancele por lá também.";
        }
        await sb.from("predio_contrato_pedidos").update({ status: "cancelado", atualizado_em: new Date().toISOString(), erro: aviso }).eq("id", id);
        return json(200, { ok: true, aviso });
      }
      case "anexar": {
        const { data: predio } = await sb.from("buildings").select("id,nome").eq("id", bid).maybeSingle();
        if (!predio) return json(404, { ok: false, erro: "prédio não encontrado" });
        const bruto = String(b.pdf_base64 || "").replace(/^data:[^,]*,/, "");
        const bytes = Uint8Array.from(atob(bruto), (c) => c.charCodeAt(0));
        if (bytes.length < 1000 || String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") return json(400, { ok: false, erro: "Envie um arquivo PDF." });
        if (bytes.length > 15 * 1024 * 1024) return json(400, { ok: false, erro: "PDF maior que 15 MB." });
        const caminho = `${bid}/manual-${crypto.randomUUID()}.pdf`;
        const { error: up } = await sb.storage.from(BUCKET).upload(caminho, bytes, { contentType: "application/pdf" });
        if (up) return json(500, { ok: false, erro: "falha ao guardar: " + up.message });
        await sb.from("predio_contratos").update({ ativo: false }).eq("building_id", bid).eq("ativo", true);
        const { error } = await sb.from("predio_contratos").insert({
          building_id: bid, titulo: String(b.titulo || `Contrato ${String(predio.nome).trim()}`).trim().slice(0, 160), arquivo_path: caminho,
          assinado_em: b.assinado_em ? new Date(b.assinado_em).toISOString() : null, assinante_nome: String(b.assinante_nome || "").trim() || null,
          ativo: true, criado_por: `${quem} (anexado no admin)`,
        });
        if (error) return json(500, { ok: false, erro: error.message });
        // pedido em aberto deste prédio fica resolvido
        await sb.from("predio_contrato_pedidos").update({ status: "cancelado", erro: "contrato anexado manualmente", atualizado_em: new Date().toISOString() })
          .eq("building_id", bid).in("status", ["aguardando_dados", "agendado"]);
        return json(200, { ok: true });
      }
      case "desativar": {
        const id = uuid(b.contrato_id);
        const { error } = await sb.from("predio_contratos").update({ ativo: false }).eq("id", id);
        return json(error ? 500 : 200, { ok: !error, erro: error?.message });
      }
      default: return json(400, { ok: false, erro: "ação inválida" });
    }
  } catch (e) {
    console.error("[CONTRATOS-PREDIO]", (e as Error).message);
    return json(500, { ok: false, erro: (e as Error).message });
  }
});
