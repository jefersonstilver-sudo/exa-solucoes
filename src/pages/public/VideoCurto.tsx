import React from 'react';
import { useParams } from 'react-router-dom';
import { useCorNavegador } from '@/lib/corNavegador';

/**
 * Link curto dos vídeos que a Sofia cria: examidia.com.br/v/<id> abre o MP4 do bucket sofia-videos.
 * O WhatsApp não transformava em link o endereço longo do Supabase nos alertas para o CEO
 * (o texto chegava inteiro, mas não dava para tocar); o domínio da EXA ele reconhece.
 */
const SB = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/sofia-videos/';

export default function VideoCurto() {
  useCorNavegador({ topo: '#0B0B0D', fundo: '#0B0B0D' });
  const { id = '' } = useParams();
  const ok = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const url = ok ? `${SB}${id.toLowerCase()}.mp4` : '';
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0B0B0D', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 'max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))', fontFamily: 'Manrope, system-ui, sans-serif', color: '#fff' }}>
      {ok ? (
        <>
          <video src={url} controls autoPlay muted playsInline style={{ maxWidth: '100%', maxHeight: 'calc(100% - 70px)', borderRadius: 14, background: '#000' }} />
          <a href={url} download style={{ color: 'rgba(255,255,255,.75)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Baixar o vídeo</a>
        </>
      ) : (
        <p style={{ margin: 0, color: 'rgba(255,255,255,.7)' }}>Link de vídeo inválido.</p>
      )}
    </div>
  );
}
