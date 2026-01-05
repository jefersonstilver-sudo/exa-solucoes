import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useScoringRules } from '@/hooks/contatos';
import { CATEGORIAS_CONFIG, CATEGORIAS_ORDER, CategoriaContato } from '@/types/contatos';
import { toast } from 'sonner';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import CategoriaProtocoloCard from '@/components/contatos/config/CategoriaProtocoloCard';

const PontuacaoConfigPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
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

  const handleCategoryToggle = (categoria: CategoriaContato, ativo: boolean) => {
    const config = localConfigs.find(c => c.categoria === categoria);
    if (config) {
      handleConfigChange(config.id, 'pontuacao_ativa', ativo);
    }
  };

  const isCategoryActive = (categoria: CategoriaContato): boolean => {
    const config = localConfigs.find(c => c.categoria === categoria);
    return config?.pontuacao_ativa ?? false;
  };

  const handleSave = async () => {
    try {
      for (const rule of localRules) {
        const original = rules.find(r => r.id === rule.id);
        if (original && (original.pontos !== rule.pontos || original.ativo !== rule.ativo)) {
          await updateRule(rule.id, { pontos: rule.pontos, ativo: rule.ativo });
        }
      }

      for (const config of localConfigs) {
        const original = configs.find(c => c.id === config.id);
        if (original && (original.pontuacao_minima !== config.pontuacao_minima || original.pontuacao_ativa !== config.pontuacao_ativa)) {
          await updateConfig(config.id, { 
            pontuacao_minima: config.pontuacao_minima, 
            pontuacao_ativa: config.pontuacao_ativa 
          });
        }
      }

      toast.success('Configurações salvas');
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const handleReset = () => {
    setLocalRules(rules);
    setLocalConfigs(configs);
    toast.info('Alterações descartadas');
  };

  // Categorias ativas com pontuação (para seção de limites)
  const activeCategories = localConfigs.filter(c => c.pontuacao_ativa);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-background dark:to-muted/20 p-4 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-background dark:to-muted/20 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(buildPath('contatos'))}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-lg font-bold text-foreground uppercase tracking-wide">
            Configuração do Motor
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Redefinir
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Section 1: Categorias Ativas */}
      <section className="bg-white/80 dark:bg-card/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-border shadow-md p-5">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
          Categorias Ativas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {CATEGORIAS_ORDER.map((cat) => (
            <CategoriaProtocoloCard 
              key={cat} 
              categoria={cat}
              ativo={isCategoryActive(cat)}
              onToggle={(ativo) => handleCategoryToggle(cat, ativo)}
            />
          ))}
        </div>
      </section>

      {/* Section 2: Pesos dos Campos */}
      <section className="bg-white/80 dark:bg-card/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-border shadow-md p-5">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-muted text-xs flex items-center justify-center font-bold">2</span>
          Pesos dos Campos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {localRules.map((rule) => (
            <div 
              key={rule.id} 
              className="bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/20 dark:border-white/10"
            >
              <div className="flex justify-between items-center mb-3">
                <Label className="font-medium text-sm text-foreground">{rule.label}</Label>
                <Switch
                  checked={rule.ativo}
                  onCheckedChange={(v) => handleRuleChange(rule.id, 'ativo', v)}
                />
              </div>
              <div className="flex items-center gap-3">
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
                  className="w-14 text-center text-sm h-8"
                  disabled={!rule.ativo}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Limites por Categoria */}
      <section className="bg-white/80 dark:bg-card/50 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-border shadow-md p-5">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-muted text-xs flex items-center justify-center font-bold">3</span>
          Limites por Categoria
        </h3>
        
        {activeCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma categoria ativa. Ative categorias na seção acima.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCategories.map((config) => {
              const catConfig = CATEGORIAS_CONFIG[config.categoria as CategoriaContato];
              return (
                <div 
                  key={config.id}
                  className="bg-white/60 dark:bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/20 dark:border-white/10"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{catConfig?.emoji}</span>
                    <span className="font-medium text-sm text-foreground">{catConfig?.label || config.categoria}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[config.pontuacao_minima]}
                      onValueChange={([v]) => handleConfigChange(config.id, 'pontuacao_minima', v)}
                      max={100}
                      min={10}
                      step={5}
                      className="flex-1"
                    />
                    <div className="relative">
                      <Input
                        type="number"
                        value={config.pontuacao_minima}
                        onChange={(e) => handleConfigChange(config.id, 'pontuacao_minima', parseInt(e.target.value) || 0)}
                        className="w-16 pr-6 text-center text-sm h-8"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                        pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default PontuacaoConfigPage;
