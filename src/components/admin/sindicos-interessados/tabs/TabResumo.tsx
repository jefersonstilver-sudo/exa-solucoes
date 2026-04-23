import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Download, MessageCircle, Mail, Copy } from 'lucide-react';
import { SindicoRow } from '@/hooks/useSindicosList';
import { SindicoStatusBadge } from '../SindicoStatusBadge';
import { getSignedUrl } from '@/utils/storageSignedUrl';

interface Props {
  sindico: SindicoRow;
}

const onlyDigits = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '');

export const TabResumo: React.FC<Props> = ({ sindico }) => {
  const [loadingPdf, setLoadingPdf] = useState(false);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const openPdf = async (download = false) => {
    if (!sindico.aceite_pdf_url) {
      toast.error('PDF não disponível para este cadastro');
      return;
    }
    setLoadingPdf(true);
    const url = await getSignedUrl('termos-sindicos', sindico.aceite_pdf_url, 3600);
    setLoadingPdf(false);
    if (!url) {
      toast.error('Não foi possível gerar o link do PDF');
      return;
    }
    if (download) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `termo-${sindico.protocolo ?? sindico.id}.pdf`;
      a.click();
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const wppNumber = onlyDigits(sindico.sindico_whatsapp ?? sindico.celular);
  const email = sindico.sindico_email ?? sindico.email ?? '';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-xl font-semibold">{sindico.nome_predio}</h3>
        <SindicoStatusBadge status={sindico.status} />
      </div>

      <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Protocolo</div>
          <div className="font-mono text-sm">{sindico.protocolo ?? '—'}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Cadastrado em</div>
          <div className="text-sm">
            {format(new Date(sindico.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <Button
          variant="default"
          onClick={() => openPdf(false)}
          disabled={loadingPdf || !sindico.aceite_pdf_url}
        >
          <FileText className="w-4 h-4 mr-2" />
          Abrir PDF Oficial
        </Button>
        <Button
          variant="outline"
          onClick={() => openPdf(true)}
          disabled={loadingPdf || !sindico.aceite_pdf_url}
        >
          <Download className="w-4 h-4 mr-2" />
          Baixar PDF
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (!wppNumber) {
              toast.error('WhatsApp não cadastrado');
              return;
            }
            window.open(`https://wa.me/${wppNumber}`, '_blank', 'noopener,noreferrer');
          }}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Abrir WhatsApp
        </Button>
        <Button variant="outline" onClick={() => email && copy(email, 'E-mail')}>
          <Mail className="w-4 h-4 mr-2" />
          Copiar e-mail
        </Button>
        <Button
          variant="outline"
          onClick={() => sindico.protocolo && copy(sindico.protocolo, 'Protocolo')}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copiar protocolo
        </Button>
      </div>
    </div>
  );
};
