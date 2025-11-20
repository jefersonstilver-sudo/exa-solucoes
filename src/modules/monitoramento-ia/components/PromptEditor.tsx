/**
 * Component: PromptEditor
 * Editor de texto para prompts com contador de caracteres
 */

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  rows?: number;
}

export const PromptEditor = ({ 
  value, 
  onChange, 
  maxLength = 5000, 
  placeholder = "Digite o prompt...",
  rows = 15
}: PromptEditorProps) => {
  const currentLength = value.length;
  const percentage = (currentLength / maxLength) * 100;
  
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className="w-full bg-module-input border border-module rounded-lg p-4 text-module-primary placeholder-module-muted focus:outline-none focus:ring-2 focus:ring-module-accent font-mono text-sm"
      />
      <div className="flex items-center justify-between text-xs">
        <span className="text-module-tertiary">
          Caracteres: {currentLength.toLocaleString('pt-BR')} / {maxLength.toLocaleString('pt-BR')}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-32 h-1.5 bg-module-input rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                percentage > 90 ? 'bg-red-500' : 
                percentage > 75 ? 'bg-yellow-500' : 
                'bg-module-accent'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <span className={`font-medium ${
            percentage > 90 ? 'text-red-500' : 
            percentage > 75 ? 'text-yellow-500' : 
            'text-module-tertiary'
          }`}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    </div>
  );
};
