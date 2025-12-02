import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Download, QrCode, CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/priceUtils';
import { cn } from '@/lib/utils';
import PixQrCodeDialog from '@/components/checkout/payment/PixQrCodeDialog';

interface Parcela {
  id: string;
  numero_parcela: number;
  valor_original: number;
  valor_final: number;
  valor_multa?: number | null;
  valor_juros?: number | null;
  data_vencimento: string;
  status: string;
  boleto_url?: string | null;
  boleto_barcode?: string | null;
  pix_qr_code?: string | null;
  pix_copia_cola?: string | null;
  metodo_pagamento?: string | null;
  data_pagamento?: string | null;
}

interface OrderInstallmentsSectionProps {
  orderId: string;
  tipoPagamento: string;
  totalParcelas: number;
}

export const OrderInstallmentsSection: React.FC<OrderInstallmentsSectionProps> = ({
  orderId,
  tipoPagamento,
  totalParcelas
}) => {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingBoleto, setGeneratingBoleto] = useState<string | null>(null);
  const [generatingPix, setGeneratingPix] = useState<string | null>(null);
  
  const [pixDialog, setPixDialog] = useState<{
    isOpen: boolean;
    pixData: {
      qrCodeBase64?: string;
      qrCodeText?: string;
      pedidoId?: string;
    } | null;
  }>({
    isOpen: false,
    pixData: null
  });

  useEffect(() => {
    loadParcelas();
  }, [orderId]);

  const loadParcelas = async () => {
    try {
      const { data, error } = await supabase
        .from('parcelas')
        .select('*')
        .eq('pedido_id', orderId)
        .order('numero_parcela', { ascending: true });

      if (error) throw error;
      setParcelas(data || []);
    } catch (error) {
      console.error('Erro ao carregar parcelas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBoleto = async (parcela: Parcela) => {
    setGeneratingBoleto(parcela.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-boleto-payment', {
        body: {
          parcela_id: parcela.id,
          valor: parcela.valor_final,
          vencimento: parcela.data_vencimento,
          descricao: `Parcela ${parcela.numero_parcela}/${totalParcelas} - EXA`,
          payer: {
            email: 'cliente@exa.com.br',
            first_name: 'Cliente',
            last_name: 'EXA',
            identification: { type: 'CPF', number: '00000000000' },
            address: {
              zip_code: '01310100',
              street_name: 'Av. Paulista',
              street_number: '1000',
              neighborhood: 'Bela Vista',
              city: 'São Paulo',
              federal_unit: 'SP'
            }
          }
        }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.boleto_url) {
        toast.success('Boleto gerado com sucesso!');
        setParcelas(prev => prev.map(p => 
          p.id === parcela.id 
            ? { ...p, boleto_url: data.boleto_url, boleto_barcode: data.boleto_barcode }
            : p
        ));
        window.open(data.boleto_url, '_blank');
      } else {
        throw new Error(data?.error || 'Erro ao gerar boleto');
      }
    } catch (error: any) {
      console.error('Erro ao gerar boleto:', error);
      toast.error('Erro ao gerar boleto', { description: error.message });
    } finally {
      setGeneratingBoleto(null);
    }
  };

  const handleGeneratePix = async (parcela: Parcela) => {
    setGeneratingPix(parcela.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-pix-for-parcela', {
        body: {
          parcela_id: parcela.id,
          valor: parcela.valor_final,
          descricao: `Parcela ${parcela.numero_parcela}/${totalParcelas} - EXA`
        }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        setPixDialog({
          isOpen: true,
          pixData: {
            qrCodeBase64: data.qrCodeBase64,
            qrCodeText: data.qrCode,
            pedidoId: orderId
          }
        });
        
        setParcelas(prev => prev.map(p => 
          p.id === parcela.id 
            ? { ...p, pix_qr_code: data.qrCodeBase64, pix_copia_cola: data.qrCode }
            : p
        ));
      } else {
        throw new Error(data?.error || 'Erro ao gerar PIX');
      }
    } catch (error: any) {
      console.error('Erro ao gerar PIX:', error);
      toast.error('Erro ao gerar PIX', { description: error.message });
    } finally {
      setGeneratingPix(null);
    }
  };

  const getParcelaStatus = (parcela: Parcela) => {
    const hoje = new Date();
    const vencimento = new Date(parcela.data_vencimento);
    const diasAtraso = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
    
    if (parcela.status === 'pago') {
      return { label: 'Pago', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' };
    }
    
    if (diasAtraso > 0) {
      return { label: `${diasAtraso} dias atraso`, icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
    }
    
    return { label: 'Pendente', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (parcelas.length === 0) {
    return null;
  }

  const parcelasPagas = parcelas.filter(p => p.status === 'pago').length;
  const isBoleto = tipoPagamento === 'boleto_fidelidade';

  return (
    <>
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Parcelas do Plano Fidelidade
            </div>
            <Badge variant="outline">
              {parcelasPagas}/{parcelas.length} pagas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {parcelas.map((parcela) => {
            const status = getParcelaStatus(parcela);
            const StatusIcon = status.icon;
            const isPago = parcela.status === 'pago';
            const isPendente = parcela.status === 'aguardando_pagamento' || parcela.status === 'pendente';
            const isPrimeira = parcela.numero_parcela === 1;
            
            return (
              <div
                key={parcela.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all",
                  status.bgColor,
                  isPrimeira && !isPago && "ring-2 ring-primary"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    isPago ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                  )}>
                    {parcela.numero_parcela}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      Parcela {parcela.numero_parcela}
                      {isPrimeira && !isPago && (
                        <Badge className="ml-2 text-xs" variant="default">
                          Pagar Agora
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Venc: {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(parcela.valor_final)}</p>
                    <Badge className={cn("text-xs border", status.bgColor, status.color)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  {isPendente && (
                    <div className="flex gap-1">
                      {isBoleto ? (
                        parcela.boleto_url ? (
                          <Button size="sm" variant="outline" onClick={() => window.open(parcela.boleto_url!, '_blank')}>
                            <Download className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => handleGenerateBoleto(parcela)} disabled={generatingBoleto === parcela.id}>
                            {generatingBoleto === parcela.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                          </Button>
                        )
                      ) : (
                        <Button size="sm" onClick={() => handleGeneratePix(parcela)} disabled={generatingPix === parcela.id}>
                          {generatingPix === parcela.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <QrCode className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <PixQrCodeDialog
        isOpen={pixDialog.isOpen}
        onClose={() => setPixDialog({ isOpen: false, pixData: null })}
        qrCodeBase64={pixDialog.pixData?.qrCodeBase64}
        qrCodeText={pixDialog.pixData?.qrCodeText}
        pedidoId={pixDialog.pixData?.pedidoId}
      />
    </>
  );
};
