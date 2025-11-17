import { useEditorState, FitMode } from '@/hooks/video-editor/useEditorState';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize, Expand, Scan } from 'lucide-react';

export const FitModeSelector = () => {
  const { fitMode, setFitMode } = useEditorState();

  const modes: { mode: FitMode; icon: React.ReactNode; label: string; tooltip: string }[] = [
    { 
      mode: 'fit', 
      icon: <Maximize className="h-4 w-4" />, 
      label: 'Ajustar',
      tooltip: 'Ajustar mantendo proporção' 
    },
    { 
      mode: 'fill', 
      icon: <Expand className="h-4 w-4" />, 
      label: 'Preencher',
      tooltip: 'Preencher canvas (pode cortar)' 
    },
    { 
      mode: 'stretch', 
      icon: <Minimize className="h-4 w-4" />, 
      label: 'Esticar',
      tooltip: 'Esticar para preencher' 
    },
    { 
      mode: 'original', 
      icon: <Scan className="h-4 w-4" />, 
      label: 'Original',
      tooltip: 'Tamanho real' 
    }
  ];

  return (
    <div className="flex items-center gap-1 bg-muted/30 rounded-md p-1">
      {modes.map(({ mode, icon, label, tooltip }) => (
        <Button
          key={mode}
          variant={fitMode === mode ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFitMode(mode)}
          title={tooltip}
          className="gap-2"
        >
          {icon}
          <span className="text-xs">{label}</span>
        </Button>
      ))}
    </div>
  );
};
