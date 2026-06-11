import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Download, FileText, Play, Pause, AlertCircle } from 'lucide-react';
import { fetchMediaDataUrl, type EvoMessage } from '../lib/evolutionClient';
import { cn } from '@/lib/utils';

interface Props {
  instance: string;
  message: EvoMessage;
  fromMe: boolean;
}

export const MessageMedia: React.FC<Props> = ({ instance, message, fromMe }) => {
  const { mediaType, mediaFileName, mediaMime, directUrl, raw } = message;
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(mediaType === 'image' || mediaType === 'sticker');
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (!open || dataUrl || requested.current) return;
    requested.current = true;
    setLoading(true);
    fetchMediaDataUrl(instance, raw, { convertToMp4: mediaType === 'video' })
      .then((url) => {
        if (url) setDataUrl(url);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [open, dataUrl, instance, raw, mediaType]);

  useEffect(() => {
    return () => {
      if (dataUrl && dataUrl.startsWith('blob:')) URL.revokeObjectURL(dataUrl);
    };
  }, [dataUrl]);

  const extFromMime = (mime?: string) => {
    if (!mime) return 'bin';
    const m = mime.split(';')[0].trim();
    const map: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
      'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
      'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/wav': 'wav',
      'application/pdf': 'pdf',
    };
    return map[m] || m.split('/')[1] || 'bin';
  };

  const downloadFile = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = mediaFileName || `whatsapp-${message.id}.${extFromMime(mediaMime)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play();
    setPlaying(!playing);
  };

  if (!mediaType) return null;

  if (mediaType === 'image' || mediaType === 'sticker') {
    const sizeClass = mediaType === 'sticker' ? 'w-32 h-32 object-contain' : 'max-w-[260px] max-h-[320px] object-cover';
    return (
      <div className="mb-1.5 relative inline-block group">
        {loading && (
          <div className={cn('flex items-center justify-center bg-black/5 rounded-lg', mediaType === 'sticker' ? 'w-32 h-32' : 'w-[220px] h-[160px]')}>
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
        {error && !loading && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 rounded-md px-2 py-1">
            <AlertCircle className="w-3 h-3" /> Falha ao carregar mídia
          </div>
        )}
        {dataUrl && !loading && (
          <>
            <img
              src={dataUrl}
              alt={message.text || 'Imagem'}
              className={cn('rounded-lg cursor-pointer', sizeClass)}
              onClick={() => window.open(dataUrl, '_blank')}
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); downloadFile(); }}
              title="Baixar"
              className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <Download className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    );
  }

  if (mediaType === 'audio') {
    return (
      <div className={cn('mb-1.5 flex items-center gap-2 rounded-full px-2.5 py-1.5', fromMe ? 'bg-white/15' : 'bg-black/5')}>
        <button
          onClick={() => {
            if (!dataUrl) setOpen(true);
            else togglePlay();
          }}
          className={cn('w-7 h-7 rounded-full flex items-center justify-center', fromMe ? 'bg-white/25 hover:bg-white/35' : 'bg-black/10 hover:bg-black/20')}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        {dataUrl && (
          <audio
            ref={audioRef}
            src={dataUrl}
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            controls
            className="h-7 max-w-[200px]"
          />
        )}
        {!dataUrl && <span className="text-[11px] opacity-80">Áudio</span>}
        {dataUrl && (
          <button
            type="button"
            onClick={downloadFile}
            title="Baixar áudio"
            className={cn('w-6 h-6 rounded-full flex items-center justify-center', fromMe ? 'bg-white/20 hover:bg-white/30' : 'bg-black/10 hover:bg-black/20')}
          >
            <Download className="w-3 h-3" />
          </button>
        )}
        {error && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className="mb-1.5">
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-black/5 hover:bg-black/10 text-xs"
          >
            <Play className="w-3.5 h-3.5" /> Carregar vídeo
          </button>
        ) : loading ? (
          <div className="flex items-center justify-center w-[240px] h-[160px] bg-black/5 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : dataUrl ? (
          <div className="relative inline-block group">
            <video
              key={dataUrl}
              src={dataUrl}
              controls
              playsInline
              preload="metadata"
              controlsList="nodownload"
              className="max-w-[280px] rounded-lg bg-black"
              onError={(e) => {
                const v = e.currentTarget;
                console.error('[MessageMedia] video error', {
                  code: v.error?.code,
                  message: v.error?.message,
                  src: v.currentSrc,
                  mime: mediaMime,
                });
              }}
            />
            <button
              type="button"
              onClick={downloadFile}
              title="Baixar vídeo"
              className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            >
              <Download className="w-4 h-4" />
            </button>
            <div className="text-[10px] opacity-60 mt-1">
              Se não tocar aqui, baixe e abra em outro player. WhatsApp usa codecs que nem todo navegador suporta.
            </div>
          </div>
        ) : (
          <div className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Falha ao carregar vídeo</div>
        )}
      </div>
    );
  }

  // document
  return (
    <div className="mb-1.5">
      {dataUrl ? (
        <a
          href={dataUrl}
          download={mediaFileName || 'arquivo'}
          className={cn('flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs', fromMe ? 'bg-white/15 hover:bg-white/25' : 'bg-black/5 hover:bg-black/10')}
        >
          <FileText className="w-4 h-4" />
          <span className="truncate max-w-[180px]">{mediaFileName || 'Documento'}</span>
          <Download className="w-3.5 h-3.5 ml-1 opacity-70" />
        </a>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={cn('flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs', fromMe ? 'bg-white/15 hover:bg-white/25' : 'bg-black/5 hover:bg-black/10')}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          <span className="truncate max-w-[180px]">{mediaFileName || 'Documento'}</span>
          {!loading && <Download className="w-3.5 h-3.5 ml-1 opacity-70" />}
        </button>
      )}
      {error && <div className="text-[11px] text-red-500 mt-1">Falha ao baixar</div>}
      {mediaMime && <div className="text-[10px] opacity-60 mt-0.5">{mediaMime}</div>}
    </div>
  );
};

export default MessageMedia;
