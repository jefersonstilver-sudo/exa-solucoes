

# Plano: Upload de Video sem Tela Branca + Barra de Progresso Real

## Causa raiz

Em `useOrderVideoManagement.tsx` linha 303:
```
loading: loading || baseHook.uploading
```

O `loading` retornado pelo hook **inclui o estado de upload**. Na pagina `OrderDetails.tsx` linha 407:
```
if (loading || videosLoading || enhancedLoading)
```

Quando o upload comeca, `loading` vira `true`, e a pagina inteira e substituida pelo spinner "Carregando detalhes..." — escondendo todo o conteudo e a barra de progresso.

## Correcao

### 1. Separar loading inicial de uploading
**Arquivo**: `src/hooks/useOrderVideoManagement.tsx`

- Linha 303: mudar `loading: loading` (sem `|| baseHook.uploading`)
- O `uploading` ja e retornado separadamente na linha 310

### 2. Nao bloquear pagina durante upload
**Arquivo**: `src/pages/advertiser/OrderDetails.tsx`

- Linha 407: remover `videosLoading` da condicao de loading full-page (ou usar apenas o loading inicial, nao o de upload)
- A pagina permanece visivel durante o upload
- O `VideoManagementCard` ja recebe `uploading` e `uploadProgress` e ja exibe o progresso internamente

## Resultado

- Pagina permanece visivel durante upload
- Barra de progresso real aparece dentro do card de video (ja existe no componente)
- Sem tela branca

## Arquivos alterados
1. `src/hooks/useOrderVideoManagement.tsx` — separar loading de uploading (1 linha)
2. `src/pages/advertiser/OrderDetails.tsx` — ajustar condicao de loading (1 linha)

