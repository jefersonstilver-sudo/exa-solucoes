// EXA (05/11/2026) — Contrato do prédio (admin › Prédios › Ver › Contrato).
// Mostra o contrato assinado (o mesmo do Painel do Síndico), o histórico, os pedidos e permite:
//  - anexar um PDF assinado; - pedir o contrato pelo Nando (ClickSign), com prévia do PDF antes de confirmar.
// Tudo passa pela função exa2-contratos-predio (só admin). Fora do horário (dia útil 9h–18h) o envio fica para as 9h.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  FileText, FileX2, Eye, Download, Upload, Send, Loader2, ShieldCheck, Clock, History, AlertTriangle,
  UserCheck, XCircle, RefreshCw, CheckCircle2,
} from 'lucide-react';

type Dados = {
  condominio_nome: string; condominio_cnpj: string; condominio_endereco: string;
  signatario_nome: string; signatario_email: string; signatario_telefone: string; signatario_cargo: string; qtd_paineis: number;
};
type Info = {
  ok: boolean; erro?: string;
  predio: { id: string; nome: string; sindico?: string; vice?: string; contato?: string };
  contratos: any[]; pedidos: any[]; sugestao: Dados;
  mesmo_sindico: { nome: string; email?: string; predios: string[] }[];
  envio: { quando: string; texto: string };
};

async function chamar(acao: string, body: Record<string, unknown> = {}): Promise<any> {
  const { data, error } = await supabase.functions.invoke('exa2-contratos-predio', { body: { acao, ...body } });
  if (!error) return data;
  try { const r = (error as any).context; if (r?.json) return await r.json(); } catch { /* */ }
  return { ok: false, erro: 'Sem conexão com o servidor.' };
}

const dataBR = (d?: string | null, hora = false) => d ? new Date(d).toLocaleString('pt-BR', hora
  ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  : { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const STATUS: Record<string, { rotulo: string; cor: string }> = {
  aguardando_dados: { rotulo: 'Síndico pediu – confirme os dados', cor: 'bg-amber-100 text-amber-800 border-amber-200' },
  agendado: { rotulo: 'Agendado', cor: 'bg-blue-100 text-blue-800 border-blue-200' },
  enviando: { rotulo: 'Enviando…', cor: 'bg-blue-100 text-blue-800 border-blue-200' },
  enviado: { rotulo: 'Aguardando assinatura', cor: 'bg-violet-100 text-violet-800 border-violet-200' },
  assinado: { rotulo: 'Assinado', cor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelado: { rotulo: 'Cancelado', cor: 'bg-gray-100 text-gray-600 border-gray-200' },
  erro: { rotulo: 'Com problema', cor: 'bg-red-100 text-red-700 border-red-200' },
};

function mascaraCnpj(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}

// ------------------------------------------------------------------ pedir contrato
function PedirContrato({ info, aberto, aoFechar, aoPedir }: { info: Info; aberto: boolean; aoFechar: () => void; aoPedir: () => void }) {
  const [d, setD] = useState<Dados>(info.sugestao);
  const [previa, setPrevia] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<'' | 'previa' | 'pedir'>('');
  const [erro, setErro] = useState('');
  useEffect(() => { if (aberto) { setD(info.sugestao); setPrevia(null); setErro(''); } }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (previa) URL.revokeObjectURL(previa); }, [previa]);
  const mudar = (k: keyof Dados, v: string | number) => { setD((x) => ({ ...x, [k]: v })); setPrevia(null); };

  const verPrevia = async () => {
    setErro(''); setCarregando('previa');
    const r = await chamar('previa', { building_id: info.predio.id, dados: d });
    setCarregando('');
    if (!r?.ok) return setErro(r?.erro || 'Não consegui gerar a prévia.');
    const bytes = Uint8Array.from(atob(r.pdf_base64), (c) => c.charCodeAt(0));
    setPrevia(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })));
  };
  const pedir = async () => {
    setErro(''); setCarregando('pedir');
    const r = await chamar('solicitar', { building_id: info.predio.id, dados: d });
    setCarregando('');
    if (!r?.ok) return setErro(r?.erro || 'Não consegui registrar o pedido.');
    if (r.enviado) toast.success('Contrato enviado pela ClickSign. O Nando avisou no WhatsApp.');
    else if (r.erro_envio) toast.error(`Pedido salvo, mas o envio falhou: ${r.erro_envio}`);
    else toast.success(`Pedido agendado: o Nando envia ${r.quando}.`);
    aoPedir();
  };

  const ms = info.mesmo_sindico || [];
  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-[#9C1E1E]" /> Pedir contrato pelo Nando</DialogTitle>
          <DialogDescription>
            Confira os dados. O Nando gera o contrato no modelo oficial da EXA, envia pela ClickSign para quem assina e avisa no WhatsApp.
            Quando todos assinarem, o PDF entra aqui e no Painel do Síndico sozinho.
          </DialogDescription>
        </DialogHeader>

        {ms.length > 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-emerald-800"><UserCheck className="h-4 w-4" /> Mesmo síndico de outros prédios</div>
            <div className="mt-1.5 space-y-1">
              {ms.map((m) => (
                <div key={m.nome} className="flex flex-wrap items-center justify-between gap-2 text-emerald-900">
                  <span><b>{m.nome}</b>{m.email ? ` · ${m.email}` : ''} <span className="text-emerald-700">— assinou {m.predios.join(', ')}</span></span>
                  <Button type="button" size="sm" variant="outline" className="h-7 border-emerald-300 bg-white"
                    onClick={() => { mudar('signatario_nome', m.nome); if (m.email) mudar('signatario_email', m.email); }}>Usar estes dados</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condomínio</div>
          <div className="sm:col-span-2">
            <Label>Nome do condomínio (como no CNPJ)</Label>
            <Input value={d.condominio_nome} onChange={(e) => mudar('condominio_nome', e.target.value)} placeholder="Condomínio Edifício …" />
          </div>
          <div>
            <Label>CNPJ do condomínio</Label>
            <Input value={d.condominio_cnpj} onChange={(e) => mudar('condominio_cnpj', mascaraCnpj(e.target.value))} placeholder="00.000.000/0000-00" inputMode="numeric" />
          </div>
          <div>
            <Label>Painéis no prédio</Label>
            <Input type="number" min={1} max={10} value={d.qtd_paineis} onChange={(e) => mudar('qtd_paineis', Number(e.target.value) || 1)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Endereço completo (rua, nº, bairro, cidade, CEP)</Label>
            <Input value={d.condominio_endereco} onChange={(e) => mudar('condominio_endereco', e.target.value)} />
          </div>

          <div className="sm:col-span-2 mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quem assina pelo condomínio</div>
          <div>
            <Label>Nome completo</Label>
            <Input value={d.signatario_nome} onChange={(e) => mudar('signatario_nome', e.target.value)} />
          </div>
          <div>
            <Label>Cargo</Label>
            <select value={d.signatario_cargo} onChange={(e) => mudar('signatario_cargo', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {['Síndico(a)', 'Síndica', 'Síndico', 'Síndica profissional', 'Síndico profissional'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>E-mail (recebe a ClickSign)</Label>
            <Input type="email" value={d.signatario_email} onChange={(e) => mudar('signatario_email', e.target.value)} />
          </div>
          <div>
            <Label>WhatsApp (o Nando avisa)</Label>
            <Input value={d.signatario_telefone} onChange={(e) => mudar('signatario_telefone', e.target.value.replace(/[^\d+() -]/g, ''))} placeholder="45 99999-9999" />
          </div>
        </div>

        {previa && (
          <div className="overflow-hidden rounded-lg border">
            <iframe title="Prévia do contrato" src={previa} className="h-[60vh] w-full" />
          </div>
        )}
        {erro && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {erro}</div>}

        <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-sm">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>Envio: <b>{info.envio.texto === 'agora' ? 'agora mesmo' : info.envio.texto}</b> <span className="text-muted-foreground">(dias úteis das 9h às 18h; fora disso, no próximo dia útil às 9h)</span></span>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={verPrevia} disabled={!!carregando}>
            {carregando === 'previa' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />} {previa ? 'Atualizar prévia' : 'Ver prévia do contrato'}
          </Button>
          <Button type="button" onClick={pedir} disabled={!!carregando || !previa} className="bg-[#9C1E1E] hover:bg-[#7d1818]" title={!previa ? 'Veja a prévia antes de pedir' : ''}>
            {carregando === 'pedir' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Confirmar e pedir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------ anexar PDF
function AnexarContrato({ predioId, nome, aberto, aoFechar, aoAnexar }: { predioId: string; nome: string; aberto: boolean; aoFechar: () => void; aoAnexar: () => void }) {
  const [arq, setArq] = useState<File | null>(null);
  const [titulo, setTitulo] = useState('');
  const [assinante, setAssinante] = useState('');
  const [data, setData] = useState('');
  const [salvando, setSalvando] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (aberto) { setArq(null); setTitulo(`Contrato ${nome}`); setAssinante(''); setData(''); } }, [aberto, nome]);
  const salvar = async () => {
    if (!arq) return toast.error('Escolha o PDF do contrato assinado.');
    if (arq.type !== 'application/pdf') return toast.error('O arquivo precisa ser PDF.');
    if (arq.size > 15 * 1024 * 1024) return toast.error('PDF maior que 15 MB.');
    setSalvando(true);
    const b64 = await new Promise<string>((ok, nao) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = nao; r.readAsDataURL(arq); });
    const r = await chamar('anexar', { building_id: predioId, titulo, assinante_nome: assinante, assinado_em: data || null, pdf_base64: b64 });
    setSalvando(false);
    if (!r?.ok) return toast.error(r?.erro || 'Não consegui anexar.');
    toast.success('Contrato anexado. Já aparece no Painel do Síndico.');
    aoAnexar();
  };
  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-[#9C1E1E]" /> Anexar contrato assinado</DialogTitle>
          <DialogDescription>O PDF passa a ser o contrato do prédio (o anterior fica no histórico) e aparece no Painel do Síndico.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <button type="button" onClick={() => ref.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground hover:bg-muted/50">
            <FileText className="h-5 w-5" /> {arq ? <b className="text-foreground">{arq.name}</b> : 'Escolher PDF'}
          </button>
          <input ref={ref} type="file" accept="application/pdf" className="hidden" onChange={(e) => setArq(e.target.files?.[0] || null)} />
          <div><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Assinado por</Label><Input value={assinante} onChange={(e) => setAssinante(e.target.value)} placeholder="Nome do síndico" /></div>
            <div><Label>Data da assinatura</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar} disabled={salvando}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando || !arq} className="bg-[#9C1E1E] hover:bg-[#7d1818]">
            {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Anexar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------ assinatura automática da EXA
// O Jeferson digita os próprios dados uma vez; a ClickSign manda o termo para ele e para o admin da conta assinarem.
// Depois disso a EXA assina sozinha todos os contratos dos prédios (CPF + nascimento + e-mail têm de bater com o termo).
function AssinaturaAutomatica() {
  const [st, setSt] = useState<any>(null);
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState({ nome: '', email: '', cpf: '', nascimento: '', admin_email: '' });
  const [salvando, setSalvando] = useState(false);
  const carregar = useCallback(async () => { const r = await chamar('auto_status'); if (r?.ok) setSt(r); }, []);
  useEffect(() => { carregar(); }, [carregar]);
  const abrir = () => { setF({ nome: st?.auto?.nome || st?.padrao?.nome || '', email: st?.auto?.email || st?.padrao?.email || '', cpf: '', nascimento: '', admin_email: st?.auto?.admin_email || st?.padrao?.admin_email || '' }); setAberto(true); };
  const salvar = async () => {
    setSalvando(true);
    const r = await chamar('auto_ativar', f);
    setSalvando(false);
    if (!r?.ok) return toast.error(r?.erro || 'Não deu certo.');
    toast.success(r.ja_existia ? 'O termo já existia na ClickSign. Confira se você e o admin assinaram.' : 'Termo pedido! Assine o e-mail da ClickSign (você e o admin da conta).');
    setF((x) => ({ ...x, cpf: '' })); setAberto(false); carregar();
  };
  const a = st?.auto;
  const cpfMask = (v: string) => v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return (
    <Card className={a?.status === 'ativo' ? 'border-emerald-200' : 'border-dashed'}>
      <CardContent className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className={`mt-0.5 h-5 w-5 shrink-0 ${a?.status === 'ativo' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
          <div>
            <div className="font-semibold">Assinatura automática da EXA {a?.status === 'ativo' ? <Badge className="ml-1 border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Ligada</Badge> : a ? <Badge className="ml-1 border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">Termo pedido</Badge> : <Badge variant="outline" className="ml-1">Desligada</Badge>}</div>
            <div className="text-muted-foreground">
              {a?.status === 'ativo' ? <>A EXA assina sozinha como <b>{a.nome}</b> ({a.email}, CPF final {a.cpf_final}). Vale para todos os contratos dos prédios.</>
                : a ? <>Termo pedido para <b>{a.nome}</b>. Assine o e-mail da ClickSign (você e o admin {a.admin_email}). No próximo contrato o sistema confere e liga sozinho.{a.erro ? <span className="block text-red-600">Última tentativa: {a.erro}</span> : null}</>
                : 'Hoje você assina cada contrato pelo e-mail. Ligue para a EXA assinar sozinha e não deixar contrato vencer.'}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={a ? 'outline' : 'default'} className={a ? '' : 'bg-[#9C1E1E] hover:bg-[#7d1818]'} onClick={abrir}>{a ? 'Refazer termo' : 'Ligar'}</Button>
          {a && <Button size="sm" variant="ghost" className="text-red-700" onClick={async () => { if (window.confirm('Desligar a assinatura automática? A EXA volta a assinar pelo e-mail.')) { await chamar('auto_desligar'); carregar(); } }}>Desligar</Button>}
        </div>
      </CardContent>
      <Dialog open={aberto} onOpenChange={(v) => !v && setAberto(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ligar a assinatura automática da EXA</DialogTitle>
            <DialogDescription>
              A ClickSign gera um termo de assinatura automática. Ele precisa ser assinado por você (o signatário) e por um administrador da conta ClickSign.
              Os dados precisam ser iguais aos do seu cadastro: a ClickSign confere CPF, nascimento e e-mail. Ficam guardados só no servidor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div><Label>Nome completo</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
            <div><Label>E-mail de quem assina pela EXA</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>CPF</Label><Input value={f.cpf} onChange={(e) => setF({ ...f, cpf: cpfMask(e.target.value) })} inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" /></div>
              <div><Label>Data de nascimento</Label><Input type="date" value={f.nascimento} onChange={(e) => setF({ ...f, nascimento: e.target.value })} /></div>
            </div>
            <div><Label>E-mail do administrador da conta ClickSign</Label><Input type="email" value={f.admin_email} onChange={(e) => setF({ ...f, admin_email: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)} disabled={salvando}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando} className="bg-[#9C1E1E] hover:bg-[#7d1818]">{salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Pedir termo à ClickSign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ------------------------------------------------------------------ aba
const BuildingContratoTab: React.FC<{ buildingId: string; buildingName?: string }> = ({ buildingId, buildingName }) => {
  const [info, setInfo] = useState<Info | null>(null);
  const [erro, setErro] = useState('');
  const [pedir, setPedir] = useState(false);
  const [anexar, setAnexar] = useState(false);
  const [ocupado, setOcupado] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    const r = await chamar('listar', { building_id: buildingId });
    if (!r?.ok) { setErro(r?.erro || 'Não consegui carregar o contrato.'); return; }
    setInfo(r);
  }, [buildingId]);
  useEffect(() => { setInfo(null); carregar(); }, [carregar]);

  const acao = async (nomeAcao: string, body: Record<string, unknown>, ok: string) => {
    setOcupado(nomeAcao + String(body.pedido_id || body.contrato_id || ''));
    const r = await chamar(nomeAcao, body);
    setOcupado('');
    if (!r?.ok) return toast.error(r?.erro || 'Não deu certo.');
    if (r.aviso) toast.warning(r.aviso); else toast.success(ok);
    carregar();
  };

  if (erro) return <Card><CardContent className="flex items-center justify-between gap-3 p-6 text-sm text-red-700"><span>{erro}</span><Button variant="outline" size="sm" onClick={carregar}><RefreshCw className="mr-2 h-4 w-4" /> Tentar de novo</Button></CardContent></Card>;
  if (!info) return <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando contrato…</div>;

  const atual = info.contratos.find((c) => c.ativo);
  const antigos = info.contratos.filter((c) => !c.ativo);
  const aberto = info.pedidos.find((p) => ['aguardando_dados', 'agendado', 'enviando', 'enviado'].includes(p.status));
  const ultimosPedidos = info.pedidos.filter((p) => p !== aberto).slice(0, 5);

  return (
    <div className="space-y-6">
      <Card className={atual ? 'border-emerald-200' : 'border-amber-200'}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Contrato do prédio</span>
            {atual
              ? <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Assinado · no Painel do Síndico</Badge>
              : <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100">Contrato indisponível</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {atual ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><FileText className="h-5 w-5" /></div>
                <div>
                  <div className="font-semibold">{atual.titulo}</div>
                  <div className="text-sm text-muted-foreground">
                    {atual.assinado_em ? <>Assinado em {dataBR(atual.assinado_em)}</> : 'Data da assinatura não informada'}
                    {atual.assinante_nome ? <> · por <b className="text-foreground">{atual.assinante_nome}</b></> : null}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{atual.clicksign_envelope_id ? 'Vindo da ClickSign' : 'Anexado manualmente'} · {String(atual.criado_por || '').replace(/@.*/, '')}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {atual.ver && <Button asChild variant="outline" size="sm"><a href={atual.ver} target="_blank" rel="noopener noreferrer"><Eye className="mr-2 h-4 w-4" /> Ver</a></Button>}
                {atual.baixar && <Button asChild variant="outline" size="sm"><a href={atual.baixar}><Download className="mr-2 h-4 w-4" /> Baixar</a></Button>}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <FileX2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <span>Este prédio ainda não tem contrato no sistema. O síndico vê "Contrato indisponível" no painel. Anexe o PDF assinado ou peça o contrato pelo Nando.</span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
            <Button onClick={() => setPedir(true)} disabled={aberto && ['enviando', 'enviado'].includes(aberto.status)} className="bg-[#9C1E1E] hover:bg-[#7d1818]">
              <Send className="mr-2 h-4 w-4" /> {atual ? 'Pedir novo contrato' : 'Pedir contrato pelo Nando'}
            </Button>
            <Button variant="outline" onClick={() => setAnexar(true)}><Upload className="mr-2 h-4 w-4" /> Anexar PDF assinado</Button>
          </div>
        </CardContent>
      </Card>

      {aberto && (
        <Card className="border-violet-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span className="flex items-center gap-2"><Clock className="h-5 w-5" /> Pedido em andamento</span>
              <Badge variant="outline" className={STATUS[aberto.status]?.cor}>{STATUS[aberto.status]?.rotulo || aberto.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {aberto.status === 'aguardando_dados' && (
              <p><b>{aberto.pedido_por_nome || 'O síndico'}</b> pediu o contrato pelo Painel do Síndico em {dataBR(aberto.criado_em, true)}. Confirme os dados e toque em <b>Pedir contrato pelo Nando</b>.</p>
            )}
            {aberto.status === 'agendado' && <p>O Nando envia em <b>{dataBR(aberto.agendado_para, true)}</b> para <b>{aberto.signatario_nome}</b> ({aberto.signatario_email}).</p>}
            {aberto.status === 'enviado' && <p>Enviado pela ClickSign em <b>{dataBR(aberto.enviado_em, true)}</b> para <b>{aberto.signatario_nome}</b> ({aberto.signatario_email}). A cada 5 minutos o Nando confere; quando assinar, o PDF entra aqui sozinho.</p>}
            <div className="flex flex-wrap gap-2">
              {aberto.status === 'agendado' && (
                <Button size="sm" variant="outline" disabled={!!ocupado} onClick={() => acao('enviar_agora', { pedido_id: aberto.id }, 'Contrato enviado agora.')}>
                  {ocupado.startsWith('enviar_agora') ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Enviar agora
                </Button>
              )}
              <Button size="sm" variant="outline" className="text-red-700" disabled={!!ocupado}
                onClick={() => { if (window.confirm(aberto.status === 'enviado' ? 'Cancelar o envelope na ClickSign? O síndico não poderá mais assinar este.' : 'Cancelar este pedido?')) acao('cancelar', { pedido_id: aberto.id }, 'Pedido cancelado.'); }}>
                <XCircle className="mr-2 h-4 w-4" /> Cancelar pedido
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(antigos.length > 0 || ultimosPedidos.length > 0) && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><History className="h-5 w-5" /> Histórico</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {antigos.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div><div className="font-medium">{c.titulo}</div><div className="text-xs text-muted-foreground">{c.assinado_em ? `Assinado em ${dataBR(c.assinado_em)}` : 'Sem data'}{c.assinante_nome ? ` · ${c.assinante_nome}` : ''} · substituído</div></div>
                {c.ver && <Button asChild variant="ghost" size="sm"><a href={c.ver} target="_blank" rel="noopener noreferrer"><Eye className="mr-2 h-4 w-4" /> Ver</a></Button>}
              </div>
            ))}
            {ultimosPedidos.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <div className="font-medium">Pedido de {dataBR(p.criado_em, true)} {p.signatario_nome ? `· ${p.signatario_nome}` : ''}</div>
                  {p.erro && <div className="text-xs text-red-600">{p.erro}</div>}
                </div>
                <Badge variant="outline" className={STATUS[p.status]?.cor}>{p.status === 'assinado' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : null}{STATUS[p.status]?.rotulo || p.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AssinaturaAutomatica />

      <PedirContrato info={info} aberto={pedir} aoFechar={() => setPedir(false)} aoPedir={() => { setPedir(false); carregar(); }} />
      <AnexarContrato predioId={buildingId} nome={info.predio.nome || buildingName || ''} aberto={anexar} aoFechar={() => setAnexar(false)} aoAnexar={() => { setAnexar(false); carregar(); }} />
    </div>
  );
};

export default BuildingContratoTab;
