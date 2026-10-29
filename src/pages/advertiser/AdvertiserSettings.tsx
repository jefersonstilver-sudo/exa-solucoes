/**
 * EXA 2.0 — Meu perfil (conta da PESSOA).
 * O que é da empresa (logo, cores, marca, redes, endereço) mora no pedido, aba "Empresa".
 * O termo de responsabilidade é aceito na compra ou antes do primeiro vídeo do pedido (não aqui).
 * Aqui ficam: dados pessoais, WhatsApp, documento (só leitura), segurança (2FA e senha) e o status do termo.
 */
import React, { useEffect, useState } from 'react';
import { useEffectiveAuth as useAuth } from '@/hooks/useEffectiveAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, AlertTriangle, Pencil, Check, X, Lock, KeyRound, FileText, Smartphone, Mail, UserRound, MessageCircle } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { resolveDisplayName, saveClientIdentity } from '@/services/clientProfileService';
import { WhatsAppVerificationModal } from '@/components/settings/WhatsAppVerificationModal';
import { useLogoEmpresa } from '@/hooks/exa2/useLogoEmpresa';
import LogoSelo from '@/components/exa2/LogoSelo';
import FinanceiroCard from '@/components/cobranca/FinanceiroCard';

const CARD = 'rounded-[22px] bg-white shadow-[0_1px_2px_rgba(30,15,18,.06),0_12px_32px_-22px_rgba(30,15,18,.35)]';
const EYEBROW = 'text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8a1a1e]';
const SOFIA_WA = 'https://wa.me/5545991415920';

const mascaraCpf = (c: string) => {
  const d = String(c || '').replace(/\D/g, '');
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : c;
};
const mascaraFone = (f: string) => {
  const d = String(f || '').replace(/\D/g, '');
  if (d.length < 8) return f || '';
  return `(${d.slice(-11, -9) || '**'}) •••••-${d.slice(-4)}`;
};
const dataBR = (s?: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');

const Linha: React.FC<{ icon: React.ElementType; rotulo: string; children: React.ReactNode; acao?: React.ReactNode }> = ({ icon: I, rotulo, children, acao }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#f0eaeb] py-4 first:border-t-0 first:pt-0 last:pb-0">
    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#f6f2f3]">
      <I className="h-[18px] w-[18px] text-[#554e50]" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-xs font-semibold text-[#8b8285]">{rotulo}</div>
      <div className="mt-0.5 text-[15px] font-semibold text-[#1b1719]">{children}</div>
    </div>
    {acao}
  </div>
);

const AdvertiserSettings = () => {
  const { userProfile, refreshUserProfile, isImpersonating } = useAuth() as any;
  const uid: string | undefined = userProfile?.id;
  const logo = useLogoEmpresa(uid);

  const [loading, setLoading] = useState(true);
  const [u, setU] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [editNome, setEditNome] = useState(false);
  const [nomeTmp, setNomeTmp] = useState('');
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showWa, setShowWa] = useState(false);
  const [senhaAberta, setSenhaAberta] = useState(false);
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const carregar = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', uid).single();
      if (error && error.code !== 'PGRST116') throw error;
      setU(data || {});
      setEmail((data as any)?.email || userProfile?.email || '');
      setNome(resolveDisplayName(data as any) || userProfile?.nome || '');
      setTwoFactor(!!(data as any)?.two_factor_enabled);
      setPhoneVerified((data as any)?.telefone_verificado === true || !!(data as any)?.telefone_verificado_at);
    } catch (e) {
      console.error('perfil', e);
      toast.error('Não consegui carregar o seu perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const salvarNome = async () => {
    const v = nomeTmp.trim();
    if (v.split(/\s+/).length < 2) { toast.error('Informe nome e sobrenome'); return; }
    setSalvandoNome(true);
    try {
      if (!isImpersonating) await supabase.auth.updateUser({ data: { name: v } });
      await saveClientIdentity(uid!, { nome: v, telefone: u?.telefone || null });
      setNome(v); setEditNome(false);
      toast.success('Nome atualizado');
      if (!isImpersonating) await refreshUserProfile?.();
    } catch (e: any) {
      toast.error('Não consegui salvar: ' + (e?.message || ''));
    } finally {
      setSalvandoNome(false);
    }
  };

  const alternar2FA = async (checked: boolean) => {
    if (!phoneVerified) { toast.error('Verifique seu WhatsApp antes de ativar'); return; }
    try {
      const { error } = await supabase.from('users').update({ two_factor_enabled: checked } as any).eq('id', uid!);
      if (error) throw error;
      setTwoFactor(checked);
      toast.success(checked ? 'Verificação em duas etapas ativada' : 'Verificação em duas etapas desativada');
    } catch (e) {
      toast.error('Não consegui alterar a verificação em duas etapas');
    }
  };

  const trocarSenha = async () => {
    if (senha.length < 8) { toast.error('A senha precisa ter pelo menos 8 caracteres'); return; }
    if (senha !== senha2) { toast.error('As senhas não conferem'); return; }
    setSalvandoSenha(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha, data: { has_password: true } });
      if (error) throw error;
      setSenha(''); setSenha2(''); setSenhaAberta(false);
      toast.success('Senha alterada');
    } catch (e: any) {
      toast.error('Não consegui alterar a senha: ' + (e?.message || ''));
    } finally {
      setSalvandoSenha(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8a1a1e]" />
      </div>
    );
  }

  const documento = u?.tipo_documento === 'documento_estrangeiro'
    ? (u?.documento_estrangeiro ? `Documento estrangeiro · ${u.documento_estrangeiro}` : '')
    : (u?.cpf ? `CPF · ${mascaraCpf(u.cpf)}` : '');
  const termoOk = !!u?.empresa_aceite_termo;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 lg:py-8">
      {/* Cabeçalho */}
      <section className={`${CARD} flex items-center gap-4 p-5 sm:p-6`}>
        <LogoSelo src={logo} fallback={(nome || email || 'E').charAt(0).toUpperCase()} className="h-16 w-16 sm:h-[72px] sm:w-[72px]" pad="p-2" />
        <div className="min-w-0 flex-1">
          <div className={EYEBROW}>Meu perfil</div>
          <h1 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-[#1b1719]">{nome || 'Sem nome'}</h1>
          <p className="truncate text-sm text-[#8b8285]">{email}</p>
        </div>
        {phoneVerified && (
          <span className="hidden flex-none items-center gap-1.5 rounded-full bg-[#e6f7ec] px-3 py-1.5 text-xs font-bold text-[#13a24a] sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" /> Conta verificada
          </span>
        )}
      </section>

      {/* Dados pessoais */}
      <section className={`${CARD} p-5 sm:p-6`}>
        <h2 className="mb-4 text-base font-extrabold text-[#1b1719]">Seus dados</h2>

        <Linha
          icon={UserRound}
          rotulo="Nome completo"
          acao={!editNome ? (
            <button type="button" onClick={() => { setNomeTmp(nome); setEditNome(true); }} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[#8a1a1e] hover:bg-[#fbe9eb]" aria-label="Editar nome">
              <Pencil className="h-4 w-4" /> Editar
            </button>
          ) : null}
        >
          {editNome ? (
            <div className="mt-1 flex flex-wrap gap-2">
              <label htmlFor="nome-perfil" className="sr-only">Nome completo</label>
              <input id="nome-perfil" autoFocus value={nomeTmp} onChange={(e) => setNomeTmp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && salvarNome()} className="min-h-[42px] min-w-0 flex-1 rounded-xl border border-[#e6dfe1] px-3 text-[15px] font-normal outline-none focus:border-[#8a1a1e]" />
              <button type="button" onClick={salvarNome} disabled={salvandoNome} aria-label="Salvar nome" className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#8a1a1e] text-white disabled:opacity-60">
                {salvandoNome ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => setEditNome(false)} aria-label="Cancelar" className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-[#e6dfe1] text-[#554e50]">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (nome || '—')}
        </Linha>

        <Linha icon={Mail} rotulo="E-mail de acesso">
          {email}
          <span className="ml-2 text-xs font-normal text-[#8b8285]">não pode ser alterado</span>
        </Linha>

        <Linha
          icon={Smartphone}
          rotulo="WhatsApp"
          acao={
            <button type="button" onClick={() => setShowWa(true)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[#8a1a1e] hover:bg-[#fbe9eb]">
              {phoneVerified ? 'Alterar' : 'Verificar'}
            </button>
          }
        >
          <span className="inline-flex items-center gap-2">
            {mascaraFone(u?.telefone) || 'Não informado'}
            {phoneVerified ? (
              <span className="rounded-full bg-[#e6f7ec] px-2 py-0.5 text-[11px] font-bold text-[#13a24a]">verificado</span>
            ) : (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">não verificado</span>
            )}
          </span>
        </Linha>

        <Linha
          icon={FileText}
          rotulo="Documento de quem assina o contrato"
          acao={
            <a href={SOFIA_WA} target="_blank" rel="noreferrer" className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[#8a1a1e] hover:bg-[#fbe9eb]">
              <MessageCircle className="h-4 w-4" /> Corrigir com a Sofia
            </a>
          }
        >
          {documento || <span className="text-[#8b8285]">ainda não informado</span>}
        </Linha>
      </section>

      {/* Financeiro (boletos, lembretes e confirmações também vão para ele) */}
      <FinanceiroCard userId={uid} />

      {/* Segurança */}
      <section className={`${CARD} p-5 sm:p-6`}>
        <h2 className="mb-4 text-base font-extrabold text-[#1b1719]">Segurança</h2>

        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#fbe9eb]">
            <Lock className="h-[18px] w-[18px] text-[#8a1a1e]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-semibold text-[#1b1719]">Verificação em duas etapas</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${twoFactor ? 'bg-[#e6f7ec] text-[#13a24a]' : 'bg-[#f3f1f2] text-[#8b8285]'}`}>{twoFactor ? 'ativa' : 'desativada'}</span>
            </div>
            <p className="mt-0.5 text-sm text-[#6f6669]">Ao entrar, além da senha, pedimos um código enviado ao seu WhatsApp.</p>
            {!phoneVerified && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-amber-700"><AlertTriangle className="h-4 w-4" /> Verifique o WhatsApp para poder ativar.</p>
            )}
          </div>
          <div className="flex-none pt-1">
            <Toggle checked={twoFactor} disabled={!phoneVerified} color="red" size="large" onChange={(e: any) => alternar2FA(e.target.checked)} />
          </div>
        </div>

        <div className="mt-5 border-t border-[#f0eaeb] pt-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#f6f2f3]">
              <KeyRound className="h-[18px] w-[18px] text-[#554e50]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-[#1b1719]">Senha</div>
              <p className="text-sm text-[#6f6669]">Use pelo menos 8 caracteres.</p>
            </div>
            {!senhaAberta && !isImpersonating && (
              <button type="button" onClick={() => setSenhaAberta(true)} className="inline-flex min-h-[40px] items-center rounded-xl border border-[#e6dfe1] px-4 text-sm font-semibold text-[#1b1719] hover:bg-[#f6f2f3]">
                Alterar senha
              </button>
            )}
          </div>
          {senhaAberta && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="senha-nova" className="mb-1 block text-xs font-semibold text-[#8b8285]">Nova senha</label>
                <input id="senha-nova" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="min-h-[44px] w-full rounded-xl border border-[#e6dfe1] px-3 outline-none focus:border-[#8a1a1e]" />
              </div>
              <div>
                <label htmlFor="senha-conf" className="mb-1 block text-xs font-semibold text-[#8b8285]">Repita a nova senha</label>
                <input id="senha-conf" type="password" autoComplete="new-password" value={senha2} onChange={(e) => setSenha2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && trocarSenha()} className="min-h-[44px] w-full rounded-xl border border-[#e6dfe1] px-3 outline-none focus:border-[#8a1a1e]" />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <button type="button" onClick={trocarSenha} disabled={salvandoSenha} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#8a1a1e] px-5 text-sm font-bold text-white disabled:opacity-60">
                  {salvandoSenha && <Loader2 className="h-4 w-4 animate-spin" />} Salvar nova senha
                </button>
                <button type="button" onClick={() => { setSenhaAberta(false); setSenha(''); setSenha2(''); }} className="inline-flex min-h-[44px] items-center rounded-xl px-4 text-sm font-semibold text-[#554e50]">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Termo e conta */}
      <section className={`${CARD} p-5 sm:p-6`}>
        <h2 className="mb-4 text-base font-extrabold text-[#1b1719]">Termos e conta</h2>
        <Linha icon={ShieldCheck} rotulo="Termo de responsabilidade e autorização">
          {termoOk ? (
            <span>Aceito{u?.empresa_aceite_termo_data ? ` em ${dataBR(u.empresa_aceite_termo_data)}` : ''}</span>
          ) : (
            <span className="text-[#8b8285]">Será pedido no seu primeiro envio de vídeo</span>
          )}
        </Linha>
        <p className="mt-4 rounded-xl bg-[#f7f4f5] p-4 text-sm text-[#6f6669]">
          Os dados da empresa (logo, cores, redes, endereço e público) ficam em cada pedido, na aba <b>Empresa</b>. Para encerrar a conta, fale com a Sofia ou escreva para suporte@examidia.com.br.
        </p>
      </section>

      <WhatsAppVerificationModal
        open={showWa}
        onClose={() => setShowWa(false)}
        currentPhone={u?.telefone || ''}
        userId={uid || ''}
        mode={phoneVerified ? 'change' : 'verify'}
        onSuccess={async () => {
          setPhoneVerified(true);
          await carregar();
          toast.success('WhatsApp verificado');
        }}
      />
    </div>
  );
};

export default AdvertiserSettings;
