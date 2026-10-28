import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLoginForm } from '@/components/auth/hooks/useLoginForm';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import { useFonteSite, useTituloPagina, waSofia } from '@/site/comum';

/**
 * Entrar (rota /login) — layout novo aprovado (Opção 2): fundo escuro com a tela EXA desfocada,
 * cartão de vidro, botão branco. Mesma lógica de sempre (useLoginForm: e-mail não confirmado,
 * bloqueio, 2FA, papel do usuário) e mesmo "esqueci a senha" (usePasswordReset, com espera).
 */
type Vista = 'entrar' | 'esqueci' | 'enviado';

const Olho = ({ aberto }: { aberto: boolean }) => aberto ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.2A9.7 9.7 0 0 1 12 5c5 0 9 4.5 10 7a12.7 12.7 0 0 1-3.2 4.2M6.1 6.4C3.9 7.8 2.5 9.9 2 12c1 2.5 5 7 10 7 1.7 0 3.2-.5 4.6-1.2" /></svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
);

export default function Login() {
  useFonteSite();
  useTituloPagina('Entrar · EXA Mídia', 'Entre na sua área de anunciante da EXA Mídia.');
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, userProfile, isLoading } = useAuth();
  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/anunciante/pedidos';
  const { email, setEmail, password, setPassword, isLoading: entrando, error, handleSubmit } = useLoginForm(redirectPath);
  const [vista, setVista] = useState<Vista>('entrar');
  const [verSenha, setVerSenha] = useState(false);
  const { sendReset, isLoading: enviando, cooldown } = usePasswordReset(email, { onSuccess: () => setVista('enviado') });

  // já logado: vai para a área certa
  useEffect(() => {
    if (isLoading || !isLoggedIn || !userProfile) return;
    let destino = redirectPath;
    if (userProfile.role === 'super_admin') destino = redirectPath.startsWith('/super_admin') ? redirectPath : '/super_admin';
    else if (['admin', 'admin_marketing', 'admin_financeiro'].includes(userProfile.role)) destino = redirectPath.startsWith('/admin') ? redirectPath : '/admin';
    navigate(destino, { replace: true });
  }, [isLoggedIn, userProfile, isLoading, navigate, redirectPath]);

  const pedirLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || cooldown > 0) return;
    await sendReset();
  };

  return (
    <div className="exa-login">
      <img className="el-amb" src="/site/tela-real.jpg" alt="" aria-hidden="true" />
      <span className="el-veu" aria-hidden="true" />
      <Link className="el-marca" to="/" aria-label="EXA, início"><img src="/site/exa-branco.svg" alt="EXA" width={96} height={42} /></Link>

      {vista === 'entrar' && (
        <form className="el-cartao" onSubmit={handleSubmit} aria-label="Entrar" noValidate>
          <h1 className="el-t">Entrar</h1>
          {error && <div className="el-msg" role="alert">{error === 'Email ou senha incorretos' ? 'E-mail ou senha não conferem. Tente de novo ou crie uma nova senha.' : error}</div>}
          <div className="el-campo">
            <label htmlFor="em">E-mail</label>
            <input id="em" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" placeholder="voce@empresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} disabled={entrando} />
          </div>
          <div className="el-campo">
            <div className="el-linha"><label htmlFor="pw">Senha</label><button className="el-lnk" type="button" onClick={() => setVista('esqueci')}>Esqueci a senha</button></div>
            <div className={`el-inp${error ? ' el-treme' : ''}`}>
              <input id="pw" type={verSenha ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={entrando} className={error ? 'erro' : ''} style={{ paddingRight: 54 }} />
              <button className="el-olho" type="button" onClick={() => setVerSenha((v) => !v)} aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}><Olho aberto={verSenha} /></button>
            </div>
          </div>
          <button className="el-b" type="submit" disabled={entrando}>
            {entrando ? <><span className="el-gira" aria-hidden="true" />Entrando</> : 'Entrar'}
          </button>
        </form>
      )}

      {vista === 'esqueci' && (
        <form className="el-cartao" onSubmit={pedirLink} aria-label="Nova senha">
          <button className="el-lnk" type="button" onClick={() => setVista('entrar')} style={{ alignSelf: 'flex-start' }}>← Voltar</button>
          <h1 className="el-t" style={{ fontSize: 30 }}>Nova senha</h1>
          <p className="el-p">Mandamos um link para o seu e-mail.</p>
          <div className="el-campo">
            <label htmlFor="em2">E-mail</label>
            <input id="em2" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" placeholder="voce@empresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} disabled={enviando} />
          </div>
          <button className="el-b" type="submit" disabled={enviando || cooldown > 0 || !email.trim()}>
            {enviando ? <><span className="el-gira" aria-hidden="true" />Enviando</> : cooldown > 0 ? `Aguarde ${cooldown} s` : 'Enviar link'}
          </button>
        </form>
      )}

      {vista === 'enviado' && (
        <div className="el-cartao" role="status">
          <span className="el-ok" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg></span>
          <h1 className="el-t" style={{ fontSize: 30, textAlign: 'left' }}>Link enviado</h1>
          <p className="el-p">Se {email || 'o seu e-mail'} tiver conta, o link chega em alguns minutos.</p>
          <button className="el-b" type="button" onClick={() => setVista('entrar')}>Voltar</button>
        </div>
      )}

      <nav className="el-pe" aria-label="Outros acessos">
        <span>Ainda não anuncia? <a href={waSofia('Oi Sofia, quero anunciar')} target="_blank" rel="noopener noreferrer">Fale com a Sofia</a></span>
        <span>Síndico? <a href="/paineldosindico">Painel do Síndico</a></span>
      </nav>
    </div>
  );
}
