import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Code, Eye, Send, Save, RotateCcw, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getTemplateSample } from '@/lib/email-template-samples';
import EmailTemplateHistoryPanel from './EmailTemplateHistoryPanel';

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
  const [saving, setSaving] = useState(false);
  const [html, setHtml] = useState<string>('');
  const [originalHtml, setOriginalHtml] = useState<string>('');
  const [editedHtml, setEditedHtml] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [hasChanges, setHasChanges] = useState(false);
  const [hasCustomization, setHasCustomization] = useState(false);
  const [customizationId, setCustomizationId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentVersionNumber, setCurrentVersionNumber] = useState<number | undefined>();
  const [changeDescription, setChangeDescription] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && templateId) {
      loadTemplate();
      loadHistory();
    } else if (!open) {
      // Reset states when closing
      setChangeDescription('');
      setShowHistoryPanel(false);
    }
  }, [open, templateId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('email_template_history')
        .select('*')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadTemplate = async () => {
    setLoading(true);
    try {
      // Primeiro, verificar se há customização salva
      const { data: customization, error: customError } = await supabase
        .from('email_template_customizations')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .single();

      let htmlToUse = '';

      if (customization && customization.custom_html) {
        // Usar customização salva
        htmlToUse = customization.custom_html;
        setHasCustomization(true);
        setCustomizationId(customization.id);
      } else {
        // Buscar template padrão
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
          htmlToUse = data.html;
          setHasCustomization(false);
          setCustomizationId(null);
        } else {
          throw new Error('HTML não retornado pela função');
        }
      }

      setHtml(htmlToUse);
      setOriginalHtml(htmlToUse);
      setEditedHtml(htmlToUse);
      setHasChanges(false);
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

  const saveCustomization = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Get next version number
      const { data: maxVersionData } = await supabase
        .from('email_template_history')
        .select('version_number')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (maxVersionData?.version_number || 0) + 1;

      // Save to history first
      const { error: historyError } = await supabase
        .from('email_template_history')
        .insert({
          template_id: templateId,
          custom_html: editedHtml,
          version_number: nextVersion,
          saved_by: user.id,
          change_description: changeDescription || undefined,
        });

      if (historyError) throw historyError;

      // Update or create customization
      const customizationData = {
        template_id: templateId,
        custom_html: editedHtml,
        is_active: true,
        updated_by: user.id,
      };

      if (customizationId) {
        const { error } = await supabase
          .from('email_template_customizations')
          .update(customizationData)
          .eq('id', customizationId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('email_template_customizations')
          .upsert(customizationData, {
            onConflict: 'template_id',
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setCustomizationId(data.id);
      }

      setOriginalHtml(editedHtml);
      setHtml(editedHtml);
      setHasChanges(false);
      setHasCustomization(true);
      setCurrentVersionNumber(nextVersion);
      setChangeDescription('');

      // Reload history
      await loadHistory();

      toast({
        title: '✅ Customização salva!',
        description: `Versão ${nextVersion} criada com sucesso`,
      });
    } catch (error: any) {
      console.error('Error saving customization:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const restoreDefault = async () => {
    if (!hasCustomization) return;

    const confirmed = window.confirm(
      'Tem certeza que deseja restaurar o template original? A customização será desativada.'
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      if (customizationId) {
        const { error } = await supabase
          .from('email_template_customizations')
          .update({ is_active: false })
          .eq('id', customizationId);

        if (error) throw error;
      }

      // Recarregar template padrão
      await loadTemplate();

      toast({
        title: 'Template restaurado',
        description: 'O template voltou para a versão original',
      });
    } catch (error: any) {
      console.error('Error restoring default:', error);
      toast({
        title: 'Erro ao restaurar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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

  const handleRestoreVersion = async (version: any) => {
    const confirmed = window.confirm(
      `Restaurar versão ${version.version_number}? As alterações não salvas serão perdidas.`
    );

    if (!confirmed) return;

    setEditedHtml(version.custom_html);
    setHtml(version.custom_html);
    setOriginalHtml(version.custom_html);
    setHasChanges(false);
    setCurrentVersionNumber(version.version_number);

    toast({
      title: 'Versão restaurada',
      description: `Versão ${version.version_number} foi restaurada com sucesso`,
    });
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowCloseConfirm(true);
    } else {
      onOpenChange(false);
    }
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    onOpenChange(false);
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
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-2xl">{templateName}</DialogTitle>
                {hasCustomization && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                    ✓ Customizado
                  </Badge>
                )}
              </div>
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
          <div className="flex items-center justify-between my-4">
            <TabsList className="grid grid-cols-2 w-auto">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Editar HTML
              </TabsTrigger>
            </TabsList>
            {activeTab === 'code' && (
              <Button
                variant={showHistoryPanel ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              >
                <History className="h-4 w-4 mr-2" />
                {showHistoryPanel ? 'Ocultar' : 'Mostrar'} Histórico
              </Button>
            )}
          </div>

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

            <TabsContent value="code" className="h-full m-0 flex gap-3">
              {loading ? (
                <div className="flex items-center justify-center h-full w-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className={`flex flex-col gap-3 transition-all ${showHistoryPanel ? 'w-2/3' : 'w-full'}`}>
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

                    {hasChanges && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Label htmlFor="change-description" className="text-sm font-medium text-blue-900 mb-2 block">
                          Descrição das alterações (opcional)
                        </Label>
                        <Input
                          id="change-description"
                          value={changeDescription}
                          onChange={(e) => setChangeDescription(e.target.value)}
                          placeholder="Ex: Ajustado layout do header, corrigido cores..."
                          className="bg-white"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>Linhas: {editedHtml.split('\n').length}</span>
                        <span>Caracteres: {editedHtml.length.toLocaleString()}</span>
                      </div>
                      <span>Edite o código e clique em "Aplicar ao Preview" para ver as mudanças</span>
                    </div>
                  </div>

                  {showHistoryPanel && (
                    <div className="w-1/3 h-full">
                      <EmailTemplateHistoryPanel
                        history={history}
                        loading={loadingHistory}
                        onRestore={handleRestoreVersion}
                        currentVersion={currentVersionNumber}
                      />
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-between items-center px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              💡 {hasCustomization 
                ? 'Template customizado - será usado nos envios reais' 
                : 'Este preview usa dados de exemplo'}
            </p>
            {hasCustomization && (
              <Button
                variant="outline"
                size="sm"
                onClick={restoreDefault}
                disabled={saving}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Restaurar Original
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={saveCustomization}
              disabled={saving || !editedHtml}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Customização
            </Button>
            <Button variant="outline" onClick={handleClose}>
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

    <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem alterações que ainda não foram salvas. Se fechar agora, essas alterações serão perdidas.
            Tem certeza que deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmClose} className="bg-destructive hover:bg-destructive/90">
            Fechar sem Salvar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};

export default EmailTemplatePreviewDialog;
