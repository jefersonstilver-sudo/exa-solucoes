

# Refatorar Preview do Ticker: Conter no Card + Ajuste Interativo de Logos

## Problema 1: Logos saindo do container vermelho

O componente `LogoTicker` usa `className="w-screen left-1/2 -translate-x-1/2"` (linha 161) que forca largura total da tela. Dentro do Card do admin, isso faz as logos transbordarem para fora do quadrado vermelho.

**Solucao:** Adicionar uma prop `contained` ao `LogoTicker` que, quando ativa, remove o `w-screen` e usa `w-full` com `overflow-hidden`. O admin passa `contained={true}`.

## Problema 2: Ajuste de tamanho direto no preview

Atualmente os botoes +/- ficam escondidos na lista abaixo e so aparecem no hover. O usuario quer clicar na logo diretamente no preview vermelho e ajustar ali.

**Solucao:** Criar um modo interativo no preview onde:
- Cada logo no preview e clicavel
- Ao clicar, a logo selecionada ganha um destaque visual (borda branca, glow)
- Aparece um painel flutuante abaixo do preview com controles de escala (slider + botoes +/-)
- A escala vai de 10% a 400% com feedback visual em tempo real
- Animacoes suaves (scale transition 300ms ease-out) estilo Apple
- Clicar fora ou em outra logo troca a selecao

## Alteracoes tecnicas

### Arquivo 1: `src/components/exa/LogoTicker.tsx`

- Adicionar prop `contained?: boolean` (default: false)
- Quando `contained=true`:
  - Remover `w-screen left-1/2 -translate-x-1/2` da section
  - Usar `w-full` com `overflow-hidden`
- Adicionar prop `onLogoClick?: (logoId: string) => void`
- Adicionar prop `selectedLogoId?: string | null`
- Quando `selectedLogoId` esta definido, a logo correspondente ganha classes de destaque (ring-2 ring-white/80 scale-110 z-10)

### Arquivo 2: `src/components/admin/LogosAdmin.tsx`

- Adicionar state `selectedPreviewLogo: string | null`
- Passar `contained={true}`, `onLogoClick`, `selectedLogoId` para o LogoTicker
- Abaixo do ticker preview, renderizar painel de controle quando uma logo esta selecionada:
  - Nome da logo selecionada
  - Slider de escala (0.1 a 4.0) com valor em porcentagem
  - Botoes - e + com incremento de 0.1
  - Botao "Resetar para 100%"
  - Transicao suave ao mudar escala (framer-motion ou CSS transition)
- O CardContent do preview recebe `overflow-hidden` para garantir contencao

### Arquivo 3: `src/components/exa/TickerLogoItem.tsx`

- Adicionar props `onClick?: () => void` e `isSelected?: boolean`
- Quando `isSelected=true`: aplicar `ring-2 ring-white shadow-lg shadow-white/20 scale-105 z-10 opacity-100` com transicao suave
- Quando `onClick` existe: `cursor-pointer` no container (prioridade sobre o link_url)

## Resultado esperado

- Preview do ticker 100% contido dentro do card vermelho
- Ao clicar em qualquer logo no preview, ela fica destacada com glow branco
- Painel elegante aparece abaixo com slider para ajustar escala de 10% a 400%
- Mudancas refletem em tempo real no preview com animacao suave
- Nenhuma outra funcionalidade e alterada

## Arquivos modificados

1. `src/components/exa/LogoTicker.tsx` -- prop contained + selecao
2. `src/components/exa/TickerLogoItem.tsx` -- click + destaque visual
3. `src/components/admin/LogosAdmin.tsx` -- painel de controle interativo

