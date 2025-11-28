import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const TemplatesSection = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState({
    painel_offline: '',
    painel_online: '',
    alerta_critico: ''
  });

  const variables = [
    { name: '{painel_nome}', desc: 'Nome do painel' },
    { name: '{predio}', desc: 'Nome do prédio' },
    { name: '{tempo}', desc: 'Tempo offline' },
    { name: '{hora}', desc: 'Hora atual' },
    { name: '{mensagem}', desc: 'Mensagem customizada' }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exa_alerts_config')
        .select('config_value')
        .eq('config_key', 'templates')
        .single();

      if (error) throw error;
      if (data?.config_value) {
        setTemplates(data.config_value as any);
      }
    } catch (error: any) {
      console.error('Error loading templates:', error);
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
          config_value: templates,
          updated_at: new Date().toISOString()
        })
        .eq('config_key', 'templates');

      if (error) throw error;
      toast.success('Templates salvos com sucesso!');
    } catch (error: any) {
      console.error('Error saving templates:', error);
      toast.error('Erro ao salvar templates');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm('Tem certeza que deseja restaurar os templates padrão?')) return;
    
    setTemplates({
      painel_offline: '🔴 Painel {painel_nome} em {predio} está OFFLINE desde {tempo}. Ação necessária!',
      painel_online: '🟢 Painel {painel_nome} retornou online em {hora}.',
      alerta_critico: '⚠️ ALERTA CRÍTICO: {mensagem}'
    });
    
    toast.success('Templates restaurados!');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Templates de Mensagem</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure as mensagens que serão enviadas nos alertas
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Restaurar Padrão
        </Button>
      </div>

      {/* Variables Guide */}
      <Card className="p-4 rounded-xl border border-blue-200 bg-blue-50">
        <p className="text-sm font-medium text-blue-900 mb-3">Variáveis Disponíveis:</p>
        <div className="flex flex-wrap gap-2">
          {variables.map((v) => (
            <Badge key={v.name} variant="secondary" className="bg-white text-blue-700 border-blue-200">
              {v.name} <span className="text-xs text-blue-600 ml-1">= {v.desc}</span>
            </Badge>
          ))}
        </div>
      </Card>

      {/* Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Painel Offline */}
        <Card className="p-6 rounded-2xl border-2 border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-xl">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Painel Offline</h3>
              <p className="text-xs text-gray-600">Enviado quando um painel fica offline</p>
            </div>
          </div>
          <Textarea
            value={templates.painel_offline}
            onChange={(e) => setTemplates({ ...templates, painel_offline: e.target.value })}
            rows={3}
            className="font-mono text-sm"
          />
        </Card>

        {/* Painel Online */}
        <Card className="p-6 rounded-2xl border-2 border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-xl">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Painel Online</h3>
              <p className="text-xs text-gray-600">Enviado quando um painel volta online</p>
            </div>
          </div>
          <Textarea
            value={templates.painel_online}
            onChange={(e) => setTemplates({ ...templates, painel_online: e.target.value })}
            rows={2}
            className="font-mono text-sm"
          />
        </Card>

        {/* Alerta Crítico */}
        <Card className="p-6 rounded-2xl border-2 border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-50 rounded-xl">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Alerta Crítico</h3>
              <p className="text-xs text-gray-600">Template genérico para alertas críticos</p>
            </div>
          </div>
          <Textarea
            value={templates.alerta_critico}
            onChange={(e) => setTemplates({ ...templates, alerta_critico: e.target.value })}
            rows={2}
            className="font-mono text-sm"
          />
        </Card>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-gradient-to-r from-[#9C1E1E] to-[#D72638] hover:from-[#7A1717] hover:to-[#B01F2E]"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Templates'}
        </Button>
      </div>
    </div>
  );
};
