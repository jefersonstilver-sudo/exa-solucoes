

# Plano: Remover Quadrado Transparente e Aumentar Logo do Cliente

## Problema Identificado

Na linha 1802, a logo do cliente está dentro de um container com:
- `bg-white/10` - fundo branco transparente (10% opacidade)
- `border border-white/20` - borda branca transparente
- `rounded-xl` - cantos arredondados
- `p-2` - padding interno

Isso cria um "quadrado transparente" visível ao redor da logo.

## Correção Necessária

### Antes (linha 1801-1808):
```tsx
{proposal.client_logo_url && (
  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20 p-2">
    <ClientLogoDisplay 
      logoUrl={proposal.client_logo_url}
      className="w-full h-full object-contain filter brightness-0 invert"
      containerClassName="w-full h-full"
    />
  </div>
)}
```

### Depois:
```tsx
{proposal.client_logo_url && (
  <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center flex-shrink-0">
    <ClientLogoDisplay 
      logoUrl={proposal.client_logo_url}
      className="w-full h-full object-contain filter brightness-0 invert"
      containerClassName="w-full h-full"
    />
  </div>
)}
```

## Alterações

| Classe Removida | Motivo |
|-----------------|--------|
| `bg-white/10` | Remove o fundo transparente |
| `rounded-xl` | Remove os cantos arredondados (não há mais fundo) |
| `border border-white/20` | Remove a borda transparente |
| `p-2` | Remove o padding interno |

| Tamanho Antes | Tamanho Depois | Aumento |
|---------------|----------------|---------|
| `w-16 h-16` (64px) | `w-20 h-20` (80px) | +25% |
| `sm:w-20 sm:h-20` (80px) | `sm:w-28 sm:h-28` (112px) | +40% |
| `md:w-24 md:h-24` (96px) | `md:w-32 md:h-32` (128px) | +33% |

## Arquivo a Modificar

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/pages/public/PropostaPublicaPage.tsx` | 1802 | Remover classes de fundo/borda e aumentar tamanho |

## Resultado Visual

A logo ficará maior e "flutuando" limpa sobre o fundo escuro, sem nenhum quadrado ou caixa ao redor.

