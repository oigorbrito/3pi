# durable

Um pequeno agente de codificação local em `@earendil-works/3pi-durable`. Um processo possui o runtime de modelo, a Harness (estrutura) durável, seu armazenamento SQLite, e a TUI. Ele reutiliza o runtime de modelo do pi, autenticação, configurações, system prompt, atalhos de teclado (keybindings), tema, e componentes interativos; o agente em si é a Harness durável com suas `CodingTools` embutidas.

```bash
node --import ./packages/coding-agent/src/experimental/source-resolver.ts packages/coding-agent/src/experimental/durable/main.ts
node --import ./packages/coding-agent/src/experimental/source-resolver.ts packages/coding-agent/src/experimental/durable/main.ts --continue
```

Uma nova sessão se inicia com o modelo padrão do pi e com o nível de pensamento (thinking level) vindos de `settings.json`. `--continue` abre a sessão mais recente para o diretório atual. As sessões residem sob `~/.3pi/agent/experimental/durable-sessions/<cwd-hash>/<session>/session.sqlite`; um lock previne a entrada de um segundo processo (um lock deixado por um crash fica obsoleto após 10 segundos, e a próxima inicialização aguardará isso). Faça o login com o próprio pi; as credenciais são compartilhadas.

## O que ele mostra

- **Durabilidade:** cada parte (partial) transmitida em stream, saída de ferramenta, fila, e turno é submetida (committed). Interrompa o processo no meio de uma chamada de ferramenta e inicie-o novamente com `--continue`: a chamada interrompida recebe um resultado interrompido e o turno é concluído. Nada na TUI lida com recuperação; ela apenas renderiza a visualização da conversa.
- **Visualização Única:** a TUI renderiza `Conversation.viewState()`, a montagem estrutural da transcrição e os documentos embutidos (`pi.live`, `pi.inbox`, `pi.agent`, `pi.usage`). Streaming, progresso das ferramentas, a fila, retries, status de compactação, o modelo, e o uso de recursos, tudo vem disso.
- **Subagentes:** a ferramenta `subagent` roda uma tarefa em uma conversa filha que pertence à chamada. `/agents` muda a visualização para qualquer conversa, inclusive enquanto o subagente trabalha, e o editor então conversa com ele: direcione-o (steer) enquanto estiver ocupado, ou continue a conversa após o retorno da chamada. O Esc aborta o trabalho da conversa sendo exibida; abortar o turno principal aborta seus subagentes.
- **Grafo de Tarefas:** um painel ao vivo de `Harness.taskGraph()`, exibido por padrão e alternado com `/tasks`: cada tarefa ativa, o que ela aguarda, e as conversas que possui.

## Comandos

- enviar (submit): digite o prompt enquanto estiver ocioso, faça direcionamento (steer) enquanto ocupado
- tecla follow-up (`app.message.followUp`): coloca um follow-up na fila
- Esc: aborta o trabalho da conversa exibida, incluindo uma compactação manual
- `/model` ou a tecla do modelo: seleciona um modelo para a conversa exibida
- tecla de pensamento (Shift+Tab): alterna entre os níveis de pensamento (thinking levels)
- `/compact [instructions]`: resume contextos antigos; reporta "Nada para compactar" ("Nothing to compact") quando o contexto couber em `compaction.keepRecentTokens`
- `/agents`: alterna entre as conversas
- `/tasks`: esconde ou mostra o painel de tarefas
- tecla de expandir ferramentas (Ctrl+O): expande as saídas de ferramentas e resumos de compactação
- tecla de limpar (Ctrl+C) ou Ctrl+D: sai imediatamente, ao contrário do Ctrl+C do pi que primeiro limpa; trabalhos em andamento são retomados com `--continue`

## Estrutura (Layout)

| arquivo | papel |
| --- | --- |
| `main.ts` | argumentos, abrir, rodar, fechar |
| `sessions.ts` | diretórios da sessão e o lock |
| `runtime.ts` | Harness, registro, configurações, ambientes; as visualizações diretas `DurableView` e `DurableController` |
| `prompt.ts` | as seções do system prompt do pi (tools, rules, docs, AGENTS.md, skills, cwd) em uma única extensão |
| `subagent.ts` | a ferramenta subagente executada em primeiro plano (foreground) |
| `tui.ts` | renderização usando os componentes interativos do pi |

Limiares de compactação, política de tentativas (retry), modos de fila, e os timeouts das requisições vêm do `settings.json` do pi conforme carregado na inicialização, lidos pelos getters das configurações da Harness em cada uso. O dispatcher HTTP do pi é configurado assim como no pi; sem ele, alguns streams de provedores terminam antes da hora.

Um turno que termina sem resposta apresenta um aviso; um que seja recuperado após um reinício não o faz, já que apenas submissões feitas por este processo são acompanhadas (watched).

O que não está aqui: a lista de sessões e o seletor para continuar, ramificações (forks) e navegação em árvore, extensões, modelos de prompt (prompt templates), imagens, `/login`.
