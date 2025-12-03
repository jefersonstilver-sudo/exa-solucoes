import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, MessageSquare, FileText, Building2, Eye, Clock, Phone, AlertTriangle, Loader2, Download, Mail, Zap, FileBarChart, Copy, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { supabase } from '@/integrations/supabase/client';
import { ProposalPDFExporter } from '@/components/admin/proposals/ProposalPDFExporter';
import { validateEmail } from '@/utils/inputValidation';

interface Proposal {
  id: string;
  number: string;
  client_name: string;
  client_cnpj: string | null;
  client_phone: string | null;
  client_email: string | null;
  selected_buildings: any[];
  total_panels: number;
  total_impressions_month: number;
  fidel_monthly_value: number;
  cash_total_value: number;
  discount_percent: number;
  duration_months: number;
  status: string;
  created_at: string;
  sent_at: string | null;
  expires_at: string | null;
  created_by: string | null;
}

interface PaymentData {
  method: 'pix' | 'boleto';
  paymentId?: string;
  status?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  dueDate?: string;
}

const PropostaPublicaPage = () => {
  const { id } = useParams<{ id: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [sellerName, setSellerName] = useState('Equipe EXA Mídia');
  const [sellerPhone, setSellerPhone] = useState('(45) 99141-5856');
  const [selectedPlan, setSelectedPlan] = useState<'avista' | 'fidelidade'>('avista');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  
  // Payment states
  const [paymentStep, setPaymentStep] = useState<'select' | 'generating' | 'ready'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | null>(null);
  const [diaVencimento, setDiaVencimento] = useState<5 | 10 | 15>(10);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  
  // Current building data for accurate panel count
  const [enrichedBuildings, setEnrichedBuildings] = useState<any[]>([]);
  const [realTotalPanels, setRealTotalPanels] = useState(0);

  // Track page view time with heartbeat system (works on mobile!)
  const pageLoadTime = React.useRef<number>(Date.now());
  const lastSentTime = React.useRef<number>(0);
  
  // Register view on mount and heartbeat every 15 seconds
  useEffect(() => {
    if (!id) return;
    
    const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    
    // Register view entry ONCE
    supabase.functions.invoke('track-proposal-view', {
      body: {
        proposalId: id,
        action: 'enter',
        deviceType,
        userAgent: navigator.userAgent
      }
    }).then(() => {
      console.log('✅ View registered');
    }).catch(err => console.log('Track error:', err));
    
    // Heartbeat: send time every 15 seconds (works on mobile!)
    const heartbeatInterval = setInterval(() => {
      const currentTimeSpent = Math.floor((Date.now() - pageLoadTime.current) / 1000);
      const incrementalTime = currentTimeSpent - lastSentTime.current;
      
      if (incrementalTime > 0) {
        supabase.functions.invoke('track-proposal-view', {
          body: { 
            proposalId: id, 
            action: 'heartbeat', 
            timeSpentSeconds: incrementalTime 
          }
        }).then(() => {
          console.log(`⏱️ Heartbeat: +${incrementalTime}s`);
          lastSentTime.current = currentTimeSpent;
        }).catch(() => {});
      }
    }, 15000); // 15 segundos
    
    return () => {
      clearInterval(heartbeatInterval);
      // Final send on unmount
      const finalTime = Math.floor((Date.now() - pageLoadTime.current) / 1000);
      const remaining = finalTime - lastSentTime.current;
      if (remaining > 0) {
        supabase.functions.invoke('track-proposal-view', {
          body: { proposalId: id, action: 'heartbeat', timeSpentSeconds: remaining }
        }).catch(() => {});
      }
    };
  }, [id]);

  // Buscar proposta do banco de dados
  useEffect(() => {
    const fetchProposal = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 Buscando proposta:', id);
        
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Erro ao buscar proposta:', error);
          setIsLoading(false);
          return;
        }

        if (!data) {
          console.log('Proposta não encontrada');
          setIsLoading(false);
          return;
        }

        console.log('✅ Proposta encontrada:', data);
        setProposal(data as Proposal);

        // Fetch CURRENT building data for accurate panel count
        const buildings = Array.isArray(data.selected_buildings) ? data.selected_buildings : [];
        const buildingIds = buildings.map((b: any) => b.building_id).filter(Boolean);
        
        if (buildingIds.length > 0) {
          const { data: currentBuildingsData } = await supabase
            .from('buildings')
            .select('id, quantidade_telas, numero_elevadores')
            .in('id', buildingIds);

          if (currentBuildingsData) {
            // Create map of current data
            const buildingsMap = new Map(currentBuildingsData.map(b => [
              b.id,
              b.quantidade_telas || b.numero_elevadores || 1
            ]));

            // Enrich selected_buildings with current panel data
            const enriched = buildings.map((b: any) => ({
              ...b,
              quantidade_telas: buildingsMap.get(b.building_id) || b.quantidade_telas || 1
            }));

            setEnrichedBuildings(enriched);
            
            // Calculate real total panels
            const total = enriched.reduce((sum: number, b: any) => 
              sum + (b.quantidade_telas || 1), 0
            );
            setRealTotalPanels(total);
            console.log('📊 Total de telas atualizado:', total);
          } else {
            setEnrichedBuildings(buildings);
            setRealTotalPanels(data.total_panels || buildings.reduce((sum: number, b: any) => sum + (b.quantidade_telas || 1), 0));
          }
        } else {
          setEnrichedBuildings(buildings);
          setRealTotalPanels(data.total_panels || 0);
        }

        // Verificar se expirou
        if (data.expires_at) {
          const expiresAt = new Date(data.expires_at);
          if (expiresAt < new Date()) {
            setIsExpired(true);
            if (data.status !== 'expirada' && data.status !== 'aceita' && data.status !== 'recusada') {
              await supabase
                .from('proposals')
                .update({ status: 'expirada' })
                .eq('id', id);
            }
          }
        }

        // Registrar visualização
        if (!['aceita', 'recusada', 'expirada'].includes(data.status)) {
          await supabase.from('proposal_logs').insert({
            proposal_id: id,
            action: 'visualizada',
            details: { timestamp: new Date().toISOString() }
          });

          if (data.status === 'enviada') {
            await supabase
              .from('proposals')
              .update({ status: 'visualizada' })
              .eq('id', id);
          }
        }

        // Buscar nome do vendedor
        if (data.created_by) {
          const { data: userData } = await supabase
            .from('users')
            .select('nome, telefone')
            .eq('id', data.created_by)
            .single();
          
          if (userData?.nome) {
            setSellerName(userData.nome);
          }
          if (userData?.telefone) {
            setSellerPhone(userData.telefone);
          }
        }

      } catch (err) {
        console.error('Erro ao carregar proposta:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposal();
  }, [id]);

  // Aceitar proposta
  const handleAccept = async () => {
    if (!proposal || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ 
          status: 'aceita',
          responded_at: new Date().toISOString()
        })
        .eq('id', proposal.id);

      if (error) throw error;

      await supabase.from('proposal_logs').insert({
        proposal_id: proposal.id,
        action: 'aceita',
        details: { 
          selected_plan: selectedPlan,
          timestamp: new Date().toISOString()
        }
      });

      // Check if email capture needed
      if (!proposal.client_email) {
        setShowEmailCapture(true);
      }

      setShowSuccess(true);
    } catch (err) {
      console.error('Erro ao aceitar proposta:', err);
      toast.error('Erro ao processar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate payment (PIX or Boleto)
  const handleGeneratePayment = async () => {
    if (!proposal || !paymentMethod) return;
    
    setIsGeneratingPayment(true);
    setPaymentStep('generating');
    
    try {
      const emailToUse = emailInput || proposal.client_email || '';
      
      const { data, error } = await supabase.functions.invoke('generate-proposal-payment', {
        body: {
          proposalId: proposal.id,
          paymentMethod,
          selectedPlan,
          clientEmail: emailToUse,
          diaVencimento: paymentMethod === 'boleto' ? diaVencimento : undefined
        }
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao gerar pagamento');
      }

      setPaymentData(data.paymentData);
      setPaymentStep('ready');
      
      // Send confirmation email with payment data
      await sendConfirmationEmail(emailToUse, data.paymentData);
      
      toast.success('Pagamento gerado com sucesso!');
      
    } catch (err: any) {
      console.error('Erro ao gerar pagamento:', err);
      toast.error(err.message || 'Erro ao gerar pagamento');
      setPaymentStep('select');
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  // Send confirmation email with payment data
  const sendConfirmationEmail = async (email: string, payment?: PaymentData) => {
    if (!email) return;
    
    try {
      const { error } = await supabase.functions.invoke('send-proposal-accepted-email', {
        body: {
          proposalId: proposal?.id,
          clientEmail: email,
          selectedPlan,
          paymentMethod: payment?.method,
          paymentData: payment
        }
      });
      
      if (error) {
        console.error('Erro ao enviar email:', error);
      } else {
        toast.success('E-mail de confirmação enviado!');
      }
    } catch (err) {
      console.error('Erro ao enviar email:', err);
    }
  };

  // Confirm email captured
  const handleConfirmEmail = async () => {
    if (!emailInput.trim()) {
      toast.error('Digite seu e-mail');
      return;
    }
    
    if (!validateEmail(emailInput)) {
      toast.error('E-mail inválido');
      return;
    }

    setShowEmailCapture(false);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!proposal) return;
    
    setIsDownloadingPDF(true);
    try {
      const exporter = new ProposalPDFExporter();
      await exporter.generateProposalPDF(proposal, sellerName);
      toast.success('PDF baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Reject proposal
  const handleReject = async () => {
    if (!proposal || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ 
          status: 'recusada',
          responded_at: new Date().toISOString()
        })
        .eq('id', proposal.id);

      if (error) throw error;

      await supabase.from('proposal_logs').insert({
        proposal_id: proposal.id,
        action: 'recusada',
        details: { timestamp: new Date().toISOString() }
      });

      setShowReject(true);
    } catch (err) {
      console.error('Erro ao recusar proposta:', err);
      toast.error('Erro ao processar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#9C1E1E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  // Proposta não encontrada
  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/90 backdrop-blur-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Proposta não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            O link pode estar incorreto ou a proposta foi removida.
          </p>
          <Button
            className="w-full h-12 bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
            onClick={() => window.open('https://wa.me/5545991415856', '_blank')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Falar com a equipe
          </Button>
        </Card>
      </div>
    );
  }

  // Proposta expirada
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/90 backdrop-blur-sm">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Proposta Expirada</h1>
          <p className="text-muted-foreground mb-6">
            Esta proposta expirou em {new Date(proposal.expires_at!).toLocaleString('pt-BR')}.
            Entre em contato para solicitar uma nova proposta.
          </p>
          <Button
            className="w-full h-12 bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
            onClick={() => window.open(`https://wa.me/55${sellerPhone.replace(/\D/g, '')}`, '_blank')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Solicitar nova proposta
          </Button>
        </Card>
      </div>
    );
  }

  // Proposta aceita - tela de sucesso com seleção de pagamento
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 bg-white/95 backdrop-blur-sm shadow-xl">
          {/* Ícone animado */}
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Check className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-center text-foreground mb-1">🎉 Parabéns!</h1>
          <p className="text-center text-muted-foreground mb-4">
            Sua proposta foi aceita com sucesso!
          </p>

          {/* Campo de email se não tinha */}
          {showEmailCapture && paymentStep === 'select' && (
            <div className="mb-4 space-y-3 bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-muted-foreground">
                Informe seu e-mail para receber os detalhes:
              </p>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="h-11"
              />
              <Button 
                className="w-full bg-[#9C1E1E] hover:bg-[#7D1818]"
                onClick={handleConfirmEmail}
              >
                <Mail className="h-4 w-4 mr-2" />
                Confirmar E-mail
              </Button>
            </div>
          )}

          {/* Payment Step: Select Method */}
          {paymentStep === 'select' && !showEmailCapture && (
            <div className="space-y-4">
              <h2 className="font-semibold text-center">💳 Como deseja pagar?</h2>
              
              {/* PIX Option */}
              <Card 
                className={`p-4 cursor-pointer transition-all border-2 ${
                  paymentMethod === 'pix' 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPaymentMethod('pix')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    paymentMethod === 'pix' ? 'bg-emerald-500' : 'bg-gray-100'
                  }`}>
                    <Zap className={`h-5 w-5 ${paymentMethod === 'pix' ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">PIX</div>
                    <div className="text-xs text-muted-foreground">Pagamento instantâneo • QR Code</div>
                  </div>
                  {paymentMethod === 'pix' && (
                    <Check className="h-5 w-5 text-emerald-500" />
                  )}
                </div>
              </Card>

              {/* Boleto Option */}
              <Card 
                className={`p-4 cursor-pointer transition-all border-2 ${
                  paymentMethod === 'boleto' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPaymentMethod('boleto')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    paymentMethod === 'boleto' ? 'bg-blue-500' : 'bg-gray-100'
                  }`}>
                    <FileBarChart className={`h-5 w-5 ${paymentMethod === 'boleto' ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Boleto Bancário</div>
                    <div className="text-xs text-muted-foreground">Vencimento em até 3 dias úteis</div>
                  </div>
                  {paymentMethod === 'boleto' && (
                    <Check className="h-5 w-5 text-blue-500" />
                  )}
                </div>

                {/* Due date selector for Boleto */}
                {paymentMethod === 'boleto' && (
                  <div className="mt-4 pt-3 border-t border-blue-200">
                    <p className="text-sm font-medium mb-2">Dia do vencimento:</p>
                    <div className="flex gap-2">
                      {([5, 10, 15] as const).map((day) => (
                        <button
                          key={day}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDiaVencimento(day);
                          }}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            diaVencimento === day
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          Dia {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Generate Payment Button */}
              <Button
                className="w-full h-12 bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
                disabled={!paymentMethod || isGeneratingPayment}
                onClick={handleGeneratePayment}
              >
                {isGeneratingPayment ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Check className="h-5 w-5 mr-2" />
                )}
                Gerar Pagamento
              </Button>
            </div>
          )}

          {/* Payment Step: Generating */}
          {paymentStep === 'generating' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#9C1E1E]" />
              <p className="text-muted-foreground">Gerando {paymentMethod === 'pix' ? 'PIX' : 'Boleto'}...</p>
            </div>
          )}

          {/* Payment Step: Ready - PIX */}
          {paymentStep === 'ready' && paymentData?.method === 'pix' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <Zap className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="font-semibold text-emerald-700">PIX Gerado!</h3>
              </div>

              {/* QR Code */}
              {paymentData.qrCodeBase64 && (
                <div className="flex justify-center">
                  <img 
                    src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}

              {/* Copy Code */}
              {paymentData.qrCode && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Código Pix Copia e Cola:</p>
                  <div className="flex gap-2">
                    <Input 
                      value={paymentData.qrCode}
                      readOnly
                      className="text-xs font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(paymentData.qrCode!, 'Código PIX')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Button
                className="w-full h-10 bg-[#25D366] hover:bg-[#20BD5A] text-white"
                onClick={() => window.open(`https://wa.me/55${sellerPhone.replace(/\D/g, '')}`, '_blank')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Confirmar Pagamento via WhatsApp
              </Button>
            </div>
          )}

          {/* Payment Step: Ready - Boleto */}
          {paymentStep === 'ready' && paymentData?.method === 'boleto' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <FileBarChart className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-700">Boleto Gerado!</h3>
                {paymentData.dueDate && (
                  <p className="text-sm text-blue-600">
                    Vencimento: {new Date(paymentData.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>

              {/* Download Boleto */}
              {paymentData.boletoUrl && (
                <Button
                  className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => window.open(paymentData.boletoUrl, '_blank')}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Baixar Boleto
                </Button>
              )}

              {/* Barcode */}
              {paymentData.boletoBarcode && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Código de Barras:</p>
                  <div className="flex gap-2">
                    <Input 
                      value={paymentData.boletoBarcode}
                      readOnly
                      className="text-xs font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(paymentData.boletoBarcode!, 'Código de barras')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Button
                className="w-full h-10 bg-[#25D366] hover:bg-[#20BD5A] text-white"
                onClick={() => window.open(`https://wa.me/55${sellerPhone.replace(/\D/g, '')}`, '_blank')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Falar com {sellerName.split(' ')[0]}
              </Button>
            </div>
          )}

          {/* Info do que vai acontecer - only show before payment */}
          {paymentStep === 'select' && !showEmailCapture && (
            <div className="mt-4 bg-gray-50 rounded-lg p-3 text-left space-y-2 text-xs">
              <p className="flex items-start gap-2">
                <span className="text-emerald-600">📧</span>
                <span>Você receberá um e-mail com os detalhes</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-600">📄</span>
                <span>Em até <strong>1 dia útil</strong>, enviaremos o contrato</span>
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Proposta recusada
  if (showReject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/90 backdrop-blur-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Proposta Recusada</h1>
          <p className="text-muted-foreground mb-6">
            Entendemos. Se mudar de ideia ou quiser discutir condições diferenciadas, estamos à disposição.
          </p>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => window.open(`https://wa.me/55${sellerPhone.replace(/\D/g, '')}`, '_blank')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Falar com a equipe
          </Button>
        </Card>
      </div>
    );
  }

  // Use enriched building data
  const buildings = enrichedBuildings.length > 0 ? enrichedBuildings : (proposal.selected_buildings || []);
  const totalPanels = realTotalPanels || proposal.total_panels || buildings.reduce((sum: number, b: any) => sum + (b.quantidade_telas || 1), 0);
  const totalImpressions = proposal.total_impressions_month || buildings.reduce((sum: number, b: any) => sum + (b.visualizacoes_mes || 0), 0);
  const fidelTotal = proposal.fidel_monthly_value * proposal.duration_months;

  // ==== CÁLCULO DO BREAKDOWN DE PREÇO ====
  // Calcular valor base mensal total (soma de todos os preco_base dos prédios)
  const baseMonthlyTotal = buildings.reduce((sum: number, b: any) => sum + (b.preco_base || 0), 0);
  const baseTotalValue = baseMonthlyTotal * proposal.duration_months;
  
  // Desconto do plano (baseado em duration_months)
  const planDiscountPercent = proposal.duration_months === 12 ? 37.5 
    : proposal.duration_months === 6 ? 30 
    : proposal.duration_months === 3 ? 20 
    : 0;
  const planDiscountValue = baseTotalValue * (planDiscountPercent / 100);
  const afterPlanDiscount = baseTotalValue - planDiscountValue;
  
  // Desconto PIX à Vista (10%) - aplicado sobre o valor já com desconto do plano
  const pixDiscountPercent = 10;
  const pixDiscountValue = afterPlanDiscount * (pixDiscountPercent / 100);
  const finalCashValue = afterPlanDiscount - pixDiscountValue;
  
  // Economia total À Vista
  const totalSavingsAvista = baseTotalValue > 0 
    ? ((baseTotalValue - proposal.cash_total_value) / baseTotalValue * 100).toFixed(1)
    : '0';
    
  // Economia total Fidelidade
  const totalSavingsFidelidade = baseTotalValue > 0
    ? ((baseTotalValue - fidelTotal) / baseTotalValue * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#4a0f0f] to-[#7D1818] text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <UnifiedLogo 
                size="custom" 
                variant="light"
                className="w-12 h-12"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Proposta Comercial • EXA Mídia</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium">
                  {proposal.number}
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
                  {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                </span>
                {(() => {
                  const statusConfig: Record<string, { bg: string; text: string }> = {
                    'enviada': { bg: 'bg-blue-500', text: 'Enviada' },
                    'visualizada': { bg: 'bg-purple-500', text: 'Visualizada' },
                    'aceita': { bg: 'bg-emerald-500', text: 'Aceita' },
                    'recusada': { bg: 'bg-red-500', text: 'Recusada' },
                    'expirada': { bg: 'bg-gray-500', text: 'Expirada' },
                  };
                  const config = statusConfig[proposal.status] || { bg: 'bg-gray-500', text: proposal.status };
                  return (
                    <span className={`${config.bg} px-3 py-1 rounded-full text-xs font-medium`}>
                      {config.text}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
          <div className="text-sm opacity-90 space-y-1">
            <div>Cliente: <strong>{proposal.client_name}</strong></div>
            {proposal.client_cnpj && (
              <div>CNPJ: <strong>{proposal.client_cnpj}</strong></div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Banner de Status Destacado - para propostas já respondidas */}
        {(proposal.status === 'aceita' || proposal.status === 'recusada') && (
          <Card className={`p-4 text-center ${
            proposal.status === 'aceita' 
              ? 'bg-emerald-50 border-emerald-300' 
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center justify-center gap-2">
              {proposal.status === 'aceita' ? (
                <Check className="h-6 w-6 text-emerald-600" />
              ) : (
                <X className="h-6 w-6 text-red-600" />
              )}
              <span className={`text-lg font-semibold ${
                proposal.status === 'aceita' ? 'text-emerald-700' : 'text-red-700'
              }`}>
                Esta proposta foi {proposal.status === 'aceita' ? 'ACEITA' : 'RECUSADA'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {proposal.status === 'aceita' 
                ? 'Agradecemos pela confiança! Nossa equipe entrará em contato.' 
                : 'Caso mude de ideia, entre em contato conosco.'}
            </p>
          </Card>
        )}

        {/* Aviso de Validade */}
        {proposal.expires_at && !['aceita', 'recusada'].includes(proposal.status) && (
          <Card className="p-3 bg-amber-50 border-amber-200 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              Esta proposta é válida até <strong>{new Date(proposal.expires_at).toLocaleString('pt-BR')}</strong>
            </span>
          </Card>
        )}

        {/* Resumo Rápido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 text-center bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-[#9C1E1E]">{buildings.length}</div>
            <div className="text-xs text-muted-foreground">Prédios</div>
          </Card>
          <Card className="p-3 text-center bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-[#9C1E1E]">{totalPanels}</div>
            <div className="text-xs text-muted-foreground">Telas</div>
          </Card>
          <Card className="p-3 text-center bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-[#9C1E1E]">{(totalImpressions / 1000).toFixed(0)}k</div>
            <div className="text-xs text-muted-foreground">Exibições/mês</div>
          </Card>
          <Card className="p-3 text-center bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-[#9C1E1E]">{proposal.duration_months}</div>
            <div className="text-xs text-muted-foreground">Meses</div>
          </Card>
        </div>

        {/* Lista de Prédios */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-[#9C1E1E]" />
            <h2 className="font-semibold">Prédios Incluídos</h2>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {buildings.map((building: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{building.building_name || building.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {building.bairro} • {building.quantidade_telas || 1} tela(s)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{((building.visualizacoes_mes || 0)).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">imp/mês</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Planos */}
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#9C1E1E]" />
            Escolha sua condição
          </h2>

          {/* Plano À Vista */}
          <Card 
            className={`p-4 cursor-pointer transition-all ${
              selectedPlan === 'avista' 
                ? 'border-2 border-[#9C1E1E] bg-gradient-to-br from-red-50 to-white shadow-lg' 
                : 'border hover:border-gray-300'
            }`}
            onClick={() => setSelectedPlan('avista')}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#9C1E1E] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {proposal.discount_percent}% OFF
                  </span>
                  <span className="font-bold">À Vista — Oferta Especial</span>
                </div>
                <p className="text-xs text-muted-foreground">Pagamento único — desconto aplicado</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#9C1E1E]">
                  {proposal.cash_total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-xs text-muted-foreground">
                  = {(proposal.cash_total_value / proposal.duration_months).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                </div>
              </div>
            </div>
          </Card>

          {/* Plano Fidelidade */}
          <Card 
            className={`p-4 cursor-pointer transition-all ${
              selectedPlan === 'fidelidade' 
                ? 'border-2 border-[#9C1E1E] bg-gradient-to-br from-red-50 to-white shadow-lg' 
                : 'border hover:border-gray-300'
            }`}
            onClick={() => setSelectedPlan('fidelidade')}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold mb-1">Plano Fidelidade — {proposal.duration_months} meses</div>
                <p className="text-xs text-muted-foreground">Pagamento mensal — fidelize e garanta slots</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {proposal.fidel_monthly_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Total: {fidelTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>
          </Card>

          {/* ==== BREAKDOWN DE PREÇO ==== */}
          {baseTotalValue > 0 && (
            <Card className="p-4 bg-gradient-to-br from-gray-50 to-white border-dashed border-gray-300">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Calculator className="h-4 w-4" />
                Como chegamos neste valor
              </h3>
              
              <div className="space-y-2 text-sm">
                {/* Valor Original */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Valor base ({proposal.duration_months} {proposal.duration_months === 1 ? 'mês' : 'meses'})
                  </span>
                  <span className="line-through text-muted-foreground">
                    {baseTotalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                
                {/* Desconto Plano */}
                {planDiscountPercent > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="flex items-center gap-1">
                      <span className="text-xs">✓</span>
                      Desconto Plano {proposal.duration_months}M ({planDiscountPercent}%)
                    </span>
                    <span>
                      - {planDiscountValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                )}
                
                {/* Subtotal após plano - só mostra se selecionou À Vista e tem desconto plano */}
                {selectedPlan === 'avista' && planDiscountPercent > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="line-through text-muted-foreground">
                      {afterPlanDiscount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                )}
                
                {/* Desconto PIX - só mostra se selecionou À Vista */}
                {selectedPlan === 'avista' && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="flex items-center gap-1">
                      <span className="text-xs">✓</span>
                      Desconto PIX à Vista ({pixDiscountPercent}%)
                    </span>
                    <span>
                      - {pixDiscountValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                )}
                
                {/* Divisor e Valor Final */}
                <div className="border-t pt-3 mt-3 space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-[#9C1E1E]">
                      {selectedPlan === 'avista' ? 'VALOR FINAL' : 'TOTAL DO CONTRATO'}
                    </span>
                    <span className="text-[#9C1E1E] text-lg">
                      {selectedPlan === 'avista' 
                        ? proposal.cash_total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : fidelTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      }
                    </span>
                  </div>
                  
                  {/* Mensalidade se fidelidade */}
                  {selectedPlan === 'fidelidade' && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Mensalidade</span>
                      <span className="font-medium">
                        {proposal.fidel_monthly_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                      </span>
                    </div>
                  )}
                  
                  {/* Badge de economia */}
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                      🎉 Economia de {selectedPlan === 'avista' ? totalSavingsAvista : totalSavingsFidelidade}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Botões de Ação - SÓ aparecem se proposta ainda pode ser respondida */}
        {!['aceita', 'recusada', 'expirada'].includes(proposal.status) && (
          <div className="space-y-3 pt-4">
            <Button
              className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleAccept}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Check className="h-5 w-5 mr-2" />
              )}
              Aceitar Proposta ({selectedPlan === 'avista' ? 'À Vista' : 'Fidelidade'})
            </Button>

            <Button
              variant="outline"
              className="w-full h-12"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Recusar Proposta
            </Button>
          </div>
        )}

        {/* Botão de baixar PDF - sempre visível */}
        <Button
          variant="outline"
          className="w-full h-10 text-sm"
          onClick={handleDownloadPDF}
          disabled={isDownloadingPDF}
        >
          {isDownloadingPDF ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Baixar Proposta em PDF
        </Button>

        {/* Contato */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm">
          <h3 className="font-semibold mb-2">Contato Comercial</h3>
          <div className="text-sm space-y-1">
            <div>{sellerName}</div>
            <div className="text-muted-foreground">{proposal.client_email || 'comercial@indexamidia.com.br'}</div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              {sellerPhone}
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-4">
          Proposta gerada automaticamente pelo sistema EXA Mídia
        </div>
      </div>
    </div>
  );
};

export default PropostaPublicaPage;
