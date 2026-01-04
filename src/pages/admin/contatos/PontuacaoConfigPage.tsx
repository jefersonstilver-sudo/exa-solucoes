import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useScoringRules } from '@/hooks/contatos';
import { CATEGORIAS_CONFIG } from '@/types/contatos';
import { toast } from 'sonner';

const PontuacaoConfigPage = () => {
  const navigate = useNavigate();
  const { rules, configs, loading, updateRule, updateConfig } = useScoringRules();
  const [localRules, setLocalRules] = useState<typeof rules>([]);
  const [localConfigs, setLocalConfigs] = useState<typeof configs>([]);

  React.useEffect(() => {
    setLocalRules(rules);
    setLocalConfigs(configs);
  }, [rules, configs]);

  const handleRuleChange = (id: string, field: 'pontos' | 'ativo', value: number | boolean) => {
    setLocalRules(prev => prev.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const handleConfigChange = (id: string, field: 'pontuacao_minima' | 'pontuacao_ativa', value: number | boolean) => {
    setLocalConfigs(prev => prev.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleSave = async () => {
    try {
      // Save rules
      for (const rule of localRules) {
        const original = rules.find(r => r.id === rule.id);
        if (original && (original.pontos !== rule.pontos || original.ativo !== rule.ativo)) {
          await updateRule(rule.id, { pontos: rule.pontos, ativo: rule.ativo });
        }
      }

      // Save configs
      for (const config of localConfigs) {
        const original = configs.find(c => c.id === config.id);
        if (original && (original.pontuacao_minima !== config.pontuacao_minima || original.pontuacao_ativa !== config.pontuacao_ativa)) {
          await updateConfig(config.id, { 
            pontuacao_minima: config.pontuacao_minima, 
            pontuacao_ativa: config.pontuacao_ativa 
          });
        }
      }

      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleReset = () => {
    setLocalRules(rules);
    setLocalConfigs(configs);
    toast.info('Alterações descartadas');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/super_admin/contatos')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-foreground uppercase tracking-wide">
            Configuração do Motor de Inteligência
          </h1>
          <p className="text-muted-foreground text-sm">
            Defina os pesos para cada campo e o limiar de desbloqueio para automação de contatos.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Redefinir
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Configuração
          </Button>
        </div>
      </div>

      {/* Section 1: Field Weights */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-muted text-sm flex items-center justify-center font-bold">1</span>
          Field Weights (Pesos dos Campos)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localRules.map((rule) => (
            <div 
              key={rule.id} 
              className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center mb-4">
                <Label className="font-semibold text-foreground">{rule.label}</Label>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  rule.ativo 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {rule.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Slider
                    value={[rule.pontos]}
                    onValueChange={([v]) => handleRuleChange(rule.id, 'pontos', v)}
                    max={100}
                    min={0}
                    step={5}
                    className="flex-1"
                    disabled={!rule.ativo}
                  />
                  <Input
                    type="number"
                    value={rule.pontos}
                    onChange={(e) => handleRuleChange(rule.id, 'pontos', parseInt(e.target.value) || 0)}
                    className="w-16 text-center"
                    disabled={!rule.ativo}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Ativar regra</span>
                  <Switch
                    checked={rule.ativo}
                    onCheckedChange={(v) => handleRuleChange(rule.id, 'ativo', v)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Category Thresholds */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-muted text-sm flex items-center justify-center font-bold">2</span>
          Limites por Categoria
        </h3>
        <div className="bg-card p-6 md:p-8 rounded-xl shadow-sm border border-border">
          <p className="text-sm text-muted-foreground mb-6">
            Contatos abaixo desta pontuação terão ações de WhatsApp e ligação bloqueadas.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {localConfigs.map((config) => {
              const catConfig = CATEGORIAS_CONFIG[config.categoria as keyof typeof CATEGORIAS_CONFIG];
              return (
                <div 
                  key={config.id}
                  className="p-4 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${catConfig?.bgColor || 'bg-gray-500'}`} />
                      <span className="font-medium text-foreground">{catConfig?.label || config.categoria}</span>
                    </div>
                    <Switch
                      checked={config.pontuacao_ativa}
                      onCheckedChange={(v) => handleConfigChange(config.id, 'pontuacao_ativa', v)}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[config.pontuacao_minima]}
                      onValueChange={([v]) => handleConfigChange(config.id, 'pontuacao_minima', v)}
                      max={100}
                      min={10}
                      step={5}
                      className="flex-1"
                      disabled={!config.pontuacao_ativa}
                    />
                    <div className="relative">
                      <Input
                        type="number"
                        value={config.pontuacao_minima}
                        onChange={(e) => handleConfigChange(config.id, 'pontuacao_minima', parseInt(e.target.value) || 0)}
                        className="w-20 pr-8 text-center"
                        disabled={!config.pontuacao_ativa}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Categorias sem pontuação:</strong> Síndico EXA, Parceiro EXA, Parceiro Lead, 
              Prestador Elevador, Eletricista, Provedor, Equipe EXA, Outros
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PontuacaoConfigPage;
