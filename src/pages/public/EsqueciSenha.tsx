import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCorNavegador } from '@/lib/corNavegador';
import { useFonteSite, useTituloPagina, waSofia } from '@/site/comum';
import Turnstile, { conferirCaptcha } from '@/components/seguranca/Turnstile';

/**
 * /esqueci-senha — envia o link de redefinição (que abre /reset-password).
 * Mesmo visual escuro do login (antes era um cartão claro com a logo branca sumindo no fundo).
 */
const EsqueciSenha = () => {
  useFonteSite();
  useTituloPagina('Esqueci minha senha · EXA Mídia');
  useCorNavegador({ topo: '#0B0B0D', fundo: '#0B0B0D' });
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'livre' | 'enviando' | 'enviado' | 'erro' | 'robo'>('livre');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReinicio, setCaptchaReinicio] = useState(0);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !captchaToken) return;
    setEstado('enviando');
    const captchaOk = await conferirCaptcha(captchaToken, 'esqueci-senha');
    setCaptchaToken('');
    setCaptchaReinicio((n) => n + 1);
    if (!captchaOk) { setEstado('robo'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Mesmo resultado na tela exista ou não a conta, para não revelar e-mails cadastrados.
    setEstado(error && !/rate|limit/i.test(error.message) ? 'erro' : 'enviado');
  };

  return (
    <div className="exa-login">
      <img className="el-amb" src="/site/tela-real.jpg" alt="" aria-hidden="true" />
      <span className="el-veu" aria-hidden="true" />
      <Link className="el-marca" to="/" aria-label="EXA, início"><img src="/site/exa-branco.svg" alt="EXA" width={96} height={42} /></Link>

      {estado === 'enviado' ? (
        <div className="el-cartao" role="status" style={{ alignItems: 'center', textAlign: 'center' }}>
          <h1 className="el-t" style={{ fontSize: 30 }}>Confira seu e-mail</h1>
          <p className="el-p">Se houver uma conta com <strong style={{ color: '#fff' }}>{email}</strong>, enviamos um link para criar uma nova senha. Olhe também a caixa de spam.</p>
          <Link className="el-b" to="/login" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Voltar ao login</Link>
        </div>
      ) : (
        <form className="el-cartao" onSubmit={enviar} aria-label="Esqueci minha senha" noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
            <h1 className="el-t">Esqueci a senha</h1>
            <p className="el-p">Digite o e-mail da conta. Mandamos um link para você criar uma senha nova.</p>
          </div>
          {estado === 'erro' && <div className="el-msg" role="alert">Não consegui enviar agora. Tente de novo em alguns minutos.</div>}
          {estado === 'robo' && <div className="el-msg" role="alert">Não consegui confirmar que você não é um robô. Marque a caixa de novo.</div>}
          <div className="el-campo">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="voce@empresa.com.br"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={estado === 'enviando'}
            />
          </div>
          <Turnstile onToken={setCaptchaToken} reiniciar={captchaReinicio} tema="dark" />
          <button className="el-b" type="submit" disabled={estado === 'enviando' || !email.trim() || !captchaToken}>
            {estado === 'enviando' ? <><span className="el-gira" aria-hidden="true" />Enviando</> : 'Enviar link'}
          </button>
          <Link className="el-lnk" to="/login" style={{ textAlign: 'center' }}>Lembrei · Voltar ao login</Link>
        </form>
      )}

      <nav className="el-pe" aria-label="Ajuda">
        <span>Prefere pelo WhatsApp? <a href={waSofia('Oi Sofia, esqueci minha senha. Pode me mandar um link para criar uma nova?')} target="_blank" rel="noopener noreferrer">Fale com a Sofia</a></span>
      </nav>
    </div>
  );
};

export default EsqueciSenha;
