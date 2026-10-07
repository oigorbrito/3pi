# Exemplo de Subagente (Subagent)

Delegue tarefas a subagentes especializados com janelas de contexto isoladas.

## Funcionalidades

- **Contexto isolado**: Cada subagente roda em um processo `pi` separado
- **Saída em streaming**: Veja chamadas de ferramentas e o progresso enquanto acontecem
- **Streaming paralelo**: Todas as tarefas paralelas transmitem atualizações simultaneamente
- **Renderização Markdown**: Saída final renderizada com formatação adequada (visualização expandida)
- **Rastreamento de uso**: Mostra turnos, tokens, custo e uso de contexto por agente
- **Suporte a interrupção (abort)**: Ctrl+C se propaga para encerrar processos dos subagentes

## Estrutura

```
subagent/
├── README.md            # This file
├── index.ts             # The extension (entry point)
├── agents.ts            # Agent discovery logic
├── agents/              # Sample agent definitions
│   ├── scout.md         # Fast recon, returns compressed context
│   ├── planner.md       # Creates implementation plans
│   ├── reviewer.md      # Code review
│   └── worker.md        # General-purpose (full capabilities)
└── prompts/             # Workflow presets (prompt templates)
    ├── implement.md     # scout -> planner -> worker
    ├── scout-and-plan.md    # scout -> planner (no implementation)
    └── implement-and-review.md  # worker -> reviewer -> worker
```

## Instalação

A partir da raiz do repositório, crie links simbólicos para os arquivos:

```bash
# Symlink the extension (must be in a subdirectory with index.ts)
mkdir -p ~/.3pi/agent/extensions/subagent
ln -sf "$(pwd)/packages/coding-agent/examples/extensions/subagent/index.ts" ~/.3pi/agent/extensions/subagent/index.ts
ln -sf "$(pwd)/packages/coding-agent/examples/extensions/subagent/agents.ts" ~/.3pi/agent/extensions/subagent/agents.ts

# Symlink agents
mkdir -p ~/.3pi/agent/agents
for f in packages/coding-agent/examples/extensions/subagent/agents/*.md; do
  ln -sf "$(pwd)/$f" ~/.3pi/agent/agents/$(basename "$f")
done

# Symlink workflow prompts
mkdir -p ~/.3pi/agent/prompts
for f in packages/coding-agent/examples/extensions/subagent/prompts/*.md; do
  ln -sf "$(pwd)/$f" ~/.3pi/agent/prompts/$(basename "$f")
done
```

## Modelo de Segurança

Esta ferramenta executa um subprocesso `pi` separado com um system prompt delegado e configuração de ferramentas/modelo.

**Agentes locais do projeto** (`.3pi/agents/*.md`) são prompts controlados pelo repositório que podem instruir o modelo a ler arquivos, executar comandos bash, etc.

**Comportamento padrão:** Carrega apenas **agentes de nível de usuário** de `~/.3pi/agent/agents`.

Para habilitar agentes locais do projeto, passe `agentScope: "both"` (ou `"project"`). Faça isso apenas para repositórios nos quais você confia.

Ao rodar interativamente, a ferramenta pede confirmação antes de executar agentes locais do projeto em projetos não confiáveis. Projetos confiáveis pulam o prompt adicional. Defina `confirmProjectAgents: false` para desabilitar a confirmação.

## Uso

### Agente único
```
Use scout to find all authentication code
```

### Execução paralela
```
Run 2 scouts in parallel: one to find models, one to find providers
```

### Fluxo de trabalho em cadeia (Chain)
```
Use a chain: first have scout find the read tool, then have planner suggest improvements
```

### Prompts de fluxo de trabalho
```
/implement add Redis caching to the session store
/scout-and-plan refactor auth to support OAuth
/implement-and-review add input validation to API endpoints
```

## Modos da Ferramenta

| Modo | Parâmetro | Descrição |
|------|-----------|-------------|
| Único | `{ agent, task }` | Um agente, uma tarefa |
| Paralelo | `{ tasks: [...] }` | Vários agentes rodam concorrentemente (máx 8, 4 concorrentes) |
| Cadeia | `{ chain: [...] }` | Sequencial com placeholder `{previous}` |

## Exibição da Saída

**Visão recolhida** (padrão):
- Ícone de status (✓/✗/⏳) e nome do agente
- Últimos 5-10 itens (chamadas de ferramentas e texto)
- Estatísticas de uso: `3 turns ↑input ↓output RcacheRead WcacheWrite $cost ctx:contextTokens model`

**Visão expandida** (Ctrl+O):
- Texto completo da tarefa
- Todas as chamadas de ferramentas com argumentos formatados
- Saída final renderizada como Markdown
- Uso por tarefa (para chain/paralelo)

**Streaming do modo paralelo**:
- Mostra todas as tarefas com status ao vivo (⏳ rodando, ✓ concluído, ✗ falhou)
- Atualiza à medida que cada tarefa avança
- Mostra o status "2/3 done, 1 running"
- Retorna a saída final de cada tarefa concluída para o modelo pai, limitada a 50 KB por tarefa
- Retorna diagnósticos de falha a partir do stderr/mensagens de erro quando um filho é encerrado antes de produzir saída

**Formatação das chamadas de ferramentas** (imita ferramentas nativas):
- `$ command` para bash
- `read ~/path:1-10` para read
- `grep /pattern/ in ~/path` para grep
- etc.

## Definições de Agentes

Agentes são arquivos markdown com frontmatter YAML:

```markdown
---
name: my-agent
description: What this agent does
tools: read, grep, find, ls
model: claude-haiku-4-5
---

System prompt for the agent goes here.
```

Quando o `model` é omitido, o subagente herda o modelo ativo e o nível de pensamento (thinking level) da sessão de despacho.

**Localizações:**
- `~/.3pi/agent/agents/*.md` - Nível de usuário (sempre carregado)
- `.3pi/agents/*.md` - Nível de projeto (apenas com `agentScope: "project"` ou `"both"`)

Agentes de projeto sobrescrevem agentes de usuário com o mesmo nome quando `agentScope: "both"`.

## Agentes de Exemplo

| Agente | Propósito | Modelo | Ferramentas |
|-------|---------|-------|-------|
| `scout` | Reconhecimento rápido da base de código | Haiku | read, grep, find, ls, bash |
| `planner` | Planos de implementação | Sonnet | read, grep, find, ls |
| `reviewer` | Revisão de código | Sonnet | read, grep, find, ls, bash |
| `worker` | Propósito geral | Sonnet | (todas padrão) |

## Prompts de Fluxo de Trabalho

| Prompt | Fluxo |
|--------|------|
| `/implement <query>` | scout → planner → worker |
| `/scout-and-plan <query>` | scout → planner |
| `/implement-and-review <query>` | worker → reviewer → worker |

## Tratamento de Erros

- **Código de saída != 0**: Ferramenta retorna erro com stderr/saída
- **stopReason "error"**: Erro do LLM propagado com mensagem de erro
- **stopReason "aborted"**: Interrupção do usuário (Ctrl+C) encerra o subprocesso, lança erro
- **Modo chain**: Para na primeira etapa que falha, reporta qual etapa falhou

## Limitações

- Saída truncada aos últimos 10 itens na visão recolhida (expanda para ver todos)
- A saída paralela visível para o modelo é limitada a 50 KB por tarefa; resultados completos permanecem nos detalhes da ferramenta
- Agentes são descobertos a cada invocação (permite edição no meio da sessão)
- Modo paralelo limitado a 8 tarefas, 4 concorrentes
