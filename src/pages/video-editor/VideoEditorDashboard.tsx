import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Plus, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEditorAccess } from '@/hooks/video-editor/useEditorAccess';
import { useVideoEditorProjects } from '@/hooks/video-editor/useVideoEditorProjects';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateProjectDialog } from '@/components/video-editor/dialogs/CreateProjectDialog';

const VideoEditorDashboard = () => {
  const navigate = useNavigate();
  const { hasAccess, isLoading: accessLoading, logAccess } = useEditorAccess();
  const { projects, isLoading: projectsLoading } = useVideoEditorProjects();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Check access and redirect if not authorized
  useEffect(() => {
    if (!accessLoading && !hasAccess) {
      navigate('/anunciante/dashboard');
    }
  }, [hasAccess, accessLoading, navigate]);

  // Log access on mount
  useEffect(() => {
    if (hasAccess) {
      logAccess({ eventType: 'access' });
    }
  }, [hasAccess]);

  if (accessLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  const recentProjects = projects.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-3">
              <Film className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Editor de Vídeos</h1>
              <Badge variant="secondary" className="text-xs">Beta</Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              Crie vídeos incríveis de até 10 segundos
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setCreateDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            Novo Projeto
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
                <Film className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Edição</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'draft' || p.status === 'editing').length}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Projects */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Projetos Recentes</h2>
          
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Film className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum projeto ainda</h3>
                <p className="text-muted-foreground mb-6">
                  Comece criando seu primeiro vídeo
                </p>
                <Button onClick={() => navigate('/anunciante/editor-video/novo')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/anunciante/editor-video/${project.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <Badge
                          variant={
                            project.status === 'completed'
                              ? 'default'
                              : project.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {project.status === 'completed' && 'Concluído'}
                          {project.status === 'draft' && 'Rascunho'}
                          {project.status === 'editing' && 'Editando'}
                          {project.status === 'rendering' && 'Renderizando'}
                          {project.status === 'failed' && 'Erro'}
                        </Badge>
                      </div>
                      {project.description && (
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {new Date(project.updated_at).toLocaleDateString('pt-BR')}
                        </span>
                        {project.duration_seconds && (
                          <span>{project.duration_seconds}s</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
};

export default VideoEditorDashboard;
