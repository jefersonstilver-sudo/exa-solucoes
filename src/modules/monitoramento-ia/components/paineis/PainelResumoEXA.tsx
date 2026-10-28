import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Copy, MessageCircle, Phone, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import type { FrotaPainel } from '../../hooks/useFrotaSaude';
import { ESTADO_INFO } from './estados';

interface Contato { papel: string; nome: string | null; telefone: string }

const soDigitos = (t?: string | null) => (t || '').replace(/\D/g, '');
const telefoneBR = (t?: string | null) => {
  const d = soDigitos(t);
  if (d.length === 10 || d.length === 11) return '55' + d;
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d;
  return null;
};
const fone = (d: string) => d.length === 13 ? `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}` : d.length === 12 ? `(${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}` : d;
const quando = (iso?: string | null) => iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

/**
 * Bloco do topo do painel aberto: estado e causa (Técnico EXA, recolhido), copiar informações
 * e contatos do prédio (síndico, vice, portaria) com conversa direta pelo Nando.
 */
export const PainelResumoEXA = ({ computer, saude, predioNome, elevadorNome, grupoNome }: {
  computer: any;
  saude?: FrotaPainel | null;
  predioNome?: string | null;
  elevadorNome?: string | null;
  grupoNome?: string | null;
}) => {
  const { buildPath } = useAdminBasePath();
  const [aberto, setAberto] = useState(false);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [predio, setPredio] = useState<{ nome: string; endereco: string | null; bairro: string | null } | null>(null);

  useEffect(() => {
    let ativo = true;
    setContatos([]); setPredio(null);
    if (!computer?.building_id) return;
    (supabase as any).from('buildings')
      .select('nome, endereco, bairro, nome_sindico, contato_sindico, contato_sindico_telefone, nome_vice_sindico, contato_vice_sindico, nome_contato_predio, numero_contato_predio')
      .eq('id', computer.building_id).maybeSingle()
      .then(({ data: b }: any) => {
        if (!ativo || !b) return;
        setPredio({ nome: b.nome, endereco: b.endereco, bairro: b.bairro });
        const lista: Contato[] = [];
        const add = (papel: string, nome: string | null, ...tels: (string | null)[]) => {
          const t = tels.map(telefoneBR).find(Boolean);
          if (t && !lista.some((c) => c.telefone === t)) lista.push({ papel, nome, telefone: t });
        };
        add('Síndico', b.nome_sindico, b.contato_sindico_telefone, b.contato_sindico);
        add('Vice-síndico', b.nome_vice_sindico, b.contato_vice_sindico);
        add('Portaria / contato do prédio', b.nome_contato_predio, b.numero_contato_predio);
        setContatos(lista);
      });
    return () => { ativo = false; };
  }, [computer?.building_id]);

  const info = saude ? ESTADO_INFO[saude.estado] : null;
  const endereco = computer?.address || saude?.endereco || [predio?.endereco, predio?.bairro].filter(Boolean).join(' – ') || null;

  const copiarTudo = async () => {
    const linhas = [
      `Painel: ${computer?.name || computer?.condominio_name}`,
      predioNome || predio?.nome ? `Prédio: ${predioNome || predio?.nome}` : null,
      endereco ? `Endereço: ${endereco}` : null,
      `Operadora: ${computer?.provider || saude?.operadora || 'não informada'}`,
      computer?.anydesk_client_id ? `AnyDesk: ${computer.anydesk_client_id}` : null,
      grupoNome ? `Grupo: ${grupoNome}` : null,
      elevadorNome ? `Empresa do elevador: ${elevadorNome}` : null,
      saude ? `Situação: ${ESTADO_INFO[saude.estado].rotulo} — ${saude.causa}` : null,
      saude ? `Quedas em 7 dias: ${saude.quedas_7d} (fora ${saude.fora_7d})` : null,
      ...contatos.map((c) => `${c.papel}: ${c.nome || ''} ${fone(c.telefone)}`.trim()),
    ].filter(Boolean);
    try { await navigator.clipboard.writeText(linhas.join('\n')); toast.success('Informações copiadas'); }
    catch { toast.error('Não consegui copiar'); }
  };

  const linhaTec: string[] = [];
  if (saude) {
    if (saude.porque_cai) linhaTec.push(`Por que cai: ${saude.porque_cai}.`);
    if (saude.vigia?.estado) linhaTec.push(`Vigia de rede agora: ${saude.vigia.estado}${saude.vigia.cabo ? ` · cabo ${saude.vigia.cabo.sinal ? 'com sinal' : 'SEM sinal'}${saude.vigia.cabo.velocidade_mbps ? ` (${saude.vigia.cabo.velocidade_mbps} Mbps)` : ''}` : ''}.`);
    if (saude.ultimo_boot?.tipo) linhaTec.push(`Último religamento: ${saude.ultimo_boot.tipo}${saude.ultimo_boot.ligou_em ? ` (ligou ${saude.ultimo_boot.ligou_em.slice(8, 10)}/${saude.ultimo_boot.ligou_em.slice(5, 7)} ${saude.ultimo_boot.ligou_em.slice(11, 16)})` : ''}.`);
    if (saude.perda_internet_pct != null) linhaTec.push(`Perda de pacotes: internet ${saude.perda_internet_pct}% · roteador do prédio ${saude.perda_roteador_pct ?? '?'}%${saude.lat_ms != null ? ` · latência ${saude.lat_ms} ms` : ''}.`);
    if (saude.download_mbps != null) linhaTec.push(`Velocidade de download: ${saude.download_mbps} Mbps.`);
    if (saude.temp_c != null) linhaTec.push(`Temperatura: ${saude.temp_c} °C.`);
    if (saude.player) linhaTec.push(`Player ${saude.player.versao || '?'} · conteúdo ${saude.player.conteudo_ok ? 'em dia' : 'com falha'}${saude.player.faltando ? ` (${saude.player.faltando} baixando)` : ''} · visto ${quando(saude.player.visto_em)}${saude.player.pendencia ? ` · ${saude.player.pendencia}` : ''}.`);
    linhaTec.push(saude.coletor ? `Diagnóstico do NUC recebido ${quando(saude.coletor.visto_em)}${saude.coletor.versao ? ` (${saude.coletor.versao})` : ''}.` : 'Coletor de diagnóstico não instalado neste NUC.');
  }

  return (
    <div className="mb-6 rounded-2xl bg-white/80 border border-black/[0.06] p-4 md:p-5 shadow-[0_14px_30px_-22px_rgba(70,20,20,0.3)] text-[#17181A]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {info && <span className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold" style={{ background: info.fundo, color: info.cor }}>{info.rotulo}</span>}
            <span className="text-sm font-semibold text-[#45464A]">{computer?.provider || saude?.operadora || 'Operadora não informada'}</span>
          </div>
          <p className="mt-1 text-sm text-[#6A6B70]">{endereco || 'Endereço não cadastrado'}</p>
          {saude && <p className="mt-2 text-[15px] font-bold leading-snug">{saude.causa}</p>}
        </div>
        <button type="button" onClick={copiarTudo}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold hover:bg-black/[0.03]">
          <Copy className="h-4 w-4" /> Copiar informações
        </button>
      </div>

      {saude && (
        <div className="mt-3">
          <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#9C1E1E]">
            <Sparkles className="h-4 w-4" /> Técnico EXA: ver análise
            <ChevronDown className={`h-4 w-4 transition-transform ${aberto ? 'rotate-180' : ''}`} />
          </button>
          {aberto && (
            <ul className="mt-2 space-y-1 text-sm leading-relaxed text-[#3F4044]">
              {linhaTec.map((l, i) => <li key={i}>{l}</li>)}
              {saude.causa_registrada && <li><strong>Causa registrada:</strong> {saude.causa_registrada}</li>}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-black/[0.06] pt-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">Contatos do prédio · Nando</p>
        {!computer?.building_id ? (
          <p className="mt-1 text-sm text-[#6A6B70]">Atribua um prédio a este painel para ver o síndico e a portaria.</p>
        ) : contatos.length === 0 ? (
          <p className="mt-1 text-sm text-[#6A6B70]">Nenhum telefone cadastrado no prédio. Cadastre em Prédios → contatos.</p>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {contatos.map((c) => {
              const nomePredio = predioNome || predio?.nome || '';
              const q = new URLSearchParams({ tel: c.telefone, nome: c.nome || c.papel, predio: nomePredio, papel: c.papel.toLowerCase() });
              return (
                <div key={c.telefone} className="rounded-xl border border-black/[0.06] bg-white px-3 py-2">
                  <p className="text-xs font-bold text-[#6A6B70]">{c.papel}</p>
                  <p className="text-sm font-semibold truncate">{c.nome || '—'}</p>
                  <p className="text-xs text-[#6A6B70] flex items-center gap-1"><Phone className="h-3 w-3" />{fone(c.telefone)}</p>
                  <Link to={`${buildPath('nando')}?${q.toString()}`}
                    className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#9C1E1E] px-3 text-xs font-bold text-white hover:bg-[#86190F]">
                    <MessageCircle className="h-3.5 w-3.5" /> Conversar pelo Nando
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PainelResumoEXA;
