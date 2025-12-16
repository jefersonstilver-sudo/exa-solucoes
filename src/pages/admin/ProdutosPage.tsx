import React, { useState, useEffect } from 'react';
import { useProdutosExa, ProdutoExa, ConfiguracaoExibicao } from '@/hooks/useProdutosExa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Monitor, 
  Smartphone, 
  Clock, 
  RotateCw, 
  Save, 
  RefreshCw,
  Building2,
  Users,
  Video,
  Globe,
  Phone,
  Settings,
  Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ProdutosPage = () => {
  const {
    produtos,
    configuracao,
    calculos,
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
        max_videos_por_pedido: produtoHorizontal.max_videos_por_pedido,
        vendido_no_site: produtoHorizontal.vendido_no_site,
        contratacao_parcial: produtoHorizontal.contratacao_parcial,
        ativo: produtoHorizontal.ativo
      });
    }
  }, [produtoHorizontal]);

  useEffect(() => {
    if (produtoVertical) {
      setEditVertical({
        duracao_video_segundos: produtoVertical.duracao_video_segundos,
        max_clientes_por_painel: produtoVertical.max_clientes_por_painel,
        max_videos_por_pedido: produtoVertical.max_videos_por_pedido,
        vendido_no_site: produtoVertical.vendido_no_site,
        contratacao_parcial: produtoVertical.contratacao_parcial,
        vendedor_responsavel: produtoVertical.vendedor_responsavel,
        telefone_vendedor: produtoVertical.telefone_vendedor,
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

  // Calcular preview em tempo real
  const previewCalcHorizontal = editHorizontal.duracao_video_segundos && editHorizontal.max_clientes_por_painel
    ? editHorizontal.duracao_video_segundos * editHorizontal.max_clientes_por_painel
    : 0;
  
  const previewCalcVertical = editVertical.duracao_video_segundos && editVertical.max_clientes_por_painel
    ? editVertical.duracao_video_segundos * editVertical.max_clientes_por_painel
    : 0;

  const previewTempoCiclo = previewCalcHorizontal + previewCalcVertical;
  const previewSegundosDia = (editConfig.horas_operacao_dia || 21) * 3600;
  const previewCiclosDia = previewTempoCiclo > 0 ? Math.floor(previewSegundosDia / previewTempoCiclo) : 0;
  const previewExibicoesMes = previewCiclosDia * (editConfig.dias_mes || 30);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">Configuração de Produtos</h1>
        <p className="text-sm text-muted-foreground">
          Configure os produtos e o sistema calculará automaticamente as exibições
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Ciclo</span>
            </div>
            <p className="text-xl font-bold text-foreground">{previewTempoCiclo}s</p>
            <p className="text-[10px] text-muted-foreground">segundos por ciclo</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <RotateCw className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Ciclos/Dia</span>
            </div>
            <p className="text-xl font-bold text-foreground">{previewCiclosDia.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-muted-foreground">repetições diárias</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Video className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Exib/Dia</span>
            </div>
            <p className="text-xl font-bold text-foreground">{previewCiclosDia.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-muted-foreground">por cliente</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Exib/Mês</span>
            </div>
            <p className="text-xl font-bold text-green-600">{previewExibicoesMes.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-muted-foreground">por cliente/tela</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Produtos */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Produto Horizontal */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Horizontal Tradicional</CardTitle>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Globe className="h-3 w-3 mr-1" />
                Site Público
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Produto Ativo</Label>
              <Switch
                checked={editHorizontal.ativo}
                onCheckedChange={(v) => setEditHorizontal(prev => ({ ...prev, ativo: v }))}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Duração (segundos)</Label>
                <Input
                  type="number"
                  value={editHorizontal.duracao_video_segundos || ''}
                  onChange={(e) => setEditHorizontal(prev => ({ ...prev, duracao_video_segundos: parseInt(e.target.value) || 0 }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Máx. Clientes/Painel</Label>
                <Input
                  type="number"
                  value={editHorizontal.max_clientes_por_painel || ''}
                  onChange={(e) => setEditHorizontal(prev => ({ ...prev, max_clientes_por_painel: parseInt(e.target.value) || 0 }))}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Máx. Vídeos por Pedido</Label>
              <Input
                type="number"
                value={editHorizontal.max_videos_por_pedido || ''}
                onChange={(e) => setEditHorizontal(prev => ({ ...prev, max_videos_por_pedido: parseInt(e.target.value) || 0 }))}
                className="h-9"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Vendido no Site</Label>
                </div>
                <Switch
                  checked={editHorizontal.vendido_no_site}
                  onCheckedChange={(v) => setEditHorizontal(prev => ({ ...prev, vendido_no_site: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Contratação Parcial</Label>
                </div>
                <Switch
                  checked={editHorizontal.contratacao_parcial}
                  onCheckedChange={(v) => setEditHorizontal(prev => ({ ...prev, contratacao_parcial: v }))}
                />
              </div>
            </div>

            {/* Preview do cálculo */}
            <div className="bg-blue-50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-blue-800">Tempo no ciclo</p>
              <p className="text-lg font-bold text-blue-900">
                {previewCalcHorizontal}s
                <span className="text-xs font-normal ml-2">
                  ({editHorizontal.duracao_video_segundos}s × {editHorizontal.max_clientes_por_painel} clientes)
                </span>
              </p>
            </div>

            <Button 
              onClick={handleSalvarHorizontal} 
              disabled={isUpdatingProduto}
              className="w-full"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Horizontal
            </Button>
          </CardContent>
        </Card>

        {/* Produto Vertical Premium */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-base">Vertical Premium</CardTitle>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Phone className="h-3 w-3 mr-1" />
                Vendedores
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Produto Ativo</Label>
              <Switch
                checked={editVertical.ativo}
                onCheckedChange={(v) => setEditVertical(prev => ({ ...prev, ativo: v }))}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Duração (segundos)</Label>
                <Input
                  type="number"
                  value={editVertical.duracao_video_segundos || ''}
                  onChange={(e) => setEditVertical(prev => ({ ...prev, duracao_video_segundos: parseInt(e.target.value) || 0 }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Máx. Clientes/Painel</Label>
                <Input
                  type="number"
                  value={editVertical.max_clientes_por_painel || ''}
                  onChange={(e) => setEditVertical(prev => ({ ...prev, max_clientes_por_painel: parseInt(e.target.value) || 0 }))}
                  className="h-9"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Vendedor Responsável</Label>
                <Input
                  value={editVertical.vendedor_responsavel || ''}
                  onChange={(e) => setEditVertical(prev => ({ ...prev, vendedor_responsavel: e.target.value }))}
                  className="h-9"
                  placeholder="Nome do vendedor"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Telefone do Vendedor</Label>
                <Input
                  value={editVertical.telefone_vendedor || ''}
                  onChange={(e) => setEditVertical(prev => ({ ...prev, telefone_vendedor: e.target.value }))}
                  className="h-9"
                  placeholder="+55 45 99999-9999"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Vendido no Site</Label>
                </div>
                <Switch
                  checked={editVertical.vendido_no_site}
                  onCheckedChange={(v) => setEditVertical(prev => ({ ...prev, vendido_no_site: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Contratação Parcial</Label>
                </div>
                <Switch
                  checked={editVertical.contratacao_parcial}
                  onCheckedChange={(v) => setEditVertical(prev => ({ ...prev, contratacao_parcial: v }))}
                />
              </div>
            </div>

            {/* Preview do cálculo */}
            <div className="bg-purple-50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-purple-800">Tempo no ciclo</p>
              <p className="text-lg font-bold text-purple-900">
                {previewCalcVertical}s
                <span className="text-xs font-normal ml-2">
                  ({editVertical.duracao_video_segundos}s × {editVertical.max_clientes_por_painel} clientes)
                </span>
              </p>
            </div>

            <Button 
              onClick={handleSalvarVertical} 
              disabled={isUpdatingProduto}
              className="w-full"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Vertical Premium
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Configurações Globais */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Configurações Globais</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Horas de Operação/Dia</Label>
              <Input
                type="number"
                value={editConfig.horas_operacao_dia || ''}
                onChange={(e) => setEditConfig(prev => ({ ...prev, horas_operacao_dia: parseInt(e.target.value) || 0 }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Dias por Mês</Label>
              <Input
                type="number"
                value={editConfig.dias_mes || ''}
                onChange={(e) => setEditConfig(prev => ({ ...prev, dias_mes: parseInt(e.target.value) || 0 }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Segundos/Dia</Label>
              <div className="h-9 flex items-center px-3 bg-muted rounded-md text-sm font-mono">
                {previewSegundosDia.toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Exibições/Mês (por tela)</Label>
              <div className="h-9 flex items-center px-3 bg-green-100 rounded-md text-sm font-mono font-bold text-green-700">
                {previewExibicoesMes.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSalvarConfig} 
              disabled={isUpdatingConfig}
              variant="outline"
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
            <Button 
              onClick={() => sincronizarBuildings()} 
              disabled={isSincronizando}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSincronizando ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Building2 className="h-4 w-4 mr-2" />
              )}
              Sincronizar Todos os Prédios
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Ao sincronizar, todos os prédios ativos terão seu campo "visualizacoes_mes" recalculado automaticamente
          </p>
        </CardContent>
      </Card>

      {/* Fórmula Explicativa */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-dashed">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium mb-2 text-foreground">Fórmula de Cálculo</h3>
          <div className="text-xs text-muted-foreground space-y-1 font-mono">
            <p>1. Tempo do Ciclo = Σ(duração × max_clientes) de cada produto</p>
            <p>2. Segundos/Dia = Horas × 3600 = {editConfig.horas_operacao_dia || 21} × 3600 = {previewSegundosDia.toLocaleString('pt-BR')}</p>
            <p>3. Ciclos/Dia = Segundos/Dia ÷ Tempo do Ciclo = {previewSegundosDia.toLocaleString('pt-BR')} ÷ {previewTempoCiclo} = {previewCiclosDia.toLocaleString('pt-BR')}</p>
            <p>4. Exibições/Mês = Ciclos/Dia × Dias = {previewCiclosDia.toLocaleString('pt-BR')} × {editConfig.dias_mes || 30} = <strong className="text-green-600">{previewExibicoesMes.toLocaleString('pt-BR')}</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProdutosPage;
