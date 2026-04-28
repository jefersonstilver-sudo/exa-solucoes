import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Film,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Clock,
  Monitor,
  Smartphone,
  Search,
  Check,
  Loader2,
  History,
  Trash2,
  Copy,
  QrCode,
  Volume2,
  TrendingUp,
  Zap,
  Heart,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// ─── Segmentos ────────────────────────────────────────────────────────────────
const SEGMENTS = [
  // Alimentação
  { label: 'Restaurante / Lanchonete', category: 'Alimentação' },
  { label: 'Pizzaria', category: 'Alimentação' },
  { label: 'Hamburgueria', category: 'Alimentação' },
  { label: 'Sushi / Japonês', category: 'Alimentação' },
  { label: 'Cafeteria / Café', category: 'Alimentação' },
  { label: 'Padaria / Confeitaria', category: 'Alimentação' },
  { label: 'Delivery de Comida', category: 'Alimentação' },
  { label: 'Marmitex / Marmita Fitness', category: 'Alimentação' },
  { label: 'Açaí / Sorveteria', category: 'Alimentação' },
  { label: 'Bar / Pub', category: 'Alimentação' },
  // Saúde & Bem-estar
  { label: 'Academia / Musculação', category: 'Saúde & Bem-estar' },
  { label: 'Clínica Médica', category: 'Saúde & Bem-estar' },
  { label: 'Odontologia / Dentista', category: 'Saúde & Bem-estar' },
  { label: 'Psicologia / Terapia', category: 'Saúde & Bem-estar' },
  { label: 'Fisioterapia', category: 'Saúde & Bem-estar' },
  { label: 'Farmácia / Drogaria', category: 'Saúde & Bem-estar' },
  { label: 'Nutrição / Nutrólogo', category: 'Saúde & Bem-estar' },
  { label: 'Estética / Clínica de Beleza', category: 'Saúde & Bem-estar' },
  { label: 'Pilates / Yoga', category: 'Saúde & Bem-estar' },
  { label: 'Clínica Veterinária', category: 'Saúde & Bem-estar' },
  // Beleza & Moda
  { label: 'Salão de Beleza', category: 'Beleza & Moda' },
  { label: 'Barbearia', category: 'Beleza & Moda' },
  { label: 'Loja de Roupas / Boutique', category: 'Beleza & Moda' },
  { label: 'Loja de Calçados', category: 'Beleza & Moda' },
  { label: 'Manicure / Esmalteria', category: 'Beleza & Moda' },
  { label: 'Maquiagem / Micropigmentação', category: 'Beleza & Moda' },
  { label: 'Depilação / Laser', category: 'Beleza & Moda' },
  // Educação
  { label: 'Escola / Colégio', category: 'Educação' },
  { label: 'Curso de Idiomas', category: 'Educação' },
  { label: 'Cursinho / Pré-vestibular', category: 'Educação' },
  { label: 'Escola de Música / Arte', category: 'Educação' },
  { label: 'Faculdade / Universidade', category: 'Educação' },
  { label: 'Cursos Online / EAD', category: 'Educação' },
  { label: 'Curso Profissionalizante', category: 'Educação' },
  // Serviços Financeiros
  { label: 'Banco / Fintech', category: 'Financeiro' },
  { label: 'Corretora de Seguros', category: 'Financeiro' },
  { label: 'Contabilidade / Escritório Contábil', category: 'Financeiro' },
  { label: 'Consórcio / Financiamento', category: 'Financeiro' },
  { label: 'Crédito / Empréstimo', category: 'Financeiro' },
  { label: 'Câmbio / Turismo Financeiro', category: 'Financeiro' },
  // Imóveis
  { label: 'Imobiliária', category: 'Imóveis' },
  { label: 'Construtora / Incorporadora', category: 'Imóveis' },
  { label: 'Administração de Condomínios', category: 'Imóveis' },
  { label: 'Reformas / Construção Civil', category: 'Imóveis' },
  { label: 'Arquitetura / Design de Interiores', category: 'Imóveis' },
  // Tecnologia
  { label: 'Assistência Técnica / Informática', category: 'Tecnologia' },
  { label: 'Loja de Eletrônicos', category: 'Tecnologia' },
  { label: 'Software / Aplicativo', category: 'Tecnologia' },
  { label: 'Telecomunicações / Internet', category: 'Tecnologia' },
  { label: 'Segurança Eletrônica / Câmeras', category: 'Tecnologia' },
  // Automotivo
  { label: 'Concessionária / Revendedora', category: 'Automotivo' },
  { label: 'Oficina Mecânica', category: 'Automotivo' },
  { label: 'Loja de Pneus', category: 'Automotivo' },
  { label: 'Estética Automotiva', category: 'Automotivo' },
  { label: 'Locadora de Veículos', category: 'Automotivo' },
  { label: 'Auto Peças', category: 'Automotivo' },
  // Varejo
  { label: 'Supermercado / Mercado', category: 'Varejo' },
  { label: 'Loja de Materiais de Construção', category: 'Varejo' },
  { label: 'Papelaria / Livraria', category: 'Varejo' },
  { label: 'Pet Shop', category: 'Varejo' },
  { label: 'Loja de Móveis / Decoração', category: 'Varejo' },
  { label: 'Ótica', category: 'Varejo' },
  { label: 'Joalheria / Bijuteria', category: 'Varejo' },
  { label: 'Floricultura', category: 'Varejo' },
  { label: 'Loja de Presentes / Artigos', category: 'Varejo' },
  // Turismo & Lazer
  { label: 'Hotel / Pousada', category: 'Turismo & Lazer' },
  { label: 'Agência de Turismo / Viagens', category: 'Turismo & Lazer' },
  { label: 'Parque / Atração Turística', category: 'Turismo & Lazer' },
  { label: 'Eventos / Buffet', category: 'Turismo & Lazer' },
  { label: 'Cinema / Teatro', category: 'Turismo & Lazer' },
  { label: 'Esporte / Clube', category: 'Turismo & Lazer' },
  // Jurídico
  { label: 'Advocacia / Escritório Jurídico', category: 'Jurídico' },
  { label: 'Despachante / Documentação', category: 'Jurídico' },
  // Outros
  { label: 'Serviços de Limpeza / Portaria', category: 'Outros' },
  { label: 'Lavanderia', category: 'Outros' },
  { label: 'Gráfica / Comunicação Visual', category: 'Outros' },
  { label: 'Fotografia / Filmagem', category: 'Outros' },
  { label: 'Igreja / Organização Religiosa', category: 'Outros' },
  { label: 'ONG / Instituição Social', category: 'Outros' },
  { label: 'Governo / Órgão Público', category: 'Outros' },
  { label: 'Outro segmento', category: 'Outros' },
];

const CATEGORIES = ['Todos', ...Array.from(new Set(SEGMENTS.map(s => s.category)))];

// ─── Tipos de vídeo ──────────────────────────────────────────────────────────
const VIDEO_TYPES = [
  { id: 'institucional', label: 'Institucional', icon: Users, desc: 'Apresentação de marca, fallback 24/7' },
  { id: 'oferta', label: 'Oferta', icon: Zap, desc: 'Promoção direta com CTA e QR Code' },
  { id: 'awareness', label: 'Awareness', icon: TrendingUp, desc: 'Problema/desejo, topo de funil' },
  { id: 'prova_social', label: 'Prova Social', icon: Heart, desc: 'Depoimento, números, autoridade' },
  { id: 'cta_direto', label: 'CTA Direto', icon: Sparkles, desc: 'Conversão, urgência, escassez' },
  { id: 'filler', label: 'Filler Utilidade', icon: Film, desc: 'Conteúdo educativo/informativo' },
];

// ─── Tom ──────────────────────────────────────────────────────────────────────
const TONES = [
  { id: 'impactante', label: 'Impactante', emoji: '⚡' },
  { id: 'emocional', label: 'Emocional', emoji: '❤️' },
  { id: 'urgente', label: 'Urgente', emoji: '🔥' },
  { id: 'educativo', label: 'Educativo', emoji: '💡' },
  { id: 'divertido', label: 'Divertido', emoji: '😄' },
  { id: 'profissional', label: 'Profissional', emoji: '💼' },
];

// ─── Dicas por contagem de vídeos ────────────────────────────────────────────
const VIDEO_COUNT_TIPS: Record<number, string> = {
  1: 'Ideal para teste rápido. Foque no institucional ou oferta principal.',
  2: 'Combine institucional + oferta. Testa duas abordagens.',
  3: 'Tríade completa: awareness → oferta → CTA. Alta conversão.',
  4: 'Adicione prova social. Frequência reforça a mensagem.',
  5: 'Campanha robusta. Cubra diferentes horários e objetivos.',
  6: 'Diversifique os tipos. Rotação mantém atenção alta.',
  7: 'Estratégia completa com sequência de funil.',
  8: 'Cobre manhã, almoço e noite com mensagens distintas.',
  9: 'Campanha profissional. Máxima presença de marca.',
  10: 'Presença total. 10 slots = domínio do condomínio.',
};

// ─── Prompt builder ──────────────────────────────────────────────────────────
function buildPrompt(data: FormData): string {
  const formatSpec = data.format === 'vertical'
    ? 'Vertical 9:16 (1080×1920px, 15 segundos)'
    : 'Horizontal 16:9 (1440×1080px, 10 segundos)';

  const blueprint = data.format === 'vertical'
    ? `Blueprint Vertical 15s:
0s–2s  → CAPTURA: quebra de padrão (cor forte, número, pergunta, rosto)
2s–5s  → PROBLEMA ou DESEJO: 1 frase, linguagem do espectador
5s–10s → SOLUÇÃO + PROVA: visual concreto, dado, depoimento curto
10s–13s→ OFERTA + URGÊNCIA ou DIFERENCIAL
13s–15s→ ANCORAGEM: logo + contato + frame estático limpo`
    : `Blueprint Horizontal 10s:
0s–2s → CAPTURA IMEDIATA: impacto no frame 0
2s–6s → MENSAGEM ÚNICA: 1 oferta ou 1 benefício claro
6s–8s → CREDENCIAL: número, nota, anos de experiência
8s–10s→ ANCORAGEM: logo + contato + frame limpo`;

  const types = data.videoTypes.length > 0
    ? data.videoTypes.join(', ')
    : 'institucional, oferta';

  return `Você é especialista em roteiros para mídia DOOH (Digital Out-of-Home) em elevadores residenciais.

CONTEXTO DA PLATAFORMA:
- Examidia: painéis digitais em elevadores de condomínios em Foz do Iguaçu, PR
- Taxa de atenção: 95% (passageiro cativo, sem celular na mão)
- Frequência: 40–60 visualizações/semana por morador (Mere Exposure Effect)
- Formato atual: ${formatSpec}

${blueprint}

REGRAS DE PRODUÇÃO:
- Fonte mínima: 60pt (legível a 1,5m de distância)
- Máx 3 cores, alto contraste obrigatório
- Máx 5–7 palavras por linha, 2–3 linhas por tela
- Sempre encerrar em frame estático (ancoragem de memória)
- Legenda deve comunicar SEM áudio (elevadores têm barulho)
${data.hasQrCode ? '- QR Code: deve aparecer por mínimo 5s + texto "Escaneie e [benefício]"' : ''}
- Não começar com logo estática

EMPRESA ANUNCIANTE:
- Nome: ${data.companyName}
- Segmento: ${data.segment}
- Tom: ${data.tone || 'impactante'}
${data.extraInfo ? `- Informações extras: ${data.extraInfo}` : ''}

TAREFA:
Crie ${data.videoCount} roteiro(s) completo(s) para esta empresa.
Tipos de vídeo a usar: ${types}
${data.videoCount > 1 ? `Distribua estrategicamente entre: ${types}` : ''}

Para CADA roteiro, use este formato exato:

---
## ROTEIRO [número]: [TIPO EM MAIÚSCULO]

**Formato:** ${data.format === 'vertical' ? 'Vertical 15s' : 'Horizontal 10s'}
**Objetivo:** [objetivo do vídeo]

| Tempo | Tipo de Cena | VISUAL | TEXTO NA TELA | ÁUDIO |
|-------|-------------|--------|---------------|-------|
[preencha cada linha com os tempos do blueprint acima]

**Dica de produção:** [1 dica específica para este roteiro]
---

Seja direto, específico e use linguagem do consumidor do segmento ${data.segment}. Use palavras de alto impacto: Grátis, Agora, Você, Novo, Garantido, Exclusivo, Resultado, Fácil, Rápido, Hoje — quando pertinente.`;
}

// ─── Tipos internos ──────────────────────────────────────────────────────────
interface FormData {
  companyName: string;
  segment: string;
  format: 'vertical' | 'horizontal';
  videoCount: number;
  videoTypes: string[];
  tone: string;
  hasQrCode: boolean;
  extraInfo: string;
}

interface RoteiroRecord {
  id: string;
  company_name: string;
  segment: string;
  format: string;
  video_count: number;
  tone: string | null;
  roteiro_content: string;
  created_at: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────
const GeradorRoteiros: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'gerar' | 'historico'>('gerar');
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<RoteiroRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [segSearch, setSegSearch] = useState('');
  const [segCategory, setSegCategory] = useState('Todos');
  const resultRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormData>({
    companyName: userProfile?.company_name || '',
    segment: '',
    format: 'vertical',
    videoCount: 3,
    videoTypes: [],
    tone: 'impactante',
    hasQrCode: false,
    extraInfo: '',
  });

  // Pré-preenche nome da empresa quando perfil carrega
  useEffect(() => {
    if (userProfile?.company_name && !form.companyName) {
      setForm(f => ({ ...f, companyName: userProfile.company_name || '' }));
    }
  }, [userProfile?.company_name]);

  // Carrega histórico quando aba muda
  useEffect(() => {
    if (activeTab === 'historico') loadHistory();
  }, [activeTab]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from('roteiros_gerados')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setHistory(data as RoteiroRecord[]);
    setHistoryLoading(false);
  };

  const deleteRoteiro = async (id: string) => {
    const { error } = await supabase.from('roteiros_gerados').delete().eq('id', id);
    if (!error) {
      setHistory(h => h.filter(r => r.id !== id));
      toast.success('Roteiro excluído');
    }
  };

  const filteredSegments = SEGMENTS.filter(s => {
    const matchCat = segCategory === 'Todos' || s.category === segCategory;
    const matchSearch = s.label.toLowerCase().includes(segSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleVideoType = (id: string) => {
    setForm(f => ({
      ...f,
      videoTypes: f.videoTypes.includes(id)
        ? f.videoTypes.filter(v => v !== id)
        : [...f.videoTypes, id],
    }));
  };

  const canAdvance = () => {
    if (step === 0) return form.companyName.trim().length > 0;
    if (step === 1) return form.segment.length > 0;
    if (step === 2) return true;
    if (step === 3) return true;
    if (step === 4) return true;
    return true;
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const prompt = buildPrompt(form);
      const { data, error } = await supabase.functions.invoke('generate-roteiro', {
        body: {
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        },
      });

      if (error) throw new Error(error.message);
      const content = data?.content?.[0]?.text;
      if (!content) throw new Error('Resposta vazia da IA');

      setResult(content);

      // Salva no Supabase
      const { error: saveErr } = await supabase.from('roteiros_gerados').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        company_name: form.companyName,
        segment: form.segment,
        format: form.format,
        video_count: form.videoCount,
        tone: form.tone,
        has_qr_code: form.hasQrCode,
        blueprint_types: form.videoTypes,
        roteiro_content: content,
      });

      if (saveErr) console.error('Erro ao salvar roteiro:', saveErr);

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar roteiro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Roteiro copiado!');
  };

  const resetForm = () => {
    setStep(0);
    setResult(null);
    setForm({
      companyName: userProfile?.company_name || '',
      segment: '',
      format: 'vertical',
      videoCount: 3,
      videoTypes: [],
      tone: 'impactante',
      hasQrCode: false,
      extraInfo: '',
    });
  };

  // ─── Orbs animados ────────────────────────────────────────────────────────
  const Orbs = () => (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-red-900/20 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-red-800/15 blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-rose-700/10 blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
    </div>
  );

  // ─── Step components ──────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className={cn(
          'h-2 rounded-full transition-all duration-300',
          i === step ? 'w-8 bg-red-600' : i < step ? 'w-2 bg-red-400' : 'w-2 bg-gray-300'
        )} />
      ))}
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-white">
      <Orbs />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4 shadow-lg shadow-red-200">
            <Sparkles className="w-4 h-4" />
            <span>IA Geradora de Roteiros DOOH</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerador de Roteiros</h1>
          <p className="text-gray-500 text-sm">Roteiros profissionais para painéis EXA em elevadores</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mb-8">
          <button
            onClick={() => setActiveTab('gerar')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
              activeTab === 'gerar' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Sparkles className="w-4 h-4" />
            Gerar Roteiro
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all',
              activeTab === 'historico' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <History className="w-4 h-4" />
            Meus Roteiros
          </button>
        </div>

        {/* ── ABA: GERAR ── */}
        {activeTab === 'gerar' && !result && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <StepIndicator />

            {/* Step 0 — Empresa */}
            {step === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-center">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Film className="w-7 h-7 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Para qual empresa?</h2>
                  <p className="text-gray-400 text-sm">Pode ser a sua empresa ou outra que você representa</p>
                </div>
                <Input
                  placeholder="Ex: Salão da Marcia, Dr. João Odontologia..."
                  value={form.companyName}
                  onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                  className="text-center text-lg h-14 border-gray-200 focus:border-red-400 focus:ring-red-100 rounded-2xl"
                />
              </div>
            )}

            {/* Step 1 — Segmento */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Qual o segmento?</h2>
                  <p className="text-gray-400 text-sm">Escolha o segmento que melhor define a empresa</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar segmento..."
                    value={segSearch}
                    onChange={e => setSegSearch(e.target.value)}
                    className="pl-9 rounded-2xl border-gray-200"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.slice(0, 8).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSegCategory(cat)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium transition-all',
                        segCategory === cat ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {filteredSegments.map(seg => (
                    <button
                      key={seg.label}
                      onClick={() => setForm(f => ({ ...f, segment: seg.label }))}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-xl text-sm text-left transition-all border',
                        form.segment === seg.label
                          ? 'bg-red-50 border-red-400 text-red-700 font-medium'
                          : 'bg-gray-50 border-gray-100 text-gray-700 hover:border-red-200 hover:bg-red-50/50'
                      )}
                    >
                      {form.segment === seg.label && <Check className="w-3 h-3 shrink-0 text-red-600" />}
                      <span className="truncate">{seg.label}</span>
                    </button>
                  ))}
                </div>
                {form.segment && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                    <Check className="w-4 h-4 shrink-0" />
                    <span><strong>Selecionado:</strong> {form.segment}</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Formato */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Formato do vídeo</h2>
                  <p className="text-gray-400 text-sm">Escolha o formato do painel onde o vídeo vai rodar</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setForm(f => ({ ...f, format: 'vertical' }))}
                    className={cn(
                      'relative p-5 rounded-2xl border-2 transition-all text-left group',
                      form.format === 'vertical'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-200 bg-white'
                    )}
                  >
                    {form.format === 'vertical' && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-20 bg-gradient-to-b from-red-600 to-red-800 rounded-lg shadow-md flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">Vertical</div>
                    <div className="text-xs text-gray-500 mt-1">1080×1920px • 15s</div>
                    <div className="text-xs text-red-500 mt-1 font-medium">3 empresas por ciclo</div>
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, format: 'horizontal' }))}
                    className={cn(
                      'relative p-5 rounded-2xl border-2 transition-all text-left group',
                      form.format === 'horizontal'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-200 bg-white'
                    )}
                  >
                    {form.format === 'horizontal' && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="flex justify-center mb-3">
                      <div className="w-20 h-12 bg-gradient-to-r from-red-600 to-red-800 rounded-lg shadow-md flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">Horizontal</div>
                    <div className="text-xs text-gray-500 mt-1">1440×1080px • 10s</div>
                    <div className="text-xs text-red-500 mt-1 font-medium">15 empresas por ciclo</div>
                  </button>
                </div>

                {/* QR Code */}
                <div
                  onClick={() => setForm(f => ({ ...f, hasQrCode: !f.hasQrCode }))}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                    form.hasQrCode ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'
                  )}
                >
                  <QrCode className={cn('w-5 h-5', form.hasQrCode ? 'text-red-600' : 'text-gray-400')} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Incluir QR Code?</div>
                    <div className="text-xs text-gray-400">Aparece por mínimo 5s com texto de ação</div>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                    form.hasQrCode ? 'border-red-500 bg-red-600' : 'border-gray-300'
                  )}>
                    {form.hasQrCode && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Quantidade e tipos */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Quantos vídeos?</h2>
                  <p className="text-gray-400 text-sm">Você pode ter até 10 slots por campanha</p>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setForm(f => ({ ...f, videoCount: n }))}
                      className={cn(
                        'h-12 rounded-xl font-bold text-lg transition-all',
                        form.videoCount === n
                          ? 'bg-red-600 text-white shadow-lg shadow-red-200 scale-105'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {form.videoCount && (
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3 text-center">
                    {VIDEO_COUNT_TIPS[form.videoCount]}
                  </p>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Tipos de vídeo <span className="text-gray-400 font-normal">(opcional — selecione os que quiser)</span></p>
                  <div className="grid grid-cols-2 gap-2">
                    {VIDEO_TYPES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => toggleVideoType(t.id)}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all',
                          form.videoTypes.includes(t.id)
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-100 bg-gray-50 hover:border-red-200'
                        )}
                      >
                        <t.icon className={cn('w-4 h-4 mt-0.5 shrink-0', form.videoTypes.includes(t.id) ? 'text-red-600' : 'text-gray-400')} />
                        <div>
                          <div className="text-xs font-semibold text-gray-900">{t.label}</div>
                          <div className="text-xs text-gray-400">{t.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Tom + extras */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Tom e detalhes finais</h2>
                  <p className="text-gray-400 text-sm">Como você quer que a mensagem soe?</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {TONES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setForm(f => ({ ...f, tone: t.id }))}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                        form.tone === t.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-100 bg-gray-50 hover:border-red-200'
                      )}
                    >
                      <span className="text-xl">{t.emoji}</span>
                      <span className={cn('text-xs font-medium', form.tone === t.id ? 'text-red-700' : 'text-gray-600')}>{t.label}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Informações extras <span className="text-gray-400 font-normal">(promoção, produto, diferenciais...)</span>
                  </label>
                  <Textarea
                    placeholder="Ex: 20% de desconto em consultas até sexta-feira, fone (45) 99999-9999, 10 anos de experiência..."
                    value={form.extraInfo}
                    onChange={e => setForm(f => ({ ...f, extraInfo: e.target.value }))}
                    className="resize-none rounded-2xl border-gray-200 focus:border-red-400 min-h-[100px]"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Navegação */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className="gap-2 text-gray-500"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>

              {step < 4 ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canAdvance()}
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-6"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !canAdvance()}
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 shadow-lg shadow-red-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando roteiro...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Gerar {form.videoCount} roteiro{form.videoCount > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── RESULTADO ── */}
        {activeTab === 'gerar' && result && (
          <div ref={resultRef} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Roteiros gerados</h2>
                <p className="text-sm text-gray-400">{form.companyName} · {form.segment}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(result)}
                  className="gap-1.5 rounded-xl text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar tudo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="gap-1.5 rounded-xl text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  Novo roteiro
                </Button>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 overflow-x-auto">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                {result}
              </div>
            </div>
          </div>
        )}

        {/* ── ABA: HISTÓRICO ── */}
        {activeTab === 'historico' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {historyLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-red-400" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum roteiro gerado ainda.</p>
                <button
                  onClick={() => setActiveTab('gerar')}
                  className="mt-3 text-red-600 text-sm font-medium hover:underline"
                >
                  Gerar primeiro roteiro
                </button>
              </div>
            ) : (
              history.map(r => (
                <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{r.company_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.segment}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs capitalize border-red-200 text-red-600">
                        {r.format === 'vertical' ? '9:16 · 15s' : '16:9 · 10s'}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                        {r.video_count} vídeo{r.video_count > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 max-h-32 overflow-hidden line-clamp-4 mb-3">
                    {r.roteiro_content.substring(0, 300)}...
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(r.roteiro_content)}
                        className="h-7 px-2 text-xs gap-1 text-gray-500"
                      >
                        <Copy className="w-3 h-3" />
                        Copiar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRoteiro(r.id)}
                        className="h-7 px-2 text-xs gap-1 text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeradorRoteiros;
