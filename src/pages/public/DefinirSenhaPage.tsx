import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useFonteSite, useTituloPagina, waSofia } from '@/site/comum';

/**
 * Criar a senha da conta (rota /definir-senha) — link que a Sofia e as propostas mandam.
 *
 * Por que foi refeito (28/10/2026): o link ficava girando em "Validando link..." ou o "Definir senha"
 * não salvava. Nos logs do Auth: o token era aceito (POST /verify = login), mas a troca de senha
 * (PUT /user) nunca saía do aparelho — a biblioteca do Supabase ficava presa esperando a própria trava
 * de sessão, e a página ainda era recriada a cada mudança de login. Agora:
 *  - link novo (?th=…): nada é validado ao abrir (preview do WhatsApp/antivírus não queimam o link);
 *    ao salvar, o token é conferido e a senha gravada por chamadas diretas ao Auth, com tempo-limite;
 *  - nunca usa uma sessão que já estava aberta no aparelho (não troca a senha de outra pessoa);
 *  - link antigo (#access_token=…): usa o token do próprio link, também por chamada direta;
 *  - nenhuma tela fica girando para sempre: tudo tem tempo-limite e mensagem clara.
 */

const URL_SUPA = 'https://aakenoljsycyrcrchgxj.supabase.co';
const CHAVE_PUBLICA = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk';

type Etapa = 'form' | 'salvando' | 'pronto' | 'expirado' | 'erro';
type Sessao = { access_token: string; refresh_token: string; user?: { email?: string } };

async function chamarAuth(caminho: string, init: RequestInit & { token?: string }, ms = 15000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(`${URL_SUPA}/auth/v1${caminho}`, {
      ...init,
      signal: ctl.signal,
      headers: {
        apikey: CHAVE_PUBLICA,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${init.token || CHAVE_PUBLICA}`,
      },
    });
    const corpo = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, corpo };
  } finally {
    clearTimeout(t);
  }
}

const comTempo = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('tempo')), ms))]);

const Olho = ({ aberto }: { aberto: boolean }) => aberto ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.2A9.7 9.7 0 0 1 12 5c5 0 9 4.5 10 7a12.7 12.7 0 0 1-3.2 4.2M6.1 6.4C3.9 7.8 2.5 9.9 2 12c1 2.5 5 7 10 7 1.7 0 3.2-.5 4.6-1.2" /></svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
);

function forca(s: string) {
  if (!s) return { n: 0, txt: '' };
  if (s.length < 6) return { n: 1, txt: 'Curta demais' };
  const tipos = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(s)).length;
  if (s.length < 8 || tipos <= 1) return { n: 2, txt: 'Fraca' };
  if (tipos === 2) return { n: 3, txt: 'Boa' };
  return { n: 4, txt: 'Forte' };
}

export default function DefinirSenhaPage() {
  useFonteSite();
  useTituloPagina('Criar sua senha · EXA Mídia', 'Crie a senha da sua conta de anunciante da EXA Mídia.');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const th = params.get('th');
  const tipo = params.get('t') || 'recovery';
  const emailLink = params.get('e') || '';

  // link antigo: tokens no endereço (#access_token=…)
  const [sessaoDoLink] = useState<Sessao | null>(() => {
    try {
      const h = new URLSearchParams(window.location.hash.slice(1));
      const a = h.get('access_token'), r = h.get('refresh_token');
      return a && r ? { access_token: a, refresh_token: r } : null;
    } catch { return null; }
  });
  const erroNoLink = (() => {
    try {
      const h = new URLSearchParams(window.location.hash.slice(1));
      return !!(h.get('error') || h.get('error_code'));
    } catch { return false; }
  })();

  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [ver, setVer] = useState(false);
  const [aviso, setAviso] = useState('');
  const [etapa, setEtapa] = useState<Etapa>(() => (th || sessaoDoLink ? 'form' : 'expirado'));
  const [emailFinal, setEmailFinal] = useState(emailLink);

  useEffect(() => { if (erroNoLink) setEtapa('expirado'); }, [erroNoLink]);

  const f = forca(senha);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setAviso('');
    if (senha.length < 6) { setAviso('A senha precisa ter pelo menos 6 caracteres.'); return; }
    if (senha !== confirma) { setAviso('As duas senhas não estão iguais.'); return; }
    setEtapa('salvando');
    try {
      // 1) sessão do próprio link (nunca a que já estava aberta no aparelho)
      let sessao: Sessao | null = sessaoDoLink;
      if (th) {
        const v = await chamarAuth('/verify', { method: 'POST', body: JSON.stringify({ type: tipo, token_hash: th }) });
        if (!v.ok || !v.corpo?.access_token) {
          const msg = String(v.corpo?.msg || v.corpo?.error_description || v.corpo?.message || '');
          console.warn('[DEFINIR SENHA] verify', v.status, msg);
          setEtapa(v.status === 403 || v.status === 401 || /expired|not found|invalid/i.test(msg) ? 'expirado' : 'erro');
          return;
        }
        sessao = v.corpo as Sessao;
      }
      if (!sessao) { setEtapa('expirado'); return; }

      // 2) grava a senha com o token do link (chamada direta, com tempo-limite)
      const u = await chamarAuth('/user', { method: 'PUT', token: sessao.access_token, body: JSON.stringify({ password: senha, data: { has_password: true } }) });
      if (!u.ok) {
        const msg = String(u.corpo?.msg || u.corpo?.message || '');
        console.warn('[DEFINIR SENHA] update', u.status, msg);
        if (/same|different from the old/i.test(msg)) { setAviso('Essa já é a sua senha. Use outra ou entre com ela.'); setEtapa('form'); return; }
        if (/weak|short|characters/i.test(msg)) { setAviso('Senha fraca demais. Use pelo menos 8 caracteres, com letras e números.'); setEtapa('form'); return; }
        setEtapa(u.status === 401 || u.status === 403 ? 'expirado' : 'erro');
        return;
      }
      const email = u.corpo?.email || sessao.user?.email || emailLink;
      setEmailFinal(email);

      // 3) entra na conta com a sessão nova (sem travar: se demorar, segue pelo botão)
      try {
        await comTempo(supabase.auth.setSession({ access_token: sessao.access_token, refresh_token: sessao.refresh_token }), 6000);
        if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (err) {
        console.warn('[DEFINIR SENHA] setSession lento; segue pelo botão', err);
      }
      setEtapa('pronto');
      setTimeout(() => navigate('/anunciante/pedidos', { replace: true }), 1800);
    } catch (err) {
      console.error('[DEFINIR SENHA] erro', err);
      setEtapa('erro');
    }
  };

  const pedirNovo = waSofia(`Oi Sofia! O link para criar a senha da minha conta${emailLink ? ` (${emailLink})` : ''} não funcionou. Pode me mandar um novo?`);

  return (
    <div className="exa-login">
      <img className="el-amb" src="/site/tela-real.jpg" alt="" aria-hidden="true" />
      <span className="el-veu" aria-hidden="true" />
      <Link className="el-marca" to="/" aria-label="EXA, início"><img src="/site/exa-branco.svg" alt="EXA" width={96} height={42} /></Link>

      {(etapa === 'form' || etapa === 'salvando') && (
        <form className="el-cartao" onSubmit={salvar} aria-label="Criar senha" noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
            <h1 className="el-t">Crie sua senha</h1>
            <p className="el-p">{emailLink ? <>Para entrar como <strong style={{ color: '#fff' }}>{emailLink}</strong>.</> : 'É com ela que você entra na sua área de anunciante.'}</p>
          </div>
          {aviso && <div className="el-msg" role="alert">{aviso}</div>}
          {emailLink && <input type="email" name="email" autoComplete="username" value={emailLink} readOnly hidden />}
          <div className="el-campo">
            <label htmlFor="s1">Nova senha</label>
            <div className="el-inp">
              <input id="s1" type={ver ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo de 6 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} disabled={etapa === 'salvando'} style={{ paddingRight: 54 }} />
              <button className="el-olho" type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Esconder senha' : 'Mostrar senha'}><Olho aberto={ver} /></button>
            </div>
            {!!senha && (
              <div className="el-forca" aria-live="polite">
                <span className="el-barras">{[1, 2, 3, 4].map((i) => <i key={i} className={i <= f.n ? `on n${f.n}` : ''} />)}</span>
                <span>{f.txt}</span>
              </div>
            )}
          </div>
          <div className="el-campo">
            <label htmlFor="s2">Repita a senha</label>
            <input id="s2" type={ver ? 'text' : 'password'} autoComplete="new-password" placeholder="Digite de novo" value={confirma} onChange={(e) => setConfirma(e.target.value)} disabled={etapa === 'salvando'} className={confirma && confirma !== senha ? 'erro' : ''} />
          </div>
          <button className="el-b" type="submit" disabled={etapa === 'salvando'}>
            {etapa === 'salvando' ? <><span className="el-gira" aria-hidden="true" />Salvando</> : 'Criar senha e entrar'}
          </button>
        </form>
      )}

      {etapa === 'pronto' && (
        <div className="el-cartao" role="status" style={{ alignItems: 'center', textAlign: 'center' }}>
          <span className="el-ok" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg></span>
          <h1 className="el-t" style={{ fontSize: 30 }}>Senha criada.</h1>
          <p className="el-p">Abrindo a sua área de anunciante…</p>
          <button className="el-b" type="button" onClick={() => navigate('/anunciante/pedidos', { replace: true })}>Entrar agora</button>
          <Link className="el-lnk" to={`/login${emailFinal ? `?email=${encodeURIComponent(emailFinal)}` : ''}`}>Entrar com e-mail e senha</Link>
        </div>
      )}

      {(etapa === 'expirado' || etapa === 'erro') && (
        <div className="el-cartao" role="alert" style={{ alignItems: 'center', textAlign: 'center' }}>
          <h1 className="el-t" style={{ fontSize: 30 }}>{etapa === 'expirado' ? 'Este link já foi usado ou expirou' : 'Não consegui salvar agora'}</h1>
          <p className="el-p">{etapa === 'expirado'
            ? 'Por segurança, cada link funciona uma vez só. Peça um novo para a Sofia: ele chega na hora no seu WhatsApp.'
            : 'A conexão falhou no meio do caminho. Tente de novo; se continuar, a Sofia manda um link novo.'}</p>
          {etapa === 'erro' && <button className="el-b" type="button" onClick={() => setEtapa('form')}>Tentar de novo</button>}
          <a className="el-b el-b-wa" href={pedirNovo} target="_blank" rel="noopener noreferrer">Pedir novo link à Sofia</a>
          <Link className="el-lnk" to="/login">Já tenho senha · Entrar</Link>
        </div>
      )}

      <nav className="el-pe" aria-label="Ajuda">
        <span>Dúvidas? <a href={waSofia('Oi Sofia, preciso de ajuda para acessar a minha conta.')} target="_blank" rel="noopener noreferrer">Fale com a Sofia</a></span>
      </nav>
    </div>
  );
}
