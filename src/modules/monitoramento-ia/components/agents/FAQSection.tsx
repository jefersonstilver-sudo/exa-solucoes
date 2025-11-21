import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface FAQSectionProps {
  agentKey: string;
  onRefresh: () => void;
}

export const FAQSection = ({ agentKey, onRefresh }: FAQSectionProps) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFaqs();
  }, [agentKey]);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_knowledge')
        .select('*')
        .eq('agent_key', agentKey)
        .eq('section', 'faq')
        .eq('is_active', true);

      if (error) throw error;

      setFaqs((data || []).map(item => ({
        id: item.id,
        question: item.title,
        answer: item.content
      })));
    } catch (error) {
      console.error('Error loading FAQs:', error);
      toast.error('Erro ao carregar FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newFaq.question || !newFaq.answer) {
      toast.error('Preencha pergunta e resposta');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('agent_knowledge')
        .insert({
          agent_key: agentKey,
          section: 'faq',
          title: newFaq.question,
          content: newFaq.answer,
          metadata: { type: 'faq' },
          is_active: true
        });

      if (error) throw error;

      toast.success('FAQ adicionada com sucesso');
      setNewFaq({ question: '', answer: '' });
      setIsAddDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error adding FAQ:', error);
      toast.error('Erro ao adicionar FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agent_knowledge')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('FAQ removida');
      onRefresh();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Erro ao remover FAQ');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Perguntas Frequentes</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Pergunta Frequente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Pergunta</Label>
                <Input
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  placeholder="Ex: Qual o valor do investimento?"
                />
              </div>
              <div>
                <Label>Resposta</Label>
                <Textarea
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  placeholder="Digite a resposta completa..."
                  className="min-h-[150px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAdd} disabled={saving}>
                  {saving ? 'Salvando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </CardContent>
          </Card>
        ) : faqs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma FAQ adicionada ainda. Clique em "Adicionar FAQ" para começar.
            </CardContent>
          </Card>
        ) : (
          faqs.map((faq) => (
            <Card key={faq.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(faq.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(faq.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
