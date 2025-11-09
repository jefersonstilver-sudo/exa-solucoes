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
import { Loader2, Code, Eye, Send } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
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
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{templateName}</DialogTitle>
              <DialogDescription className="mt-2">
                Preview do template de email com dados de exemplo
              </DialogDescription>
            </div>
            <Badge variant="outline" className={categoryColors[templateCategory]}>
              {categoryNames[templateCategory]}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Código HTML
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-hidden">
            <TabsContent value="preview" className="h-full m-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="h-full border rounded-lg overflow-hidden bg-white">
                  <iframe
                    srcDoc={html}
                    className="w-full h-full"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="code" className="h-full m-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="h-full border rounded-lg overflow-auto bg-muted p-4">
                  <pre className="text-xs">
                    <code>{html}</code>
                  </pre>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Este preview usa dados de exemplo para demonstração
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
