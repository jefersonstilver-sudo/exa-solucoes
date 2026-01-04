import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Building2, Phone, MapPin, Tag, Brain, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIAS_ORDER, CATEGORIAS_CONFIG, CategoriaContato, Contact, OrigemContato, ORIGEM_CONFIG, TemperaturaContato, TEMPERATURA_CONFIG } from '@/types/contatos';
import { useContatos } from '@/hooks/contatos';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { toast } from 'sonner';

const ORIGEM_OPTIONS: OrigemContato[] = [
  'cadastro_manual',
  'google',
  'maps',
  'instagram',
  'indicacao',
  'rua',
  'site',
  'telefone',
  'email',
  'outros'
];

const NovoContatoPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const { createContact } = useContatos();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Contact>>({
    nome: '',
    sobrenome: '',
    empresa: '',
    cargo_tomador: '',
    telefone: '',
    email: '',
    website: '',
    instagram: '',
    endereco: '',
    bairro: '',
    cidade: 'Foz do Iguaçu',
    estado: 'PR',
    cep: '',
    cnpj: '',
    categoria: 'lead',
    temperatura: 'morno',
    origem: 'cadastro_manual',
    tipo_negocio: '',
    tomador_decisao: '',
    onde_anuncia_hoje: [],
    publico_alvo: '',
    ticket_estimado: undefined,
    dores_identificadas: '',
    observacoes_estrategicas: ''
  });

  const handleChange = (field: keyof Contact, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.telefone || !formData.categoria) {
      toast.error('Preencha os campos obrigatórios: Nome, Telefone e Categoria');
      return;
    }

    setLoading(true);
    try {
      const newContact = await createContact(formData);
      toast.success('Contato criado com sucesso!');
      navigate(buildPath(`contatos/${newContact.id}`));
    } catch (error) {
      console.error('Error creating contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(buildPath('contatos'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header Fixo */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-foreground">Novo Contato</h1>
                <p className="text-xs text-muted-foreground">
                  Cadastre um novo contato no sistema
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} className="h-8">
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={loading} className="h-8">
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Salvar Contato
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            
            {/* Dados Básicos */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Dados Básicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-xs">
                      Nome <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleChange('nome', e.target.value)}
                      placeholder="Nome do contato"
                      className="h-9 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sobrenome" className="text-xs">Sobrenome</Label>
                    <Input
                      id="sobrenome"
                      value={formData.sobrenome}
                      onChange={(e) => handleChange('sobrenome', e.target.value)}
                      placeholder="Sobrenome"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa" className="text-xs">Empresa</Label>
                  <Input
                    id="empresa"
                    value={formData.empresa}
                    onChange={(e) => handleChange('empresa', e.target.value)}
                    placeholder="Nome da empresa"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cargo_tomador" className="text-xs">Cargo</Label>
                    <Input
                      id="cargo_tomador"
                      value={formData.cargo_tomador}
                      onChange={(e) => handleChange('cargo_tomador', e.target.value)}
                      placeholder="Ex: Diretor, Gerente"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj" className="text-xs">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleChange('cnpj', e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-xs">
                      Telefone/WhatsApp <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => handleChange('telefone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="h-9 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="email@empresa.com"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-xs">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="www.empresa.com.br"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="text-xs">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => handleChange('instagram', e.target.value)}
                      placeholder="@usuario"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localização */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="endereco" className="text-xs">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => handleChange('endereco', e.target.value)}
                    placeholder="Rua, número, complemento"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bairro" className="text-xs">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => handleChange('bairro', e.target.value)}
                      placeholder="Bairro"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade" className="text-xs">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => handleChange('cidade', e.target.value)}
                      placeholder="Cidade"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estado" className="text-xs">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => handleChange('estado', e.target.value)}
                      placeholder="UF"
                      className="h-9 text-sm"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep" className="text-xs">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleChange('cep', e.target.value)}
                      placeholder="00000-000"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            
            {/* Classificação */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Classificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria" className="text-xs">
                    Categoria <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(v) => handleChange('categoria', v as CategoriaContato)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_ORDER.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${CATEGORIAS_CONFIG[cat].bgColor}`} />
                            {CATEGORIAS_CONFIG[cat].label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="origem" className="text-xs">Origem</Label>
                    <Select
                      value={formData.origem || 'cadastro_manual'}
                      onValueChange={(v) => handleChange('origem', v as OrigemContato)}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Como conheceu?" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORIGEM_OPTIONS.map((origem) => (
                          <SelectItem key={origem} value={origem}>
                            {ORIGEM_CONFIG[origem].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperatura" className="text-xs">Temperatura</Label>
                    <Select
                      value={formData.temperatura || 'morno'}
                      onValueChange={(v) => handleChange('temperatura', v as TemperaturaContato)}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Temperatura" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quente">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Quente
                          </div>
                        </SelectItem>
                        <SelectItem value="morno">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            Morno
                          </div>
                        </SelectItem>
                        <SelectItem value="frio">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            Frio
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_negocio" className="text-xs">Tipo de Negócio</Label>
                  <Input
                    id="tipo_negocio"
                    value={formData.tipo_negocio}
                    onChange={(e) => handleChange('tipo_negocio', e.target.value)}
                    placeholder="Ex: Restaurante, Loja, Clínica..."
                    className="h-9 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Inteligência Comercial */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  Inteligência Comercial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="onde_anuncia" className="text-xs">Onde Anuncia Hoje?</Label>
                  <Input
                    id="onde_anuncia"
                    value={formData.onde_anuncia_hoje?.join(', ') || ''}
                    onChange={(e) => handleChange('onde_anuncia_hoje', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="Instagram, Google, Rádio, etc."
                    className="h-9 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">Separe por vírgulas</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="publico_alvo" className="text-xs">Público-Alvo</Label>
                    <Input
                      id="publico_alvo"
                      value={formData.publico_alvo}
                      onChange={(e) => handleChange('publico_alvo', e.target.value)}
                      placeholder="Ex: Jovens 18-35"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket_estimado" className="text-xs">Ticket Estimado (R$)</Label>
                    <Input
                      id="ticket_estimado"
                      type="number"
                      value={formData.ticket_estimado || ''}
                      onChange={(e) => handleChange('ticket_estimado', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0,00"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tomador_decisao" className="text-xs">Tomador de Decisão</Label>
                  <Input
                    id="tomador_decisao"
                    value={formData.tomador_decisao}
                    onChange={(e) => handleChange('tomador_decisao', e.target.value)}
                    placeholder="Nome do decisor"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dores_identificadas" className="text-xs">Dores Identificadas</Label>
                  <Textarea
                    id="dores_identificadas"
                    value={formData.dores_identificadas}
                    onChange={(e) => handleChange('dores_identificadas', e.target.value)}
                    placeholder="Quais problemas o cliente enfrenta?"
                    className="min-h-[80px] text-sm resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Observações Estratégicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="observacoes_estrategicas"
                  value={formData.observacoes_estrategicas}
                  onChange={(e) => handleChange('observacoes_estrategicas', e.target.value)}
                  placeholder="Anotações importantes sobre o contato, estratégias de abordagem, etc."
                  className="min-h-[120px] text-sm resize-none"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-gray-100 lg:hidden">
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 h-10" 
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-10" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Salvar
            </Button>
          </div>
        </div>
        
        {/* Spacer for mobile footer */}
        <div className="h-20 lg:hidden" />
      </form>
    </div>
  );
};

export default NovoContatoPage;
