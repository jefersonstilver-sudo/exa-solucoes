// NANDO - montagem dos avisos de um predio para o site (painel do sindico e paginas de avisos)
import { db, listarArquivosPainel, nomeBase, sincronizarLegado, pastaS3, urlArquivoPainel, type Predio } from "./nando-core.ts";

export async function dadosNando(url: string | undefined): Promise<unknown> {
  if (!url) return null;
  try { const r = await fetch(url); return r.ok ? await r.json() : null; } catch { return null; }
}

// data no nome do arquivo antigo (noticia_garagem_20251209200425.png -> 09/12/2025)
export function dataDoArquivo(nome: string): string | null {
  const m = /_(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})\d{2}\./.exec(nome || "");
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00-03:00` : null;
}

export async function avisosDoPredio(sb: ReturnType<typeof db>, p: Predio) {
  // traz para o Nando os avisos que ja estavam na tela (cadastrados antes, pela equipe EXA)
  await sincronizarLegado(sb, p).catch((e) => console.error("[PREVIA] sincronizar", (e as Error).message));
  const [{ data: rows }, pasta, arquivos] = await Promise.all([
    sb.from("nando_avisos").select("id,tipo,titulo,segundos,inicio,fim,status,arquivo,origem_url,criado_por_nome,created_at,conteudo")
      .eq("building_id", p.id).in("status", ["no_ar", "agendado"]).order("created_at"),
    pastaS3(p.cliente_id),
    listarArquivosPainel(p.cliente_id).catch(() => null),
  ]);
  // predios de cada grupo (aviso publicado junto em varios)
  const lotes = [...new Set((rows || []).map((a: any) => a.conteudo?.lote).filter(Boolean))];
  const nomesLote = new Map<string, string[]>();
  if (lotes.length) {
    const { data: irmaos } = await sb.from("nando_avisos").select("building_id,conteudo").in("conteudo->>lote", lotes).in("status", ["no_ar", "agendado"]);
    const ids = [...new Set((irmaos || []).map((x: any) => x.building_id))];
    const { data: bs } = ids.length ? await sb.from("buildings").select("id,nome").in("id", ids) : { data: [] as any[] };
    const nome = new Map((bs || []).map((b: any) => [b.id, String(b.nome).trim()]));
    for (const x of irmaos || []) {
      const l = x.conteudo?.lote; const n = nome.get(x.building_id); if (!l || !n) continue;
      const lst = nomesLote.get(l) || []; if (!lst.includes(n)) lst.push(n); nomesLote.set(l, lst);
    }
  }
  const avisos = [];
  for (const a of rows || []) {
    const c: any = a.conteudo || {};
    // so mostra como "no ar" o que esta mesmo na pasta do painel
    if (arquivos && a.arquivo && !arquivos.includes(nomeBase(a.arquivo))) continue;
    let url: string | null = null;
    if (a.tipo !== "nando") url = a.origem_url || (pasta && a.arquivo ? urlArquivoPainel(pasta, a.arquivo) : null);
    avisos.push({
      id: String(a.id).slice(0, 8), tipo: a.tipo, titulo: String(a.titulo || "").replace(/\s*\[\d+s\]/, ""), segundos: a.segundos,
      inicio: a.inicio, fim: a.fim, status: a.status,
      criado_por: c.legado ? "equipe EXA (antes do Nando)" : (a.criado_por_nome || ""),
      criado_em: c.legado ? dataDoArquivo(a.arquivo || "") : a.created_at,
      dados: a.tipo === "nando" ? await dadosNando(c.arquivo_url) : null, url, antigo: !!c.legado,
      em_grupo: !!c.lote, grupo_predios: c.lote ? (nomesLote.get(c.lote) || []) : [],
      repete: !!c.ocorrencia_de, serie: c.serie ? `${c.parte}/${c.total}` : null,
      historico: (Array.isArray(c.historico) ? c.historico : []).slice(-15).map((h: any) => ({ em: h.em, quem: String(h.quem || "").replace(/\s*\(\+\d+\)$/, ""), acao: h.acao })),
    });
  }
  return avisos;
}

