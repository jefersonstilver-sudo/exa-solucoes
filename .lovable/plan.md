

# Auditoria e Correção do Pipeline de Conversão MOV → MP4

## Problemas Identificados (3 bugs críticos)

### Bug 1: Som tocando durante conversão
**Causa raiz**: Na linha 117 de `videoConversionService.ts`:
```
source.connect(audioContext.destination);
```
Isso conecta o áudio diretamente à saída de som do navegador (alto-falantes). Embora `video.muted = true` esteja definido, o `createMediaElementSource` bypassa o controle de mute do elemento — o áudio flui pelo AudioContext diretamente para os alto-falantes.

**Correção**: Remover a linha `source.connect(audioContext.destination)`. O áudio deve ser roteado APENAS para o `MediaStreamDestination` (para captura), nunca para o `audioContext.destination` (alto-falantes).

### Bug 2: Slot ficou vazio (conversão falhou silenciosamente)
**Causa raiz**: Quando `video.muted = true` é combinado com `createMediaElementSource`, alguns browsers (especialmente Safari no iPhone) podem não produzir dados de áudio pelo AudioContext, causando conflito. Além disso, se o `video.play()` falhar silenciosamente (autoplay policy), a conversão produz um arquivo vazio (0 frames). O erro é capturado no `catch` do hook mas o slot já pode ter sido parcialmente manipulado.

**Correção**: 
- Adicionar validação do arquivo convertido (tamanho mínimo e contagem de frames)
- Melhorar o tratamento de erro para garantir que arquivos vazios/corrompidos nunca prossigam ao upload

### Bug 3: Pedido Master não reconhecido
**Causa raiz**: Este não é um bug separado — como a conversão falhou, o upload nunca chegou ao `videoUploadService.ts` onde a lógica Master (linha 260) é executada. Se a conversão tivesse funcionado, o auto-approve teria sido acionado normalmente.

## Mudanças Técnicas

### Arquivo: `src/services/videoConversionService.ts`

1. **Remover conexão ao alto-falante** (linha 117):
   - Deletar `source.connect(audioContext.destination)`
   - Manter apenas `source.connect(destination)` para captura silenciosa

2. **Adicionar validação do arquivo convertido**:
   - Após `mediaRecorder.onstop`, verificar se `mp4Blob.size > 1000` (pelo menos 1KB)
   - Verificar se `frameCount > 0`
   - Se inválido, rejeitar a Promise com mensagem clara

3. **Fechar o AudioContext após uso**:
   - Chamar `audioContext.close()` no cleanup para liberar recursos

4. **Adicionar log de diagnóstico mais claro**:
   - Logar se `video.play()` resolveu com sucesso
   - Logar frameCount periodicamente durante a conversão

### Arquivo: `src/hooks/useVideoManagement.tsx`

Nenhuma mudança necessária — o tratamento de erro já está correto. Se a conversão falhar, o catch mostra toast e retorna `{ success: false }`.

### Arquivos NÃO alterados
- Nenhuma mudança em UI, layout, ou funcionalidades existentes
- Nenhuma mudança em banco de dados
- Nenhuma mudança no fluxo Master (já funciona corretamente quando o upload acontece)

