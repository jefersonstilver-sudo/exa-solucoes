-- Atualizar display_order dos 14 knowledge items (4.1 a 4.14)
UPDATE agent_knowledge_items SET display_order = 1 WHERE id = '4a761409-4712-4736-8fd7-fef87687484b';
UPDATE agent_knowledge_items SET display_order = 2 WHERE id = 'fca64444-8300-45b0-81e7-31cc62c0af23';
UPDATE agent_knowledge_items SET display_order = 3 WHERE id = 'fe490c26-3ac3-4482-b158-37d57360ccb1';
UPDATE agent_knowledge_items SET display_order = 4 WHERE id = 'fdc68493-887d-4f76-94ff-8a4d61200902';
UPDATE agent_knowledge_items SET display_order = 5 WHERE id = '0eee8178-bc38-44ed-899d-3f1205b41831';
UPDATE agent_knowledge_items SET display_order = 6 WHERE id = '31909338-ea89-4d2e-b900-d6564494aec3';
UPDATE agent_knowledge_items SET display_order = 7 WHERE id = '7059fdbf-0c6c-4914-a63f-4a34c28f64ad';
UPDATE agent_knowledge_items SET display_order = 8 WHERE id = 'f63482e3-ee96-44be-b703-4cb2c059d140';
UPDATE agent_knowledge_items SET display_order = 9 WHERE id = '0aab0744-8409-4d8f-8e4d-01c018da5f2e';
UPDATE agent_knowledge_items SET display_order = 10 WHERE id = '8ce85fd6-8bb5-409c-b97a-2f384dc0bdf1';
UPDATE agent_knowledge_items SET display_order = 11 WHERE id = '97ba0d8e-bb93-4bfd-8991-596c2848e7ea';
UPDATE agent_knowledge_items SET display_order = 12 WHERE id = '91012d66-b19a-4c3b-97b6-b8a5c9fe2149';
UPDATE agent_knowledge_items SET display_order = 13 WHERE id = '35e446d4-0931-4176-8129-fce6eb260b94';
UPDATE agent_knowledge_items SET display_order = 14 WHERE id = 'ff52fdd8-e701-4ab0-b8d2-9a15ccf127e0';

-- Vincular os 14 itens ao agente Sofia
UPDATE agents
SET kb_ids = jsonb_build_array(
  '4a761409-4712-4736-8fd7-fef87687484b',
  'fca64444-8300-45b0-81e7-31cc62c0af23',
  'fe490c26-3ac3-4482-b158-37d57360ccb1',
  'fdc68493-887d-4f76-94ff-8a4d61200902',
  '0eee8178-bc38-44ed-899d-3f1205b41831',
  '31909338-ea89-4d2e-b900-d6564494aec3',
  '7059fdbf-0c6c-4914-a63f-4a34c28f64ad',
  'f63482e3-ee96-44be-b703-4cb2c059d140',
  '0aab0744-8409-4d8f-8e4d-01c018da5f2e',
  '8ce85fd6-8bb5-409c-b97a-2f384dc0bdf1',
  '97ba0d8e-bb93-4bfd-8991-596c2848e7ea',
  '91012d66-b19a-4c3b-97b6-b8a5c9fe2149',
  '35e446d4-0931-4176-8129-fce6eb260b94',
  'ff52fdd8-e701-4ab0-b8d2-9a15ccf127e0'
)
WHERE key = 'sofia';

-- Atualizar conteúdo da Seção 4
UPDATE agent_sections
SET 
  content = '## SEÇÃO 4: BASE DE CONHECIMENTO & DOCUMENTOS

A Sofia tem acesso a 14 knowledge items organizados como **4.1 a 4.14**:

### 📚 DOCUMENTOS PRINCIPAIS (4.1-4.2)
- **4.1:** MÍDIA KIT (link) - Apresentação completa da empresa
- **4.2:** VIDEO INSTITUCIONAL (link) - Conteúdo visual institucional

### 🛒 PROCESSO DE COMPRA (4.3-4.4)
- **4.3:** Guia Completo de Compra - Passo a passo do checkout
- **4.4:** Manual do Anunciante - Como funciona o processo completo

### 📋 TEMPLATES & FORMATAÇÃO (4.5-4.8)
- **4.5:** Template WhatsApp - Apresentação de Prédios (OBRIGATÓRIO)
- **4.6:** EXA Institucional - Quem somos, missão, proposta
- **4.7:** Engajamento Humanizado - Como conversar naturalmente
- **4.8:** Lista por Exibições - Formato para ordenação por visualizações

### 💰 PREÇOS & DESCONTOS (4.9-4.10)
- **4.9:** Cupons Vigentes - Sistema de descontos por quantidade
- **4.10:** Quantidade de Prédios, Telas & Orçamento ⭐ **ITEM CRÍTICO**

### 🏢 ATENDIMENTO ESPECIALIZADO (4.11-4.12)
- **4.11:** Atendimento a Síndicos - Fluxo para parceiros
- **4.12:** Ranking por Exibições ⭐ **ITEM CRÍTICO**

### ℹ️ INFORMAÇÕES GERAIS (4.13-4.14)
- **4.13:** Produto EXA - Telas, campanhas, diferenciais
- **4.14:** Endereço e Contato - Dados oficiais da empresa

## REGRAS DE USO:
- Sofia SEMPRE consulta **4.10** para orçamentos e TOP 10 por telas
- Sofia SEMPRE consulta **4.12** para rankings por exibições
- Ao mencionar conhecimento, usar o número de referência (ex: "conforme 4.10")
- Template 4.5 é OBRIGATÓRIO para apresentar prédios',
  updated_at = NOW()
WHERE agent_id = 'sofia' AND section_number = 4;