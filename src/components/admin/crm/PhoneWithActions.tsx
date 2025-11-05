import { Phone, Copy, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatPhoneBR, cleanPhone, getWhatsAppLink, copyToClipboard } from '@/utils/whatsapp';

interface PhoneWithActionsProps {
  phone: string;
}

export function PhoneWithActions({ phone }: PhoneWithActionsProps) {
  const handleCopyNumber = async () => {
    const clean = cleanPhone(phone);
    const success = await copyToClipboard(clean);
    if (success) {
      toast.success('Número copiado!');
    } else {
      toast.error('Erro ao copiar número');
    }
  };

  const handleCopyWhatsAppLink = async () => {
    const link = getWhatsAppLink(phone);
    const success = await copyToClipboard(link);
    if (success) {
      toast.success('Link do WhatsApp copiado!');
    } else {
      toast.error('Erro ao copiar link');
    }
  };

  const handleOpenWhatsApp = () => {
    const link = getWhatsAppLink(phone);
    window.open(link, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <Phone className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">{formatPhoneBR(phone)}</span>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            handleCopyNumber();
          }}
          title="Copiar número"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            handleCopyWhatsAppLink();
          }}
          title="Copiar link do WhatsApp"
        >
          <MessageCircle className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenWhatsApp();
          }}
          title="Abrir WhatsApp"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
