import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Eye, Download, Filter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIDebugHistoryProps {
  open: boolean;
  onClose: () => void;
}

interface AnalysisRecord {
  id: string;
  page_path: string;
  page_url: string;
  error_count: number;
  error_severity: string;
  tokens_used: number;
  analysis_duration_ms: number;
  created_at: string;
  ai_analysis: any;
}

export const AIDebugHistory: React.FC<AIDebugHistoryProps> = ({ open, onClose }) => {
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);

  useEffect(() => {
    if (open) {
      fetchAnalyses();
    }
  }, [open]);

  useEffect(() => {
    let filtered = analyses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.page_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.page_url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by severity
    if (severityFilter !== 'all') {
      filtered = filtered.filter(a => a.error_severity === severityFilter);
    }

    setFilteredAnalyses(filtered);
  }, [analyses, searchTerm, severityFilter]);

  const fetchAnalyses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_debug_analysis_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setAnalyses(data || []);
      setFilteredAnalyses(data || []);
    } catch (error: any) {
      console.error('Error fetching analyses:', error);
      toast({
        title: 'Erro ao carregar histórico',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variant = severity === 'critical' || severity === 'high' ? 'destructive' :
                   severity === 'medium' ? 'default' : 'secondary';
    return <Badge variant={variant}>{severity}</Badge>;
  };

  const handleViewAnalysis = (analysis: AnalysisRecord) => {
    setSelectedAnalysis(analysis);
  };

  const handleExportAnalysis = (analysis: AnalysisRecord) => {
    const blob = new Blob([JSON.stringify(analysis.ai_analysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-analysis-${analysis.page_path.replace(/\//g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: '✓ Análise Exportada',
      description: 'Download iniciado com sucesso.',
    });
  };

  return (
    <>
      <Dialog open={open && !selectedAnalysis} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Histórico de Análises de Debug com IA</DialogTitle>
            <DialogDescription>
              Todas as análises realizadas pelo sistema de debug inteligente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por caminho ou URL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Página</TableHead>
                    <TableHead>Erros</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredAnalyses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma análise encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAnalyses.map((analysis) => (
                      <TableRow key={analysis.id}>
                        <TableCell className="font-medium">
                          <div className="max-w-[200px] truncate" title={analysis.page_path}>
                            {analysis.page_path}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{analysis.error_count}</Badge>
                        </TableCell>
                        <TableCell>{getSeverityBadge(analysis.error_severity)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {analysis.tokens_used}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(analysis.created_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewAnalysis(analysis)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExportAnalysis(analysis)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{analyses.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tokens Usados</p>
                <p className="text-2xl font-bold">
                  {analyses.reduce((sum, a) => sum + (a.tokens_used || 0), 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Erros Detectados</p>
                <p className="text-2xl font-bold text-red-600">
                  {analyses.reduce((sum, a) => sum + (a.error_count || 0), 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">
                  {analyses.length > 0
                    ? Math.round(analyses.reduce((sum, a) => sum + (a.analysis_duration_ms || 0), 0) / analyses.length / 1000)
                    : 0}s
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Analysis Detail Dialog */}
      {selectedAnalysis && (
        <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Análise Detalhada</DialogTitle>
              <DialogDescription>{selectedAnalysis.page_path}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[500px]">
              <pre className="text-xs p-4 bg-slate-900 text-slate-100 rounded overflow-x-auto">
                <code>{JSON.stringify(selectedAnalysis.ai_analysis, null, 2)}</code>
              </pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
