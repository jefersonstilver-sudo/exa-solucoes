import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, Plus, Trash2, Save, ShieldCheck, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  MAX_AUTORIZADOS, WhatsappAutorizado, adicionarAutorizado, formatarFone, listarAutorizados,
  normalizarFone, removerAutorizado, salvarWhatsappGestor,
} from '@/services/pedidoWhatsappService';

interface Props {
  pedidoId: string;
  clientId?: string | null;
  /** pedidos.whatsapp atual */
  gestorWhatsapp?: string | null;
  /** e-mail que recebe o codigo de seguranca */
  gestorEmail?: string | null;
  onChanged?: () => void;
}

const mascararEmail = (e?: string | null) => (e ? e.replace(/^(.{2}).*(@.*)$/, '$1•••$2') : 'e-mail não cadastrado');

/** Os 3 WhatsApps que administram o pedido pela Sofia: gestor + ate 2 autorizados. */
const PedidoWhatsappAcessosCard: React.FC<Props> = ({ pedidoId, clientId, gestorWhatsapp, gestorEmail, onChanged }) => {
  const [gestor, setGestor] = useState(gestorWhatsapp || '');
  const [gestorSalvo, setGestorSalvo] = useState(gestorWhatsapp || '');
  const [foneCadastro, setFoneCadastro] = useState<string | null>(null);
  const [emailConta, setEmailConta] = useState<string | null>(null);
  const [lista, setLista] = useState<WhatsappAutorizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);
  const [salvandoGestor, setSalvandoGestor] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoFone, setNovoFone] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);

  useEffect(() => { setGestor(gestorWhatsapp || ''); setGestorSalvo(gestorWhatsapp || ''); }, [gestorWhatsapp]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setLista(await listarAutorizados(pedidoId));
      setIndisponivel(false);
    } catch (e) {
      // tabela ainda nao criada no banco
      setIndisponivel(true);
      console.warn('[whatsapp autorizados]', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [pedidoId]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    if (!clientId) return;
    supabase.from('users').select('telefone, email').eq('id', clientId).maybeSingle()
      .then(({ data }) => { setFoneCadastro(normalizarFone((data as any)?.telefone)); setEmailConta((data as any)?.email || null); });
  }, [clientId]);

  const salvarGestor = async (valor: string) => {
    setSalvandoGestor(true);
    try {
      const fone = await salvarWhatsappGestor(pedidoId, valor);
      setGestor(fone); setGestorSalvo(fone);
      toast.success('WhatsApp do gestor atualizado');
      onChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSalvandoGestor(false);
    }
  };

  const adicionar = async () => {
    setAdicionando(true);
    try {
      await adicionarAutorizado(pedidoId, novoFone, novoNome);
      setNovoNome(''); setNovoFone('');
      toast.success('WhatsApp autorizado adicionado');
      await carregar();
      onChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAdicionando(false);
    }
  };

  const remover = async (id: string) => {
    setRemovendo(id);
    try {
      await removerAutorizado(id);
      toast.success('Acesso removido');
      await carregar();
      onChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRemovendo(null);
    }
  };

  const gestorMudou = normalizarFone(gestor) !== normalizarFone(gestorSalvo);
  const cadastroDiferente = !!foneCadastro && normalizarFone(gestorSalvo) !== foneCadastro;
  const total = (gestorSalvo ? 1 : 0) + lista.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-green-600" /> WhatsApps deste pedido</span>
          <Badge variant="outline" className={total ? 'border-green-600 text-green-700' : 'border-amber-500 text-amber-700'}>{total}/3</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Estes números podem consultar e administrar o pedido pela Sofia, todos com o mesmo poder do gestor.
          Antes de mostrar ou alterar qualquer coisa, a Sofia envia um código de 6 dígitos para o e-mail do gestor
          (<span className="font-medium">{mascararEmail(clientId ? emailConta : gestorEmail)}</span>) e só libera depois que o código for confirmado.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gestor */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium"><Crown className="h-4 w-4 text-amber-500" /> Gestor</div>
          <div className="flex gap-2">
            <Input value={gestor} onChange={(e) => setGestor(e.target.value)} placeholder="(45) 99999-0000" inputMode="tel" />
            <Button size="sm" onClick={() => salvarGestor(gestor)} disabled={!gestorMudou || salvandoGestor} className="shrink-0">
              {salvandoGestor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
          {!gestorSalvo && <p className="text-xs text-amber-700">Pedido sem WhatsApp: a Sofia não reconhece ninguém por número neste pedido.</p>}
          {cadastroDiferente && (
            <button type="button" className="text-xs text-primary underline" onClick={() => salvarGestor(foneCadastro!)} disabled={salvandoGestor}>
              Usar o WhatsApp do cadastro ({formatarFone(foneCadastro)})
            </button>
          )}
        </div>

        {/* Autorizados */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-green-600" /> Autorizados ({lista.length}/{MAX_AUTORIZADOS})</div>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Carregando…</div>
          ) : indisponivel ? (
            <p className="text-xs text-destructive">Cadastro de autorizados ainda não ativado no banco (falta rodar a migração).</p>
          ) : (
            <>
              {lista.length === 0 && <p className="text-xs text-muted-foreground">Nenhum número autorizado além do gestor.</p>}
              {lista.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{a.nome || 'Sem nome'}</div>
                    <div className="text-xs text-muted-foreground">{formatarFone(a.telefone)}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remover(a.id)} disabled={removendo === a.id} aria-label="Remover acesso">
                    {removendo === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                  </Button>
                </div>
              ))}
              {lista.length < MAX_AUTORIZADOS && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome da pessoa" />
                  <Input value={novoFone} onChange={(e) => setNovoFone(e.target.value)} placeholder="WhatsApp com DDD" inputMode="tel" />
                  <Button size="sm" onClick={adicionar} disabled={adicionando || !normalizarFone(novoFone)}>
                    {adicionando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" /> Adicionar</>}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PedidoWhatsappAcessosCard;
