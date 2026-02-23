

# Auditoria Completa: Video do Hero -- Bugs de Travamento e Solucoes

## Problemas Identificados

### 1. ZERO TRATAMENTO DE ERROS
O `<video>` no HeroSection nao tem nenhum handler para `onError`, `onStalled`, `onWaiting`, `onSuspend`. Quando o video trava (rede lenta, buffer vazio, erro de decodificacao), ele simplesmente para e fica congelado para sempre.

### 2. URL ASSINADA COM EXPIRACAO (Desktop)
O video desktop usa uma URL assinada do Supabase Storage com token JWT:
```
token=eyJ...exp:1795807106
```
Essa URL expira em ~27/Nov/2026. Quando expirar, o video simplesmente para de funcionar sem nenhum aviso. Alem disso, se o usuario deixar a aba aberta por muito tempo, o token pode expirar durante a sessao.

### 3. HOOK `useHomepageVideo` NAO E USADO
O hook `useHomepageVideo` busca a URL do video no banco de dados, mas o resultado (`videoUrl`) nunca e aplicado ao elemento `<video>`. Ambos os layouts (mobile e desktop) usam URLs hardcoded, tornando o hook inutil.

### 4. SEM RECUPERACAO AUTOMATICA
Quando o video trava por qualquer motivo (rede, buffer, erro), nao existe nenhum mecanismo de auto-recovery. O usuario precisa recarregar a pagina inteira.

### 5. SEM CONTROLE DE VISIBILIDADE
O video continua rodando mesmo quando o usuario rola para baixo e o video sai da tela, desperdicando recursos e potencialmente causando travamentos em dispositivos mais fracos.

## Solucao

### Arquivo: `src/components/exa/home/HeroSection.tsx`

**A) Criar hook `useResilientVideo` inline ou extrair para arquivo separado:**

Esse hook encapsula toda a logica de resiliencia:

- **`onStalled` / `onWaiting`**: Detectar quando o video trava e tentar `video.play()` apos 3 segundos automaticamente.
- **`onError`**: Capturar erro, esperar 2 segundos, fazer `video.load()` + `video.play()` para recuperar. Tentar ate 3 vezes antes de desistir.
- **`onTimeUpdate`**: Monitorar se o `currentTime` parou de avancar por mais de 5 segundos (freeze silencioso). Se sim, forcar reload.
- **Intersection Observer**: Pausar o video quando ele sai da viewport e retomar quando volta. Isso evita desperdicio de recursos.
- **Fallback de URL**: Se a URL assinada falhar, tentar a URL publica como fallback.

**B) Substituir URLs hardcoded:**

- Desktop: Usar URL publica do Supabase Storage (sem token de expiracao) em vez da URL assinada. A URL publica ja existe para o video mobile: `https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos%20exa/Videos%20Site/...`
- Manter o hook `useHomepageVideo` como override opcional (se o admin configurar uma URL customizada no banco, ela tem prioridade).

**C) Adicionar handlers ao elemento `<video>` (tanto mobile quanto desktop):**

```tsx
<video
  ref={videoRef}
  autoPlay loop muted playsInline
  onStalled={handleStalled}
  onWaiting={handleWaiting}
  onError={handleError}
  onTimeUpdate={handleTimeUpdate}
  onPlaying={handlePlaying}
  className="w-full h-full object-cover"
>
  <source src={primaryUrl} type="video/mp4" />
</video>
```

**D) Logica de recuperacao (pseudo-codigo):**

```
onStalled/onWaiting:
  - Marcar timestamp do inicio do stall
  - Apos 3s sem progresso -> video.load() + video.play()
  - Apos 3 tentativas -> mostrar botao "Recarregar video"

onError:
  - Tentativa 1: video.load() + video.play()
  - Tentativa 2: trocar src para URL fallback
  - Tentativa 3: mostrar estado de erro com botao manual

onTimeUpdate:
  - Salvar lastKnownTime
  - Se currentTime == lastKnownTime por 5s -> forcar recovery

IntersectionObserver:
  - video sai da tela -> video.pause()
  - video volta para tela -> video.play()
```

**E) Aplicar o mesmo pattern ao `HeroMobileLayout`:**

O componente mobile tem os mesmos problemas. A mesma logica de resiliencia sera aplicada, compartilhando o hook.

## Resultado Esperado

- Video nunca mais fica travado -- recupera sozinho em ate 3 segundos
- Se a rede cair, tenta 3x antes de mostrar botao de retry
- Quando o usuario rola para baixo, o video pausa (economiza CPU/bateria)
- URLs publicas sem expiracao -- sem surpresas futuras
- Se admin configurar URL customizada no banco, ela tem prioridade

## Arquivos Modificados

1. **`src/components/exa/home/HeroSection.tsx`** -- Adicionar handlers de resiliencia, Intersection Observer, trocar URLs hardcoded para publicas, usar hook existente como override

