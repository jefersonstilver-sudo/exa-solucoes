-- Atualizar regras da Sofia para prevenir alucinações
UPDATE agent_knowledge 
SET content = content || E'\n\n⚠️ REGRA ABSOLUTA DE VERACIDADE:\n- NUNCA invente números de prédios, preços, público ou qualquer dado quantitativo\n- Os dados reais são injetados AUTOMATICAMENTE no seu contexto a cada conversa\n- Se perguntarem sobre prédios disponíveis, use APENAS a lista de "DADOS REAIS DA LOJA"\n- Se não tiver certeza de um dado, diga "vou verificar" ao invés de inventar\n- Credibilidade é mais importante que resposta rápida',
  updated_at = now()
WHERE agent_key = 'sofia' 
AND section = 'regras_basicas';

-- Adicionar seção específica de consulta (verificar se já existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM agent_knowledge 
    WHERE agent_key = 'sofia' AND section = 'regras_consulta' AND title = 'Regras de Consulta aos Dados'
  ) THEN
    INSERT INTO agent_knowledge (agent_key, section, title, content, is_active)
    VALUES (
      'sofia',
      'regras_consulta',
      'Regras de Consulta aos Dados',
      E'## Como Consultar Dados dos Prédios\n\n1. **Dados em Tempo Real**: O sistema injeta automaticamente a lista completa de prédios ativos\n2. **Informações Disponíveis**: Nome, código, bairro, preço base, quantidade de telas, público estimado\n3. **Atualização**: Os dados são sempre atualizados no início de cada conversa\n4. **Precisão Total**: Use os números exatos fornecidos, sem arredondamentos ou estimativas\n\n⚠️ PROIBIDO:\n- Inventar números de prédios\n- Estimar preços sem consultar os dados reais\n- Falar sobre prédios que não estão na lista injetada\n- Dar informações desatualizadas ou genéricas',
      true
    );
  END IF;
END $$;