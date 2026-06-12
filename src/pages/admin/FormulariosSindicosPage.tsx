import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Pencil, Trash2, Upload, X, ExternalLink, Building2 } from 'lucide-react';

const CARACTERISTICAS_OPCOES = [
  'Piscina', 'Academia', 'Churrasqueira', 'Playground', 'Salão de festas',
  'Quadra poliesportiva', 'Espaço gourmet', 'Brinquedoteca', 'Sala de jogos',
  'Espaço pet', 'Coworking', 'Cinema', 'Spa/Sauna', 'Área verde',
  'Deck com espreguiçadeiras'
];

interface Cadastro {
  id: string;
  nome: string | null;
  endereco: string;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  tipo_predio: string | null;
  numero_unidades: number | null;
  numero_andares: number | null;
  numero_blocos: number | null;
  sindico_nome: string | null;
  sindico_contato: string | null;
  vice_sindico_nome: string | null;
  vice_sindico_contato: string | null;
  contato_portaria: string | null;
  telefone_principal: string | null;
  caracteristicas: string[] | null;
  outras_caracteristicas: string | null;
  fotos_urls: string[] | null;
  created_at: string;
}

const emptyForm: Partial<Cadastro> = {
  nome: '', endereco: '', bairro: '', cidade: '', estado: '',
  tipo_predio: '', numero_unidades: null, numero_andares: null, numero_blocos: null,
  sindico_nome: '', sindico_contato: '', vice_sindico_nome: '', vice_sindico_contato: '',
  contato_portaria: '', telefone_principal: '',
  caracteristicas: [], outras_caracteristicas: '', fotos_urls: []
};

const FormulariosSindicosPage: React.FC = () => {
  const [items, setItems] = useState<Cadastro[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Cadastro> | null>(null);
  const [saving, setSaving] = useState(false);
  const [newFotos, setNewFotos] = useState<File[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('predios_cadastro_externo')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar cadastros');
    setItems((data as Cadastro[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cadastro? Esta ação não pode ser desfeita.')) return;
    const { error } = await (supabase as any)
      .from('predios_cadastro_externo').delete().eq('id', id);
    if (error) return toast.error('Erro ao excluir');
    toast.success('Cadastro excluído');
    load();
  };

  const toggleCaract = (c: string) => {
    if (!editing) return;
    const list = editing.caracteristicas || [];
    setEditing({
      ...editing,
      caracteristicas: list.includes(c) ? list.filter(x => x !== c) : [...list, c]
    });
  };

  const uploadFotos = async (cadastroId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of newFotos) {
      const ext = file.name.split('.').pop();
      const path = `cadastro-externo/${cadastroId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('building-images').upload(path, file);
      if (error) { console.error(error); continue; }
      const { data } = supabase.storage.from('building-images').getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const removeFoto = (url: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      fotos_urls: (editing.fotos_urls || []).filter(u => u !== url)
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.endereco?.trim()) { toast.error('Endereço é obrigatório'); return; }
    setSaving(true);
    try {
      const isNew = !editing.id;
      const payload: any = {
        nome: editing.nome || null,
        endereco: editing.endereco,
        bairro: editing.bairro || null,
        cidade: editing.cidade || null,
        estado: editing.estado || null,
        tipo_predio: editing.tipo_predio || null,
        numero_unidades: editing.numero_unidades ?? null,
        numero_andares: editing.numero_andares ?? null,
        numero_blocos: editing.numero_blocos ?? null,
        sindico_nome: editing.sindico_nome || null,
        sindico_contato: editing.sindico_contato || null,
        vice_sindico_nome: editing.vice_sindico_nome || null,
        vice_sindico_contato: editing.vice_sindico_contato || null,
        contato_portaria: editing.contato_portaria || null,
        telefone_principal: editing.telefone_principal || null,
        caracteristicas: editing.caracteristicas || [],
        outras_caracteristicas: editing.outras_caracteristicas || null,
        fotos_urls: editing.fotos_urls || []
      };

      let cadastroId = editing.id as string | undefined;

      if (isNew) {
        const { data, error } = await (supabase as any)
          .from('predios_cadastro_externo').insert(payload).select('id').single();
        if (error) throw error;
        cadastroId = data.id;
      } else {
        const { error } = await (supabase as any)
          .from('predios_cadastro_externo').update(payload).eq('id', cadastroId);
        if (error) throw error;
      }

      if (newFotos.length > 0 && cadastroId) {
        const novas = await uploadFotos(cadastroId);
        if (novas.length > 0) {
          const all = [...(payload.fotos_urls || []), ...novas];
          await (supabase as any).from('predios_cadastro_externo')
            .update({ fotos_urls: all }).eq('id', cadastroId);
        }
      }

      toast.success(isNew ? 'Cadastro criado' : 'Cadastro atualizado');
      setEditing(null);
      setNewFotos([]);
      load();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-7 h-7 text-[#C7141A]" />
            Formulários dos Síndicos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cadastros enviados via link público <code className="text-xs">/cadastro-predio</code>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/cadastro-predio', '_blank')}>
            <ExternalLink className="w-4 h-4 mr-2" /> Ver formulário público
          </Button>
          <Button
            className="bg-[#C7141A] hover:bg-[#B40D1A]"
            onClick={() => { setEditing({ ...emptyForm }); setNewFotos([]); }}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo cadastro
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{loading ? 'Carregando…' : `${items.length} cadastro(s)`}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum cadastro recebido ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map(it => {
                const foto = it.fotos_urls?.[0];
                const localizacao = [it.bairro, it.cidade, it.estado].filter(Boolean).join(', ');
                return (
                  <div
                    key={it.id}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:shadow-md transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base truncate">{it.nome || 'Sem nome'}</div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {localizacao || it.endereco || '—'}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(it); setNewFotos([]); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(it.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {foto ? (
                        <img src={foto} alt={it.nome || 'Prédio'} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8 text-muted-foreground/40" strokeWidth={1.25} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); setNewFotos([]); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar cadastro' : 'Novo cadastro'}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-6 py-2">
              <section className="space-y-3">
                <h3 className="font-semibold text-sm">Dados Básicos</h3>
                <div>
                  <Label>Nome do prédio</Label>
                  <Input value={editing.nome || ''} onChange={e => setEditing({ ...editing, nome: e.target.value })} />
                </div>
                <div>
                  <Label>Endereço *</Label>
                  <Input value={editing.endereco || ''} onChange={e => setEditing({ ...editing, endereco: e.target.value })} required />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><Label>Bairro</Label><Input value={editing.bairro || ''} onChange={e => setEditing({ ...editing, bairro: e.target.value })} /></div>
                  <div><Label>Cidade</Label><Input value={editing.cidade || ''} onChange={e => setEditing({ ...editing, cidade: e.target.value })} /></div>
                  <div><Label>UF</Label><Input maxLength={2} value={editing.estado || ''} onChange={e => setEditing({ ...editing, estado: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Tipo de prédio</Label>
                  <Select value={editing.tipo_predio || ''} onValueChange={v => setEditing({ ...editing, tipo_predio: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residencial">Residencial</SelectItem>
                      <SelectItem value="Comercial">Comercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-sm">Estruturais</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div><Label>Unidades</Label><Input type="number" value={editing.numero_unidades ?? ''} onChange={e => setEditing({ ...editing, numero_unidades: e.target.value ? parseInt(e.target.value) : null })} /></div>
                  <div><Label>Andares</Label><Input type="number" value={editing.numero_andares ?? ''} onChange={e => setEditing({ ...editing, numero_andares: e.target.value ? parseInt(e.target.value) : null })} /></div>
                  <div><Label>Blocos</Label><Input type="number" value={editing.numero_blocos ?? ''} onChange={e => setEditing({ ...editing, numero_blocos: e.target.value ? parseInt(e.target.value) : null })} /></div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-sm">Contatos</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Nome síndico</Label><Input value={editing.sindico_nome || ''} onChange={e => setEditing({ ...editing, sindico_nome: e.target.value })} /></div>
                  <div><Label>Contato síndico</Label><Input value={editing.sindico_contato || ''} onChange={e => setEditing({ ...editing, sindico_contato: e.target.value })} /></div>
                  <div><Label>Nome vice-síndico</Label><Input value={editing.vice_sindico_nome || ''} onChange={e => setEditing({ ...editing, vice_sindico_nome: e.target.value })} /></div>
                  <div><Label>Contato vice-síndico</Label><Input value={editing.vice_sindico_contato || ''} onChange={e => setEditing({ ...editing, vice_sindico_contato: e.target.value })} /></div>
                  <div><Label>Contato portaria</Label><Input value={editing.contato_portaria || ''} onChange={e => setEditing({ ...editing, contato_portaria: e.target.value })} /></div>
                  <div><Label>Telefone principal</Label><Input value={editing.telefone_principal || ''} onChange={e => setEditing({ ...editing, telefone_principal: e.target.value })} /></div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-sm">Características de lazer</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CARACTERISTICAS_OPCOES.map(c => {
                    const active = (editing.caracteristicas || []).includes(c);
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => toggleCaract(c)}
                        className={`px-3 py-2 rounded-lg text-sm border transition ${active ? 'bg-[#C7141A] border-[#C7141A] text-white' : 'bg-background hover:bg-muted'}`}
                      >{c}</button>
                    );
                  })}
                </div>
                <div>
                  <Label>Outras</Label>
                  <Textarea rows={2} value={editing.outras_caracteristicas || ''} onChange={e => setEditing({ ...editing, outras_caracteristicas: e.target.value })} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-sm">Fotos</h3>
                {(editing.fotos_urls || []).length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {(editing.fotos_urls || []).map((url, i) => (
                      <div key={i} className="relative aspect-square rounded overflow-hidden border">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeFoto(url)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-destructive">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Adicionar fotos {newFotos.length > 0 && `(${newFotos.length} para upload)`}</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
                    setNewFotos(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 10));
                    e.target.value = '';
                  }} />
                </label>
              </section>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditing(null); setNewFotos([]); }} disabled={saving}>Cancelar</Button>
            <Button className="bg-[#C7141A] hover:bg-[#B40D1A]" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando…</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormulariosSindicosPage;
