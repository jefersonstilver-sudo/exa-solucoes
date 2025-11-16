import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import AssetLibrary from '@/components/video-editor/library/AssetLibrary';
import { TemplatesPanel } from '@/components/video-editor/sidebar/TemplatesPanel';
import { TextToolsPanel } from '@/components/video-editor/sidebar/TextToolsPanel';

interface ExpansionPanelProps {
  activePanel: string | null;
  onClose: () => void;
}

const panelTitles: Record<string, string> = {
  media: 'Media Library',
  templates: 'Templates',
  text: 'Text Tools',
  elements: 'Elements',
  audio: 'Audio',
  transitions: 'Transitions',
  effects: 'Effects',
  settings: 'Settings',
};

export const ExpansionPanel = ({ activePanel, onClose }: ExpansionPanelProps) => {
  const getPanelTitle = (panelId: string) => {
    return panelTitles[panelId] || panelId;
  };

  const renderPanelContent = (panelId: string) => {
    switch (panelId) {
      case 'media':
        return <AssetLibrary />;
      case 'templates':
        return <TemplatesPanel />;
      case 'text':
        return <TextToolsPanel />;
      case 'elements':
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Elements</p>
              <p className="text-xs">Coming soon in Phase 6</p>
            </div>
          </div>
        );
      case 'audio':
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Audio Library</p>
              <p className="text-xs">Coming soon in Phase 6</p>
            </div>
          </div>
        );
      case 'transitions':
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Transitions</p>
              <p className="text-xs">Coming soon in Phase 6</p>
            </div>
          </div>
        );
      case 'effects':
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Effects</p>
              <p className="text-xs">Coming soon in Phase 6</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Project Settings</p>
              <p className="text-xs">Coming soon in Phase 5</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!activePanel) return null;

  return (
    <div className="h-full w-full bg-background border-r flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0">
        <h2 className="font-semibold text-sm">{getPanelTitle(activePanel)}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderPanelContent(activePanel)}
      </div>
    </div>
  );
};
