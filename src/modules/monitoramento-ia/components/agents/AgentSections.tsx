import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Section {
  id: string;
  agent_id: string;
  section_number: number;
  section_title: string;
  content: string;
}

interface AgentSectionsProps {
  sections: Section[];
  agentId: string;
}

export const AgentSections = ({ sections, agentId }: AgentSectionsProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (id: string, content: string) => {
    try {
      setSaving(true);
      
      // Find section to get section_number and title
      const section = sections.find(s => s.id === id);
      if (!section) throw new Error('Section not found');
      
      const { error } = await supabase
        .from('agent_sections')
        .upsert({ 
          agent_id: agentId,
          section_number: section.section_number,
          section_title: section.section_title,
          content,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Seção atualizada com sucesso');
      setEditingId(null);
      window.location.reload(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error('Erro ao atualizar seção');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">
                {section.section_number}. {section.section_title}
              </CardTitle>
              <div className="flex gap-2">
                {editingId === section.id ? (
                  <>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setEditingId(null)}
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const textarea = document.getElementById(`content-${section.id}`) as HTMLTextAreaElement;
                        if (textarea) handleUpdate(section.id, textarea.value);
                      }}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setEditingId(section.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {editingId === section.id ? (
              <Textarea
                id={`content-${section.id}`}
                defaultValue={section.content}
                className="min-h-[200px] font-mono text-sm"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {section.content}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
