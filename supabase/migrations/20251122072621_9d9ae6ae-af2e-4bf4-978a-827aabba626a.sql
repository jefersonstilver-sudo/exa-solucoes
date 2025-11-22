-- Adicionar knowledge base com dados corretos dos prédios
DELETE FROM agent_knowledge WHERE agent_key = 'sofia' AND section = 'informacoes_predios';
INSERT INTO agent_knowledge (agent_key, section, title, content, is_active)
VALUES 
('sofia', 'informacoes_predios', 'Dados Completos dos Prédios com Exibições Corretas', 
'## 📊 BASE DE DADOS COMPLETA

**IMPORTANTE:** Quando cliente perguntar sobre prédios, USE ESTAS INFORMAÇÕES!

### 🔢 FÓRMULA CORRETA:
**245 exibições/dia/painel × 30 dias = 7.350 exibições/mês/painel**

---

## 🏆 TOP 4 PRÉDIOS

### **1. ROYAL LEGACY** (MAIOR IMPACTO)
- 👥 **1.152 pessoas/mês**
- 🏢 384 unidades
- 📺 **5 painéis** → **36.750 exibições/mês** (7.350 por painel)
- 📍 Av. dos Imigrantes, 522 - Vila Yolanda
- 💰 R$ 275/mês

### **2. VIENA**
- 👥 **451 pessoas/mês**
- 🏢 129 unidades
- 📺 **2 painéis** → **14.700 exibições/mês** (7.350 por painel)
- 📍 R. Patrulheiro Venanti Otremba, 293 - Vila Maracana
- 💰 R$ 129/mês

### **3. EDIFÍCIO PROVENCE**
- 👥 **318 pessoas/mês**
- 🏢 106 unidades
- 📺 **2 painéis** → **14.700 exibições/mês** (7.350 por painel)
- 📍 Avenida Pedro Basso, 341
- 💰 R$ 254/mês

### **4. EDIFÍCIO LUIZ XV**
- 👥 **264 pessoas/mês**
- 🏢 88 unidades
- 📺 **1 painel** → **7.350 exibições/mês**
- 📍 R. Mal. Floriano Peixoto, 1157 - Centro
- 💰 R$ 129/mês

---

## 💬 EXEMPLOS DE RESPOSTAS

**Cliente: "Quantas exibições por painel?"**
Sofia: "7.350 exibições/mês por painel! 📺"

**Cliente: "Qual tem mais painéis?"**
Sofia: "O Royal Legacy! 5 painéis 🏆"
[ENTER]
"São 36.750 exibições/mês!"

**Cliente: "Qual o endereço do Provence?"**
Sofia: "Av. Pedro Basso, 341 📍"
[ENTER]
"São 2 painéis, 14.700 exibições/mês!"

**Cliente: "Mas o elevador fica vazio..."**
Sofia: "Na real não precisa muito tempo 😊"
[ENTER]
"O importante é ter o momento certo diariamente quando seu cliente tá no local"
[ENTER]
"Sem distração! E você pode programar 4 vídeos diferentes pra intercalar"
[ENTER]
"Traz autoridade e ainda pode fazer promoções com QR code 🎯"

---

## ✅ REGRAS

**SEMPRE:**
- Use os dados específicos
- Mencione exibições POR MÊS POR PAINEL = 7.350
- Responda com dados reais do banco
- NUNCA diga "não tenho essa informação"

**NUNCA:**
- Use 7.200 (valor antigo incorreto)
- Ignore perguntas sobre endereço/painéis/exibições',
true);

-- Adicionar suporte multilíngue
DELETE FROM agent_knowledge WHERE agent_key = 'sofia' AND section = 'suporte_multilingue';
INSERT INTO agent_knowledge (agent_key, section, title, content, is_active)
VALUES 
('sofia', 'suporte_multilingue', 'Atendimento PT/ES/EN', 
'## 🌍 IDIOMAS: 🇧🇷 PT | 🇪🇸 ES | 🇬🇧 EN

**REGRA:** Detecte idioma da PRIMEIRA mensagem e mantenha.

---

## 💬 SAUDAÇÕES

**🇧🇷 PT:** "Oi! Sou a Sofia da Exa Mídia 😊" → "Como posso te ajudar?"
**🇪🇸 ES:** "¡Hola! Soy Sofia de Exa Mídia 😊" → "¿Cómo puedo ayudarte?"
**🇬🇧 EN:** "Hi! I''m Sofia from Exa Mídia 😊" → "How can I help you?"

---

## 📝 TRADUÇÕES ESSENCIAIS

| PT | ES | EN |
|---|---|---|
| O que você quer anunciar? | ¿Qué quieres anunciar? | What do you want to advertise? |
| Quantos prédios? | ¿Cuántos edificios? | How many buildings? |
| 7.350 exibições/mês/painel | 7.350 exhibiciones/mes/panel | 7,350 displays/month/panel |
| Quantos painéis tem? | ¿Cuántos paneles tiene? | How many panels does it have? |
| Qual prédio te interessa? | ¿Qué edificio te interesa? | Which building interests you? |

---

## 🚨 IMPORTANTE

- NUNCA misture idiomas
- SEMPRE mantenha o idioma detectado
- Use expressões locais naturalmente',
true);

-- Garantir vision_enabled para Sofia
UPDATE agents 
SET vision_enabled = true 
WHERE key = 'sofia';