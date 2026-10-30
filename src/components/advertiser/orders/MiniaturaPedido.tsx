import React, { useEffect, useState } from 'react';
import { miniaturaGuardada, pedirMiniatura } from '@/lib/miniaturaVideo';

/**
 * Miniatura do vídeo no ar, na lista de pedidos do celular.
 * Guardada no aparelho → aparece na hora; enquanto não existe, um brilho suave (não o quadrado preto)
 * e a imagem entra com fade. Se não der para tirar o quadro, cai no <video> de antes.
 */
export const MiniaturaPedido: React.FC<{ url: string; visivel: boolean }> = ({ url, visivel }) => {
  const [img, setImg] = useState<string | null>(() => miniaturaGuardada(url));
  const [falhou, setFalhou] = useState(false);
  const [carregou, setCarregou] = useState(() => !!miniaturaGuardada(url));

  useEffect(() => {
    const ja = miniaturaGuardada(url);
    setImg(ja);
    setCarregou(!!ja);
    setFalhou(false);
  }, [url]);

  useEffect(() => {
    if (img || falhou || !visivel) return;
    let vivo = true;
    pedirMiniatura(url).then((dado) => {
      if (!vivo) return;
      if (dado) setImg(dado); else setFalhou(true);
    });
    return () => { vivo = false; };
  }, [url, img, falhou, visivel]);

  if (falhou) {
    return <video src={`${url}#t=1`} className="h-full w-full object-cover" muted playsInline preload="metadata" aria-hidden="true" />;
  }
  return (
    <>
      {!carregou && <span className="exa-mini-brilho absolute inset-0" aria-hidden="true" />}
      {img && (
        <img
          src={img}
          alt=""
          aria-hidden="true"
          onLoad={() => setCarregou(true)}
          className="h-full w-full object-cover"
          style={{ opacity: carregou ? 1 : 0, transition: 'opacity .35s ease' }}
        />
      )}
      <style>{`.exa-mini-brilho{background:linear-gradient(110deg,#2a2527 30%,#3a3436 50%,#2a2527 70%);background-size:220% 100%;animation:exaMiniBrilho 1.3s linear infinite}@keyframes exaMiniBrilho{from{background-position:120% 0}to{background-position:-100% 0}}@media (prefers-reduced-motion:reduce){.exa-mini-brilho{animation:none}}`}</style>
    </>
  );
};
