import React, { useState, useEffect } from 'react';
import { useProdutosExa, ProdutoExa, ConfiguracaoExibicao } from '@/hooks/useProdutosExa';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Monitor, 
  Smartphone, 
  Save, 
  RefreshCw,
  Building2,
  Globe,
  Phone,
  Settings,
  TrendingUp,
  Clock,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ProdutosPage = () => {
  const {
    produtos,
    configuracao,
    produtoHorizontal,
    produtoVertical,
    isLoading,
    atualizarProduto,
    atualizarConfiguracao,
    sincronizarBuildings,
    isUpdatingProduto,
    isUpdatingConfig,
    isSincronizando
  } = useProdutosExa();

  // Estados locais para edição
  const [editHorizontal, setEditHorizontal] = useState<Partial<ProdutoExa>>({});
  const [editVertical, setEditVertical] = useState<Partial<ProdutoExa>>({});
  const [editConfig, setEditConfig] = useState<Partial<ConfiguracaoExibicao>>({});

  // Sincronizar estados locais com dados do banco
  useEffect(() => {
    if (produtoHorizontal) {
      setEditHorizontal({
        duracao_video_segundos: produtoHorizontal.duracao_video_segundos,
        max_clientes_por_painel: produtoHorizontal.max_clientes_por_painel,
        vendido_no_site: produtoHorizontal.vendido_no_site,
        contratacao_parcial: produtoHorizontal.contratacao_parcial,
        formato: produtoHorizontal.formato || 'horizontal',
        resolucao: produtoHorizontal.resolucao || '1440×1080',
        proporcao: (produtoHorizontal as any).proporcao || '4:3',
        tipo_exibicao: (produtoHorizontal as any).tipo_exibicao || 'Convencional',
        ativo: produtoHorizontal.ativo
      });
    }
  }, [produtoHorizontal]);

  useEffect(() => {
    if (produtoVertical) {
      setEditVertical({
        duracao_video_segundos: produtoVertical.duracao_video_segundos,
        max_clientes_por_painel: produtoVertical.max_clientes_por_painel,
        vendido_no_site: produtoVertical.vendido_no_site,
        contratacao_parcial: produtoVertical.contratacao_parcial,
        vendedor_responsavel: produtoVertical.vendedor_responsavel,
        telefone_vendedor: produtoVertical.telefone_vendedor,
        formato: produtoVertical.formato || 'vertical',
        resolucao: produtoVertical.resolucao || '1080×1920',
        proporcao: (produtoVertical as any).proporcao || '9:16',
        tipo_exibicao: (produtoVertical as any).tipo_exibicao || 'Tela Cheia',
        ativo: produtoVertical.ativo
      });
    }
  }, [produtoVertical]);

  useEffect(() => {
    if (configuracao) {
      setEditConfig({
        horas_operacao_dia: configuracao.horas_operacao_dia,
        dias_mes: configuracao.dias_mes
      });
    }
  }, [configuracao]);

  // Cálculos em tempo real
  const horasOperacao = editConfig.horas_operacao_dia || 21;
  const diasMes = editConfig.dias_mes || 30;
  const segundosDia = horasOperacao * 3600;

  const tempoHorizontal = (editHorizontal.duracao_video_segundos || 0) * (editHorizontal.max_clientes_por_painel || 0);
  const tempoVertical = (editVertical.duracao_video_segundos || 0) * (editVertical.max_clientes_por_painel || 0);
  const tempoCicloTotal = tempoHorizontal + tempoVertical;
  const ciclosDia = tempoCicloTotal > 0 ? Math.floor(segundosDia / tempoCicloTotal) : 0;
  const exibicoesMes = ciclosDia * diasMes;

  const handleSalvarHorizontal = () => {
    if (produtoHorizontal) {
      atualizarProduto({ id: produtoHorizontal.id, dados: editHorizontal });
    }
  };

  const handleSalvarVertical = () => {
    if (produtoVertical) {
      atualizarProduto({ id: produtoVertical.id, dados: editVertical });
    }
  };

  const handleSalvarConfig = () => {
    atualizarConfiguracao(editConfig);
  };

  const handleSalvarTudo = () => {
    handleSalvarHorizontal();
    handleSalvarVertical();
    handleSalvarConfig();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-slate-100">
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Header Compacto */}
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold text-foreground">Produtos EXA</h1>
          <p className="text-xs text-muted-foreground">
            Configure os parâmetros de exibição do sistema
          </p>
        </div>

        {/* Cards de Produtos */}
        <div className="grid md:grid-cols-2 gap-3">
          {/* Produto Horizontal */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl border-0">
            <CardContent className="p-4 space-y-4">
              {/* Header do Card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50">
                    <Monitor className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Horizontal Tradicional</span>
                </div>
                <Switch
                  checked={editHorizontal.ativo}
                  onCheckedChange={(v) => setEditHorizontal(prev => ({ ...prev, ativo: v }))}
                />
              </div>

              {/* Especificações Técnicas */}
              <div className="space-y-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Especificações</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Duração (s)</Label>
                    <Input
                      type="number"
                      value={editHorizontal.duracao_video_segundos || ''}
                      onChange={(e) => setEditHorizontal(prev => ({ ...prev, duracao_video_segundos: parseInt(e.target.value) || 0 }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Máx. Clientes</Label>
                    <Input
                      type="number"
                      value={editHorizontal.max_clientes_por_painel || ''}
                      onChange={(e) => setEditHorizontal(prev => ({ ...prev, max_clientes_por_painel: parseInt(e.target.value) || 0 }))}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Formato</Label>
                    <Select 
                      value={editHorizontal.formato || 'horizontal'}
                      onValueChange={(v) => setEditHorizontal(prev => ({ ...prev, formato: v }))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                        <SelectItem value="vertical">Vertical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Resolução</Label>
                    <Input
                      value={editHorizontal.resolucao || ''}
                      onChange={(e) => setEditHorizontal(prev => ({ ...prev, resolucao: e.target.value }))}
                      className="h-8 text-sm"
                      placeholder="1440×1080"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Proporção</Label>
                    <Select 
                      value={(editHorizontal as any).proporcao || '4:3'}
                      onValueChange={(v) => setEditHorizontal(prev => ({ ...prev, proporcao: v }))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4:3">4:3</SelectItem>
                        <SelectItem value="16:9">16:9</SelectItem>
                        <SelectItem value="9:16">9:16</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Tipo Exibição</Label>
                    <Select 
                      value={(editHorizontal as any).tipo_exibicao || 'Convencional'}
                      onValueChange={(v) => setEditHorizontal(prev => ({ ...prev, tipo_exibicao: v }))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Convencional">Convencional</SelectItem>
                        <SelectItem value="Tela Cheia">Tela Cheia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Métricas Calculadas */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-medium text-blue-700 uppercase tracking-wide">Métricas</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600">Tempo no ciclo</span>
                  <span className="text-sm font-semibold text-blue-800">{tempoHorizontal}s</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-green-600">{ciclosDia.toLocaleString('pt-BR')}</p>
                    <p className="text-[9px] text-muted-foreground">exib/dia</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-green-600">{exibicoesMes.toLocaleString('pt-BR')}</p>
                    <p className="text-[9px] text-muted-foreground">exib/mês</p>
                  </div>
                </div>
              </div>

              {/* Configurações */}
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-foreground">Vendido no site</span>
                  </div>
                  <Switch
                    checked={editHorizontal.vendido_no_site}
                    onCheckedChange={(v) => setEditHorizontal(prev => ({ ...prev, vendido_no_site: v }))}
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-foreground">Contratação parcial</span>
                  </div>
                  <Switch
                    checked={editHorizontal.contratacao_parcial}
                    onCheckedChange={(v) => setEditHorizontal(prev => ({ ...prev, contratacao_parcial: v }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSalvarHorizontal} 
                disabled={isUpdatingProduto}
                className="w-full h-8 text-xs"
                size="sm"
              >
                <Save className="h-3 w-3 mr-1.5" />
                Salvar
              </Button>
            </CardContent>
          </Card>

          {/* Produto Vertical Premium */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl border-0">
            <CardContent className="p-4 space-y-4">
              {/* Header do Card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-50">
                    <Smartphone className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Vertical Premium</span>
                </div>
                <Switch
                  checked={editVertical.ativo}
                  onCheckedChange={(v) => setEditVertical(prev => ({ ...prev, ativo: v }))}
                />
              </div>

              {/* Especificações Técnicas */}
              <div className="space-y-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Especificações</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Duração (s)</Label>
                    <Input
                      type="number"
                      value={editVertical.duracao_video_segundos || ''}
                      onChange={(e) => setEditVertical(prev => ({ ...prev, duracao_video_segundos: parseInt(e.target.value) || 0 }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Máx. Clientes</Label>
                    <Input
                      type="number"
                      value={editVertical.max_clientes_por_painel || ''}
                      onChange={(e) => setEditVertical(prev => ({ ...prev, max_clientes_por_painel: parseInt(e.target.value) || 0 }))}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Formato</Label>
                    <Select 
                      value={editVertical.formato || 'vertical'}
                      onValueChange={(v) => setEditVertical(prev => ({ ...prev, formato: v }))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                        <SelectItem value="vertical">Vertical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Resolução</Label>
                    <Input
                      value={editVertical.resolucao || ''}
                      onChange={(e) => setEditVertical(prev => ({ ...prev, resolucao: e.target.value }))}
                      className="h-8 text-sm"
                      placeholder="1080×1920"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Proporção</Label>
                    <Select 
                      value={(editVertical as any).proporcao || '9:16'}
                      onValueChange={(v) => setEditVertical(prev => ({ ...prev, proporcao: v }))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4:3">4:3</SelectItem>
                        <SelectItem value="16:9">16:9</SelectItem>
                        <SelectItem value="9:16">9:16</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Tipo Exibição</Label>
                    <Select 
                      value={(editVertical as any).tipo_exibicao || 'Tela Cheia'}
                      onValueChange={(v) => setEditVertical(prev => ({ ...prev, tipo_exibicao: v }))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Convencional">Convencional</SelectItem>
                        <SelectItem value="Tela Cheia">Tela Cheia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Vendedor */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Vendedor</Label>
                    <Input
                      value={editVertical.vendedor_responsavel || ''}
                      onChange={(e) => setEditVertical(prev => ({ ...prev, vendedor_responsavel: e.target.value }))}
                      className="h-8 text-sm"
                      placeholder="Nome"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Telefone</Label>
                    <Input
                      value={editVertical.telefone_vendedor || ''}
                      onChange={(e) => setEditVertical(prev => ({ ...prev, telefone_vendedor: e.target.value }))}
                      className="h-8 text-sm"
                      placeholder="+55..."
                    />
                  </div>
                </div>
              </div>

              {/* Métricas Calculadas */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-medium text-purple-700 uppercase tracking-wide">Métricas</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-600">Tempo no ciclo</span>
                  <span className="text-sm font-semibold text-purple-800">{tempoVertical}s</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-green-600">{ciclosDia.toLocaleString('pt-BR')}</p>
                    <p className="text-[9px] text-muted-foreground">exib/dia</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-green-600">{exibicoesMes.toLocaleString('pt-BR')}</p>
                    <p className="text-[9px] text-muted-foreground">exib/mês</p>
                  </div>
                </div>
              </div>

              {/* Configurações */}
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-foreground">Vendido no site</span>
                  </div>
                  <Switch
                    checked={editVertical.vendido_no_site}
                    onCheckedChange={(v) => setEditVertical(prev => ({ ...prev, vendido_no_site: v }))}
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-foreground">Todos os prédios</span>
                  </div>
                  <Switch
                    checked={!editVertical.contratacao_parcial}
                    onCheckedChange={(v) => setEditVertical(prev => ({ ...prev, contratacao_parcial: !v }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSalvarVertical} 
                disabled={isUpdatingProduto}
                className="w-full h-8 text-xs"
                size="sm"
              >
                <Save className="h-3 w-3 mr-1.5" />
                Salvar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Configurações Globais */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl border-0">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gray-100">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">Configurações Globais</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Horas/dia</Label>
                <Input
                  type="number"
                  value={editConfig.horas_operacao_dia || ''}
                  onChange={(e) => setEditConfig(prev => ({ ...prev, horas_operacao_dia: parseInt(e.target.value) || 0 }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Dias/mês</Label>
                <Input
                  type="number"
                  value={editConfig.dias_mes || ''}
                  onChange={(e) => setEditConfig(prev => ({ ...prev, dias_mes: parseInt(e.target.value) || 0 }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Tempo total/dia</Label>
                <div className="h-8 px-3 flex items-center bg-muted/50 rounded-md">
                  <span className="text-sm font-medium">{segundosDia.toLocaleString('pt-BR')}s</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Ciclo completo</Label>
                <div className="h-8 px-3 flex items-center bg-muted/50 rounded-md">
                  <span className="text-sm font-medium">{tempoCicloTotal}s</span>
                </div>
              </div>
            </div>

            {/* Resumo Calculado */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl p-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Ciclos/dia</p>
                  <p className="text-base font-bold text-foreground">{ciclosDia.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Exib/dia</p>
                  <p className="text-base font-bold text-green-600">{ciclosDia.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Exib/mês</p>
                  <p className="text-base font-bold text-green-600">{exibicoesMes.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleSalvarTudo}
            disabled={isUpdatingProduto || isUpdatingConfig}
            className="flex-1 h-10"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Todas as Alterações
          </Button>
          <Button
            onClick={() => sincronizarBuildings()}
            disabled={isSincronizando}
            variant="outline"
            className="flex-1 h-10"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isSincronizando && "animate-spin")} />
            Sincronizar Prédios
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProdutosPage;
