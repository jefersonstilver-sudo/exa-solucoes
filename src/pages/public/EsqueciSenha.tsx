import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import exaLogo from '@/assets/exa-logo.png';

/** /esqueci-senha — envia o link de redefinição (que abre /reset-password). */
const EsqueciSenha = () => {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'livre' | 'enviando' | 'enviado' | 'erro'>('livre');

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEstado('enviando');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Mesmo resultado na tela exista ou não a conta, para não revelar e-mails cadastrados.
    setEstado(error && !/rate|limit/i.test(error.message) ? 'erro' : 'enviado');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white/80 backdrop-blur-xl border border-black/5 shadow-[0_20px_50px_-30px_rgba(70,20,20,0.4)] p-7">
        <img src={exaLogo} alt="EXA" className="h-10 w-auto mb-6" />
        <h1 className="text-2xl font-extrabold tracking-tight text-[#17181A]">Esqueci minha senha</h1>
        {estado === 'enviado' ? (
          <p className="mt-3 text-sm text-[#45464A] leading-relaxed">
            Se houver uma conta com <strong>{email}</strong>, enviamos um link para criar uma nova senha. Confira também a caixa de spam.
          </p>
        ) : (
          <form onSubmit={enviar} className="mt-4 flex flex-col gap-3">
            <label className="text-sm font-semibold text-[#45464A]" htmlFor="email">E-mail da conta</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl border border-black/10 bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-[#B4231C]"
            />
            {estado === 'erro' && <p className="text-sm text-[#B0261D]">Não consegui enviar agora. Tente de novo em alguns minutos.</p>}
            <button
              type="submit"
              disabled={estado === 'enviando'}
              className="h-12 rounded-xl bg-[#9C1E1E] text-white font-bold disabled:opacity-60"
            >
              {estado === 'enviando' ? 'Enviando…' : 'Enviar link'}
            </button>
          </form>
        )}
        <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-[#9C1E1E]">Voltar ao login</Link>
      </div>
    </div>
  );
};

export default EsqueciSenha;
