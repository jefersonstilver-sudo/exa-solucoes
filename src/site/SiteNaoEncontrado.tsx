import React from 'react';
import { Link } from 'react-router-dom';
import { useFonteSite, useTituloPagina } from './comum';

/** 404 — "Esse andar não existe." (Opção 2) */
export default function SiteNaoEncontrado() {
  useFonteSite();
  useTituloPagina('Página não encontrada · EXA Mídia');
  const andares: [string, string, string][] = [['T', 'Início', '/'], ['1', 'Prédios', '/loja'], ['2', 'Síndico', '/sou-sindico'], ['3', 'Entrar', '/login']];
  return (
    <div className="exa-site nf-404">
      <span className="nf-amb" aria-hidden="true" />
      <Link to="/" aria-label="EXA, início" style={{ position: 'relative', marginBottom: 36 }}><img src="/site/exa-branco.svg" alt="EXA" width={56} height={24} style={{ height: 24, width: 'auto', display: 'block' }} /></Link>
      <nav className="nf-card" aria-label="Escolha um andar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }} role="img" aria-label="Andar 404, não encontrado">
          <svg className="nf-seta" width="22" height="26" viewBox="0 0 26 30" aria-hidden="true"><path d="M13 2L24 16H17V28H9V16H2Z" fill="currentColor" /></svg>
          <span className="nf-dig">404</span>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          {andares.map(([n, l, to]) => <Link key={to} className="nf-key" to={to}><span className="c">{n}</span>{l}</Link>)}
        </div>
      </nav>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 36, maxWidth: 440 }}>
        <h1 className="t" style={{ fontSize: 'clamp(32px,5vw,40px)' }}>Esse andar não existe.</h1>
        <p style={{ margin: 0, color: 'rgba(255,255,255,.65)', fontSize: 17 }}>Escolha um andar acima ou volte para o início.</p>
        <Link className="b bw" to="/">Voltar para o início</Link>
      </div>
    </div>
  );
}
