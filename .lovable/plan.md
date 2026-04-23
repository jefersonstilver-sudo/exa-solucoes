

# Correções na landing `/interessesindico`

## Problemas reportados

1. **Botão "Registrar interesse do meu prédio" não navega** para `/interessesindico/formulario` (na seção "Como Funciona", linha 66 de `ComoFuncionaSection.tsx`).
2. **Vídeo 1 (DemonstracaoSection) está lento** ao carregar — precisa ficar mais leve.
3. **Falta botão CTA no topo** da landing — abaixo de "Ver como funciona", precisa ter um "Quero no meu prédio" levando ao formulário.

## Investigação realizada

- O `<Link to="/interessesindico/formulario">` em `ComoFuncionaSection.tsx` linha 66 está correto sintaticamente. Possíveis causas de não navegar: rota não registrada no `App.tsx` (já corrigimos antes, vou re-confirmar), ou o `Link` não envolve a área clicável corretamente, ou está dentro de um wrapper que captura o clique.
- O `HeroSection.tsx` da landing tem um botão "Ver como funciona" mas NÃO tem CTA primário "Quero no meu prédio" levando direto ao formulário.
- O vídeo principal em `DemonstracaoSection.tsx` provavelmente carrega com `preload="auto"` ou sem otimização (lazy load + poster).

## Alterações

### 1. Garantir que a rota `/interessesindico/formulario` está registrada
Verificar `src/App.tsx` — se a rota não estiver lá (apesar das correções anteriores), adicionar. Caso já esteja, investigar se há algum `onClick` ou wrapper interceptando o evento no `Link`.

### 2. `src/components/interesse-sindico/HeroSection.tsx` — adicionar CTA principal
Logo abaixo do botão atual "Ver como funciona", adicionar um segundo botão (ou trocar a hierarquia) que leve direto a `/interessesindico/formulario`:
```tsx
<Link to="/interessesindico/formulario" className="cta-red">
  Quero no meu prédio
  <ArrowRight className="w-5 h-5" />
</Link>
```
Posicionado em destaque (cor vermelha EXA), acima ou ao lado do "Ver como funciona" (que continua sendo secundário, scroll-down).

### 3. `src/components/interesse-sindico/DemonstracaoSection.tsx` — otimizar vídeo
Aplicar carregamento mais leve no vídeo principal:
- `preload="metadata"` (em vez de `auto`) — carrega só os metadados, não o arquivo inteiro
- Adicionar atributo `poster` com uma thumbnail estática (primeiro frame ou imagem promocional)
- `loading="lazy"` se for `<iframe>`; se for `<video>`, manter `playsInline muted autoPlay` mas com `preload="metadata"`
- Garantir que o `<source>` tenha `type="video/mp4"` para evitar probing
- Se houver lógica de IntersectionObserver para tocar só quando visível, manter; senão, adicionar

### 4. `src/components/interesse-sindico/ComoFuncionaSection.tsx` — confirmar Link funcional
Inspecionar se o `<Link>` está dentro de um wrapper com `onClick` que faz `e.preventDefault()`. Se sim, remover. Caso contrário, garantir que o componente está usando `react-router-dom` corretamente importado.

## Garantias

- Não altero outras páginas, formulário, lógica de negócio, banco, ou tokens de design.
- Apenas: 1 rota verificada, 1 CTA adicionado no Hero, 1 otimização de vídeo, 1 verificação de Link.
- Mantém todo o comportamento visual e funcional da landing intacto.

## Resultado esperado

- Botão "Registrar interesse do meu prédio" (seção Como Funciona) navega corretamente para `/interessesindico/formulario`.
- Novo CTA "Quero no meu prédio" no topo (Hero), em destaque, abaixo do "Ver como funciona", levando direto ao formulário.
- Vídeo 1 carrega mais rápido (apenas metadados inicialmente, com thumbnail visível).

