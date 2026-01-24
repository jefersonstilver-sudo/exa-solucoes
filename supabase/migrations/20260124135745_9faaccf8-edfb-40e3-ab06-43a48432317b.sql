-- ============================================
-- EVOLUÇÃO DO BANCO PARA EXA LEGAL FLOW
-- Sistema Jurídico com IA Generativa
-- ============================================

-- 1. Novas colunas em contratos_legais para suportar IA
ALTER TABLE public.contratos_legais
ADD COLUMN IF NOT EXISTS contexto_ia TEXT,
ADD COLUMN IF NOT EXISTS gatilhos_condicionais JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dados_parceiro_snapshot JSONB,
ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS modo_entrada TEXT DEFAULT 'manual';

COMMENT ON COLUMN public.contratos_legais.contexto_ia IS 'Resumo do que o usuário pediu ou áudio transcrito';
COMMENT ON COLUMN public.contratos_legais.gatilhos_condicionais IS 'Regras condicionais como {"target": "50_telas", "action": "liberar_banner"}';
COMMENT ON COLUMN public.contratos_legais.dados_parceiro_snapshot IS 'Cópia fiel dos dados do parceiro no momento do contrato';
COMMENT ON COLUMN public.contratos_legais.health_score IS 'Pontuação de completude jurídica (0-100)';
COMMENT ON COLUMN public.contratos_legais.modo_entrada IS 'Como o contrato foi criado: manual, voz, arquivo, ia';

-- 2. Tabela de prompts da IA jurídica
CREATE TABLE IF NOT EXISTS public.juridico_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  few_shot_examples JSONB DEFAULT '[]'::jsonb,
  temperatura NUMERIC(3,2) DEFAULT 0.2,
  modelo TEXT DEFAULT 'gpt-4o',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para juridico_prompts
ALTER TABLE public.juridico_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "juridico_prompts_select_authenticated" ON public.juridico_prompts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "juridico_prompts_all_super_admin" ON public.juridico_prompts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'admin')
    )
  );

-- 3. Inserir prompt base com exemplos do Portal da Cidade e SECOVI
INSERT INTO public.juridico_prompts (codigo, titulo, system_prompt, few_shot_examples) VALUES
('juridico_brain', 'Cérebro Jurídico EXA', 
'Você é o advogado digital sênior da INDEXA MIDIA LTDA (CNPJ: 38.142.638/0001-30). Seu papel é estruturar contratos jurídicos válidos.

REGRAS IMUTÁVEIS:
1. Contratada: INDEXA MIDIA LTDA
2. Representante: Jeferson Stilver Rodrigues Encina (CPF: 055.031.279-00)
3. Endereço: Avenida Paraná, 974 - Sala 301, Centro, Foz do Iguaçu - PR, CEP 85851-180
4. Foro: Comarca de Foz do Iguaçu/PR
5. Multa padrão: 20% do valor remanescente
6. NUNCA use nomes antigos como "EXA Soluções" ou "Natália"

PROCESSO DE ANÁLISE:
1. Analise o contexto fornecido (texto, transcrição de áudio ou documento)
2. Identifique o tipo de contrato (permuta, parceria, comodato, anunciante)
3. Extraia obrigações imediatas e gatilhos condicionais
4. Detecte riscos e cláusulas potencialmente abusivas
5. Gere cláusulas jurídicas válidas
6. Retorne JSON estruturado + HTML formatado

TIPOS DE CONTRATO SUPORTADOS:
- termo_aceite: Autorização do síndico para instalação
- comodato: Cessão gratuita de espaço e energia
- anunciante: Venda de mídia em elevadores
- parceria_clt: Contratação de funcionário parceiro
- parceria_pj: Contratação de PJ parceiro
- permuta: Troca de serviços/produtos sem valor monetário

ESTRUTURA DE RESPOSTA JSON:
{
  "tipo_contrato": "string",
  "parceiro": { "nome": "string", "tipo_pessoa": "PF|PJ", "documento": "string" },
  "objeto": "string",
  "obrigacoes_indexa": ["string"],
  "obrigacoes_parceiro": ["string"],
  "gatilhos_condicionais": [{ "condicao": "string", "acao": "string", "prazo": "string" }],
  "riscos_detectados": [{ "nivel": "baixo|medio|alto|critico", "descricao": "string", "sugestao": "string" }],
  "valor_financeiro": number | null,
  "prazo_meses": number,
  "clausulas_geradas": [{ "titulo": "string", "conteudo": "string" }],
  "health_score": number
}',
'[
  {
    "input": "Temos um acordo com o Portal da Cidade. Eles nos dão notícias e câmeras ao vivo. Nós damos um banner no site deles, MAS SÓ DEPOIS que a gente instalar 50 telas na cidade.",
    "output": {
      "tipo_contrato": "permuta",
      "parceiro": { "nome": "Portal da Cidade", "tipo_pessoa": "PJ", "documento": "" },
      "objeto": "Parceria de mídia para exibição de conteúdo jornalístico em troca de publicidade digital",
      "obrigacoes_indexa": ["Exibir notícias do parceiro nos painéis de elevadores", "Transmitir câmeras ao vivo nos painéis", "Disponibilizar banner no site do parceiro após atingir meta"],
      "obrigacoes_parceiro": ["Fornecer feed de notícias atualizadas", "Disponibilizar acesso às câmeras ao vivo"],
      "gatilhos_condicionais": [{ "condicao": "telas_instaladas >= 50", "acao": "Disponibilizar espaço publicitário (banner) no site do parceiro", "prazo": "Imediato após cumprimento" }],
      "riscos_detectados": [],
      "valor_financeiro": null,
      "prazo_meses": 12,
      "clausulas_geradas": [
        { "titulo": "DO OBJETO", "conteudo": "O presente instrumento tem por objeto a cooperação mútua entre as partes para troca de serviços de mídia digital." },
        { "titulo": "DA CONDIÇÃO SUSPENSIVA", "conteudo": "A obrigação da CONTRATADA de disponibilizar espaço publicitário no site do PARCEIRO somente se tornará exigível após a implementação mínima de 50 (cinquenta) painéis digitais em elevadores." }
      ],
      "health_score": 85
    }
  },
  {
    "input": "Parceria com o SECOVI. Vamos cuidar do marketing deles em 2026. Eles vão colocar nosso logo no site como Parceira Exclusiva. Sem troca de dinheiro.",
    "output": {
      "tipo_contrato": "permuta",
      "parceiro": { "nome": "SECOVI", "tipo_pessoa": "PJ", "documento": "" },
      "objeto": "Cooperação institucional para fortalecimento mútuo de marca e serviços de marketing",
      "obrigacoes_indexa": ["Gestão completa de marketing digital do parceiro durante 2026", "Criação de materiais promocionais", "Gestão de redes sociais"],
      "obrigacoes_parceiro": ["Exibir logo da INDEXA como Parceira Exclusiva no site oficial", "Mencionar parceria em materiais institucionais"],
      "gatilhos_condicionais": [],
      "riscos_detectados": [],
      "valor_financeiro": null,
      "prazo_meses": 12,
      "clausulas_geradas": [
        { "titulo": "DO OBJETO", "conteudo": "O presente instrumento tem por objeto a cooperação institucional para fortalecimento mútuo de marca." },
        { "titulo": "DA EXCLUSIVIDADE", "conteudo": "O PARCEIRO compromete-se a exibir a marca INDEXA MIDIA como PARCEIRA EXCLUSIVA em seu site oficial durante a vigência deste contrato." },
        { "titulo": "DA AUSÊNCIA DE ONEROSIDADE", "conteudo": "O presente acordo não envolve contraprestação financeira entre as partes." }
      ],
      "health_score": 90
    }
  },
  {
    "input": "Instalação no Pietro Angelo. Síndico Marcelo Bordin. CPF 123.456.789-00.",
    "output": {
      "tipo_contrato": "comodato",
      "parceiro": { "nome": "Marcelo Bordin", "tipo_pessoa": "PF", "documento": "123.456.789-00" },
      "objeto": "Cessão gratuita de espaço e fornecimento de energia elétrica para instalação de painéis digitais",
      "obrigacoes_indexa": ["Fornecer e instalar equipamentos digitais", "Realizar manutenção preventiva e corretiva", "Responsabilidade civil sobre os equipamentos"],
      "obrigacoes_parceiro": ["Ceder espaço no elevador para instalação", "Fornecer energia elétrica para funcionamento", "Permitir acesso para manutenção"],
      "gatilhos_condicionais": [],
      "riscos_detectados": [],
      "valor_financeiro": null,
      "prazo_meses": 60,
      "clausulas_geradas": [
        { "titulo": "DO OBJETO", "conteudo": "O COMODANTE cede gratuitamente espaço no interior do(s) elevador(es) do condomínio para instalação de painéis digitais de propriedade da COMODATÁRIA." },
        { "titulo": "DA ENERGIA ELÉTRICA", "conteudo": "O COMODANTE se responsabiliza pelo fornecimento de energia elétrica necessária ao funcionamento dos equipamentos." },
        { "titulo": "DA RESPONSABILIDADE", "conteudo": "A COMODATÁRIA é a única responsável civil pelos equipamentos instalados e por eventuais danos causados por estes." }
      ],
      "health_score": 95
    }
  }
]'::jsonb)
ON CONFLICT (codigo) DO UPDATE SET
  system_prompt = EXCLUDED.system_prompt,
  few_shot_examples = EXCLUDED.few_shot_examples,
  updated_at = now();

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_contratos_health_score ON public.contratos_legais(health_score);
CREATE INDEX IF NOT EXISTS idx_contratos_modo_entrada ON public.contratos_legais(modo_entrada);
CREATE INDEX IF NOT EXISTS idx_juridico_prompts_codigo ON public.juridico_prompts(codigo);