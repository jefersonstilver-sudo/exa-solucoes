import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Film, Image, Type, Sparkles } from 'lucide-react';
import AssetLibrary from '../library/AssetLibrary';
import { TextToolsPanel } from './TextToolsPanel';
import { TemplatesPanel } from './TemplatesPanel';

export const EditorSidebar = () => {
  const [activeTab, setActiveTab] = useState('media');

  return (
    <div className="w-80 border-r bg-background flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-4 rounded-none border-b h-12">
          <TabsTrigger value="media" className="gap-2">
            <Film className="h-4 w-4" />
            <span className="hidden sm:inline">Media</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-2">
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Text</span>
          </TabsTrigger>
          <TabsTrigger value="elements" className="gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Shapes</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="media" className="h-full m-0 p-0">
            <AssetLibrary />
          </TabsContent>

          <TabsContent value="templates" className="h-full m-0 p-0">
            <TemplatesPanel />
          </TabsContent>

          <TabsContent value="text" className="h-full m-0 p-0">
            <TextToolsPanel />
          </TabsContent>

          <TabsContent value="elements" className="h-full m-0 p-4">
            <div className="text-center text-muted-foreground text-sm">
              Shapes e elementos avançados em breve
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
