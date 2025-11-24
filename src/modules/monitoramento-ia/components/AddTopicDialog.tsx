import { useState } from 'react';
import { Plus, FileText, Link as LinkIcon, File, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useModuleTheme, getThemeClass } from '@/modules/monitoramento-ia/hooks/useModuleTheme';
import { cn } from '@/lib/utils';

interface AddTopicDialogProps {
  agentKey: string;
  onSuccess: () => void;
}

export const AddTopicDialog = ({ agentKey, onSuccess }: AddTopicDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useModuleTheme();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    keywords: '',
    type: 'texto' as 'documento' | 'link' | 'texto' | 'pdf',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast.error('Preencha título e conteúdo');
      return;
    }

    setLoading(true);
    try {
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const { error } = await supabase.from('agent_topics').insert({
        agent_key: agentKey,
        title: formData.title,
        content: formData.content,
        keywords: keywordsArray,
        type: formData.type,
        is_active: true,
      });

      if (error) throw error;

      // Registrar no log de modificações
      await supabase.from('agent_modification_logs').insert({
        agent_key: agentKey,
        section: 'assuntos',
        field_modified: 'novo_assunto',
        old_value: null,
        new_value: formData.title,
        modified_by: 'user',
      });

      toast.success('Assunto adicionado com sucesso!');
      setOpen(false);
      setFormData({ title: '', content: '', keywords: '', type: 'texto' });
      onSuccess();
    } catch (error) {
      console.error('Erro ao adicionar assunto:', error);
      toast.error('Erro ao adicionar assunto');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      texto: <FileText className="w-4 h-4" />,
      link: <LinkIcon className="w-4 h-4" />,
      documento: <File className="w-4 h-4" />,
      pdf: <FileUp className="w-4 h-4" />,
    };
    return icons[type as keyof typeof icons] || <FileText className="w-4 h-4" />;
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-module-accent hover:bg-module-accent-hover"
      >
        <Plus className="w-4 h-4 mr-2" />
        Novo Assunto
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn(getThemeClass(theme), "max-w-2xl bg-module-card border-module")}>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Assunto</DialogTitle>
            <DialogDescription>
              Adicione documentos, links ou textos que a Sofia poderá consultar quando as palavras-chave forem detectadas
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Assunto *</Label>
              <Input
                id="title"
                placeholder="Ex: Preços e Planos"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Conteúdo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="texto">
                    <div className="flex items-center gap-2">
                      {getTypeIcon('texto')}
                      Texto
                    </div>
                  </SelectItem>
                  <SelectItem value="link">
                    <div className="flex items-center gap-2">
                      {getTypeIcon('link')}
                      Link/URL
                    </div>
                  </SelectItem>
                  <SelectItem value="documento">
                    <div className="flex items-center gap-2">
                      {getTypeIcon('documento')}
                      Documento
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      {getTypeIcon('pdf')}
                      PDF
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Palavras-chave (separadas por vírgula) *</Label>
              <Input
                id="keywords"
                placeholder="Ex: preço, valor, quanto custa, plano"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              />
              <p className="text-xs text-module-tertiary">
                A Sofia consultará este assunto quando detectar estas palavras na conversa
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo *</Label>
              <Textarea
                id="content"
                placeholder="Cole o conteúdo, link ou informações sobre este assunto..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Adicionar Assunto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
