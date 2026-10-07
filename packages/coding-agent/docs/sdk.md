# SDK

`@earendil-works/3pi-coding-agent` embute o Pi em um processo Node.js ou Bun. Ele fornece acesso direto via TypeScript ao agent, sessões, ferramentas, models e recursos usados pelo aplicativo de linha de comando.

Use o SDK para integração TypeScript no mesmo processo. Para uma integração independente de linguagem ou baseada em subprocesso isolado, veja [Integração CLI](cli-integration.md).

```typescript
import { createAgentSession } from "@earendil-works/3pi-coding-agent";

const { session } = await createAgentSession();

try {
  await session.prompt("Quais arquivos estão no diretório atual?");
  console.log(session.getLastAssistantText());
} finally {
  session.dispose();
}
```

Isso usa o diretório de trabalho, recursos descobertos, configurações armazenadas e credenciais configuradas. `prompt()` é resolvido quando a execução é concluída.

O [exemplo mínimo completo](../examples/sdk/01-minimal.ts) também transmite eventos de texto por stream. Todos os [exemplos do SDK](../examples/sdk/) são tipados com o repositório.

<a id="session-management"></a>

## Ciclo de vida da sessão

`createAgentSession()` cria uma `AgentSession`. A sessão possui uma conversa, seu model e ferramentas, mensagens enfileiradas, estado de compactação e runtime de extensão.

Leia o estado atual através de `session.messages`, `session.model`, `session.thinkingLevel`, `session.systemPrompt` e `session.getActiveToolNames()`.

`session.systemPrompt` é somente leitura e retorna o prompt do sistema efetivo atual, incluindo as alterações que ainda não foram enviadas ao model. As alterações nas ferramentas são declaradas ao model antes da próxima solicitação.

<a id="sessionmanager-api"></a>

### Armazenamento de sessão

As sessões são persistentes por padrão. O `SessionManager` possui a árvore de entrada em memória ou persistida e rastreia sua folha ativa. O branching (criação de ramificação) altera essa folha sem excluir os ramos abandonados. Quando o Pi reconstrói o contexto do model, o gerenciador seleciona o branch ativo e aplica a compactação.

O `SessionManager` tem autoridade sobre o contexto do model finalizado. Restaure o histórico externo construindo a sessão com um gerenciador que contenha essas entradas. Atribuir a `session.agent.state.messages` não substitui o contexto persistido.

Use um gerenciador em memória quando o host não desejar arquivos de sessão:

```typescript
import { createAgentSession, SessionManager } from "@earendil-works/3pi-coding-agent";

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
});
```

Veja o [exemplo de sessões](../examples/sdk/11-sessions.ts) verificado para criar, abrir, continuar, listar e fazer o fork de sessões. O [Formato de Arquivo de Sessão](session-format.md) define o contrato JSONL persistido, e [Tipos de Mensagem](message-types.md) define os valores da transcrição. Para métodos e assinaturas exatos, use as declarações TypeScript exportadas ou [`session-manager.ts`](../src/core/session-manager.ts).

`cwd` seleciona o workspace usado para a descoberta de recursos do projeto, arquivos de contexto, agrupamento de sessões e caminhos de ferramentas embutidas. Passe-o explicitamente quando o destino diferir de `process.cwd()`.

`session.dispose()` aborta o trabalho ativo, invalida os contextos de extensão, desconecta-se do agent e remove os ouvintes de eventos. Chame-o quando a sessão não for mais necessária.

`AgentSessionRuntime` adiciona `newSession()`, `switchSession()`, `fork()` e `importFromJsonl()`. Cada operação substitui a `AgentSession` ativa e recria os serviços para o diretório de trabalho de destino.

Após uma substituição de runtime, as assinaturas pertencem à `AgentSession` antiga e devem ser vinculadas novamente. Veja o [exemplo de runtime de sessão](../examples/sdk/13-session-runtime.ts).

## Prompting (Envio de Prompts)

`prompt()` manipula comandos de extensão e expande os templates de prompt baseados em arquivos antes que as mensagens normais do usuário entrem no agent. Para uma execução aceita do agent, ele é resolvido após a conclusão da execução, incluindo repetições automáticas.

Um prompt enviado enquanto a sessão já está sendo transmitida deve especificar se ele deve guiar (steer) a execução atual ou segui-la (follow-up). Chamar `prompt()` sem essa escolha causa rejeição em vez de adivinhação.

Uma mensagem de direção (steering) entra após o turno do assistente atual e de suas chamadas de ferramentas. Um acompanhamento (follow-up) entra depois que a execução atual conclui o seu trabalho pendente. `steer()` e `followUp()` expõem esses comportamentos diretamente e retornam `"queued"` se a entrada for enfileirada (incluindo após a transformação por uma extensão) ou `"handled"` se uma extensão a consumir.

`abort()` interrompe a operação ativa e aguarda que a sessão fique ociosa. `waitForIdle()` aguarda sem abortar.

## Assinatura de eventos

Inscreva-se antes de enviar um prompt quando o host precisar de saída transmitida (streamed):

```typescript
const unsubscribe = session.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

try {
  await session.prompt("Explique este repositório");
} finally {
  unsubscribe();
}
```

Os eventos de sessão relatam as atualizações de mensagens, execução de ferramentas, filas, compactação, repetições e alterações no ciclo de vida da execução.

`message_end` contém a mensagem concluída definitiva. `agent_end` marca o fim de uma execução do agent de baixo nível, mas uma recuperação automática ou trabalho enfileirado ainda pode se seguir.

Use `agent_settled` quando o host precisar saber que o Pi não continuará automaticamente.

## Configuração de uma sessão

Sem substituições, a fábrica cria um `ModelRuntime`, `SettingsManager` baseado em arquivo, `SessionManager` persistente, `DefaultResourceLoader` e as ferramentas padrão configuradas.

Cada limite pode ser fornecido explicitamente:

- `modelRuntime`, `model`, `thinkingLevel` e `scopedModels` controlam o acesso e a seleção de models.
- `settingsManager` fornece configurações mescladas ou uma configuração na memória.
- `sessionManager` fornece um histórico de conversa persistente ou na memória.
- `resourceLoader` fornece extensões, skills, templates de prompt, temas e arquivos de contexto.
- `tools`, `noTools`, `excludeTools` e `customTools` controlam o conjunto de ferramentas ativo.

Use `DefaultResourceLoader` quando quiser uma descoberta padrão com substituições selecionadas. Forneça um `ResourceLoader` personalizado quando o host for completamente proprietário do armazenamento e da descoberta de recursos.

<a id="inlineextension"></a>

Fábricas de extensão inline (embutidas) podem ser fornecidas através do `DefaultResourceLoader`. Dê a uma delas um nome em `InlineExtension` apenas quando precisar de um nome estável em diagnósticos e saídas de inicialização. Uma extensão inline nomeada com `replaceable: true` é deixada de fora quando outra extensão registra uma ferramenta, comando ou sinalizador com um nome que ela também registra durante o carregamento, evitando o conflito de ambos carregarem. O codemode, tool search e as extensões MCP embutidas da CLI são substituíveis. Uma entrada nomeada com `builtin: true` não é uma extensão em linha: ela fornece o código da extensão `builtin:<nome>`, que carrega como um arquivo de extensão configurado. Ela carrega por padrão, está listada em `pi config`, e é desativada por `-builtin:<nome>` na configuração `extensions` ou por `noExtensions`; `additionalExtensionPaths: ["builtin:<nome>"]` a carrega explicitamente. Ela carrega após a confiança do projeto ser resolvida, portanto, ela não pode lidar com `project_trust`. As extensões embutidas da CLI usam-no.

<a id="codemode-mcp"></a>

A CLI carrega as extensões `codemode`, `tool_search` e MCP como embutidas. As sessões do SDK não as carregam; adicione `createCodemodeExtension()`, `createToolSearchExtension()` e `createMcpExtension()` às `extensionFactories` do `DefaultResourceLoader`. O `codemode` e `tool_search` são registrados inativos: habilite-os através da configuração `defaultTools` (`["+codemode", "+tool_search"]` mantém as outras ferramentas padrão), ou permita que a extensão MCP os ative: `codemode` para servidores com exposição `codemode`, `tool_search` para servidores com exposição `deferred`. A extensão MCP conecta os seus servidores em `session_start`, então chame `session.bindExtensions()`. Veja [Codemode e MCP](../examples/sdk/14-codemode-mcp.ts).

Veja os exemplos com foco para [models](../examples/sdk/02-custom-model.ts), [ferramentas](../examples/sdk/05-tools.ts), [extensões](../examples/sdk/06-extensions.ts) e [controle total](../examples/sdk/12-full-control.ts).

## Exemplos

| Exemplo | Propósito |
|---|---|
| [Mínimo](../examples/sdk/01-minimal.ts) | Criar, enviar prompt, observar e descartar uma sessão |
| [Model personalizado](../examples/sdk/02-custom-model.ts) | Selecionar um model e nível de pensamento |
| [Prompt do sistema](../examples/sdk/03-custom-prompt.ts) | Substituir ou adicionar ao prompt do sistema |
| [Skills](../examples/sdk/04-skills.ts) | Descobrir, filtrar e adicionar skills |
| [Ferramentas](../examples/sdk/05-tools.ts) | Selecionar ferramentas integradas e seu diretório de trabalho |
| [Extensões](../examples/sdk/06-extensions.ts) | Carregar extensões baseadas em arquivo e inline |
| [Arquivos de contexto](../examples/sdk/07-context-files.ts) | Adicionar ou substituir as instruções do projeto |
| [Templates de prompt](../examples/sdk/08-prompt-templates.ts) | Adicionar templates de prompt estilo arquivo |
| [Credenciais](../examples/sdk/09-api-keys-and-oauth.ts) | Configurar o armazenamento de credenciais e de models |
| [Configurações](../examples/sdk/10-settings.ts) | Fornecer configurações na memória ou baseadas em arquivo |
| [Sessões](../examples/sdk/11-sessions.ts) | Controlar a persistência e a restauração da sessão |
| [Controle total](../examples/sdk/12-full-control.ts) | Substituir serviços padrões de descoberta e estado |
| [Runtime de sessão](../examples/sdk/13-session-runtime.ts) | Substituir a sessão ativa com segurança |
| [Codemode e MCP](../examples/sdk/14-codemode-mcp.ts) | Adicionar as extensões `codemode`, `tool_search` e MCP |

<a id="exports"></a>

## Recursos

- [Escolher um Model](models.md) abrange a seleção de models e os endpoints compatíveis; [Provedores](providers.md) abrange as credenciais e as configurações específicas do provedor.
- [Configuração](configuration.md) explica as configurações e a descoberta padrão; [Configurações](settings.md) lista cada configuração.
- [Sessões e Contexto](sessions.md) explica o comportamento da sessão; [Formato de Sessão](session-format.md) define as entradas persistidas; [Tipos de Mensagem](message-types.md) define os valores da transcrição partilhada.
- [Extensões](extensions.md), [Skills](skills.md) e [Templates de Prompt](prompt-templates.md) documentam recursos fornecidos por um `ResourceLoader`.
- [Integração CLI](cli-integration.md) abrange alternativas de impressão, JSON e RPC em relação a uma integração de SDK no mesmo processo.
