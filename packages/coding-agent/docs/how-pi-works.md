# Como o Pi Funciona

O Pi coordena requisições de modelos, execução de ferramentas, montagem de contexto e armazenamento de sessões. Uma sessão é o registro do Pi de uma conversa, incluindo mensagens, chamadas e resultados de ferramentas, alterações de modelo, compactações e outros eventos.

Mensagens e eventos em uma sessão formam uma árvore. Cada caminho através dessa árvore é uma ramificação (branch). A ramificação que termina na entrada atual é a ramificação ativa e fornece o histórico para a próxima requisição de modelo.

## Loop do agent

Uma mensagem enviada é adicionada à ramificação ativa. O Pi constrói uma requisição de modelo a partir do system prompt, da ramificação ativa, das ferramentas disponíveis e das configurações do modelo, e a envia através do provedor selecionado.

O provedor transmite (streams) uma resposta de assistente, que pode conter texto e chamadas de ferramenta. O Pi registra a resposta, executa cada chamada de ferramenta e registra os resultados. Isso completa um turno (turn). Se os resultados das ferramentas ou as mensagens enfileiradas exigirem outra requisição de modelo, o Pi inicia outro turno. Caso contrário, a execução termina.

Mensagens de direcionamento (steering) entram após o turno do assistente atual. Mensagens de acompanhamento (follow-up) entram após o agent concluir o trabalho pendente. Abortar interrompe a execução atual e devolve as mensagens enfileiradas para o editor.

## Contexto

A ramificação ativa fornece o histórico da conversa. O Pi converte suas entradas de sessão em mensagens compatíveis com o modelo: usuário, assistente e resultado de ferramenta.

O Pi constrói o system prompt a partir de suas instruções básicas e arquivos de contexto descobertos. A requisição também carrega definições de ferramentas e descrições de skills.

Instruções completas de skills são carregadas sob demanda. Extensões podem adicionar instruções ou transformar o contexto.

Templates de prompt expandem a entrada do editor antes que ela se torne uma mensagem do usuário. Arquivos selecionados, imagens, texto colado e saída de shell podem se tornar conteúdo de mensagem.

## Sessões

Sessões persistentes são arquivos JSONL. Cada entrada da árvore possui um ID e se refere ao seu pai. A entrada atual identifica a ramificação ativa.

Continuar a partir de uma entrada anterior cria outra ramificação no mesmo arquivo. Fazer um fork e clonar copia o histórico selecionado para um novo arquivo de sessão.

O contexto do modelo é reconstruído a partir da ramificação ativa. A compactação insere uma entrada de resumo que substitui as mensagens mais antigas nas requisições de modelo subsequentes. As entradas originais permanecem na árvore da sessão.

## Interfaces

O modo interativo renderiza os eventos da sessão e do agent no terminal. O modo print executa um prompt e escreve a resposta final. O modo JSON escreve os eventos do agent como JSONL.

O modo RPC aceita comandos JSONL no stdin e escreve respostas e eventos no stdout. O SDK em TypeScript cria e controla as sessões do agent no mesmo processo (in process).

Todas as interfaces usam o mesmo agent e mecanismos de sessão.

## Extensões e recursos

Extensões são módulos TypeScript carregados no processo do Pi. Suas funções de fábrica (factory functions) registram ferramentas, comandos, atalhos, provedores, tratadores de eventos (event handlers), renderizadores e UI de terminal.

Skills fornecem instruções sob demanda e arquivos de suporte. Templates de prompt fornecem texto de mensagem reutilizável. Temas fornecem cores de terminal. Os pacotes do Pi distribuem esses recursos através do npm ou git.

## Confiança e permissões

O Pi resolve a confiança do projeto (project trust) antes de carregar as configurações e recursos do projeto. Após a decisão de confiança e o carregamento dos recursos do projeto, o Pi carrega os arquivos de contexto. Ferramentas habilitadas usam as permissões do sistema operacional do processo do Pi. As extensões são executadas dentro desse processo.
