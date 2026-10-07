# Exemplos de Extensões

Exemplos de extensões para pi-coding-agent.

## Uso

```bash
# Load an extension with --extension flag
pi --extension examples/extensions/permission-gate.ts

# Or copy to extensions directory for auto-discovery
cp permission-gate.ts ~/.3pi/agent/extensions/
```

## Exemplos

### Ciclo de Vida & Segurança

| Extensão | Descrição |
|-----------|-------------|
| `permission-gate.ts` | Solicita confirmação antes de comandos bash perigosos (rm -rf, sudo, etc.) |
| `project-trust.ts` | Demonstra o evento `project_trust` para extensões globais/usuário e da CLI |
| `protected-paths.ts` | Bloqueia escritas em caminhos protegidos (.env, .git/, node_modules/) |
| `confirm-destructive.ts` | Confirma antes de ações destrutivas na sessão (limpar, trocar, bifurcar) |
| `dirty-repo-guard.ts` | Impede mudanças de sessão se houver alterações git não commitadas |
| `sandbox/` | Sandboxing a nível de OS usando `@anthropic-ai/sandbox-runtime` com configuração por projeto |
| `gondolin/` | Direciona ferramentas nativas e comandos `!` para uma micro-VM Gondolin |

### Ferramentas Personalizadas

| Extensão | Descrição |
|-----------|-------------|
| `todo.ts` | Ferramenta de lista de tarefas + comando `/todos` com renderização e persistência de estado customizadas |
| `hello.ts` | Exemplo minimalista de ferramenta customizada |
| `question.ts` | Demonstra `ctx.ui.select()` para fazer perguntas ao usuário com UI customizada |
| `questionnaire.ts` | Entrada com múltiplas perguntas e navegação por abas entre elas |
| `tool-override.ts` | Sobrescreve ferramentas nativas (ex: adiciona log/controle de acesso ao `read`) |
| `dynamic-tools.ts` | Registra ferramentas após a inicialização (`session_start`) e em tempo de execução via comando, com fragmentos de prompt e diretrizes específicas |
| `structured-output.ts` | Ferramenta de saída estruturada final que retorna `terminate: true` para que o agente possa terminar após a chamada |
| `built-in-tool-renderer.ts` | Renderização compacta customizada para ferramentas nativas (read, bash, edit, write) mantendo o comportamento original |
| `minimal-mode.ts` | Sobrescreve a renderização de ferramentas nativas para modo mínimo (apenas chamadas, sem saída no modo recolhido) |
| `truncated-tool.ts` | Envolve o ripgrep com truncamento adequado da saída (50KB/2000 linhas) |
| `ssh.ts` | Delega todas as ferramentas para uma máquina remota via SSH usando operações plugáveis |
| `subagent/` | Delega tarefas a subagentes especializados com janelas de contexto isoladas |

### Comandos & UI

| Extensão | Descrição |
|-----------|-------------|
| `preset.ts` | Predefinições nomeadas para modelo, nível de pensamento, ferramentas e instruções via flag `--preset` e comando `/preset` |
| `plan-mode/` | Modo plano no estilo Claude Code para exploração apenas de leitura com comando `/plan` e rastreamento de etapas |
| `tools.ts` | Comando `/tools` interativo para ativar/desativar ferramentas com persistência na sessão |
| `handoff.ts` | Transfere contexto para uma nova sessão focada via `/handoff <goal>` |
| `qna.ts` | Extrai perguntas da última resposta para o editor via `ctx.ui.setEditorText()` |
| `status-line.ts` | Mostra o progresso do turno no rodapé via `ctx.ui.setStatus()` com cores temáticas |
| `github-issue-autocomplete.ts` | Adiciona preenchimento automático para issues `#1234` empilhando um provedor de autocomplete customizado que pré-carrega issues abertas via `gh issue list` |
| `widget-placement.ts` | Mostra widgets acima e abaixo do editor via `ctx.ui.setWidget()` |
| `hidden-thinking-label.ts` | Customiza o rótulo de pensamento recolhido via `ctx.ui.setHiddenThinkingLabel()` |
| `working-indicator.ts` | Customiza o indicador de trabalho contínuo via `ctx.ui.setWorkingIndicator()` |
| `model-status.ts` | Mostra mudanças de modelo na barra de status via evento `model_select` |
| `snake.ts` | Jogo da cobrinha com UI customizada, captura de teclado e persistência de sessão |
| `tic-tac-toe.ts` | Jogo da velha contra o agente usando `executionMode: "sequential"` para evitar condições de corrida no estado compartilhado |
| `send-user-message.ts` | Demonstra `pi.sendUserMessage()` para enviar mensagens de usuário a partir de extensões |
| `timed-confirm.ts` | Demonstra AbortSignal para dispensar automaticamente caixas de diálogo `ctx.ui.confirm()` e `ctx.ui.select()` |
| `rpc-demo.ts` | Exercita todos os métodos de UI de extensão suportados por RPC; par do [`examples/rpc-extension-ui.ts`](../rpc-extension-ui.ts) |
| `modal-editor.ts` | Editor modal no estilo vim customizado via `ctx.ui.setEditorComponent()` |
| `rainbow-editor.ts` | Efeito de texto arco-íris animado via editor customizado |
| `notify.ts` | Notificações de desktop via OSC 777 quando o agente termina (Ghostty, iTerm2, WezTerm) |
| `titlebar-spinner.ts` | Animação em Braille no título do terminal enquanto o agente está trabalhando |
| `summarize.ts` | Resume a conversa com o GPT-5.2 e exibe numa UI transitória |
| `custom-footer.ts` | Rodapé customizado com branch git e estatísticas de tokens via `ctx.ui.setFooter()` |
| `custom-header.ts` | Cabeçalho customizado via `ctx.ui.setHeader()` |
| `overlay-test.ts` | Testa a composição de overlay com inputs de texto inline e casos limite |
| `overlay-qa-tests.ts` | Testes de QA extensivos de overlay: âncoras, margens, empilhamento, transbordamento, animação |
| `doom-overlay/` | Jogo DOOM rodando como overlay a 35 FPS (demonstra renderização em tempo real) |
| `shutdown-command.ts` | Adiciona o comando `/quit` demonstrando `ctx.shutdown()` |
| `reload-runtime.ts` | Adiciona o comando `/reload-runtime` e a ferramenta `reload_runtime` mostrando o fluxo de recarregamento seguro |
| `interactive-shell.ts` | Executa comandos interativos (vim, htop) com terminal completo via evento `user_bash` |
| `inline-bash.ts` | Expande padrões `!{command}` nos prompts através da transformação do evento `input` |
| `input-transform-streaming.ts` | Pula pré-processamento de input custoso para direcionamento mid-stream via `streamingBehavior` |

### Integração Git

| Extensão | Descrição |
|-----------|-------------|
| `git-checkpoint.ts` | Cria checkpoints no git stash em cada turno para restauração de código no fork |
| `auto-commit-on-exit.ts` | Realiza commit automaticamente ao sair usando a última mensagem do assistente para a mensagem do commit |

### System Prompt & Compactação

| Extensão | Descrição |
|-----------|-------------|
| `pirate.ts` | Demonstra `systemPromptAppend` para modificar o system prompt dinamicamente |
| `claude-rules.ts` | Analisa a pasta `.claude/rules/` e lista as regras no system prompt |
| `custom-compaction.ts` | Compactação customizada que resume a conversa inteira |
| `trigger-compact.ts` | Aciona a compactação quando o uso de contexto excede 100k tokens e adiciona o comando `/trigger-compact` |

### Integração do Sistema

| Extensão | Descrição |
|-----------|-------------|
| `mac-system-theme.ts` | Sincroniza o tema do pi com o modo dark/light do macOS |

### Recursos (Resources)

| Extensão | Descrição |
|-----------|-------------|
| `dynamic-resources/` | Carrega skills, prompts e temas usando `resources_discover` |

### Mensagens & Comunicação

| Extensão | Descrição |
|-----------|-------------|
| `message-renderer.ts` | Renderização customizada de mensagens com cores e detalhes expansíveis via `registerMessageRenderer` |
| `entry-renderer.ts` | Renderização exclusiva para TUI das entradas de sessão via `appendEntry` e `registerEntryRenderer` |
| `debug-provider.ts` | Alterna a captura do stream bruto do provedor com `/debug-provider` e inspeciona cada mensagem do assistente na sessão TUI |
| `event-bus.ts` | Comunicação entre extensões via `pi.events` |

### Metadados da Sessão

| Extensão | Descrição |
|-----------|-------------|
| `session-name.ts` | Nomeia sessões no seletor de sessões via `setSessionName` |
| `bookmark.ts` | Adiciona marcadores (bookmarks) a entradas para navegação `/tree` via `setLabel` |

### Provedores Customizados

| Extensão | Descrição |
|-----------|-------------|
| `custom-provider-anthropic/` | Provedor Anthropic customizado com suporte a OAuth e implementação própria de streaming |
| `custom-provider-gitlab-duo/` | Provedor GitLab Duo utilizando o streaming embutido OpenAI/Anthropic do pi-ai através de um proxy |
| `jev-router.ts` | Modelo virtual via `registerVirtualModel` que planeja usando Codex Sol ou Terra (escolhidos pelo classificador Jev) e troca para Luna após a primeira edição |

### Dependências Externas

| Extensão | Descrição |
|-----------|-------------|
| `with-deps/` | Extensão com seu próprio package.json e dependências (demonstra resolução de módulos jiti) |
| `file-trigger.ts` | Monitora um arquivo e injeta seu conteúdo na conversa |

## Escrevendo Extensões

Veja [docs/extensions.md](../../docs/extensions.md) para a documentação completa.

```typescript
import type { ExtensionAPI } from "@earendil-works/3pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  // Subscribe to lifecycle events
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash" && event.input.command?.includes("rm -rf")) {
      const ok = await ctx.ui.confirm("Dangerous!", "Allow rm -rf?");
      if (!ok) return { block: true, reason: "Blocked by user" };
    }
  });

  // Register custom tools
  pi.registerTool({
    name: "greet",
    label: "Greeting",
    description: "Generate a greeting",
    parameters: Type.Object({
      name: Type.String({ description: "Name to greet" }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      return {
        content: [{ type: "text", text: `Hello, ${params.name}!` }],
        details: {},
      };
    },
  });

  // Register commands
  pi.registerCommand("hello", {
    description: "Say hello",
    handler: async (args, ctx) => {
      ctx.ui.notify("Hello!", "info");
    },
  });
}
```

## Padrões Principais

**Use StringEnum para parâmetros em formato string** (necessário para compatibilidade com a API do Google):
```typescript
import { StringEnum } from "@earendil-works/3pi-ai";

// Good
action: StringEnum(["list", "add"] as const)

// Bad - doesn't work with Google
action: Type.Union([Type.Literal("list"), Type.Literal("add")])
```

**Persistência de estado através dos detalhes (details):**
```typescript
// Store state in tool result details for proper forking support
return {
  content: [{ type: "text", text: "Done" }],
  details: { todos: [...todos], nextId },  // Persisted in session
};

// Reconstruct on session events
pi.on("session_start", async (_event, ctx) => {
  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type === "message" && entry.message.toolName === "my_tool") {
      const details = entry.message.details;
      // Reconstruct state from details
    }
  }
});
```
