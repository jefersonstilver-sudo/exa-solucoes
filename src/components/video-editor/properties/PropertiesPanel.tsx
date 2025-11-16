import { useEditorState } from '@/hooks/video-editor/useEditorState';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export const PropertiesPanel = () => {
  const { layers, selectedLayerId, updateLayer, removeLayer } = useEditorState();
  
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  if (!selectedLayer) {
    return (
      <div className="w-80 border-l bg-muted/30 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Select a layer to edit</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-background overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold capitalize">{selectedLayer.type} Properties</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeLayer(selectedLayer.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        {/* Position */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Position</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pos-x" className="text-xs text-muted-foreground">X</Label>
              <Input
                id="pos-x"
                type="number"
                value={Math.round(selectedLayer.position.x)}
                onChange={(e) => updateLayer(selectedLayer.id, {
                  position: { ...selectedLayer.position, x: Number(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label htmlFor="pos-y" className="text-xs text-muted-foreground">Y</Label>
              <Input
                id="pos-y"
                type="number"
                value={Math.round(selectedLayer.position.y)}
                onChange={(e) => updateLayer(selectedLayer.id, {
                  position: { ...selectedLayer.position, y: Number(e.target.value) }
                })}
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Size</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="size-w" className="text-xs text-muted-foreground">Width</Label>
              <Input
                id="size-w"
                type="number"
                value={Math.round(selectedLayer.size.width)}
                onChange={(e) => updateLayer(selectedLayer.id, {
                  size: { ...selectedLayer.size, width: Number(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label htmlFor="size-h" className="text-xs text-muted-foreground">Height</Label>
              <Input
                id="size-h"
                type="number"
                value={Math.round(selectedLayer.size.height)}
                onChange={(e) => updateLayer(selectedLayer.id, {
                  size: { ...selectedLayer.size, height: Number(e.target.value) }
                })}
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Rotation: {selectedLayer.rotation}°</Label>
          <Slider
            value={[selectedLayer.rotation]}
            onValueChange={([value]) => updateLayer(selectedLayer.id, { rotation: value })}
            min={-180}
            max={180}
            step={1}
          />
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Opacity: {Math.round(selectedLayer.opacity * 100)}%</Label>
          <Slider
            value={[selectedLayer.opacity * 100]}
            onValueChange={([value]) => updateLayer(selectedLayer.id, { opacity: value / 100 })}
            min={0}
            max={100}
            step={1}
          />
        </div>

        {/* Timing */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Timing</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start-time" className="text-xs text-muted-foreground">Start (s)</Label>
              <Input
                id="start-time"
                type="number"
                step="0.1"
                value={selectedLayer.start_time}
                onChange={(e) => {
                  const start = Number(e.target.value);
                  updateLayer(selectedLayer.id, {
                    start_time: start,
                    duration: selectedLayer.end_time - start
                  });
                }}
              />
            </div>
            <div>
              <Label htmlFor="end-time" className="text-xs text-muted-foreground">End (s)</Label>
              <Input
                id="end-time"
                type="number"
                step="0.1"
                value={selectedLayer.end_time}
                onChange={(e) => {
                  const end = Number(e.target.value);
                  updateLayer(selectedLayer.id, {
                    end_time: end,
                    duration: end - selectedLayer.start_time
                  });
                }}
              />
            </div>
          </div>
        </div>

        {/* Text-specific properties */}
        {selectedLayer.type === 'text' && (
          <div className="space-y-3 pt-3 border-t">
            <Label className="text-sm font-medium">Text Content</Label>
            <Input
              value={selectedLayer.content || ''}
              onChange={(e) => updateLayer(selectedLayer.id, { content: e.target.value })}
              placeholder="Enter text..."
            />
            
            <div>
              <Label htmlFor="font-size" className="text-xs text-muted-foreground">Font Size</Label>
              <Input
                id="font-size"
                type="number"
                value={selectedLayer.style?.fontSize || 48}
                onChange={(e) => updateLayer(selectedLayer.id, {
                  style: { ...selectedLayer.style, fontSize: Number(e.target.value) }
                })}
              />
            </div>

            <div>
              <Label htmlFor="text-color" className="text-xs text-muted-foreground">Color</Label>
              <Input
                id="text-color"
                type="color"
                value={selectedLayer.style?.color || '#ffffff'}
                onChange={(e) => updateLayer(selectedLayer.id, {
                  style: { ...selectedLayer.style, color: e.target.value }
                })}
              />
            </div>
          </div>
        )}

        {/* Shape-specific properties */}
        {selectedLayer.type === 'shape' && (
          <div className="space-y-3 pt-3 border-t">
            <div>
              <Label htmlFor="fill-color" className="text-xs text-muted-foreground">Fill Color</Label>
              <Input
                id="fill-color"
                type="color"
                value={selectedLayer.style?.fill || '#ffffff'}
                onChange={(e) => updateLayer(selectedLayer.id, {
                  style: { ...selectedLayer.style, fill: e.target.value }
                })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
