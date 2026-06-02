import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Smartphone, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';

interface AddCollaboratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

type Step = 'form' | 'qrcode' | 'connected' | 'error';

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const callEvolution = async (
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown,
) => {
  const { data, error } = await supabase.functions.invoke('evolution-proxy', {
    body: { path, method, body },
  });
  if (error) throw new Error(error.message);
  return data as { status: number; data: any };
};

export const AddCollaboratorDialog: React.FC<AddCollaboratorDialogProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);

  const reset = () => {
    setStep('form');
    setName('');
    setPhone('');
    setErrorMsg(null);
    setInstanceName(null);
    setInstanceId(null);
    setQrBase64(null);
    setSavedRowId(null);
    setLoading(false);
    stopPolling();
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) reset();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Informe o nome do colaborador');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const slug = slugify(name);
      const uniqueName = `exa-${slug}-${Date.now().toString(36)}`;

      const res = await callEvolution('/instance/create', 'POST', {
        instanceName: uniqueName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      });

      if (res.status < 200 || res.status >= 300) {
        throw new Error(
          `Evolution respondeu HTTP ${res.status}: ${JSON.stringify(res.data)}`,
        );
      }

      const payload = res.data ?? {};
      const inst = payload.instance ?? {};
      const qr = payload.qrcode ?? {};
      const createdName: string = inst.instanceName ?? uniqueName;
      const createdId: string | undefined = inst.instanceId;
      const base64: string | undefined = qr.base64;

      setInstanceName(createdName);
      setInstanceId(createdId ?? null);
      setQrBase64(base64 ?? null);

      const { data: userData } = await supabase.auth.getUser();
      const { data: row, error: insertErr } = await (supabase as any)
        .from('evolution_instances')
        .insert({
          collaborator_name: name.trim(),
          collaborator_phone: phone.trim() || null,
          instance_name: createdName,
          instance_id: createdId ?? null,
          instance_token: payload?.hash?.apikey ?? null,
          status: 'pending',
          created_by: userData.user?.id ?? null,
          metadata: { created_payload: payload },
        })
        .select('id')
        .single();

      if (insertErr) {
        console.error('[AddCollaborator] insert error', insertErr);
        toast.error('Instância criada na Evolution, mas falhou ao salvar no banco');
      } else {
        setSavedRowId(row.id);
      }

      setStep('qrcode');
      startPolling(createdName);
    } catch (e: any) {
      const msg = e?.message ?? 'Erro desconhecido';
      setErrorMsg(msg);
      setStep('error');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (name: string) => {
    stopPolling();
    pollingRef.current = window.setInterval(async () => {
      try {
        const res = await callEvolution(`/instance/connectionState/${name}`, 'GET');
        const state: string | undefined = res?.data?.instance?.state;
        if (state === 'open') {
          stopPolling();
          await markConnected(name);
        }
      } catch (err) {
        console.warn('[AddCollaborator] polling error', err);
      }
    }, 3000);
  };

  const markConnected = async (name: string) => {
    let owner: string | null = null;
    let profileName: string | null = null;
    let pic: string | null = null;
    try {
      const inst = await callEvolution('/instance/fetchInstances', 'GET');
      const list: any[] = Array.isArray(inst.data) ? inst.data : [];
      const found =
        list.find((i) => (i?.name ?? i?.instance?.instanceName) === name) ?? null;
      owner = found?.ownerJid ?? found?.instance?.owner ?? null;
      profileName = found?.profileName ?? found?.instance?.profileName ?? null;
      pic = found?.profilePicUrl ?? found?.instance?.profilePictureUrl ?? null;
    } catch (err) {
      console.warn('[AddCollaborator] fetchInstances error', err);
    }

    if (savedRowId) {
      await (supabase as any)
        .from('evolution_instances')
        .update({
          status: 'connected',
          owner_jid: owner,
          profile_name: profileName,
          profile_picture_url: pic,
          last_connected_at: new Date().toISOString(),
        })
        .eq('id', savedRowId);
    }

    setStep('connected');
    toast.success('Colaborador conectado com sucesso');
    onCreated?.();
  };

  const handleRefreshQr = async () => {
    if (!instanceName) return;
    setLoading(true);
    try {
      const res = await callEvolution(`/instance/connect/${instanceName}`, 'GET');
      const base64 = res?.data?.base64 ?? res?.data?.qrcode?.base64 ?? null;
      if (base64) setQrBase64(base64);
      else toast.info('QR ainda não disponível, tente novamente em alguns segundos');
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao atualizar QR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar colaborador</DialogTitle>
          <DialogDescription>
            {step === 'form' &&
              'Crie uma instância dedicada do WhatsApp para o colaborador.'}
            {step === 'qrcode' &&
              'Abra o WhatsApp no celular do colaborador e escaneie o QR code.'}
            {step === 'connected' && 'Tudo pronto! A instância está conectada.'}
            {step === 'error' && 'Não foi possível criar a instância.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collab-name">Nome do colaborador *</Label>
              <Input
                id="collab-name"
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collab-phone">Telefone (opcional)</Label>
              <Input
                id="collab-phone"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Apenas referência interna — quem define o número é o WhatsApp escaneado.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar instância
              </Button>
            </div>
          </div>
        )}

        {step === 'qrcode' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center bg-gray-50 rounded-xl p-4 border border-gray-200">
              {qrBase64 ? (
                <img
                  src={qrBase64}
                  alt="QR Code Evolution"
                  className="w-64 h-64 object-contain"
                />
              ) : (
                <div className="w-64 h-64 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  Aguardando QR…
                </div>
              )}
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-medium mb-1">
                <Smartphone className="w-3.5 h-3.5" />
                Como conectar
              </div>
              No WhatsApp do colaborador, vá em{' '}
              <strong>Configurações → Aparelhos conectados → Conectar aparelho</strong>{' '}
              e aponte para o QR acima.
            </div>
            <div className="text-xs text-muted-foreground font-mono break-all">
              Instância: {instanceName}
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleRefreshQr} disabled={loading}>
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar QR
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}

        {step === 'connected' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{name}</p>
              <p className="text-sm text-muted-foreground">Conectado e pronto para uso</p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
            >
              Concluir
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                <AlertTriangle className="w-4 h-4" />
                Erro
              </div>
              <p className="text-xs text-red-900/80 break-all">{errorMsg}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={() => setStep('form')}>Tentar de novo</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddCollaboratorDialog;
