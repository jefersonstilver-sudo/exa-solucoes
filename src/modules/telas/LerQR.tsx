/**
 * Lê o QR Code que a TV mostra ("Aguardando conexão") com a câmera do celular e devolve o código de 6 números.
 * Usa o BarcodeDetector do navegador quando existe (Android/Chrome); senão o jsQR (iPhone/Safari), carregado sob demanda
 * de /vendor/jsqr-1.4.0.js.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

/** Aceita o link do QR (examidia.com.br/conectar?c=123456) ou só os números. */
export function codigoDoQR(texto: string): string | null {
  const t = String(texto || '').trim();
  try {
    const u = new URL(t);
    const c = (u.searchParams.get('c') || '').replace(/\D/g, '');
    if (c.length === 6) return c;
  } catch { /* não é link */ }
  const m = t.match(/(?:^|\D)(\d{6})(?:\D|$)/);
  return m ? m[1] : null;
}

let carregandoJsQR: Promise<any> | null = null;
function jsQR(): Promise<any> {
  const w = window as any;
  if (w.jsQR) return Promise.resolve(w.jsQR);
  if (!carregandoJsQR) {
    carregandoJsQR = new Promise((ok, falha) => {
      const s = document.createElement('script');
      s.src = '/vendor/jsqr-1.4.0.js';
      s.async = true;
      s.onload = () => (w.jsQR ? ok(w.jsQR) : falha(new Error('leitor não carregou')));
      s.onerror = () => { carregandoJsQR = null; falha(new Error('leitor não carregou')); };
      document.head.appendChild(s);
    });
  }
  return carregandoJsQR;
}

export function LerQR({ onCodigo, onFechar }: { onCodigo: (c: string) => void; onFechar: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let vivo = true;
    let fluxo: MediaStream | null = null;
    let timer = 0;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true } as any) as CanvasRenderingContext2D | null;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setErro('Este navegador não abre a câmera. Digite o código que aparece na TV.'); return; }
      try {
        fluxo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      } catch {
        setErro('Não consegui abrir a câmera. Libere o acesso à câmera para examidia.com.br nas configurações do navegador, ou digite o código.');
        return;
      }
      if (!vivo) { fluxo.getTracks().forEach((t) => t.stop()); return; }
      const v = video.current!;
      v.srcObject = fluxo;
      v.setAttribute('playsinline', 'true');
      await v.play().catch(() => {});

      const BD = (window as any).BarcodeDetector;
      let detector: any = null;
      if (BD) { try { detector = new BD({ formats: ['qr_code'] }); } catch { detector = null; } }
      let leitor: any = null;
      if (!detector) { try { leitor = await jsQR(); } catch (e) { setErro('Não consegui carregar o leitor de QR. Digite o código.'); return; } }

      const olhar = async () => {
        if (!vivo) return;
        try {
          if (v.readyState >= 2 && v.videoWidth) {
            let texto = '';
            if (detector) {
              const r = await detector.detect(v);
              texto = r?.[0]?.rawValue || '';
            } else if (ctx && leitor) {
              const esc = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
              canvas.width = Math.round(v.videoWidth * esc); canvas.height = Math.round(v.videoHeight * esc);
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              texto = leitor(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data || '';
            }
            if (texto) {
              const c = codigoDoQR(texto);
              if (c) { if (navigator.vibrate) navigator.vibrate(60); onCodigo(c); return; }
              setAviso('Esse QR não é de uma TV EXA. Aponte para o QR da tela "Aguardando conexão".');
            }
          }
        } catch { /* quadro ruim, tenta o próximo */ }
        timer = window.setTimeout(olhar, 180);
      };
      olhar();
    })();

    return () => { vivo = false; clearTimeout(timer); fluxo?.getTracks().forEach((t) => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-3xl bg-black">
        <video ref={video} muted playsInline className="h-full w-full object-cover" />
        {!erro && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative h-[62%] w-[62%]">
              {['left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl', 'right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl', 'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-2xl', 'right-0 bottom-0 border-r-4 border-b-4 rounded-br-2xl'].map((c) => (
                <i key={c} className={`absolute h-10 w-10 border-white ${c}`} />
              ))}
              <i className="absolute inset-x-2 top-1/2 h-[2px] animate-pulse bg-[#ff5a4a] shadow-[0_0_12px_#ff5a4a]" />
            </div>
          </div>
        )}
        {erro && <div className="absolute inset-0 grid place-items-center p-6 text-center text-[14px] font-semibold text-white">{erro}</div>}
        <button type="button" onClick={onFechar} aria-label="Fechar câmera" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white"><X className="h-4 w-4" /></button>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-[#5E5F63]"><Camera className="h-4 w-4" />{aviso || 'Aponte para o QR Code que aparece na TV'}</p>
    </div>
  );
}
