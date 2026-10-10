# JSON Event Stream

O modo JSON emite o progresso estruturado para uma invocação:

```bash
pi --mode json "Revise este repositório"
```

O Pi escreve um cabeçalho de sessão seguido por eventos de sessão, e então sai após as instruções fornecidas terminarem. O modo RPC emite as mesmas formas de evento de sessão, mas não tem cabeçalho de sessão porque é um protocolo bidirecional de longa duração. Veja [Modo RPC](rpc.md).

Esta página é a referência canônica para eventos compartilhados pelos modos JSON e RPC. Os valores de mensagem usam os [tipos de mensagem compartilhados](message-types.md).

## Framing e I/O de processo

O stream usa strict JSONL framing. Cada registro é um objeto JSON terminado por LF (`\n`). Divida os registros apenas em LF e remova um carriage return opcional precedente. Separadores de linha e parágrafo Unicode são válidos dentro de strings JSON e não são limites de registro.

O `readline` do Node.js não é adequado para este stream porque ele também reconhece esses separadores Unicode. Use um decodificador de stream de bytes ou UTF-8 e divida em LF.

Leia o stdout continuamente. Um leitor que para de consumir registros pode travar o Pi quando o buffer de pipe encher. Stdout é reservado para JSONL; diagnósticos e logs da aplicação vão para stderr.

## Cabeçalho de sessão

O primeiro registro do modo JSON é o atual [cabeçalho de sessão](session-format.md#sessionheader):

```json
{"type":"session","version":3,"id":"uuid","timestamp":"2024-12-03T14:00:00.000Z","cwd":"/path"}
```

O modo RPC não emite este registro. Use [`get_state`](rpc-commands.md#get_state) para seu ID de sessão atual e arquivo.

## Sequência de eventos

Uma execução básica produz registros como estes:

```json
{"type":"agent_start"}
{"type":"turn_start"}
{"type":"message_start","message":{"role":"user","content":"Review this repository","timestamp":1733234401000}}
{"type":"message_end","message":{"role":"user","content":"Review this repository","timestamp":1733234401000}}
{"type":"message_start","message":{"role":"assistant","content":[],"stopReason":"pending","...":"..."}}
{"type":"message_update","usage":{"...":"..."},"assistantMessageEvent":{"type":"text_delta","contentIndex":0,"delta":"Hello"}}
{"type":"message_end","message":{"role":"assistant","...":"..."}}
{"type":"turn_end","message":{"role":"assistant","...":"..."},"toolResults":[]}
{"type":"agent_end","messages":[{"...":"..."}],"willRetry":false}
{"type":"agent_settled"}
```

`agent_end` fecha uma execução de agente de baixo nível. Tentar novamente automaticamente, recuperação de overflow, tentar novamente de compactação, steering, ou trabalho de follow-up ainda podem continuar. `agent_settled` significa que o Pi não tem nenhum trabalho automático restante para aquela execução no nível de sessão.

## Eventos de agente e turno

| Evento | Campos | Significado |
|---|---|---|
| `agent_start` | Nenhum | Uma execução de agente de baixo nível começou. |
| `agent_end` | `messages`, `willRetry` | Aquela execução de baixo nível terminou. `messages` contém mensagens geradas pela execução. |
| `agent_settled` | Nenhum | O Pi não continuará automaticamente através de tentativas de retry, recuperação de compactação ou mensagens em fila. |
| `turn_start` | Nenhum | Um turno do assistente começou. |
| `turn_end` | `message`, `toolResults` | Uma resposta do assistente e suas chamadas de tool resultantes terminaram. |

Um turno é uma resposta do assistente mais quaisquer chamadas de tool e resultados de tool produzidos por aquela resposta.

## Eventos de mensagem

| Evento | Campos | Significado |
|---|---|---|
| `message_start` | `message` | Uma mensagem começou. |
| `message_update` | `usage`, `assistantMessageEvent` | Uma mensagem do assistente emitiu uma atualização de bloco de conteúdo. |
| `message_end` | `message` | Uma mensagem foi concluída. Esta é a mensagem final autoritativa. |

### Reconstruir mensagens de streaming

Registros de rede `message_update` são apenas delta. Eles omitem o campo cumulativo `message` do evento do SDK e todos os snapshots `assistantMessageEvent.partial` para que o tamanho do stream permaneça linear.

O evento aninhado é um dos:

| Tipo | Campos além de `type` | Significado |
|---|---|---|
| `start` | Nenhum | O stream do provider começou; seu campo cumulativo `partial` é removido na rede. |
| `text_start` | `contentIndex` | Um bloco de texto começou. |
| `text_delta` | `contentIndex`, `delta` | Anexar texto ao bloco. |
| `text_end` | `contentIndex`, `content` | O bloco de texto terminou com conteúdo autoritativo. |
| `thinking_start` | `contentIndex` | Um bloco de pensamento começou. |
| `thinking_delta` | `contentIndex`, `delta` | Anexar texto de pensamento ao bloco. |
| `thinking_end` | `contentIndex`, `content` | O bloco de pensamento terminou com conteúdo autoritativo. |
| `toolcall_start` | `contentIndex`, `id`, `toolName` | Um bloco de chamada de tool começou. |
| `toolcall_delta` | `contentIndex`, `delta` | Anexar dados de argumento serializados. |
| `toolcall_end` | `contentIndex`, `toolCall` | A chamada de tool terminou com o `ToolCall` completo. |
| `done` | `reason`, `message` | O stream do provider foi concluído com sucesso. |
| `error` | `reason`, `error` | O stream do provider terminou com um erro ou mensagem de abortar. |

O loop normal do agente traduz `start`, `done`, e `error` no nível do provider em eventos de sessão `message_start` e `message_end` em vez de emiti-los como `message_update`. Eles permanecem admitidos pela transformação `JsonAgentSessionEvent` exportada para callers que constroem um evento de sessão correspondente.

Use `contentIndex` para identificar o bloco de conteúdo. Armazene os campos `delta` no buffer para exibição ao vivo, mas substitua os dados reconstruídos pelo conteúdo concluído em `text_end`, `thinking_end`, ou `toolcall_end`. Substitua toda a mensagem parcial com `message_end.message` quando ela chegar.

O uso de topo de nível `usage` é o uso mais recente reportado pelo provider cumulativo para a resposta do assistente. Ele pode permanecer em zero até a conclusão quando um provider não relata o uso enquanto faz o stream.

```json
{"type":"message_update","usage":{"input":100,"output":1,"cacheRead":0,"cacheWrite":0,"totalTokens":101,"cost":{"input":0,"output":0,"cacheRead":0,"cacheWrite":0,"total":0}},"assistantMessageEvent":{"type":"text_delta","contentIndex":0,"delta":"Hello "}}
```

## Eventos de execução de tool

| Evento | Campos | Significado |
|---|---|---|
| `tool_execution_start` | `toolCallId`, `toolName`, `args` | A execução da tool começou. |
| `tool_execution_update` | `toolCallId`, `toolName`, `args`, `partialResult` | A tool relatou um resultado parcial. |
| `tool_execution_end` | `toolCallId`, `toolName`, `result`, `isError`, `durationMs` | A execução da tool terminou. `durationMs` é o tempo que o `execute()` da tool levou, medido com um relógio monotônico; ausente quando a tool não rodou. |

Use `toolCallId` para correlacionar o ciclo de vida. `partialResult` é o último resultado parcial fornecido pela tool. Se ele substitui ou estende uma atualização anterior depende do contrato de resultado daquela tool.

```json
{"type":"tool_execution_start","toolCallId":"call_abc123","toolName":"bash","args":{"command":"ls -la"}}
{"type":"tool_execution_update","toolCallId":"call_abc123","toolName":"bash","args":{"command":"ls -la"},"partialResult":{"content":[{"type":"text","text":"partial output"}],"details":{}}}
{"type":"tool_execution_end","toolCallId":"call_abc123","toolName":"bash","result":{"content":[{"type":"text","text":"complete output"}],"details":{}},"isError":false}
```

## Eventos de fila e estado

| Evento | Campos | Significado |
|---|---|---|
| `queue_update` | `steering`, `followUp` | A fila de steering pendente ou follow-up mudou. Ambos os campos contêm a fila completa atual. |
| `entry_appended` | `entry` | Uma extensão anexou uma entrada de sessão customizada através do `pi.appendEntry()`. |
| `session_info_changed` | `name` | O nome de exibição da sessão mudou. Um `name` ausente significa que foi limpo. |
| `thinking_level_changed` | `level` | O nível de pensamento ativo mudou. |

O valor de `entry` usa um [tipo de entrada de sessão](session-format.md#entry-types) persistido.

## Eventos de compactação

`compaction_start` relata por que a compactação começou:

```json
{"type":"compaction_start","reason":"threshold"}
```

`reason` é `"manual"`, `"threshold"`, ou `"overflow"`.

`compaction_end` contém o resultado quando a compactação é bem-sucedida:

```json
{
  "type": "compaction_end",
  "reason": "threshold",
  "result": {
    "summary": "Summary of conversation...",
    "firstKeptEntryId": "abc123",
    "tokensBefore": 150000,
    "estimatedTokensAfter": 32000,
    "usage": {"...": "..."},
    "details": {}
  },
  "aborted": false,
  "willRetry": false
}
```

Se a compactação foi abortada, `result` está ausente e `aborted` é verdadeiro. Se falhou, `result` está ausente, `aborted` é falso, e `errorMessage` descreve a falha. A recuperação de overflow bem-sucedida define `willRetry` para verdadeiro antes de o Pi tentar o prompt novamente.

Veja [Resumos de Compactação e Ramificação](compaction.md) para semântica de resultado.

## Eventos de retry

O retry do turno do assistente emite:

```json
{"type":"auto_retry_start","attempt":1,"maxAttempts":3,"delayMs":2000,"errorMessage":"529 overloaded"}
{"type":"auto_retry_end","success":true,"attempt":2}
```

Na falha final, `auto_retry_end` tem `success: false` e uma string `finalError`.

A compactação e o retry de resumo de ramificação emitem:

```json
{"type":"summarization_retry_scheduled","attempt":1,"maxAttempts":3,"delayMs":2000,"errorMessage":"terminated"}
{"type":"summarization_retry_attempt_start","source":"compaction","reason":"threshold"}
{"type":"summarization_retry_finished"}
```

Para um resumo de ramificação, `source` é `"branchSummary"` e `reason` está ausente. O `reason` em um retry de compactação é `"manual"`, `"threshold"`, ou `"overflow"`.

## Eventos apenas para RPC

Um comando [`bash`](rpc-commands.md#bash) de RPC direto emite um `bash_execution_update` para cada pedaço de output. Seu `id` opcional corresponde ao ID do comando. A resposta final do comando pode conter output truncado, mas esses eventos fazem streaming de todo o output:

```json
{"type":"bash_execution_update","id":"req-1","delta":"total 48\n"}
```

O RPC também adiciona `extension_error` quando um manipulador de extensão lança:

```json
{"type":"extension_error","extensionPath":"/path/to/extension.ts","event":"tool_call","error":"Error message"}
```

Registros de UI de extensão são um subprotocolo RPC separado, não valores `AgentSessionEvent`. Veja [UI de Extensão RPC](rpc-extension-ui.md).

## Tipos TypeScript

O `AgentSessionEvent` do SDK contém snapshots cumulativos de streaming para consumidores in-process. JSON e RPC transformam apenas `message_update`:

```typescript
type WithoutPartial<T> = T extends { partial: unknown } ? Omit<T, "partial"> : T;

type JsonAssistantMessageEvent<T> = T extends { type: "toolcall_start"; partial: unknown }
  ? WithoutPartial<T> & { id: string; toolName: string }
  : WithoutPartial<T>;

type JsonAgentSessionEvent =
  | Exclude<AgentSessionEvent, { type: "message_update" }>
  | {
      type: "message_update";
      usage: Usage;
      assistantMessageEvent: JsonAssistantMessageEvent<AssistantMessageEvent>;
    };
```

Use o tipo `JsonAgentSessionEvent` exportado de `@earendil-works/3pi-coding-agent`. Sua implementação está em [`json-event.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/json-event.ts).

## Exemplo

Imprima mensagens concluídas de uma execução de tentativa única:

```bash
pi --mode json "List files" 2>/dev/null | jq -c 'select(.type == "message_end")'
```
