import React, { useState, useEffect } from 'react';
import { X, Building2, Eye, Users, Check, Clock, Phone, Mail, FileText, Gift, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface CustomInstallment {
  installment: number;
  due_date: string;
  amount: number;
}

interface Building {
  id: string;
  nome: string;
  bairro: string;
  endereco: string;
  quantidade_telas: number | null;
  visualizacoes_mes: number | null;
  publico_estimado: number | null;
  is_manual?: boolean;
}

interface ProposalPreviewData {
  id?: string;
  number?: string;
  client_name: string;
  client_company_name?: string | null;
  client_cnpj?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  selected_buildings: Building[];
  total_panels: number;
  total_impressions_month: number;
  fidel_monthly_value: number;
  cash_total_value: number;
  discount_percent: number;
  duration_months: number;
  expires_at?: string | null;
  payment_type?: string;
  custom_installments?: CustomInstallment[] | null;
  metadata?: { type?: string };
}

interface ProposalPreviewModalProps {
  open: boolean;
  onClose: () => void;
  proposal: ProposalPreviewData;
  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
}

const formatCurrency = (value: number) => {
  return value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
};

export const ProposalPreviewModal: React.FC<ProposalPreviewModalProps> = ({
  open,
  onClose,
  proposal,
  sellerName = 'Equipe EXA Mídia',
  sellerPhone = '(45) 99141-5856',
  sellerEmail = 'comercial@indexamidia.com.br'
}) => {
  const isCortesia = proposal.metadata?.type === 'cortesia';
  const isCustomPayment = proposal.payment_type === 'custom' && proposal.custom_installments?.length;
  
  const customTotal = isCustomPayment 
    ? proposal.custom_installments!.reduce((sum, i) => sum + i.amount, 0) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg w-full h-[90vh] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Header - fixo */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#8B1A1A] to-[#A52020] text-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white text-[10px] border-0">
                PREVIEW
              </Badge>
              {proposal.number && (
                <span className="text-xs opacity-80">{proposal.number}</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <UnifiedLogo size="sm" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Proposta Comercial</h1>
              <p className="text-xs text-white/80">EXA Mídia Indoor</p>
            </div>
          </div>
        </div>

        {/* Content - scrollável */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {/* Cortesia Banner */}
          {isCortesia && (
            <Card className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-pink-600">🎁 CORTESIA</h2>
                  <p className="text-sm text-muted-foreground">Este é um presente especial!</p>
                </div>
              </div>
            </Card>
          )}

          {/* Client Card */}
          <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#9C1E1E]" />
              Dados do Cliente
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{proposal.client_name}</p>
              {proposal.client_company_name && (
                <p className="text-muted-foreground">🏢 {proposal.client_company_name}</p>
              )}
              {proposal.client_cnpj && (
                <p className="text-muted-foreground text-xs">{proposal.client_cnpj}</p>
              )}
            </div>
          </Card>

          {/* Metrics Card */}
          <Card className="p-4 bg-gradient-to-br from-[#9C1E1E]/5 to-[#9C1E1E]/10 border-[#9C1E1E]/20">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <Building2 className="h-5 w-5 text-[#9C1E1E] mx-auto mb-1" />
                <div className="text-xl font-bold text-[#9C1E1E]">{proposal.total_panels}</div>
                <div className="text-[10px] text-muted-foreground">Painéis</div>
              </div>
              <div>
                <Eye className="h-5 w-5 text-[#9C1E1E] mx-auto mb-1" />
                <div className="text-xl font-bold text-[#9C1E1E]">
                  {(proposal.total_impressions_month / 1000).toFixed(0)}k
                </div>
                <div className="text-[10px] text-muted-foreground">Exibições/mês</div>
              </div>
              <div>
                <Users className="h-5 w-5 text-[#9C1E1E] mx-auto mb-1" />
                <div className="text-xl font-bold text-[#9C1E1E]">
                  {proposal.selected_buildings.reduce((sum, b) => sum + (b.publico_estimado || 0), 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">Pessoas</div>
              </div>
            </div>
          </Card>

          {/* Buildings List */}
          <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#9C1E1E]" />
              Locais Inclusos ({proposal.selected_buildings.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {proposal.selected_buildings.slice(0, 5).map((building) => (
                <div key={building.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {building.nome}
                      {building.is_manual && <span className="text-amber-600">*</span>}
                    </p>
                    <p className="text-muted-foreground truncate">{building.bairro}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] ml-2">
                    {building.quantidade_telas} telas
                  </Badge>
                </div>
              ))}
              {proposal.selected_buildings.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{proposal.selected_buildings.length - 5} outros locais
                </p>
              )}
            </div>
          </Card>

          {/* Payment Options */}
          {!isCortesia && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#9C1E1E]" />
                Condições de Pagamento
              </h3>

              {isCustomPayment ? (
                <Card className="p-4 border-2 border-amber-200 bg-amber-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-amber-100 text-amber-700 border-0">
                      Pagamento Personalizado
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {proposal.custom_installments!.length} parcelas
                    </span>
                  </div>
                  <div className="space-y-2">
                    {proposal.custom_installments!.map((inst, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {idx + 1}ª parcela - {format(new Date(inst.due_date), 'dd/MM/yyyy')}
                        </span>
                        <span className="font-semibold">{formatCurrency(inst.amount)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-bold text-[#9C1E1E]">{formatCurrency(customTotal)}</span>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* À Vista */}
                  <Card className="p-4 border-2 border-emerald-200 bg-emerald-50/50">
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] border-0 mb-2">
                      À Vista
                    </Badge>
                    <div className="text-xl font-bold text-emerald-600">
                      {formatCurrency(proposal.cash_total_value)}
                    </div>
                    <p className="text-[10px] text-emerald-600">5% desconto PIX</p>
                  </Card>

                  {/* Fidelidade */}
                  <Card className="p-4 border-2 border-[#9C1E1E]/20 bg-[#9C1E1E]/5">
                    <Badge className="bg-[#9C1E1E]/10 text-[#9C1E1E] text-[10px] border-0 mb-2">
                      Fidelidade
                    </Badge>
                    <div className="text-xl font-bold text-[#9C1E1E]">
                      {formatCurrency(proposal.fidel_monthly_value)}
                      <span className="text-xs font-normal">/mês</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {proposal.duration_months}x • {proposal.discount_percent}% desc.
                    </p>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Seller Contact */}
          <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#9C1E1E]" />
              Contato Comercial
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{sellerName}</p>
              <p className="text-muted-foreground flex items-center gap-2">
                <Phone className="h-3 w-3" /> {sellerPhone}
              </p>
              <p className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-3 w-3" /> {sellerEmail}
              </p>
            </div>
          </Card>

          {/* Expiry Notice */}
          {proposal.expires_at && (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">
                <Clock className="h-3 w-3 inline mr-1" />
                Válida até {format(new Date(proposal.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          )}
        </div>

        {/* Footer - fixo */}
        <div className="sticky bottom-0 bg-white border-t p-4 safe-area-bottom">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Fechar Preview
            </Button>
            <Button
              className="flex-1 bg-[#9C1E1E] hover:bg-[#7D1818]"
              disabled
            >
              {isCortesia ? '🎁 Aceitar Presente' : '✅ Aceitar Proposta'}
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            Esta é uma prévia. Nenhuma ação será registrada.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
