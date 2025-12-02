import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Download, QrCode, CheckCircle, Clock, AlertTriangle, ArrowLeft, Calendar, Building2, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/priceUtils';
import { cn } from '@/lib/utils';
import PixQrCodeDialog from '@/components/checkout/payment/PixQrCodeDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Parcela {
  id: string;
  numero_parcela: number;
  valor_original: number;
  valor_final: number;
  valor_multa: number | null;
  valor_juros: number | null;
  data_vencimento: string;
  status: string;
  boleto_url: string | null;
  boleto_barcode: string | null;
  pix_qr_code?: string | null;
  pix_copia_cola?: string | null;
  metodo_pagamento: string | null;
  data_pagamento: string | null;
  pedido_id: string;
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
  plano_meses: number;
}

interface PedidoComParcelas extends Pedido {
  parcelas: Parcela[];
}

const AdvertiserInvoices = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const pedidoIdFromUrl = searchParams.get('pedido');

  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<PedidoComParcelas[]>([]);
  const [expandedPedidos, setExpandedPedidos] = useState<Set<string>>(new Set());
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

  // Carregar dados de TODOS os pedidos fidelidade e suas parcelas
  useEffect(() => {
    const loadData = async () => {
      if (!userProfile?.id) return;

      try {
        setLoading(true);
        
        // Buscar TODOS os pedidos fidelidade do usuário
        const { data: pedidosData, error: pedidosError } = await supabase
          .from('pedidos')
          .select('*')
          .eq('client_id', userProfile.id)
          .eq('is_fidelidade', true)
          .order('created_at', { ascending: false });
        
        if (pedidosError) {
          console.error('Erro ao buscar pedidos:', pedidosError);
          return;
        }
        
        if (!pedidosData || pedidosData.length === 0) {
          setPedidos([]);
          return;
        }

        // Buscar parcelas de todos os pedidos
        const pedidoIds = pedidosData.map(p => p.id);
        const { data: parcelasData, error: parcelasError } = await supabase
          .from('parcelas')
          .select('*')
          .in('pedido_id', pedidoIds)
          .order('numero_parcela', { ascending: true });
        
        if (parcelasError) {
          console.error('Erro ao buscar parcelas:', parcelasError);
        }
        
        // Agrupar parcelas por pedido
        const pedidosComParcelas: PedidoComParcelas[] = pedidosData.map(pedido => ({
          ...pedido,
          parcelas: (parcelasData || []).filter(p => p.pedido_id === pedido.id)
        }));
        
        setPedidos(pedidosComParcelas);
        
        // Se tiver pedido na URL, expandir automaticamente
        if (pedidoIdFromUrl) {
          setExpandedPedidos(new Set([pedidoIdFromUrl]));
        } else if (pedidosComParcelas.length > 0) {
          // Expandir o primeiro pedido por padrão
          setExpandedPedidos(new Set([pedidosComParcelas[0].id]));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar faturas');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userProfile?.id, pedidoIdFromUrl]);

  const togglePedido = (pedidoId: string) => {
    setExpandedPedidos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pedidoId)) {
        newSet.delete(pedidoId);
      } else {
        newSet.add(pedidoId);
      }
      return newSet;
    });
  };

  // Gerar boleto para parcela
  const handleGenerateBoleto = async (parcela: Parcela, pedido: PedidoComParcelas) => {
    if (!userProfile) return;
    
    setGeneratingBoleto(parcela.id);
    
    try {
      // Buscar dados completos do usuário para o boleto
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userProfile.id)
        .single();
      
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
        setPedidos(prev => prev.map(p => ({
          ...p,
          parcelas: p.parcelas.map(parc => 
            parc.id === parcela.id 
              ? { ...parc, boleto_url: data.boleto_url, boleto_barcode: data.boleto_barcode }
              : parc
          )
        })));
        
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
  const handleGeneratePix = async (parcela: Parcela, pedido: PedidoComParcelas) => {
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
        
        // Atualizar parcela localmente
        setPedidos(prev => prev.map(p => ({
          ...p,
          parcelas: p.parcelas.map(parc => 
            parc.id === parcela.id 
              ? { ...parc, pix_qr_code: data.qrCodeBase64, pix_copia_cola: data.qrCode }
              : parc
          )
        })));
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

  const getPlanoNome = (meses: number) => {
    switch (meses) {
      case 1: return 'Mensal';
      case 3: return 'Trimestral';
      case 6: return 'Semestral';
      case 12: return 'Anual';
      default: return `${meses} meses`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-lg">Carregando faturas...</p>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Receipt className="h-16 w-16 text-muted-foreground/50" />
        <p className="text-lg text-muted-foreground">Nenhum plano de fidelidade encontrado</p>
        <Button onClick={() => navigate('/paineis-digitais/loja')}>
          Ver Planos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/anunciante/pedidos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Minhas Faturas</h1>
          <p className="text-sm text-muted-foreground">
            {pedidos.length} plano{pedidos.length > 1 ? 's' : ''} de fidelidade
          </p>
        </div>
      </div>

      {/* Lista de Pedidos Agrupados */}
      <div className="space-y-4">
        {pedidos.map((pedido) => {
          const isExpanded = expandedPedidos.has(pedido.id);
          const parcelasPagas = pedido.parcelas.filter(p => p.status === 'pago').length;
          const totalParcelas = pedido.parcelas.length;
          const isBoleto = pedido.tipo_pagamento === 'boleto_fidelidade';
          const primeiraParcela = pedido.parcelas.find(p => p.numero_parcela === 1);
          const primeiraPendente = pedido.parcelas.find(p => p.status !== 'pago');
          
          return (
            <Card key={pedido.id} className={cn(
              "transition-all",
              pedidoIdFromUrl === pedido.id && "ring-2 ring-primary"
            )}>
              <Collapsible open={isExpanded} onOpenChange={() => togglePedido(pedido.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            Plano {getPlanoNome(pedido.plano_meses || pedido.total_parcelas)}
                            <Badge variant="outline" className="ml-2">
                              {isBoleto ? 'Boleto' : 'PIX'}
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Pedido #{pedido.id.substring(0, 8)} • Criado em {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(pedido.valor_total)}</p>
                          <p className="text-sm text-muted-foreground">
                            {parcelasPagas}/{totalParcelas} parcelas pagas
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3">
                    {/* Resumo */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Mensal</p>
                        <p className="font-semibold">{formatCurrency(pedido.valor_total / (pedido.total_parcelas || 1))}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dia Vencimento</p>
                        <p className="font-semibold">Dia {pedido.dia_vencimento}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Progresso</p>
                        <p className="font-semibold">{parcelasPagas}/{totalParcelas}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={parcelasPagas > 0 ? 'default' : 'secondary'}>
                          {parcelasPagas === 0 ? 'Aguardando 1ª Parcela' : parcelasPagas === totalParcelas ? 'Quitado' : 'Em Andamento'}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Lista de Parcelas */}
                    {pedido.parcelas.map((parcela) => {
                      const status = getParcelaStatus(parcela);
                      const StatusIcon = status.icon;
                      const isPrimeira = parcela.numero_parcela === 1;
                      const isPago = parcela.status === 'pago';
                      const isPendente = parcela.status === 'aguardando_pagamento' || parcela.status === 'pendente';
                      const isProxima = primeiraPendente?.id === parcela.id;
                      
                      return (
                        <div
                          key={parcela.id}
                          className={cn(
                            "flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border-2 transition-all",
                            status.bgColor,
                            isProxima && !isPago && "ring-2 ring-primary ring-offset-2"
                          )}
                        >
                          <div className="flex items-center gap-4 mb-3 md:mb-0">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                              isPago ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                            )}>
                              {parcela.numero_parcela}
                            </div>
                            <div>
                              <p className="font-semibold flex items-center gap-2">
                                Parcela {parcela.numero_parcela}/{totalParcelas}
                                {isProxima && !isPago && (
                                  <Badge className="bg-primary text-primary-foreground">
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
                                        onClick={() => handleGenerateBoleto(parcela, pedido)}
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
                                    onClick={() => handleGeneratePix(parcela, pedido)}
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
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

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