import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SindicoRow } from '@/hooks/useSindicosList';
import { getSignedUrl } from '@/utils/storageSignedUrl';

interface Props {
  sindico: SindicoRow;
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-b border-border/50 last:border-0">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="col-span-2 text-sm">{children}</div>
  </div>
);

const onlyDigits = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '');

export const TabSindico: React.FC<Props> = ({ sindico }) => {
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const urls = sindico.fotos_elevador_urls ?? [];
      if (urls.length === 0) {
        setPhotos([]);
        return;
      }
      const signed = await Promise.all(
        urls.map((u) => getSignedUrl('fotos-sindicos', u, 3600))
      );
      if (!cancelled) setPhotos(signed.filter(Boolean));
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sindico.fotos_elevador_urls]);

  const wpp = onlyDigits(sindico.sindico_whatsapp ?? sindico.celular);
  const email = sindico.sindico_email ?? sindico.email ?? '';
  const nome = sindico.sindico_nome ?? sindico.nome_completo ?? '—';

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Row label="Nome completo">{nome}</Row>
        <Row label="CPF">
          {sindico.sindico_cpf ? (
            <span className="font-mono">{sindico.sindico_cpf}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Row>
        <Row label="WhatsApp">
          <div className="flex items-center gap-2 flex-wrap">
            <span>{sindico.sindico_whatsapp ?? sindico.celular ?? '—'}</span>
            {wpp && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`https://wa.me/${wpp}`, '_blank', 'noopener,noreferrer')
                }
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Abrir
              </Button>
            )}
          </div>
        </Row>
        <Row label="E-mail">
          <div className="flex items-center gap-2">
            <span className="break-all">{email || '—'}</span>
            {email && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  navigator.clipboard.writeText(email);
                  toast.success('E-mail copiado');
                }}
              >
                <Copy className="w-3 h-3" />
              </Button>
            )}
          </div>
        </Row>
        <Row label="Mandato até">
          {sindico.sindico_mandato_ate
            ? format(new Date(sindico.sindico_mandato_ate), 'dd/MM/yyyy', { locale: ptBR })
            : '—'}
        </Row>
      </Card>

      <Card className="p-4">
        <h4 className="text-sm font-medium mb-3">Fotos do elevador</h4>
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma foto enviada.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {photos.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square overflow-hidden rounded-md border hover:opacity-90"
              >
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
