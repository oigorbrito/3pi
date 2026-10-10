# Exemplos do SDK

Uso programático do pi-coding-agent através de `createAgentSession()` e `createAgentSessionRuntime()`.

O exemplo de runtime mostra como construir uma função recreate que se encerra (closes over) através de entradas fixas globais do processo e recria serviços ligados ao diretório de trabalho (cwd) assim que o cwd da sessão ativa muda.

## Exemplos

| Arquivo | Descrição |
|------|-------------|
| `01-minimal.ts` | Uso mais simples com todas as opções padrão |
| `02-custom-model.ts` | Selecionar modelo e nível de pensamento |
| `03-custom-prompt.ts` | Substituir ou modificar o system prompt |
| `04-skills.ts` | Descobrir, filtrar ou substituir skills |
| `05-tools.ts` | Listas de permissões (allowlists) de ferramentas nativas |
| `06-extensions.ts` | Logging, bloqueios, e modificação de resultados |
| `07-context-files.ts` | Arquivos de contexto AGENTS.md |
| `08-prompt-templates.ts` | Modelos de prompt baseados em arquivos |
| `09-api-keys-and-oauth.ts` | Resolução de chaves de API, configuração de OAuth |
| `10-settings.ts` | Substituir definições de compactação, retry e configurações do terminal |
| `11-sessions.ts` | Sessões em memória, persistentes, continuidade, listagem de sessões |
| `12-full-control.ts` | Substituir tudo, sem descoberta (discovery) automática |
| `13-session-runtime.ts` | Gerenciar substituição de sessão com suporte de runtime |
| `14-codemode-mcp.ts` | Adicionar as extensões `codemode`, `tool_search` e MCP |

## Executando

```bash
cd packages/coding-agent
node examples/sdk/01-minimal.ts
```

## Referência Rápida

```typescript
import { getModel } from "@earendil-works/3pi-ai";
import {
  createAgentSession,
  DefaultResourceLoader,
  ModelRuntime,
  SessionManager,
  SettingsManager,
} from "@earendil-works/3pi-coding-agent";

const modelRuntime = await ModelRuntime.create();

// Minimal
const { session } = await createAgentSession({ modelRuntime });

// Custom model
const model = getModel("anthropic", "claude-opus-4-5");
const { session } = await createAgentSession({ model, thinkingLevel: "high", modelRuntime });

// Modify prompt
const loader = new DefaultResourceLoader({
  systemPromptOverride: (base) => `${base}\n\nBe concise.`,
});
await loader.reload();
const { session } = await createAgentSession({ resourceLoader: loader, modelRuntime });

// Read-only
const { session } = await createAgentSession({ tools: ["read", "grep", "find", "ls"], modelRuntime });

// In-memory
const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  modelRuntime,
});

// Full control
const customRuntime = await ModelRuntime.create({
  authPath: "/my/app/auth.json",
  modelsPath: "/my/app/models.json",
});
await customRuntime.setRuntimeApiKey("anthropic", process.env.MY_KEY!);

const resourceLoader = new DefaultResourceLoader({
  systemPromptOverride: () => "You are helpful.",
  extensionFactories: [myExtension],
  skillsOverride: () => ({ skills: [], diagnostics: [] }),
  agentsFilesOverride: () => ({ agentsFiles: [] }),
  promptsOverride: () => ({ prompts: [], diagnostics: [] }),
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  model,
  modelRuntime: customRuntime,
  resourceLoader,
  tools: ["read", "bash", "my_tool"],
  customTools: [myTool],
  sessionManager: SessionManager.inMemory(),
  settingsManager: SettingsManager.inMemory(),
});

// Run prompts
session.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});
await session.prompt("Hello");
```

## Opções

| Opção | Padrão | Descrição |
|--------|---------|-------------|
| `modelRuntime` | Runtime usando `agentDir/auth.json` e `models.json` | Modelo canônico e runtime de autenticação |
| `cwd` | `process.cwd()` | Diretório de trabalho (working directory) |
| `agentDir` | `~/.3pi/agent` | Diretório de configurações |
| `model` | Das configurações/o primeiro disponível | Modelo a ser usado |
| `thinkingLevel` | Das configurações/"off" | off, low, medium, high |
| `tools` | As embutidas `["read", "bash", "edit", "write"]` | Lista de ferramentas permitidas (nativas, extensões ou customizadas) |
| `customTools` | `[]` | Definições de ferramentas adicionais |
| `resourceLoader` | DefaultResourceLoader | Carregador de recursos (extensões, skills, prompts, temas e arquivos de contexto) |
| `sessionManager` | `SessionManager.create(cwd)` | Persistência |
| `settingsManager` | `SettingsManager.create(cwd, agentDir)` | Substituição de configurações (settings overrides) |

## Eventos

```typescript
session.subscribe((event) => {
  switch (event.type) {
    case "message_update":
      if (event.assistantMessageEvent.type === "text_delta") {
        process.stdout.write(event.assistantMessageEvent.delta);
      }
      break;
    case "tool_execution_start":
      console.log(`Tool: ${event.toolName}`);
      break;
    case "tool_execution_end":
      console.log(`Result: ${event.result}`);
      break;
    case "agent_settled":
      console.log("Done");
      break;
  }
});
```
