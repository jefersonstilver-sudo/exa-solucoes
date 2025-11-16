import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Grid3x3, List, Film, Image as ImageIcon, Music, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVideoEditorAssets } from '@/hooks/video-editor/useVideoEditorAssets';
import { AssetType } from '@/types/videoEditor';
import AssetCard from './AssetCard';
import { CompactUploadButton } from '../upload/CompactUploadButton';
import { Skeleton } from '@/components/ui/skeleton';

const AssetLibrary = () => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | AssetType>('all');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const filters = {
    search: search || undefined,
    type: activeTab === 'all' ? undefined : activeTab
  };

  const { assets, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useVideoEditorAssets(filters);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 space-y-3 border-b">
        {/* Upload Button */}
        <div className="flex gap-2">
          <CompactUploadButton
            acceptedTypes={activeTab === 'all' ? ['video', 'image', 'audio'] : [activeTab]}
            onUploadComplete={() => refetch()}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Search and View Toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar arquivos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 bg-muted rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              Todos
            </TabsTrigger>
            <TabsTrigger value="video" className="text-xs">
              <Film className="h-3 w-3 mr-1" />
              Vídeos
            </TabsTrigger>
            <TabsTrigger value="image" className="text-xs">
              <ImageIcon className="h-3 w-3 mr-1" />
              Imagens
            </TabsTrigger>
            <TabsTrigger value="audio" className="text-xs">
              <Music className="h-3 w-3 mr-1" />
              Áudios
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Assets Grid/List */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="aspect-video rounded-xl" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              {activeTab === 'video' && <Film className="h-8 w-8 text-muted-foreground" />}
              {activeTab === 'image' && <ImageIcon className="h-8 w-8 text-muted-foreground" />}
              {activeTab === 'audio' && <Music className="h-8 w-8 text-muted-foreground" />}
              {activeTab === 'all' && <Film className="h-8 w-8 text-muted-foreground" />}
            </div>
            <p className="text-sm font-medium mb-1">Nenhum arquivo encontrado</p>
            <p className="text-xs text-muted-foreground">
              Faça upload de {activeTab === 'all' ? 'arquivos' : activeTab === 'video' ? 'vídeos' : activeTab === 'image' ? 'imagens' : 'áudios'} para começar
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              {assets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <AssetCard asset={asset} viewMode={viewMode} />
                </motion.div>
              ))}
            </div>

            {/* Load More Trigger */}
            <div ref={loadMoreRef} className="h-10 mt-4">
              {isFetchingNextPage && (
                <div className="flex justify-center">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssetLibrary;
