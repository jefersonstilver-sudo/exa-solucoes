import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TextFormattingToolbar } from './TextFormattingToolbar';
import { SectionSearchBar } from './SectionSearchBar';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [lineInfo, setLineInfo] = useState<{ current: number; total: number }>({ current: 1, total: 1 });
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  const handleUpdate = async (id: string, content: string) => {
    try {
      setSaving(true);
      
      const section = sections.find(s => s.id === id);
      if (!section) throw new Error('Section not found');
      
      const { error } = await supabase
        .from('agent_sections')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Seção atualizada com sucesso');
      setEditingId(null);
      window.location.reload();
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error('Erro ao atualizar seção');
    } finally {
      setSaving(false);
    }
  };

  const updateLineInfo = (textarea: HTMLTextAreaElement) => {
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const currentLine = textBeforeCursor.split('\n').length;
    const totalLines = text.split('\n').length;
    setLineInfo({ current: currentLine, total: totalLines });
  };

  const handleFormat = (sectionId: string, format: string, prefix: string, suffix?: string) => {
    const textarea = textareaRefs.current[sectionId];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let newText;
    if (selectedText) {
      newText = beforeText + prefix + selectedText + (suffix || '') + afterText;
    } else {
      newText = beforeText + prefix + (suffix || '') + afterText;
    }

    textarea.value = newText;
    const newCursorPos = start + prefix.length + selectedText.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
    updateLineInfo(textarea);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? `<mark class="bg-yellow-200 dark:bg-yellow-800">${part}</mark>`
        : part
    ).join('');
  };

  const filteredSections = sections.filter(section => 
    !searchQuery || section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMatches = searchQuery 
    ? sections.reduce((count, section) => {
        const matches = section.content.toLowerCase().split(searchQuery.toLowerCase()).length - 1;
        return count + matches;
      }, 0)
    : 0;

  return (
    <div className="space-y-4">
      <SectionSearchBar 
        onSearch={setSearchQuery}
        totalResults={searchQuery ? totalMatches : undefined}
      />

      {filteredSections.map((section) => (
        <Card key={section.id} className="bg-module-card border-module">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-lg text-module-primary">
                  {section.section_number}. {section.section_title}
                </CardTitle>
                <div className="flex gap-4 text-xs text-module-secondary">
                  <span>📊 {section.content.length.toLocaleString('pt-BR')} caracteres</span>
                  <span>📝 {section.content.split('\n').length} linhas</span>
                </div>
              </div>
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
                        const textarea = textareaRefs.current[section.id];
                        if (textarea) handleUpdate(section.id, textarea.value);
                      }}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        navigator.clipboard.writeText(section.content);
                        toast.success('Texto copiado para a área de transferência');
                      }}
                      title="Copiar texto completo"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setEditingId(section.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {editingId === section.id ? (
              <>
                <TextFormattingToolbar
                  onFormat={(format, prefix, suffix) => 
                    handleFormat(section.id, format, prefix, suffix)
                  }
                  disabled={saving}
                />
                <div className="relative">
                  <div className="sticky top-0 z-10 bg-module-card/95 backdrop-blur-sm border-b border-module px-3 py-2 mb-2 flex justify-between items-center">
                    <span className="text-xs font-mono text-module-secondary">
                      Linha {lineInfo.current} de {lineInfo.total}
                    </span>
                    <span className="text-xs text-module-secondary">
                      {section.content.length.toLocaleString('pt-BR')} caracteres
                    </span>
                  </div>
                  <Textarea
                    ref={(el) => {
                      textareaRefs.current[section.id] = el;
                      if (el) {
                        updateLineInfo(el);
                      }
                    }}
                    defaultValue={section.content}
                    className="min-h-[300px] font-mono text-sm bg-module-input border-module text-module-primary"
                    onChange={(e) => updateLineInfo(e.target)}
                    onKeyUp={(e) => updateLineInfo(e.currentTarget)}
                    onClick={(e) => updateLineInfo(e.currentTarget)}
                  />
                </div>
              </>
            ) : (
              <div className="text-sm text-module-primary font-mono">
                {section.content.split('\n').map((line, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-module-secondary select-none min-w-[3ch] text-right">
                      {index + 1}
                    </span>
                    <span 
                      className="flex-1"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightText(line, searchQuery) 
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {filteredSections.length === 0 && searchQuery && (
        <Card className="bg-module-card border-module">
          <CardContent className="py-8 text-center">
            <p className="text-module-secondary">
              Nenhum resultado encontrado para "{searchQuery}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
