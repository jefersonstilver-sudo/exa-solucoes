/**
 * AdminCloseProposalModal
 * 
 * Modal de 3 etapas para fechamento administrativo de proposta:
 * 1. Dados do Cliente (pré-preenchido da proposta)
 * 2. Forma de Pagamento (PIX/Boleto via ASAAS)
 * 3. Confirmação e Contrato
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  User,
  CreditCard,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Banknote,
  QrCode,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface Proposal {
  id: string;
  number: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_company_name?: string;
  client_cpf?: string;
  client_cnpj?: string;
  duration_months: number;
  cash_total_value: number;
  fidel_monthly_value: number;
  selected_buildings: any[];
  status: string;
}

interface CloseProposalResult {
  success: boolean;
  orderId?: string;
  contractId?: string;
  paymentLink?: string;
  pixQrCode?: string;
  pixCopiaECola?: string;
  boletoUrl?: string;
  isNewUser?: boolean;
  error?: string;
}

interface AdminCloseProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: Proposal;
  onSuccess: (result: CloseProposalResult) => void;
}

type PaymentMethod = 'pix_avista' | 'pix_fidelidade' | 'boleto_fidelidade';

interface ClientData {
  primeiro_nome: string;
  sobrenome: string;
  cpf: string;
  data_nascimento: string;
  email: string;
  telefone: string;
  cnpj?: string;
  razao_social?: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
}

const STEPS = [
  { id: 1, title: 'Dados do Cliente', icon: User },
  { id: 2, title: 'Pagamento', icon: CreditCard },
  { id: 3, title: 'Confirmação', icon: FileCheck },
];

const PIX_DISCOUNT = 0.05; // 5% de desconto

export const AdminCloseProposalModal: React.FC<AdminCloseProposalModalProps> = ({
  open,
  onOpenChange,
  proposal,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CloseProposalResult | null>(null);
  
  // Step 1 - Client Data
  const [clientData, setClientData] = useState<ClientData>({
    primeiro_nome: '',
    sobrenome: '',
    cpf: '',
    data_nascimento: '',
    email: '',
    telefone: '',
    cnpj: '',
    razao_social: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
    },
  });

  // Step 2 - Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix_avista');
  const [diaVencimento, setDiaVencimento] = useState<5 | 10 | 15>(10);

  // Step 3 - Options
  const [gerarContrato, setGerarContrato] = useState(true);
  const [enviarParaAssinatura, setEnviarParaAssinatura] = useState(true);
  const [gerarCobranca, setGerarCobranca] = useState(true);

  // Pre-fill client data from proposal
  useEffect(() => {
    if (proposal) {
      const nameParts = (proposal.client_name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setClientData(prev => ({
        ...prev,
        primeiro_nome: firstName,
        sobrenome: lastName,
        email: proposal.client_email || '',
        telefone: proposal.client_phone || '',
        cpf: proposal.client_cpf || '',
        cnpj: proposal.client_cnpj || '',
        razao_social: proposal.client_company_name || '',
      }));
    }
  }, [proposal]);

  // Calculate values
  const isMonthlyPlan = proposal.duration_months === 1;
  const totalValue = proposal.cash_total_value;
  const monthlyValue = proposal.fidel_monthly_value || (totalValue / proposal.duration_months);

  const calculatedValues = useMemo(() => {
    const pixAVistaValue = totalValue * (1 - PIX_DISCOUNT);
    const pixFidelidadeMonthly = monthlyValue;
    const boletoFidelidadeMonthly = monthlyValue;

    return {
      pixAVistaValue,
      pixFidelidadeMonthly,
      boletoFidelidadeMonthly,
      totalMonths: proposal.duration_months,
    };
  }, [totalValue, monthlyValue, proposal.duration_months]);

  // Generate installments preview
  const installmentsPreview = useMemo(() => {
    if (paymentMethod === 'pix_avista') {
      return [{ number: 1, dueDate: new Date(), value: calculatedValues.pixAVistaValue, type: 'pix' }];
    }

    const installments = [];
    const baseDate = new Date();
    baseDate.setDate(diaVencimento);
    
    // If we're past the due date this month, start next month
    if (new Date().getDate() > diaVencimento) {
      baseDate.setMonth(baseDate.getMonth() + 1);
    }

    const monthlyValue = paymentMethod === 'pix_fidelidade' 
      ? calculatedValues.pixFidelidadeMonthly 
      : calculatedValues.boletoFidelidadeMonthly;

    for (let i = 0; i < calculatedValues.totalMonths; i++) {
      const dueDate = addMonths(baseDate, i);
      installments.push({
        number: i + 1,
        dueDate,
        value: monthlyValue,
        type: paymentMethod === 'pix_fidelidade' ? 'pix' : 'boleto',
      });
    }

    return installments;
  }, [paymentMethod, diaVencimento, calculatedValues]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const validateStep1 = () => {
    if (!clientData.primeiro_nome || !clientData.sobrenome) {
      toast.error('Nome completo é obrigatório');
      return false;
    }
    if (!clientData.email) {
      toast.error('E-mail é obrigatório');
      return false;
    }
    if (!clientData.cpf && !clientData.cnpj) {
      toast.error('CPF ou CNPJ é obrigatório');
      return false;
    }
    // For boleto, address is required
    if (paymentMethod === 'boleto_fidelidade') {
      if (!clientData.endereco.cep || !clientData.endereco.logradouro || !clientData.endereco.cidade || !clientData.endereco.uf) {
        toast.error('Endereço completo é obrigatório para boleto');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('admin-close-proposal', {
        body: {
          proposalId: proposal.id,
          clientData,
          paymentMethod,
          diaVencimento: paymentMethod !== 'pix_avista' ? diaVencimento : undefined,
          options: {
            gerarContrato,
            enviarParaAssinatura,
            gerarCobranca,
          },
        },
      });

      if (error) throw error;

      if (data.success) {
        setResult(data);
        toast.success('Proposta fechada com sucesso!');
      } else {
        throw new Error(data.error || 'Erro ao fechar proposta');
      }
    } catch (error: any) {
      console.error('Erro ao fechar proposta:', error);
      toast.error(error.message || 'Erro ao processar fechamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPixCode = () => {
    if (result?.pixCopiaECola) {
      navigator.clipboard.writeText(result.pixCopiaECola);
      toast.success('Código PIX copiado!');
    }
  };

  const handleClose = () => {
    if (result?.success) {
      onSuccess(result);
    }
    onOpenChange(false);
    // Reset state
    setCurrentStep(1);
    setResult(null);
  };

  // Render success screen
  if (result?.success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
              Fechamento Concluído
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">Pedido:</span>
                <span className="text-emerald-700">#{result.orderId?.substring(0, 8)}</span>
              </div>
              {result.contractId && (
                <div className="flex items-center gap-2 text-sm">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">Contrato:</span>
                  <span className="text-emerald-700">Criado</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">Cliente:</span>
                <span className="text-emerald-700">
                  {result.isNewUser ? 'Conta criada' : 'Conta existente'}
                </span>
              </div>
            </div>

            {/* PIX QR Code */}
            {result.pixQrCode && (
              <div className="bg-white border rounded-lg p-4 text-center space-y-3">
                <p className="text-sm font-medium text-gray-700">QR Code PIX</p>
                <img 
                  src={`data:image/png;base64,${result.pixQrCode}`}
                  alt="QR Code PIX"
                  className="mx-auto w-48 h-48"
                />
                {result.pixCopiaECola && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPixCode}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar código PIX
                  </Button>
                )}
              </div>
            )}

            {/* Boleto URL */}
            {result.boletoUrl && (
              <div className="bg-white border rounded-lg p-4 text-center space-y-3">
                <p className="text-sm font-medium text-gray-700">Boleto Gerado</p>
                <Button
                  variant="outline"
                  onClick={() => window.open(result.boletoUrl, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir Boleto
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">Fechar Proposta {proposal.number}</DialogTitle>
          <DialogDescription className="text-sm">
            Fechamento administrativo com geração de contrato e cobrança
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-3 border-b">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <React.Fragment key={step.id}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors
                  ${isActive ? 'bg-[#9C1E1E] text-white' : ''}
                  ${isCompleted ? 'bg-emerald-100 text-emerald-700' : ''}
                  ${!isActive && !isCompleted ? 'bg-gray-100 text-gray-500' : ''}
                `}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <ScrollArea className="flex-1 px-1">
          <div className="py-4 space-y-4">
            {/* Step 1: Client Data */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primeiro_nome">Primeiro Nome *</Label>
                    <Input
                      id="primeiro_nome"
                      value={clientData.primeiro_nome}
                      onChange={(e) => setClientData(prev => ({ ...prev, primeiro_nome: e.target.value }))}
                      placeholder="João"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sobrenome">Sobrenome *</Label>
                    <Input
                      id="sobrenome"
                      value={clientData.sobrenome}
                      onChange={(e) => setClientData(prev => ({ ...prev, sobrenome: e.target.value }))}
                      placeholder="Silva"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={clientData.cpf}
                      onChange={(e) => setClientData(prev => ({ ...prev, cpf: e.target.value }))}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="data_nascimento">Data Nascimento</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={clientData.data_nascimento}
                      onChange={(e) => setClientData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={clientData.email}
                      onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="cliente@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={clientData.telefone}
                      onChange={(e) => setClientData(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cnpj">CNPJ (se empresa)</Label>
                    <Input
                      id="cnpj"
                      value={clientData.cnpj}
                      onChange={(e) => setClientData(prev => ({ ...prev, cnpj: e.target.value }))}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="razao_social">Razão Social</Label>
                    <Input
                      id="razao_social"
                      value={clientData.razao_social}
                      onChange={(e) => setClientData(prev => ({ ...prev, razao_social: e.target.value }))}
                      placeholder="Empresa LTDA"
                    />
                  </div>
                </div>

                <Separator />

                <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço {paymentMethod === 'boleto_fidelidade' && '(obrigatório para boleto)'}
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={clientData.endereco.cep}
                      onChange={(e) => setClientData(prev => ({
                        ...prev,
                        endereco: { ...prev.endereco, cep: e.target.value }
                      }))}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input
                      id="logradouro"
                      value={clientData.endereco.logradouro}
                      onChange={(e) => setClientData(prev => ({
                        ...prev,
                        endereco: { ...prev.endereco, logradouro: e.target.value }
                      }))}
                      placeholder="Rua das Flores"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={clientData.endereco.numero}
                      onChange={(e) => setClientData(prev => ({
                        ...prev,
                        endereco: { ...prev.endereco, numero: e.target.value }
                      }))}
                      placeholder="123"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={clientData.endereco.complemento}
                      onChange={(e) => setClientData(prev => ({
                        ...prev,
                        endereco: { ...prev.endereco, complemento: e.target.value }
                      }))}
                      placeholder="Apto 101"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={clientData.endereco.bairro}
                      onChange={(e) => setClientData(prev => ({
                        ...prev,
                        endereco: { ...prev.endereco, bairro: e.target.value }
                      }))}
                      placeholder="Centro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={clientData.endereco.cidade}
                      onChange={(e) => setClientData(prev => ({
                        ...prev,
                        endereco: { ...prev.endereco, cidade: e.target.value }
                      }))}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="uf">UF</Label>
                    <Input
                      id="uf"
                      value={clientData.endereco.uf}
                      onChange={(e) => setClientData(prev => ({
                        ...prev,
                        endereco: { ...prev.endereco, uf: e.target.value }
                      }))}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Plano</span>
                    <span className="font-medium">{proposal.duration_months} {proposal.duration_months === 1 ? 'mês' : 'meses'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Total</span>
                    <span className="font-bold text-lg">{formatCurrency(totalValue)}</span>
                  </div>
                </div>

                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  className="space-y-3"
                >
                  {/* PIX à Vista - Always available */}
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer
                    ${paymentMethod === 'pix_avista' ? 'border-[#9C1E1E] bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => setPaymentMethod('pix_avista')}
                  >
                    <RadioGroupItem value="pix_avista" id="pix_avista" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-green-600" />
                        <label htmlFor="pix_avista" className="font-medium cursor-pointer">PIX à Vista</label>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">-5%</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Pagamento único de {formatCurrency(calculatedValues.pixAVistaValue)}
                      </p>
                    </div>
                  </div>

                  {/* Options for plans > 1 month */}
                  {!isMonthlyPlan && (
                    <>
                      <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer
                        ${paymentMethod === 'pix_fidelidade' ? 'border-[#9C1E1E] bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => setPaymentMethod('pix_fidelidade')}
                      >
                        <RadioGroupItem value="pix_fidelidade" id="pix_fidelidade" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <QrCode className="h-4 w-4 text-blue-600" />
                            <label htmlFor="pix_fidelidade" className="font-medium cursor-pointer">PIX Fidelidade</label>
                            <Badge variant="outline">Parcelas</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {calculatedValues.totalMonths}x de {formatCurrency(calculatedValues.pixFidelidadeMonthly)}/mês
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer
                        ${paymentMethod === 'boleto_fidelidade' ? 'border-[#9C1E1E] bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => setPaymentMethod('boleto_fidelidade')}
                      >
                        <RadioGroupItem value="boleto_fidelidade" id="boleto_fidelidade" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-orange-600" />
                            <label htmlFor="boleto_fidelidade" className="font-medium cursor-pointer">Boleto Fidelidade</label>
                            <Badge variant="outline">Parcelas</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {calculatedValues.totalMonths}x de {formatCurrency(calculatedValues.boletoFidelidadeMonthly)}/mês
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </RadioGroup>

                {/* Due Date Selector (for fidelity plans) */}
                {paymentMethod !== 'pix_avista' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Dia de Vencimento
                    </Label>
                    <div className="flex gap-2">
                      {[5, 10, 15].map((day) => (
                        <Button
                          key={day}
                          type="button"
                          variant={diaVencimento === day ? 'default' : 'outline'}
                          onClick={() => setDiaVencimento(day as 5 | 10 | 15)}
                          className={diaVencimento === day ? 'bg-[#9C1E1E] hover:bg-[#7D1818]' : ''}
                        >
                          Dia {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Installments Preview */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Preview das Parcelas
                  </Label>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {installmentsPreview.map((inst) => (
                      <div key={inst.number} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {inst.number}ª
                          </Badge>
                          <span>{format(inst.dueDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
                          {inst.number === 1 && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">Gera agora</Badge>
                          )}
                        </div>
                        <span className="font-medium">{formatCurrency(inst.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Resumo do Fechamento</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">{clientData.primeiro_nome} {clientData.sobrenome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">E-mail:</span>
                      <span>{clientData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CPF/CNPJ:</span>
                      <span>{clientData.cpf || clientData.cnpj}</span>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plano:</span>
                      <span className="font-medium">
                        {proposal.duration_months} {proposal.duration_months === 1 ? 'mês' : 'meses'} em {proposal.selected_buildings?.length || 0} prédio(s)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Forma de Pagamento:</span>
                      <span className="font-medium">
                        {paymentMethod === 'pix_avista' && 'PIX à Vista'}
                        {paymentMethod === 'pix_fidelidade' && 'PIX Fidelidade'}
                        {paymentMethod === 'boleto_fidelidade' && 'Boleto Fidelidade'}
                      </span>
                    </div>
                    {paymentMethod !== 'pix_avista' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vencimento:</span>
                        <span>Dia {diaVencimento}</span>
                      </div>
                    )}
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between text-base font-bold">
                      <span>Valor:</span>
                      <span className="text-[#9C1E1E]">
                        {paymentMethod === 'pix_avista' 
                          ? formatCurrency(calculatedValues.pixAVistaValue)
                          : `${calculatedValues.totalMonths}x ${formatCurrency(calculatedValues.pixFidelidadeMonthly)}`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="gerarContrato"
                      checked={gerarContrato}
                      onCheckedChange={(checked) => setGerarContrato(checked as boolean)}
                    />
                    <label htmlFor="gerarContrato" className="text-sm cursor-pointer">
                      Gerar contrato para assinatura (ClickSign)
                    </label>
                  </div>
                  
                  {gerarContrato && (
                    <div className="flex items-center space-x-2 ml-6">
                      <Checkbox
                        id="enviarParaAssinatura"
                        checked={enviarParaAssinatura}
                        onCheckedChange={(checked) => setEnviarParaAssinatura(checked as boolean)}
                      />
                      <label htmlFor="enviarParaAssinatura" className="text-sm cursor-pointer">
                        Enviar contrato para assinatura imediatamente
                      </label>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="gerarCobranca"
                      checked={gerarCobranca}
                      onCheckedChange={(checked) => setGerarCobranca(checked as boolean)}
                    />
                    <label htmlFor="gerarCobranca" className="text-sm cursor-pointer">
                      Gerar primeira cobrança automaticamente (ASAAS)
                    </label>
                  </div>
                </div>

                {/* Signatories Info */}
                {gerarContrato && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <FileCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Signatários do Contrato</p>
                        <ul className="text-sm text-blue-700 mt-1 space-y-1">
                          <li>• Cliente: {clientData.primeiro_nome} {clientData.sobrenome} ({clientData.email})</li>
                          <li>• EXA: Jeferson Stilver (jefersonstilver@gmail.com)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Atenção</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Ao confirmar, a proposta será convertida em pedido e as cobranças serão geradas via ASAAS.
                        Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4 flex-row justify-between">
          <Button
            variant="ghost"
            onClick={currentStep === 1 ? () => onOpenChange(false) : handlePrev}
            disabled={isSubmitting}
          >
            {currentStep === 1 ? 'Cancelar' : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </>
            )}
          </Button>
          
          {currentStep < 3 ? (
            <Button onClick={handleNext} className="bg-[#9C1E1E] hover:bg-[#7D1818]">
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Fechamento
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCloseProposalModal;
