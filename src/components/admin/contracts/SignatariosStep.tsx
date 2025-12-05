import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, UserCheck, Building2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export interface SignatarioContrato {
  id: string;
  tipo: 'cliente' | 'exa' | 'testemunha';
  nome: string;
  sobrenome: string;
  email: string;
  data_nascimento: string;
  cpf: string;
  cargo: string;
  signatario_exa_id?: string;
}

interface SignatariosStepProps {
  clienteNome: string;
  clienteSobrenome: string;
  clienteEmail: string;
  clienteCargo: string;
  signatarios: SignatarioContrato[];
  onSignatariosChange: (signatarios: SignatarioContrato[]) => void;
}

const SignatariosStep: React.FC<SignatariosStepProps> = ({
  clienteNome,
  clienteSobrenome,
  clienteEmail,
  clienteCargo,
  signatarios,
  onSignatariosChange,
}) => {
  // Buscar signatários EXA
  const { data: signatariosExa } = useQuery({
    queryKey: ['signatarios-exa-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signatarios_exa')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Signatário cliente
  const [clienteSignatario, setClienteSignatario] = useState<SignatarioContrato>({
    id: 'cliente-1',
    tipo: 'cliente',
    nome: clienteNome,
    sobrenome: clienteSobrenome,
    email: clienteEmail,
    data_nascimento: '',
    cpf: '',
    cargo: clienteCargo
  });

  // Signatários EXA selecionados
  const [selectedExaIds, setSelectedExaIds] = useState<string[]>([]);

  // Testemunhas
  const [testemunhas, setTestemunhas] = useState<SignatarioContrato[]>([]);
  const [showTestemunhas, setShowTestemunhas] = useState(false);

  // Inicializar com dados existentes
  useEffect(() => {
    if (signatarios.length > 0) {
      const cliente = signatarios.find(s => s.tipo === 'cliente');
      if (cliente) setClienteSignatario(cliente);

      const exas = signatarios.filter(s => s.tipo === 'exa');
      setSelectedExaIds(exas.map(s => s.signatario_exa_id || '').filter(Boolean));

      const tests = signatarios.filter(s => s.tipo === 'testemunha');
      if (tests.length > 0) {
        setTestemunhas(tests);
        setShowTestemunhas(true);
      }
    }
  }, []);

  // Atualizar props do cliente quando mudam
  useEffect(() => {
    setClienteSignatario(prev => ({
      ...prev,
      nome: clienteNome,
      sobrenome: clienteSobrenome,
      email: clienteEmail,
      cargo: clienteCargo
    }));
  }, [clienteNome, clienteSobrenome, clienteEmail, clienteCargo]);

  // Consolidar todos os signatários quando algo muda
  useEffect(() => {
    const allSignatarios: SignatarioContrato[] = [clienteSignatario];

    // Adicionar signatários EXA selecionados
    selectedExaIds.forEach(exaId => {
      const exaData = signatariosExa?.find(s => s.id === exaId);
      if (exaData) {
        allSignatarios.push({
          id: `exa-${exaId}`,
          tipo: 'exa',
          nome: exaData.nome.split(' ')[0] || exaData.nome,
          sobrenome: exaData.nome.split(' ').slice(1).join(' ') || '',
          email: exaData.email,
          data_nascimento: exaData.data_nascimento || '',
          cpf: exaData.cpf || '',
          cargo: exaData.cargo || 'Representante Legal',
          signatario_exa_id: exaData.id
        });
      }
    });

    // Adicionar testemunhas
    testemunhas.forEach(t => allSignatarios.push(t));

    onSignatariosChange(allSignatarios);
  }, [clienteSignatario, selectedExaIds, testemunhas, signatariosExa]);

  // Toggle signatário EXA
  const toggleExaSigner = (exaId: string) => {
    setSelectedExaIds(prev => 
      prev.includes(exaId) 
        ? prev.filter(id => id !== exaId)
        : [...prev, exaId]
    );
  };

  // Adicionar testemunha
  const addTestemunha = () => {
    setTestemunhas(prev => [
      ...prev,
      {
        id: `testemunha-${Date.now()}`,
        tipo: 'testemunha',
        nome: '',
        sobrenome: '',
        email: '',
        data_nascimento: '',
        cpf: '',
        cargo: 'Testemunha'
      }
    ]);
  };

  // Atualizar testemunha
  const updateTestemunha = (id: string, field: keyof SignatarioContrato, value: string) => {
    setTestemunhas(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  // Remover testemunha
  const removeTestemunha = (id: string) => {
    setTestemunhas(prev => prev.filter(t => t.id !== id));
  };

  // Validar data de nascimento do cliente
  const isClienteBirthdayValid = clienteSignatario.data_nascimento && 
    clienteSignatario.data_nascimento.length === 10;

  return (
    <div className="space-y-6">
      {/* Alerta sobre requisitos ClickSign */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-700">
          <p className="font-medium">Requisitos ClickSign</p>
          <p className="mt-1">
            Para assinatura digital válida, cada signatário precisa de: <strong>Nome completo</strong>, 
            <strong> E-mail</strong> e <strong>Data de nascimento</strong> (recomendado).
          </p>
        </div>
      </div>

      {/* Signatário Cliente */}
      <Card className="p-5 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Signatário Cliente</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome *</Label>
            <Input
              value={clienteSignatario.nome}
              onChange={(e) => setClienteSignatario(prev => ({ ...prev, nome: e.target.value }))}
              className="rounded-xl"
              placeholder="Nome"
            />
          </div>
          <div>
            <Label>Sobrenome *</Label>
            <Input
              value={clienteSignatario.sobrenome}
              onChange={(e) => setClienteSignatario(prev => ({ ...prev, sobrenome: e.target.value }))}
              className="rounded-xl"
              placeholder="Sobrenome"
            />
          </div>
          <div>
            <Label>E-mail *</Label>
            <Input
              type="email"
              value={clienteSignatario.email}
              onChange={(e) => setClienteSignatario(prev => ({ ...prev, email: e.target.value }))}
              className="rounded-xl"
              placeholder="email@empresa.com"
            />
          </div>
          <div>
            <Label>Data de Nascimento *</Label>
            <Input
              type="date"
              value={clienteSignatario.data_nascimento}
              onChange={(e) => setClienteSignatario(prev => ({ ...prev, data_nascimento: e.target.value }))}
              className={`rounded-xl ${!isClienteBirthdayValid ? 'border-amber-400' : ''}`}
            />
            {!isClienteBirthdayValid && (
              <p className="text-xs text-amber-600 mt-1">Recomendado para ClickSign</p>
            )}
          </div>
          <div>
            <Label>CPF</Label>
            <Input
              value={clienteSignatario.cpf}
              onChange={(e) => setClienteSignatario(prev => ({ ...prev, cpf: e.target.value }))}
              className="rounded-xl"
              placeholder="000.000.000-00"
            />
          </div>
          <div>
            <Label>Cargo</Label>
            <Input
              value={clienteSignatario.cargo}
              onChange={(e) => setClienteSignatario(prev => ({ ...prev, cargo: e.target.value }))}
              className="rounded-xl"
              placeholder="Ex: Sócio Administrador"
            />
          </div>
        </div>
      </Card>

      {/* Signatários EXA */}
      <Card className="p-5 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Signatários EXA Mídia</h3>
        </div>

        {signatariosExa && signatariosExa.length > 0 ? (
          <div className="space-y-3">
            {signatariosExa.map((exa) => (
              <label 
                key={exa.id} 
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  selectedExaIds.includes(exa.id)
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <Checkbox
                  checked={selectedExaIds.includes(exa.id)}
                  onCheckedChange={() => toggleExaSigner(exa.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">{exa.nome}</p>
                  <p className="text-sm text-muted-foreground">{exa.cargo} • {exa.email}</p>
                  {exa.data_nascimento && (
                    <p className="text-xs text-green-600">✓ Data de nascimento cadastrada</p>
                  )}
                </div>
                {exa.is_default && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Padrão
                  </span>
                )}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Nenhum signatário EXA cadastrado. Cadastre em Configurações → Signatários EXA.
          </p>
        )}
      </Card>

      {/* Testemunhas (Opcional) */}
      <Card className="p-5 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Testemunhas (Opcional)</h3>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={showTestemunhas}
              onCheckedChange={(checked) => {
                setShowTestemunhas(!!checked);
                if (!checked) setTestemunhas([]);
              }}
            />
            <span>Adicionar testemunhas</span>
          </label>
        </div>

        {showTestemunhas && (
          <div className="space-y-4">
            {testemunhas.map((testemunha, index) => (
              <div key={testemunha.id} className="p-4 bg-gray-50 rounded-xl relative">
                <div className="absolute top-2 right-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTestemunha(testemunha.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm font-medium mb-3">Testemunha {index + 1}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Nome *</Label>
                    <Input
                      value={testemunha.nome}
                      onChange={(e) => updateTestemunha(testemunha.id, 'nome', e.target.value)}
                      className="rounded-xl h-9"
                      placeholder="Nome"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Sobrenome</Label>
                    <Input
                      value={testemunha.sobrenome}
                      onChange={(e) => updateTestemunha(testemunha.id, 'sobrenome', e.target.value)}
                      className="rounded-xl h-9"
                      placeholder="Sobrenome"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">E-mail *</Label>
                    <Input
                      type="email"
                      value={testemunha.email}
                      onChange={(e) => updateTestemunha(testemunha.id, 'email', e.target.value)}
                      className="rounded-xl h-9"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">CPF</Label>
                    <Input
                      value={testemunha.cpf}
                      onChange={(e) => updateTestemunha(testemunha.id, 'cpf', e.target.value)}
                      className="rounded-xl h-9"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addTestemunha}
              className="w-full rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Testemunha
            </Button>
          </div>
        )}
      </Card>

      {/* Resumo */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-700">
          <strong>Total de signatários:</strong> {1 + selectedExaIds.length + testemunhas.length}
          <span className="ml-4">
            (1 Cliente{selectedExaIds.length > 0 && `, ${selectedExaIds.length} EXA`}
            {testemunhas.length > 0 && `, ${testemunhas.length} Testemunha${testemunhas.length > 1 ? 's' : ''}`})
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignatariosStep;
