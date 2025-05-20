
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PixCodeCopyFieldProps {
  code: string; // Changed from qrCodeText for consistency
}

const PixCodeCopyField = ({ code }: PixCodeCopyFieldProps) => {
  const [copied, setCopied] = useState(false);

  // Handle copy to clipboard
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Código PIX copiado!");
      
      // Reset copied status after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Erro ao copiar código. Tente copiar manualmente.");
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-gray-500">Ou copie e cole o código PIX:</label>
        <div className="flex">
          <div className="bg-gray-50 border border-gray-200 rounded-l-md py-2 px-3 flex-grow overflow-hidden">
            <p className="text-sm text-gray-600 truncate">{code || "Código PIX não disponível"}</p>
          </div>
          <Button 
            onClick={handleCopyToClipboard}
            variant="outline"
            size="sm"
            className="rounded-l-none border-l-0"
            disabled={!code || copied}
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PixCodeCopyField;
