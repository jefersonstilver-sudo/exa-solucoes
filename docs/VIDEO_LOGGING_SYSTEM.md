# Sistema de Logs de Vídeo - Guia Completo

## 📘 Visão Geral

Sistema robusto de logging para rastrear toda a jornada de mudança de vídeo principal, desde o clique do usuário até a chamada da API externa.

## 🚀 Como Usar

### 1. Ativar o Modo Debug

Abra o console do navegador (F12) e digite:

```javascript
enableDebugMode()
```

Depois, recarregue a página. Um botão flutuante 🐛 aparecerá no canto inferior direito.

### 2. Acessar os Logs

Clique no botão flutuante 🐛 para abrir o painel de logs em tempo real.

### 3. Filtrar Logs

Use os filtros disponíveis:

- **Por Categoria:**
  - `UI_USER_ACTION` - Ações do usuário (cliques)
  - `DATA_FETCH` - Buscas no banco de dados
  - `EXTERNAL_API` - Chamadas à API externa
  - `RPC_CALL` - Chamadas de procedures
  - `PROCESS` - Início/fim de processos
  - `CONTEXT` - Mudanças de contexto

- **Por Nível:**
  - `info` - Informações gerais
  - `warn` - Avisos
  - `error` - Erros
  - `debug` - Debug detalhado

### 4. Exportar Logs

Clique no botão "Exportar" para baixar um arquivo `.txt` com todos os logs filtrados.

## 📊 O que é Registrado

### Quando o usuário clica em "Definir como principal"

1. **UI_USER_ACTION**: Captura o clique
   - Slot ID
   - Nome do vídeo
   - Status de aprovação
   - ID do pedido

2. **RPC_CALL**: Chamada da procedure `set_base_video_enhanced`
   - Parâmetros enviados
   - Resposta recebida

3. **DATA_FETCH**: Busca dos dados necessários
   - Informações do slot selecionado
   - Lista de prédios
   - Todos os vídeos do pedido

4. **EXTERNAL_API**: Chamadas à API externa
   - URL completa
   - Payload enviado (título, ativo)
   - Status da resposta (200, 404, etc.)
   - Corpo da resposta de erro

5. **PROCESS**: Status do processo geral
   - SET_BASE_VIDEO - START
   - SET_BASE_VIDEO - SUCCESS/FAILED

## 🔍 Exemplo de Log Entry

```json
{
  "timestamp": "2025-11-10T18:30:45.123Z",
  "level": "error",
  "category": "EXTERNAL_API",
  "action": "API Call",
  "data": {
    "clientId": "964d",
    "url": "http://15.228.8.3:8000/ativo/964d",
    "payload": {
      "titulo": "1762788321277_WhatsApp_Video_2025-11-10_at_9.24.37_AM",
      "ativo": true
    },
    "response": {
      "ok": false,
      "status": 404,
      "statusText": "Not Found",
      "body": "Video not found"
    },
    "context": {
      "slotId": "abc123...",
      "videoId": "def456...",
      "videoTitle": "1762788321277_WhatsApp_Video...",
      "orderId": "f761a419...",
      "buildingIds": ["964df4d4-6ed5-44ab-93ae-5870d666fd85"]
    }
  }
}
```

## 🐛 Troubleshooting

### O botão de debug não aparece?

1. Verifique se você ativou o modo debug:
```javascript
enableDebugMode()
```

2. Recarregue a página

3. Verifique no console se aparece a mensagem de "DEBUG HELPERS DISPONÍVEIS"

### Os logs não aparecem?

1. Faça uma ação (clique em "Definir como principal")
2. Abra o painel de debug
3. Verifique os filtros - tente selecionar "Todas Categorias" e "Todos Níveis"

### Como limpar logs antigos?

Clique no botão "Limpar" no painel de logs ou execute:
```javascript
videoLogger.clearLogs()
```

## 📝 API do Logger

### No código JavaScript:

```javascript
import { videoLogger } from '@/services/logger/VideoActionLogger';

// Log genérico
videoLogger.log('info', 'CATEGORIA', 'Ação', { dados });

// Log de clique do usuário
videoLogger.logUserClick(slotId, videoTitle, additionalData);

// Log de busca de dados
videoLogger.logDataFetch('Nome da busca', 'query', result);

// Log de chamada de API
videoLogger.logAPICall(clientId, url, payload, response);

// Log de RPC
videoLogger.logRPC('nome_rpc', params, result, error);

// Processo
videoLogger.logProcessStart('PROCESSO', params);
videoLogger.logProcessEnd('PROCESSO', success, result, error);

// Contexto
videoLogger.setContext({ orderId, slotId, ... });
videoLogger.clearContext();

// Exportar logs
const logs = videoLogger.exportLogs({ category: 'EXTERNAL_API' });

// Relatório da última ação
const report = videoLogger.getLastActionReport();
```

## 🎯 Casos de Uso

### Debugar erro 404 da API externa

1. Ative o modo debug
2. Tente trocar o vídeo principal
3. Abra o painel de logs
4. Filtre por `EXTERNAL_API`
5. Procure por logs com level `error`
6. Verifique:
   - A URL está correta?
   - O clientId (4 primeiros dígitos) está correto?
   - O título do vídeo está sendo enviado corretamente?
   - A resposta da API dá alguma dica?

### Entender fluxo completo

1. Filtre por "Todas Categorias"
2. Ordene por timestamp
3. Siga a sequência:
   - UI_USER_ACTION (clique)
   - RPC_CALL (procedure)
   - DATA_FETCH (busca de dados)
   - EXTERNAL_API (chamadas à API)
   - PROCESS (conclusão)

## 💾 Persistência

Os logs são automaticamente salvos no `localStorage` do navegador e persistem entre sessões.

Limite: 1000 logs (os mais antigos são descartados automaticamente)

## 🔒 Segurança

- Logs não contêm informações sensíveis (senhas, tokens)
- Modo debug deve ser usado apenas em desenvolvimento/staging
- Em produção, use `disableDebugMode()` para desativar

## 📞 Suporte

Se os logs mostrarem um erro consistente, exporte e compartilhe o arquivo `.txt` com o time de desenvolvimento.
