import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Copy, ExternalLink, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { SindicoRow } from '@/hooks/useSindicosList';
import { getSignedUrl } from '@/utils/storageSignedUrl';

interface Props {
  sindico: SindicoRow;
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-b border-border/50 last:border-0">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="col-span-2 text-sm break-all">{children}</div>
  </div>
);

const copy = (v: string, label: string) => {
  navigator.clipboard.writeText(v);
  toast.success(`${label} copiado`);
};

export const TabAceiteJuridico: React.FC<Props> = ({ sindico }) => {
  const [loading, setLoading] = useState(false);

  const openPdf = async () => {
    if (!sindico.aceite_pdf_url) {
      toast.error('PDF não disponível');
      return;
    }
    setLoading(true);
    const url = await getSignedUrl('termos-sindicos', sindico.aceite_pdf_url, 3600);
    setLoading(false);
    if (!url) {
      toast.error('Não foi possível gerar o link');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 border-l-4 border-l-primary">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold">Evidências do aceite digital</h4>
        </div>

        <Row label="Data/hora do aceite">
          {sindico.aceite_timestamp
            ? format(new Date(sindico.aceite_timestamp), "dd/MM/yyyy 'às' HH:mm:ss", {
                locale: ptBR,
              })
            : '—'}
        </Row>
        <Row label="Protocolo">
          <span className="font-mono">{sindico.protocolo ?? '—'}</span>
        </Row>
        <Row label="IP de origem">
          <span className="font-mono">{sindico.aceite_ip ?? '—'}</span>
        </Row>
        <Row label="User-Agent">
          <span className="font-mono text-xs">{sindico.aceite_user_agent ?? '—'}</span>
        </Row>
        <Row label="Hash SHA-256">
          {sindico.aceite_hash ? (
            <div className="flex items-start gap-2">
              <span className="font-mono text-xs">{sindico.aceite_hash}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0"
                onClick={() => copy(sindico.aceite_hash!, 'Hash')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            '—'
          )}
        </Row>
        <Row label="PDF oficial">
          {sindico.aceite_pdf_url ? (
            <Button variant="outline" size="sm" onClick={openPdf} disabled={loading}>
              <ExternalLink className="w-3 h-3 mr-1" />
              Abrir PDF
            </Button>
          ) : (
            <span className="text-muted-foreground">Não disponível</span>
          )}
        </Row>
      </Card>

      <div className="rounded-md bg-muted/50 border p-3 text-xs text-muted-foreground">
        Aceite registrado nos termos da <strong>MP 2.200-2/2001</strong> e da{' '}
        <strong>Lei 14.063/2020</strong>. As evidências acima (timestamp, IP, user-agent e hash)
        garantem a integridade e autoria do documento assinado.
      </div>
    </div>
  );
};
