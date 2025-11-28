import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

interface AddAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddAlertDialog = ({ open, onOpenChange }: AddAlertDialogProps) => {
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'custom',
    descricao: '',
    template: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement alert creation
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#9C1E1E] to-[#D72638] bg-clip-text text-transparent">
            ✨ Novo Alerta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>
            
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Alerta *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Painel Offline Alto Risco"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Alerta *</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="painel_offline">🚨 Painel Offline</SelectItem>
                  <SelectItem value="comportamental">📊 Comportamental</SelectItem>
                  <SelectItem value="custom">⚙️ Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva quando este alerta deve ser acionado..."
                rows={3}
              />
            </div>
          </div>

          {/* Template Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Template da Mensagem</h3>
            
            <div className="space-y-2">
              <Label htmlFor="template">Mensagem *</Label>
              <Textarea
                id="template"
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                placeholder="Ex: 🔴 Painel {painel_nome} está offline há {tempo} minutos..."
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                <strong>Variáveis disponíveis:</strong> {'{painel_nome}'}, {'{predio}'}, {'{status}'}, {'{tempo}'}
              </p>
            </div>
          </div>

          {/* Coming Soon Sections */}
          <div className="space-y-4 opacity-50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Destinatários, condições e escalonamento serão configurados após criação</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-[#9C1E1E] to-[#D72638]">
              Criar Alerta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
