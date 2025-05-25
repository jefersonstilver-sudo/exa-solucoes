
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor } from 'lucide-react';
import { usePanelFormData } from '@/hooks/usePanelFormData';
import PanelBasicForm from './form/PanelBasicForm';
import PanelTechnicalForm from './form/PanelTechnicalForm';
import PanelNetworkForm from './form/PanelNetworkForm';
import PanelRemoteForm from './form/PanelRemoteForm';

interface PanelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panel?: any;
  onSuccess: () => void;
}

const PanelFormDialog: React.FC<PanelFormDialogProps> = ({
  open,
  onOpenChange,
  panel,
  onSuccess
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    formData,
    buildings,
    loading,
    handleFormUpdate,
    handleSubmit
  } = usePanelFormData(panel, open);

  const onSubmit = (e: React.FormEvent) => {
    handleSubmit(e, onSuccess, onOpenChange);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <Monitor className="h-6 w-6 mr-2" />
            {panel ? 'Editar Painel' : 'Novo Painel'}
          </DialogTitle>
          <DialogDescription>
            {panel ? 'Edite as configurações do painel' : 'Configure um novo painel digital (Padrão: 22", 1080x1920, Vertical, Linux)'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="technical">Técnico</TabsTrigger>
              <TabsTrigger value="network">Rede</TabsTrigger>
              <TabsTrigger value="remote">Acesso Remoto</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <PanelBasicForm
                formData={formData}
                buildings={buildings}
                onFormUpdate={handleFormUpdate}
              />
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <PanelTechnicalForm
                formData={formData}
                panel={panel}
                onFormUpdate={handleFormUpdate}
              />
            </TabsContent>

            <TabsContent value="network" className="space-y-4">
              <PanelNetworkForm
                formData={formData}
                onFormUpdate={handleFormUpdate}
              />
            </TabsContent>

            <TabsContent value="remote" className="space-y-4">
              <PanelRemoteForm
                formData={formData}
                showPassword={showPassword}
                onFormUpdate={handleFormUpdate}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-indexa-purple hover:bg-indexa-purple-dark">
              {loading ? 'Salvando...' : (panel ? 'Atualizar Painel' : 'Criar Painel')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PanelFormDialog;
