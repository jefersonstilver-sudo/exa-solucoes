import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Code } from 'lucide-react';

interface TextFormattingToolbarProps {
  onFormat: (format: string, prefix: string, suffix?: string) => void;
  disabled?: boolean;
}

export const TextFormattingToolbar = ({ onFormat, disabled }: TextFormattingToolbarProps) => {
  const formatButtons = [
    { icon: Bold, label: 'Negrito', prefix: '**', suffix: '**' },
    { icon: Italic, label: 'Itálico', prefix: '_', suffix: '_' },
    { icon: Heading1, label: 'Título 1', prefix: '# ', suffix: '' },
    { icon: Heading2, label: 'Título 2', prefix: '## ', suffix: '' },
    { icon: List, label: 'Lista', prefix: '- ', suffix: '' },
    { icon: ListOrdered, label: 'Lista Numerada', prefix: '1. ', suffix: '' },
    { icon: Code, label: 'Código', prefix: '`', suffix: '`' },
  ];

  return (
    <div className="flex items-center gap-1 p-2 bg-muted/30 rounded-md border border-border/50 mb-3">
      <span className="text-xs text-muted-foreground mr-2 px-2">Formatação:</span>
      {formatButtons.map((btn) => (
        <Button
          key={btn.label}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onFormat(btn.label, btn.prefix, btn.suffix)}
          disabled={disabled}
          title={btn.label}
        >
          <btn.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
};
