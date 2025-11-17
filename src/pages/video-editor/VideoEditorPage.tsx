import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVideoEditorProjects } from '@/hooks/video-editor/useVideoEditorProjects';
import { useEditorState } from '@/hooks/video-editor/useEditorState';
import { VideoPlayer } from '@/components/video-editor/canvas/VideoPlayer';
import { Timeline } from '@/components/video-editor/timeline/Timeline';
import { VerticalNavBar } from '@/components/video-editor/navigation/VerticalNavBar';
import { ExpansionPanel } from '@/components/video-editor/navigation/ExpansionPanel';
import { PropertiesPanel } from '@/components/video-editor/properties/PropertiesPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Download, Undo, Redo } from 'lucide-react';
import { toast } from 'sonner';
import { ClientOnly } from '@/components/ui/client-only';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export default function VideoEditorPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getProject, updateProject } = useVideoEditorProjects();
  const { data: project, isLoading } = getProject(projectId || '');
  
  const {
    setCurrentProject,
    setLayers,
    layers,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorState();

  const [activePanel, setActivePanel] = useState<string | null>('media');

  const handlePanelChange = (panelId: string | null) => {
    setActivePanel(panelId);
  };

  // Load project data
  useEffect(() => {
    if (project) {
      setCurrentProject(project);
      if (project.project_data.timeline) {
        setLayers(project.project_data.timeline);
      }
    }
  }, [project, setCurrentProject, setLayers]);

  const handleSave = () => {
    if (!project) return;

    updateProject({
      projectId: project.id,
      updates: {
        project_data: {
          ...project.project_data,
          timeline: layers,
        },
      },
    }, {
      onSuccess: () => {
        toast.success('Project saved successfully');
      },
      onError: () => {
        toast.error('Failed to save project');
      }
    });
  };

  const handleExport = () => {
    toast.info('Export feature coming soon');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Button onClick={() => navigate('/anunciante/editor-video')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ClientOnly>
      <div className="h-screen flex flex-col bg-background">
        {/* Top Bar */}
        <div className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/anunciante/editor-video')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{project.title}</h1>
              <p className="text-xs text-muted-foreground">Video Editor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo()}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo()}
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Vertical Nav Bar */}
          <VerticalNavBar 
            activePanel={activePanel} 
            onPanelChange={handlePanelChange} 
          />
          
          {/* Expansion Panel + Canvas/Timeline + Properties */}
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Expansion Panel (resizable) */}
            {activePanel && (
              <>
                <ResizablePanel defaultSize={22} minSize={15} maxSize={35}>
                  <ExpansionPanel 
                    activePanel={activePanel} 
                    onClose={() => setActivePanel(null)} 
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}
            
            {/* Canvas + Timeline + Properties */}
            <ResizablePanel defaultSize={activePanel ? 55 : 78} minSize={40}>
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* Canvas + Timeline (resizable vertically) */}
                <ResizablePanel defaultSize={78} minSize={50}>
                  <ResizablePanelGroup direction="vertical" className="h-full">
                    {/* Video Player */}
                    <ResizablePanel defaultSize={65} minSize={30}>
                      <VideoPlayer />
                    </ResizablePanel>
                    
                    {/* Resizable Handle */}
                    <ResizableHandle withHandle />
                    
                    {/* Timeline */}
                    <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
                      <Timeline />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>
                
                {/* Resizable Handle */}
                <ResizableHandle withHandle />
                
                {/* Properties Panel */}
                <ResizablePanel defaultSize={22} minSize={15} maxSize={35}>
                  <PropertiesPanel />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </ClientOnly>
  );
}
