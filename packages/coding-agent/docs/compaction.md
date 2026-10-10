# Referência de Compactação

Esta referência descreve a compactação automática, a sumarização de ramificações (branch summarization), as entradas persistidas e os ganchos (hooks) de extensão. Para o fluxo de trabalho do usuário, veja [Sessões e Contexto](sessions.md#manage-conversation-context).

**Arquivos de origem** ([pi](https://github.com/earendil-works/pi)):
- [`packages/coding-agent/src/core/compaction/compaction.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/compaction.ts) - Lógica da autocompactação
- [`packages/coding-agent/src/core/compaction/branch-summarization.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts) - Sumarização de ramificações
- [`packages/coding-agent/src/core/compaction/utils.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/utils.ts) - Utilitários compartilhados (rastreamento de arquivo, serialização)
- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/session-manager.ts) - Tipos de entrada (`CompactionEntry`, `BranchSummaryEntry`)
- [`packages/coding-agent/src/core/extensions/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/extensions/types.ts) - Tipos de eventos de extensões

Para as definições em TypeScript no seu projeto, inspecione `node_modules/@earendil-works/3pi-coding-agent/dist/`.

## Visão Geral

O Pi possui dois mecanismos de sumarização:

| Mecanismo | Acionador (Trigger) | Propósito |
|-----------|---------|---------|
| Compactação (Compaction) | Contexto excede o limite, ou `/compact` | Sumarizar as mensagens mais velhas para liberar espaço no contexto |
| Sumarização de ramificações | Navegação com `/tree` | Preservar o contexto na alternância de branches |

Ambos se utilizam de formatações estruturadas diretamente correlacionadas que operam de modo a atuar de forma a mapear e registrar do ou/as o de/a as ações e operações base nas formatações sobre e nas lidas em/de nas do ou a de "file operations cumulatively". Demandas em requisições/submissões a figurar no crivo da/do a nas ou/na na de e/a e a a de na/de "Summarization requests" a atuam e na o e as do e a/na ou na desabilitam as em as de a no das o ou e e do no e da de em das a ou as e "disable prompt-cache writes" uma e ou da de em vez que/a as o e do de ou a/a do as as ou em do que as ou de "because these one-off prompts" atestam a e em as e ou as do as das as/os/a ou a não em e ou nas "are unlikely to be reused".

## Compactação

### Quando Dispara (Triggers)

A autocompactação é ativada quando:

```
contextTokens > contextWindow - reserveTokens
```

Por padrão, a variável associada aos reservas estipulada via `reserveTokens` é estabelecida na quantidade na formatação do formato via `16384` unidades atestadas de contagem como `tokens` (a configuração consta operando englobada no arquivo ou nos `~/.3pi/agent/settings.json` ou então num atrelado com foco em `/a/na` diretriz com alvo estipulado num/a e `<project-dir>/.3pi/settings.json`). Esta sobra via reserva ou "reserve" estipula uma faixa resguardada a servir de espaço visando e atestando do espaço na atuação/espaçamento para receber as saídas provindas contidas no formato em devolutivas formatadas no espaço em a e em/na/nas de a a de ou a "LLM's response".

No decorrer e durante o arranjo a figurar como um desdobramento atrelado a em/nas a nas ou de um de um o e "multi-turn agent run", o processo engajando as nas de "Pi" avalia/checa a estipulação a figurar com do as e a ou as a a o ou as e e do a em na "canonical projected context" tão a ou de e a e em ou as/a de na as em/do e a ou "after tools finish" as a de a/os de/da a a/na os em a de a/e a o a as "and their results are appended", operando a de no a e o do e a e ou a a a o/de "before starting the next assistant response". Dado nas nas as ou que as ou a/e ou em de se da e ou nas de as/do na nas "If the threshold is crossed", do/os na/os/as e ou a e no o "Pi compacts during `prepareNextTurn`", no/em as a o/do ou e o ou a na "then performs the existing catch-up steering poll before `turn_start`". Ele as ou/e o na e o na e o na o do de e na de/nas de o "skips this between-turn check" a de/nas da do os as e a de em do de as a "when the completed tool batch terminates the run and no queued message requires another response". O processo a do/o a do Pi a de/em "also checks before a new user prompt" do/de no nas o as as/e o as ou/da as "and performs final-attempt overflow recovery after the low-level run ends".

Um erro e nas as/de do ou de "provider context-overflow error" do as na a e a de/ou ou a ou/do "an early final `stopReason: "length"`" no o ou na as o a de/a a de ou do a de em de/do "can select one compact-and-retry recovery attempt". No as do/os de/a em do/a as ou de "Length responses with tool calls" a nas e ou as e de de as as/a "retain their synthetic failed tool results and follow the ordinary tool/queue scheduler" em na/os de ou/do a ou as o do no "rather than forcing the run to end".

O comando e/a a as/do de do de ou/os o no a e a na e/ou a as e "You can also trigger manually with `/compact [instructions]`", a na do as os/as na ou de "where optional instructions focus the summary".

### Como Funciona

1. **Localizar o ponto de corte (Find cut point)**: Trilhe o do o na as ou de/os de/o "Walk backwards through the finalized session projection", juntando no na/e do ou de "accumulating token estimates until `keepRecentTokens`" (o valor em e na de/o de no as na ou de "default 20k", o nas as a e/do ou a no/as e "configurable in `~/.3pi/agent/settings.json` or `<project-dir>/.3pi/settings.json`") de/do ou de e a na/no a/os de o "is reached"
2. **Extrair mensagens**: Apanhe no as ou os/do as e de as ou de a/a na "Collect projected messages from the previous kept boundary (or session start) up to the cut point"
3. **Gerar resumo (Generate summary)**: Invoque/Chame/Submeta o e a/do ou de e a do as a/as o ou "Call LLM to summarize with structured format", passando a de o a ou do e as/a de o "passing the previous summary as iterative context when present"
4. **Acrescentar (Append) entrada**: Deposite/Afixe/Anexe e no a ou as a "Save `CompactionEntry` with summary and `firstKeptEntryId`"
5. **Reconstruir (Rebuilds) contexto**: O estado da o do o as e as/da ou de e o "Session rebuilds the context for the next request", com/do/o e ou de as as o no e/a as "using summary + messages from `firstKeptEntryId` onwards"

```
Antes da compactação:

  entry:  0     1     2     3      4     5     6      7      8     9
        ┌─────┬─────┬─────┬──────┬─────┬─────┬──────┬──────┬─────┬─────┐
        │ hdr │ usr │ ass │ tool │ usr │ ass │ tool │ tool │ ass │ tool│
        └─────┴─────┴─────┴──────┴─────┴─────┴──────┴──────┴─────┴─────┘
                └────────┬───────┘ └──────────────┬──────────────┘
               messagesToSummarize            kept messages
                                   ↑
                          firstKeptEntryId (entry 4)

Após a compactação (nova entrada acrescentada):

  entry:  0     1     2     3      4     5     6      7      8     9     10
        ┌─────┬─────┬─────┬──────┬─────┬─────┬──────┬──────┬─────┬─────┬─────┐
        │ hdr │ usr │ ass │ tool │ usr │ ass │ tool │ tool │ ass │ tool│ cmp │
        └─────┴─────┴─────┴──────┴─────┴─────┴──────┴──────┴─────┴─────┴─────┘
               └──────────┬──────┘ └──────────────────────┬───────────────────┘
                 não enviado ao LLM                    enviado ao LLM
                                                         ↑
                                              inicia a partir de firstKeptEntryId

O que o LLM vê:

  ┌────────┬─────────┬─────┬─────┬──────┬──────┬─────┬──────┐
  │ system │ summary │ usr │ ass │ tool │ tool │ ass │ tool │
  └────────┴─────────┴─────┴─────┴──────┴──────┴─────┴──────┘
       ↑         ↑      └─────────────────┬────────────────┘
    prompt   da cmp          mensagens a partir de firstKeptEntryId
```

Em ocorrências ou no de "repeated compactions", o escopo em "summarized span" o nas do e "starts at the previous compaction's kept boundary (`firstKeptEntryId`)", e ou do a a do "not at the compaction entry itself", recaindo ou/e as de/as a no e o na de o do "falling back to the entry after the previous compaction if that kept entry cannot be found in the path". O molde de o de ou no/em e o/do e a as de "A retain-none compaction records its own ID as `firstKeptEntryId`"; nas ou do/a/de e/em a "repeated compaction starts after that entry". Tal na as no/a e a e o "This preserves messages that survived the earlier compaction by including them in the next summarization pass as well". De/A nas a o Pi as ou de a as o do as e "Pi also recalculates `tokensBefore` from the rebuilt, context-edited session projection before writing the new `CompactionEntry`", de/e a/as as o de ou na a/os "so the token count reflects the actual pre-compaction context being replaced". As omissões do a e no de as ou de a o "Omitted raw entries remain stored but do not affect cut selection, summaries, checkpoints, or token estimates".

### Ordenação da Recuperação (Overflow and Length Recovery)

A do/o a/de a as ou o de "Recovery preserves the existing lifecycle and queue order". As/A o de a a o "The completed attempt remains visible to `turn_end` and `agent_end`"; as a de o do as/a e/do na a na o do "post-run recovery then repairs persisted model context before a fresh retry":

```text
persistir a resposta final do assistente
→ extensão/público turn_end
→ extensão/público agent_end
→ acrescentar as omissões do context_edit para a tentativa selecionada
→ para overflow/length: executar session_before_compact e acrescentar a compactação em caso de sucesso
→ iniciar a nova tentativa como uma execução (run) do zero
```

No a do ou de se o a "If recovery compaction fails or is cancelled", as do de a o do Pi a as "Pi keeps the omission edits, appends no compaction, and schedules no internal retry". As/o o de as ou de o "Existing queued work remains governed by ordinary steering and follow-up rules". A/O o de as a "agent_before_settle sees the repaired projection after recovery processing". A do o de as ou "Raw transcript history, exports, billing totals, and history-search extensions can still inspect the omitted attempt".

### Span da mensagem de usuário particionado (Split user-message spans)

Um a o/de do a/um "user-message span starts with a user message and includes all turns until the next user message". De praxe, ou "Normally, compaction cuts at user-message boundaries".

Em as o da ou a do de ou de a as "When one user-message span exceeds `keepRecentTokens`, the cut point lands within that span at an assistant message". Do ou "This is a split user-message span":

```
Span de mensagem de usuário particionado (um span excede o orçamento):

  entry:  0     1     2      3     4      5      6     7      8
        ┌─────┬─────┬─────┬──────┬─────┬──────┬──────┬─────┬──────┐
        │ hdr │ usr │ ass │ tool │ ass │ tool │ tool │ ass │ tool │
        └─────┴─────┴─────┴──────┴─────┴──────┴──────┴─────┴──────┘
                ↑                                     ↑
         turnStartIndex = 1                  firstKeptEntryId = 7
                │                                     │
                └──── turnPrefixMessages (1-6) ───────┘
                                                      └── kept (7-8)

  isSplitTurn = true
  messagesToSummarize = []  (sem spans de mensagens de usuário anteriores)
  turnPrefixMessages = [usr, ass, tool, ass, tool, tool]
```

Para as do a de a "split user-message spans", o o a/o "Pi generates two summaries and merges them":
1. **Resumo do Histórico**: o de/a as do "Previous context (if any)"
2. **Resumo do prefixo do span de usuário**: a/o de/as de ou a "The early part of the split user-message span"

### Regras do ponto de corte (Cut Point Rules)

São/Os ou de as/a do e/de a "Valid cut points are":
- as/do de "User messages"
- as/do de "Assistant messages"
- as/do de "BashExecution messages"
- as/do de "Custom messages (custom_message, branch_summary)"

De do o na e de de/ou/a a as/o de a o de/as "Never cut at tool results (they must stay with their tool call)".

A na/de a as/o e do/a ou a do de o as "Preparation advances the kept boundary into a context-invisible suffix only when that suffix contains an omitted assistant attempt and no unomitted context-producing entries". As do/de/o de a "Recovery `context_edit` omissions satisfy this rule; intrinsically context-invisible metadata may coexist with them". A na/e as de e a/os do/a de as do de/na de o "Metadata alone and newly appended custom messages do not move the cut". A de o de as na/os de "A replacement edit affecting the candidate input or summarized prefix also blocks advancement because the omitted assistant answered the pre-edit input; replacements of suffix entries that are ultimately omitted remain safe". As/O ou de "This allows an over-budget recovered input to be summarized while retaining the edits that keep the abandoned attempt omitted, without making bookkeeping change whether new model input is preserved verbatim".

### Estrutura da CompactionEntry

O/Na e a do as/de de "Defined in [`session-manager.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/session-manager.ts)":

```typescript
interface CompactionEntry<T = unknown> {
  type: "compaction";
  id: string;
  parentId: string | null;
  timestamp: string;
  summary: string;
  firstKeptEntryId: string;
  tokensBefore: number;
  usage?: Usage;       // LLM usage that generated the summary
  fromHook?: boolean;  // true if provided by extension (legacy field name)
  details?: T;         // implementation-specific data
}

// Default compaction uses this for details (from compaction.ts):
interface CompactionDetails {
  readFiles: string[];
  modifiedFiles: string[];
}
```

Extensões a/ou/o as de as do a/de o "can store any JSON-serializable data in `details`". A do de as/a as de a a de ou de a a/do "The default compaction tracks file operations, but custom extension implementations can use their own structure". As/O ou de o "Generated and extension-provided summaries store their LLM `usage` when available so session totals include summarization work".

Consulte ou/a as a do a "See [`prepareCompaction()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/compaction.ts) and [`compact()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/compaction.ts) for the implementation". A na ou e o do a e de as o "For direct programmatic summarization, `generateSummary()` returns the summary text and `generateSummaryWithUsage()` returns `{ text, usage }`".

## Sumarização de Ramificação (Branch Summarization)

### Quando Dispara

O do ou/as a/e/as/do/os/na "When you use `/tree` to navigate to a different branch, Pi offers to summarize the work you're leaving". Tal/Isto na o de o as "This injects context from the left branch into the new branch".

### Como Funciona

1. **Achar ancestral comum**: o do o as ou de a as a "Deepest node shared by old and new positions"
2. **Coletar entradas**: do ou a as do "Walk from old leaf back to common ancestor"
3. **Preparar com orçamento (budget)**: a do as ou as e a do e "Include messages up to token budget (newest first)"
4. **Gerar resumo**: o as ou de a "Call LLM with structured format"
5. **Acrescentar entrada**: a o do as "Save `BranchSummaryEntry` at navigation point"

```
Tree antes da navegação:

         ┌─ B ─ C ─ D (old leaf, sendo abandonado)
    A ───┤
         └─ E ─ F (alvo)

Ancestral comum: A
Entradas a serem sumarizadas: B, C, D

Após a navegação com o resumo:

         ┌─ B ─ C ─ D
    A ───┤
         └─ E ─ F ─ [resumo de B,C,D] (novo leaf)
```

### Rastreamento Acumulativo de Arquivos

As de ou e a do e de "Default compaction and branch summarization track files cumulatively". As e de as ou de a/do "Both extract file operations from tool calls in the messages being summarized". A ou/e a do/as de e as do "Compaction also carries file lists from the previous Pi-generated compaction". A e ou/de/o as do o "Branch summarization carries file lists from Pi-generated branch summaries in the entries it summarizes".

De na/e as de e/a do as o de/do de o as "File tracking therefore accumulates across default compactions and nested default branch summaries". O Pi a/ou de/as as/o a as do de o de a/as "Pi does not automatically carry file lists from extension-generated summaries whose `fromHook` field is `true`; extensions manage their own `details` format".

### Estrutura da BranchSummaryEntry

Na ou as de/e a do a/as de/do "Defined in [`session-manager.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/session-manager.ts)":

```typescript
interface BranchSummaryEntry<T = unknown> {
  type: "branch_summary";
  id: string;
  parentId: string | null;
  timestamp: string;
  summary: string;
  fromId: string;      // Entry we navigated from
  usage?: Usage;       // LLM usage that generated the summary
  fromHook?: boolean;  // true if provided by extension (legacy field name)
  details?: T;         // implementation-specific data
}

// Default branch summarization uses this for details (from branch-summarization.ts):
interface BranchSummaryDetails {
  readFiles: string[];
  modifiedFiles: string[];
}
```

O ou as de o do a "Same as compaction, extensions can store custom data in `details`".

Consulte e o a/as as o/de de "See [`collectEntriesForBranchSummary()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts), [`prepareBranchEntries()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts), and [`generateBranchSummary()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts) for the implementation".

## Formato do Resumo

Ambos os de as a de ou o "Both formats include Goal, Constraints & Preferences, Progress, Key Decisions, and Next Steps". Os do ou as de as do "Compaction summaries also include Critical Context". Os do a e/as o "Branch summaries stop after Next Steps". O as a de ou o "Pi appends file lists to either format when relevant".

Os ou a as de "Compaction summaries use this format":

```markdown
## Goal (Objetivo)
[O que o usuário está tentando realizar]

## Constraints & Preferences (Restrições e Preferências)
- [Requisitos mencionados pelo usuário]

## Progress (Progresso)
### Done (Feito)
- [x] [Tarefas completadas]

### In Progress (Em andamento)
- [ ] [Trabalho atual]

### Blocked (Bloqueado)
- [Problemas, se houver]

## Key Decisions (Decisões Chave)
- **[Decisão]**: [Justificativa]

## Next Steps (Próximos Passos)
1. [O que deve acontecer em seguida]

## Critical Context (Contexto Crítico)
- [Dados necessários para continuar]

<read-files>
path/to/file1.ts
path/to/file2.ts
</read-files>

<modified-files>
path/to/changed.ts
</modified-files>
```

### Serialização de Mensagem

Ao as/ou de/do na o de/as o a o a "Before summarization, messages are serialized to text via [`serializeConversation()`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/compaction/utils.ts)":

```
[User]: What they said
[Assistant thinking]: Internal reasoning
[Assistant]: Response text
[Assistant tool calls]: read(path="foo.ts"); edit(path="bar.ts", ...)
[Tool result]: Output from tool
```

Isto as ou a/e de de o do/de/as de a o de do "This prevents the model from treating it as a conversation to continue".

As ou do a e de as do de a o "Tool results are truncated to 2000 characters during serialization". A de as/o e do o de a "Content beyond that limit is replaced with a marker indicating how many characters were truncated". O as a de ou do a/e o "This keeps summarization requests within reasonable token budgets, since tool results (especially from `read` and `bash`) are typically the largest contributors to context size".

## Sumarização Customizada via Extensões

Extensões e as ou de/do de a o a de "Extensions can intercept and customize both compaction and branch summarization". A ou de o a as/o de as de e/a "See [`extensions/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/extensions/types.ts) for event type definitions".

### session_before_compact

Disparado as de o de/ou/a a as/do do/de e "Fired before auto-compaction or `/compact`". As ou/e do/a o/de a/as "Can cancel or provide custom summary". A o as/do a o/de "See `SessionBeforeCompactEvent` and `CompactionPreparation` in the types file".

```typescript
pi.on("session_before_compact", async (event, ctx) => {
  const { preparation, branchEntries, customInstructions, reason, willRetry, signal } = event;

  // preparation.messagesToSummarize - mensagens para sumarizar
  // preparation.turnPrefixMessages - prefixo do span de mensagem do usuário (se for isSplitTurn)
  // preparation.previousSummary - resumo da compactação anterior
  // preparation.fileOps - operações de arquivo extraídas
  // preparation.tokensBefore - tokens de contexto antes da compactação
  // preparation.firstKeptEntryId - onde começam as mensagens mantidas
  // preparation.settings - configurações efetivas após aplicar as substituições do modelo

  // branchEntries - todas as entradas na ramificação atual (para estado customizado)
  // reason - "manual" (/compact), "threshold", ou "overflow"
  // willRetry - se a rodada abortada é retentada após a compactação (recuperação de overflow)
  // signal - AbortSignal (passar para chamadas do LLM)

  // Cancelar:
  return { cancel: true };

  // Resumo customizado:
  return {
    compaction: {
      summary: "O seu resumo...",
      firstKeptEntryId: preparation.firstKeptEntryId,
      tokensBefore: preparation.tokensBefore,
      // usage: summaryResponse.usage, // Opcional; incluído nos totais da sessão
      details: { /* dados customizados */ },
    }
  };
});
```

#### Convertendo Mensagens para Texto

Para do de as ou a a do/a o "To generate a summary with your own model, convert messages to text using `serializeConversation`":

```typescript
import { convertToLlm, serializeConversation } from "@earendil-works/3pi-coding-agent";

pi.on("session_before_compact", async (event, ctx) => {
  const { preparation } = event;
  
  // Converte AgentMessage[] para Message[], e em seguida serializa para texto
  const conversationText = serializeConversation(
    convertToLlm(preparation.messagesToSummarize)
  );
  // Retorna:
  // [User]: texto da mensagem
  // [Assistant thinking]: conteúdo do thinking
  // [Assistant]: texto da resposta
  // [Assistant tool calls]: read(path="..."); bash(command="...")
  // [Tool result]: texto de saída

  // Agora envie para o seu modelo fazer a sumarização
  const { summary, usage } = await myModel.summarize(conversationText);
  
  return {
    compaction: {
      summary,
      firstKeptEntryId: preparation.firstKeptEntryId,
      tokensBefore: preparation.tokensBefore,
      usage,
    }
  };
});
```

A ou as/o as a do/de o "See [custom-compaction.ts](../examples/extensions/custom-compaction.ts) for a complete example using a different model".

### session_compact_failed

As/O e/do/a ou/as a o de o de a/do a "Fired when manual or automatic compaction fails or is aborted". O e a/o de a o as ou/do/de a as "This is useful for telemetry extensions that need to pair `session_before_compact` attempts with terminal outcomes".

```typescript
pi.on("session_compact_failed", async (event, ctx) => {
  const { reason, errorMessage, aborted, willRetry, fromExtension } = event;
  // reason - "manual" (/compact), "threshold", ou "overflow"
  // errorMessage - presente para falhas não relativas a abortos
  // aborted - true para compactações canceladas/abortadas
  // willRetry - se a rodada abortada teria sido retentada após a compactação
  // fromExtension - se o conteúdo de compactação provido pela extensão estava sendo usado
});
```

### session_before_tree

O/A as de e/a ou do/a/do as o de "Fired before `/tree` navigation". As a/de ou o/de a do a e as do/de "Always fires regardless of whether user chose to summarize". As do/de/o a a do "Can cancel navigation or provide custom summary".

```typescript
pi.on("session_before_tree", async (event, ctx) => {
  const { preparation, signal } = event;

  // preparation.targetId - para onde estamos navegando
  // preparation.oldLeafId - posição atual (sendo abandonada)
  // preparation.commonAncestorId - ancestral compartilhado
  // preparation.entriesToSummarize - entradas que seriam sumarizadas
  // preparation.userWantsSummary - se o usuário optou por sumarizar

  // Cancelar a navegação por completo:
  return { cancel: true };

  // Fornecer resumo customizado (somente utilizado se userWantsSummary for true):
  if (preparation.userWantsSummary) {
    return {
      summary: {
        summary: "O seu resumo...",
        // usage: summaryResponse.usage, // Opcional; incluído nos totais da sessão
        details: { /* dados customizados */ },
      }
    };
  }
});
```

Veja de/o a as/do e/de "See `SessionBeforeTreeEvent` and `TreePreparation` in the types file".

## Configurações

Configure de as ou de a o "Configure compaction in `~/.3pi/agent/settings.json` or `<project-dir>/.3pi/settings.json`":

```json
{
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  }
}
```

| Configuração (Setting) | Padrão (Default) | Descrição |
|---------|---------|-------------|
| `enabled` | `true` | Habilitar a autocompactação |
| `reserveTokens` | `16384` | Tokens para reservar para a resposta do LLM |
| `keepRecentTokens` | `20000` | Tokens recentes a serem mantidos (não sumarizados) |

A ou de a/do e as de/do o de "Disable auto-compaction with `"enabled": false`". A/O de o as ou a de "You can still compact manually with `/compact`".

### Substituições por Modelo (Per-model overrides)

O a/e as do/de e/do a as o as/do "Use `compaction.modelOverrides` to tune token budgets for different models":

```json
{
  "compaction": {
    "reserveTokens": 16384,
    "keepRecentTokens": 20000,
    "modelOverrides": {
      "some-provider/big-model": {
        "reserveTokens": 400000
      }
    }
  }
}
```

A ou do e as/a o de/as do/de/do o e "For a model with a 1M context window, this override triggers compaction above 600K tokens and keeps the ordinary 20000 recent tokens". As do e/as ou o a do de o/as o "Other models retain the ordinary 16384-token reserve". A/O e a ou de o as/a do/de de as "`reserveTokens` also influences summarization output limits, capped by the model's maximum output tokens; it is not solely a trigger threshold".

A e do ou a do de o/as/e as/do as/na "Keys are exact, case-sensitive `provider/modelId` values, including any slashes within the model ID". O e/do o as de/do de a "Each `reserveTokens` and `keepRecentTokens` value falls back independently from the model override to the ordinary setting to the built-in default". Os/A/o ou de a a do de o/as de/as "Values must be non-negative safe integers". A e/do as de/do/as o "Invalid values in the matching model override produce an error when read; only omitted fields fall back to the ordinary setting". O as ou/a de o as do a "Model override entries must be objects". A e/do o/as de as do o "Invalid ordinary token settings produce an error when read, even if the active model has a valid override". A e/do ou de o/as a as do a/de o "Only omitted ordinary values use built-in defaults". O a/do ou de e a a do/de as o/as "`enabled` remains global, not model-specific".

As e a de as/a ou as do "These resolved values are used for manual compaction, all automatic threshold checks, overflow recovery, and extension-visible `preparation.settings`". As/O a de o/as ou de as/a o de as do "Model switches affect subsequent checks and compactions without changing ordinary settings". A a as de o do/as de e as "Compaction already in progress uses the model and settings captured for that operation". As/A o de/as ou de as/do/a e a "Branch summarization settings are unaffected".

As de o ou a do e as a/as do de "Overrides work in both global and project settings". A ou a/do de e/a as o as/do/e a/os/de "The files merge recursively before lookup, so a global model-specific value beats a project-wide fallback; a project must override that model entry to change it". A as do/o a/as ou de e "See [Settings](settings.md#per-model-compaction-overrides) for details".
