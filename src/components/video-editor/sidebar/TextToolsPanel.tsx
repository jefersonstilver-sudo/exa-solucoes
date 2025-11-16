import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEditorState } from '@/hooks/video-editor/useEditorState';
import { v4 as uuidv4 } from 'uuid';
import { Type } from 'lucide-react';
import { useState } from 'react';

export const TextToolsPanel = () => {
  const { addLayer, currentTime } = useEditorState();
  const [textContent, setTextContent] = useState('Your Text Here');

  const handleAddText = () => {
    const textLayer = {
      id: uuidv4(),
      type: 'text' as const,
      start_time: currentTime,
      end_time: currentTime + 3,
      duration: 3,
      position: { x: 100, y: 100 },
      size: { width: 400, height: 100 },
      rotation: 0,
      opacity: 1,
      z_index: 100,
      content: textContent,
      style: {
        color: '#ffffff',
        fontSize: 48,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        textAlign: 'center',
      },
    };

    addLayer(textLayer);
    setTextContent('Your Text Here');
  };

  const presetTexts = [
    { label: 'Title', fontSize: 72, fontWeight: 'bold' },
    { label: 'Subtitle', fontSize: 48, fontWeight: 'normal' },
    { label: 'Caption', fontSize: 32, fontWeight: 'normal' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Add Text</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="text-content">Text Content</Label>
            <Input
              id="text-content"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter text..."
            />
          </div>
          <Button onClick={handleAddText} className="w-full">
            <Type className="h-4 w-4 mr-2" />
            Add Text Layer
          </Button>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-medium mb-3">Quick Presets</h3>
        <div className="space-y-2">
          {presetTexts.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setTextContent(preset.label);
                setTimeout(() => handleAddText(), 100);
              }}
            >
              <span style={{ fontSize: preset.fontSize / 4, fontWeight: preset.fontWeight }}>
                {preset.label}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
