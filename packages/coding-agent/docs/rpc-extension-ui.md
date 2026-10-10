# RPC Extension UI

As extensões podem solicitar a interação do usuário por meio de `ctx.ui`. No modo RPC, as chamadas suportadas tornam-se um subprotocolo de requisição/resposta ao lado dos [comandos RPC](rpc-commands.md) normais e dos [eventos de sessão](json.md).

Existem duas categorias de métodos de interface de extensão:

- **Métodos de diálogo** (`select`, `confirm`, `input`, `editor`): emitem um `extension_ui_request` no stdout e bloqueiam até que o cliente retorne um `extension_ui_response` no stdin com o `id` correspondente.
- **Métodos fire-and-forget** (`notify`, `setStatus`, `setWidget`, `setTitle`, `set_editor_text`): emitem um `extension_ui_request` no stdout, mas não aguardam uma resposta. O cliente pode exibir as informações ou ignorá-las.

Se um método de diálogo incluir um campo `timeout`, o lado do agent fará a resolução automática com um valor padrão quando o tempo limite expirar. O cliente não precisa rastrear timeouts.

## Limitações

Alguns métodos de `ExtensionUIContext` não são suportados ou têm funcionalidade reduzida no modo RPC porque exigem acesso direto à interface do terminal:

- `custom()` retorna `undefined`.
- `onTerminalInput()` retorna uma função de cancelamento de inscrição inativa.
- `setWorkingMessage()`, `setWorkingVisible()`, `setWorkingIndicator()`, `setHiddenThinkingLabel()`, `setFooter()`, `setHeader()`, `addAutocompleteProvider()`, `setEditorComponent()`, e `setToolsExpanded()` não têm efeito (no-ops).
- `getEditorText()` retorna `""` e `getEditorComponent()` retorna `undefined`.
- `getToolsExpanded()` retorna `false`.
- `pasteToEditor()` delega para `setEditorText()` sem manipulação de colagem do terminal.
- `getAllThemes()` retorna `[]`, e `getTheme()` retorna `undefined`.
- `setTheme()` retorna `{ success: false, error: "Theme switching not supported in RPC mode" }`.

Observação: `ctx.mode` é `"rpc"` e `ctx.hasUI` é `true` no modo RPC porque os métodos de diálogo e fire-and-forget são funcionais através do subprotocolo de interface de extensão. Use `ctx.mode === "tui"` para proteger recursos específicos do TUI como `custom()` que exigem um terminal real.

## Requisições a partir do Pi

Todas as requisições têm `type: "extension_ui_request"`, um `id` exclusivo e um campo `method`.

### select

Solicita ao usuário a escolha a partir de uma lista. Métodos de diálogo com um campo `timeout` incluem o tempo limite em milissegundos; o agent resolve automaticamente com `undefined` se o cliente não responder a tempo.

```json
{
  "type": "extension_ui_request",
  "id": "uuid-1",
  "method": "select",
  "title": "Permitir comando perigoso?",
  "options": ["Permitir", "Bloquear"],
  "timeout": 10000
}
```

Resposta esperada: `extension_ui_response` com `value` (a string da opção selecionada) ou `cancelled: true`.

### confirm

Solicita a confirmação de sim/não ao usuário.

```json
{
  "type": "extension_ui_request",
  "id": "uuid-2",
  "method": "confirm",
  "title": "Limpar sessão?",
  "message": "Todas as mensagens serão perdidas.",
  "timeout": 5000
}
```

Resposta esperada: `extension_ui_response` com `confirmed: true/false` ou `cancelled: true`.

### input

Solicita ao usuário texto livre.

```json
{
  "type": "extension_ui_request",
  "id": "uuid-3",
  "method": "input",
  "title": "Digite um valor",
  "placeholder": "digite algo..."
}
```

Resposta esperada: `extension_ui_response` com `value` (o texto inserido) ou `cancelled: true`.

### editor

Abre um editor de texto com várias linhas, com conteúdo pré-preenchido opcional.

```json
{
  "type": "extension_ui_request",
  "id": "uuid-4",
  "method": "editor",
  "title": "Editar algum texto",
  "prefill": "Linha 1\nLinha 2\nLinha 3"
}
```

Resposta esperada: `extension_ui_response` com `value` (o texto editado) ou `cancelled: true`.

### notify

Exibe uma notificação. Fire-and-forget, sem expectativa de resposta.

```json
{
  "type": "extension_ui_request",
  "id": "uuid-5",
  "method": "notify",
  "message": "Comando bloqueado pelo usuário",
  "notifyType": "warning"
}
```

O campo `notifyType` é `"info"`, `"warning"` ou `"error"`. O valor padrão é `"info"` se for omitido.

### setStatus

Define ou limpa uma entrada de status no rodapé/barra de status. Fire-and-forget.

```json
{
  "type": "extension_ui_request",
  "id": "uuid-6",
  "method": "setStatus",
  "statusKey": "my-ext",
  "statusText": "Turn 3 executando..."
}
```

Envie `statusText: undefined` (ou omita-o) para limpar a entrada de status para essa chave.

### setWidget

Define ou limpa um widget (bloco de linhas de texto) exibido acima ou abaixo do editor. Fire-and-forget.

```json
{
  "type": "extension_ui_request",
  "id": "uuid-7",
  "method": "setWidget",
  "widgetKey": "my-ext",
  "widgetLines": ["--- Meu Widget ---", "Linha 1", "Linha 2"],
  "widgetPlacement": "aboveEditor"
}
```

Envie `widgetLines: undefined` (ou omita-o) para limpar o widget. O campo `widgetPlacement` é `"aboveEditor"` (padrão) ou `"belowEditor"`. Apenas arrays de strings são suportados no modo RPC; fábricas de componentes são ignoradas.

### setTitle

Define o título da janela/aba do terminal. Fire-and-forget.

```json
{
  "type": "extension_ui_request",
  "id": "uuid-8",
  "method": "setTitle",
  "title": "pi - meu projeto"
}
```

### set_editor_text

Define o texto no editor de entrada. Fire-and-forget.

```json
{
  "type": "extension_ui_request",
  "id": "uuid-9",
  "method": "set_editor_text",
  "text": "texto pré-preenchido para o usuário"
}
```

## Respostas ao Pi

As respostas são enviadas apenas para os métodos de diálogo (`select`, `confirm`, `input`, `editor`). O `id` deve corresponder à requisição.

### Resposta de valor (select, input, editor)

```json
{"type": "extension_ui_response", "id": "uuid-1", "value": "Permitir"}
```

### Resposta de confirmação (confirm)

```json
{"type": "extension_ui_response", "id": "uuid-2", "confirmed": true}
```

### Resposta de cancelamento (qualquer diálogo)

Descarta qualquer método de diálogo. A extensão recebe `undefined` (para select/input/editor) ou `false` (para confirm).

```json
{"type": "extension_ui_response", "id": "uuid-3", "cancelled": true}
```

## Exemplo

Veja o [cliente de interface de extensão RPC](../examples/rpc-extension-ui.ts) verificado e a sua [extensão de demonstração](../examples/extensions/rpc-demo.ts).

As uniões de request e response exportadas estão definidas em [`rpc-types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/rpc/rpc-types.ts). Veja [Extensões](extensions.md#ui-and-modes) para orientações sobre extensões independentes de modo.
