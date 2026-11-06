// =====================================================================
// LÍVIA — rotina (cron a cada 10 min, header x-exa2-cron).
//  1. Retornos: pergunta ao Jeferson sem resposta → a Lívia cumpre o "te retorno até as 10h" e lembra o Jeferson.
//  2. Régua (só com livia_config.regua = '1' e só nos pedidos com livia_cobranca = true), sobre o contrato auditado:
//     D-10 WhatsApp + e-mail com o Pix/boleto · D-3 WhatsApp · D-1 e-mail (e o dono, se o financeiro não pagou)
//     · D+9 "amanhã é o último prazo" · D+10 suspende · pagou → reativa · D+30 pergunta ao Jeferson sobre cancelar.
//     Pagou → nada mais sai (a régua lê a situação a cada volta).
//  3. Resumo financeiro do dia para o Jeferson às 19h.
// Regra: WhatsApp de cliente só seg–sáb 9h–19h; erro nunca vai ao cliente.
// =====================================================================
import {
  db, DB, hojeBR, horaBR, difDias, dataBR, brl, horaWhats, horaEmail, addDias, config, avisarCeo, auditoria, gerarCobranca,
  contatosDoPedido, pedidoAdmin, email, casca, pE, botaoE, codigoE, escH, PAINEL, CEO_NUMERO, logEv, telefonesIguais,
} from "../_shared/livia-core.ts";
import { rodarTarefa } from "../_shared/livia-conversa.ts";
import { exigirSistema } from "../_shared/guarda.ts";

const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (!(await exigirSistema(req))) return json(401, { erro: "não autorizado" });
  const b = await req.json().catch(() => ({}));
  const sb = db();
  const out: Record<string, unknown> = {};
  const passo = async (nome: string, fn: () => Promise<unknown>) => {
    try { out[nome] = await fn(); } catch (e) { out[nome] = "ERRO " + (e as Error).message; console.error("[LIVIA-CRON]", nome, e); await logEv(sb, "LIVIA_CRON_ERRO", { passo: nome, erro: String(e).slice(0, 500) }); }
  };
  const cfg = await config(sb, true);
  if (cfg.ligada !== "1" && b.forcar !== true) return json(200, { ok: true, pausada: true });
  await passo("retornos", () => retornos(sb));
  if (cfg.regua === "1" || b.regua === true) await passo("regua", () => regua(sb, !!b.simular));
  await passo("resumo", () => resumo(sb, Number(cfg.resumo_hora || 19), !!b.resumo_agora));
  return json(200, { ok: true, ...out });
});

// ---------------- 1. retornos prometidos ----------------
async function retornos(sb: DB) {
  const agora = Date.now(); const h = horaBR(); let feitos = 0;
  const { data } = await sb.from("livia_decisoes").select("*").eq("status", "aberta").order("id");
  for (const d of data || []) {
    // lembra o Jeferson a cada 3 h (8h–21h)
    if (h >= 8 && h < 21 && (!d.lembrado_em || agora - Date.parse(d.lembrado_em) > 3 * 3600e3) && agora - Date.parse(d.created_at) > 2 * 3600e3) {
      await avisarCeo(sb, `⏳ *${d.codigo}* ainda espera você · ${d.nome_cliente || ""}\n${d.pergunta}\n\nResponda aqui começando com *${d.codigo}*.`);
      await sb.from("livia_decisoes").update({ lembrado_em: new Date().toISOString() }).eq("id", d.id);
    }
    // passou do prometido: a Lívia dá satisfação ao cliente (uma vez por prazo) e empurra o prazo 1 dia
    if (d.telefone_cliente && d.prometido_ate && agora > Date.parse(d.prometido_ate) && horaWhats() && !String(d.telefone_cliente).startsWith("lid:") && !telefonesIguais(d.telefone_cliente, CEO_NUMERO)) {
      await sb.from("livia_decisoes").update({ prometido_ate: new Date(Date.parse(d.prometido_ate) + 86400e3).toISOString() }).eq("id", d.id);
      await rodarTarefa(sb, d.telefone_cliente, `Você prometeu retorno a este cliente sobre: "${d.pergunta}" e ainda não tem a resposta da diretoria. Mande uma mensagem curta e natural dizendo que ainda está confirmando e que retorna até amanhã às 10h. NÃO use ferramentas, NÃO invente resposta.`);
      feitos++;
    }
  }
  return { abertas: (data || []).length, satisfacoes: feitos };
}

// ---------------- 2. régua ----------------
const ZERO = "00000000-0000-0000-0000-000000000000";
async function marcar(sb: DB, pedidoId: string, tipo: string, canal: string, destino: string) {
  const { error } = await sb.from("livia_avisos").insert({ pedido_id: pedidoId || ZERO, tipo, canal, destino });
  return !error; // false = já feito
}
async function resultado(sb: DB, pedidoId: string, tipo: string, canal: string, destino: string, ok: boolean, detalhe = "") {
  const q = (x: any) => x.eq("pedido_id", pedidoId || ZERO).eq("tipo", tipo).eq("canal", canal).eq("destino", destino);
  if (ok) await q(sb.from("livia_avisos").update({ ok: true, detalhe: detalhe.slice(0, 400) }));
  else await q(sb.from("livia_avisos").delete()); // tenta de novo na próxima volta
}
async function whats(sb: DB, simular: boolean, pedId: string, tipo: string, fone: string, tarefa: string, log: string[]) {
  if (!fone || !horaWhats()) return;
  if (simular) { log.push(`[simulação] WhatsApp ${tipo} → +${fone}`); return; }
  if (!(await marcar(sb, pedId, tipo, "whatsapp", fone))) return;
  let ok = false; let det = "";
  try { ok = await rodarTarefa(sb, fone, tarefa); } catch (e) { det = String(e); }
  await resultado(sb, pedId, tipo, "whatsapp", fone, ok, det);
  log.push(`WhatsApp ${tipo} → +${fone}: ${ok ? "ok" : "falhou " + det.slice(0, 80)}`);
}
async function mail(sb: DB, simular: boolean, pedId: string, tipo: string, para: string, assunto: string, html: string, log: string[], anexo?: string) {
  if (!para || !horaEmail()) return;
  if (simular) { log.push(`[simulação] e-mail ${tipo} → ${para}`); return; }
  if (!(await marcar(sb, pedId, tipo, "email", para))) return;
  const r = await email(para, assunto, html, anexo, anexo ? "boleto-exa.pdf" : undefined);
  await resultado(sb, pedId, tipo, "email", para, r.ok, r.erro);
  log.push(`e-mail ${tipo} → ${para}: ${r.ok ? "ok" : "falhou " + r.erro.slice(0, 80)}`);
}
const htmlCobranca = (nome: string, titulo: string, frase: string, p: any, k: any) => casca(titulo,
  pE(`Olá${nome ? ", " + escH(nome) : ""}!`) + pE(frase) +
  pE(`Mensalidade ${escH(p.competencia || "#" + p.numero)} · vence <b>${dataBR(p.data_vencimento)}</b> · <b>${brl(k?.valor ?? p.valor)}</b>`) +
  (k?.boleto_url ? botaoE(k.boleto_url, "Abrir o boleto (PDF)") : k?.invoice_url ? botaoE(k.invoice_url, "Pagar agora") : botaoE(PAINEL, "Ver no meu pedido")) +
  codigoE("Pix copia e cola — cai na hora", k?.pix_copia_cola || "") + codigoE("Linha digitável", k?.linha_digitavel || "") +
  pE(`<span style="font-size:13px;color:#8b8285">Se já pagou, pode desconsiderar. Qualquer dúvida, é só me chamar no WhatsApp.</span>`),
  `Vence ${dataBR(p.data_vencimento)} · ${brl(k?.valor ?? p.valor)}`);

async function regua(sb: DB, simular: boolean) {
  const hoje = hojeBR(); const log: string[] = [];
  const { data: peds } = await sb.from("pedidos").select("id,status,blocked_reason,forma_cobranca").eq("livia_cobranca", true).not("status", "in", "(cancelado,cancelado_automaticamente,finalizado)");
  for (const ped of peds || []) {
    const r = await auditoria(sb, ped.id, "cliente");
    if (!r?.ok || !r.parcelas?.length) { log.push(`${ped.id.slice(0, 8)}: sem contrato liberado`); continue; }
    const ct = await contatosDoPedido(sb, ped.id);
    const alvo = ct.cobrar; const nome = alvo.nome;
    const abertas = r.parcelas.filter((p: any) => ["a_vencer", "atrasado"].includes(p.situacao));
    const atrasadas = abertas.filter((p: any) => p.situacao === "atrasado");
    const prox = abertas.find((p: any) => p.situacao === "a_vencer");
    const forma = ped.forma_cobranca === "boleto" ? "boleto" : "pix";

    // pagou tudo e está suspenso por falta de pagamento → reativa
    if (!atrasadas.length && ped.status === "bloqueado" && /pagamento/i.test(String(ped.blocked_reason || ""))) {
      if (simular) log.push(`[simulação] reativar ${ct.nomePedido}`);
      else if (await marcar(sb, ped.id, "reativado_" + hoje, "sistema", "")) {
        const x = await pedidoAdmin(sb, "reativar", ped.id, "Pagamento identificado (Lívia)");
        if (!x.ok) await avisarCeo(sb, `⚠️ Lívia: o pagamento de ${ct.nomePedido} entrou, mas não consegui reativar o pedido. Reative no admin.`);
        else if (alvo.fone && horaWhats()) await rodarTarefa(sb, alvo.fone, `O pagamento de ${ct.nomePedido} entrou e o pedido foi reativado: a marca volta às telas em poucos minutos. Agradeça de forma curta e natural.`);
        log.push(`reativado ${ct.nomePedido}: ${x.ok}`);
      }
    }

    // a vencer
    if (prox) {
      const d = difDias(hoje, String(prox.data_vencimento).slice(0, 10));
      if (d <= 10 && d > 3) {
        let k = (r.cobrancas_abertas || []).find((l: any) => (l.parcelas || []).includes(prox.numero));
        if (!k && !simular) { const g = await gerarCobranca(sb, ped.id, { forma, numero: prox.numero }); k = g?.cobranca; if (!g?.ok) { await avisarCeo(sb, `⚠️ Lívia: não consegui gerar o ${forma} da mensalidade #${prox.numero} de ${ct.nomePedido}: ${g?.erro || g?.http}. A régua tenta de novo.`); continue; } }
        await whats(sb, simular, ped.id, "d10#" + prox.numero, alvo.fone, `Lembrete de 10 dias: a mensalidade #${prox.numero} de ${ct.nomePedido} vence em ${dataBR(prox.data_vencimento)} (${brl(prox.valor)}). Use situacao_cliente para ver o ${forma} já gerado e mande ao cliente: uma frase curta de lembrete e, numa mensagem separada, o Pix copia e cola${forma === "boleto" ? " (e o PDF do boleto com enviar_boleto_pdf)" : ""}. Diga que também mandou por e-mail.`, log);
        await mail(sb, simular, ped.id, "d10#" + prox.numero, alvo.email, `Sua mensalidade EXA vence em ${dataBR(prox.data_vencimento)}`, htmlCobranca(nome, "Sua mensalidade chegou", "Já deixei o pagamento da sua campanha na EXA pronto para você.", prox, k), log, k?.boleto_url || undefined);
      } else if (d <= 3 && d > 1) {
        await whats(sb, simular, ped.id, "d3#" + prox.numero, alvo.fone, `Lembrete de 3 dias: a mensalidade #${prox.numero} de ${ct.nomePedido} vence em ${dataBR(prox.data_vencimento)} (${brl(prox.valor)}). Mensagem curta e leve; ofereça mandar o Pix aqui. Se a situação mostrar que já foi paga, responda [silêncio].`, log);
      } else if (d <= 1 && d >= 0) {
        const k = (r.cobrancas_abertas || []).find((l: any) => (l.parcelas || []).includes(prox.numero));
        await mail(sb, simular, ped.id, "d1#" + prox.numero, alvo.email, d === 0 ? "Sua mensalidade EXA vence hoje" : "Sua mensalidade EXA vence amanhã", htmlCobranca(nome, d === 0 ? "Vence hoje" : "Vence amanhã", "Passando só para lembrar do vencimento da sua campanha na EXA.", prox, k), log);
        // o financeiro não pagou: um dia antes, o dono também fica sabendo
        if (ct.financeiro && ct.dono.fone && !telefonesIguais(ct.dono.fone, ct.financeiro.fone || "")) {
          await whats(sb, simular, ped.id, "d1_dono#" + prox.numero, ct.dono.fone, `Você fala com ${ct.dono.nome}, dono(a) de ${ct.empresa || ct.nomePedido}. A mensalidade #${prox.numero} (${brl(prox.valor)}) vence ${d === 0 ? "hoje" : "amanhã"} e o financeiro (${ct.financeiro.nome}) ainda não pagou. Avise com delicadeza, sem expor ninguém, e ofereça mandar o Pix.`, log);
        }
      }
    }

    // atrasadas (a mais antiga manda)
    if (atrasadas.length) {
      const a = atrasadas[0]; const dias = difDias(String(a.data_vencimento).slice(0, 10), hoje);
      if (dias >= 9 && dias < 10) {
        await whats(sb, simular, ped.id, "vespera#" + a.numero, alvo.fone, `Amanhã é o último prazo: a mensalidade #${a.numero} de ${ct.nomePedido} (${brl(a.valor)}) está há ${dias} dias em atraso e amanhã o pedido seria suspenso (a marca sai das telas). Mensagem amigável: "pague agora e evite que sua marca saia do ar". Ofereça o Pix sem multa nem juros se pagar hoje.`, log);
      } else if (dias >= 10 && ped.status !== "bloqueado" && dias < 30) {
        if (simular) log.push(`[simulação] suspender ${ct.nomePedido}`);
        else if (await marcar(sb, ped.id, "suspensao#" + a.numero, "sistema", "")) {
          const x = await pedidoAdmin(sb, "suspender", ped.id, `Falta de pagamento: mensalidade #${a.numero} vencida em ${dataBR(a.data_vencimento)} (Lívia)`);
          if (!x.ok) { await resultado(sb, ped.id, "suspensao#" + a.numero, "sistema", "", false); await avisarCeo(sb, `⚠️ Lívia: não consegui suspender ${ct.nomePedido} (${dias} dias de atraso). Suspenda no admin.`); }
          else {
            await sb.from("pedidos").update({ status_adimplencia: "suspenso", data_suspensao: new Date().toISOString() }).eq("id", ped.id);
            await avisarCeo(sb, `⛔ Suspendi ${ct.nomePedido}: mensalidade #${a.numero} (${brl(a.valor)}) com ${dias} dias de atraso.`);
            if (alvo.fone && horaWhats()) await rodarTarefa(sb, alvo.fone, `O pedido ${ct.nomePedido} foi suspenso hoje por falta de pagamento (mensalidade #${a.numero}, ${brl(a.valor)}) e a marca saiu das telas. Avise com empatia e ofereça o Pix agora: pagando, volta ao ar em minutos.`);
          }
          log.push(`suspensão ${ct.nomePedido}: ${x.ok}`);
        }
      } else if (dias >= 30) {
        if (!simular && await marcar(sb, ped.id, "cancelar_pergunta#" + a.numero, "ceo", "")) {
          const { data: dd } = await sb.from("livia_decisoes").insert({ telefone_cliente: alvo.fone || null, nome_cliente: ct.empresa || ct.nomePedido, pedido_id: ped.id, pergunta: `Cancelar ${ct.nomePedido}? Está suspenso há 20 dias (${dias} dias de atraso). Pela regra, cancelo e mando o e-mail dizendo que as condições não podem mais ser resgatadas.`, contexto: `${atrasadas.length} mensalidade(s) atrasada(s).`, prometido_ate: addDias(hoje, 3) + "T13:00:00Z" }).select("codigo").single();
          await avisarCeo(sb, `🗂️ *${dd?.codigo}* · ${ct.nomePedido} completou 20 dias suspenso. Cancelo e mando o e-mail de cancelamento? Responda *${dd?.codigo} sim* ou o que prefere.`);
        }
      }
    }
  }
  return log;
}

// ---------------- 3. resumo do dia ----------------
async function resumo(sb: DB, hora: number, agora: boolean) {
  if (!agora && horaBR() < hora) return "ainda não";
  const hoje = hojeBR();
  if (!agora && !(await marcar(sb, ZERO, "resumo_" + hoje, "ceo", ""))) return "já enviado";
  const ok = await rodarTarefa(sb, CEO_NUMERO, `Resumo financeiro do fim do dia (${dataBR(hoje)}) para o Jeferson. Use panorama_financeiro (extrato de 1 dia) e decisoes_abertas. Formato curto para WhatsApp: entrou hoje, saldo, atrasados (quem, quanto, desde quando), o que vence nos próximos 7 dias, perguntas suas esperando resposta e 1 alerta se algo não estiver no verde. Sem enrolação.`);
  return ok ? "enviado" : "falhou";
}
