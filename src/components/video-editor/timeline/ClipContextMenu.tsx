import React from 'react';
import { useEditorState } from '@/hooks/video-editor/useEditorState';
import { TimelineLayer } from '@/types/videoEditor';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Scissors, Copy, Trash2 } from 'lucide-react';

interface ClipContextMenuProps {
  layer: TimelineLayer;
  children: React.ReactNode;
}

export const ClipContextMenu = ({ layer, children }: ClipContextMenuProps) => {
  const { currentTime, removeLayer, updateLayer, layers } = useEditorState();
  const state = useEditorState();

  const handleSplitAtPlayhead = () => {
    if (currentTime > layer.start_time && currentTime < layer.end_time) {
      state.splitLayer(layer.id, currentTime);
    }
  };

  const handleDuplicate = () => {
    const newLayer: TimelineLayer = {
      ...layer,
      id: `${layer.id}-copy-${Date.now()}`,
      start_time: layer.end_time,
      end_time: layer.end_time + layer.duration,
    };
    state.addLayer(newLayer);
  };

  const handleDelete = () => {
    removeLayer(layer.id);
  };

  const canSplitAtPlayhead = currentTime > layer.start_time && currentTime < layer.end_time;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem 
          onClick={handleSplitAtPlayhead}
          disabled={!canSplitAtPlayhead}
          className="gap-2"
        >
          <Scissors className="h-4 w-4" />
          Split no Playhead
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleDuplicate} className="gap-2">
          <Copy className="h-4 w-4" />
          Duplicar
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          onClick={handleDelete} 
          className="gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Deletar
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
