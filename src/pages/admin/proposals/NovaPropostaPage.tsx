import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Building2, DollarSign, Eye, Send, MessageSquare, Mail, Link2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { toast } from 'sonner';

const NovaPropostaPage = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsiveLayout();
  const { buildPath } = useAdminBasePath();

  // Estado do formulário
  const [clientData, setClientData] = useState({
    name: '',
    cnpj: '',
    phone: '',
    email: ''
  });

  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [fidelValue, setFidelValue] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [overwriteCashValue, setOverwriteCashValue] = useState(false);
  const [cashValue, setCashValue] = useState('');

  // Mock de prédios (será substituído por dados reais)
  const buildings = [
    { id: '1', name: 'Torres Oeste', panels: 2, impPerDay: 3100 },
    { id: '2', name: 'Plaza Norte', panels: 1, impPerDay: 2600 },
    { id: '3', name: 'Residencial Sol', panels: 1, impPerDay: 2100 },
    { id: '4', name: 'Edifício Mar', panels: 1, impPerDay: 2300 },
    { id: '5', name: 'Praça Central', panels: 1, impPerDay: 2800 },
  ];

  const toggleBuilding = (id: string) => {
    setSelectedBuildings(prev => 
      prev.includes(id) 
        ? prev.filter(b => b !== id)
        : [...prev, id]
    );
  };

  const totalPanels = buildings
    .filter(b => selectedBuildings.includes(b.id))
    .reduce((sum, b) => sum + b.panels, 0);

  const totalImpressions = buildings
    .filter(b => selectedBuildings.includes(b.id))
    .reduce((sum, b) => sum + (b.impPerDay * b.panels * 30), 0);

  // Cálculos de valores
  const fidelMonthly = parseFloat(fidelValue) || 0;
  const fidelTotal = fidelMonthly * 6;
  const cashTotal = overwriteCashValue 
    ? parseFloat(cashValue) || 0 
    : fidelTotal * (1 - discountPercent / 100);

  const handleSendWhatsApp = () => {
    toast.info('Enviando por WhatsApp...');
  };

  const handleSendEmail = () => {
    toast.info('Enviando por E-mail...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(buildPath('propostas'))}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Nova Proposta</h1>
            <p className="text-xs text-muted-foreground">Preencha os dados do cliente</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {/* Seção 1: Dados do Cliente */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-[#9C1E1E]" />
            <h2 className="font-semibold">Dados do Cliente</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome do Cliente *</Label>
              <Input
                placeholder="Ex: João Silva - Empresa XYZ"
                value={clientData.name}
                onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 h-12 text-base"
              />
            </div>
            <div>
              <Label className="text-xs">CNPJ</Label>
              <Input
                placeholder="00.000.000/0000-00"
                value={clientData.cnpj}
                onChange={(e) => setClientData(prev => ({ ...prev, cnpj: e.target.value }))}
                className="mt-1 h-12 text-base"
              />
            </div>
            <div>
              <Label className="text-xs">Telefone WhatsApp *</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={clientData.phone}
                onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1 h-12 text-base"
              />
            </div>
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input
                type="email"
                placeholder="email@empresa.com"
                value={clientData.email}
                onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 h-12 text-base"
              />
            </div>
          </div>
        </Card>

        {/* Seção 2: Seleção de Prédios */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#9C1E1E]" />
              <h2 className="font-semibold">Prédios</h2>
            </div>
            <span className="text-xs font-medium text-[#9C1E1E] bg-red-50 px-2 py-1 rounded-full">
              {selectedBuildings.length} selecionados • {totalPanels} telas
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {buildings.map((building) => (
              <div
                key={building.id}
                onClick={() => toggleBuilding(building.id)}
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedBuildings.includes(building.id)
                    ? 'border-[#9C1E1E] bg-red-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div>
                  <div className="font-medium text-sm">{building.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {building.panels} tela(s) • {building.impPerDay.toLocaleString()} imp/dia
                  </div>
                </div>
                <Switch
                  checked={selectedBuildings.includes(building.id)}
                  onCheckedChange={() => toggleBuilding(building.id)}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Seção 3: Valores */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-[#9C1E1E]" />
            <h2 className="font-semibold">Valores</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs">Valor Fidelidade Mensal *</Label>
              <Input
                type="number"
                placeholder="R$ 0,00"
                value={fidelValue}
                onChange={(e) => setFidelValue(e.target.value)}
                className="mt-1 h-12 text-base"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Desconto à Vista</Label>
                <span className="text-sm font-bold text-[#9C1E1E]">{discountPercent}%</span>
              </div>
              <Slider
                value={[discountPercent]}
                onValueChange={([value]) => setDiscountPercent(value)}
                min={0}
                max={15}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0%</span>
                <span>15%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-xs">Sobrescrever valor à vista</Label>
                <p className="text-[10px] text-muted-foreground">Definir manualmente</p>
              </div>
              <Switch
                checked={overwriteCashValue}
                onCheckedChange={setOverwriteCashValue}
              />
            </div>

            {overwriteCashValue && (
              <div>
                <Label className="text-xs">Valor à Vista (total)</Label>
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={cashValue}
                  onChange={(e) => setCashValue(e.target.value)}
                  className="mt-1 h-12 text-base"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Seção 4: Preview dos Planos */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-[#9C1E1E]" />
            <h2 className="font-semibold">Preview dos Planos</h2>
          </div>

          <div className="space-y-3">
            {/* Plano À Vista */}
            <div className="p-4 rounded-xl border-2 border-[#9C1E1E] bg-gradient-to-br from-red-50 to-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#9C1E1E] bg-red-100 px-2 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
                <span className="text-xs text-muted-foreground">À Vista</span>
              </div>
              <div className="text-2xl font-bold text-[#9C1E1E]">
                {cashTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                = {(cashTotal / 6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                {totalPanels > 0 && ` • R$ ${((cashTotal / 6) / (totalPanels * 30)).toFixed(2)}/painel/dia`}
              </div>
            </div>

            {/* Plano Fidelidade */}
            <div className="p-4 rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Fidelidade 6 meses</span>
              </div>
              <div className="text-2xl font-bold">
                {fidelMonthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total: {fidelTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                {totalPanels > 0 && ` • R$ ${(fidelMonthly / (totalPanels * 30)).toFixed(2)}/painel/dia`}
              </div>
            </div>

            {/* Resumo */}
            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prédios:</span>
                <span className="font-medium">{selectedBuildings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telas:</span>
                <span className="font-medium">{totalPanels}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exibições/mês:</span>
                <span className="font-medium">{totalImpressions.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer Fixo com Ações */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 z-20">
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          <Button
            variant="outline"
            className="h-12 gap-2"
            onClick={handleSendEmail}
            disabled={!clientData.name || !fidelValue}
          >
            <Mail className="h-4 w-4" />
            E-mail
          </Button>
          <Button
            className="h-12 gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
            onClick={handleSendWhatsApp}
            disabled={!clientData.name || !clientData.phone || !fidelValue}
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </Button>
        </div>
        <div className="flex justify-center gap-4 mt-3">
          <button className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
            <FileText className="h-3 w-3" />
            Gerar PDF
          </button>
          <button className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
            <Link2 className="h-3 w-3" />
            Copiar Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default NovaPropostaPage;
