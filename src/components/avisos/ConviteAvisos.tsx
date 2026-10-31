import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { adiarConvite, ativarAvisos, conviteAdiado, emApp, estadoAvisos, renovarAvisosSeguro, testarAvisos, type EstadoAvisos } from '@/lib/avisos';

/**
 * Convite para ligar os avisos no app da tela de início (aparece uma vez; "Agora não" volta em 7 dias).
 * Não aparece no navegador comum nem durante "Acessar como cliente".
 */
export const ConviteAvisos: React.FC<{ publico: 'equipe' | 'cliente' }> = ({ publico }) => {
  const [mostrar, setMostrar] = useState(false);
  const [estado, setEstado] = useState<EstadoAvisos | 'ativando' | 'pronto' | 'erro'>('pendente');

  useEffect(() => {
    if (!emApp() || new URLSearchParams(window.location.search).has('impersonate')) return;
    let vivo = true;
    estadoAvisos().then((e) => {
      if (!vivo) return;
      if (e === 'ativo') { renovarAvisosSeguro(); return; }
      if (e === 'pendente' && !conviteAdiado()) window.setTimeout(() => vivo && setMostrar(true), 2500);
    });
    return () => { vivo = false; };
  }, []);

  if (!mostrar) return null;

  const ativar = async () => {
    setEstado('ativando');
    try {
      const r = await ativarAvisos();
      if (r === 'ativo') { setEstado('pronto'); testarAvisos().catch(() => null); window.setTimeout(() => setMostrar(false), 2200); }
      else { setEstado(r); if (r !== 'bloqueado') adiarConvite(); }
    } catch { setEstado('erro'); }
  };

  const texto = publico === 'equipe'
    ? 'Vendas, vídeos prontos, painéis fora do ar e ocorrências da Sofia chegam na hora.'
    : 'Saiba na hora quando o seu vídeo ficar pronto e entrar no ar.';

  return (
    <div role="dialog" aria-label="Ativar avisos" style={{ position: 'fixed', left: 12, right: 12, bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))', zIndex: 60, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: 420, borderRadius: 20, padding: '14px 14px 12px', background: 'rgba(23,24,26,.94)', color: '#fff', boxShadow: '0 18px 40px -18px rgba(0,0,0,.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', fontFamily: 'Manrope, system-ui, sans-serif', animation: 'exaAvisoSobe .45s cubic-bezier(.2,.8,.2,1) both' }}>
        <style>{'@keyframes exaAvisoSobe{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}'}</style>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ flex: 'none', width: 36, height: 36, borderRadius: 12, background: '#EA251D', display: 'grid', placeItems: 'center' }}><Bell size={18} color="#fff" /></span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.01em' }}>
              {estado === 'pronto' ? 'Avisos ativados' : estado === 'bloqueado' ? 'Avisos bloqueados' : 'Ativar avisos neste iPhone'}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.4, color: 'rgba(255,255,255,.72)', marginTop: 2 }}>
              {estado === 'pronto' ? 'Mandei um aviso de teste.'
                : estado === 'bloqueado' ? 'Libere em Ajustes › Notificações › EXA Mídia.'
                : estado === 'erro' ? 'Não deu certo agora. Tente de novo em instantes.'
                : texto}
            </div>
          </div>
        </div>
        {estado !== 'pronto' && estado !== 'bloqueado' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={() => { adiarConvite(); setMostrar(false); }} style={{ flex: 1, height: 40, borderRadius: 12, border: 0, background: 'rgba(255,255,255,.1)', color: '#fff', fontWeight: 700, fontSize: 14 }}>Agora não</button>
            <button type="button" onClick={ativar} disabled={estado === 'ativando'} style={{ flex: 1.4, height: 40, borderRadius: 12, border: 0, background: '#fff', color: '#17181A', fontWeight: 800, fontSize: 14, opacity: estado === 'ativando' ? 0.7 : 1 }}>{estado === 'ativando' ? 'Ativando…' : 'Ativar avisos'}</button>
          </div>
        )}
        {estado === 'bloqueado' && (
          <div style={{ display: 'flex', marginTop: 10 }}>
            <button type="button" onClick={() => setMostrar(false)} style={{ flex: 1, height: 38, borderRadius: 12, border: 0, background: 'rgba(255,255,255,.1)', color: '#fff', fontWeight: 700, fontSize: 14 }}>Entendi</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConviteAvisos;
