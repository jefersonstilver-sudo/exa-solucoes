import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  X, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Type,
  Palette,
  Save,
  Eye,
  Edit3,
  Maximize2,
  Minimize2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FullscreenContractEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (content: string) => void;
  title?: string;
}

const FullscreenContractEditor: React.FC<FullscreenContractEditorProps> = ({
  isOpen,
  onClose,
  initialContent,
  onSave,
  title = 'Editor de Contrato'
}) => {
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const wrapSelection = (before: string, after: string = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newContent);
    
    // Restore focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newContent = content.substring(0, start) + text + content.substring(start);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
  const colors = [
    { name: 'Preto', value: '#000000' },
    { name: 'Vermelho EXA', value: '#8B1A1A' },
    { name: 'Azul', value: '#1d4ed8' },
    { name: 'Verde', value: '#166534' },
    { name: 'Cinza', value: '#6b7280' },
  ];

  const editorContent = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999999] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8B1A1A] to-[#A52020] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Edit3 className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b p-2 flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => wrapSelection('**', '**')}
            title="Negrito"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => wrapSelection('*', '*')}
            title="Itálico"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => wrapSelection('<u>', '</u>')}
            title="Sublinhado"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        {/* Font Size */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Type className="h-4 w-4" />
              Tamanho
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {fontSizes.map(size => (
              <DropdownMenuItem 
                key={size}
                onClick={() => wrapSelection(`<span style="font-size:${size}">`, '</span>')}
              >
                {size}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Palette className="h-4 w-4" />
              Cor
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {colors.map(color => (
              <DropdownMenuItem 
                key={color.value}
                onClick={() => wrapSelection(`<span style="color:${color.value}">`, '</span>')}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: color.value }}
                  />
                  {color.name}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-l pl-2 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertAtCursor('\n<div style="text-align:left">')}
            title="Alinhar à esquerda"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertAtCursor('\n<div style="text-align:center">')}
            title="Centralizar"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertAtCursor('\n<div style="text-align:right">')}
            title="Alinhar à direita"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-l pl-2 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertAtCursor('\n• ')}
            title="Lista com marcadores"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertAtCursor('\n1. ')}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 border-l pl-2 ml-auto">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
            <TabsList className="h-8">
              <TabsTrigger value="edit" className="h-7 text-xs">
                <Edit3 className="h-3 w-3 mr-1" />
                Editar
              </TabsTrigger>
              <TabsTrigger value="preview" className="h-7 text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Prévia
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-gray-100 p-4">
        {activeTab === 'edit' ? (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full font-mono text-sm resize-none bg-white p-4 rounded-lg shadow-inner"
            placeholder="Digite o conteúdo do contrato aqui..."
          />
        ) : (
          <div 
            className="w-full h-full overflow-auto bg-white p-6 rounded-lg shadow-inner prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>')
            }}
          />
        )}
      </div>
    </div>
  );

  return createPortal(editorContent, document.body);
};

export default FullscreenContractEditor;
