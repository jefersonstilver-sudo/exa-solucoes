
# Correcoes no Ticker de Logos + Adicionar na Proposta Publica

## 3 problemas a resolver

### 1. Preview do Ticker no Admin - fundo escuro ilegivel

**Arquivo:** `src/components/admin/LogosAdmin.tsx` (linha 321-326)

O container do preview usa `bg-gradient-to-br from-exa-black via-[#9C1E1E]/10 to-exa-black` que resulta em fundo quase preto. O texto "confiam na EXA" usa gradiente de vermelho-para-preto que fica invisivel.

**Correcao:**
- Background: trocar para `bg-[#9C1E1E]` (vermelho solido oficial)
- Texto "confiam na EXA": trocar gradiente invisivel para `text-[#FFD700]` (dourado, contraste alto)

### 2. Botao de Zoom limitado a 300% - expandir para 400%

**Arquivo:** `src/components/admin/LogosAdmin.tsx`

Atualmente:
- `handleScaleUp` (linha 207): `Math.min(..., 3.0)` -- maximo 300%
- `handleScaleDown` (linha 229): `Math.max(..., 0.5)` -- minimo 50%
- Botao "+" desabilitado em `>= 3.0` (linha 525)

**Correcao:**
- Alterar limite maximo de `3.0` para `4.0` em `handleScaleUp`
- Alterar condicao de desabilitacao do botao "+" de `>= 3.0` para `>= 4.0`
- Mantém o minimo de 50% (0.5)

### 3. Ticker na Pagina Publica da Proposta

**Arquivo:** `src/pages/public/PropostaPublicaPage.tsx` (linhas 2712-2717)

Adicionar o componente `LogoTicker` entre o card "Contato Comercial" e o footer, com titulo "Empresas que confiam na EXA".

**Implementacao:**
- Importar `LogoTicker` de `@/components/exa/LogoTicker`
- Inserir secao full-width com fundo `bg-[#9C1E1E]` e cantos arredondados
- Titulo: "Empresas que confiam na EXA" em branco com destaque dourado
- Posicao: entre a linha 2712 (fim do card Contato) e a linha 2714 (footer)

## Detalhes tecnicos

### Arquivos modificados

1. **`src/components/admin/LogosAdmin.tsx`**
   - Linha 321: trocar background do preview
   - Linha 323: trocar estilo do texto
   - Linha 207: limite de zoom para 4.0
   - Linha 525: condicao desabilitacao para 4.0

2. **`src/pages/public/PropostaPublicaPage.tsx`**
   - Linha 3 (imports): adicionar LogoTicker
   - Linhas 2712-2714: inserir secao do ticker

Nenhum outro arquivo sera alterado. Toda funcionalidade existente permanece intacta.
