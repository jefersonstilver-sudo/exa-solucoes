import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const PeriodsSection = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    inicio: '03:00',
    fim: '01:00',
    timezone: 'America/Sao_Paulo'
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exa_alerts_config')
        .select('config_value')
        .eq('config_key', 'silence_period')
        .single();

      if (error) throw error;
      if (data?.config_value) {
        setConfig(data.config_value as any);
      }
    } catch (error: any) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('exa_alerts_config')
        .update({
          config_value: config,
          updated_at: new Date().toISOString()
        })
        .eq('config_key', 'silence_period');

      if (error) throw error;
      toast.success('Configuração salva com sucesso!');
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9C1E1E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Períodos e Horários</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure o período de silêncio dos alertas
        </p>
      </div>

      {/* Config Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6 rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-50 rounded-xl">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Horário de Silêncio</h3>
              <p className="text-sm text-gray-600">
                Alertas não serão enviados neste período
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Horário de Início */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inicio">Horário de Início</Label>
                <Input
                  id="inicio"
                  type="time"
                  value={config.inicio}
                  onChange={(e) => setConfig({ ...config, inicio: e.target.value })}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fim">Horário de Término</Label>
                <Input
                  id="fim"
                  type="time"
                  value={config.fim}
                  onChange={(e) => setConfig({ ...config, fim: e.target.value })}
                  className="text-lg"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Período de Manutenção</p>
                <p>
                  Alertas NÃO serão enviados entre <strong>{config.inicio}</strong> e <strong>{config.fim}</strong>.
                  Este é o período natural de manutenção dos painéis.
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview do Período Ativo:</p>
              <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                <span className="text-green-600">{config.fim}</span>
                <span className="text-gray-400">→</span>
                <span className="text-green-600">{config.inicio}</span>
                <span className="text-sm text-gray-600 ml-2">(alertas ativos)</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-2">
                <span className="text-red-600">{config.inicio}</span>
                <span>→</span>
                <span className="text-red-600">{config.fim}</span>
                <span className="ml-2">(silêncio)</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-[#9C1E1E] to-[#D72638] hover:from-[#7A1717] hover:to-[#B01F2E]"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
