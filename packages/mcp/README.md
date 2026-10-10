# @earendil-works/3pi-mcp

Um pequeno Model Context Protocol client standalone. Ele não depende do MCP SDK oficial nem de outros pacotes do pi.

O pacote fornece um core de client neutro de transporte, transportes de stdio e HTTP Streamable, além de um transporte in-memory para testes.

## Usage

```typescript
import { McpClient, StdioTransport } from "@earendil-works/3pi-mcp";

const transport = new StdioTransport({
	command: "npx",
	args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
});
const client = new McpClient({
	name: "my-client",
	version: "1.0.0",
	roots: [{ uri: "file:///workspace", name: "workspace" }],
});

await client.connect(transport);
const tools = await client.listTools();
const result = await client.callTool("search", { query: "MCP" });
await client.close();
```

Para um servidor remoto, use `new StreamableHttpTransport({ url, headers })`. O Fetch pode ser injetado para proxying ou networking customizado.

### Tools for an LLM

`toLlmContent(result)` converte um `CallToolResult` para texto e imagem para um modelo, no formato `TextContent` e `ImageContent` do `@earendil-works/3pi-ai`. Textos e imagens passam direto, os recursos incorporados de texto e imagem são desempacotados, e áudios, links de recursos, e recursos binários se tornam curtos textos placeholders. Um result sem blocos de conteúdo mas com `structuredContent` se torna seu JSON.

Embrulhando uma ferramenta MCP como uma `AgentTool` do `pi-agent-core`:

```typescript
import type { AgentTool } from "@earendil-works/3pi-agent-core";
import { toLlmContent } from "@earendil-works/3pi-mcp";
import { Type } from "typebox";

const tools: AgentTool[] = (await client.listTools()).map((tool) => ({
	// Providers allow at most 64 characters of [A-Za-z0-9_-].
	name: `mcp_${tool.name}`.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 64),
	label: tool.title ?? tool.name,
	description: tool.description ?? tool.name,
	// Providers require an object schema, and some reject one without `properties`.
	parameters: Type.Unsafe({ ...tool.inputSchema, type: "object", properties: tool.inputSchema.properties ?? {} }),
	execute: async (_toolCallId, params, signal) => {
		const result = await client.callTool(tool.name, params as Record<string, unknown>, { signal });
		// MCP reports tool failures in the result instead of as a protocol error.
		return { content: toLlmContent(result), details: undefined, isError: result.isError === true };
	},
}));
```

O exemplo [mcp-codemode](https://github.com/earendil-works/pi/tree/main/packages/agent/examples/mcp-codemode) também encaminha progresso, passa o `structuredContent` através, e permite que scripts do `@earendil-works/3pi-codemode` chamem as ferramentas.

### OAuth

`@earendil-works/3pi-mcp/oauth` fornece o subconjunto OAuth do client MCP sem depender do SDK oficial:

```typescript
import { McpClient, StreamableHttpTransport } from "@earendil-works/3pi-mcp";
import {
	adaptOAuthProvider,
	authorizeMcp,
	McpOAuthAuthorizationRequiredError,
	McpOAuthProvider,
	OAuthCallbackServer,
} from "@earendil-works/3pi-mcp/oauth";

const serverUrl = "https://mcp.example.com/mcp";
const callback = await OAuthCallbackServer.listen();
let authorizationUrl: URL | undefined;
const oauth = new McpOAuthProvider({
	serverUrl,
	redirectUrl: callback.redirectUrl,
	clientMetadata: { client_name: "My MCP client" },
	onRedirect: (url) => {
		authorizationUrl = url;
	},
});

const connect = () => {
	const client = new McpClient({ name: "my-client", version: "1.0.0" });
	return {
		client,
		connected: client.connect(
			new StreamableHttpTransport({ url: serverUrl, authProvider: adaptOAuthProvider(oauth) }),
		),
	};
};

const first = connect();
try {
	await first.connected;
} catch (error) {
	if (!(error instanceof McpOAuthAuthorizationRequiredError)) throw error;
	const state = await oauth.state();
	const result = callback.waitForCallback(state);
	// Open authorizationUrl in the user's browser here.
	const { code } = await result;
	await authorizeMcp(oauth, { serverUrl, authorizationCode: code });
}

const { client, connected } = connect();
await connected;
```

Injete `McpOAuthStateStore` dentro de `McpOAuthProvider` para credenciais duráveis. O pacote não abre um navegador nem escolhe onde as credenciais são armazenadas.

A implementação OAuth é adaptada do Model Context Protocol TypeScript SDK v1.29.0 sob licença MIT. Sua licença está inclusa em `LICENSES/`.

Um transporte MCP possui seu próprio framing e I/O. Ele entrega mensagens JSON-RPC individuais ao `McpClient`; o client gerencia a correlação de requests, inicialização, timeouts, cancelamentos, requisições de servidor e helpers de nível de protocolo.

## Supported protocol surface

- Protocolo MCP versão `2025-11-25`, aceitando servidores que negociem `2025-06-18`, `2025-03-26` ou `2024-11-05`
- inicialização e `notifications/initialized`
- ping
- `tools/list` paginado
- `tools/call`, incluindo structured content
- notificações de progresso e renovação de timeout
- cancelamento de requisição
- sessões Streamable HTTP, o fluxo server-to-client GET com reconexão e retomada (resumption) de resposta do stream com `Last-Event-ID`
- encerramento stdio conforme especificação (fecha o stdin, depois SIGTERM, depois SIGKILL), aplicado ao grupo de processo completo do servidor
- requisições do servidor para `ping` e `roots/list`
- logs e notificações de mudanças em tool-list via API genérica de notificação
- detecção de OAuth protected-resource e authorization-server
- fluxo de código de autorização PKCE, client registration dinâmico, renovação de token (refresh compartilhado por 401s concorrentes) e step-up authorization para `insufficient_scope`

Lotes JSON-RPC, HTTP+SSE legados, servidores, sampling e tasks estão fora do core inicial.

## Testing

`@earendil-works/3pi-mcp/testing` exporta `createInMemoryTransportPair()` para testes de clientes e adapters.
