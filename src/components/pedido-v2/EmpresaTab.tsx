/**
 * EXA 2.0 — Cadastro completo da empresa no portal (igual ao protótipo aprovado).
 * Identidade · Comunicação (cores, tipografia, tom de voz) · Público & diferenciais · Contatos · Biblioteca.
 *
 * Fonte dos dados:
 *  - Colunas de marcas_clientes (segmento, endereço, instagram, cores, fontes, logo…).
 *  - marca_ficha_campos: a "ficha" que a Sofia lê. Todo campo editado aqui é espelhado na ficha
 *    com origem 'cliente' (selo "✎ você"); o que a Sofia preencheu mostra "✦ preenchido pela Sofia".
 *    Campos novos (contatos, estilo da tipografia…) entram via adicionarCampo — nenhuma coluna nova.
 *  - marca_arquivos + bucket 'marcas' ({marcaId}/...), origem 'portal'.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check, ExternalLink, FileText, Film, Globe, Image as ImageIcon, Instagram, Loader2, MapPin, MessageCircle,
  Palette, Pencil, Plus, Sparkles, Target, Trash2, Type, Upload, UserRound, X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { FichaCampo, Marca, MarcaArquivo, MarcaPatch, TipoArquivo } from '@/hooks/exa2/usePedidoEmpresas';
import { HoverPlayVideo } from './VideoPreview';
import { BTN, BTN_SOFT, CARD, EYEBROW, INPUT } from './ui';

interface Props {
  marcas: Marca[];
  ficha: FichaCampo[];
  arquivos: MarcaArquivo[];
  loading: boolean;
  busy: boolean;
  disabled?: boolean;
  criarEmpresa: (nome: string) => Promise<Marca>;
  atualizarEmpresa: (id: string, patch: MarcaPatch) => Promise<void>;
  salvarCampo: (id: string, valor: string) => Promise<void>;
  adicionarCampo: (marcaId: string, campo: string, valor: string, categoria?: string) => Promise<void>;
  enviarArquivo: (marcaId: string, tipo: TipoArquivo, f: File, legenda?: string) => Promise<{ url: string; path: string } | void>;
  removerArquivo: (a: MarcaArquivo) => Promise<void>;
}

const quando = (iso?: string | null) => {
  if (!iso) return '';
  const d = (Date.now() - new Date(iso).getTime()) / 864e5;
  if (d < 1) return 'hoje';
  if (d < 2) return 'ontem';
  return `há ${Math.floor(d)} dias`;
};
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const iniciais = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
const MAX_MB = 100;

type Origem = 'sofia' | 'cliente' | 'exa' | null;

/** Selo de origem que a ficha já usa: "✦ preenchido pela Sofia" / "✎ você" / "EXA". */
const SeloOrigem: React.FC<{ origem: Origem; em?: string | null }> = ({ origem, em }) => {
  if (!origem) return null;
  const cls = origem === 'cliente' ? 'bg-[#e8eefd] text-[#2563eb]' : origem === 'exa' ? 'bg-[#f0ecea] text-[#8b8285]' : 'bg-[#f8e9ec] text-[#9e1b34]';
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 align-middle text-[10px] font-bold ${cls}`}>
      {origem === 'cliente' ? '✎ você' : origem === 'exa' ? 'EXA' : <><Sparkles className="h-2.5 w-2.5" /> preenchido pela Sofia</>}
      {em && <span className="font-medium opacity-70">· {quando(em)}</span>}
    </span>
  );
};

// ------------------------------------------------------------------ cores / fontes / logo (jsonb)
interface Cor { nome?: string; hex: string; uso?: string }
const lerCores = (m: Marca, fichaTxt?: string | null): Cor[] => {
  const raw = m.cores as unknown;
  const out: Cor[] = [];
  if (Array.isArray(raw)) {
    for (const c of raw) {
      if (typeof c === 'string' && /^#?[0-9a-f]{3,8}$/i.test(c)) out.push({ hex: c.startsWith('#') ? c : `#${c}` });
      else if (c && typeof c === 'object' && typeof (c as any).hex === 'string') out.push({ hex: (c as any).hex, nome: (c as any).nome || undefined, uso: (c as any).uso || undefined });
    }
  }
  if (!out.length && fichaTxt) (fichaTxt.match(/#[0-9a-f]{6}\b/gi) || []).forEach((hex) => out.push({ hex }));
  return out;
};
const lerFontes = (m: Marca): string[] => {
  const raw = m.fontes as unknown;
  if (!Array.isArray(raw)) return [];
  return raw.map((f) => (typeof f === 'string' ? f : f && typeof f === 'object' ? (f as any).nome || (f as any).familia || '' : '')).filter(Boolean);
};
const logoDe = (m: Marca, arquivos: MarcaArquivo[]): string | null => {
  const l = m.logo as any;
  if (l && typeof l === 'object' && typeof l.url === 'string') return l.url;
  return arquivos.find((a) => a.marca_id === m.id && a.tipo === 'logo')?.url || null;
};

/** Carrega a fonte do Google Fonts para a amostra (se não existir, cai no estilo genérico). */
const fontesCarregadas = new Set<string>();
const carregarFonte = (familia: string) => {
  const f = familia.trim();
  if (!f || fontesCarregadas.has(f) || typeof document === 'undefined') return;
  fontesCarregadas.add(f);
  try {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;700;800&display=swap`;
    document.head.appendChild(link);
  } catch {
    /* sem fonte: a amostra usa o estilo genérico */
  }
};

/** Verifica se a imagem tem transparência (logo "sem fundo"). SVG conta como transparente. */
const temTransparencia = (file: File): Promise<boolean | null> =>
  new Promise((resolve) => {
    if (file.type === 'image/svg+xml') return resolve(true);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const w = Math.min(200, img.naturalWidth || 1);
        const h = Math.max(1, Math.round(((img.naturalHeight || 1) / (img.naturalWidth || 1)) * w));
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        const d = ctx.getImageData(0, 0, w, h).data;
        let transp = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] < 250) transp++;
        resolve(transp / (w * h) > 0.02);
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });

// ------------------------------------------------------------------ definição dos campos
type ColunaTexto = 'segmento' | 'slogan' | 'endereco' | 'instagram' | 'whatsapp_qr' | 'site' | 'tom_de_voz' | 'proibido';
interface CampoDef {
  key: string;
  label: string;
  coluna?: ColunaTexto;
  ficha: string; // nome do campo na ficha da Sofia
  categoria: string;
  placeholder?: string;
  multiline?: boolean;
  icon?: React.ElementType;
  link?: (v: string) => string;
  sugestoes?: string[];
}

const IDENTIDADE: CampoDef[] = [
  { key: 'segmento', label: 'Segmento', coluna: 'segmento', ficha: 'Segmento', categoria: 'Identidade', placeholder: 'Ex.: Restaurante · rodízio' },
  { key: 'slogan', label: 'Slogan / frases', coluna: 'slogan', ficha: 'Slogan / frases da marca', categoria: 'Identidade', placeholder: 'Ex.: O melhor corte da fronteira', multiline: true },
];
const COMUNICACAO: CampoDef[] = [
  { key: 'endereco', label: 'Endereço', coluna: 'endereco', ficha: 'Endereço / bairro', categoria: 'Operação', placeholder: 'Rua, número, bairro', icon: MapPin, link: (x) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x)}` },
  { key: 'instagram', label: 'Instagram', coluna: 'instagram', ficha: 'Instagram', categoria: 'Comunicação', placeholder: '@suaempresa', icon: Instagram, link: (x) => `https://instagram.com/${x.replace(/^@|https?:\/\/(www\.)?instagram\.com\//g, '').split(/[/?]/)[0]}` },
  { key: 'whatsapp', label: 'WhatsApp', coluna: 'whatsapp_qr', ficha: 'WhatsApp', categoria: 'Comunicação', placeholder: '(45) 99999-9999', icon: MessageCircle, link: (x) => `https://wa.me/${(x.replace(/\D/g, '').length <= 11 ? '55' : '') + x.replace(/\D/g, '')}` },
  { key: 'site', label: 'Site', coluna: 'site', ficha: 'Site', categoria: 'Comunicação', placeholder: 'www.suaempresa.com.br', icon: Globe, link: (x) => (x.startsWith('http') ? x : `https://${x}`) },
  { key: 'tom', label: 'Tom de voz', coluna: 'tom_de_voz', ficha: 'Tom de voz', categoria: 'Identidade', placeholder: 'Ex.: caloroso, premium, acolhedor', multiline: true, sugestoes: ['Caloroso', 'Premium', 'Divertido', 'Direto', 'Acolhedor', 'Jovem', 'Sofisticado', 'Popular'] },
  { key: 'evitar', label: 'O que evitar nos vídeos', coluna: 'proibido', ficha: 'O que evitar nos vídeos', categoria: 'Criativo', placeholder: 'Ex.: imagens de IA, pessoas bebendo', multiline: true },
];
const PUBLICO: CampoDef[] = [
  { key: 'publico', label: 'Público-alvo', ficha: 'Público-alvo', categoria: 'Identidade', placeholder: 'Quem você quer atrair? Idade, estilo de vida, bairro…', multiline: true },
  { key: 'diferencial', label: 'Diferenciais', ficha: 'Diferencial', categoria: 'Identidade', placeholder: 'Por que escolher você e não o concorrente?', multiline: true },
  { key: 'carro', label: 'O que vende (carro-chefe)', ficha: 'O que vende (carro-chefe)', categoria: 'Identidade', placeholder: 'Produto ou serviço principal', multiline: true },
  { key: 'preco', label: 'Faixa de preço / ticket médio', ficha: 'Faixa de preço / ticket médio', categoria: 'Oferta', placeholder: 'Ex.: R$ 80 a R$ 150 por pessoa' },
  { key: 'cta', label: 'Chamada final (CTA) preferida', ficha: 'Chamada final (CTA) preferida', categoria: 'Criativo', placeholder: 'Ex.: Reserve pelo WhatsApp' },
];
const CONTATOS: CampoDef[] = [
  { key: 'resp', label: 'Responsável', ficha: 'Contato responsável', categoria: 'Contatos', placeholder: 'Nome de quem aprova os vídeos', icon: UserRound },
  { key: 'cargo', label: 'Cargo', ficha: 'Cargo do responsável', categoria: 'Contatos', placeholder: 'Ex.: Sócio, Marketing' },
  { key: 'tel', label: 'Telefone / WhatsApp', ficha: 'Telefone do responsável', categoria: 'Contatos', placeholder: '(45) 99999-9999', icon: MessageCircle, link: (x) => `https://wa.me/${(x.replace(/\D/g, '').length <= 11 ? '55' : '') + x.replace(/\D/g, '')}` },
  { key: 'email', label: 'E-mail', ficha: 'E-mail do responsável', categoria: 'Contatos', placeholder: 'contato@suaempresa.com.br', link: (x) => `mailto:${x}` },
];
const CORES_FICHA = 'Cores da marca';
const TIPO_FICHA = 'Tipografia';
const ESTILO_FICHA = 'Estilo da tipografia';
const ESTILOS = [
  { id: 'Serifada elegante', css: 'Georgia, "Playfair Display", serif' },
  { id: 'Sans moderna', css: '"Plus Jakarta Sans", Inter, system-ui, sans-serif' },
  { id: 'Condensada de impacto', css: '"Oswald", "Barlow Condensed", "Arial Narrow", sans-serif' },
  { id: 'Arredondada amigável', css: '"Nunito", "Quicksand", system-ui, sans-serif' },
  { id: 'Manuscrita', css: '"Pacifico", "Dancing Script", cursive' },
];
const FONTES_SUGERIDAS = ['Montserrat', 'Poppins', 'Playfair Display', 'Oswald', 'Bebas Neue', 'Roboto', 'Lato', 'Nunito', 'Raleway', 'Inter', 'Merriweather', 'Pacifico'];

/** Campos cobertos pelas seções acima (não repetem em "Mais informações"). */
const COBERTOS = new Set(
  [...IDENTIDADE, ...COMUNICACAO, ...PUBLICO, ...CONTATOS].map((c) => norm(c.ficha)).concat([norm(CORES_FICHA), norm(TIPO_FICHA), norm(ESTILO_FICHA), norm('Endereço')]),
);

// =================================================================== componente principal
export const EmpresaTab: React.FC<Props> = (p) => {
  const [selId, setSelId] = useState<string | null>(null);
  const [novaEmpresa, setNovaEmpresa] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const marca = p.marcas.find((m) => m.id === selId) || p.marcas[0] || null;

  const criar = async () => {
    if (!novaEmpresa.trim()) return;
    try {
      const m = await p.criarEmpresa(novaEmpresa);
      setSelId(m.id);
      setNovaEmpresa('');
      setAddOpen(false);
      toast.success('Empresa cadastrada! Complete a ficha abaixo — a Sofia também vai ajudando.');
    } catch (e: any) {
      toast.error(e.message?.includes('duplicate') ? 'Essa empresa já está neste pedido' : e.message || 'Erro ao cadastrar');
    }
  };

  if (p.loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#9C1E1E]" /></div>;

  if (!marca) {
    return (
      <div className={`${CARD} p-6 text-center sm:p-10`}>
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#9C1E1E] text-lg font-extrabold text-white">S</span>
        <h3 className="text-xl font-extrabold tracking-tight text-[#1b1719]">Cadastre a empresa deste pedido</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-[#8b8285]">
          A Sofia usa tudo o que sabe sobre a sua empresa para criar vídeos melhores: logo, cores, tipografia, público e vídeos crus. Comece pelo nome.
        </p>
        <div className="mx-auto mt-5 flex max-w-sm gap-2">
          <input value={novaEmpresa} onChange={(e) => setNovaEmpresa(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && criar()} placeholder="Nome da empresa" className={INPUT} disabled={p.disabled} />
          <button onClick={criar} disabled={p.busy || p.disabled || !novaEmpresa.trim()} className={BTN}>
            {p.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cadastrar'}
          </button>
        </div>
        <p className="mt-3 text-[11px] text-[#8b8285]">Tem mais de uma empresa neste pedido? Depois você adiciona as outras.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className={EYEBROW}>Suas empresas</div>
        <h2 className="text-2xl font-extrabold tracking-tight text-[#1b1719]">Empresas do pedido</h2>
        <p className="mt-1 text-sm text-[#8b8285]">Um pedido pode divulgar mais de uma empresa sua. Tudo aqui é usado pela Sofia para criar seus vídeos.</p>
      </div>

      {/* chips das empresas */}
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1.5">
        {p.marcas.map((m) => {
          const logo = logoDe(m, p.arquivos);
          const sel = m.id === marca.id;
          return (
            <button key={m.id} onClick={() => setSelId(m.id)} className={`flex flex-none items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 transition ${sel ? 'bg-[#9C1E1E] text-white shadow-md' : `${CARD} text-[#1b1719]`}`}>
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#ebe6e7] bg-white text-[13px] font-extrabold text-[#9e1b34]">
                {logo ? <img src={logo} alt="" className="h-full w-full object-contain p-0.5" /> : iniciais(m.empresa)}
              </span>
              <span className="text-left text-[13.5px] font-bold leading-tight">
                {m.empresa}
                <small className={`block text-[11px] font-medium ${sel ? 'text-white/75' : 'text-[#8b8285]'}`}>{m.segmento || 'segmento a definir'}</small>
              </span>
            </button>
          );
        })}
        {addOpen ? (
          <span className={`${CARD} flex flex-none items-center gap-1 rounded-full py-1 pl-3 pr-1 ring-1 ring-[#9C1E1E]`}>
            <input autoFocus value={novaEmpresa} onChange={(e) => setNovaEmpresa(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && criar()} placeholder="Nome da empresa" className="w-40 bg-transparent text-sm outline-none" />
            <button onClick={criar} disabled={p.busy} className="rounded-full bg-[#9C1E1E] p-1.5 text-white"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={() => setAddOpen(false)} className="rounded-full p-1.5 text-[#8b8285]"><X className="h-3.5 w-3.5" /></button>
          </span>
        ) : (
          <button disabled={p.disabled} onClick={() => setAddOpen(true)} className="flex flex-none items-center gap-1 rounded-full border-[1.5px] border-dashed border-[#9C1E1E]/50 px-4 py-2 text-[13.5px] font-bold text-[#9C1E1E] disabled:opacity-40">
            <Plus className="h-3.5 w-3.5" /> Empresa
          </button>
        )}
      </div>
      {!marca.pedido_id && (
        <p className="text-xs text-[#8b8285]">Esta é a empresa da sua conta — vale para todos os seus pedidos. Se este pedido for de outra empresa, adicione acima.</p>
      )}

      <FichaEmpresa key={marca.id} marca={marca} {...p} />
    </div>
  );
};

// =================================================================== ficha de uma empresa
const FichaEmpresa: React.FC<Props & { marca: Marca }> = (p) => {
  const { marca } = p;
  const campos = useMemo(() => p.ficha.filter((c) => c.marca_id === marca.id), [p.ficha, marca.id]);
  const arquivos = useMemo(() => p.arquivos.filter((a) => a.marca_id === marca.id), [p.arquivos, marca.id]);
  const porNome = useMemo(() => {
    const m = new Map<string, FichaCampo>();
    campos.forEach((c) => m.set(norm(c.campo), c));
    return m;
  }, [campos]);
  const campo = (nome: string) => porNome.get(norm(nome)) || null;

  /** Valor efetivo de um campo: ficha (se preenchida) senão coluna. */
  const valorDe = (d: CampoDef): string => {
    const f = campo(d.ficha);
    if (f?.valor) return f.valor;
    return (d.coluna ? ((marca as any)[d.coluna] as string | null) : null) || '';
  };
  const origemDe = (d: CampoDef): { origem: Origem; em?: string | null } => {
    const f = campo(d.ficha);
    if (f?.valor) return { origem: (f.origem as Origem) || 'sofia', em: f.updated_at };
    const col = d.coluna ? ((marca as any)[d.coluna] as string | null) : null;
    return { origem: col ? 'sofia' : null };
  };

  /** Grava na ficha (origem 'cliente'): atualiza se existe, cria se não existe. */
  const gravarFicha = async (nome: string, valor: string, categoria: string) => {
    const f = campo(nome);
    if (f) await p.salvarCampo(f.id, valor);
    else if (valor.trim()) await p.adicionarCampo(marca.id, nome, valor, categoria);
  };
  const salvarDef = async (d: CampoDef, v: string) => {
    if (d.coluna) await p.atualizarEmpresa(marca.id, { [d.coluna]: v.trim() || null } as MarcaPatch);
    await gravarFicha(d.ficha, v, d.categoria);
  };

  // ---- estado derivado
  const logo = logoDe(marca, arquivos);
  const logoInfo = (marca.logo as any) || null;
  const cores = lerCores(marca, campo(CORES_FICHA)?.valor);
  const fontes = lerFontes(marca);
  const estilo = campo(ESTILO_FICHA)?.valor || '';
  const crus = arquivos.filter((a) => a.tipo === 'video' || a.tipo === 'foto');

  // ---- completude
  const temContato = !!(valorDe(COMUNICACAO[1]) || valorDe(COMUNICACAO[2]));
  const itens: { label: string; ok: boolean; alvo: string }[] = [
    { label: 'Logo sem fundo', ok: !!logo, alvo: 'emp-identidade' },
    { label: 'Segmento', ok: !!valorDe(IDENTIDADE[0]), alvo: 'emp-identidade' },
    { label: 'Endereço', ok: !!valorDe(COMUNICACAO[0]), alvo: 'emp-comunicacao' },
    { label: 'Instagram ou WhatsApp', ok: temContato, alvo: 'emp-comunicacao' },
    { label: 'Tom de voz', ok: !!valorDe(COMUNICACAO[4]), alvo: 'emp-comunicacao' },
    { label: 'Cores da marca', ok: cores.length > 0, alvo: 'emp-visual' },
    { label: 'Tipografia', ok: fontes.length > 0 || !!campo(TIPO_FICHA)?.valor || !!estilo, alvo: 'emp-visual' },
    { label: 'Público-alvo', ok: !!valorDe(PUBLICO[0]), alvo: 'emp-publico' },
    { label: 'Diferenciais', ok: !!valorDe(PUBLICO[1]), alvo: 'emp-publico' },
    { label: 'Carro-chefe', ok: !!valorDe(PUBLICO[2]), alvo: 'emp-publico' },
    { label: 'Contato responsável', ok: !!valorDe(CONTATOS[0]) && !!valorDe(CONTATOS[2]), alvo: 'emp-contatos' },
    { label: 'Vídeos crus ou fotos', ok: crus.length > 0, alvo: 'emp-biblioteca' },
    // essenciais da ficha que não têm seção própria (ex.: horário, pagamento)
    ...campos
      .filter((c) => c.obrigatorio && !COBERTOS.has(norm(c.campo)))
      .map((c) => ({ label: c.campo, ok: !!c.valor, alvo: 'emp-mais' })),
  ];
  const feitos = itens.filter((i) => i.ok).length;
  const pct = itens.length ? Math.round((feitos / itens.length) * 100) : 0;
  const faltam = itens.filter((i) => !i.ok);
  const irPara = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const dis = p.disabled;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ------- coluna lateral: completude (no mobile vem primeiro) ------- */}
      <aside className="order-first space-y-3 lg:order-last lg:sticky lg:top-24 lg:self-start">
        <div className={`${CARD} p-4`}>
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-extrabold text-[#1b1719]">Cadastro {pct === 100 ? 'completo' : 'da empresa'}</div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${pct >= 80 ? 'bg-[#e6f6ec] text-[#13a24a]' : 'bg-[#fbefda] text-[#c2740a]'}`}>{pct}%</span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#ebe6e7]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#9e1b34] to-[#c0304b] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 text-[11px] text-[#8b8285]">{feitos} de {itens.length} itens preenchidos</div>
          {faltam.length > 0 ? (
            <>
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-[#8b8285]">Falta preencher</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {faltam.map((f) => (
                  <button key={f.label} onClick={() => irPara(f.alvo)} className="rounded-full bg-[#fbefda] px-2.5 py-1 text-[11.5px] font-bold text-[#c2740a] hover:bg-[#f8e2bd]">
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-3 text-xs font-semibold text-[#13a24a]">Tudo preenchido — a Sofia tem o que precisa para criar seus vídeos.</p>
          )}
        </div>
        <div className="flex gap-2 rounded-xl border border-[#f8e9ec] bg-[#fdf6f7] px-3 py-2.5 text-xs text-[#554e50]">
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#9C1E1E] text-[11px] font-extrabold text-white">S</span>
          <span>A Sofia também preenche tudo isso conversando com você pelo WhatsApp. O que você corrigir aqui vale na hora.</span>
        </div>
      </aside>

      {/* ------- coluna principal ------- */}
      <div className="min-w-0 space-y-5">
        {/* IDENTIDADE */}
        <section id="emp-identidade" className={`${CARD} scroll-mt-24 p-4 sm:p-5`}>
          <div className="flex items-start gap-4">
            <LogoBox marca={marca} logo={logo} logoInfo={logoInfo} disabled={dis} enviarArquivo={p.enviarArquivo} atualizarEmpresa={p.atualizarEmpresa} />
            <div className="min-w-0 flex-1">
              <NomeEditavel marca={marca} disabled={dis} atualizar={p.atualizarEmpresa} />
              <div className="text-[12.5px] text-[#8b8285]">{valorDe(IDENTIDADE[0]) || 'Segmento a definir'}</div>
              <div className="mt-1 text-[11.5px] text-[#8b8285]">
                {logo ? (logoInfo?.transparente === false ? '⚠️ Logo com fundo — prefira PNG sem fundo' : 'Logo sem fundo ✓ · usado pela Sofia') : 'Envie o logo sem fundo (PNG transparente ou SVG)'}
              </div>
            </div>
          </div>
          <SecTitulo icon={Sparkles} t="Identidade" />
          <div className="divide-y divide-[#f1edee]">
            {IDENTIDADE.map((d) => (
              <LinhaCampo key={d.key} def={d} valor={valorDe(d)} {...origemDe(d)} disabled={dis} onSave={(v) => salvarDef(d, v)} />
            ))}
          </div>
        </section>

        {/* COMUNICAÇÃO */}
        <section id="emp-comunicacao" className={`${CARD} scroll-mt-24 p-4 sm:p-5`}>
          <SecTitulo icon={MessageCircle} t="Comunicação" sub="Onde te encontrar e como a marca fala" first />
          <div className="divide-y divide-[#f1edee]">
            {COMUNICACAO.map((d) => (
              <LinhaCampo key={d.key} def={d} valor={valorDe(d)} {...origemDe(d)} disabled={dis} onSave={(v) => salvarDef(d, v)} />
            ))}
          </div>
        </section>

        {/* VISUAL: cores + tipografia */}
        <section id="emp-visual" className={`${CARD} scroll-mt-24 p-4 sm:p-5`}>
          <SecTitulo icon={Palette} t="Cores & tipografia" sub="A Sofia aplica isso em todos os vídeos" first />
          <CoresEditor
            cores={cores}
            origem={campo(CORES_FICHA)?.valor ? (campo(CORES_FICHA)!.origem as Origem) : cores.length ? 'sofia' : null}
            em={campo(CORES_FICHA)?.updated_at}
            disabled={dis}
            onSave={async (lista) => {
              await p.atualizarEmpresa(marca.id, { cores: lista as any });
              await gravarFicha(CORES_FICHA, lista.map((c) => `${c.nome || c.uso || ''} ${c.hex}`.trim()).join(', '), 'Criativo');
            }}
          />
          <div className="my-4 h-px bg-[#f1edee]" />
          <TipografiaEditor
            nome={marca.empresa}
            fontes={fontes}
            estilo={estilo}
            textoFicha={campo(TIPO_FICHA)?.valor || ''}
            origem={campo(TIPO_FICHA)?.valor ? (campo(TIPO_FICHA)!.origem as Origem) : fontes.length ? 'sofia' : null}
            em={campo(TIPO_FICHA)?.updated_at}
            disabled={dis}
            onSave={async (titulo, texto, est) => {
              const lista = [titulo, texto].map((x) => x.trim()).filter(Boolean);
              await p.atualizarEmpresa(marca.id, { fontes: lista as any });
              await gravarFicha(TIPO_FICHA, [titulo && `Títulos: ${titulo}`, texto && `Texto: ${texto}`].filter(Boolean).join(' · '), 'Criativo');
              if (est !== estilo) await gravarFicha(ESTILO_FICHA, est, 'Criativo');
            }}
          />
        </section>

        {/* PÚBLICO & DIFERENCIAIS */}
        <section id="emp-publico" className={`${CARD} scroll-mt-24 p-4 sm:p-5`}>
          <SecTitulo icon={Target} t="Público-alvo & diferenciais" sub="Para quem você fala e por que te escolhem" first />
          <div className="divide-y divide-[#f1edee]">
            {PUBLICO.map((d) => (
              <LinhaCampo key={d.key} def={d} valor={valorDe(d)} {...origemDe(d)} disabled={dis} onSave={(v) => salvarDef(d, v)} />
            ))}
          </div>
        </section>

        {/* CONTATOS */}
        <section id="emp-contatos" className={`${CARD} scroll-mt-24 p-4 sm:p-5`}>
          <SecTitulo icon={UserRound} t="Contatos" sub="Quem fala pela empresa e aprova os vídeos" first />
          <div className="divide-y divide-[#f1edee]">
            {CONTATOS.map((d) => (
              <LinhaCampo key={d.key} def={d} valor={valorDe(d)} {...origemDe(d)} disabled={dis} onSave={(v) => salvarDef(d, v)} />
            ))}
          </div>
        </section>

        {/* BIBLIOTECA */}
        <section id="emp-biblioteca" className="scroll-mt-24">
          <Biblioteca marcaId={marca.id} arquivos={arquivos} disabled={dis} enviarArquivo={p.enviarArquivo} removerArquivo={p.removerArquivo} />
        </section>

        {/* MAIS INFORMAÇÕES (resto da ficha) */}
        <section id="emp-mais" className="scroll-mt-24">
          <MaisInformacoes marca={marca} campos={campos.filter((c) => !COBERTOS.has(norm(c.campo)))} disabled={dis} salvarCampo={p.salvarCampo} adicionarCampo={p.adicionarCampo} />
        </section>
      </div>
    </div>
  );
};

const SecTitulo: React.FC<{ icon: React.ElementType; t: string; sub?: string; first?: boolean }> = ({ icon: I, t, sub, first }) => (
  <div className={`${first ? '' : 'mt-4 border-t border-[#f1edee] pt-4'} mb-1 flex items-center gap-2.5`}>
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-[#f8e9ec] text-[#9e1b34]"><I className="h-4 w-4" /></span>
    <div>
      <h3 className="text-base font-extrabold tracking-tight text-[#1b1719]">{t}</h3>
      {sub && <div className="text-[11.5px] text-[#8b8285]">{sub}</div>}
    </div>
  </div>
);

// ------------------------------------------------------------------ nome
const NomeEditavel: React.FC<{ marca: Marca; disabled?: boolean; atualizar: Props['atualizarEmpresa'] }> = ({ marca, disabled, atualizar }) => {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(marca.empresa);
  const salvar = async () => {
    if (!v.trim()) return;
    try { await atualizar(marca.id, { empresa: v.trim() }); setEdit(false); toast.success('Nome atualizado'); } catch (e: any) { toast.error(e.message?.includes('duplicate') ? 'Já existe uma empresa com esse nome neste pedido' : e.message); }
  };
  if (edit) {
    return (
      <div className="flex gap-1.5">
        <input autoFocus value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && salvar()} className={`${INPUT} py-1.5 text-lg font-extrabold`} maxLength={80} />
        <button onClick={salvar} className="rounded-xl bg-[#9C1E1E] px-2.5 text-white"><Check className="h-4 w-4" /></button>
        <button onClick={() => { setEdit(false); setV(marca.empresa); }} className="rounded-xl px-2 text-[#8b8285]"><X className="h-4 w-4" /></button>
      </div>
    );
  }
  return (
    <button disabled={disabled} onClick={() => setEdit(true)} className="group flex max-w-full items-center gap-2 text-left">
      <h2 className="truncate text-xl font-extrabold tracking-tight text-[#1b1719] sm:text-2xl">{marca.empresa}</h2>
      <Pencil className="h-3.5 w-3.5 flex-none text-[#c9c1c3] group-hover:text-[#9C1E1E]" />
    </button>
  );
};

// ------------------------------------------------------------------ logo
const LogoBox: React.FC<{
  marca: Marca; logo: string | null; logoInfo: any; disabled?: boolean;
  enviarArquivo: Props['enviarArquivo']; atualizarEmpresa: Props['atualizarEmpresa'];
}> = ({ marca, logo, logoInfo, disabled, enviarArquivo, atualizarEmpresa }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const onFile = async (f?: File | null) => {
    if (!f) return;
    if (!/^image\/(png|svg\+xml|webp)$/.test(f.type)) { toast.error('Envie o logo em PNG, SVG ou WebP (de preferência sem fundo)'); return; }
    if (f.size > 20 * 1024 * 1024) { toast.error('Logo muito grande (máximo 20 MB)'); return; }
    setEnviando(true);
    try {
      const transparente = await temTransparencia(f);
      const r = await enviarArquivo(marca.id, 'logo', f, `Logo · ${f.name}`);
      if (r) await atualizarEmpresa(marca.id, { logo: { url: r.url, path: r.path, transparente, origem: 'portal', enviado_em: new Date().toISOString() } as any });
      if (transparente === false) toast.warning('Logo enviado, mas parece ter fundo. Se tiver a versão sem fundo (PNG transparente), envie também.');
      else toast.success('Logo enviado — a Sofia já vai usar');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar o logo');
    } finally {
      setEnviando(false);
      if (ref.current) ref.current.value = '';
    }
  };
  return (
    <div className="flex-none">
      <button
        disabled={disabled || enviando}
        onClick={() => ref.current?.click()}
        title={logo ? 'Trocar logo' : 'Enviar logo sem fundo'}
        className="group relative flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[18px] border border-[#ebe6e7] bg-[conic-gradient(#f1edee_25%,#fff_0_50%,#f1edee_0_75%,#fff_0)] bg-[length:12px_12px] sm:h-20 sm:w-20"
      >
        {logo ? <img src={logo} alt="Logo" className="h-full w-full object-contain p-1.5" /> : <span className="text-2xl font-extrabold text-[#9e1b34]">{iniciais(marca.empresa)}</span>}
        <span className={`absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/45 text-[10px] font-bold text-white transition ${enviando || !logo ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${!logo && !enviando ? 'bg-[#9C1E1E]/75' : ''}`}>
          {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Upload className="h-4 w-4" />{logo ? 'Trocar' : 'Logo'}</>}
        </span>
      </button>
      {logoInfo?.transparente === false && <div className="mt-1 text-center text-[9.5px] font-bold text-[#c2740a]">com fundo</div>}
      <input ref={ref} type="file" accept="image/png,image/svg+xml,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
};

// ------------------------------------------------------------------ linha de campo editável
const LinhaCampo: React.FC<{
  def: CampoDef; valor: string; origem: Origem; em?: string | null; disabled?: boolean; onSave: (v: string) => Promise<void>;
}> = ({ def, valor, origem, em, disabled, onSave }) => {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(valor);
  const [saving, setSaving] = useState(false);
  const I = def.icon;
  const salvar = async () => {
    setSaving(true);
    try { await onSave(v); setEdit(false); toast.success('Salvo — a Sofia já vai usar essa informação'); } catch (e: any) { toast.error(e.message || 'Erro ao salvar'); } finally { setSaving(false); }
  };
  return (
    <div className="py-3">
      {edit ? (
        <div className="space-y-2">
          <div className="text-xs font-bold text-[#554e50]">{def.label}</div>
          {def.multiline ? (
            <textarea autoFocus value={v} onChange={(e) => setV(e.target.value)} rows={3} placeholder={def.placeholder} className={INPUT} />
          ) : (
            <input autoFocus value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && salvar()} placeholder={def.placeholder} className={INPUT} />
          )}
          {def.sugestoes && (
            <div className="flex flex-wrap gap-1.5">
              {def.sugestoes.map((s) => {
                const tem = norm(v).includes(norm(s));
                return (
                  <button key={s} type="button" onClick={() => setV((x) => (tem ? x : x.trim() ? `${x.trim().replace(/[,.]$/, '')}, ${s.toLowerCase()}` : s))} className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${tem ? 'bg-[#9C1E1E] text-white' : 'bg-[#f7f5f6] text-[#554e50] hover:bg-[#f8e9ec]'}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex gap-2">
            <button disabled={saving} onClick={salvar} className={`${BTN} px-3 py-1.5 text-xs`}>{saving ? 'Salvando…' : 'Salvar'}</button>
            <button onClick={() => { setEdit(false); setV(valor); }} className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#8b8285]">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          {I && <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-[#f7f5f6] text-[#9e1b34]"><I className="h-3.5 w-3.5" /></span>}
          <div className="min-w-0 flex-1 sm:flex sm:gap-3">
            <span className="block w-44 flex-none pt-0.5 text-xs font-bold text-[#8b8285]">{def.label}</span>
            <span className="block min-w-0 flex-1 text-sm">
              {valor ? (
                <>
                  {def.link ? (
                    <a href={def.link(valor)} target="_blank" rel="noopener noreferrer" className="break-words font-semibold text-[#1b1719] hover:text-[#9C1E1E]">{valor}</a>
                  ) : (
                    <span className="whitespace-pre-line break-words font-semibold text-[#1b1719]">{valor}</span>
                  )}{' '}
                  <SeloOrigem origem={origem} em={em} />
                </>
              ) : (
                <span className="text-[#b3aaad]">a preencher</span>
              )}
            </span>
          </div>
          <button disabled={disabled} onClick={() => { setV(valor); setEdit(true); }} className="flex-none rounded-lg p-1.5 text-[#c9c1c3] hover:bg-[#f8e9ec] hover:text-[#9C1E1E] disabled:opacity-40" title={valor ? 'Editar' : 'Preencher'}>
            {valor ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ cores
const USOS = ['Principal', 'Secundária', 'Destaque', 'Fundo', 'Texto'];
const CoresEditor: React.FC<{ cores: Cor[]; origem: Origem; em?: string | null; disabled?: boolean; onSave: (c: Cor[]) => Promise<void> }> = ({ cores, origem, em, disabled, onSave }) => {
  const [edit, setEdit] = useState(false);
  const [lista, setLista] = useState<Cor[]>(cores);
  const [saving, setSaving] = useState(false);
  const abrir = () => { setLista(cores.length ? cores.map((c) => ({ ...c })) : [{ hex: '#9e1b34', uso: 'Principal' }]); setEdit(true); };
  const valido = (h: string) => /^#[0-9a-f]{6}$/i.test(h);
  const salvar = async () => {
    const limpa = lista.filter((c) => valido(c.hex)).map((c) => ({ hex: c.hex.toLowerCase(), nome: c.nome?.trim() || undefined, uso: c.uso || undefined }));
    setSaving(true);
    try { await onSave(limpa); setEdit(false); toast.success('Cores salvas'); } catch (e: any) { toast.error(e.message || 'Erro ao salvar'); } finally { setSaving(false); }
  };
  return (
    <div className="pt-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[#1b1719]">Cores da marca <SeloOrigem origem={origem} em={em} /></div>
        {!edit && <button disabled={disabled} onClick={abrir} className={`${BTN_SOFT} px-3 py-1.5 text-xs`}><Pencil className="h-3 w-3" /> {cores.length ? 'Editar' : 'Adicionar'}</button>}
      </div>
      {!edit ? (
        cores.length ? (
          <div className="flex flex-wrap gap-2.5">
            {cores.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-[#f7f5f6] py-1.5 pl-1.5 pr-3">
                <span className="h-8 w-8 rounded-lg border border-black/10" style={{ background: c.hex }} />
                <span className="leading-tight">
                  <span className="block text-xs font-bold text-[#1b1719]">{c.nome || c.uso || 'Cor'}</span>
                  <span className="block font-mono text-[10.5px] uppercase text-[#8b8285]">{c.hex}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#b3aaad]">a preencher — escolha as cores da sua marca</p>
        )
      ) : (
        <div className="space-y-2">
          {lista.map((c, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#f7f5f6] p-2 sm:flex-nowrap">
              <label className="relative h-10 w-10 flex-none cursor-pointer overflow-hidden rounded-lg border border-black/10" style={{ background: valido(c.hex) ? c.hex : '#fff' }} title="Escolher cor">
                <input type="color" value={valido(c.hex) ? c.hex : '#000000'} onChange={(e) => setLista((l) => l.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              </label>
              <input value={c.hex} onChange={(e) => { const h = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`; setLista((l) => l.map((x, j) => (j === i ? { ...x, hex: h.slice(0, 7) } : x))); }} className={`${INPUT} w-24 flex-none bg-white py-2 font-mono text-xs uppercase ${valido(c.hex) ? '' : 'border-[#c2740a]'}`} />
              <input value={c.nome || ''} onChange={(e) => setLista((l) => l.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))} placeholder="Nome (ex.: Vinho)" className={`${INPUT} min-w-[120px] flex-1 bg-white py-2`} />
              <select value={c.uso || ''} onChange={(e) => setLista((l) => l.map((x, j) => (j === i ? { ...x, uso: e.target.value || undefined } : x)))} className={`${INPUT} w-32 flex-none bg-white py-2`}>
                <option value="">Uso…</option>
                {USOS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <button onClick={() => setLista((l) => l.filter((_, j) => j !== i))} className="rounded-lg p-2 text-[#b3aaad] hover:text-red-600" title="Remover cor"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {lista.length < 8 && <button onClick={() => setLista((l) => [...l, { hex: '#1a1a1a' }])} className={`${BTN_SOFT} px-3 py-1.5 text-xs`}><Plus className="h-3.5 w-3.5" /> Cor</button>}
            <button disabled={saving} onClick={salvar} className={`${BTN} px-3 py-1.5 text-xs`}>{saving ? 'Salvando…' : 'Salvar cores'}</button>
            <button onClick={() => setEdit(false)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#8b8285]">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ tipografia
const TipografiaEditor: React.FC<{
  nome: string; fontes: string[]; estilo: string; textoFicha: string; origem: Origem; em?: string | null; disabled?: boolean;
  onSave: (titulo: string, texto: string, estilo: string) => Promise<void>;
}> = ({ nome, fontes, estilo, textoFicha, origem, em, disabled, onSave }) => {
  const [edit, setEdit] = useState(false);
  const [titulo, setTitulo] = useState(fontes[0] || '');
  const [texto, setTexto] = useState(fontes[1] || '');
  const [est, setEst] = useState(estilo);
  const [saving, setSaving] = useState(false);
  const fT = edit ? titulo : fontes[0] || '';
  const fX = edit ? texto : fontes[1] || '';
  const e = edit ? est : estilo;
  useEffect(() => { if (fT) carregarFonte(fT); if (fX) carregarFonte(fX); }, [fT, fX]);
  const generica = ESTILOS.find((s) => s.id === e)?.css || 'inherit';
  const salvar = async () => {
    setSaving(true);
    try { await onSave(titulo, texto, est); setEdit(false); toast.success('Tipografia salva'); } catch (err: any) { toast.error(err.message || 'Erro ao salvar'); } finally { setSaving(false); }
  };
  const vazio = !fontes.length && !estilo && !textoFicha;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[#1b1719]"><Type className="h-4 w-4 text-[#9e1b34]" /> Tipografia & estilo <SeloOrigem origem={origem} em={em} /></div>
        {!edit && <button disabled={disabled} onClick={() => { setTitulo(fontes[0] || ''); setTexto(fontes[1] || ''); setEst(estilo); setEdit(true); }} className={`${BTN_SOFT} px-3 py-1.5 text-xs`}><Pencil className="h-3 w-3" /> {vazio ? 'Adicionar' : 'Editar'}</button>}
      </div>

      {(!vazio || edit) && (
        <div className="rounded-[13px] bg-[#f7f5f6] px-4 py-3.5">
          <div className="truncate text-2xl font-extrabold text-[#1b1719]" style={{ fontFamily: fT ? `"${fT}", ${generica}` : generica }}>{nome}</div>
          <div className="mt-1 text-[13px] text-[#554e50]" style={{ fontFamily: fX ? `"${fX}", ${generica}` : undefined }}>
            {fT || fX ? <>Títulos em <b>{fT || '—'}</b>{fX && <> · texto em <b>{fX}</b></>}</> : textoFicha || 'Defina as fontes'}
            {e && <> — estilo <b>{e.toLowerCase()}</b></>}. A Sofia aplica isso em todos os vídeos.
          </div>
        </div>
      )}
      {vazio && !edit && <p className="text-sm text-[#b3aaad]">a preencher — quais fontes e estilo a marca usa?</p>}

      {edit && (
        <div className="mt-3 space-y-3">
          <datalist id="exa-fontes">{FONTES_SUGERIDAS.map((f) => <option key={f} value={f} />)}</datalist>
          <div className="grid gap-2 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-bold text-[#554e50]">Fonte dos títulos</label><input list="exa-fontes" value={titulo} onChange={(x) => setTitulo(x.target.value)} placeholder="Ex.: Playfair Display" className={INPUT} /></div>
            <div><label className="mb-1 block text-xs font-bold text-[#554e50]">Fonte do texto</label><input list="exa-fontes" value={texto} onChange={(x) => setTexto(x.target.value)} placeholder="Ex.: Montserrat" className={INPUT} /></div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#554e50]">Estilo</label>
            <div className="flex flex-wrap gap-1.5">
              {ESTILOS.map((s) => (
                <button key={s.id} type="button" onClick={() => setEst(est === s.id ? '' : s.id)} className={`rounded-xl border px-3 py-2 text-sm ${est === s.id ? 'border-[#9C1E1E] bg-[#f8e9ec] text-[#9C1E1E]' : 'border-[#ebe6e7] bg-white text-[#554e50]'}`} style={{ fontFamily: s.css }}>
                  {s.id}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-[#8b8285]">Não sabe o nome da fonte? Escolha só o estilo — ou envie o manual da marca em PDF na biblioteca.</p>
          </div>
          <div className="flex gap-2">
            <button disabled={saving} onClick={salvar} className={`${BTN} px-3 py-1.5 text-xs`}>{saving ? 'Salvando…' : 'Salvar tipografia'}</button>
            <button onClick={() => setEdit(false)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#8b8285]">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ biblioteca
type Filtro = 'video' | 'foto' | 'pdf' | 'final';
const FILTROS: { id: Filtro; t: string; tipos: string[]; icon: React.ElementType }[] = [
  { id: 'video', t: 'Vídeos crus', tipos: ['video'], icon: Film },
  { id: 'foto', t: 'Fotos', tipos: ['foto', 'referencia', 'print'], icon: ImageIcon },
  { id: 'pdf', t: 'PDFs', tipos: ['pdf'], icon: FileText },
  { id: 'final', t: 'Feitos pela Sofia', tipos: ['video_final'], icon: Sparkles },
];
const tipoDoArquivo = (f: File): TipoArquivo | null => {
  if (f.type.startsWith('video/')) return 'video';
  if (f.type.startsWith('image/')) return 'foto';
  if (f.type === 'application/pdf') return 'pdf';
  return null;
};

const Biblioteca: React.FC<{
  marcaId: string; arquivos: MarcaArquivo[]; disabled?: boolean;
  enviarArquivo: Props['enviarArquivo']; removerArquivo: Props['removerArquivo'];
}> = ({ marcaId, arquivos, disabled, enviarArquivo, removerArquivo }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [filtro, setFiltro] = useState<Filtro>('video');
  const [fila, setFila] = useState<{ total: number; feitos: number } | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const visiveis = FILTROS.filter((f) => f.id !== 'final' || arquivos.some((a) => a.tipo === 'video_final'));
  const atual = FILTROS.find((f) => f.id === filtro)!;
  const lista = arquivos.filter((a) => atual.tipos.includes(a.tipo));
  const contagem = (f: (typeof FILTROS)[number]) => arquivos.filter((a) => f.tipos.includes(a.tipo)).length;

  const enviar = async (files: FileList | File[] | null) => {
    const todos = Array.from(files || []);
    if (!todos.length) return;
    const validos = todos.filter((f) => {
      if (!tipoDoArquivo(f)) { toast.error(`${f.name}: envie vídeo, foto ou PDF`); return false; }
      if (f.size > MAX_MB * 1024 * 1024) { toast.error(`${f.name}: máximo ${MAX_MB} MB`); return false; }
      return true;
    });
    if (!validos.length) return;
    setFila({ total: validos.length, feitos: 0 });
    let ok = 0;
    for (const f of validos) {
      try { await enviarArquivo(marcaId, tipoDoArquivo(f)!, f); ok++; } catch (e: any) { toast.error(`${f.name}: ${e.message || 'erro no envio'}`); }
      setFila((q) => (q ? { ...q, feitos: q.feitos + 1 } : q));
    }
    setFila(null);
    if (ok) {
      toast.success(ok === 1 ? 'Arquivo enviado para a biblioteca' : `${ok} arquivos enviados para a biblioteca`);
      const t = tipoDoArquivo(validos[validos.length - 1]);
      if (t === 'video' || t === 'foto' || t === 'pdf') setFiltro(t);
    }
    if (ref.current) ref.current.value = '';
  };

  return (
    <div className={`${CARD} p-4 sm:p-5`}>
      <SecTitulo icon={Film} t="Biblioteca da marca" sub="Vídeos crus, fotos e PDFs — a matéria-prima que a Sofia usa" first />

      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); if (!disabled && !fila) enviar(e.dataTransfer.files); }}
        className={`mt-3 rounded-2xl border-[1.5px] border-dashed p-4 text-center transition ${arrastando ? 'border-[#9C1E1E] bg-[#f8e9ec]' : 'border-[#ebe6e7] bg-[#f7f5f6]'}`}
      >
        {fila ? (
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#9C1E1E]">
            <Loader2 className="h-5 w-5 animate-spin" /> Enviando {Math.min(fila.feitos + 1, fila.total)} de {fila.total}…
          </div>
        ) : (
          <>
            <button disabled={disabled} onClick={() => ref.current?.click()} className={BTN}><Upload className="h-4 w-4" /> Enviar arquivos</button>
            <p className="mt-2 text-[11.5px] text-[#8b8285]">Pode selecionar vários de uma vez <span className="hidden sm:inline">ou arrastar para cá</span> · vídeos, fotos e PDF até {MAX_MB} MB</p>
          </>
        )}
        <input ref={ref} type="file" multiple accept="video/*,image/*,application/pdf" className="hidden" onChange={(e) => enviar(e.target.files)} />
      </div>

      <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl bg-[#f7f5f6] p-1">
        {visiveis.map((f) => (
          <button key={f.id} onClick={() => setFiltro(f.id)} className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-bold transition ${filtro === f.id ? 'bg-white text-[#9C1E1E] shadow-sm' : 'text-[#8b8285]'}`}>
            <f.icon className="h-3.5 w-3.5" /> {f.t} <span className="text-[11px] opacity-70">{contagem(f)}</span>
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#8b8285]">
          {filtro === 'video' ? 'Nenhum vídeo cru ainda. Grave o ambiente, os produtos, a equipe — quanto mais crus, mais a Sofia consegue variar.' : filtro === 'foto' ? 'Nenhuma foto ainda.' : filtro === 'pdf' ? 'Nenhum PDF ainda (cardápio, manual da marca, tabela de preços…).' : 'Nada por aqui ainda.'}
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {lista.map((a) => (
            <ArquivoTile key={a.id} a={a} disabled={disabled} remover={removerArquivo} />
          ))}
        </div>
      )}
    </div>
  );
};

const ArquivoTile: React.FC<{ a: MarcaArquivo; disabled?: boolean; remover: Props['removerArquivo'] }> = ({ a, disabled, remover }) => {
  const ehVideo = a.tipo === 'video' || a.tipo === 'video_final';
  const ehImg = ['foto', 'referencia', 'print', 'logo'].includes(a.tipo);
  const nome = a.legenda || ((a.meta as any)?.nome_original as string) || 'arquivo';
  return (
    <div className="group overflow-hidden rounded-[14px] border border-[#ebe6e7] bg-white">
      <div className="relative aspect-video bg-[#1b1719]">
        {ehVideo ? (
          <HoverPlayVideo url={a.url} nome={nome} />
        ) : ehImg ? (
          <a href={a.url} target="_blank" rel="noopener noreferrer"><img src={a.url} alt={nome} loading="lazy" className="absolute inset-0 h-full w-full object-cover" /></a>
        ) : (
          <a href={a.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#f7f5f6] text-[#9e1b34]">
            <FileText className="h-8 w-8" /><span className="text-[10px] font-bold uppercase">PDF</span>
          </a>
        )}
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11.5px] font-bold text-[#1b1719]" title={nome}>{nome}</div>
          <div className="text-[10px] text-[#8b8285]">{a.origem === 'portal' ? '✎ você' : a.origem === 'admin' ? 'EXA' : '✦ Sofia'} · {quando(a.created_at)}</div>
        </div>
        <a href={a.url} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-[#c9c1c3] hover:text-[#9C1E1E]" title="Abrir"><ExternalLink className="h-3.5 w-3.5" /></a>
        {a.origem === 'portal' && !disabled && (
          <button onClick={async () => { if (window.confirm('Remover este arquivo da biblioteca?')) { try { await remover(a); toast.success('Arquivo removido'); } catch (e: any) { toast.error(e.message); } } }} className="rounded p-1 text-[#c9c1c3] hover:text-red-600" title="Remover"><Trash2 className="h-3.5 w-3.5" /></button>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ resto da ficha
const MaisInformacoes: React.FC<{
  marca: Marca; campos: FichaCampo[]; disabled?: boolean; salvarCampo: Props['salvarCampo']; adicionarCampo: Props['adicionarCampo'];
}> = ({ marca, campos, disabled, salvarCampo, adicionarCampo }) => {
  const [novo, setNovo] = useState<{ campo: string; valor: string } | null>(null);
  const grupos = useMemo(() => {
    const m = new Map<string, FichaCampo[]>();
    campos.forEach((c) => {
      const k = c.categoria || 'Outros';
      m.set(k, [...(m.get(k) || []), c]);
    });
    return [...m.entries()];
  }, [campos]);

  return (
    <div className={`${CARD} p-4 sm:p-5`}>
      <SecTitulo icon={Sparkles} t="Mais informações" sub="Horários, pagamento, promoções e tudo o que a Sofia aprendeu" first />
      <div className="mt-2 space-y-4">
        {grupos.map(([cat, lista]) => (
          <div key={cat}>
            <div className="mb-0.5 text-[10.5px] font-extrabold uppercase tracking-wider text-[#8b8285]">{cat}</div>
            <div className="divide-y divide-[#f1edee]">
              {lista.map((c) => (
                <LinhaCampo
                  key={c.id}
                  def={{ key: c.id, label: c.campo + (c.obrigatorio && !c.valor ? ' *' : ''), ficha: c.campo, categoria: c.categoria || 'Outros', multiline: true }}
                  valor={c.valor || ''}
                  origem={c.valor ? ((c.origem as Origem) || 'sofia') : null}
                  em={c.updated_at}
                  disabled={disabled}
                  onSave={(v) => salvarCampo(c.id, v)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {novo ? (
        <div className="mt-3 space-y-2 rounded-xl bg-[#f7f5f6] p-3">
          <input value={novo.campo} onChange={(e) => setNovo({ ...novo, campo: e.target.value })} placeholder="Nome da informação (ex.: Estacionamento)" className={`${INPUT} bg-white`} />
          <textarea value={novo.valor} onChange={(e) => setNovo({ ...novo, valor: e.target.value })} placeholder="O que a Sofia precisa saber" rows={2} className={`${INPUT} bg-white`} />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!novo.campo.trim()) return;
                try { await adicionarCampo(marca.id, novo.campo, novo.valor); setNovo(null); toast.success('Informação adicionada'); } catch (e: any) { toast.error(e.message?.includes('duplicate') ? 'Essa informação já existe na ficha' : e.message); }
              }}
              className={`${BTN} px-3 py-1.5 text-xs`}
            >Adicionar</button>
            <button onClick={() => setNovo(null)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#8b8285]">Cancelar</button>
          </div>
        </div>
      ) : (
        <button disabled={disabled} onClick={() => setNovo({ campo: '', valor: '' })} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#9C1E1E] disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Adicionar outra informação</button>
      )}
    </div>
  );
};
