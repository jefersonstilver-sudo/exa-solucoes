import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Palette, Save, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { BrandExtras, loadBrandExtras, saveBrandExtras } from '@/services/clientProfileService';

interface Props {
  userId: string | null | undefined;
}

/** Instagram, WhatsApp comercial, site e cores da marca (users.dashboard_preferences.marca). */
const ClientBrandExtrasCard: React.FC<Props> = ({ userId }) => {
  const [data, setData] = useState<BrandExtras>({ cores: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    loadBrandExtras(userId)
      .then((m) => setData({ instagram: '', whatsapp_comercial: '', site: '', ...m, cores: m.cores || [] }))
      .catch(() => toast.error('Erro ao carregar dados da marca'))
      .finally(() => setLoading(false));
  }, [userId]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await saveBrandExtras(userId, {
        instagram: (data.instagram || '').trim(),
        whatsapp_comercial: (data.whatsapp_comercial || '').replace(/\D/g, ''),
        site: (data.site || '').trim(),
        cores: (data.cores || []).filter(Boolean),
      });
      toast.success('Dados da marca salvos');
    } catch (e: any) {
      toast.error('Erro ao salvar marca', { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const setCor = (i: number, v: string) =>
    setData((p) => ({ ...p, cores: (p.cores || []).map((c, idx) => (idx === i ? v : c)) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Palette className="h-5 w-5 mr-2 text-exa-red" />
          Redes e identidade da marca
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Instagram</Label>
                <Input placeholder="@suamarca" value={data.instagram || ''} onChange={(e) => setData({ ...data, instagram: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp comercial</Label>
                <Input placeholder="(45) 99999-9999" value={data.whatsapp_comercial || ''} onChange={(e) => setData({ ...data, whatsapp_comercial: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Site</Label>
                <Input placeholder="https://..." value={data.site || ''} onChange={(e) => setData({ ...data, site: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cores da marca</Label>
              <div className="flex flex-wrap items-center gap-2">
                {(data.cores || []).map((c, i) => (
                  <div key={i} className="flex items-center gap-1 rounded-md border px-2 py-1">
                    <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(c) ? c : '#000000'} onChange={(e) => setCor(i, e.target.value)} className="h-6 w-6 cursor-pointer bg-transparent" aria-label={`Cor ${i + 1}`} />
                    <span className="font-mono text-xs">{c}</span>
                    <button type="button" onClick={() => setData((p) => ({ ...p, cores: (p.cores || []).filter((_, idx) => idx !== i) }))} aria-label="Remover cor">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {(data.cores || []).length < 6 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setData((p) => ({ ...p, cores: [...(p.cores || []), '#C7141A'] }))}>
                    <Plus className="h-3 w-3 mr-1" /> Cor
                  </Button>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving || !userId} className="!bg-[#9C1E1E] hover:!bg-[#7a1818] !text-white">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar marca
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientBrandExtrasCard;
