# Integração CLI

Por padrão, executar `pi` abre a interface interativa do terminal. Quando a entrada ou saída é canalizada (piped) ou redirecionada, o Pi usa o modo print em vez disso. Você também pode selecionar os modos print, JSON ou RPC explicitamente para scripts e aplicações.

Todos os quatro modos usam o mesmo agent, sessões, recursos e ferramentas (tools). O modo determina como a entrada chega ao Pi, como a saída é exposta e se o processo permanece disponível para mais comandos.

O SDK não é um modo CLI. Ele incorpora o agent diretamente em um processo Node.js ou Bun. Consulte o [SDK](sdk.md) quando o acesso direto via TypeScript for preferível a um limite de processo.

## Escolha um modo

| Modo | Interface | Tempo de vida | Use quando |
|---|---|---|---|
| Interativo (Interactive) | Terminal UI | Até o usuário sair | Uma pessoa estiver trabalhando com o Pi diretamente |
| Print | Texto final no stdout | Uma invocação | Um script precisar da resposta final do assistente |
| JSON | Eventos JSONL no stdout | Uma invocação | Um processo precisar do progresso estruturado de uma execução |
| RPC | Comandos, respostas e eventos JSONL | Longa duração | Um processo precisar de controle bidirecional |

As opções da CLI ainda selecionam o diretório de trabalho, modelo, tools, recursos e persistência de sessão independentemente do modo. Consulte [Linha de Comando](cli.md) para as opções completas de inicialização.

## Print no stdout

O modo print executa os prompts fornecidos, escreve o texto final do assistente no stdout e sai:

```bash
pi --print "Summarize the changes in this repository"
```

Use o modo print quando apenas o texto final for necessário, incluindo substituição de comandos, pipelines e jobs rápidos. Eventos intermediários não são expostos.

O modo print escreve erros no stderr. Uma resposta final do assistente com um motivo de parada (stop reason) `error` ou `aborted` produz um status de saída diferente de zero.

Quando nenhum modo é selecionado explicitamente, stdin ou stdout não-TTY também selecionam o modo print. Isso permite entrada e saída canalizadas sem adicionar `--print`.

## Fluxo de eventos JSON

O modo JSON escreve um cabeçalho de sessão seguido de eventos do agent e da sessão como JSON delimitado por novas linhas:

```bash
pi --mode json "Review this repository" > events.jsonl
```

Esta é uma saída de evento estruturada, não um resultado JSON único ou uma restrição no formato da resposta do modelo.

Todos os prompts são fornecidos quando o processo inicia. O processo transmite (streams) eventos para aquela execução e então sai; ele não aceita comandos posteriores.

Uma resposta do assistente que falhou ou foi abortada aparece no fluxo de eventos, mas não produz por si só um status de saída diferente de zero. Inspecione os eventos quando o sucesso ou a falha importarem. O Pi ainda sai com status diferente de zero se a invocação lançar um erro.

Registros de `message_update` transmitidos contêm deltas em vez de um snapshot de mensagem crescente. Monte a saída ao vivo a partir dos eventos delta, depois substitua-a pela mensagem autoritativa do `message_end`.

`agent_end` pode ser seguido por recuperação automática ou trabalho enfileirado. `agent_settled` marca o fim do trabalho automático para a execução atual.

Stdout é reservado para JSONL. Diagnósticos e logs da aplicação são escritos no stderr. Consulte [Fluxo de Eventos JSON](json.md) para formatação, estruturas de eventos e regras de reconstrução.

## Controle o Pi com RPC

O modo RPC mantém o Pi rodando enquanto outro processo envia comandos e recebe respostas e eventos:

```bash
pi --mode rpc --no-session
```

Os comandos são objetos JSON escritos no stdin. Respostas e eventos são objetos JSON escritos no stdout. Cada registro ocupa uma linha.

Adicione um `id` aos comandos que precisam de correlação. A resposta correspondente repete esse ID. Eventos geralmente não têm ID de comando porque descrevem a atividade da sessão em vez de uma solicitação.

Uma resposta `prompt` bem-sucedida significa que o prompt foi aceito, enfileirado ou tratado. Não significa que a execução terminou. Continue consumindo eventos através do `agent_settled` quando a conclusão importar.

Comandos RPC podem mudar modelos, inspecionar estado, gerenciar sessões, executar comandos de shell e responder a solicitações de UI de extensão.

Diálogos de extensão formam um subprotocolo de requisição-resposta. Outras atualizações de UI de extensão são notificações que um cliente pode exibir ou ignorar. Capacidades de extensão apenas para TUI estão indisponíveis ou degradadas fora do modo interativo.

Para integrações Node.js ou TypeScript, prefira `RpcClient` de `@earendil-works/3pi-coding-agent`. Ele inicia um processo filho RPC do Pi, correlaciona requisições, expõe métodos de comando tipados e entrega eventos de sessão para listeners.

O [exemplo de cliente RPC](../examples/rpc-client.ts) envia um prompt, transmite texto e atividade de tool, espera por `agent_settled` e desliga o processo filho. Ele está incluído nas verificações de TypeScript do repositório.

`RpcClient.promptAndWait()` instala seu listener de evento antes de enviar o prompt, evitando uma condição de corrida (race) com conclusões rápidas. Para operações separadas, inscreva-se antes de chamar `prompt()` e chame `waitForIdle()` apenas enquanto uma execução estiver ativa.

O cliente requer um caminho para uma CLI executável do Pi. O exemplo do repositório aponta para `dist/cli.js`, então o pacote deve ser construído (build) antes que esse exemplo rode a partir de um checkout.

Se você está construindo um cliente sem `RpcClient`, comece com [Protocolo RPC](rpc.md), depois use [Comandos RPC](rpc-commands.md) e [Fluxo de Eventos JSON](json.md) como as referências de rede (wire).

## Faça um fork e mude a marca do Pi

Um fork do código fonte pode alterar o nome da CLI e o diretório de configuração através do `package.json`:

```json
{
  "piConfig": {
    "name": "my-agent",
    "configDir": ".my-agent"
  }
}
```

Altere o campo `bin` no nível superior para definir o nome do executável. Essas configurações afetam o banner da CLI, caminhos de configuração e nomes derivados de variáveis de ambiente.

## Exemplos e referências

- [Cliente RPC](../examples/rpc-client.ts): integração Node.js tipada
- [UI de extensão RPC](../examples/rpc-extension-ui.ts): cliente de terminal customizado com diálogos de extensão
- [Linha de Comando](cli.md): opções de inicialização e seleção de modo
- [Fluxo de Eventos JSON](json.md): referência de evento JSON
- [Protocolo RPC](rpc.md): ciclo de vida RPC, formatação (framing), erros e desligamento
- [Comandos RPC](rpc-commands.md): referência de comando e resposta
- [UI de Extensão RPC](rpc-extension-ui.md): subprotocolo de interação de extensão
- [Exemplos de SDK](../examples/sdk/): integrações TypeScript em processo
