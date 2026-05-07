## Diagnóstico

Existem 3 problemas se sobrepondo em `useVideoTrimmer.ts`:

1. **Erro de hooks** (`Rendered more hooks than during the previous render`): a montagem do modal está executando ordem de hooks diferente entre renders. A causa prática é o `useEffect` extra adicionado depois (sync dos refs `startTimeRef`/`endTimeRef`/`isPlayingRef`) combinado com a remontagem rápida do modal quando `trimmerFile` chega — em StrictMode o primeiro mount aborta e o segundo encontra contagem diferente. Vou consolidar em um único bloco de inicialização e mover a sincronização dos refs para dentro do mesmo lugar onde o `setState` ocorre (sem `useEffect` redundante).

2. **Thumbnails não aparecem** (timeline cinza/pulsante): o `<video>` offscreen é criado com `document.createElement` mas **não é anexado ao DOM**. Em Chrome/Safari atuais isso resulta em `drawImage` pintando frame vazio e/ou `seeked` que nunca dispara — daí a sensação de "tudo travado". Além disso, o código pula totalmente o mobile e só escuta `loadedmetadata` (sem esperar `loadeddata`/decode do primeiro frame).

3. **Seek do offVideo pode pendurar para sempre**: `seekTo` aguarda evento `seeked` sem timeout. Se o navegador rejeitar o seek (tempo == currentTime, fim do arquivo, etc.), a Promise nunca resolve e a geração de thumbs trava — bloqueando indiretamente a UX.

## O que será alterado

Arquivo único: `src/components/video-trimmer/useVideoTrimmer.ts`.

### 1. Estabilizar a ordem dos hooks
- Manter exatamente esta sequência (sem hooks condicionais): `useRef` × N → `useState` → `useEffect` (load) → `useEffect` (sync de seek ao mudar startTime) → `useCallback` × 4.
- Remover o `useEffect` separado que sincroniza `startTimeRef/endTimeRef/isPlayingRef` e fazer essa atualização **inline** no callback de `setState` (atribuição direta nos refs antes do `setState`), eliminando um hook e a corrida que causa o erro de StrictMode.

### 2. Geração de thumbnails robusta
- Criar o `<video>` offscreen, **anexar** a um container `position:fixed; left:-99999px; width:1px; height:1px;` no `document.body`, e remover ao final.
- Aguardar `loadeddata` (não só `loadedmetadata`) antes do primeiro draw.
- Substituir `seekTo` por uma versão com **timeout de 800 ms**: resolve mesmo se `seeked` não disparar, garantindo progresso.
- Preferir `requestVideoFrameCallback` quando disponível (Chrome) para draw após frame realmente decodado; fallback para `seeked` + `setTimeout(40)`.
- Clamp do tempo do seek para `Math.min(time, duration - 0.05)`, evitando seeks no fim do arquivo.
- Permitir thumbnails também em mobile (qualidade reduzida, 5–6 thumbs), removendo o early-return do iOS/Android. Se falhar, segue sem thumbs (UX já tem fallback de gradient pulsante).
- Try/finally para sempre limpar o nó offscreen, mesmo em erro.

### 3. Loop de play mais leve
- Em vez de chamar `setState` a cada `requestAnimationFrame` (re-render por frame), o RAF apenas **lê** `video.currentTime` e o `state.currentTime` continua sendo atualizado pelo listener `timeupdate` nativo do `<video>` (já existe). O RAF passa a ter como única responsabilidade fazer o loop A↔B (voltar para `start` ao chegar em `end`). Isso elimina re-render por frame que é parte da sensação de "travado".

### 4. Effect de load com deps mínimas
- Remover `maxDuration` do array de deps do effect de load (ele não influencia o carregamento do `src`), evitando recargas desnecessárias do `<video>` quando o pai re-renderiza.

## Resultado esperado

- Sem erro de hooks ao abrir o modal.
- Thumbnails aparecem na timeline (8–16 no desktop, 5–6 no mobile).
- Playhead branco acompanha o vídeo em tempo real e pode ser arrastado.
- Arrastar a janela vermelha re-posiciona o preview imediatamente.
- Sem travas mesmo se o navegador "engolir" um evento `seeked`.

Nenhuma outra UI/fluxo é alterada.