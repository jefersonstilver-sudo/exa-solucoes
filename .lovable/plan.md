
# Corrigir Ticker: Hover sem Reset + Cor Integrada ao Header

## Problemas identificados

1. **Hover reseta a animacao**: O `useEffect` principal (que cria a animacao) tem `isPaused` como dependencia. Quando o mouse entra/sai, `isPaused` muda, o effect re-executa e recria a animacao do zero -- voltando ao inicio. Ja existe um segundo `useEffect` (linhas 79-84) que controla o `animationPlayState` separadamente, mas ele e anulado pelo primeiro que recria tudo.

2. **Cor diferente do header**: O header usa `from-[#4a0f0f] via-[#6B1515] to-[#7D1818]` (gradiente escuro). O ticker usa `bg-[#9C1E1E]` (vermelho mais claro). Precisa usar o mesmo tom final do gradiente do header (`#7D1818`) para integrar visualmente.

## Solucao

### Arquivo: `src/components/exa/LogoTicker.tsx`

1. **Remover `isPaused` da lista de dependencias** do useEffect principal (linha 76). Isso impede que a animacao seja recriada ao pausar/retomar. O controle de pause/resume ja funciona corretamente pelo segundo useEffect (linhas 79-84) que so altera `animationPlayState`.

2. **Remover `track.style.animationPlayState = isPaused ? 'paused' : 'running'`** de dentro do useEffect principal (linha 71), deixando apenas a criacao da animacao. O play state sera controlado exclusivamente pelo segundo useEffect.

### Arquivo: `src/pages/public/PropostaPublicaPage.tsx`

1. **Mudar a cor do wrapper do ticker** de `bg-[#9C1E1E]` para `bg-[#7D1818]` (linha 1861), que e o tom final do gradiente do header, criando continuidade visual perfeita.

### Arquivo: `src/components/exa/LogoTicker.tsx` (cor interna)

1. **Mudar a cor interna do ticker container** de `bg-[#9C1E1E]` para `bg-[#7D1818]` no div do ticker (linha 222), para que o fundo das logos combine com o wrapper.

## Resultado

- Hover pausa suavemente a rolagem, o usuario ve a logo que estava olhando
- Ao tirar o mouse, a rolagem continua exatamente de onde parou
- A cor do ticker integra perfeitamente com o header da proposta, sem corte visual
