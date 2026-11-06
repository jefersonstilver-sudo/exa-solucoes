// =====================================================================
// LÍVIA — cérebro (prompt + ferramentas). Regras do Jeferson de 06/11/2026.
// Cliente: só dinheiro. Programação/vídeo → Sofia. Síndico/condomínio → Nando.
// Nunca decide fora da regra e nunca diz "não consigo": pergunta ao Jeferson (livia_decisoes) e depois responde.
// =====================================================================
import {
  DB, CEO_NUMERO, LIVIA_VERSAO, agoraBR, hojeBR, dataBR, brl, difDias, amanha10h, telefoneCanonico, telefonesIguais,
  falar, avisarCeo, enviarDocumento, auditoria, gerarCobranca, funcao, asaas, clienteDoTelefone, contatosDoPedido,
  config, logEv, BUCKET, ehKammer, primeiroNome, type PedidoCliente,
} from "./livia-core.ts";

const MODELOS = [Deno.env.get("LIVIA_MODEL") || "claude-sonnet-5-5", "claude-sonnet-4-5"];
const FIM_PROMO_ATRASADAS = "2026-11-30"; // 35% para quem quitar tudo em novembro

export interface Contexto {
  sb: DB;
  tel: string;
  ceo: boolean;
  nome: string;
  empresa: string;
  pedidos: PedidoCliente[];
  midias: Record<string, { mime: string; caminho: string; url: string }>;
  registros: string[];
  tarefa?: string; // rotina/passagem: o que a Lívia precisa fazer agora (sem mensagem do cliente)
}

// ---------------------------------------------------------------- prompt
function dataExtenso() {
  const d = agoraBR();
  const dias = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  return `${dias[d.getUTCDay()]}, ${dataBR(hojeBR())}, ${String(d.getUTCHours()).padStart(2, "0")}h${String(d.getUTCMinutes()).padStart(2, "0")} (Brasília)`;
}

const BASE = `Você é a Lívia (Lívia Rodrigues), do financeiro da EXA Mídia — rede de telas de anúncio dentro dos elevadores de prédios residenciais em Foz do Iguaçu/PR (Indexa Mídia LTDA, CNPJ 38.142.638/0001-30). WhatsApp do financeiro: (45) 99942-9820.

COMO VOCÊ ESCREVE
- Como uma pessoa do financeiro escreve no WhatsApp: natural, educada, profissional, direta.
- Mensagens curtas e picotadas. Separe cada mensagem com UMA LINHA EM BRANCO (cada bloco vira uma mensagem). No máximo 3 blocos.
- Nada de textão, listas longas, títulos, emojis em excesso (no máximo 1, e só quando cabe). Negrito do WhatsApp (*assim*) só para valor e data.
- Nunca diga que é robô, IA ou assistente virtual por conta própria. Se a pessoa perguntar DIRETAMENTE se fala com uma pessoa ou com uma IA, não minta: diga que é a assistente do financeiro da EXA e que, se preferir, o Jeferson fala com ela.
- Nunca mencione sistema, ferramenta, erro técnico, banco de dados, Asaas, "auditoria", código de decisão (L12) ou qualquer detalhe interno para o cliente.

A EQUIPE (vocês conversam por dentro do sistema, nunca por WhatsApp entre si)
- Sofia: clientes, vendas, vídeos e programação nas telas. O 1º pagamento da venda é com ela.
- Nando: tudo de condomínio e síndico (avisos, telas do prédio, contratos com condomínios). Os contratos com os condomínios não têm troca de dinheiro: a EXA não paga nada aos condomínios.
- Você: dinheiro. Mensalidades a partir da 2ª, boleto, Pix, comprovante, vencimento, atraso, ajuste financeiro.
- Jeferson: o CEO, seu chefe. Para ele você é a diretora financeira.

O QUE VOCÊ RESOLVE SOZINHA (regras do Jeferson)
- Mandar o Pix ou o boleto da mensalidade, a 2ª via, a linha digitável, o valor e a data que estão no contrato do cliente.
- Trocar de Pix para boleto quando o cliente pede (gere o boleto da parcela).
- Se o cliente diz que vai pagar HOJE uma parcela vencida: tire multa e juros — gere um Pix ou boleto novo só com o valor da mensalidade.
- Até ${dataBR(FIM_PROMO_ATRASADAS)}: quem quitar TODAS as atrasadas de uma vez no Pix ganha 35% de desconto (o Pix único das atrasadas já sai com o desconto). Comunique isso com naturalidade quando houver mais de uma parcela atrasada. Depois dessa data, essa condição só com o Jeferson.
- Atualizar o contato financeiro (nome, e-mail, WhatsApp) quando o cliente pedir.
- Cliente manda comprovante: registre e diga que vai conferir. A baixa só acontece quando o pagamento aparece na conta da EXA; se não aparecer, o Jeferson confere.
- "Já paguei" sem comprovante: peça o comprovante com gentileza, registre e diga que retorna.
- Pagamento em dinheiro não existe; quem lança pagamento por fora é só o Jeferson.

O QUE SEMPRE PASSA PELO JEFERSON (ferramenta perguntar_ao_jeferson)
- Qualquer coisa que não esteja no contrato do cliente ou que você não saiba com certeza. NUNCA invente valor, data, desconto ou prazo.
- Prazo extra, desconto (fora a regra acima), parcelamento, perdão de mensalidade, mudança de valor, cancelamento, reclamação, contestação de valor, cliente bravo, pedido de reembolso, nota fiscal (ainda não está no sistema).
- Quando perguntar ao Jeferson, diga ao cliente algo como "vou confirmar aqui e te retorno amanhã até as 10h, pode ser?" — nunca "não consigo", nunca "não tenho acesso".
- Kammer / 3K / SoHo: o Jeferson trata direto. Diga apenas que vão entrar em contato com ele, e avise o Jeferson.

O QUE NÃO É SEU
- Vídeo, programação, troca de anúncio, prédios do pedido, criação de conta → passar_para_sofia (a Sofia chama o cliente). Diga ao cliente que a Sofia vai chamar ele.
- Assunto de síndico ou condomínio → diga com gentileza que quem cuida disso é o Nando, no (45) 99113-2351.
- Venda nova / quer anunciar → passar_para_sofia.

COBRANÇA (como funciona — use para explicar, não recite)
- Vencimento: o dia em que o cliente comprou o plano. Pode mudar a data: a parcela é ajustada proporcionalmente (mensalidade ÷ 30 × dias) — isso você pergunta ao Jeferson antes.
- Lembretes: 10 dias antes (WhatsApp e e-mail com o Pix ou boleto), 3 dias antes (WhatsApp), 1 dia antes (e-mail). Pagou, para tudo.
- Atraso: no 10º dia depois do vencimento o pedido é suspenso (a marca sai das telas). Pagou, você reativa na hora.
- Multa e juros: nunca puxe o assunto. Se o cliente vai pagar, você tira.
- Mensagens só de segunda a sábado, das 9h às 19h.

VERDADE
- Você só afirma valor, data, parcela e situação que vieram de uma ferramenta nesta conversa. O resto, pergunte ao Jeferson.
- Se a mensagem for só "ok", "obrigado", 👍 depois de tudo resolvido, responda apenas [silêncio].`;

const CEO = `
VOCÊ ESTÁ FALANDO COM O JEFERSON (CEO), SEU CHEFE. Aqui você é a diretora financeira.
- Responda tudo o que ele perguntar sobre dinheiro da EXA usando as ferramentas. Pode usar listas curtas e números.
- Quando ele responder uma pergunta sua (ex.: "L12 pode dar o prazo até sexta"), use responder_decisao e em seguida mensagem_para_cliente, escrevendo para o cliente no seu tom — sem citar o Jeferson como chefe nem o código.
- Se a resposta dele for curta e não citar o código, use decisoes_abertas e ligue pela conversa (a última pergunta que você fez).
- Para mudar regra sua (ligar a régua, modo teste, liberar cobrança de um pedido), use as ferramentas dele. Confirme o que fez em uma linha.
- Seja objetiva. Ele é ocupado. Nada de "Em que posso ajudar?".`;

const CLIENTE = (c: Contexto) => {
  if (!c.pedidos.length) return `
VOCÊ ESTÁ FALANDO COM UM NÚMERO QUE NÃO ESTÁ LIGADO A NENHUM PEDIDO.
- Pergunte com gentileza o nome e a empresa. Não passe nenhum valor nem dado de cliente para este número.
- Se disser a empresa, use perguntar_ao_jeferson para confirmar se esse número pode falar pelo financeiro dela.
- Se for alguém querendo anunciar, passar_para_sofia.`;
  return `
CLIENTE: ${c.nome || "(nome não cadastrado)"}${c.empresa ? " — " + c.empresa : ""}
Pedidos deste número: ${c.pedidos.map((p) => `${p.nome} [pedido_id ${p.id}, ${p.status}, este número é o ${p.papel}${p.livia_cobranca ? "" : ", cobrança ainda não liberada para você"}]`).join("; ")}
- Sempre olhe situacao_cliente antes de falar de valor.
- Pedido com a cobrança ainda não liberada: você pode mandar o que já aparece no contrato dele; qualquer dúvida de valor, pergunte ao Jeferson.`;
};

async function prompt(c: Contexto) {
  const cfg = await config(c.sb);
  return `${BASE}

AGORA: ${dataExtenso()}. Sua versão: ${LIVIA_VERSAO}. Régua automática: ${cfg.regua === "1" ? "ligada" : "desligada"}.
${c.ceo ? CEO : CLIENTE(c)}${c.tarefa ? `

TAREFA DESTA RODADA (não veio do cliente; é a sua rotina ou uma passagem da equipe):
${c.tarefa}` : ""}`;
}

// ---------------------------------------------------------------- ferramentas
type T = { name: string; description: string; input_schema: any };
const obj = (props: Record<string, any>, req: string[] = []) => ({ type: "object", properties: props, required: req });
const S = { type: "string" }, N = { type: "number" }, B = { type: "boolean" };

const F_CLIENTE: T[] = [
  { name: "situacao_cliente", description: "Contrato do cliente: mensalidades (paga, atrasada, a vencer, cortesia), valores, vencimentos e cobranças em aberto (Pix/boleto já gerados). Use antes de falar de qualquer valor.", input_schema: obj({ pedido_id: S }) },
  { name: "gerar_pagamento", description: "Gera o Pix ou o boleto de uma mensalidade (valor cheio, sem multa nem juros), ou o Pix único de TODAS as atrasadas (35% de desconto até 30/11/2026). Devolve o Pix copia e cola, o link do boleto e a linha digitável.", input_schema: obj({ pedido_id: S, forma: { type: "string", enum: ["pix", "boleto"] }, parcela: { ...N, description: "número da mensalidade" }, todas_atrasadas: B }, ["pedido_id", "forma"]) },
  { name: "enviar_boleto_pdf", description: "Manda o PDF do boleto como arquivo no WhatsApp do cliente.", input_schema: obj({ url: S, nome_arquivo: S }, ["url"]) },
  { name: "perguntar_ao_jeferson", description: "Leva uma dúvida ou pedido do cliente ao Jeferson e registra. Use para tudo que não está na regra ou que você não sabe com certeza. Depois diga ao cliente que retorna amanhã até as 10h.", input_schema: obj({ pergunta: { ...S, description: "a pergunta, objetiva, com o que o cliente quer" }, contexto: { ...S, description: "o que você já sabe: valores, datas, o que o cliente disse" }, pedido_id: S }, ["pergunta"]) },
  { name: "registrar_comprovante", description: "Registra um comprovante ou um 'já paguei' do cliente e manda para o Jeferson conferir. Antes, confere se o pagamento já entrou.", input_schema: obj({ pedido_id: S, midia_id: S, valor: N, data_pagamento: S, pagador: S, observacao: S }) },
  { name: "atualizar_financeiro", description: "Grava o contato financeiro do cliente (quem recebe as cobranças).", input_schema: obj({ pedido_id: S, nome: S, email: S, whatsapp: S }, ["pedido_id"]) },
  { name: "passar_para_sofia", description: "Passa à Sofia um assunto de vídeo, programação, prédios ou venda nova. A Sofia chama o cliente.", input_schema: obj({ contexto: { ...S, description: "o que o cliente quer, com detalhes" }, pedido_id: S }, ["contexto"]) },
];
const F_CEO: T[] = [
  { name: "panorama_financeiro", description: "Saldo do Asaas, entradas e saídas recentes, quem está atrasado, o que vence nos próximos 7 dias e cobranças em aberto.", input_schema: obj({ dias_extrato: N }) },
  { name: "cliente_detalhe", description: "Contrato auditado completo de um cliente (inclusive parcelas não liberadas ao cliente). Busca por nome do pedido/empresa.", input_schema: obj({ busca: S }, ["busca"]) },
  { name: "decisoes_abertas", description: "Perguntas suas ao Jeferson que ainda esperam resposta.", input_schema: obj({}) },
  { name: "responder_decisao", description: "Registra a resposta do Jeferson a uma pergunta (código L…). Depois use mensagem_para_cliente.", input_schema: obj({ codigo: S, resposta: S }, ["codigo", "resposta"]) },
  { name: "mensagem_para_cliente", description: "Escreve para um cliente pelo WhatsApp do financeiro (use depois da decisão do Jeferson, ou quando ele mandar). Texto no seu tom, picotado.", input_schema: obj({ telefone: S, codigo_decisao: S, texto: S }, ["texto"]) },
  { name: "conversa_cliente", description: "Últimas mensagens entre você e um cliente.", input_schema: obj({ busca: S }, ["busca"]) },
  { name: "liberar_cobranca", description: "Liga ou desliga a sua cobrança num pedido (você só cobra pedido liberado).", input_schema: obj({ busca: S, ligar: B }, ["busca", "ligar"]) },
  { name: "ajustar_livia", description: "Muda uma regra sua: regua ('1' liga a régua automática), modo_teste ('1' só responde o Jeferson e testadores), testadores (telefones separados por vírgula), ligada.", input_schema: obj({ chave: { type: "string", enum: ["regua", "modo_teste", "testadores", "ligada"] }, valor: S }, ["chave", "valor"]) },
];

// ---------------------------------------------------------------- execução
const pedidoValido = (c: Contexto, id?: string) => {
  if (c.ceo) return id || c.pedidos[0]?.id || "";
  const p = c.pedidos.find((x) => x.id === id) || (c.pedidos.length === 1 ? c.pedidos[0] : null);
  return p?.id || "";
};
const resumoParcelas = (r: any) => {
  if (!r?.ok) return "não consegui ler o contrato agora (" + String(r?.erro || r?.http || "") + ")";
  if (!r.parcelas?.length) return "o contrato deste pedido ainda não foi liberado (não há mensalidades visíveis). Pergunte ao Jeferson antes de falar de valor.";
  const linhas = r.parcelas.map((p: any) => `#${p.numero} ${p.competencia || ""} vence ${dataBR(p.data_vencimento)} ${brl(p.valor)} → ${p.situacao}${p.dias_atraso ? ` (${p.dias_atraso} dias de atraso)` : ""}${p.pago_em ? ` pago em ${dataBR(String(p.pago_em).slice(0, 10))}` : ""}${p.em_cobranca ? " [cobrança já gerada]" : ""}${p.observacao ? ` — ${p.observacao}` : ""}`);
  const ab = (r.cobrancas_abertas || []).map((l: any) => `${l.forma} ${brl(l.valor)} vence ${dataBR(l.vencimento)} parcelas ${l.parcelas?.join(",")}${l.desconto_pct ? ` (${l.desconto_pct}% desc.)` : ""}${l.pix_copia_cola ? " PIX: " + l.pix_copia_cola : ""}${l.boleto_url ? " BOLETO: " + l.boleto_url : ""}${l.linha_digitavel ? " LINHA: " + l.linha_digitavel : ""}`);
  const rs = r.resumo || {};
  return `mensalidade ${brl(rs.valor_mensal)} · plano ${dataBR(r.plano?.inicio)} a ${dataBR(r.plano?.fim)} · pago ${brl(rs.pago)} (${rs.qtd_pagas}) · atrasado ${brl(rs.atrasado)} (${rs.qtd_atrasadas}${rs.atrasado_desde ? ", desde " + dataBR(rs.atrasado_desde) : ""}) · próximo vencimento ${dataBR(rs.proximo_vencimento) || "—"}\n${linhas.join("\n")}${ab.length ? "\nCOBRANÇAS EM ABERTO:\n" + ab.join("\n") : ""}`;
};

async function acharPedido(c: Contexto, busca: string) {
  const q = String(busca || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const { data } = await c.sb.from("pedidos").select("id,nome_pedido,client_name,status,livia_cobranca").not("status", "in", "(cancelado,cancelado_automaticamente)").limit(1000);
  const norm = (s: unknown) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/^[0-9a-f-]{6,}$/.test(q)) { const x = (data || []).filter((p: any) => p.id.startsWith(q)); if (x.length) return x.slice(0, 5); }
  return (data || []).filter((p: any) => norm(p.nome_pedido).includes(q) || norm(p.client_name).includes(q)).slice(0, 5);
}

async function executar(c: Contexto, nome: string, e: any): Promise<string> {
  const sb = c.sb;
  if (F_CEO.some((f) => f.name === nome) && !c.ceo) return "ferramenta só do Jeferson";

  switch (nome) {
    case "situacao_cliente": {
      const ids = c.ceo ? [e.pedido_id].filter(Boolean) : (e.pedido_id ? [pedidoValido(c, e.pedido_id)] : c.pedidos.map((p) => p.id)).filter(Boolean);
      if (!ids.length) return "nenhum pedido ligado a este número";
      const out: string[] = [];
      for (const id of ids) { const r = await auditoria(sb, id, "cliente"); const p = c.pedidos.find((x) => x.id === id); out.push(`PEDIDO ${p?.nome || id} (pedido_id ${id}):\n${resumoParcelas(r)}`); }
      return out.join("\n\n");
    }
    case "gerar_pagamento": {
      const id = pedidoValido(c, e.pedido_id); if (!id) return "pedido não é deste cliente";
      if (e.todas_atrasadas && hojeBR() > FIM_PROMO_ATRASADAS && !c.ceo) return "a condição de 35% nas atrasadas terminou em 30/11. Gere parcela por parcela ou pergunte ao Jeferson.";
      if (!e.todas_atrasadas && !e.parcela) return "diga qual mensalidade (número) ou todas_atrasadas";
      const r = await gerarCobranca(sb, id, { forma: e.forma === "boleto" ? "boleto" : "pix", numero: e.parcela ? Number(e.parcela) : undefined, atrasadas: !!e.todas_atrasadas });
      if (r?.ja_pago) return "esse pagamento já consta como pago. Agradeça ao cliente.";
      if (!r?.ok || !r?.cobranca) { await avisarCeo(sb, `⚠️ Lívia: não consegui gerar ${e.forma} para ${c.empresa || c.nome || c.tel} (pedido ${String(id).slice(0, 8)}): ${String(r?.erro || r?.http)}`); return "FALHOU (o Jeferson já foi avisado). Diga ao cliente que vai mandar em instantes, sem falar de erro."; }
      const k = r.cobranca;
      return `gerado: ${k.forma} ${brl(k.valor)} vence ${dataBR(k.vencimento)}${k.desconto_pct ? ` (${k.desconto_pct}% de desconto)` : ""}\nPIX COPIA E COLA (mande sozinho numa mensagem, exatamente assim): ${k.pix_copia_cola || "—"}\nBOLETO PDF: ${k.boleto_url || "—"}\nLINHA DIGITÁVEL: ${k.linha_digitavel || "—"}\nFATURA: ${k.invoice_url || "—"}`;
    }
    case "enviar_boleto_pdf": {
      if (!/^https:\/\//.test(String(e.url || ""))) return "url inválida";
      try { await enviarDocumento(sb, c.tel, e.url, e.nome_arquivo || "boleto-exa.pdf", ""); return "PDF enviado"; } catch (err) { return "falhou: " + (err as Error).message; }
    }
    case "perguntar_ao_jeferson": {
      const pid = e.pedido_id ? pedidoValido(c, e.pedido_id) || null : c.pedidos[0]?.id || null;
      const { data: d } = await sb.from("livia_decisoes").insert({ telefone_cliente: c.tel, nome_cliente: [c.nome, c.empresa].filter(Boolean).join(" — ") || null, pedido_id: pid, pergunta: String(e.pergunta).slice(0, 1500), contexto: String(e.contexto || "").slice(0, 3000), prometido_ate: amanha10h() }).select("id,codigo").single();
      if (!d) return "não consegui registrar; diga ao cliente que vai confirmar e retorna";
      await avisarCeo(sb, `💼 *${d.codigo}* · ${[c.nome, c.empresa].filter(Boolean).join(" — ") || "+" + c.tel}\n\n${e.pergunta}${e.contexto ? `\n\n_${String(e.contexto).slice(0, 700)}_` : ""}\n\nMe responde aqui começando com *${d.codigo}*. Prometi retorno ao cliente amanhã até as 10h.`);
      return `registrado como ${d.codigo} e o Jeferson foi avisado. Diga ao cliente que vai confirmar e retorna amanhã até as 10h (sem citar o Jeferson como chefe e sem o código).`;
    }
    case "registrar_comprovante": {
      const pid = pedidoValido(c, e.pedido_id) || null;
      if (pid) await funcao(sb, "exa2-auditoria-cobranca", { action: "conciliar" });
      const sit = pid ? resumoParcelas(await auditoria(sb, pid, "cliente")) : "";
      let link = "";
      const m = e.midia_id ? c.midias[e.midia_id] : Object.values(c.midias)[0];
      if (m) { const { data } = await sb.storage.from(BUCKET).createSignedUrl(m.caminho, 7 * 86400); link = data?.signedUrl || ""; }
      const { data: d } = await sb.from("livia_decisoes").insert({ telefone_cliente: c.tel, nome_cliente: [c.nome, c.empresa].filter(Boolean).join(" — ") || null, pedido_id: pid, pergunta: `Comprovante / "já paguei" para conferir: ${e.valor ? brl(e.valor) : "valor não informado"}${e.data_pagamento ? " em " + e.data_pagamento : ""}${e.pagador ? " por " + e.pagador : ""}`, contexto: `${e.observacao || ""}\n${link ? "Comprovante: " + link : "Sem arquivo."}\nSituação no sistema: ${sit.slice(0, 1500)}`, prometido_ate: amanha10h() }).select("codigo").single();
      await avisarCeo(sb, `🧾 *${d?.codigo || "comprovante"}* · ${[c.nome, c.empresa].filter(Boolean).join(" — ") || "+" + c.tel}\n${e.valor ? brl(e.valor) : ""}${e.data_pagamento ? " · " + e.data_pagamento : ""}${e.pagador ? " · " + e.pagador : ""}\n${link || "(sem arquivo)"}\n\nNão achei a baixa automática. Confere no Asaas e me diz *${d?.codigo}* ok (dou baixa e aviso o cliente) ou o que houve.`);
      return `registrado (${d?.codigo}). Situação atual: ${sit.slice(0, 600)}\nDiga ao cliente que recebeu, vai conferir e confirma até amanhã às 10h. Se já aparece pago acima, agradeça e diga que está tudo certo.`;
    }
    case "atualizar_financeiro": {
      const id = pedidoValido(c, e.pedido_id); if (!id) return "pedido não é deste cliente";
      const r = await funcao(sb, "exa2-cobranca", { action: "financeiro", pedido_id: id, nome: e.nome, email: e.email, whatsapp: e.whatsapp });
      return r?.ok ? "contato financeiro atualizado" : "não gravou: " + (r?.erro || r?.http);
    }
    case "passar_para_sofia": {
      const pid = e.pedido_id ? pedidoValido(c, e.pedido_id) || null : c.pedidos[0]?.id || null;
      const { data: cts } = await sb.from("sofia_contacts").select("id,phone").not("phone", "is", null).neq("role", "ceo").limit(5000);
      const ct = (cts || []).find((x: any) => telefonesIguais(x.phone, c.tel));
      const { data: pas } = await sb.from("livia_passagens").insert({ de: "livia", para: "sofia", telefone: c.tel, pedido_id: pid, contexto: String(e.contexto).slice(0, 2000) }).select("id").single();
      if (!ct) { await avisarCeo(sb, `↪️ Lívia → Sofia: ${[c.nome, c.empresa].filter(Boolean).join(" — ") || "+" + c.tel} quer: ${e.contexto}\n(esse número ainda não é contato da Sofia; ela não consegue chamar sozinha)`); return "a Sofia ainda não tem esse contato; o Jeferson foi avisado. Diga que a Sofia (ou alguém da equipe) vai chamar."; }
      const { error } = await sb.from("sofia_acoes").insert({ contact_id: ct.id, instrucao: `[Passagem da Lívia, do financeiro] O cliente falou com a Lívia sobre um assunto que é seu: ${e.contexto}. Chame o cliente agora sobre isso, de forma natural, dizendo que a Lívia comentou com você.`, origem: "equipe", silencioso: false });
      await sb.from("livia_passagens").update(error ? { status: "falhou", resultado: error.message } : { status: "feita", feita_em: new Date().toISOString() }).eq("id", pas?.id);
      if (error) { await avisarCeo(sb, `↪️ Lívia → Sofia FALHOU (${error.message}): ${c.nome || c.tel} quer: ${e.contexto}`); return "não consegui passar; o Jeferson foi avisado. Diga que a equipe vai chamar."; }
      return "passado à Sofia; ela vai chamar o cliente. Diga isso ao cliente.";
    }

    // ---------------- CEO ----------------
    case "panorama_financeiro": {
      const dias = Math.min(30, Math.max(1, Number(e.dias_extrato || 7)));
      const saldo = await asaas("GET", "/finance/balance");
      const ext = await asaas("GET", `/financialTransactions?startDate=${addDiasS(-dias)}&finishDate=${hojeBR()}&limit=100`);
      let ent = 0, sai = 0; const grandes: string[] = [];
      for (const t of ext.j?.data || []) { const v = Number(t.value || 0); if (v >= 0) ent += v; else sai += v; if (Math.abs(v) >= 300) grandes.push(`${dataBR(t.date)} ${brl(v)} ${String(t.description || t.type || "").slice(0, 60)}`); }
      const { data: peds } = await sb.from("pedidos").select("id,nome_pedido,client_name,status,livia_cobranca").not("status", "in", "(cancelado,cancelado_automaticamente,finalizado)");
      const { data: aud } = await sb.from("cobranca_auditoria").select("pedido_id,numero,data_vencimento,valor,status").in("status", ["aberto"]);
      const hoje = hojeBR(); const em7 = addDiasS(7);
      const porPed = new Map<string, { atr: number; qa: number; desde: string; venc7: number }>();
      for (const a of aud || []) {
        const x = porPed.get(a.pedido_id) || { atr: 0, qa: 0, desde: "", venc7: 0 };
        const v = String(a.data_vencimento).slice(0, 10);
        if (v < hoje) { x.atr += Number(a.valor); x.qa++; if (!x.desde || v < x.desde) x.desde = v; } else if (v <= em7) x.venc7 += Number(a.valor);
        porPed.set(a.pedido_id, x);
      }
      const nomeP = (id: string) => { const p: any = (peds || []).find((q: any) => q.id === id); return p ? String(p.nome_pedido || p.client_name) : id.slice(0, 8); };
      const atrasados = [...porPed.entries()].filter(([, x]) => x.qa).sort((a, b) => b[1].atr - a[1].atr).map(([id, x]) => `${nomeP(id)}: ${brl(x.atr)} (${x.qa} parc., desde ${dataBR(x.desde)}, ${difDias(x.desde, hoje)} dias)`);
      const vence = [...porPed.entries()].filter(([, x]) => x.venc7).map(([id, x]) => `${nomeP(id)}: ${brl(x.venc7)}`);
      const { data: lotes } = await sb.from("cobranca_auditoria_pix").select("pedido_id,valor,forma,vencimento").eq("status", "aberto");
      return `SALDO ASAAS: ${saldo.ok ? brl(saldo.j?.balance) : "não li (" + saldo.status + ")"}
EXTRATO ${dias} dias: entradas ${brl(ent)} · saídas ${brl(sai)}${grandes.length ? "\n" + grandes.slice(0, 15).join("\n") : ""}
ATRASADOS (contratos auditados): ${atrasados.length ? "\n" + atrasados.join("\n") : "nenhum"}
VENCE EM 7 DIAS: ${vence.length ? vence.join("; ") : "nada"}
COBRANÇAS GERADAS EM ABERTO: ${(lotes || []).map((l: any) => `${nomeP(l.pedido_id)} ${l.forma} ${brl(l.valor)} vence ${dataBR(l.vencimento)}`).join("; ") || "nenhuma"}
PEDIDOS COM A SUA COBRANÇA LIGADA: ${(peds || []).filter((p: any) => p.livia_cobranca).map((p: any) => p.nome_pedido || p.client_name).join(", ") || "nenhum"}
(Contas a pagar, internet dos prédios e dívidas ainda não estão no sistema.)`;
    }
    case "cliente_detalhe": {
      const ps = await acharPedido(c, e.busca); if (!ps.length) return "não achei pedido com esse nome";
      const out: string[] = [];
      for (const p of ps.slice(0, 3)) {
        const r = await auditoria(sb, p.id, "equipe");
        const ct = await contatosDoPedido(sb, p.id);
        const linhas = (r?.parcelas || []).map((x: any) => `#${x.numero} ${dataBR(x.data_vencimento)} ${brl(x.valor)} ${x.situacao}${x.visivel_cliente ? "" : " (oculta do cliente)"}`).join("\n");
        out.push(`${p.nome_pedido || p.client_name} [${p.id}] status ${p.status} · sua cobrança ${p.livia_cobranca ? "LIGADA" : "desligada"}\ncobrar: ${ct.cobrar.nome} ${ct.cobrar.fone ? "+" + ct.cobrar.fone : ""} ${ct.cobrar.email}${ct.financeiro ? ` (financeiro; dono ${ct.dono.nome} +${ct.dono.fone})` : " (dono; sem financeiro cadastrado)"}\n${r?.ok ? `pago ${brl(r.resumo?.pago)} · atrasado ${brl(r.resumo?.atrasado)} · a vencer ${brl(r.resumo?.a_vencer)}\n${linhas || "sem auditoria lançada"}` : "auditoria: " + (r?.erro || r?.http)}`);
      }
      return out.join("\n\n");
    }
    case "decisoes_abertas": {
      const { data } = await sb.from("livia_decisoes").select("codigo,nome_cliente,pergunta,created_at,prometido_ate").eq("status", "aberta").order("id");
      return (data || []).map((d: any) => `${d.codigo} · ${d.nome_cliente || ""} · ${d.pergunta} (prometido ${new Date(d.prometido_ate).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })})`).join("\n") || "nenhuma pergunta aberta";
    }
    case "responder_decisao": {
      const cod = String(e.codigo || "").toUpperCase().replace(/\s/g, "");
      const { data: d } = await sb.from("livia_decisoes").update({ status: "respondida", resposta: String(e.resposta).slice(0, 2000), respondida_em: new Date().toISOString() }).eq("codigo", cod).select("*").maybeSingle();
      if (!d) return "não achei " + cod;
      let sit = ""; if (d.pedido_id) sit = resumoParcelas(await auditoria(sb, d.pedido_id, "cliente")).slice(0, 1200);
      const { data: hist } = await sb.from("livia_mensagens").select("papel,conteudo").eq("telefone", d.telefone_cliente).order("id", { ascending: false }).limit(8);
      return `registrado. Cliente: ${d.nome_cliente} (telefone ${d.telefone_cliente}). Pergunta: ${d.pergunta}. Decisão: ${e.resposta}.\nSituação: ${sit}\nÚltimas mensagens: ${(hist || []).reverse().map((h: any) => h.papel + ": " + String(h.conteudo?.texto || "").slice(0, 200)).join(" | ")}\nAgora escreva ao cliente com mensagem_para_cliente (telefone ${d.telefone_cliente}, codigo_decisao ${cod}). Se a decisão exigir gerar Pix/boleto, faça antes com gerar_pagamento (pedido_id ${d.pedido_id}).`;
    }
    case "mensagem_para_cliente": {
      let tel = telefoneCanonico(e.telefone || "");
      if (!tel && e.codigo_decisao) { const { data: d } = await sb.from("livia_decisoes").select("telefone_cliente").eq("codigo", String(e.codigo_decisao).toUpperCase()).maybeSingle(); tel = telefoneCanonico(d?.telefone_cliente || ""); }
      if (!tel || telefonesIguais(tel, CEO_NUMERO)) return "telefone do cliente não encontrado";
      try { await falar(sb, tel, String(e.texto), { por: "ceo_decisao", decisao: e.codigo_decisao || null }); }
      catch (err) { return "falhou o envio: " + (err as Error).message; }
      if (e.codigo_decisao) await sb.from("livia_decisoes").update({ cliente_avisado_em: new Date().toISOString() }).eq("codigo", String(e.codigo_decisao).toUpperCase());
      return "enviado ao cliente";
    }
    case "conversa_cliente": {
      const ps = await acharPedido(c, e.busca);
      const fones: string[] = [];
      for (const p of ps.slice(0, 2)) { const ct = await contatosDoPedido(sb, p.id); for (const f of [ct.financeiro?.fone, ct.dono.fone]) if (f) fones.push(f); }
      if (/^\d{10,}$/.test(String(e.busca).replace(/\D/g, ""))) fones.push(telefoneCanonico(e.busca));
      if (!fones.length) return "não achei o cliente";
      const { data } = await sb.from("livia_mensagens").select("telefone,papel,conteudo,created_at").in("telefone", [...new Set(fones)]).order("id", { ascending: false }).limit(20);
      return (data || []).reverse().map((m: any) => `${new Date(m.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} ${m.papel}: ${String(m.conteudo?.texto || "").slice(0, 300)}`).join("\n") || "nenhuma conversa ainda";
    }
    case "liberar_cobranca": {
      const ps = await acharPedido(c, e.busca); if (ps.length !== 1) return ps.length ? "achei mais de um: " + ps.map((p: any) => `${p.nome_pedido || p.client_name} [${p.id}]`).join("; ") + " — repita com o id" : "não achei";
      await sb.from("pedidos").update({ livia_cobranca: !!e.ligar }).eq("id", ps[0].id);
      await logEv(sb, "LIVIA_COBRANCA_" + (e.ligar ? "LIGADA" : "DESLIGADA"), { pedido: ps[0].id });
      return `${ps[0].nome_pedido || ps[0].client_name}: cobrança da Lívia ${e.ligar ? "LIGADA" : "desligada"}`;
    }
    case "ajustar_livia": {
      await sb.from("livia_config").upsert({ chave: e.chave, valor: String(e.valor), updated_at: new Date().toISOString() });
      await config(sb, true);
      await logEv(sb, "LIVIA_CONFIG", { chave: e.chave, valor: e.valor });
      return `${e.chave} = ${e.valor}`;
    }
  }
  return "ferramenta desconhecida";
}
const addDiasS = (n: number) => { const d = new Date(hojeBR() + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// ---------------------------------------------------------------- laço
export async function rodarAgente(c: Contexto, mensagens: any[]): Promise<string> {
  const key = Deno.env.get("LIVIA_ANTHROPIC_API_KEY") || Deno.env.get("NANDO_ANTHROPIC_API_KEY");
  if (!key) throw new Error("LIVIA_ANTHROPIC_API_KEY ausente");
  // Kammer: o Jeferson trata direto
  if (!c.ceo && (ehKammer(c.empresa) || c.pedidos.some((p) => ehKammer(p.nome)))) c.tarefa = (c.tarefa ? c.tarefa + "\n" : "") + "Este cliente é da Kammer: diga só que vão entrar em contato com ele em breve e use perguntar_ao_jeferson para avisar o Jeferson do que ele quer. Não fale de valores.";
  const system = await prompt(c);
  const tools = c.ceo ? [...F_CLIENTE, ...F_CEO] : F_CLIENTE;
  const msgs = [...mensagens];
  let mi = 0;
  for (let rodada = 0; rodada < 10; rodada++) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: AbortSignal.timeout(90000),
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODELOS[mi], max_tokens: 2500, system, tools, messages: msgs }),
    });
    if (!r.ok) {
      const t = await r.text();
      if ((r.status === 404 || /model/i.test(t)) && mi < MODELOS.length - 1) { mi++; rodada--; continue; }
      throw new Error(`Claude ${r.status}: ${t.slice(0, 300)}`);
    }
    const j = await r.json();
    msgs.push({ role: "assistant", content: j.content });
    const usos = (j.content || []).filter((b: any) => b.type === "tool_use");
    if (!usos.length || j.stop_reason !== "tool_use") return (j.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
    const res = [];
    for (const u of usos) {
      let saida: string;
      try { saida = await executar(c, u.name, u.input || {}); } catch (err) { saida = "ERRO: " + (err as Error).message; console.error("[LIVIA] ferramenta", u.name, err); }
      res.push({ type: "tool_result", tool_use_id: u.id, content: saida });
      c.registros.push(`${u.name}(${JSON.stringify(u.input || {}).slice(0, 300)}) → ${saida.slice(0, 900)}`);
    }
    msgs.push({ role: "user", content: res });
  }
  throw new Error("muitas voltas sem resposta");
}

/** Primeiro nome para cumprimentar (exportado para a rotina). */
export const nomeCurto = (n: unknown) => primeiroNome(n);
