import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { Check, X, MessageSquare, FileText, Building2, Eye, Clock, Phone, AlertTriangle, Loader2, Download, Mail, Zap, FileBarChart, Copy, Calculator, Gift, PartyPopper, Video, ExternalLink, Calendar, Globe, Users, Rocket, Lock, Pencil, Package, RefreshCw, DollarSign } from 'lucide-react';
import LogoTicker from '@/components/exa/LogoTicker';
import { format, addDays, addMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { supabase } from '@/integrations/supabase/client';
import { ProposalPDFExporter } from '@/components/admin/proposals/ProposalPDFExporter';
import { validateEmail } from '@/utils/inputValidation';
import { PaymentSuccessModal } from '@/components/public/PaymentSuccessModal';
import { ContractDataModal } from '@/components/public/ContractDataModal';
import { ContractFullPreview } from '@/components/public/ContractFullPreview';
import { ContractLoadingScreen } from '@/components/public/ContractLoadingScreen';
import { ProductShowcaseCard } from '@/components/public/proposal/ProductShowcaseCard';
import { TechnicalSpecsGrid } from '@/components/public/proposal/TechnicalSpecsGrid';
import { ProposalSummaryText } from '@/components/public/proposal/ProposalSummaryText';
import { ExclusivityChoiceCard } from '@/components/public/proposal/ExclusivityChoiceCard';
import { ProposalBuildingCard } from '@/components/public/proposal/ProposalBuildingCard';
import { PermutaChoiceCard } from '@/components/public/proposal/PermutaChoiceCard';
import { ClientLogoDisplay } from '@/components/proposals/ClientLogoDisplay';

// Contract flow type
type ContractFlowStep = 'idle' | 'loading' | 'collecting' | 'generating' | 'previewing' | 'accepted';
interface CustomInstallment {
  installment: number;
  due_date: string;
  amount: number;
}

interface Proposal {
  id: string;
  number: string;
  client_name: string;
  client_company_name?: string | null;
  client_cnpj: string | null;
  client_country?: 'BR' | 'AR' | 'PY' | null;
  client_phone: string | null;
  client_email: string | null;
  client_address?: string | null;
  client_latitude?: number | null;
  client_longitude?: number | null;
  client_logo_url?: string | null;
  selected_buildings: any[];
  total_panels: number;
  total_impressions_month: number;
  quantidade_posicoes?: number;
  fidel_monthly_value: number;
  cash_total_value: number;
  discount_percent: number;
  duration_months: number;
  is_custom_days?: boolean | null;
  custom_days?: number | null;
  status: string;
  created_at: string;
  sent_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  payment_type?: string;
  custom_installments?: any;
  tipo_produto?: 'horizontal' | 'vertical_premium';
  metadata?: {
    type?: string;
    cortesia_code_id?: string;
  };
  // Campos de Venda Futura
  venda_futura?: boolean | null;
  predios_contratados?: number | null;
  predios_instalados_no_fechamento?: number | null;
  predios_pendentes?: number | null;
  cortesia_inicio?: string | null;
  cortesia_fim?: string | null;
  meses_cortesia?: number | null;
  // Campo de Título
  titulo?: string | null;
  // Campos de Exclusividade de Segmento
  exclusividade_segmento?: boolean | null;
  segmento_exclusivo?: string | null;
  exclusividade_percentual?: number | null;
  exclusividade_valor_extra?: number | null;
  exclusividade_disponivel?: boolean | null;
  cliente_escolheu_exclusividade?: boolean | null;
  // Campos de Travamento de Preço
  travamento_preco_ativo?: boolean | null;
  travamento_preco_valor?: number | null;
  travamento_telas_atuais?: number | null;
  travamento_telas_limite?: number | null;
  travamento_preco_por_tela?: number | null;
  // Campos de Permuta (não-monetária)
  modalidade_proposta?: 'monetaria' | 'permuta' | null;
  itens_permuta?: any[] | null;
  valor_total_permuta?: number | null;
  ocultar_valores_publico?: boolean | null;
  descricao_contrapartida?: string | null;
  metodo_pagamento_alternativo?: string | null;
  valor_referencia_monetaria?: number | null;
}

interface PaymentData {
  method: 'pix' | 'boleto' | 'cartao_recorrente';
  paymentId?: string;
  subscriptionId?: string;
  status?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  dueDate?: string;
  initPoint?: string;
  monthlyValue?: number;
  totalMonths?: number;
}

// Helper para obter label do documento baseado no país
const getDocumentLabel = (country?: 'BR' | 'AR' | 'PY' | null): string => {
  switch (country) {
    case 'BR': return 'CNPJ';
    case 'AR': return 'CUIT';
    case 'PY': return 'RUC';
    default: return 'CNPJ';
  }
};

const PropostaPublicaPage = () => {
  const { id } = useParams<{ id: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [sellerName, setSellerName] = useState('Equipe EXA Mídia');
  const [sellerPhone, setSellerPhone] = useState('(45) 99141-5856');
  const [sellerEmail, setSellerEmail] = useState('comercial@indexamidia.com.br');
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
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'cartao_recorrente' | null>(null);
  const [diaVencimento, setDiaVencimento] = useState<5 | 10 | 15>(10);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  
  // Cortesia states
  const [isCortesia, setIsCortesia] = useState(false);
  const [cortesiaAccepted, setCortesiaAccepted] = useState(false);
  const [cortesiaPasswordLink, setCortesiaPasswordLink] = useState<string | null>(null);
  const [cortesiaIsNewUser, setCortesiaIsNewUser] = useState(false);
  const [isAcceptingCortesia, setIsAcceptingCortesia] = useState(false);
  
  // Current building data for accurate panel count
  const [enrichedBuildings, setEnrichedBuildings] = useState<any[]>([]);
  const [realTotalPanels, setRealTotalPanels] = useState(0);
  
  // Payment polling states
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [convertedOrderId, setConvertedOrderId] = useState<string | null>(null);
  const [isPollingPayment, setIsPollingPayment] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  
  // Exclusivity choice state - defaults to false (Proposta Padrão)
  const [clienteEscolheuExclusividade, setClienteEscolheuExclusividade] = useState<boolean>(false);
  // Contract flow states
  const [contractFlow, setContractFlow] = useState<ContractFlowStep>('idle');
  const [contractLoadingMessage, setContractLoadingMessage] = useState('');
  const [showContractDataModal, setShowContractDataModal] = useState(false);
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [contractClientData, setContractClientData] = useState<any>(null);
  const [generatedContract, setGeneratedContract] = useState<any>(null);
  const [generatedContractHtml, setGeneratedContractHtml] = useState<string>('');
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  
  // Existing contract tracking
  const [existingContractId, setExistingContractId] = useState<string | null>(null);
  const [hasExistingContract, setHasExistingContract] = useState(false);
  const [existingSignatoryData, setExistingSignatoryData] = useState<any>(null);
  const [isEditingSignatory, setIsEditingSignatory] = useState(false);
  const [hasSignatoryRegistered, setHasSignatoryRegistered] = useState(false);

  // Track page view time with heartbeat system (works on mobile!)
  const pageLoadTime = React.useRef<number>(Date.now());
  const lastSentTime = React.useRef<number>(0);
  
  // Gerar session ID único para esta visita
  const getSessionId = React.useCallback(() => {
    const storageKey = 'pv_session_' + id;
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const newId = crypto.randomUUID();
    sessionStorage.setItem(storageKey, newId);
    return newId;
  }, [id]);
  
  // Register view on mount and heartbeat every 15 seconds
  useEffect(() => {
    if (!id) return;
    
    const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    const referrer = document.referrer || 'direct';
    const sessionId = getSessionId();
    
    // Register view entry ONCE with full tracking data
    supabase.functions.invoke('track-proposal-view', {
      body: {
        proposalId: id,
        action: 'enter',
        deviceType,
        userAgent: navigator.userAgent,
        sessionId,
        referrer
      }
    }).then(() => {
      console.log('✅ View registered with session:', sessionId);
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
            timeSpentSeconds: incrementalTime,
            sessionId
          }
        }).then(() => {
          console.log(`⏱️ Heartbeat: +${incrementalTime}s`);
          lastSentTime.current = currentTimeSpent;
        }).catch(() => {});
      }
    }, 15000); // 15 segundos
    
    // Handler para quando usuário sai da página
    const handleLeave = () => {
      const finalTime = Math.floor((Date.now() - pageLoadTime.current) / 1000);
      const remaining = finalTime - lastSentTime.current;
      
      // Usar sendBeacon para garantir envio mesmo ao sair
      const leaveData = JSON.stringify({ 
        proposalId: id, 
        action: 'leave', 
        timeSpentSeconds: remaining,
        sessionId
      });
      
      navigator.sendBeacon?.(
        `https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/track-proposal-view`,
        new Blob([leaveData], { type: 'application/json' })
      );
    };
    
    // Registrar eventos de saída
    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleLeave();
      }
    });
    
    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleLeave);
      window.removeEventListener('pagehide', handleLeave);
      
      // Final send on unmount
      const finalTime = Math.floor((Date.now() - pageLoadTime.current) / 1000);
      const remaining = finalTime - lastSentTime.current;
      if (remaining > 0) {
        supabase.functions.invoke('track-proposal-view', {
          body: { proposalId: id, action: 'leave', timeSpentSeconds: remaining, sessionId }
        }).catch(() => {});
      }
    };
  }, [id]);

  // Payment polling - check every 5 seconds if payment was approved
  useEffect(() => {
    if (!isPollingPayment || !proposal?.id || !paymentData?.paymentId) return;
    
    console.log('🔄 POLLING: Iniciando verificação de pagamento', { paymentId: paymentData.paymentId });
    
    const checkPaymentStatus = async () => {
      try {
        // Check if proposal was converted (payment approved)
        const { data: proposalData, error } = await supabase
          .from('proposals')
          .select('status, converted_order_id')
          .eq('id', proposal.id)
          .single();
        
        if (error) {
          console.error('❌ Erro ao verificar status:', error);
          return;
        }
        
        console.log('📊 Status atual:', proposalData);
        
        if (proposalData?.status === 'convertida' && proposalData.converted_order_id) {
          console.log('🎉 PAGAMENTO APROVADO! Order ID:', proposalData.converted_order_id);
          
          // ✅ VERIFICAR SE PRECISA DE CONFIGURAÇÃO DE SENHA
          // Buscar do proposal_logs se needs_password_setup é true
          const { data: logData } = await supabase
            .from('proposal_logs')
            .select('details')
            .eq('proposal_id', proposal.id)
            .eq('action', 'convertida_em_pedido')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          const logDetails = logData?.details as Record<string, any> | null;
          const needsPassword = logDetails?.needs_password_setup === true;
          console.log('🔐 Precisa configurar senha:', needsPassword);
          
          setIsPollingPayment(false);
          setConvertedOrderId(proposalData.converted_order_id);
          setNeedsPasswordSetup(needsPassword);
          setShowPaymentSuccess(true);
        }
      } catch (err) {
        console.error('❌ Erro no polling:', err);
      }
    };
    
    // Check immediately
    checkPaymentStatus();
    
    // Then poll every 5 seconds
    const pollInterval = setInterval(checkPaymentStatus, 5000);
    
    return () => {
      console.log('🛑 POLLING: Parando verificação');
      clearInterval(pollInterval);
    };
  }, [isPollingPayment, proposal?.id, paymentData?.paymentId]);

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

        // Detectar se já existe contrato gerado para esta proposta
        const metadata = data.metadata as any;
        if (metadata?.contract_id) {
          console.log('📄 Contrato já existe para esta proposta:', metadata.contract_id);
          setExistingContractId(metadata.contract_id);
          setHasExistingContract(true);
          
          // Verificar se já existe signatário do tipo 'cliente' registrado
          const { data: signatario } = await supabase
            .from('contrato_signatarios')
            .select('id')
            .eq('contrato_id', metadata.contract_id)
            .eq('tipo', 'cliente')
            .maybeSingle();
          
          if (signatario) {
            console.log('👤 Signatário cliente já registrado:', signatario.id);
            setHasSignatoryRegistered(true);
          }
        }

        // Detectar se é uma cortesia
        if (metadata?.type === 'cortesia') {
          setIsCortesia(true);
          console.log('🎁 Proposta é uma CORTESIA');
        }

        // Fetch CURRENT building data for accurate panel count, impressions and price
        const buildings = Array.isArray(data.selected_buildings) ? data.selected_buildings : [];
        const buildingIds = buildings.map((b: any) => b.building_id).filter(Boolean);
        
        if (buildingIds.length > 0) {
          const { data: currentBuildingsData } = await supabase
            .from('buildings')
            .select('id, quantidade_telas, numero_elevadores, visualizacoes_mes, preco_base, preco_trimestral, preco_semestral, preco_anual, imagem_principal, imageurl, codigo_predio, publico_estimado, bairro, endereco, nome')
            .in('id', buildingIds);

          if (currentBuildingsData) {
            // Create map of current data with ALL fields including plan prices and images
            const buildingsMap = new Map(currentBuildingsData.map(b => [
              b.id,
              {
                // IMPORTANTE: não usar "||" aqui porque 0 é um valor válido.
                // Se vier 0, precisamos preservar para conseguir filtrar corretamente.
                quantidade_telas: (b.quantidade_telas ?? b.numero_elevadores ?? 1),
                visualizacoes_mes: (b.visualizacoes_mes ?? 0),
                preco_base: (b.preco_base ?? 0),
                preco_trimestral: (b.preco_trimestral ?? 0),
                preco_semestral: (b.preco_semestral ?? 0),
                preco_anual: (b.preco_anual ?? 0),
                imagem_principal: (b.imagem_principal ?? null),
                imageurl: (b.imageurl ?? null),
                codigo_predio: (b.codigo_predio ?? null),
                publico_estimado: (b.publico_estimado ?? 0),
                bairro: (b.bairro ?? null),
                endereco: (b.endereco ?? null),
                nome: (b.nome ?? null)
              }
            ]));

            // Enrich selected_buildings with REAL current data from database including images
            const enriched = buildings.map((b: any) => {
              const hasBuildingId = Boolean(b?.building_id);
              const currentData = hasBuildingId ? buildingsMap.get(b.building_id) : undefined;

              return {
                ...b,
                // Enriquecer com dados atuais do banco, mas NUNCA remover item da proposta.
                // Fallback para o valor salvo na proposta, depois para 1.
                quantidade_telas: currentData?.quantidade_telas ?? b.quantidade_telas ?? 1,
                visualizacoes_mes: hasBuildingId
                  ? (currentData?.visualizacoes_mes ?? b.visualizacoes_mes ?? 0)
                  : 0,
                preco_base: hasBuildingId
                  ? (currentData?.preco_base ?? b.preco_base ?? 0)
                  : 0,
                preco_trimestral: hasBuildingId ? (currentData?.preco_trimestral ?? 0) : 0,
                preco_semestral: hasBuildingId ? (currentData?.preco_semestral ?? 0) : 0,
                preco_anual: hasBuildingId ? (currentData?.preco_anual ?? 0) : 0,
                imagem_principal: hasBuildingId ? (currentData?.imagem_principal ?? null) : null,
                imageurl: hasBuildingId ? (currentData?.imageurl ?? null) : null,
                codigo_predio: hasBuildingId ? (currentData?.codigo_predio ?? null) : null,
                publico_estimado: hasBuildingId ? (currentData?.publico_estimado ?? 0) : 0,
                bairro: hasBuildingId ? (currentData?.bairro ?? b.bairro ?? null) : null,
                endereco: hasBuildingId ? (currentData?.endereco ?? b.endereco ?? null) : null,
                nome: hasBuildingId ? (currentData?.nome ?? b.building_name ?? null) : (b.building_name ?? null)
              };
            });

            setEnrichedBuildings(enriched);
            
            // Calculate real total panels
            const total = enriched.reduce((sum: number, b: any) => 
              sum + (b.quantidade_telas || 1), 0
            );
            setRealTotalPanels(total);
            
            const totalViews = enriched.reduce((sum: number, b: any) => 
              sum + (b.visualizacoes_mes || 0), 0
            );
            console.log('📊 Dados reais atualizados:', { telas: total, visualizacoes: totalViews });
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

        // Usar dados do vendedor salvos na proposta
        if (data.seller_name) {
          setSellerName(data.seller_name);
        }
        if (data.seller_phone) {
          setSellerPhone(data.seller_phone);
        }
        if (data.seller_email) {
          setSellerEmail(data.seller_email);
        }
        
        // Se existir created_by e o usuário está autenticado, sincronizar dados do vendedor a partir do cadastro de usuários
        // (garante que link público e PDF usem exatamente os dados do modal de Usuários)
        if (data.created_by) {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            const { data: userData } = await supabase
              .from('users')
              .select('nome, telefone, email')
              .eq('id', data.created_by)
              .maybeSingle();

            if (userData) {
              const nextSellerName = userData.nome || data.seller_name || undefined;
              const nextSellerPhone = userData.telefone || data.seller_phone || undefined;
              const nextSellerEmail = userData.email || data.seller_email || undefined;

              const shouldUpdateProposal =
                (!!nextSellerName && nextSellerName !== data.seller_name) ||
                (!!nextSellerPhone && nextSellerPhone !== data.seller_phone) ||
                (!!nextSellerEmail && nextSellerEmail !== data.seller_email);

              if (nextSellerName) setSellerName(nextSellerName);
              if (nextSellerPhone) setSellerPhone(nextSellerPhone);
              if (nextSellerEmail) setSellerEmail(nextSellerEmail);

              if (shouldUpdateProposal) {
                await supabase
                  .from('proposals')
                  .update({
                    seller_name: nextSellerName ?? null,
                    seller_phone: nextSellerPhone ?? null,
                    seller_email: nextSellerEmail ?? null,
                  })
                  .eq('id', id);
              }
            }
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

      // 🔔 Notificar vendedor via EXA Alerts
      supabase.functions.invoke('notify-proposal-event', {
        body: {
          proposalId: proposal.id,
          eventType: 'proposal_accepted',
          metadata: { selectedPlan }
        }
      }).then(() => {
        console.log('🔔 Notificação EXA Alerts enviada (proposal_accepted)');
      }).catch(err => {
        console.error('⚠️ Erro ao enviar notificação EXA Alerts:', err);
      });

      // Check if email capture needed
      if (!proposal.client_email) {
        setShowEmailCapture(true);
      } else {
        // Send immediate acceptance email (EMAIL 1)
        supabase.functions.invoke('send-proposal-accepted-notification', {
          body: {
            proposalId: proposal.id,
            clientEmail: proposal.client_email,
            selectedPlan
          }
        }).then(() => {
          console.log('✅ Email de aceitação enviado');
        }).catch(err => {
          console.error('❌ Erro ao enviar email de aceitação:', err);
        });
      }

      setShowSuccess(true);
    } catch (err) {
      console.error('Erro ao aceitar proposta:', err);
      toast.error('Erro ao processar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle "Ver Contrato" button - starts contract flow or opens existing
  const handleViewContract = async () => {
    if (!proposal) return;
    
    setContractFlow('loading');
    setContractLoadingMessage('Analisando seus dados...');
    
    // Se já existe contrato, buscar e exibir sem pedir dados novamente
    if (hasExistingContract && existingContractId) {
      console.log('📄 Buscando contrato existente:', existingContractId);
      setContractLoadingMessage('Carregando seu contrato...');
      
      try {
        // Chamar edge function SEM clientData para modo visualização
        const { data: contractResponse, error: contractError } = await supabase.functions.invoke(
          'create-contract-from-proposal',
          {
            body: {
              proposalId: proposal.id,
              preview_only: false
              // Não enviar clientData = modo visualização
            }
          }
        );
        
        if (contractError) {
          console.error('Erro ao buscar contrato:', contractError);
          throw new Error('Erro ao carregar contrato');
        }
        
        if (contractResponse?.success) {
          console.log('✅ Contrato existente carregado');
          setGeneratedContractHtml(contractResponse.contractHtml || '');
          setGeneratedContract(contractResponse.contrato);
          
          // Salvar dados do signatário para pré-preencher edição
          if (contractResponse.signatory_data) {
            setExistingSignatoryData(contractResponse.signatory_data);
          }
          
          setContractFlow('previewing');
          setShowContractPreview(true);
          return;
        }
      } catch (err: any) {
        console.error('Erro ao carregar contrato existente:', err);
        toast.error('Erro ao carregar contrato');
        setContractFlow('idle');
        return;
      }
    }
    
    // Simulate analysis delay for UX
    await new Promise(r => setTimeout(r, 1200));
    
    // Extract existing data from proposal
    const nameParts = (proposal.client_name || '').split(' ');
    const existingData = {
      primeiro_nome: nameParts[0] || '',
      sobrenome: nameParts.slice(1).join(' ') || '',
      email: proposal.client_email || '',
      telefone: proposal.client_phone || '',
      cpf: '', // Always need to collect for ClickSign
      data_nascimento: '' // Always need to collect for ClickSign
    };
    
    setContractLoadingMessage('Precisamos de algumas informações...');
    await new Promise(r => setTimeout(r, 600));
    
    // Always collect CPF and birth date (required for ClickSign)
    setContractClientData(existingData);
    setContractFlow('collecting');
    setShowContractDataModal(true);
  };

  // Handle edit signatory button click
  const handleEditSignatory = () => {
    if (!proposal) return;
    
    // Usar dados existentes do signatário se disponível
    if (existingSignatoryData) {
      setContractClientData(existingSignatoryData);
    } else {
      // Fallback: extrair da proposta
      const nameParts = (proposal.client_name || '').split(' ');
      setContractClientData({
        primeiro_nome: nameParts[0] || '',
        sobrenome: nameParts.slice(1).join(' ') || '',
        email: proposal.client_email || '',
        telefone: proposal.client_phone || '',
        cpf: '',
        data_nascimento: ''
      });
    }
    
    setIsEditingSignatory(true);
    setShowContractDataModal(true);
  };

  // Handle contract data collection complete
  const handleContractDataComplete = async (data: any) => {
    if (!proposal) return;
    
    setShowContractDataModal(false);
    setContractFlow('generating');
    setContractLoadingMessage(isEditingSignatory ? 'Atualizando dados...' : 'Gerando seu contrato...');
    
    try {
      // Chamar edge function para criar/atualizar contrato no Supabase
      const { data: contractResponse, error: contractError } = await supabase.functions.invoke(
        'create-contract-from-proposal',
        {
          body: {
            proposalId: proposal.id,
            clientData: {
              primeiro_nome: data.primeiro_nome,
              sobrenome: data.sobrenome,
              data_nascimento: data.data_nascimento,
              cpf: data.cpf,
              email: data.email,
              telefone: data.telefone
            }
          }
        }
      );
      
      if (contractError) {
        console.error('Erro ao criar/atualizar contrato:', contractError);
        throw new Error('Erro ao processar contrato no servidor');
      }
      
      if (!contractResponse?.success) {
        throw new Error(contractResponse?.error || 'Erro desconhecido ao criar contrato');
      }
      
      console.log('✅ Contrato processado no Supabase:', contractResponse.contrato);
      
      // Armazenar o HTML completo do contrato gerado pela edge function
      const contractHtmlContent = contractResponse.contractHtml || '';
      
      setContractLoadingMessage(isEditingSignatory ? 'Dados atualizados!' : 'Contrato pronto!');
      await new Promise(r => setTimeout(r, 500));
      
      setGeneratedContractHtml(contractHtmlContent);
      setGeneratedContract(contractResponse.contrato);
      setContractClientData(data);
      setExistingSignatoryData(data); // Atualizar dados locais
      setContractFlow('previewing');
      setShowContractPreview(true);
      
      // Se já existe contrato e estávamos editando, marcar como existente
      if (contractResponse.existing_contract || contractResponse.updated) {
        setHasExistingContract(true);
        if (contractResponse.contrato?.id) {
          setExistingContractId(contractResponse.contrato.id);
        }
      }
      
      // Reset editing state
      setIsEditingSignatory(false);
      
      if (isEditingSignatory) {
        toast.success('Dados do signatário atualizados!');
      }
      
    } catch (err: any) {
      console.error('Erro ao processar contrato:', err);
      toast.error(err.message || 'Erro ao processar contrato');
      setContractFlow('idle');
      setIsEditingSignatory(false);
    }
  };

  // Aceitar cortesia (cria conta + pedido)
  const handleAcceptCortesia = async () => {
    if (!proposal || isAcceptingCortesia) return;
    
    setIsAcceptingCortesia(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-cortesia-proposal', {
        body: { proposalId: proposal.id }
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao aceitar cortesia');
      }

      setCortesiaAccepted(true);
      setCortesiaIsNewUser(data.isNewUser);
      setCortesiaPasswordLink(data.passwordResetLink);
      
      toast.success('🎁 Presente aceito com sucesso!');
    } catch (err: any) {
      console.error('Erro ao aceitar cortesia:', err);
      toast.error(err.message || 'Erro ao processar. Tente novamente.');
    } finally {
      setIsAcceptingCortesia(false);
    }
  };

  // Generate payment (PIX, Boleto or Card Subscription)
  const handleGeneratePayment = async () => {
    if (!proposal || !paymentMethod) return;
    
    // Verificar se é pagamento personalizado
    const isCustomPayment = proposal.payment_type === 'custom' && Array.isArray(proposal.custom_installments) && proposal.custom_installments.length > 0;
    
    // Handle credit card subscription (recurring)
    if (paymentMethod === 'cartao_recorrente') {
      setIsGeneratingPayment(true);
      setPaymentStep('generating');
      
      try {
        const emailToUse = emailInput || proposal.client_email || '';
        
        const { data, error } = await supabase.functions.invoke('create-subscription-payment', {
          body: {
            proposalId: proposal.id,
            clientEmail: emailToUse
          }
        });

        if (error) throw error;
        
        if (!data?.success) {
          throw new Error(data?.error || 'Erro ao criar assinatura');
        }

        // Redirect to Mercado Pago checkout
        if (data.initPoint) {
          toast.success('Redirecionando para pagamento...');
          window.location.href = data.initPoint;
        } else {
          throw new Error('URL de pagamento não disponível');
        }
        
      } catch (err: any) {
        console.error('Erro ao criar assinatura:', err);
        toast.error(err.message || 'Erro ao criar assinatura');
        setPaymentStep('select');
      } finally {
        setIsGeneratingPayment(false);
      }
      return;
    }
    
    // Calcular valor a ser pago
    let paymentValue: number;
    
    if (isCustomPayment) {
      // Pagamento personalizado: apenas 1ª parcela
      paymentValue = Number(proposal.custom_installments[0].amount);
      console.log('💳 Pagamento personalizado - 1ª parcela:', paymentValue);
    } else {
      // Pagamento padrão
      paymentValue = selectedPlan === 'avista' 
        ? proposal.cash_total_value 
        : proposal.fidel_monthly_value * proposal.duration_months;
    }
    
    // Validar valor mínimo do Mercado Pago (R$ 5,00) - apenas para boleto
    if (paymentMethod === 'boleto' && paymentValue < 5) {
      toast.error('O valor mínimo para pagamento via Boleto é R$ 5,00. Entre em contato com o vendedor.');
      return;
    }
    
    setIsGeneratingPayment(true);
    setPaymentStep('generating');
    
    try {
      const emailToUse = emailInput || proposal.client_email || '';
      
      const { data, error } = await supabase.functions.invoke('generate-proposal-payment', {
        body: {
          proposalId: proposal.id,
          paymentMethod,
          selectedPlan: isCustomPayment ? 'custom' : selectedPlan,
          clientEmail: emailToUse,
          diaVencimento: paymentMethod === 'boleto' ? diaVencimento : undefined,
          isCustomPayment,
          installmentNumber: isCustomPayment ? 1 : undefined
        }
      });

      if (error) throw error;
      
      if (!data?.success) {
        // Verificar se é erro de valor mínimo
        if (data?.error?.includes('5') || data?.error?.includes('mínimo')) {
          throw new Error('Valor abaixo do mínimo permitido (R$ 5,00). Entre em contato com o vendedor.');
        }
        throw new Error(data?.error || 'Erro ao gerar pagamento');
      }

      setPaymentData(data.paymentData);
      setPaymentStep('ready');
      
      // Start polling for payment status (PIX only)
      if (paymentMethod === 'pix') {
        setIsPollingPayment(true);
      }
      
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

  // Aceitar proposta com pagamento personalizado
  const handleAcceptCustom = async () => {
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
          payment_type: 'custom',
          installments_count: proposal.custom_installments?.length || 0,
          first_installment_value: proposal.custom_installments?.[0]?.amount,
          timestamp: new Date().toISOString()
        }
      });

      // Check if email capture needed
      if (!proposal.client_email) {
        setShowEmailCapture(true);
      } else {
        // Send immediate acceptance email
        supabase.functions.invoke('send-proposal-accepted-notification', {
          body: {
            proposalId: proposal.id,
            clientEmail: proposal.client_email,
            selectedPlan: 'custom'
          }
        }).catch(err => {
          console.error('❌ Erro ao enviar email de aceitação:', err);
        });
      }

      setShowSuccess(true);
    } catch (err) {
      console.error('Erro ao aceitar proposta:', err);
      toast.error('Erro ao processar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send confirmation email with payment data
  const sendConfirmationEmail = async (email: string, payment?: PaymentData) => {
    if (!email) return;
    
    // Detect if custom payment
    const isCustom = proposal?.payment_type === 'custom';
    
    try {
      const { error } = await supabase.functions.invoke('send-proposal-accepted-email', {
        body: {
          proposalId: proposal?.id,
          clientEmail: email,
          selectedPlan: isCustom ? 'custom' : selectedPlan,
          paymentMethod: payment?.method,
          paymentData: payment,
          // Custom payment fields
          isCustomPayment: isCustom,
          customInstallments: isCustom ? proposal?.custom_installments : undefined,
          currentInstallment: isCustom ? 1 : undefined
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
      // Pass enriched buildings and cortesia info
      await exporter.generateProposalPDF(
        { 
          ...proposal, 
          selected_buildings: enrichedBuildings.length > 0 ? enrichedBuildings : proposal.selected_buildings,
          tipo_produto: proposal.tipo_produto || 'horizontal'
        },
        sellerName,
        isCortesia,
        baseTotalValue,
        sellerPhone
      );
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

      // 🔔 Notificar vendedor via EXA Alerts
      supabase.functions.invoke('notify-proposal-event', {
        body: {
          proposalId: proposal.id,
          eventType: 'proposal_rejected'
        }
      }).then(() => {
        console.log('🔔 Notificação EXA Alerts enviada (proposal_rejected)');
      }).catch(err => {
        console.error('⚠️ Erro ao enviar notificação EXA Alerts:', err);
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

  // Cortesia aceita - tela de sucesso especial
  if (cortesiaAccepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/95 backdrop-blur-sm shadow-xl">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Gift className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">🎉 Presente Aceito!</h1>
          <p className="text-muted-foreground mb-6">
            Sua cortesia foi ativada com sucesso!
          </p>

          {cortesiaIsNewUser && cortesiaPasswordLink && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-left">
              <p className="text-sm font-medium text-amber-800 mb-2">📧 Próximo passo:</p>
              <p className="text-sm text-amber-700 mb-3">
                Enviamos um e-mail para você definir sua senha e acessar sua área do anunciante.
              </p>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => window.open(cortesiaPasswordLink, '_blank')}
              >
                Definir Minha Senha
              </Button>
            </div>
          )}

          <div className="bg-emerald-50 rounded-xl p-4 text-left space-y-2 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-emerald-600">✅</span>
              <span>Seu pedido foi criado automaticamente</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-emerald-600">📹</span>
              <span>Faça upload do seu vídeo (15s horizontal)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-emerald-600">🚀</span>
              <span>Após aprovação, seu anúncio entrará no ar!</span>
            </p>
          </div>
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

              {/* Cartão de Crédito Recorrente Option */}
              <Card 
                className={`p-4 cursor-pointer transition-all border-2 ${
                  paymentMethod === 'cartao_recorrente' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPaymentMethod('cartao_recorrente')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    paymentMethod === 'cartao_recorrente' ? 'bg-purple-500' : 'bg-gray-100'
                  }`}>
                    <svg className={`h-5 w-5 ${paymentMethod === 'cartao_recorrente' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-2">
                      Cartão de Crédito
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Recorrente</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        proposal?.fidel_monthly_value || 0
                      )}/mês • {proposal?.duration_months || 1} {(proposal?.duration_months || 1) === 1 ? 'mês' : 'meses'}
                    </div>
                  </div>
                  {paymentMethod === 'cartao_recorrente' && (
                    <Check className="h-5 w-5 text-purple-500" />
                  )}
                </div>

                {/* Info about recurring */}
                {paymentMethod === 'cartao_recorrente' && (
                  <div className="mt-4 pt-3 border-t border-purple-200">
                    <div className="bg-purple-100 rounded-lg p-3 text-xs text-purple-800">
                      <p className="font-medium mb-1">💳 Como funciona:</p>
                      <p>Seu cartão será cobrado automaticamente todo mês, apenas o valor mensal de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal?.fidel_monthly_value || 0)}</strong>.</p>
                      <p className="mt-1 text-purple-600">Similar a Netflix/Spotify - débito mensal automático.</p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Generate Payment Button - Dynamic based on selection */}
              <Button
                className="w-full h-12 bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
                disabled={!paymentMethod || isGeneratingPayment}
                onClick={handleGeneratePayment}
              >
                {isGeneratingPayment ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {paymentMethod === 'cartao_recorrente' ? 'Criando assinatura...' : 'Gerando...'}
                  </>
                ) : paymentMethod === 'pix' ? (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Pagar com PIX
                  </>
                ) : paymentMethod === 'boleto' ? (
                  <>
                    <FileBarChart className="h-5 w-5 mr-2" />
                    Gerar Boleto
                  </>
                ) : paymentMethod === 'cartao_recorrente' ? (
                  <>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    Pagar com Cartão
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Selecione um método
                  </>
                )}
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
                {isPollingPayment && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center justify-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Aguardando confirmação do pagamento...
                  </p>
                )}
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
                variant="outline"
                className="w-full h-10 border-gray-300 text-gray-600 hover:bg-gray-50"
                onClick={() => {
                  setIsPollingPayment(false);
                  window.location.href = '/';
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Pagar Depois
              </Button>
              
              {/* Payment Success Modal */}
              <PaymentSuccessModal
                isOpen={showPaymentSuccess}
                orderId={convertedOrderId || undefined}
                clientName={proposal?.client_name}
                clientEmail={proposal?.client_email || undefined}
                needsPasswordSetup={needsPasswordSetup}
                onClose={() => setShowPaymentSuccess(false)}
              />
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
                variant="outline"
                className="w-full h-10 border-gray-300 text-gray-600 hover:bg-gray-50"
                onClick={() => window.location.href = '/'}
              >
                <Clock className="h-4 w-4 mr-2" />
                Pagar Depois
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

  // Use enriched building data - A proposta salva é a fonte de verdade absoluta
  const allBuildings = enrichedBuildings.length > 0 ? enrichedBuildings : (proposal.selected_buildings || []);
  // CORREÇÃO CRÍTICA: Só filtrar por building_id (itens sem ID são lixo de dados).
  // NÃO filtrar por quantidade_telas — prédios com 0 telas fazem parte da proposta salva.
  const buildings = allBuildings.filter((b: any) => Boolean(b?.building_id));
  const totalPanels = realTotalPanels || proposal.total_panels || buildings.reduce((sum: number, b: any) => sum + (b.quantidade_telas || 1), 0);
  const totalImpressions = proposal.total_impressions_month || buildings.reduce((sum: number, b: any) => sum + (b.visualizacoes_mes || 0), 0);
  const fidelTotal = proposal.fidel_monthly_value * proposal.duration_months;

  // ============ VARIÁVEIS PARA VENDA FUTURA ============
  // Quando é venda futura, usar predios_contratados e telas estimadas
  const isVendaFutura = proposal.venda_futura && (proposal.predios_contratados ?? 0) > 0;
  
  // Número de prédios para exibição (contratados se venda futura, senão os selecionados)
  const displayBuildingsCount = isVendaFutura 
    ? proposal.predios_contratados! 
    : buildings.length;
  
  // Número de telas para exibição (estimadas se venda futura, senão as reais)
  const displayPanelsCount = isVendaFutura 
    ? Math.ceil((proposal.predios_contratados ?? 0) * 1.35) 
    : totalPanels;
  
  // Exibições estimadas para venda futura — oficial 2026:
  // Horizontal: 15.060/mês por tela · Vertical Premium: 5.010/mês por tela
  const exibicoesPorTelaMes = proposal.tipo_produto === 'vertical_premium' ? 5010 : 15060;
  const displayImpressions = isVendaFutura 
    ? displayPanelsCount * exibicoesPorTelaMes 
    : totalImpressions;

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
  
  // ==== VALORES DINÂMICOS COM EXCLUSIVIDADE ====
  // Se cliente escolheu exclusividade, adicionar o valor extra
  const hasExclusivity = proposal.exclusividade_segmento && proposal.exclusividade_disponivel;
  const exclusivityMultiplier = clienteEscolheuExclusividade ? (1 + (proposal.exclusividade_percentual || 35) / 100) : 1;
  const exclusivityExtraValue = clienteEscolheuExclusividade ? (proposal.exclusividade_valor_extra || 0) : 0;
  
  // Valores finais ajustados pela exclusividade
  const displayCashValue = proposal.cash_total_value + exclusivityExtraValue;
  const displayFidelMonthly = proposal.fidel_monthly_value * exclusivityMultiplier;
  const displayFidelTotal = displayFidelMonthly * proposal.duration_months;
  
  // Economia total À Vista
  const totalSavingsAvista = baseTotalValue > 0 
    ? ((baseTotalValue - proposal.cash_total_value) / baseTotalValue * 100).toFixed(1)
    : '0';
    
  // Economia total Fidelidade
  const totalSavingsFidelidade = baseTotalValue > 0
    ? ((baseTotalValue - fidelTotal) / baseTotalValue * 100).toFixed(1)
    : '0';

  return (
    <>
      <Helmet>
        <title>{proposal.client_company_name || proposal.client_name} | Proposta Comercial EXA</title>
        <meta name="description" content={`Proposta comercial de publicidade inteligente em elevadores para ${proposal.client_company_name || proposal.client_name}. ${proposal.total_panels} telas em ${proposal.selected_buildings?.length || 0} prédios.`} />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2" />
        <meta property="og:title" content={`${proposal.client_company_name || proposal.client_name} | Proposta EXA`} />
        <meta property="og:description" content={`Proposta comercial de publicidade inteligente em elevadores para ${proposal.client_company_name || proposal.client_name}`} />
        <meta property="og:image" content="https://www.examidia.com.br/og-image.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="EXA Publicidade Inteligente" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${proposal.client_company_name || proposal.client_name} | Proposta EXA`} />
        <meta name="twitter:description" content={`Proposta comercial de publicidade inteligente em elevadores para ${proposal.client_company_name || proposal.client_name}`} />
        <meta name="twitter:image" content="https://www.examidia.com.br/og-image.png" />
      </Helmet>

      {/* Contract Flow: Loading Screen */}
      {contractFlow === 'loading' && (
        <ContractLoadingScreen message={contractLoadingMessage} />
      )}

      {/* Contract Flow: Data Collection Modal */}
      {(contractFlow === 'collecting' || isEditingSignatory) && (
        <ContractDataModal
          isOpen={showContractDataModal}
          onClose={() => {
            setShowContractDataModal(false);
            setContractFlow('idle');
            setIsEditingSignatory(false);
          }}
          onComplete={handleContractDataComplete}
          initialData={contractClientData}
          isLoading={false}
          isEditing={isEditingSignatory}
        />
      )}

      {/* Contract Flow: Generating */}
      {contractFlow === 'generating' && (
        <ContractLoadingScreen message={contractLoadingMessage} step={1} />
      )}

      {/* Contract Flow: Preview (Read-Only Draft) */}
      {contractFlow === 'previewing' && generatedContractHtml && (
        <ContractFullPreview
          isOpen={showContractPreview}
          onClose={() => {
            setShowContractPreview(false);
            setContractFlow('idle');
          }}
          contractHtml={generatedContractHtml}
        />
      )}

    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 select-text public-page">
      {/* Header - Always EXA Red - Enhanced Design */}
      <header className="bg-gradient-to-r from-[#4a0f0f] via-[#6B1515] to-[#7D1818] text-white px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Logo + Title Row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Logo */}
            <div className="w-24 h-20 sm:w-36 md:w-48 sm:h-28 md:h-36 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20">
              <UnifiedLogo 
                size="custom" 
                variant="light"
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40"
              />
            </div>
            
            {/* Title & Type */}
            <div className="flex-1 text-center sm:text-left">
              {isCortesia ? (
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <Gift className="h-6 w-6 sm:h-8 sm:w-8" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Presente Cortesia</h1>
                  <PartyPopper className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    Proposta Comercial
                  </h1>
                  {/* Título Customizado da Proposta */}
                  {proposal.titulo && (
                    <p className="text-lg sm:text-xl md:text-2xl font-medium text-white/90 mb-2">
                      {proposal.titulo}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                      {proposal.tipo_produto === 'vertical_premium' ? 'Vertical Premium' : 'Horizontal'}
                    </span>
                    <span className="bg-white/10 px-3 py-1 rounded-full text-xs sm:text-sm">
                      #{proposal.number}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Client Info - Prominent Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-white/20">
            <div className="flex items-start justify-between gap-4">
              {/* Left: Company Info */}
              <div className="flex-1">
                {/* Company Name - Large & Bold */}
                {proposal.client_company_name && (
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 opacity-80" />
                    {proposal.client_company_name}
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm sm:text-base opacity-90">
                  <div>
                    {isCortesia ? 'Presenteado:' : 'Responsável:'}{' '}
                    <strong>{proposal.client_name}</strong>
                  </div>
                  {proposal.client_cnpj && (
                    <div className="text-white/80">{getDocumentLabel(proposal.client_country)}: <strong>{proposal.client_cnpj}</strong></div>
                  )}
                </div>
                
                {proposal.client_address && (
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm opacity-70 mt-2">
                    📍 {proposal.client_address}
                  </div>
                )}
              </div>
              
              {/* Right: Client Logo (branca) - com signed URL para buckets privados */}
              {proposal.client_logo_url && (
                <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center flex-shrink-0">
                  <ClientLogoDisplay 
                    logoUrl={proposal.client_logo_url}
                    className={`w-full h-full object-contain ${proposal.client_logo_url?.includes('#original') ? '' : 'filter brightness-0 invert'}`}
                    containerClassName="w-full h-full"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Status Badges */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
            <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs sm:text-sm">
              📅 {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
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
                <span className={`${config.bg} px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-lg`}>
                  {config.text}
                </span>
              );
            })()}
            {isCortesia && (
              <span className="bg-white text-[#9C1E1E] px-3 py-1 rounded-full text-xs sm:text-sm font-bold animate-pulse shadow-lg">
                🎁 CORTESIA
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Logo Ticker - Prova Social */}
      <div className="w-full bg-[#7D1818] overflow-hidden">
        <LogoTicker speed={50} />
      </div>

      <div className="max-w-4xl mx-auto px-3 py-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Banner Cortesia Especial - EXA Red Theme */}
        {isCortesia && !['aceita', 'recusada', 'expirada'].includes(proposal.status) && (
          <Card className="p-3 sm:p-4 bg-gradient-to-r from-red-50 to-red-100 border-2 border-[#9C1E1E] text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-[#9C1E1E]" />
              <span className="text-base sm:text-xl font-bold text-[#7D1818]">VOCÊ GANHOU UM PRESENTE!</span>
              <PartyPopper className="h-5 w-5 sm:h-6 sm:w-6 text-[#9C1E1E]" />
            </div>
            <p className="text-xs sm:text-sm text-[#7D1818]">
              A EXA Mídia está oferecendo <strong>{proposal.is_custom_days ? `${proposal.custom_days} ${proposal.custom_days === 1 ? 'dia' : 'dias'}` : `${proposal.duration_months} ${proposal.duration_months === 1 ? 'mês' : 'meses'}`}</strong> de publicidade gratuita para você!
            </p>
          </Card>
        )}

        {/* Banner de Status Destacado - para propostas já respondidas */}
        {(proposal.status === 'aceita' || proposal.status === 'recusada') && (
          <Card className={`p-3 sm:p-4 text-center ${
            proposal.status === 'aceita' 
              ? 'bg-emerald-50 border-emerald-300' 
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center justify-center gap-2">
              {proposal.status === 'aceita' ? (
                <Check className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              ) : (
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              )}
              <span className={`text-sm sm:text-lg font-semibold ${
                proposal.status === 'aceita' ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {isCortesia 
                  ? `Este presente foi ${proposal.status === 'aceita' ? 'ACEITO' : 'RECUSADO'}`
                  : `Esta proposta foi ${proposal.status === 'aceita' ? 'ACEITA' : 'RECUSADA'}`
                }
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {proposal.status === 'aceita' 
                ? 'Agradecemos pela confiança! Nossa equipe entrará em contato.' 
                : 'Caso mude de ideia, entre em contato conosco.'}
            </p>
          </Card>
        )}

        {/* Aviso de Validade */}
        {proposal.expires_at && !['aceita', 'recusada'].includes(proposal.status) && (
          <Card className="p-2.5 sm:p-3 bg-amber-50 border-amber-200 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-amber-800">
              Válida até <strong>{new Date(proposal.expires_at).toLocaleString('pt-BR')}</strong>
            </span>
          </Card>
        )}


        {/* Banner de Múltiplas Marcas/Posições - aparece quando há mais de 1 posição */}
        {(proposal.quantidade_posicoes ?? 1) > 1 && (
          <Card className="p-3 sm:p-4 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 border-2 border-violet-200 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-violet-500 rounded-full">
                <Users className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-violet-800">
                {proposal.quantidade_posicoes}x Posições por Painel
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-violet-700">
              Esta proposta inclui <strong>{proposal.quantidade_posicoes} espaços simultâneos</strong> por painel, 
              permitindo exibição de múltiplas marcas ou campanhas diferentes ao mesmo tempo.
            </p>
          </Card>
        )}

        {/* Resumo Rápido - Grid com números ajustados para Venda Futura */}
        <div className={`grid ${(proposal.quantidade_posicoes ?? 1) > 1 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'} gap-2 sm:gap-3`}>
          <Card className="p-2.5 sm:p-3 text-center bg-white/80 backdrop-blur-sm">
            <div className="text-xl sm:text-2xl font-bold text-[#9C1E1E]">{displayBuildingsCount}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Prédios</div>
          </Card>
          <Card className="p-2.5 sm:p-3 text-center bg-white/80 backdrop-blur-sm">
            <div className="text-xl sm:text-2xl font-bold text-[#9C1E1E]">{displayPanelsCount}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Telas</div>
          </Card>
          {/* Card de Posições - só aparece quando há mais de 1 */}
          {(proposal.quantidade_posicoes ?? 1) > 1 && (
            <Card className="p-2.5 sm:p-3 text-center bg-gradient-to-br from-violet-100 to-purple-100 border-violet-200">
              <div className="text-xl sm:text-2xl font-bold text-violet-700">{proposal.quantidade_posicoes}x</div>
              <div className="text-[10px] sm:text-xs text-violet-600 font-medium">Marcas</div>
            </Card>
          )}
          <Card className="p-2.5 sm:p-3 text-center bg-white/80 backdrop-blur-sm">
            <div className="text-xl sm:text-2xl font-bold text-[#9C1E1E]">
              {displayImpressions >= 1000000 
                ? (displayImpressions / 1000000).toFixed(1) + 'M' 
                : (displayImpressions / 1000).toFixed(0) + 'k'}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Exibições/mês</div>
          </Card>
          <Card className="p-2.5 sm:p-3 text-center bg-white/80 backdrop-blur-sm">
            <div className="text-xl sm:text-2xl font-bold text-[#9C1E1E]">
              {proposal.is_custom_days ? proposal.custom_days : proposal.duration_months}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              {proposal.is_custom_days ? 'Dias' : 'Meses'}
            </div>
          </Card>
        </div>

        {/* Resumo Executivo da Proposta - Logo após as métricas */}
        <ProposalSummaryText
          tipoProduto={(proposal.tipo_produto as 'horizontal' | 'vertical_premium') || 'horizontal'}
          quantidadePosicoes={proposal.quantidade_posicoes || 1}
          totalPredios={displayBuildingsCount}
          totalTelas={displayPanelsCount}
          exibicoesMes={displayImpressions}
          duracaoMeses={proposal.duration_months}
          duracaoVideoSegundos={proposal.tipo_produto === 'vertical_premium' ? 15 : 10}
          isVendaFutura={isVendaFutura}
          prediosContratados={proposal.predios_contratados || undefined}
          maxVideosPorPedido={10}
        />

        {/* Conheça a EXA Mídia - MOVED UP */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border border-gray-200">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-[#9C1E1E]">
            <Video className="h-4 w-4" />
            Conheça a EXA Mídia
          </h3>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full h-10 text-sm border-[#9C1E1E]/30 hover:bg-[#9C1E1E]/5 hover:border-[#9C1E1E] transition-all"
              onClick={() => window.open('https://drive.google.com/file/d/19g-1y4dzi60ydc5yXJKDD6sW6MPpyCaZ/view?usp=drive_link', '_blank')}
            >
              <Video className="h-4 w-4 mr-2 text-[#9C1E1E]" />
              Assistir Vídeo Institucional
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-10 text-sm border-[#9C1E1E]/30 hover:bg-[#9C1E1E]/5 hover:border-[#9C1E1E] transition-all"
              onClick={() => window.open('https://drive.google.com/file/d/1hdg4-NcTZexrMGwtLnzBP9eFefBY97iz/view?usp=drive_link', '_blank')}
            >
              <FileText className="h-4 w-4 mr-2 text-[#9C1E1E]" />
              Ver Mídia Kit
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-10 text-sm border-[#9C1E1E]/30 hover:bg-[#9C1E1E]/5 hover:border-[#9C1E1E] transition-all"
              onClick={() => window.open('https://www.examidia.com.br', '_blank')}
            >
              <Globe className="h-4 w-4 mr-2 text-[#9C1E1E]" />
              Visitar Nosso Site
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-10 text-sm border-[#9C1E1E]/30 hover:bg-[#9C1E1E]/5 hover:border-[#9C1E1E] transition-all"
              onClick={() => window.open('https://www.examidia.com.br/quem-somos', '_blank')}
            >
              <Users className="h-4 w-4 mr-2 text-[#9C1E1E]" />
              Quem Somos
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-10 text-sm border-[#9C1E1E]/30 hover:bg-[#9C1E1E]/5 hover:border-[#9C1E1E] transition-all"
              onClick={() => window.open('https://drive.google.com/drive/folders/1GgZwyYLZdlqvCqElaaWJQ9BEbYPNMkmR?usp=sharing', '_blank')}
            >
              <Video className="h-4 w-4 mr-2 text-[#9C1E1E]" />
              Mais Vídeos da EXA
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
            </Button>
          </div>
        </Card>

        {/* Módulo de Período da Campanha - Mobile Optimized */}
        {(() => {
          const startDate = new Date(proposal.created_at);
          const endDate = proposal.is_custom_days && proposal.custom_days
            ? addDays(startDate, proposal.custom_days)
            : addMonths(startDate, proposal.duration_months);
          const totalDays = proposal.is_custom_days && proposal.custom_days
            ? proposal.custom_days
            : differenceInDays(endDate, startDate);
          
          return (
            <Card className="p-3 sm:p-4 bg-white/80 backdrop-blur-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#9C1E1E]" />
                <h2 className="font-semibold text-sm sm:text-base">Período da Campanha</h2>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Início</p>
                  <p className="font-semibold text-[11px] sm:text-sm text-[#9C1E1E]">
                    {format(startDate, "dd/MM/yy", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Término</p>
                  <p className="font-semibold text-[11px] sm:text-sm text-[#9C1E1E]">
                    {format(endDate, "dd/MM/yy", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] rounded-lg">
                  <p className="text-[10px] sm:text-xs text-white/80 mb-0.5 sm:mb-1">Total</p>
                  <p className="font-bold text-base sm:text-lg text-white">{totalDays}</p>
                  <p className="text-[10px] sm:text-xs text-white/80">dias</p>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* Locais Contratados - MOVIDO PARA CÁ ANTES DA IMAGEM ÂNCORA (apenas visível para todos) */}
        {buildings.length > 0 && (
          <Card className="p-3 sm:p-4 bg-slate-50/80 border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#9C1E1E]" />
                <h3 className="text-sm font-semibold text-slate-700">Locais Contratados</h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {displayBuildingsCount} {displayBuildingsCount === 1 ? 'local' : 'locais'}
              </Badge>
            </div>

            {/* Grid visual de prédios com fotos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {buildings.map((b: any, i: number) => (
                <ProposalBuildingCard 
                  key={b.building_id || i} 
                  building={b}
                  index={i + 1}
                />
              ))}
            </div>

            {/* Condição Especial - Pré-Conclusão de Fase (Venda Futura) */}
            {isVendaFutura && (
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 mt-3">
                <Gift className="h-4 w-4 text-[#9C1E1E] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-600">
                  <span className="font-medium text-gray-800">Condição Especial:</span> Esta proposta garante o preço atual 
                  sem reajustes. O período até atingirmos a cobertura total contratada é <strong className="text-[#9C1E1E]">100% gratuito</strong> para você.
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Módulo do Produto Escolhido - Imagem Âncora */}
        <ProductShowcaseCard tipo={proposal.tipo_produto || 'horizontal'} totalPanels={totalPanels} />


        {/* Infográfico EXA - Espaço é Posição */}
        <div className="w-full">
          <img 
            src="/vertical-premium-showcase.png" 
            alt="Na EXA, Espaço é Posição - Infográfico" 
            className="w-full h-auto"
          />
        </div>

        {/* Card Especial para Cortesia - Mobile Optimized */}
        {isCortesia && (
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-red-50 to-white border-2 border-[#9C1E1E] shadow-lg">
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-[#9C1E1E]" />
                <span className="text-xl sm:text-2xl font-bold text-[#7D1818]">CORTESIA</span>
                <PartyPopper className="h-6 w-6 sm:h-8 sm:w-8 text-[#9C1E1E]" />
              </div>
              
              {/* Valor que seria cobrado */}
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Se fosse pago, custaria:</p>
                <div className="text-lg sm:text-xl text-muted-foreground line-through">
                  {baseTotalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  ({proposal.is_custom_days 
                    ? `${proposal.custom_days} ${proposal.custom_days === 1 ? 'dia' : 'dias'}` 
                    : `${proposal.duration_months} ${proposal.duration_months === 1 ? 'mês' : 'meses'} × ${baseMonthlyTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês`})
                </p>
              </div>
              
              {/* Valor da cortesia */}
              <div className="bg-gradient-to-r from-[#9C1E1E] to-[#7D1818] rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-white/80 font-medium mb-1">Seu presente:</p>
                <div className="text-3xl sm:text-4xl font-bold text-white">
                  R$ 0,00
                </div>
                <p className="text-xs sm:text-sm text-white/80 mt-1 sm:mt-2">🎁 Presente especial da EXA Mídia</p>
              </div>
              
              {/* Badge de economia */}
              <div className="flex items-center justify-center">
                <span className="bg-[#9C1E1E] text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                  💰 100% OFF — {baseTotalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Card de Exclusividade de Segmento - Aparece antes dos planos */}
        {!isCortesia && proposal.exclusividade_segmento && proposal.exclusividade_disponivel && (
          <ExclusivityChoiceCard
            segmento={proposal.segmento_exclusivo || 'Segmento'}
            valorNormal={proposal.cash_total_value}
            valorComExclusividade={proposal.cash_total_value + (proposal.exclusividade_valor_extra || 0)}
            fidelidadeNormal={proposal.fidel_monthly_value}
            fidelidadeComExclusividade={proposal.fidel_monthly_value * (1 + (proposal.exclusividade_percentual || 35) / 100)}
            percentualExtra={proposal.exclusividade_percentual || 35}
            durationMonths={proposal.duration_months}
            escolhido={clienteEscolheuExclusividade}
            onChoose={setClienteEscolheuExclusividade}
          />
        )}

        {/* Card de Travamento de Preço - Aparece quando ativo */}
        {proposal.travamento_preco_ativo && (
          <Card className={`p-3 sm:p-4 border-2 ${proposal.travamento_preco_valor === 0 ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-white' : 'border-amber-400 bg-gradient-to-br from-amber-50 to-white'} shadow-md`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 ${proposal.travamento_preco_valor === 0 ? 'bg-blue-600' : 'bg-amber-500'} rounded-full`}>
                <Lock className="h-4 w-4 text-white" />
              </div>
              <h3 className={`font-bold text-sm sm:text-base ${proposal.travamento_preco_valor === 0 ? 'text-blue-800' : 'text-amber-800'}`}>
                {proposal.travamento_preco_valor === 0 ? '🔒 Garantia de Travamento de Preço' : '🔒 Opção de Travamento de Preço'}
              </h3>
            </div>
            
            <div className="space-y-2">
              <p className={`text-xs sm:text-sm ${proposal.travamento_preco_valor === 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                {proposal.travamento_preco_valor === 0 ? (
                  <>Esta proposta <strong>inclui a garantia</strong> de travamento de preço.</>
                ) : (
                  <>Adquira a garantia de travamento por <strong className="text-amber-800">{(proposal.travamento_preco_valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>.</>
                )}
              </p>
              
              <div className={`p-2.5 sm:p-3 rounded-lg ${proposal.travamento_preco_valor === 0 ? 'bg-blue-100' : 'bg-amber-100'}`}>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className={`text-[10px] sm:text-xs ${proposal.travamento_preco_valor === 0 ? 'text-blue-600' : 'text-amber-600'}`}>Telas Atuais</p>
                    <p className={`text-base sm:text-lg font-bold ${proposal.travamento_preco_valor === 0 ? 'text-blue-800' : 'text-amber-800'}`}>
                      {proposal.travamento_telas_atuais || realTotalPanels}
                    </p>
                  </div>
                  <div>
                    <p className={`text-[10px] sm:text-xs ${proposal.travamento_preco_valor === 0 ? 'text-blue-600' : 'text-amber-600'}`}>Limite Garantido</p>
                    <p className={`text-base sm:text-lg font-bold ${proposal.travamento_preco_valor === 0 ? 'text-blue-800' : 'text-amber-800'}`}>
                      até {proposal.travamento_telas_limite}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`flex items-center justify-center gap-2 p-2 rounded-lg ${proposal.travamento_preco_valor === 0 ? 'bg-blue-50' : 'bg-amber-50'}`}>
                <span className={`text-xs sm:text-sm font-medium ${proposal.travamento_preco_valor === 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                  Preço travado: <strong>{(proposal.travamento_preco_por_tela || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/tela/mês</strong>
                </span>
              </div>
              
              <p className={`text-[10px] sm:text-xs text-center ${proposal.travamento_preco_valor === 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                Expanda sua veiculação para até <strong>{proposal.travamento_telas_limite}</strong> telas mantendo o valor unitário atual
              </p>
            </div>
          </Card>
        )}

        {/* SEÇÃO DE PERMUTA (Contrapartida) - Aparece quando é proposta de permuta */}
        {proposal.modalidade_proposta === 'permuta' && !isCortesia && (
          <PermutaChoiceCard
            valorReferenciaMonetaria={proposal.valor_referencia_monetaria || 0}
            duracaoMeses={proposal.duration_months}
            duracaoDias={proposal.custom_days}
            isCustomDays={proposal.is_custom_days || false}
            itensPermuta={(proposal.itens_permuta || []).map((item: any) => ({
              id: item.id || '',
              nome: item.nome || '',
              descricao: item.descricao,
              quantidade: item.quantidade || 1,
              preco_unitario: item.preco_unitario || 0,
              preco_total: item.preco_total || 0,
              ocultar_preco: item.ocultar_preco || false,
            }))}
            descricaoContrapartida={proposal.descricao_contrapartida}
            ocultarValores={proposal.ocultar_valores_publico || false}
            totalTelas={isVendaFutura ? displayPanelsCount : realTotalPanels}
            totalExibicoes={displayImpressions}
            totalPredios={displayBuildingsCount}
          />
        )}

        {/* Planos - NÃO APARECEM para cortesia NEM para permuta - Mobile Optimized */}
        {!isCortesia && proposal.modalidade_proposta !== 'permuta' && (
          <div className="space-y-2.5 sm:space-y-3">
            <h2 className="font-semibold text-sm sm:text-base flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#9C1E1E]" />
              {proposal.payment_type === 'custom' ? 'Condição Personalizada' : 'Escolha sua condição'}
            </h2>

            {/* PAGAMENTO PERSONALIZADO */}
            {proposal.payment_type === 'custom' && proposal.custom_installments ? (
              <Card className="p-3 sm:p-4 border-2 border-[#9C1E1E] bg-gradient-to-br from-red-50 to-white shadow-lg">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#9C1E1E] text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
                      💳 PAGAMENTO PERSONALIZADO
                    </span>
                  </div>
                  
                  {/* Lista de Parcelas */}
                  <div className="space-y-1.5 sm:space-y-2">
                    {(Array.isArray(proposal.custom_installments) ? proposal.custom_installments : []).map((installment: CustomInstallment, index: number) => (
                      <div key={installment.installment || index} className="flex justify-between items-center p-2 sm:p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 sm:w-6 sm:h-6 bg-[#9C1E1E]/10 text-[#9C1E1E] rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-medium text-xs sm:text-sm">Parcela {index + 1}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                              Venc: {new Date(installment.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm sm:text-lg font-bold text-[#9C1E1E]">
                            {Number(installment.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total */}
                  <div className="border-t pt-2.5 sm:pt-3 mt-2.5 sm:mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs sm:text-base">Total ({(Array.isArray(proposal.custom_installments) ? proposal.custom_installments : []).length}x)</span>
                      <span className="text-lg sm:text-xl font-bold text-[#9C1E1E]">
                        {(Array.isArray(proposal.custom_installments) ? proposal.custom_installments : [])
                          .reduce((sum: number, inst: CustomInstallment) => sum + Number(inst.amount), 0)
                          .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      Período: {proposal.is_custom_days 
                        ? `${proposal.custom_days} ${proposal.custom_days === 1 ? 'dia' : 'dias'}` 
                        : `${proposal.duration_months} ${proposal.duration_months === 1 ? 'mês' : 'meses'}`}
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                {/* Plano À Vista - Compact Mobile */}
                <Card 
                  className={`p-2.5 sm:p-3 cursor-pointer transition-all rounded-xl ${
                    selectedPlan === 'avista' 
                      ? 'border-2 border-[#9C1E1E] bg-gradient-to-br from-red-50/80 to-white shadow-md' 
                      : 'border border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setSelectedPlan('avista')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        selectedPlan === 'avista' ? 'border-[#9C1E1E] bg-[#9C1E1E]' : 'border-gray-300'
                      }`}>
                        {selectedPlan === 'avista' && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#9C1E1E] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                            MELHOR
                          </span>
                          <span className="font-semibold text-xs">PIX À Vista</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground">Pagamento único • 10% OFF</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm sm:text-base font-bold text-[#9C1E1E]">
                        {displayCashValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      {!proposal.is_custom_days && proposal.duration_months > 0 && (
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground">
                          {(displayCashValue / proposal.duration_months).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Plano Fidelidade - Compact Mobile */}
                {!proposal.is_custom_days && (
                  <Card 
                    className={`p-2.5 sm:p-3 cursor-pointer transition-all rounded-xl ${
                      selectedPlan === 'fidelidade' 
                        ? 'border-2 border-[#9C1E1E] bg-gradient-to-br from-red-50/80 to-white shadow-md' 
                        : 'border border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => setSelectedPlan('fidelidade')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          selectedPlan === 'fidelidade' ? 'border-[#9C1E1E] bg-[#9C1E1E]' : 'border-gray-300'
                        }`}>
                          {selectedPlan === 'fidelidade' && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs">Plano Fidelidade</span>
                          <p className="text-[9px] text-muted-foreground">Mensal • {proposal.duration_months}x</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm sm:text-base font-bold">
                          {displayFidelMonthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          <span className="text-[9px] font-normal text-muted-foreground">/mês</span>
                        </div>
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground">
                          Total: {displayFidelTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* Resumo de Valores por Local - Só aparece para propostas monetárias */}
        {!isCortesia && proposal.modalidade_proposta !== 'permuta' && proposal.payment_type !== 'custom' && !proposal.is_custom_days && buildings.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Fidelidade */}
            <Card className="p-2 sm:p-3 bg-white border-slate-200 space-y-1">
              <div className="text-[9px] sm:text-[10px] font-medium text-slate-500 uppercase">
                Fidelidade ({proposal.duration_months}x)
              </div>
              <div className="flex justify-between text-[9px] sm:text-[10px]">
                <span>Por local:</span>
                <span className="font-medium">
                  {(displayFidelMonthly / displayBuildingsCount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                </span>
              </div>
              <div className="flex justify-between text-[9px] sm:text-[10px]">
                <span>Por tela:</span>
                <span className="font-medium">
                  {(displayFidelMonthly / displayPanelsCount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                </span>
              </div>
            </Card>

            {/* À Vista */}
            <Card className="p-2 sm:p-3 bg-gradient-to-br from-green-50 to-white border-green-200 space-y-1">
              <div className="text-[9px] sm:text-[10px] font-medium text-green-600 uppercase flex items-center gap-1">
                PIX À Vista
                <span className="bg-green-100 text-[7px] sm:text-[8px] px-1 rounded">-{proposal.discount_percent}%</span>
              </div>
              <div className="flex justify-between text-[9px] sm:text-[10px]">
                <span>Por local:</span>
                <span className="font-medium text-green-600">
                  {((displayCashValue / proposal.duration_months) / displayBuildingsCount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                </span>
              </div>
              <div className="flex justify-between text-[9px] sm:text-[10px]">
                <span>Por tela:</span>
                <span className="font-medium text-green-600">
                  {((displayCashValue / proposal.duration_months) / displayPanelsCount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Botões de Ação - Mobile Optimized */}
        {!['aceita', 'recusada', 'expirada'].includes(proposal.status) && (
          <div className="space-y-2.5 sm:space-y-3 pt-3 sm:pt-4">
            {isCortesia ? (
              <>
                {/* Badge de contrato aceito - Cortesia */}
                {contractFlow === 'accepted' && (
                  <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-2">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    <span className="text-xs sm:text-sm text-emerald-700 font-medium">
                      ✅ Contrato visualizado e aceito
                    </span>
                  </div>
                )}

                {/* Botões especiais para Cortesia - EXA Red Theme */}
                <Button
                  className="w-full h-14 text-lg bg-gradient-to-r from-[#9C1E1E] to-[#7D1818] hover:from-[#7D1818] hover:to-[#5a1212] text-white shadow-lg"
                  onClick={handleAcceptCortesia}
                  disabled={isAcceptingCortesia}
                >
                  {isAcceptingCortesia ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Gift className="h-5 w-5 mr-2" />
                  )}
                  🎁 Aceitar Meu Presente
                </Button>

                {/* Botão Ver Contrato - Cortesia */}
                {contractFlow !== 'accepted' && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className={`w-full h-10 text-sm ${
                        hasExistingContract 
                          ? 'border-emerald-500/50 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' 
                          : 'border-[#9C1E1E]/30 text-[#9C1E1E] hover:bg-[#9C1E1E]/5'
                      }`}
                      onClick={handleViewContract}
                      disabled={isSubmitting}
                    >
                      {hasExistingContract ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Visualizar Contrato
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Contrato
                        </>
                      )}
                    </Button>
                    
                    {/* Botão de editar signatário - Cortesia (só se signatário já registrado) */}
                    {hasExistingContract && hasSignatoryRegistered && (
                      <Button
                        variant="outline"
                        className="w-full h-9 text-xs border-amber-400/50 text-amber-700 bg-amber-50 hover:bg-amber-100"
                        onClick={handleEditSignatory}
                        disabled={isSubmitting}
                      >
                        <Pencil className="h-3 w-3 mr-2" />
                        Editar Dados do Signatário
                      </Button>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full h-12 border-[#9C1E1E]/30 text-[#9C1E1E] hover:bg-[#9C1E1E]/5"
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Recusar Presente
                </Button>
              </>
            ) : proposal.payment_type === 'custom' && Array.isArray(proposal.custom_installments) && proposal.custom_installments.length > 0 ? (
              <>
                {/* Badge de contrato aceito - Pagamento Personalizado */}
                {contractFlow === 'accepted' && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-2">
                    <Check className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm text-emerald-700 font-medium">
                      ✅ Contrato visualizado e aceito
                    </span>
                  </div>
                )}

                {/* Botão principal: Aceitar Proposta */}
                <Button
                  className="w-full h-14 text-lg bg-gradient-to-r from-[#9C1E1E] to-[#7D1818] hover:from-[#7D1818] hover:to-[#5a1212] text-white shadow-lg"
                  onClick={handleAcceptCustom}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5 mr-2" />
                  )}
                  ✅ Aceitar Proposta
                </Button>

                {/* Botão Ver Contrato - Pagamento Personalizado */}
                {contractFlow !== 'accepted' && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className={`w-full h-10 text-sm rounded-xl ${
                        hasExistingContract 
                          ? 'border-emerald-500/50 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' 
                          : 'border-[#9C1E1E]/30 text-[#9C1E1E] hover:bg-[#9C1E1E]/5'
                      }`}
                      onClick={handleViewContract}
                      disabled={isSubmitting}
                    >
                      {hasExistingContract ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Visualizar Contrato
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Contrato
                        </>
                      )}
                    </Button>
                    
                    {/* Botão de editar signatário - Pagamento Personalizado (só se signatário já registrado) */}
                    {hasExistingContract && hasSignatoryRegistered && (
                      <Button
                        variant="outline"
                        className="w-full h-9 text-xs border-amber-400/50 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl"
                        onClick={handleEditSignatory}
                        disabled={isSubmitting}
                      >
                        <Pencil className="h-3 w-3 mr-2" />
                        Editar Dados do Signatário
                      </Button>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="w-full h-10 text-sm text-muted-foreground hover:text-destructive"
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Recusar Proposta
                </Button>
              </>
            ) : (
              <>
                {/* Badge de contrato aceito */}
                {contractFlow === 'accepted' && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-2">
                    <Check className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm text-emerald-700 font-medium">
                      ✅ Contrato visualizado e aceito
                    </span>
                  </div>
                )}
                
                {/* Botão principal: Aceitar Proposta */}
                <Button
                  className="w-full h-14 text-lg bg-gradient-to-r from-[#9C1E1E] to-[#7D1818] hover:from-[#7D1818] hover:to-[#5a1212] text-white shadow-lg"
                  onClick={handleAccept}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5 mr-2" />
                  )}
                  ✅ Aceitar Proposta
                </Button>

                {/* Botão secundário: Ver Contrato antes */}
                {contractFlow !== 'accepted' && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className={`w-full h-10 text-sm ${
                        hasExistingContract 
                          ? 'border-emerald-500/50 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' 
                          : 'border-[#9C1E1E]/30 text-[#9C1E1E] hover:bg-[#9C1E1E]/5'
                      }`}
                      onClick={handleViewContract}
                      disabled={isSubmitting}
                    >
                      {hasExistingContract ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Visualizar Contrato
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Contrato
                        </>
                      )}
                    </Button>
                    
                    {/* Botão de editar signatário - só aparece se signatário já registrado */}
                    {hasExistingContract && hasSignatoryRegistered && (
                      <Button
                        variant="outline"
                        className="w-full h-9 text-xs border-amber-400/50 text-amber-700 bg-amber-50 hover:bg-amber-100"
                        onClick={handleEditSignatory}
                        disabled={isSubmitting}
                      >
                        <Pencil className="h-3 w-3 mr-2" />
                        Editar Dados do Signatário
                      </Button>
                    )}
                  </div>
                )}

                {/* Recusar */}
                <Button
                  variant="ghost"
                  className="w-full h-10 text-sm text-muted-foreground hover:text-destructive"
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Recusar Proposta
                </Button>
              </>
            )}
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

        {/* Contato Comercial - Dados do Vendedor */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm">
          <h3 className="font-semibold mb-2">Contato Comercial</h3>
          <div className="text-sm space-y-1">
            <div className="font-medium">{sellerName}</div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
              {sellerEmail}
            </div>
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
    </>
  );
};

export default PropostaPublicaPage;
