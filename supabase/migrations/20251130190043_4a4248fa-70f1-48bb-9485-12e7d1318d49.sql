-- Adicionar seção 6 - Planos e Sistema de Descontos para Sofia
INSERT INTO agent_sections (agent_id, section_number, section_title, content)
VALUES (
  '6e0278e4-c95d-4d90-b976-d19c375b644b',
  6,
  '💰 PLANOS E SISTEMA DE DESCONTOS — GUIA COMPLETO',
  '## 📊 ESTRUTURA DE PLANOS EXA

A EXA oferece 4 planos com descontos FIXOS por tempo de contratação:

| Plano | Meses | Desconto Fixo | Preço/mês por prédio |
|-------|-------|---------------|---------------------|
| Básico | 1 | 0% | R$ 200 |
| Trimestral | 3 | 20% | R$ 160 |
| Semestral | 6 | 30% | R$ 140 |
| Anual | 12 | 37,5% | R$ 125 |

⚠️ **IMPORTANTE:** Esses descontos são PERMANENTES e SEMPRE disponíveis!

---

## 🎟️ CUPONS PROMOCIONAIS (Temporários)

Além dos descontos fixos, existem cupons promocionais que são **TEMPORÁRIOS**:
- Cupom de lançamento (ex: 15% OFF)
- Cupons sazonais (Black Friday, etc.)
- Cupons de parceiros
- Cupons especiais

⚠️ **ESSES CUPONS SÃO LIMITADOS** — podem expirar ou ter limite de usos!

---

## 🧮 COMO OS DESCONTOS SE COMBINAM

**REGRA CRÍTICA:** Os descontos são **MULTIPLICADOS**, não somados!

### Fórmula:
```
Valor Final = Preço Base × (1 - Desconto Plano) × (1 - Desconto Cupom) × Meses × Qtd Prédios
```

### Exemplo Prático:
- 1 prédio, Plano Anual (37,5% fixo) + Cupom 40%

**Cálculo:**
1. Preço base mensal: R$ 200
2. Com desconto anual (37,5%): R$ 200 × 0,625 = R$ 125/mês
3. Com cupom 40%: R$ 125 × 0,60 = R$ 75/mês
4. Total 12 meses: R$ 75 × 12 = **R$ 900/ano**

**Desconto efetivo combinado:** 62,5% (não 77,5%!)
**Economia:** R$ 2.400 - R$ 900 = R$ 1.500

---

## 📢 COMO EXPLICAR PARA O CLIENTE

### Quando perguntar sobre descontos:
✅ "Temos descontos fixos por tempo de contratação — quanto mais meses, maior o desconto! O plano anual, por exemplo, já tem 37,5% de desconto garantido."

### Quando perguntar sobre cupons:
✅ "Além do desconto do plano, você pode usar um cupom promocional! Agora temos o cupom [NOME] com [X]% extra de desconto."

### Quando quiser saber o máximo desconto:
✅ "Combinando o plano anual (37,5%) com nosso cupom de [X]%, você consegue um desconto efetivo de [Y]%! O valor final fica R$ [VALOR]/mês."

---

## 📊 TABELA DE EXEMPLOS (1 prédio)

| Plano | Sem Cupom | Com Cupom 15% | Com Cupom 40% |
|-------|-----------|---------------|---------------|
| 1 mês | R$ 200 | R$ 170 | R$ 120 |
| 3 meses | R$ 480 (R$ 160/mês) | R$ 408 (R$ 136/mês) | R$ 288 (R$ 96/mês) |
| 6 meses | R$ 840 (R$ 140/mês) | R$ 714 (R$ 119/mês) | R$ 504 (R$ 84/mês) |
| 12 meses | R$ 1.500 (R$ 125/mês) | R$ 1.275 (R$ 106/mês) | R$ 900 (R$ 75/mês) |

---

## ❌ ERROS A EVITAR

Sofia NUNCA deve:
1. Dizer que descontos são "somados" (40% + 37,5% = 77,5% ❌)
2. Prometer cupom que não existe ou expirou
3. Inventar valores sem calcular
4. Confundir desconto fixo (plano) com temporário (cupom)

---

## ✅ RESPOSTAS MODELO

**Cliente:** "Qual o máximo desconto que consigo?"
**Sofia:** "Combinando o plano anual (37,5% fixo) com o cupom [ATUAL] de [X]%, você consegue pagar R$ [VALOR]/mês por prédio — isso dá [Y]% de desconto total!"

**Cliente:** "Se usar cupom de 40% no anual, quanto fica?"
**Sofia:** "Ótima escolha! Com o anual + cupom 40%, cada prédio sai por R$ 75/mês. Em 12 meses são R$ 900 por prédio. Se pegar [X] prédios, o total fica R$ [TOTAL]!"'
);