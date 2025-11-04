import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Gift, Mail, Copy, Loader2, Plus, Trash2, Eye } from 'lucide-react';
import { useBenefitManagement } from '@/hooks/useBenefitManagement';
import BenefitStatusBadge from '@/components/benefits/BenefitStatusBadge';
import InsertCodeModal from '@/components/benefits/InsertCodeModal';
import DeleteConfirmationDialog from '@/components/benefits/DeleteConfirmationDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { benefitOptions } from '@/data/benefitOptions';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import BenefitMobileList from '@/components/admin/benefits/BenefitMobileList';
import BenefitMobileActions from '@/components/admin/benefits/BenefitMobileActions';
import { ProviderBenefit } from '@/types/providerBenefits';

const ProviderBenefits = () => {
  console.log('🎁 ProviderBenefits component rendering...');
  const navigate = useNavigate();
  const { isMobile } = useAdvancedResponsive();
  
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
    setSelectedBenefit(benefit.id);
    setIsCodeModalOpen(true);
  };

  const handleCopyLinkMobile = (benefit: ProviderBenefit) => {
    copyBenefitLink(benefit.access_token);
  };

  const handleInsertCodeMobile = (benefit: ProviderBenefit) => {
    handleInsertCode(benefit.id);
  };

  // Mobile View
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FEE2E2] to-background">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-border shadow-sm">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#9C1E1E] to-[#DC2626] flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground">
                  Benefício Prestadores
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  Gerencie presentes dos prestadores
                </p>
              </div>
            </div>

            <BenefitMobileActions
              onNewBenefit={() => setShowForm(!showForm)}
              onManageBenefits={() => navigate('/super_admin/gerenciar-beneficios')}
              onPreviewEmail={() => navigate('/super_admin/preview-beneficio')}
            />
          </div>
        </div>

        {/* Mobile Form */}
        {showForm && (
          <div className="p-4">
            <Card className="border-2 border-[#9C1E1E]/20">
              <CardHeader>
                <CardTitle className="text-lg">Criar Novo Benefício</CardTitle>
                <CardDescription className="text-sm">
                  Preencha os dados do prestador
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider_name" className="text-base font-semibold">
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
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="provider_email" className="text-base font-semibold">
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
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activation_point" className="text-base font-semibold">
                      Nome do ponto ativado
                    </Label>
                    <Input
                      id="activation_point"
                      value={formData.activation_point}
                      onChange={(e) =>
                        setFormData({ ...formData, activation_point: e.target.value })
                      }
                      placeholder="Ex: Edifício Copacabana"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observation" className="text-base font-semibold">
                      Observação
                    </Label>
                    <Textarea
                      id="observation"
                      value={formData.observation}
                      onChange={(e) =>
                        setFormData({ ...formData, observation: e.target.value })
                      }
                      placeholder="Notas internas"
                      rows={3}
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full h-12 text-base bg-[#9C1E1E] hover:bg-[#7D1818]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-5 w-5" />
                          Criar e Enviar Email
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                      className="w-full h-12 text-base"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mobile List */}
        <div className="p-4">
          <BenefitMobileList
            benefits={benefits}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onCopyLink={handleCopyLinkMobile}
            onInsertCode={handleInsertCodeMobile}
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Gift className="h-8 w-8 text-primary" />
            Benefício Prestadores
          </h1>
          <p className="text-muted-foreground mt-1">
            Presenteie os prestadores que ajudaram na ativação de pontos EXA
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/super_admin/gerenciar-beneficios')}
            size="lg"
            variant="outline"
          >
            <Gift className="h-4 w-4 mr-2" />
            Gerenciar
          </Button>
          <Button 
            onClick={() => navigate('/super_admin/preview-beneficio')} 
            size="lg"
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar Preview
          </Button>
          <Button onClick={() => setShowForm(!showForm)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Novo Benefício
          </Button>
        </div>
      </div>

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
          <CardTitle>Benefícios Criados</CardTitle>
          <CardDescription>Gerencie os benefícios enviados aos prestadores</CardDescription>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prestador</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Ponto Ativado</TableHead>
                    <TableHead>Presente Escolhido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benefits.map((benefit) => (
                    <TableRow key={benefit.id}>
                      <TableCell className="font-medium">{benefit.provider_name}</TableCell>
                      <TableCell>{benefit.provider_email}</TableCell>
                      <TableCell>
                        {benefit.activation_point || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {benefit.benefit_choice ? (
                          <span>{getBenefitName(benefit.benefit_choice)}</span>
                        ) : (
                          <span className="text-muted-foreground">Aguardando</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <BenefitStatusBadge status={benefit.status} />
                      </TableCell>
                      <TableCell>
                        {benefit.gift_code ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {benefit.gift_code}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(benefit.created_at), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {benefit.status !== 'cancelled' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyBenefitLink(benefit.access_token)}
                              title="Copiar link"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            {benefit.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resendInvitation(benefit.id)}
                                title="Reenviar email"
                              >
                                <Mail className="h-3 w-3" />
                              </Button>
                            )}
                            {benefit.status === 'choice_made' && !benefit.gift_code && (
                              <Button
                                size="sm"
                                onClick={() => handleInsertCode(benefit.id)}
                                title="Inserir código"
                              >
                                <Gift className="h-3 w-3" />
                              </Button>
                            )}
                          </>
                        )}
                        {benefit.status !== 'cancelled' && benefit.status !== 'code_sent' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelBenefit(benefit.id)}
                            title="Cancelar benefício"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
