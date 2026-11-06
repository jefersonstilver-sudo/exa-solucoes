// EXA (06/11/2026) — NANDO E O CONTRATO DO PRÉDIO.
// ver_contrato: lê o PDF assinado de verdade (predio_contratos → bucket contratos-predios), guarda o texto em
//   predio_contratos.texto e devolve ao modelo para ele explicar com as palavras do próprio contrato (cláusula por cláusula).
// pedir_contrato: prédio sem contrato → pedido "aguardando_dados" (o mesmo do botão "Pedir ao Nando" do painel) e avisa o Jeferson.
// O Nando explica; não negocia, não muda cláusula, não dá parecer jurídico, não rescinde.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";
import { telefoneCanonico, SITE_URL } from "./nando-core.ts";
import { ABERTOS as PEDIDOS_ABERTOS, avisarJeferson } from "./predio-contratos.ts";

export const FERRAMENTAS_CONTRATO = [
  {
    name: "ver_contrato",
    description: "Abre o contrato de comodato do painel EXA do prédio atual (o PDF assinado de verdade) e devolve o texto, a data e quem assinou, ou diz que o prédio ainda não tem contrato no sistema. Use SEMPRE que perguntarem qualquer coisa sobre o contrato (prazo, rescisão, custos, Wi-Fi, obrigações, quem assinou, onde ver/baixar) e responda com base no texto devolvido, citando a cláusula.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "pedir_contrato",
    description: "Registra o pedido do contrato para um prédio que ainda NÃO tem contrato no sistema (ver_contrato disse 'sem contrato') e avisa a equipe da EXA. Não use se o contrato já existe: nesse caso mande o caminho do painel.",
    input_schema: { type: "object", properties: {} },
  },
];
export const NOMES_CONTRATO = FERRAMENTAS_CONTRATO.map((f) => f.name);

const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }) : null;

async function textoDoContrato(sb: SupabaseClient, c: any): Promise<string> {
  if (c.texto) return c.texto;
  const { data: arq, error } = await sb.storage.from("contratos-predios").download(c.arquivo_path);
  if (error || !arq) throw new Error("não consegui abrir o PDF do contrato");
  const pdf = await getDocumentProxy(new Uint8Array(await arq.arrayBuffer()));
  const { text } = await extractText(pdf, { mergePages: true });
  let t = String(text || "").replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  // tira a página de log da ClickSign (CPF, IP, e-mails): só o contrato interessa
  const corte = t.search(/(Documento número #|Hash do documento original|Log\s*\n\s*\d{2} \w{3} \d{4})/);
  if (corte > 2000) t = t.slice(0, corte).trim();
  t = t.replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "•••.•••.•••-••").slice(0, 30000); // CPFs não vão para o modelo
  await sb.from("predio_contratos").update({ texto: t }).eq("id", c.id);
  return t;
}

export async function executarContrato(sb: SupabaseClient, c: any, nome: string): Promise<string> {
  const p = c.predioAtual || (c.predios?.length === 1 ? c.predios[0] : null);
  if (!p) return "Escolha o prédio primeiro (escolher_predio): o contrato é de cada prédio.";

  if (nome === "ver_contrato") {
    const { data: ct } = await sb.from("predio_contratos").select("id,titulo,arquivo_path,assinado_em,assinante_nome,texto,clicksign_envelope_id")
      .eq("building_id", p.id).eq("ativo", true).order("criado_em", { ascending: false }).limit(1).maybeSingle();
    if (!ct) {
      const { data: ped } = await sb.from("predio_contrato_pedidos").select("status,enviado_em,signatario_email,criado_em").eq("building_id", p.id).in("status", PEDIDOS_ABERTOS).maybeSingle();
      if (ped?.status === "enviado") return `O ${p.nome} ainda não tem contrato assinado no sistema, mas ele JÁ FOI ENVIADO pela ClickSign em ${fmt(ped.enviado_em)} para o e-mail de quem assina. Diga para procurar o e-mail da ClickSign (inclusive no spam) e assinar; depois de assinado ele aparece sozinho no Painel do Síndico, em Configurações › Contratos dos prédios.`;
      if (ped) return `O ${p.nome} ainda não tem contrato no sistema e o pedido JÁ ESTÁ com a equipe da EXA (feito em ${fmt(ped.criado_em)}). Diga que a equipe está preparando e que ele vai chegar por e-mail, pela ClickSign, para assinar. Não prometa prazo.`;
      return `O ${p.nome} ainda NÃO tem contrato no sistema. Explique em 1–2 frases e ofereça pedir agora (pedir_contrato). Não invente cláusulas.`;
    }
    let texto = "";
    try { texto = await textoDoContrato(sb, ct); } catch (e) { texto = ""; }
    const cab = `CONTRATO DO ${p.nome.toUpperCase()}: "${ct.titulo}"${ct.assinado_em ? `, assinado em ${fmt(ct.assinado_em)}` : ""}${ct.assinante_nome ? ` por ${ct.assinante_nome}` : ""}${ct.clicksign_envelope_id ? " (assinatura digital pela ClickSign)" : ""}.
Onde ver e baixar o PDF: Painel do Síndico (${SITE_URL}/paineldosindico) › Configurações › Contratos dos prédios.`;
    if (!texto) return `${cab}\nNão consegui ler o texto do PDF agora. Responda só com os dados acima e mande o caminho do painel para a pessoa ler; se ela tiver uma dúvida específica, registre com registrar_ocorrencia (tipo "duvida_contrato").`;
    return `${cab}

COMO RESPONDER:
- Explique com palavras simples e cite a cláusula ("pela cláusula 8.2…"). Use SÓ o que está no texto abaixo; se não estiver lá, diga que o contrato não fala disso e que vai perguntar à equipe (registrar_ocorrencia tipo "duvida_contrato").
- Você explica o contrato, não negocia: pedido de mudança, desconto, rescisão, retirada do painel ou reclamação sobre o contrato → registrar_ocorrencia (tipo "contrato") e diga que a equipe da EXA vai responder. Nunca diga que algo "está cancelado" ou "pode cancelar agora".
- Não dê parecer jurídico ("isso é legal/ilegal", "você ganha na justiça"); para isso, a pessoa deve falar com o advogado do condomínio.
- Não mostre CPF, e-mail ou telefone de ninguém; não cole o contrato inteiro no WhatsApp (resuma e mande o caminho do painel para o PDF).
- Mensagens curtas, uma ideia por mensagem.

TEXTO DO CONTRATO (assinado):
${texto}`;
  }

  if (nome === "pedir_contrato") {
    const { count } = await sb.from("predio_contratos").select("id", { count: "exact", head: true }).eq("building_id", p.id).eq("ativo", true);
    if (count) return `O ${p.nome} já tem contrato no sistema: use ver_contrato e mande o caminho do Painel do Síndico (Configurações › Contratos dos prédios).`;
    const { data: aberto } = await sb.from("predio_contrato_pedidos").select("status").eq("building_id", p.id).in("status", PEDIDOS_ABERTOS).maybeSingle();
    if (aberto) return aberto.status === "enviado" ? "Já foi enviado pela ClickSign: peça para procurar o e-mail (inclusive no spam) e assinar." : "O pedido já está com a equipe da EXA. Diga que está sendo preparado e chega por e-mail para assinar.";
    const tel = telefoneCanonico(c.tel);
    const { error } = await sb.from("predio_contrato_pedidos").insert({
      building_id: p.id, origem: "sindico", status: "aguardando_dados", pedido_por_tel: tel, pedido_por_nome: c.nomePessoa || null,
      signatario_telefone: tel, criado_por: "Nando (WhatsApp)",
    });
    if (error && !/duplicate|unique/i.test(error.message)) return "Não consegui registrar o pedido agora; use registrar_ocorrencia (tipo \"pedido_contrato\").";
    await avisarJeferson(sb, `📄 *Pedido de contrato pelo WhatsApp (Nando)*\n*Prédio:* ${p.nome}\n*Pediu:* ${c.nomePessoa || "síndico"} (+${tel})\n\nAbra o prédio no admin › Ver › *Contrato*, confirme os dados de quem assina e toque em "Pedir contrato pelo Nando".`);
    c.registros?.push?.(`pedido de contrato do ${p.nome}`);
    return `Pedido registrado e Jeferson avisado. Diga que a equipe da EXA vai preparar o contrato e que ele chega por e-mail, pela ClickSign, para assinar; depois de assinado aparece no Painel do Síndico. Não prometa prazo.`;
  }
  return "ferramenta de contrato desconhecida";
}
