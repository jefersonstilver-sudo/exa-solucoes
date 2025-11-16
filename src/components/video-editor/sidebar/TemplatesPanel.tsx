import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Film, 
  Instagram, 
  Music, 
  Briefcase, 
  GraduationCap, 
  Megaphone,
  Loader2,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVideoEditorTemplates } from '@/hooks/video-editor/useVideoEditorTemplates';
import { useVideoEditorProjects } from '@/hooks/video-editor/useVideoEditorProjects';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const categoryIcons = {
  social_media: Instagram,
  youtube: Film,
  tiktok: Music,
  business: Briefcase,
  educational: GraduationCap,
  promotional: Megaphone,
};

const categoryLabels = {
  social_media: 'Redes Sociais',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  business: 'Negócios',
  educational: 'Educacional',
  promotional: 'Promocional',
};

export const TemplatesPanel = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { templates, isLoading } = useVideoEditorTemplates(
    selectedCategory === 'all' ? undefined : { category: selectedCategory }
  );
  const { createProject, isCreating } = useVideoEditorProjects();

  const handleUseTemplate = (template: any) => {
    createProject(
      {
        title: `${template.title} - Cópia`,
        description: template.description || '',
        project_data: template.project_data,
      },
      {
        onSuccess: (newProject) => {
          navigate(`/anunciante/editor-video/${newProject.id}`);
        },
      }
    );
  };

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Templates</h3>
        <p className="text-sm text-muted-foreground">
          Comece rápido com templates prontos
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" className="text-xs">
            Todos
          </TabsTrigger>
          {categories.map((cat) => {
            const Icon = categoryIcons[cat as keyof typeof categoryIcons];
            return (
              <TabsTrigger key={cat} value={cat} className="text-xs gap-1">
                <Icon className="h-3 w-3" />
                {categoryLabels[cat as keyof typeof categoryLabels]}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Film className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Nenhum template disponível nesta categoria
            </p>
          </div>
        ) : (
          templates.map((template, index) => {
            const Icon = categoryIcons[template.category as keyof typeof categoryIcons];
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:border-primary transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-base">{template.title}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {template.aspect_ratio}
                      </Badge>
                      <span>•</span>
                      <span>{template.duration}s</span>
                      <span>•</span>
                      <span>{template.usage_count} usos</span>
                    </div>

                    <div className="h-32 bg-muted/30 rounded-md flex items-center justify-center border border-border/50">
                      <div className="text-center">
                        <Play className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">Preview do template</p>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleUseTemplate(template)}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Usar Template'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
