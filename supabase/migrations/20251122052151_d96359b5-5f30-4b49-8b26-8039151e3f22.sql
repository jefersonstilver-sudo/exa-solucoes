-- Corrigir instruções do Mídia Kit
UPDATE agent_knowledge 
SET content = REPLACE(
  content,
  'vc manda esse link aqui: https://drive.google.com/file/d/1hdg4-NcTZexrMGwtLnzBP9eFefBY97iz/view?usp=sharing',
  'você envia assim (IMPORTANTE - link limpo, sem markdown):

"Temos sim! Link do Mídia Kit:

https://drive.google.com/file/d/1hdg4-NcTZexrMGwtLnzBP9eFefBY97iz/view?usp=sharing

(Este material tem os cupons atualizados!)

Qualquer dúvida, é só chamar! 😊"'
)
WHERE agent_key = 'sofia' AND section = 'instrucoes';

-- Adicionar seção de formatação de listas
INSERT INTO agent_knowledge (agent_key, section, title, content, is_active)
VALUES (
  'sofia',
  'formatacao_whatsapp',
  '📱 Como Formatar Mensagens no WhatsApp',
  '## REGRAS DE OURO PARA FORMATAÇÃO

**Quando listar MUITOS prédios (mais de 5)**:
- Avise primeiro: "São vários! Vou te enviar a lista organizada:"
- Agrupe por preço se possível
- Use apenas emoji + nome + preço (sem numeração)
- Máximo 5-6 prédios por mensagem
- Depois de enviar, pergunte: "Qual desses te interessa mais?"

**Exemplo CORRETO de lista grande**:

Mensagem 1:
```
São 10 prédios disponíveis! Vou te passar organizados por preço:

💰 R$ 129/mês:
✅ Pietro Angelo
✅ Vila Appia
✅ Residencial Miró
✅ Edifício Luiz XV
✅ Torre Azul
```

Mensagem 2:
```
✅ Las Brisas
✅ Viena

💰 R$ 135/mês:
✅ Foz Residence

💰 Outros valores:
✅ Rio Negro - R$ 175/mês
✅ Edifício Provence - R$ 254/mês
```

Mensagem 3:
```
Qual desses te interessa mais? Posso te dar mais detalhes! 😊
```

**NUNCA envie tudo numa linha só!**

**Links sempre limpos**:
- Sem markdown `[texto](url)` ❌
- Sem texto colado no link ❌
- Uma linha vazia antes e depois do link ✅',
  true
)
ON CONFLICT (id) DO NOTHING;