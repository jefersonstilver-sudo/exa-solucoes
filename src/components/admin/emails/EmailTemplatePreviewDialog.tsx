import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Code, Eye, Send, Save, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getTemplateSample } from '@/lib/email-template-samples';

interface EmailTemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  templateCategory: string;
}

const EmailTemplatePreviewDialog: React.FC<EmailTemplatePreviewDialogProps> = ({
  open,
  onOpenChange,
  templateId,
  templateName,
  templateCategory,
}) => {
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState<string>('');
  const [originalHtml, setOriginalHtml] = useState<string>('');
  const [editedHtml, setEditedHtml] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && templateId) {
      loadTemplate();
    }
  }, [open, templateId]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      // Buscar dados de exemplo para o template
      const sampleData = getTemplateSample(templateId as any);
      
      if (!sampleData) {
        toast({
          title: 'Erro',
          description: 'Dados de exemplo não encontrados para este template',
          variant: 'destructive',
        });
        return;
      }

      // Renderizar template via edge function
      const { data, error } = await supabase.functions.invoke('render-email-template', {
        body: {
          templateId,
          data: sampleData,
        },
      });

      if (error) throw error;

      if (data?.html) {
        setHtml(data.html);
        setOriginalHtml(data.html);
        setEditedHtml(data.html);
        setHasChanges(false);
      } else {
        throw new Error('HTML não retornado pela função');
      }
    } catch (error: any) {
      console.error('Error loading template:', error);
      toast({
        title: 'Erro ao carregar template',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHtmlChange = (newHtml: string) => {
    setEditedHtml(newHtml);
    setHasChanges(newHtml !== originalHtml);
  };

  const applyChanges = () => {
    setHtml(editedHtml);
    setOriginalHtml(editedHtml);
    setHasChanges(false);
    toast({
      title: 'Alterações aplicadas',
      description: 'O preview foi atualizado com suas mudanças',
    });
  };

  const resetChanges = () => {
    setEditedHtml(originalHtml);
    setHtml(originalHtml);
    setHasChanges(false);
    toast({
      title: 'Alterações descartadas',
      description: 'O código foi restaurado ao original',
    });
  };

  const categoryColors: Record<string, string> = {
    auth: 'bg-blue-500/10 text-blue-700 border-blue-200',
    admin: 'bg-purple-500/10 text-purple-700 border-purple-200',
    video: 'bg-green-500/10 text-green-700 border-green-200',
    benefits: 'bg-orange-500/10 text-orange-700 border-orange-200',
  };

  const categoryNames: Record<string, string> = {
    auth: 'Autenticação',
    admin: 'Administrativo',
    video: 'Vídeos',
    benefits: 'Benefícios',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{templateName}</DialogTitle>
              <DialogDescription className="mt-2">
                Preview e edição do template de email com dados de exemplo
              </DialogDescription>
            </div>
            <Badge variant="outline" className={categoryColors[templateCategory]}>
              {categoryNames[templateCategory]}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0 px-6">
          <TabsList className="grid w-full grid-cols-2 my-4">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Editar HTML
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-hidden pb-4">
            <TabsContent value="preview" className="h-full m-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="h-full border-2 rounded-lg overflow-hidden bg-white shadow-lg">
                  <iframe
                    srcDoc={html}
                    className="w-full h-full"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="code" className="h-full m-0 flex flex-col gap-3">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {hasChanges && (
                    <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                        <p className="text-sm font-medium text-amber-900">
                          Você tem alterações não aplicadas
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetChanges}
                          className="border-amber-300 hover:bg-amber-100"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Descartar
                        </Button>
                        <Button
                          size="sm"
                          onClick={applyChanges}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Aplicar ao Preview
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 min-h-0 border-2 rounded-lg overflow-hidden">
                    <Textarea
                      value={editedHtml}
                      onChange={(e) => handleHtmlChange(e.target.value)}
                      className="h-full font-mono text-xs resize-none border-0 focus-visible:ring-0 p-4"
                      placeholder="Cole ou edite o HTML do email aqui..."
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>Linhas: {editedHtml.split('\n').length}</span>
                      <span>Caracteres: {editedHtml.length.toLocaleString()}</span>
                    </div>
                    <span>Edite o código e clique em "Aplicar ao Preview" para ver as mudanças</span>
                  </div>
                </>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-between items-center px-6 py-4 border-t bg-muted/30">
          <p className="text-sm text-muted-foreground">
            💡 Este preview usa dados de exemplo para demonstração
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button variant="default" disabled>
              <Send className="h-4 w-4 mr-2" />
              Enviar Teste
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailTemplatePreviewDialog;
