import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Copy,
  Mail,
  Gift,
  Calendar,
  MapPin,
  User,
  AtSign,
  Zap,
  FileText,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BenefitStatusBadge from '@/components/benefits/BenefitStatusBadge';
import InsertCodeModal from '@/components/benefits/InsertCodeModal';
import DeleteConfirmationDialog from '@/components/benefits/DeleteConfirmationDialog';
import type { ProviderBenefit, BenefitOption } from '@/types/providerBenefits';

interface BenefitDetailsDialogProps {
  benefit: ProviderBenefit | null;
  benefitOptions: BenefitOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopyLink: (benefitId: string) => void;
  onResendEmail: (benefitId: string) => void;
  onInsertCode: (benefitId: string, code: string) => void;
  onCancelBenefit: (benefitId: string) => void;
}

export const BenefitDetailsDialog: React.FC<BenefitDetailsDialogProps> = ({
  benefit,
  benefitOptions,
  open,
  onOpenChange,
  onCopyLink,
  onResendEmail,
  onInsertCode,
  onCancelBenefit,
}) => {
  const [showInsertCodeModal, setShowInsertCodeModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!benefit) return null;

  const requiresAction = benefit.benefit_choice && !benefit.gift_code && benefit.status !== 'cancelled';
  const selectedBenefitOption = benefit.benefit_choice 
    ? benefitOptions.find(b => b.id === benefit.benefit_choice) 
    : null;
  const deliveryTime = selectedBenefitOption?.delivery_days === 1 
    ? 'em até 24 horas' 
    : `em até ${selectedBenefitOption?.delivery_days || 3} dias`;

  const handleCopyLink = () => {
    onCopyLink(benefit.id);
  };

  const handleResendEmail = () => {
    onResendEmail(benefit.id);
  };

  const handleInsertCode = async (data: { code: string; deliveryType: 'code' | 'link'; instructions: string }) => {
    onInsertCode(benefit.id, data.code);
    setShowInsertCodeModal(false);
  };

  const handleCancelBenefit = () => {
    onCancelBenefit(benefit.id);
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Gift className="h-6 w-6 text-primary" />
              Detalhes do Benefício
            </DialogTitle>
            <DialogDescription>
              Informações completas e ações disponíveis
            </DialogDescription>
          </DialogHeader>

          {/* Alerta de Ação Necessária */}
          {requiresAction && (
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900">⚡ Ação Necessária</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Prestador escolheu o presente. Insira o código do Gift Card para concluir.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Informações do Prestador */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informações do Prestador
              </h3>
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Nome:</span>
                  <span className="font-medium">{benefit.provider_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium">{benefit.provider_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Ponto Ativado:</span>
                  <span className="font-medium">{benefit.activation_point || '—'}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Presente Escolhido */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Presente Escolhido
              </h3>
              {selectedBenefitOption ? (
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-lg">{selectedBenefitOption.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Zap className="h-3 w-3 text-amber-500" />
                        Entrega {deliveryTime}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Escolha feita
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-muted/30 rounded-lg">
                  <Gift className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Aguardando escolha do prestador</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Status e Código */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Status e Código
              </h3>
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <BenefitStatusBadge status={benefit.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Código Gift Card:</span>
                  <span className="font-mono font-medium">
                    {benefit.gift_code || (
                      <span className="text-amber-600">Aguardando código</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Datas */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Datas e Comunicações
              </h3>
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data Criação:</span>
                  <span className="font-medium">
                    {format(new Date(benefit.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                
                {/* Status de Email de Convite */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    Email Convite:
                  </span>
                  {benefit.invitation_sent_at ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border border-green-200">
                        ✓ Enviado
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(benefit.invitation_sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      Não enviado
                    </Badge>
                  )}
                </div>

                {benefit.benefit_chosen_at && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Data da Escolha:</span>
                    <span className="font-medium">
                      {format(new Date(benefit.benefit_chosen_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}
                
                {benefit.gift_code_inserted_at && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Código Inserido em:</span>
                    <span className="font-medium">
                      {format(new Date(benefit.gift_code_inserted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}
                
                {/* Status de Email Final (código) */}
                {benefit.final_email_sent_at && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Gift className="h-4 w-4" />
                      Email Código:
                    </span>
                    <div className="flex flex-col items-end gap-0.5">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200">
                        ✓ Enviado
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(benefit.final_email_sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Observações */}
            {benefit.observation && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Observações</h3>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                    {benefit.observation}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Ações */}
          <div className="sticky bottom-0 bg-background pt-4 border-t mt-6">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </Button>

              <Button
                onClick={handleResendEmail}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Reenviar Email
              </Button>

              {requiresAction && (
                <Button
                  onClick={() => setShowInsertCodeModal(true)}
                  size="sm"
                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Inserir Código
                </Button>
              )}

              {benefit.status !== 'cancelled' && (
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modais de Ação */}
      {showInsertCodeModal && selectedBenefitOption && (
        <InsertCodeModal
          isOpen={showInsertCodeModal}
          onClose={() => setShowInsertCodeModal(false)}
          onConfirm={handleInsertCode}
          providerName={benefit.provider_name}
          benefitChoice={selectedBenefitOption.name}
          deliveryDays={selectedBenefitOption.delivery_days}
        />
      )}

      {showDeleteDialog && (
        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleCancelBenefit}
          providerName={benefit.provider_name}
        />
      )}
    </>
  );
};

export default BenefitDetailsDialog;
