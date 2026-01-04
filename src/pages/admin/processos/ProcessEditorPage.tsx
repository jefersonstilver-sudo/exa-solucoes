import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Eye,
  Undo,
  Redo,
  Plus,
  Circle,
  Square,
  Diamond,
  Hexagon,
  StopCircle,
  GitBranch,
  Layers,
  Settings,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { useProcesses, useDepartments } from '@/hooks/processos';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import ModernAdminLayout from '@/components/admin/layout/ModernAdminLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Custom node components
import StartNode from '@/components/processos/nodes/StartNode';
import EndNode from '@/components/processos/nodes/EndNode';
import StepNode from '@/components/processos/nodes/StepNode';
import DecisionNode from '@/components/processos/nodes/DecisionNode';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  step: StepNode,
  decision: DecisionNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const ProcessEditorPage = () => {
  const { departmentId, processId } = useParams<{ departmentId: string; processId: string }>();
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const { getDepartmentById } = useDepartments();
  const { getProcessById } = useProcesses();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [process, setProcess] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const department = departmentId ? getDepartmentById(departmentId) : null;

  // Load process data
  useEffect(() => {
    const loadProcess = async () => {
      if (!processId) return;
      
      setLoading(true);
      try {
        const processData = await getProcessById(processId);
        if (processData) {
          setProcess(processData);
          
          // Load version data
          const { data: versionData } = await supabase
            .from('process_versions')
            .select('*')
            .eq('process_id', processId)
            .eq('version', processData.current_version)
            .single();

          if (versionData) {
            const nodesData = (versionData as any).nodes_data || [];
            const edgesData = (versionData as any).edges_data || [];
            
            // Convert to ReactFlow format
            const rfNodes = nodesData.map((n: any) => ({
              id: n.node_id,
              type: n.node_type,
              position: n.position,
              data: { 
                label: n.title,
                description: n.description,
                ...n
              }
            }));
            
            const rfEdges = edgesData.map((e: any) => ({
              id: e.edge_id,
              source: e.source_node_id,
              target: e.target_node_id,
              label: e.label,
              animated: e.animated,
              style: e.style
            }));

            setNodes(rfNodes);
            setEdges(rfEdges);
          }
        }
      } catch (err) {
        console.error('Error loading process:', err);
        toast.error('Erro ao carregar processo');
      } finally {
        setLoading(false);
      }
    };

    loadProcess();
  }, [processId]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true,
      style: { strokeWidth: 2 }
    }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleBack = () => {
    navigate(buildPath(`processos/${departmentId}`));
  };

  const addNode = (type: 'start' | 'end' | 'step' | 'decision') => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 250, y: nodes.length * 100 + 100 },
      data: { 
        label: type === 'start' ? 'Início' : 
               type === 'end' ? 'Fim' :
               type === 'decision' ? 'Decisão' : 'Nova Etapa',
        description: ''
      }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = async () => {
    if (!processId || !process) return;
    
    setSaving(true);
    try {
      // Convert nodes to storage format
      const nodesData = nodes.map(n => ({
        node_id: n.id,
        node_type: n.type,
        position: n.position,
        title: n.data.label,
        description: n.data.description || '',
        ...n.data
      }));

      const edgesData = edges.map(e => ({
        edge_id: e.id,
        source_node_id: e.source,
        target_node_id: e.target,
        label: e.label || null,
        animated: e.animated || false,
        style: e.style || {}
      }));

      // Update version
      await supabase
        .from('process_versions')
        .update({
          nodes_data: nodesData,
          edges_data: edgesData
        } as any)
        .eq('process_id', processId)
        .eq('version', process.current_version);

      toast.success('Processo salvo com sucesso');
    } catch (err) {
      console.error('Error saving process:', err);
      toast.error('Erro ao salvar processo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ModernAdminLayout>
        <div className="h-screen flex items-center justify-center">
          <Skeleton className="w-64 h-8" />
        </div>
      </ModernAdminLayout>
    );
  }

  return (
    <ModernAdminLayout>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span 
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                  style={{ 
                    backgroundColor: `${department?.color || '#6B7280'}15`,
                    color: department?.color || '#6B7280'
                  }}
                >
                  {process?.code}
                </span>
                <h1 className="text-sm font-semibold text-gray-900">
                  {process?.name}
                </h1>
              </div>
              <p className="text-xs text-gray-500">
                Versão {process?.current_version} • Editando fluxograma
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Executar</span>
            </Button>
            <Button 
              size="sm" 
              className="rounded-xl gap-2"
              onClick={handleSave}
              disabled={saving}
              style={{ backgroundColor: department?.color || '#6B7280' }}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              animated: true,
              style: { strokeWidth: 2, stroke: '#94a3b8' }
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            <MiniMap 
              style={{ 
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px'
              }}
              nodeColor={(node) => {
                switch (node.type) {
                  case 'start': return '#10B981';
                  case 'end': return '#EF4444';
                  case 'decision': return '#F59E0B';
                  default: return department?.color || '#6B7280';
                }
              }}
            />
            <Controls 
              style={{ 
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0'
              }}
            />

            {/* Toolbar Panel */}
            <Panel position="top-left" className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-emerald-50"
                onClick={() => addNode('start')}
                title="Adicionar Início"
              >
                <Circle className="h-5 w-5 text-emerald-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-blue-50"
                onClick={() => addNode('step')}
                title="Adicionar Etapa"
              >
                <Square className="h-5 w-5 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-amber-50"
                onClick={() => addNode('decision')}
                title="Adicionar Decisão"
              >
                <Diamond className="h-5 w-5 text-amber-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-red-50"
                onClick={() => addNode('end')}
                title="Adicionar Fim"
              >
                <StopCircle className="h-5 w-5 text-red-600" />
              </Button>
            </Panel>

            {/* Info Panel */}
            {selectedNode && (
              <Panel position="top-right" className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 w-72">
                <h3 className="font-medium text-gray-900 mb-2">Propriedades do Nó</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-gray-500">Tipo</label>
                    <p className="font-medium capitalize">{selectedNode.type}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Título</label>
                    <p className="font-medium">{String(selectedNode.data.label || '')}</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full rounded-xl"
                    variant="outline"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Editar Conteúdo
                  </Button>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>
    </ModernAdminLayout>
  );
};

export default ProcessEditorPage;
