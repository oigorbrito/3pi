# vacation

Um agente de planejamento de férias durável com uma TUI, construído sobre `@earendil-works/3pi-durable`. É uma cópia do agente de código durável em [`../durable`](../durable) com as ferramentas de codificação e o prompt de codificação do pi substituídos por um planejador de férias. Só se parece com um agente de codificação porque reutiliza os componentes TUI interativos do pi.

A partir de um checkout do pi, após `npm install` e `npm run build`:

```bash
node packages/coding-agent/src/experimental/vacation/main.ts
node packages/coding-agent/src/experimental/vacation/main.ts --continue
```

Sem um build, pré-carregue o resolvedor de origem para que os pacotes do workspace carreguem de `src` em vez de `dist`:

```bash
node --import ./packages/coding-agent/src/experimental/source-resolver.ts packages/coding-agent/src/experimental/vacation/main.ts
```

Uma nova sessão inicia com o model padrão do pi e nível de thinking a partir do `settings.json`. O `--continue` abre a sessão mais nova para o diretório atual. As sessões residem em `~/.3pi/agent/experimental/vacation-sessions/<cwd-hash>/<session>/session.sqlite`. Faça login com o próprio pi; as credenciais são compartilhadas.

## O que ele mostra

- **Subagente em segundo plano (Background subagent):** a ferramenta `research` inicia um subagente em sua própria conversa e retorna imediatamente. Uma tarefa em segundo plano entrega a solicitação e posta o relatório do subagente de volta na conversa principal como uma nova mensagem, para que você possa continuar conversando com o agente principal enquanto a pesquisa é executada.
- **Chamadas de ferramentas duráveis em paralelo:** as chamadas de pesquisa (`search`) do subagente rodam em paralelo, cada uma como a sua própria tarefa no painel de tarefas. Os resultados são padronizados; cada tópico leva um tempo diferente.
- **Recuperação:** `search` é seguro de ser re-executado. Encerre o processo enquanto a busca ainda estiver acontecendo e comece ele de volta acionando a flag `--continue`: toda pesquisa encerrada prevalecerá mantida na recuperação da base. Aquela ainda devendo fechar voltará a rodar e fará com que no fim o relato aterrisse de igual modelo. Pedidos detêm suas identificações em solicitações que poupam o agente do erro fatídico de repassar tanto ele mesmo quanto respostas mais que apenas desta única forma esperada.
- **Todo o resto proveniente do agente durável de código:** steerings (direcionamentos), acompanhamentos em follow-ups, uso das tags `/agents`, `/compact`, `/tasks`, `/model`.

## Tente

1. "Plan a weekend in Vienna for two. Hand the research to a subagent." (Planeje um final de semana em Viena para dois. Entregue a pesquisa para um subagente.)
2. Enquanto a busca transcorre, vá mandando as perguntas desejadas ao próprio agente primário ou mande as que desejar.
3. Ctrl+C enquanto faltar para o fim do processo focar só as informações de trem (trains) apenas. Logo depois disso a rotina começará de forma recuperada com um passe novo pela ativação usando: `--continue`.
4. `/agents` para observar ou dar uma orientação da sua forma pretendida num comando steer frente à base local ali mostrada. Recorrer de novo para `/agents` será modo que bastará a retroceder sua visão central novamente.

## Layout

| arquivo | papel |
| --- | --- |
| `vacation.ts` | extensões do vacation: as diretrizes de busca com `search`, de avaliação aprimorada via `research` associadas à ferramenta e envio da requisição feita como prompt da sua demanda focada no planejamento |
| `main.ts` | argumentos, métodos a se abranger e atuar num abrir (open), executar (run), e se encerrar na rotina de fechamento (close) |
| `sessions.ts` | manipula informações de diretórios destas ditas sessões ativas (e de outras) enquanto usa seus travas que fecham a operação |
| `harness-setup.ts` | configuração de HTTP, registro e a base fundamental à execução daquela definição da ferramenta sob parâmetros a qual formam a constituição principal do registro |
| `runtime.ts` | o chicote atador propriamente que abriga os visores como sendo planificados numa face exposta tanto na exibição por meio da interface da ferramenta DurableView quanto de condução frente seu controle no uso pelo DurableController |
| `tui.ts` | faz a renderização adotando aquelas exibições já configuradas e feitas com os conhecidos componentes gráficos já em base nativa iterativa em Pi |
