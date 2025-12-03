import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, Navigate } from 'react-router-dom';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Gift, Mail, Copy, Loader2, Plus, Trash2, BookOpen, Zap, RefreshCw, FileText } from 'lucide-react';
import { useBenefitManagement } from '@/hooks/useBenefitManagement';
import BenefitStatusBadge from '@/components/benefits/BenefitStatusBadge';
import InsertCodeModal from '@/components/benefits/InsertCodeModal';
import DeleteConfirmationDialog from '@/components/benefits/DeleteConfirmationDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBenefitOptions } from '@/hooks/useBenefitOptions';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import BenefitMobileList from '@/components/admin/benefits/BenefitMobileList';
import BenefitMobileActions from '@/components/admin/benefits/BenefitMobileActions';
import { ProviderBenefit } from '@/types/providerBenefits';
import { useBenefitStats } from '@/hooks/useBenefitStats';
import BenefitStatsCards from '@/components/admin/benefits/BenefitStatsCards';
import MonthSelector from '@/components/admin/dashboard/MonthSelector';
import BenefitDetailsDialog from '@/components/admin/benefits/BenefitDetailsDialog';

const ProviderBenefits = () => {
  console.log('🎁 ProviderBenefits component rendering...');
  const { canManageProviderBenefits, isLoadingCustom } = useUserPermissions();
  const { buildPath } = useAdminBasePath();
  const navigate = useNavigate();
  const { isMobile } = useAdvancedResponsive();
  
  // Hook para carregar opções de benefícios do banco de dados
  const { benefits: benefitOptions, isLoading: isLoadingOptions } = useBenefitOptions();
  
  // Hook para estatísticas mensais
  const { stats, loading: loadingStats, selectedMonth, handleMonthChange } = useBenefitStats();
  
  // 🔒 CRITICAL: Wait for permissions to load before checking
  console.log('🔒 Permission check:', { canManageProviderBenefits, isLoadingCustom });
  
  if (isLoadingCustom) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!canManageProviderBenefits) {
    console.log('❌ Access denied - redirecting to dashboard');
    return <Navigate to="/admin" replace />;
  }
  
  const {
    benefits,
    isLoading,
    createBenefit,
    listBenefits,
    insertGiftCode,
    resendInvitation,
    copyBenefitLink,
    cancelBenefit,
  } = useBenefitManagement();

  console.log('🎁 Benefits state:', { benefits, isLoading });
  console.log('🎁 Benefit options:', { benefitOptions, isLoadingOptions });

  const [formData, setFormData] = useState({
    provider_name: '',
    provider_email: '',
    activation_point: '',
    observation: '',
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [benefitToCancel, setBenefitToCancel] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Novo estado para o dialog de detalhes
  const [selectedBenefitForDetails, setSelectedBenefitForDetails] = useState<ProviderBenefit | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Estado para filtro de status (mobile)
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    console.log('🎁 useEffect: Loading benefits...');
    listBenefits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎁 Submitting benefit:', formData);
    try {
      await createBenefit(formData);
      setFormData({
        provider_name: '',
        provider_email: '',
        activation_point: '',
        observation: '',
      });
      setShowForm(false);
    } catch (error) {
      console.error('❌ Erro ao criar benefício:', error);
    }
  };

  const handleInsertCode = (benefitId: string) => {
    setSelectedBenefit(benefitId);
    setIsCodeModalOpen(true);
  };

  const handleConfirmCode = async (data: { code: string; deliveryType: 'code' | 'link'; instructions: string }) => {
    if (selectedBenefit) {
      await insertGiftCode(selectedBenefit, data.code, data.deliveryType, data.instructions);
      setSelectedBenefit(null);
    }
  };

  const handleCancelBenefit = (benefitId: string) => {
    setBenefitToCancel(benefitId);
    setIsDeleteDialogOpen(true);
  };

  const confirmCancelBenefit = async () => {
    if (benefitToCancel) {
      await cancelBenefit(benefitToCancel);
      setIsDeleteDialogOpen(false);
      setBenefitToCancel(null);
    }
  };

  const getBenefitName = (choice: string) => {
    const option = benefitOptions.find((opt) => opt.id === choice);
    return option ? `${option.icon} ${option.name}` : choice;
  };

  const selectedBenefitData = benefits.find((b) => b.id === selectedBenefit);
  const benefitToCancelData = benefits.find((b) => b.id === benefitToCancel);

  const handleViewDetails = (benefit: ProviderBenefit) => {
    setSelectedBenefitForDetails(benefit);
    setIsDetailsDialogOpen(true);
  };

  const handleCopyLinkMobile = (benefit: ProviderBenefit) => {
    copyBenefitLink(benefit.access_token);
  };

  const handleInsertCodeMobile = (benefit: ProviderBenefit) => {
    handleInsertCode(benefit.id);
  };

  // Filtrar benefícios por status
  const filteredBenefits = React.useMemo(() => {
    if (statusFilter === 'all') return benefits;
    if (statusFilter === 'pending') return benefits.filter(b => b.status === 'pending');
    if (statusFilter === 'choice_made') return benefits.filter(b => b.status === 'choice_made');
    if (statusFilter === 'code_sent') return benefits.filter(b => b.status === 'code_sent');
    if (statusFilter === 'cancelled') return benefits.filter(b => b.status === 'cancelled');
    return benefits;
  }, [benefits, statusFilter]);

  // Mobile View - Apple-like Clean Design
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 pb-20">
        {/* Mobile Header - Glassmorphism compacto */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-white/50">
          <div className="px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-sm">
                  <Gift className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-foreground">Benefícios</h1>
                  <p className="text-[10px] text-muted-foreground">Prestadores</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button 
                  onClick={() => listBenefits()}
                  size="sm"
                  variant="ghost"
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  onClick={() => setShowForm(!showForm)} 
                  size="sm"
                  className="h-8 px-3 text-xs bg-[#9C1E1E] text-white hover:bg-[#7D1818]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Month Selector + Stats compacto */}
        <div className="px-3 py-2">
          <div className="mb-2">
            <MonthSelector
              selectedMonth={selectedMonth}
              onMonthChange={handleMonthChange}
              variant="default"
            />
          </div>
          <BenefitStatsCards stats={stats} loading={loadingStats} />
        </div>

        {/* Quick Filter Pills */}
        <div className="px-3 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 whitespace-nowrap pb-0.5">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium min-w-fit transition-all ${
                statusFilter === 'all' 
                  ? 'bg-[#9C1E1E] text-white shadow-sm' 
                  : 'bg-muted/60 text-muted-foreground'
              }`}
            >
              Todos {benefits.length}
            </button>
            <button 
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium min-w-fit transition-all ${
                statusFilter === 'pending' 
                  ? 'bg-amber-500 text-white shadow-sm' 
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              ⏳ Aguardando {stats.pending_count}
            </button>
            <button 
              onClick={() => setStatusFilter('choice_made')}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium min-w-fit transition-all ${
                statusFilter === 'choice_made' 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              ⚡ Req. Código {stats.choice_made_count}
            </button>
            <button 
              onClick={() => setStatusFilter('code_sent')}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium min-w-fit transition-all ${
                statusFilter === 'code_sent' 
                  ? 'bg-green-500 text-white shadow-sm' 
                  : 'bg-green-100 text-green-700'
              }`}
            >
              ✓ Finalizados {stats.code_sent_count}
            </button>
          </div>
        </div>

        {/* Mobile Form */}
        {showForm && (
          <div className="px-3 py-2">
            <div className="glass-card-mobile p-4">
              <h3 className="text-sm font-semibold mb-3">Criar Novo Benefício</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="provider_name" className="text-xs font-medium">
                    Nome completo *
                  </Label>
                  <Input
                    id="provider_name"
                    required
                    value={formData.provider_name}
                    onChange={(e) =>
                      setFormData({ ...formData, provider_name: e.target.value })
                    }
                    placeholder="Ex: João Silva"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="provider_email" className="text-xs font-medium">
                    E-mail *
                  </Label>
                  <Input
                    id="provider_email"
                    type="email"
                    required
                    value={formData.provider_email}
                    onChange={(e) =>
                      setFormData({ ...formData, provider_email: e.target.value })
                    }
                    placeholder="joao@email.com"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="activation_point" className="text-xs font-medium">
                    Nome do ponto
                  </Label>
                  <Input
                    id="activation_point"
                    value={formData.activation_point}
                    onChange={(e) =>
                      setFormData({ ...formData, activation_point: e.target.value })
                    }
                    placeholder="Ex: Edifício Copacabana"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="observation" className="text-xs font-medium">
                    Observação
                  </Label>
                  <Textarea
                    id="observation"
                    value={formData.observation}
                    onChange={(e) =>
                      setFormData({ ...formData, observation: e.target.value })
                    }
                    placeholder="Notas internas"
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="flex-1 h-9 text-xs"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-1 h-3 w-3" />
                        Criar e Enviar
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                    className="h-9 text-xs px-3"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mobile List */}
        <div className="px-3 py-2">
          <BenefitMobileList
            benefits={filteredBenefits}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onCopyLink={handleCopyLinkMobile}
            onInsertCode={handleInsertCodeMobile}
            benefitOptions={benefitOptions}
          />
        </div>

        {/* Modals */}
        {selectedBenefitData && (
          <InsertCodeModal
            isOpen={isCodeModalOpen}
            onClose={() => {
              setIsCodeModalOpen(false);
              setSelectedBenefit(null);
            }}
            onConfirm={handleConfirmCode}
            providerName={selectedBenefitData.provider_name}
            benefitChoice={
              selectedBenefitData.benefit_choice
                ? getBenefitName(selectedBenefitData.benefit_choice)
                : ''
            }
            deliveryDays={
              selectedBenefitData.benefit_choice
                ? benefitOptions.find((b) => b.id === selectedBenefitData.benefit_choice)?.delivery_days
                : undefined
            }
          />
        )}

        {benefitToCancelData && (
          <DeleteConfirmationDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => {
              setIsDeleteDialogOpen(false);
              setBenefitToCancel(null);
            }}
            onConfirm={confirmCancelBenefit}
            providerName={benefitToCancelData.provider_name}
          />
        )}
      </div>
    );
  }

  // Desktop View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Benefício Prestadores</h1>
          <p className="text-muted-foreground">
            Presenteie os prestadores que ajudaram na ativação de pontos EXA
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => listBenefits()}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => navigate(buildPath('gerenciar-beneficios'))}
            variant="outline"
          >
            <Gift className="h-4 w-4 mr-2" />
            Gerenciar
          </Button>
          <Button 
            onClick={() => navigate(buildPath('instrucoes-compra-vales'))} 
            variant="outline"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Como Comprar
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Benefício
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="flex items-center justify-between mb-4">
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          variant="default"
        />
      </div>
      <BenefitStatsCards stats={stats} loading={loadingStats} />

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Benefício</CardTitle>
            <CardDescription>
              Preencha os dados do prestador e um link único será gerado e enviado por email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider_name">Nome completo *</Label>
                  <Input
                    id="provider_name"
                    required
                    value={formData.provider_name}
                    onChange={(e) =>
                      setFormData({ ...formData, provider_name: e.target.value })
                    }
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider_email">E-mail *</Label>
                  <Input
                    id="provider_email"
                    type="email"
                    required
                    value={formData.provider_email}
                    onChange={(e) =>
                      setFormData({ ...formData, provider_email: e.target.value })
                    }
                    placeholder="joao@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activation_point">Nome do ponto ativado (opcional)</Label>
                <Input
                  id="activation_point"
                  value={formData.activation_point}
                  onChange={(e) =>
                    setFormData({ ...formData, activation_point: e.target.value })
                  }
                  placeholder="Ex: Edifício Copacabana - Rio de Janeiro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observation">Observação (opcional)</Label>
                <Textarea
                  id="observation"
                  value={formData.observation}
                  onChange={(e) =>
                    setFormData({ ...formData, observation: e.target.value })
                  }
                  placeholder="Notas internas sobre este benefício"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Criar e Enviar Email
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Benefícios Criados</CardTitle>
              <CardDescription>Gerencie os benefícios enviados aos prestadores</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{benefits.length}</span> benefícios
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && benefits.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : benefits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum benefício criado ainda</p>
            </div>
          ) : (
            <div className="relative">              
              {/* Container com scroll horizontal melhorado */}
              <div className="overflow-x-auto overflow-y-visible pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Prestador</TableHead>
                    <TableHead className="w-[200px]">Presente Escolhido</TableHead>
                    <TableHead className="w-[140px]">Status Email</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead className="text-center w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benefits.map((benefit) => {
                    const requiresAction = benefit.benefit_choice && !benefit.gift_code && benefit.status !== 'cancelled';
                    const selectedBenefitOption = benefit.benefit_choice 
                      ? benefitOptions.find(b => b.id === benefit.benefit_choice) 
                      : null;
                    
                    const hasInvitationEmail = !!benefit.invitation_sent_at;
                    const hasFinalEmail = !!benefit.final_email_sent_at;

                    return (
                      <TableRow 
                        key={benefit.id}
                        className={`cursor-pointer transition-colors ${
                          requiresAction 
                            ? 'bg-amber-50 border-l-4 border-l-amber-500 hover:bg-amber-100' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleViewDetails(benefit)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {requiresAction && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                            )}
                            <div>
                              <div className="font-medium">{benefit.provider_name}</div>
                              <div className="text-xs text-muted-foreground">{benefit.provider_email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {selectedBenefitOption ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">{selectedBenefitOption.icon} {selectedBenefitOption.name}</span>
                              {requiresAction && (
                                <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  Aguardando código
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Aguardando escolha</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            {hasInvitationEmail && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200">
                                  <Mail className="h-3 w-3" />
                                  <span className="font-medium">Convite enviado</span>
                                </div>
                              </div>
                            )}
                            {hasFinalEmail && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                  <Gift className="h-3 w-3" />
                                  <span className="font-medium">Código enviado</span>
                                </div>
                              </div>
                            )}
                            {!hasInvitationEmail && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">
                                <Mail className="h-3 w-3" />
                                <span className="font-medium">Sem envio</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <BenefitStatusBadge status={benefit.status} />
                            {requiresAction && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                                AÇÃO NECESSÁRIA
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(benefit.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(benefit)}
                            title="Ver detalhes"
                            className="h-8"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes Completos */}
      <BenefitDetailsDialog
        benefit={selectedBenefitForDetails}
        benefitOptions={benefitOptions}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onCopyLink={(benefitId) => {
          const benefit = benefits.find(b => b.id === benefitId);
          if (benefit) copyBenefitLink(benefit.access_token);
        }}
        onResendEmail={(benefitId) => resendInvitation(benefitId)}
        onInsertCode={(benefitId, code) => insertGiftCode(benefitId, code, 'code', '')}
        onCancelBenefit={(benefitId) => cancelBenefit(benefitId)}
      />

      {/* Insert Code Modal */}
      {selectedBenefitData && (
        <InsertCodeModal
          isOpen={isCodeModalOpen}
          onClose={() => {
            setIsCodeModalOpen(false);
            setSelectedBenefit(null);
          }}
          onConfirm={handleConfirmCode}
          providerName={selectedBenefitData.provider_name}
          benefitChoice={
            selectedBenefitData.benefit_choice
              ? getBenefitName(selectedBenefitData.benefit_choice)
              : ''
          }
          deliveryDays={
            selectedBenefitData.benefit_choice
              ? benefitOptions.find((b) => b.id === selectedBenefitData.benefit_choice)?.delivery_days
              : undefined
          }
        />
      )}

      {/* Delete Confirmation Dialog */}
      {benefitToCancelData && (
        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setBenefitToCancel(null);
          }}
          onConfirm={confirmCancelBenefit}
          providerName={benefitToCancelData.provider_name}
        />
      )}
    </div>
  );
};

export default ProviderBenefits;
