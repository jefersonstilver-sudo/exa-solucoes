import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Search,
  Filter,
  MoreVertical,
  Play,
  Edit,
  Trash2,
  Copy,
  Eye,
  Clock,
  User,
  Tag,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useProcesses, useDepartments } from '@/hooks/processos';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import ModernAdminLayout from '@/components/admin/layout/ModernAdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const statusConfig = {
  ativo: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  em_revisao: { label: 'Em Revisão', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  obsoleto: { label: 'Obsoleto', color: 'bg-gray-100 text-gray-500', icon: XCircle },
};

const DepartmentProcessesPage = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const { departments, getDepartmentById } = useDepartments();
  const { processes, loading, createProcess, deleteProcess } = useProcesses({ 
    departmentId 
  });
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isNewProcessOpen, setIsNewProcessOpen] = React.useState(false);
  const [newProcessName, setNewProcessName] = React.useState('');
  const [newProcessDescription, setNewProcessDescription] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  const department = departmentId ? getDepartmentById(departmentId) : null;

  const filteredProcesses = processes.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => {
    navigate(buildPath('processos'));
  };

  const handleProcessClick = (processId: string) => {
    navigate(buildPath(`processos/${departmentId}/${processId}`));
  };

  const handleCreateProcess = async () => {
    if (!newProcessName.trim() || !departmentId) return;

    setIsCreating(true);
    try {
      const result = await createProcess({
        department_id: departmentId,
        name: newProcessName.trim(),
        description: newProcessDescription.trim() || undefined
      });
      
      setIsNewProcessOpen(false);
      setNewProcessName('');
      setNewProcessDescription('');
      
      // Navigate to the new process editor
      if (result) {
        navigate(buildPath(`processos/${departmentId}/${(result as any).id}`));
      }
    } catch (err) {
      console.error('Error creating process:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProcess = async (processId: string, processName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o processo "${processName}"?`)) {
      try {
        await deleteProcess(processId);
      } catch (err) {
        console.error('Error deleting process:', err);
      }
    }
  };

  return (
    <ModernAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="p-4 md:p-6">
            <div className="flex flex-col gap-4">
              {/* Back + Title */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-9 w-9 rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div 
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: `${department?.color || '#6B7280'}15` }}
                >
                  <FileText 
                    className="h-5 w-5"
                    style={{ color: department?.color || '#6B7280' }}
                  />
                </div>
                <div className="flex-1">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {department?.name || 'Carregando...'}
                  </h1>
                  <p className="text-xs text-gray-500">
                    {filteredProcesses.length} processos encontrados
                  </p>
                </div>
                <Button
                  onClick={() => setIsNewProcessOpen(true)}
                  className="rounded-xl gap-2"
                  style={{ 
                    backgroundColor: department?.color || '#6B7280',
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Novo Processo</span>
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-white/60 border-gray-200 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : filteredProcesses.length === 0 ? (
            <div className="text-center py-16">
              <div 
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${department?.color || '#6B7280'}15` }}
              >
                <FileText 
                  className="h-8 w-8"
                  style={{ color: department?.color || '#6B7280' }}
                />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum processo cadastrado
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Crie o primeiro processo deste departamento para começar a documentar suas operações.
              </p>
              <Button
                onClick={() => setIsNewProcessOpen(true)}
                className="rounded-xl gap-2"
                style={{ backgroundColor: department?.color || '#6B7280' }}
              >
                <Plus className="h-4 w-4" />
                Criar Primeiro Processo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProcesses.map((process, index) => {
                const status = statusConfig[process.status as keyof typeof statusConfig] || statusConfig.ativo;
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={process.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group"
                  >
                    <div 
                      className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 p-4 cursor-pointer"
                      onClick={() => handleProcessClick(process.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span 
                              className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                              style={{ 
                                backgroundColor: `${department?.color || '#6B7280'}15`,
                                color: department?.color || '#6B7280'
                              }}
                            >
                              {process.code}
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={`${status.color} gap-1 text-[10px]`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-gray-900 truncate">
                            {process.name}
                          </h3>
                          {process.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {process.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              v{process.current_version}
                            </span>
                            {process.tags && process.tags.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {process.tags.length} tags
                              </span>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleProcessClick(process.id); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Fluxo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Play className="h-4 w-4 mr-2" />
                              Executar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleDeleteProcess(process.id, process.name);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* New Process Dialog */}
        <Dialog open={isNewProcessOpen} onOpenChange={setIsNewProcessOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Processo</DialogTitle>
              <DialogDescription>
                Crie um novo processo para o departamento {department?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Processo</Label>
                <Input
                  id="name"
                  placeholder="Ex: Prospecção Ativa por WhatsApp"
                  value={newProcessName}
                  onChange={(e) => setNewProcessName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva brevemente o objetivo deste processo..."
                  value={newProcessDescription}
                  onChange={(e) => setNewProcessDescription(e.target.value)}
                  className="rounded-xl min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewProcessOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateProcess}
                disabled={!newProcessName.trim() || isCreating}
                className="rounded-xl"
                style={{ backgroundColor: department?.color || '#6B7280' }}
              >
                {isCreating ? 'Criando...' : 'Criar Processo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModernAdminLayout>
  );
};

export default DepartmentProcessesPage;
