# Correção da barra de impersonação e loader duplicado

## Problemas identificados

**1. Barra superior renderizando com erro**
A faixa "Visualizando como cliente" está aparecendo com fundo branco (do `bg-background` do Sheet) e o texto/botão ficam quase invisíveis. O gradiente `from-exa-red-dark to-exa-red` não está sobrepondo corretamente o background do Sheet, resultando em texto vermelho-claro sobre branco.

**2. Dois loaders aparecendo simultaneamente**
Durante o carregamento aparecem duas mensagens sobrepostas:
- "Carregando visão do cliente…" (overlay do `ClientOrderViewSheet` enquanto o iframe carrega)
- "Carregando área do anunciante…" (loader interno do portal do anunciante dentro do iframe)

Os dois ficam visíveis ao mesmo tempo porque o overlay do Sheet é semitransparente (`bg-white/70`).

## Mudanças (apenas em `src/components/impersonation/ClientOrderViewSheet.tsx`)

### A. Faixa superior com renderização sólida
- Aplicar `bg-exa-red` sólido (em vez de gradiente) e reforçar com `style={{ backgroundColor: 'hsl(var(--exa-red))' }}` para garantir cobertura mesmo sobre o `bg-background` do Sheet.
- Garantir `text-white` explícito no container e no botão "Fechar" para contraste consistente.
- Adicionar `relative z-20` para a faixa ficar acima de qualquer overlay do Radix.

### B. Remover loader duplicado
- Remover o overlay interno "Carregando visão do cliente…" do `ClientOrderViewSheet`.
- Manter apenas o loader nativo do portal do anunciante (que já roda dentro do iframe e mostra "Carregando área do anunciante…").
- Manter o `setIframeLoading` apenas como fallback para um spinner discreto opcional caso o iframe demore mais que ~3s — ou simplesmente eliminar completamente o estado `iframeLoading` para evitar qualquer chance de duplicação.

## Arquivos afetados
- `src/components/impersonation/ClientOrderViewSheet.tsx` (único arquivo)

Nenhuma outra parte do fluxo (botão, contexto de impersonação, layout do anunciante, OrderDetails) será alterada.
