# Usar o Pi no terminal

Execute o `pi` a partir da pasta em que você deseja trabalhar. O Pi usa essa pasta para descobrir arquivos, instruções e configuração, e para agrupar as sessões salvas. Se você ainda não instalou o Pi ou não escolheu um model, siga o [Quickstart](quickstart.md).

O Pi pode perguntar se você confia (trust) na pasta de trabalho antes de carregar seus recursos de projeto. Veja [Project trust](security.md#understand-project-trust).

<p align="center"><img src="images/interactive-mode.png" alt="Pi modo interativo mostrando uma conversa, editor e informações de status" width="750"></p>

O transcript (transcrição) mostra seus prompts, as respostas do Pi, chamadas de tools, resultados e erros. Você escreve prompts e comandos no editor. O rodapé mostra a pasta atual, sessão, model, uso de contexto, além do uso e custo acumulados.

## Inserir um prompt

Digite uma solicitação e pressione `Enter` para enviá-la. Use `Shift+Enter` para adicionar uma linha, ou pressione `Ctrl+G` para trabalhar em um prompt mais longo no seu editor externo configurado.

Para incluir arquivos ou imagens:

- Digite `@` para procurar um arquivo e adicioná-lo ao seu prompt.
- Pressione `Tab` para autocompletar um caminho.
- Cole uma imagem ou arraste-a para um terminal compatível.

## Acompanhar o trabalho do Pi

O Pi mostra cada chamada de tool e resultado enquanto trabalha. Pressione `Ctrl+O` para expandir ou recolher a saída da tool. Pressione `Ctrl+T` para mostrar ou ocultar blocos de thinking.

O cabeçalho de inicialização lista as instruções e os recursos que o Pi carregou. A borda do editor indica o nível de thinking atual. O rodapé é atualizado conforme o model usa o contexto e relata o uso.

O Pi não pede permissão antes de cada chamada de tool. Revise comandos e arquivos alterados, e use um sandbox para trabalho não confiável ou autônomo (unattended). Veja [Security](security.md).

## Mudar de direção

Você pode enviar mais inputs enquanto o Pi está trabalhando:

| O que você deseja | Ação |
|---|---|
| Ajustar a tarefa atual | Digite uma mensagem e pressione `Enter` |
| Adicionar trabalho após a tarefa atual | Digite uma mensagem e pressione `Alt+Enter` |
| Retornar mensagens enfileiradas ao editor | Pressione `Alt+Up` |
| Parar a tarefa atual | Pressione `Escape` |

Uma mensagem enviada com `Enter` aguarda até que a resposta atual e suas chamadas de tools terminem, para então guiar a próxima resposta. Um follow-up enviado com `Alt+Enter` aguarda até que o Pi termine a tarefa atual. Abortar a operação retorna as mensagens enfileiradas para o editor.

O Windows Terminal reserva alguns atalhos Alt. Veja [Terminal Setup](terminal-setup.md) para as alternativas no Windows.

## Mudar o model ou configurações

Digite `/` para pesquisar os comandos disponíveis. Os comandos que você usará com mais frequência são:

- `/model` seleciona um model. Pressione `Ctrl+L` para abrir o mesmo seletor.
- `/thinking` seleciona a quantidade de raciocínio que o model atual usa. Pressione `Shift+Tab` para alternar entre os níveis suportados.
- `/login` e `/logout` gerenciam o acesso do provider.
- `/settings` altera as preferências comuns.

Prompt templates, skills e extensions podem adicionar mais comandos ao mesmo menu. Veja [Choose a Model](models.md), [Configuration](configuration.md) ou a referência completa de [Slash Commands](slash-commands.md).

## Continuar ou recomeçar

O Pi salva as sessões automaticamente a menos que a persistência de sessão esteja desativada.

- `/new` inicia uma nova sessão.
- `/resume` abre outra sessão salva.
- `/name` dá à sessão atual um nome reconhecível.
- `/session` mostra seu arquivo, ID, contagem de mensagens, uso de tokens e custo.

Use `/tree`, `/fork` ou `/clone` quando quiser explorar outra abordagem sem perder o trabalho existente. Use `/compact` para reduzir o histórico da conversa enviado para o model. Veja [Sessions and Context](sessions.md) para esses workflows.

Depois de sair do Pi, execute `pi --continue` a partir da mesma pasta para retomar sua sessão mais recente.

## Executar um comando de terminal

Prefixe um comando com `!` para executá-lo e incluir sua saída na conversa:

```text
!git status
```

Use `!!` quando você quiser executar um comando sem enviar sua saída para o model.

## Copiar, exportar ou compartilhar resultados

Pressione `Ctrl+X` ou execute `/copy` para copiar a última resposta do assistente. Use `/export` para salvar a sessão como HTML ou JSONL.

Use `/share` para fazer upload da sessão e obter um link de visualização. Com a autenticação Radius, o artifact fica visível para sua organização Radius. Caso contrário, o Pi cria um GitHub gist privado através da CLI do GitHub. Revise a sessão primeiro porque ela pode conter prompts, saídas de tools, conteúdos de arquivos e credenciais expostas durante a conversa.

## Ajustar o terminal

O modo tela cheia (fullscreen), que é o padrão, mantém o editor e a área de status fixos enquanto o transcript rola dentro da janela do terminal. O modo regular usa o scrollback normal do terminal. Escolha um modo através de `/settings` ou `--tui-mode`.

O suporte do terminal à entrada do mouse, atalhos de teclado e imagens embutidas pode variar. Veja [Terminal Setup](terminal-setup.md) para configuração específica da plataforma e [Keybindings](keybindings.md) para todos os atalhos configuráveis. Execute `/hotkeys` para inspecionar os atalhos ativos na sua sessão atual.

## Coletar informações de diagnóstico

Ao solucionar problemas de renderização de terminal ou estado da conversa, execute `/debug`. O Pi grava as linhas renderizadas do terminal e as mensagens da sessão atual em `pi-debug.log` em seu [agent directory](configuration.md#agent-directory).

Revise este arquivo antes de compartilhá-lo. Ele pode conter prompts, respostas do model, saídas de tools, conteúdo de arquivos e dados de terminal.
