import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, User, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CompanyBrandSection } from '@/components/settings/CompanyBrandSection';
import ClientBrandExtrasCard from '@/components/settings/ClientBrandExtrasCard';
import { resolveDisplayName, saveClientIdentity } from '@/services/clientProfileService';

interface Props {
  userId: string;
  onSaved?: () => void;
}

/** Aba "Perfil do cliente" no detalhe do pedido (CEO edita em nome do cliente). */
const ClientProfilePanel: React.FC<Props> = ({ userId, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('nome, primeiro_nome, sobrenome, telefone, telefone_verificado, telefone_verificado_at, cpf, email')
        .eq('id', userId)
        .maybeSingle();
      if (!alive) return;
      if (error) toast.error('Erro ao carregar perfil do cliente');
      const u: any = data || {};
      setNome(resolveDisplayName(u) || '');
      setTelefone(u.telefone || '');
      setCpf(u.cpf || '');
      setEmail(u.email || '');
      setVerificado(u.telefone_verificado === true || !!u.telefone_verificado_at);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [userId]);

  const save = async () => {
    if (!nome.trim()) { toast.error('Informe o nome do cliente'); return; }
    setSaving(true);
    try {
      await saveClientIdentity(userId, { nome, telefone: telefone || null, cpf: cpf || null });
      toast.success('Perfil do cliente atualizado (pedidos sincronizados)');
      onSaved?.();
    } catch (e: any) {
      toast.error('Erro ao salvar perfil', { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <User className="h-5 w-5 mr-2 text-exa-red" /> Perfil do cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nome completo</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input value={email} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    Telefone / WhatsApp
                    {verificado ? (
                      <Badge variant="outline" className="gap-1 text-[10px]"><ShieldCheck className="h-3 w-3" /> verificado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">não verificado</Badge>
                    )}
                  </Label>
                  <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Documento (CPF)</Label>
                  <Input value={cpf} onChange={(e) => setCpf(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={save} disabled={saving} className="!bg-[#9C1E1E] hover:!bg-[#7a1818] !text-white">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar perfil
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CompanyBrandSection isEditing userId={userId} />
      <ClientBrandExtrasCard userId={userId} />
    </div>
  );
};

export default ClientProfilePanel;
