# Tipos de Mensagem

O Pi usa valores de `AgentMessage` no estado do SDK, em eventos de ciclo de vida, respostas RPC e em entradas de sessão de mensagem persistidas. Esta página define essas mensagens compartilhadas e seus blocos de conteúdo.

As marcações de tempo (timestamps) de mensagem são timestamps Unix em milissegundos. Elas são diferentes dos timestamps ISO 8601 nas [entradas de sessão](session-format.md#entry-base).

Definições de fonte:

- [`packages/ai/src/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/ai/src/types.ts) define mensagens e blocos de conteúdo voltados ao provider.
- [`packages/agent/src/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/agent/src/types.ts) define a union `AgentMessage` extensível.
- [`packages/coding-agent/src/core/messages.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/messages.ts) adiciona papéis de mensagem do coding-agent.

## Blocos de conteúdo

### TextContent

```typescript
interface TextContent {
  type: "text";
  text: string;
  textSignature?: string;
}
```

`textSignature` contém metadados de mensagem específicos do provider. Trate-o como opaco.

### ImageContent

```typescript
interface ImageContent {
  type: "image";
  data: string;
  mimeType: string;
}
```

`data` são os dados da imagem codificados em base64. `mimeType` identifica o seu tipo de mídia, como `image/png` ou `image/jpeg`.

### ThinkingContent

```typescript
interface ThinkingContent {
  type: "thinking";
  thinking: string;
  thinkingSignature?: string;
  redacted?: boolean;
}
```

As assinaturas de thinking contêm dados de replay específicos do provider. Trate-as como opacas. Um bloco redigido pode não ter nenhum texto de thinking visível, enquanto retém um payload criptografado em `thinkingSignature`.

### ToolCall

```typescript
interface ToolCall {
  type: "toolCall";
  id: string;
  name: string;
  arguments: Record<string, any>;
  thoughtSignature?: string;
  namespace?: string;
}
```

`thoughtSignature` é específico do provider. `namespace` identifica um namespace de Responses da OpenAI para tools carregadas dinamicamente ou namespaced.

## Uso (Usage)

Mensagens de assistente sempre contêm informações de uso. Resultados de tool podem conter uso quando a tool realiza trabalho aninhado do modelo.

```typescript
interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cacheWrite1h?: number;
  reasoning?: number;
  totalTokens: number;
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
}
```

Quando presente, `reasoning` já está incluído em `output`; não o adicione novamente. `cacheWrite1h` é o subconjunto de `cacheWrite` gravado com retenção de uma hora.

## Mensagens Base

### SystemMessage

A mensagem do sistema principal declara o prompt inicial e as tools. Mensagens de sistema posteriores podem anexar instruções, e adicionar ou remover tools.

### UserMessage

```typescript
interface UserMessage {
  role: "user";
  content: string | (TextContent | ImageContent)[];
  timestamp: number;
}
```

### AssistantMessage

```typescript
interface AssistantMessage {
  role: "assistant";
  content: (TextContent | ThinkingContent | ToolCall)[];
  api: string;
  provider: string;
  model: string;
  responseModel?: string;
  responseId?: string;
  providerThinkingLevel?: string;
  thinkingLevel?: ModelThinkingLevel;
  diagnostics?: AssistantMessageDiagnostic[];
  usage: Usage;
  stopReason: "pending" | "stop" | "length" | "toolUse" | "error" | "aborted" | "deferred";
  deferred?: DeferredHandle;
  errorMessage?: string;
  rawStopReason?: string;
  endTurn?: boolean;
  timestamp: number;
}
```

`responseModel` registra um modelo de resposta concreto quando este difere do modelo solicitado.

Um motivo de parada `"pending"` é usado enquanto a mensagem transmite (stream). Uma resposta `"deferred"` possui um `DeferredHandle` com os dados do provider.

### ToolResultMessage

```typescript
interface ToolResultMessage<TDetails = any> {
  role: "toolResult";
  toolCallId: string;
  toolName: string;
  content: (TextContent | ImageContent)[];
  details?: TDetails;
  usage?: Usage;
  nestedCalls?: NestedToolCalls;
  isError: boolean;
  timestamp: number;
}
```

`details` é específico de cada tool. `usage` opcional reporta uso aninhado.

## Mensagens do Coding-agent

O package coding-agent estende `AgentMessage` com quatro funções:

- `BashExecutionMessage`: Criada por comandos diretos do shell. Não é um resultado de tool LLM.
- `CustomMessage`: Criada quando uma extensão envia uma mensagem de contexto.
- `BranchSummaryMessage`: Uma mensagem de contexto criada a partir de um registro persistido de ramificação.
- `CompactionSummaryMessage`: Uma mensagem de contexto criada a partir da compactação persistida.

## AgentMessage Union

Aplicações podem adicionar funções customizadas, então consumidores devem tolerar funções desconhecidas ao lidar com a união.
