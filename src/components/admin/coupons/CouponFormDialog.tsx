import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Wand2, Copy, Ticket, Percent, MonitorPlay, Building2, ShieldCheck, Sparkles, Search, Check, X, Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Coupon, CreateCouponData, CouponProductType, CouponBuildingMode, CouponOutsideRule, CouponDiscountType,
} from '@/types/coupon';
import { cn } from '@/lib/utils';

interface CouponFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCouponData) => Promise<boolean>;
  onGenerateCode: (prefix?: string) => Promise<string>;
  editingCoupon?: Coupon | null;
  getCouponBuildings?: (id: string) => Promise<string[]>;
}

interface BuildingOption { id: string; nome: string; bairro: string | null; status: string | null }

type Categoria = CreateCouponData['categoria'];

const EMPTY: CreateCouponData = {
  codigo: '',
  desconto_percentual: 10,
  max_usos: 100,
  min_meses: 1,
  descricao: '',
  tipo_desconto: 'percentual',
  valor_minimo_pedido: 0,
  uso_por_usuario: undefined,
  categoria: 'geral',
  ativo: true,
  min_predios: undefined,
  max_predios: undefined,
  expira_em: '',
  data_inicio: '',
  tipo_produto: 'ambos',
  modo_predios: 'todos',
  predios_fora_da_lista: 'recusar',
  predio_ids: [],
};

const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v?: string | null) => (v ? new Date(v).toISOString() : null);
const brl = (v: number) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Section: React.FC<{ icon: React.ElementType; title: string; hint?: string; children: React.ReactNode }> = ({ icon: Icon, title, hint, children }) => (
  <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 shadow-sm">
    <header className="flex items-start gap-3 mb-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </header>
    {children}
  </section>
);

const Choice: React.FC<{ active: boolean; onClick: () => void; title: string; desc?: string }> = ({ active, onClick, title, desc }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'text-left rounded-xl border px-4 py-3 transition-all',
      active ? 'border-primary bg-primary/10 ring-2 ring-primary/30' : 'border-border/60 bg-background/50 hover:border-primary/40'
    )}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-medium text-foreground">{title}</span>
      {active && <Check className="h-4 w-4 text-primary" />}
    </div>
    {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
  </button>
);

const numOrUndef = (v: string) => (v === '' ? undefined : Number(v));

const CouponFormDialog: React.FC<CouponFormDialogProps> = ({
  isOpen, onClose, onSubmit, onGenerateCode, editingCoupon, getCouponBuildings,
}) => {
  const [form, setForm] = useState<CreateCouponData>(EMPTY);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [search, setSearch] = useState('');
  const [onlySelected, setOnlySelected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CreateCouponData>(k: K, v: CreateCouponData[K]) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSearch('');
    setOnlySelected(false);
    if (editingCoupon) {
      setForm({
        ...EMPTY,
        codigo: editingCoupon.codigo,
        desconto_percentual: Number(editingCoupon.desconto_percentual) || 0,
        max_usos: editingCoupon.max_usos,
        min_meses: editingCoupon.min_meses || 1,
        expira_em: toLocalInput(editingCoupon.expira_em),
        data_inicio: toLocalInput(editingCoupon.data_inicio),
        descricao: editingCoupon.descricao || '',
        tipo_desconto: editingCoupon.tipo_desconto,
        valor_minimo_pedido: editingCoupon.valor_minimo_pedido || 0,
        uso_por_usuario: editingCoupon.uso_por_usuario || undefined,
        categoria: editingCoupon.categoria,
        ativo: editingCoupon.ativo,
        min_predios: editingCoupon.min_predios || undefined,
        max_predios: editingCoupon.max_predios || undefined,
        tipo_produto: editingCoupon.tipo_produto || 'ambos',
        modo_predios: editingCoupon.modo_predios || 'todos',
        predios_fora_da_lista: editingCoupon.predios_fora_da_lista || 'recusar',
        predio_ids: [],
      });
      getCouponBuildings?.(editingCoupon.id).then(ids => setForm(p => ({ ...p, predio_ids: ids })));
    } else {
      setForm(EMPTY);
    }
  }, [editingCoupon, isOpen, getCouponBuildings]);

  useEffect(() => {
    if (!isOpen || buildings.length > 0) return;
    setLoadingBuildings(true);
    (supabase as any)
      .from('buildings')
      .select('id, nome, bairro, status')
      .order('nome', { ascending: true })
      .then(({ data }: any) => setBuildings(data || []))
      .finally(() => setLoadingBuildings(false));
  }, [isOpen, buildings.length]);

  const selected = useMemo(() => new Set(form.predio_ids || []), [form.predio_ids]);
  const visibleBuildings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return buildings.filter(b =>
      (!onlySelected || selected.has(b.id)) &&
      (!q || b.nome?.toLowerCase().includes(q) || (b.bairro || '').toLowerCase().includes(q))
    );
  }, [buildings, search, onlySelected, selected]);

  const toggleBuilding = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    set('predio_ids', Array.from(next));
  };
  const selectVisible = () => set('predio_ids', Array.from(new Set([...(form.predio_ids || []), ...visibleBuildings.map(b => b.id)])));
  const clearSelection = () => set('predio_ids', []);

  const usesList = form.modo_predios === 'especificos' || form.modo_predios === 'combinado';
  const usesQty = form.modo_predios === 'quantidade' || form.modo_predios === 'combinado';
  const isMoney = form.tipo_desconto !== 'percentual';

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const prefix = form.categoria === 'primeiro_pedido' ? 'WELCOME'
        : form.categoria === 'fidelidade' ? 'VIP'
        : form.categoria === 'especial' ? 'EVENT'
        : form.categoria === 'cortesia' ? 'CORTESIA' : 'EXA';
      set('codigo', await onGenerateCode(prefix));
    } finally {
      setIsGenerating(false);
    }
  };

  const validate = (): string | null => {
    if (!form.codigo.trim()) return 'Informe o código do cupom.';
    if (form.desconto_percentual < 0) return 'O valor do desconto não pode ser negativo.';
    if (form.tipo_desconto === 'percentual' && (form.desconto_percentual <= 0 || form.desconto_percentual > 100)) return 'O percentual deve ficar entre 0,01 e 100.';
    if (!form.max_usos || form.max_usos < 1) return 'Máximo de usos deve ser ao menos 1.';
    if (form.min_predios && form.max_predios && form.max_predios < form.min_predios) return 'O máximo de prédios não pode ser menor que o mínimo.';
    if (usesQty && !form.max_predios) return 'Informe quantos prédios o cliente pode escolher.';
    if (usesList && (form.predio_ids?.length || 0) === 0) return 'Escolha ao menos um prédio.';
    if (form.modo_predios === 'combinado' && form.max_predios && form.max_predios > (form.predio_ids?.length || 0)) return 'A quantidade máxima não pode passar do número de prédios escolhidos.';
    if (form.data_inicio && form.expira_em && new Date(form.expira_em) <= new Date(form.data_inicio)) return 'A expiração precisa ser depois do início.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    setError(err);
    if (err) return;
    setIsSubmitting(true);
    try {
      const payload: CreateCouponData = {
        ...form,
        codigo: form.codigo.trim().toUpperCase(),
        expira_em: fromLocalInput(form.expira_em) as any,
        data_inicio: fromLocalInput(form.data_inicio),
        min_predios: form.min_predios || (null as any),
        max_predios: form.max_predios || (null as any),
        uso_por_usuario: form.uso_por_usuario || (null as any),
        predio_ids: usesList ? form.predio_ids : [],
      };
      if (await onSubmit(payload)) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resumo ao vivo
  const discountLabel =
    form.tipo_desconto === 'percentual' ? `${form.desconto_percentual}% de desconto`
    : form.tipo_desconto === 'valor_fixo' ? `${brl(form.desconto_percentual)} de desconto`
    : form.tipo_desconto === 'preco_final' ? `Preço final de ${brl(form.desconto_percentual)}`
    : `${brl(form.desconto_percentual)} por mês`;
  const productLabel = form.tipo_produto === 'ambos' ? 'Horizontal e Vertical Premium' : form.tipo_produto === 'horizontal' ? 'Somente Horizontal' : 'Somente Vertical Premium';
  const qtyLabel = form.min_predios && form.max_predios ? `de ${form.min_predios} a ${form.max_predios} prédios`
    : form.max_predios ? `até ${form.max_predios} prédios`
    : form.min_predios ? `a partir de ${form.min_predios} prédios` : '';
  const buildingsLabel =
    form.modo_predios === 'todos' ? `Todos os prédios${qtyLabel ? ` · ${qtyLabel}` : ''}`
    : form.modo_predios === 'quantidade' ? `Cliente escolhe ${qtyLabel || 'os prédios'}`
    : form.modo_predios === 'especificos' ? `${selected.size} prédio(s) específico(s)${qtyLabel ? ` · ${qtyLabel}` : ''}`
    : `Cliente escolhe ${qtyLabel} entre ${selected.size} prédio(s)`;
  const outsideLabel = usesList ? (form.predios_fora_da_lista === 'recusar' ? 'Outros prédios no pedido: cupom recusado' : 'Outros prédios no pedido: desconto só nos prédios da lista') : null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[min(1240px,96vw)] w-[96vw] h-[100dvh] sm:h-[92vh] p-0 gap-0 overflow-hidden border-border/60 bg-background/80 backdrop-blur-2xl shadow-2xl sm:rounded-3xl flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border/60 bg-card/40">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <Ticket className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-semibold">{editingCoupon ? 'Editar cupom' : 'Novo cupom'}</DialogTitle>
                <DialogDescription className="text-xs">Cada regra abaixo é conferida no servidor antes de qualquer cobrança.</DialogDescription>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Switch checked={form.ativo} onCheckedChange={(v) => set('ativo', v)} />
              {form.ativo ? 'Ativo' : 'Inativo'}
            </label>
          </div>

          {/* Corpo */}
          <div className="flex-1 min-h-0 grid lg:grid-cols-[1fr_340px]">
            <div className="min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">
              <div className="grid gap-5 xl:grid-cols-2">
                <Section icon={Ticket} title="Identificação">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código</Label>
                      <div className="flex gap-2">
                        <Input id="codigo" value={form.codigo} onChange={(e) => set('codigo', e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="EX: EXA2026" className="uppercase font-mono tracking-wider" required />
                        <Button type="button" variant="outline" size="icon" onClick={handleGenerateCode} disabled={isGenerating} title="Gerar código">
                          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        </Button>
                        {form.codigo && (
                          <Button type="button" variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(form.codigo)} title="Copiar">
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={form.categoria} onValueChange={(v) => set('categoria', v as Categoria)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="geral">Geral</SelectItem>
                          <SelectItem value="primeiro_pedido">Primeiro pedido</SelectItem>
                          <SelectItem value="fidelidade">Fidelidade</SelectItem>
                          <SelectItem value="especial">Especial</SelectItem>
                          <SelectItem value="parceiro">Parceiro</SelectItem>
                          <SelectItem value="promocional">Promocional</SelectItem>
                          <SelectItem value="cortesia">Cortesia (Super Admin)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição (opcional)</Label>
                      <Textarea id="descricao" rows={2} value={form.descricao || ''} onChange={(e) => set('descricao', e.target.value)} placeholder="Uso interno: para quem e por quê" />
                    </div>
                  </div>
                </Section>

                <Section icon={Percent} title="Desconto">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ['percentual', 'Percentual', '% sobre o pedido'],
                        ['valor_fixo', 'Valor fixo', 'R$ a menos'],
                        ['preco_final', 'Preço final', 'Total exato'],
                        ['mensal_fixo', 'Valor por mês', 'R$ × meses'],
                      ] as [CouponDiscountType, string, string][]).map(([v, t, d]) => (
                        <Choice key={v} active={form.tipo_desconto === v} onClick={() => set('tipo_desconto', v)} title={t} desc={d} />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor">{isMoney ? 'Valor (R$)' : 'Percentual (%)'}</Label>
                      <Input id="valor" type="number" inputMode="decimal" step="0.01" min="0" max={isMoney ? undefined : 100}
                        value={form.desconto_percentual}
                        onChange={(e) => set('desconto_percentual', e.target.value === '' ? 0 : Number(e.target.value))} required />
                    </div>
                  </div>
                </Section>
              </div>

              <Section icon={MonitorPlay} title="Produto" hint="Em qual formato de anúncio o cupom pode ser usado.">
                <div className="grid gap-2 sm:grid-cols-3">
                  {([
                    ['ambos', 'Ambos', 'Horizontal e Vertical Premium'],
                    ['horizontal', 'Horizontal', 'Somente vídeos horizontais'],
                    ['vertical_premium', 'Vertical Premium', 'Somente vídeos verticais'],
                  ] as [CouponProductType, string, string][]).map(([v, t, d]) => (
                    <Choice key={v} active={form.tipo_produto === v} onClick={() => set('tipo_produto', v)} title={t} desc={d} />
                  ))}
                </div>
              </Section>

              <Section icon={Building2} title="Prédios" hint="Defina onde o cupom vale e quantos prédios o cliente pode escolher.">
                <div className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {([
                      ['todos', 'Todos os prédios', 'Vale em qualquer prédio'],
                      ['especificos', 'Prédios específicos', 'Só os que você marcar'],
                      ['quantidade', 'Quantidade livre', 'Cliente escolhe quais'],
                      ['combinado', 'Escolha na lista', 'Cliente escolhe X entre os marcados'],
                    ] as [CouponBuildingMode, string, string][]).map(([v, t, d]) => (
                      <Choice key={v} active={form.modo_predios === v} onClick={() => set('modo_predios', v)} title={t} desc={d} />
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="minp">Mínimo de prédios {usesQty ? '' : '(opcional)'}</Label>
                      <Input id="minp" type="number" min="1" value={form.min_predios ?? ''} placeholder="Sem mínimo" onChange={(e) => set('min_predios', numOrUndef(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxp">Máximo de prédios {usesQty ? '*' : '(opcional)'}</Label>
                      <Input id="maxp" type="number" min="1" value={form.max_predios ?? ''} placeholder={usesQty ? 'Obrigatório' : 'Sem máximo'} onChange={(e) => set('max_predios', numOrUndef(e.target.value))} />
                    </div>
                  </div>

                  {usesList && (
                    <>
                      <div className="space-y-2">
                        <Label>Se o cliente incluir prédios fora da lista</Label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {([
                            ['recusar', 'Recusar o cupom', 'O cliente precisa tirar os outros prédios'],
                            ['desconto_parcial', 'Desconto só nos da lista', 'Os outros pagam o valor normal'],
                          ] as [CouponOutsideRule, string, string][]).map(([v, t, d]) => (
                            <Choice key={v} active={form.predios_fora_da_lista === v} onClick={() => set('predios_fora_da_lista', v)} title={t} desc={d} />
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-background/50">
                        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border/60">
                          <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar prédio ou bairro" className="pl-9" />
                          </div>
                          <Badge variant="secondary" className="h-8 px-3">{selected.size} de {buildings.length}</Badge>
                          <Button type="button" variant="outline" size="sm" onClick={() => setOnlySelected(v => !v)}>
                            {onlySelected ? 'Ver todos' : 'Ver marcados'}
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={selectVisible}>Marcar visíveis</Button>
                          <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>Limpar</Button>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-2 grid gap-1 sm:grid-cols-2">
                          {loadingBuildings && <div className="col-span-full p-6 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Carregando prédios…</div>}
                          {!loadingBuildings && visibleBuildings.length === 0 && <div className="col-span-full p-6 text-center text-sm text-muted-foreground">Nenhum prédio encontrado.</div>}
                          {visibleBuildings.map(b => (
                            <label key={b.id} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors', selected.has(b.id) ? 'bg-primary/10' : 'hover:bg-muted/60')}>
                              <Checkbox checked={selected.has(b.id)} onCheckedChange={() => toggleBuilding(b.id)} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate text-foreground">{b.nome}</p>
                                <p className="text-xs text-muted-foreground truncate">{b.bairro || '—'}</p>
                              </div>
                              {b.status && b.status !== 'ativo' && <Badge variant="outline" className="text-[10px] capitalize">{b.status}</Badge>}
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Section>

              <Section icon={ShieldCheck} title="Regras de uso">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="maxu">Máximo de usos (total)</Label>
                    <Input id="maxu" type="number" min="1" value={form.max_usos} onChange={(e) => set('max_usos', parseInt(e.target.value) || 1)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usou">Usos por cliente</Label>
                    <Input id="usou" type="number" min="1" value={form.uso_por_usuario ?? ''} placeholder="Ilimitado" onChange={(e) => set('uso_por_usuario', numOrUndef(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Plano mínimo</Label>
                    <Select value={String(form.min_meses || 1)} onValueChange={(v) => set('min_meses', parseInt(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 mês</SelectItem>
                        <SelectItem value="3">3 meses</SelectItem>
                        <SelectItem value="6">6 meses</SelectItem>
                        <SelectItem value="12">12 meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vmin">Valor mínimo do pedido (R$)</Label>
                    <Input id="vmin" type="number" step="0.01" min="0" value={form.valor_minimo_pedido ?? 0} onChange={(e) => set('valor_minimo_pedido', Number(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ini">Início (opcional)</Label>
                    <Input id="ini" type="datetime-local" value={form.data_inicio || ''} onChange={(e) => set('data_inicio', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp">Expira em (opcional)</Label>
                    <Input id="exp" type="datetime-local" value={form.expira_em || ''} onChange={(e) => set('expira_em', e.target.value)} />
                  </div>
                </div>
              </Section>
            </div>

            {/* Resumo ao vivo */}
            <aside className="hidden lg:flex flex-col min-h-0 border-l border-border/60 bg-card/40 p-6 overflow-y-auto">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Resumo do cupom
              </div>
              <div className="rounded-2xl bg-primary text-primary-foreground p-5 shadow-xl mb-5">
                <p className="text-xs opacity-80">Código</p>
                <p className="font-mono text-2xl font-bold tracking-wider break-all">{form.codigo || '—'}</p>
                <p className="mt-3 text-lg font-semibold">{discountLabel}</p>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  ['Produto', productLabel],
                  ['Prédios', buildingsLabel],
                  ...(outsideLabel ? [['Fora da lista', outsideLabel]] : []),
                  ['Plano', `A partir de ${form.min_meses || 1} ${form.min_meses === 1 ? 'mês' : 'meses'}`],
                  ['Valor mínimo', form.valor_minimo_pedido ? brl(form.valor_minimo_pedido) : 'Sem mínimo'],
                  ['Usos', `${form.max_usos} no total · ${form.uso_por_usuario ? `${form.uso_por_usuario} por cliente` : 'sem limite por cliente'}`],
                  ['Validade', `${form.data_inicio ? new Date(form.data_inicio).toLocaleString('pt-BR') : 'Agora'} → ${form.expira_em ? new Date(form.expira_em).toLocaleString('pt-BR') : 'sem expiração'}`],
                  ['Status', form.ativo ? 'Ativo' : 'Inativo'],
                ].map(([k, v]) => (
                  <li key={k} className="flex flex-col gap-0.5 rounded-xl border border-border/50 bg-background/50 px-3 py-2">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</span>
                    <span className="text-foreground">{v}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>

          {/* Rodapé */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-border/60 bg-card/40">
            <div className="min-h-[20px] text-sm text-destructive flex items-center gap-2">
              {error && (<><X className="h-4 w-4" />{error}</>)}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingCoupon ? 'Salvar alterações' : 'Criar cupom'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CouponFormDialog;
