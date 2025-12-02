import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Download, QrCode, CheckCircle, Clock, AlertTriangle, ArrowLeft, Calendar, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/priceUtils';
import { cn } from '@/lib/utils';
import PixQrCodeDialog from '@/components/checkout/payment/PixQrCodeDialog';

interface Parcela {
  id: string;
  numero_parcela: number;
  valor_original: number;
  valor_final: number;
  valor_multa: number;
  valor_juros: number;
  data_vencimento: string;
  status: string;
  boleto_url: string | null;
  boleto_barcode: string | null;
  pix_qr_code: string | null;
  metodo_pagamento: string;
  data_pagamento: string | null;
}

interface Pedido {
  id: string;
  valor_total: number;
  status: string;
  tipo_pagamento: string;
  is_fidelidade: boolean;
  dia_vencimento: number;
  total_parcelas: number;
  parcela_atual: number;
  created_at: string;
  lista_paineis: any[];
}

const AdvertiserInvoices = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const pedidoIdFromUrl = searchParams.get('pedido');

  const [loading, setLoading] = useState(true);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
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

  // Carregar dados do pedido e parcelas
  useEffect(() => {
    const loadData = async () => {
      if (!userProfile?.id) return;

      try {
        setLoading(true);
        
        // Se tiver pedido específico na URL, buscar esse pedido
        let pedidoQuery = supabase
          .from('pedidos')
          .select('*')
          .eq('client_id', userProfile.id)
          .eq('is_fidelidade', true);
        
        if (pedidoIdFromUrl) {
          pedidoQuery = pedidoQuery.eq('id', pedidoIdFromUrl);
        }
        
        const { data: pedidoData, error: pedidoError } = await pedidoQuery
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (pedidoError) {
          console.error('Erro ao buscar pedido:', pedidoError);
          return;
        }
        
        setPedido(pedidoData);
        
        // Buscar parcelas do pedido
        const { data: parcelasData, error: parcelasError } = await supabase
          .from('parcelas')
          .select('*')
          .eq('pedido_id', pedidoData.id)
          .order('numero_parcela', { ascending: true });
        
        if (parcelasError) {
          console.error('Erro ao buscar parcelas:', parcelasError);
          return;
        }
        
        setParcelas(parcelasData || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar faturas');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userProfile?.id, pedidoIdFromUrl]);

  // Gerar boleto para parcela
  const handleGenerateBoleto = async (parcela: Parcela) => {
    if (!pedido || !userProfile) return;
    
    setGeneratingBoleto(parcela.id);
    
    try {
      // Buscar dados completos do usuário para o boleto
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userProfile.id)
        .single();
      
      // Cast para any para acessar campos que podem não existir no tipo
      const userDataAny = userData as any;
      
      const { data, error } = await supabase.functions.invoke('generate-boleto-payment', {
        body: {
          parcela_id: parcela.id,
          valor: parcela.valor_final,
          vencimento: parcela.data_vencimento,
          descricao: `Parcela ${parcela.numero_parcela}/${pedido.total_parcelas} - Plano Fidelidade EXA`,
          payer: {
            email: userData?.email || userProfile.email,
            first_name: userData?.empresa_nome?.split(' ')[0] || 'Cliente',
            last_name: userData?.empresa_nome?.split(' ').slice(1).join(' ') || 'EXA',
            identification: {
              type: 'CNPJ',
              number: userData?.empresa_documento?.replace(/\D/g, '') || ''
            },
            address: {
              zip_code: userDataAny?.cep || '01310100',
              street_name: userDataAny?.endereco || 'Av. Paulista',
              street_number: userDataAny?.numero || '1000',
              neighborhood: userDataAny?.bairro || 'Bela Vista',
              city: userDataAny?.cidade || 'São Paulo',
              federal_unit: userDataAny?.estado || 'SP'
            }
          }
        }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.boleto_url) {
        toast.success('Boleto gerado com sucesso!');
        
        // Atualizar parcela localmente
        setParcelas(prev => prev.map(p => 
          p.id === parcela.id 
            ? { ...p, boleto_url: data.boleto_url, boleto_barcode: data.boleto_barcode }
            : p
        ));
        
        // Abrir boleto em nova aba
        window.open(data.boleto_url, '_blank');
      } else {
        throw new Error(data?.error || 'Erro ao gerar boleto');
      }
    } catch (error: any) {
      console.error('Erro ao gerar boleto:', error);
      toast.error('Erro ao gerar boleto', {
        description: error.message
      });
    } finally {
      setGeneratingBoleto(null);
    }
  };

  // Gerar PIX para parcela
  const handleGeneratePix = async (parcela: Parcela) => {
    if (!pedido) return;
    
    setGeneratingPix(parcela.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-pix-for-parcela', {
        body: {
          parcela_id: parcela.id,
          valor: parcela.valor_final,
          descricao: `Parcela ${parcela.numero_parcela}/${pedido.total_parcelas} - EXA`
        }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        setPixDialog({
          isOpen: true,
          pixData: {
            qrCodeBase64: data.qrCodeBase64,
            qrCodeText: data.qrCode,
            pedidoId: pedido.id
          }
        });
        
        // Atualizar parcela
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
      toast.error('Erro ao gerar PIX', {
        description: error.message
      });
    } finally {
      setGeneratingPix(null);
    }
  };

  // Status visual das parcelas
  const getParcelaStatus = (parcela: Parcela) => {
    const hoje = new Date();
    const vencimento = new Date(parcela.data_vencimento);
    const diasAtraso = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
    
    if (parcela.status === 'pago') {
      return {
        label: 'Pago',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200'
      };
    }
    
    if (diasAtraso > 0) {
      return {
        label: `${diasAtraso} dias em atraso`,
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200'
      };
    }
    
    if (parcela.status === 'aguardando_pagamento') {
      return {
        label: 'Aguardando Pagamento',
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 border-amber-200'
      };
    }
    
    return {
      label: 'Pendente',
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200'
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-lg">Carregando faturas...</p>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <FileText className="h-16 w-16 text-gray-300" />
        <p className="text-lg text-gray-500">Nenhum plano de fidelidade encontrado</p>
        <Button onClick={() => navigate('/paineis-digitais/loja')}>
          Ver Planos
        </Button>
      </div>
    );
  }

  const parcelasPagas = parcelas.filter(p => p.status === 'pago').length;
  const totalParcelas = parcelas.length;

  return (
    <div className="space-y-6">
      {/* Header com voltar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/anunciante/pedidos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Minhas Faturas</h1>
          <p className="text-sm text-muted-foreground">
            Plano Fidelidade #{pedido.id.substring(0, 8)}
          </p>
        </div>
      </div>

      {/* Resumo do Plano */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Resumo do Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-xl font-bold">{formatCurrency(pedido.valor_total)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Parcelas</p>
              <p className="text-xl font-bold">{parcelasPagas}/{totalParcelas}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dia Vencimento</p>
              <p className="text-xl font-bold">Dia {pedido.dia_vencimento}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
              <p className="text-xl font-bold">
                {pedido.tipo_pagamento === 'boleto_fidelidade' ? 'Boleto' : 'PIX'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Parcelas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Parcelas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {parcelas.map((parcela) => {
            const status = getParcelaStatus(parcela);
            const StatusIcon = status.icon;
            const isPrimeira = parcela.numero_parcela === 1;
            const isPago = parcela.status === 'pago';
            const isPendente = parcela.status === 'aguardando_pagamento' || parcela.status === 'pendente';
            const isBoleto = pedido.tipo_pagamento === 'boleto_fidelidade';
            
            return (
              <div
                key={parcela.id}
                className={cn(
                  "flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border-2 transition-all",
                  status.bgColor,
                  isPrimeira && !isPago && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <div className="flex items-center gap-4 mb-3 md:mb-0">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                    isPago ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                  )}>
                    {parcela.numero_parcela}
                  </div>
                  <div>
                    <p className="font-semibold">
                      Parcela {parcela.numero_parcela}/{totalParcelas}
                      {isPrimeira && !isPago && (
                        <Badge className="ml-2 bg-primary text-primary-foreground">
                          Pagar Agora
                        </Badge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vencimento: {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                    </p>
                    {parcela.valor_multa > 0 && (
                      <p className="text-xs text-red-600">
                        + Multa: {formatCurrency(parcela.valor_multa)} | Juros: {formatCurrency(parcela.valor_juros)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(parcela.valor_final)}</p>
                    <Badge className={cn("border", status.bgColor, status.color)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Botões de Ação */}
                  {isPendente && (
                    <div className="flex gap-2">
                      {isBoleto ? (
                        <>
                          {parcela.boleto_url ? (
                            <Button
                              size="sm"
                              onClick={() => window.open(parcela.boleto_url!, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Baixar Boleto
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleGenerateBoleto(parcela)}
                              disabled={generatingBoleto === parcela.id}
                            >
                              {generatingBoleto === parcela.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4 mr-1" />
                              )}
                              Gerar Boleto
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleGeneratePix(parcela)}
                          disabled={generatingPix === parcela.id}
                        >
                          {generatingPix === parcela.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <QrCode className="h-4 w-4 mr-1" />
                          )}
                          Pagar com PIX
                        </Button>
                      )}
                    </div>
                  )}

                  {isPago && parcela.data_pagamento && (
                    <p className="text-xs text-green-600">
                      Pago em {new Date(parcela.data_pagamento).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Dialog PIX */}
      <PixQrCodeDialog
        isOpen={pixDialog.isOpen}
        onClose={() => setPixDialog({ isOpen: false, pixData: null })}
        qrCodeBase64={pixDialog.pixData?.qrCodeBase64}
        qrCodeText={pixDialog.pixData?.qrCodeText}
        pedidoId={pixDialog.pixData?.pedidoId}
      />
    </div>
  );
};

export default AdvertiserInvoices;
