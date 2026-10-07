<a id="cli-and-modes-reference"></a>

# Linha de Comando

Esta página documenta os comandos e opções de linha de comando embutidos do Pi. Execute `pi --help` ou anexe `--help` a um comando para ver a interface exata na sua versão instalada. A ajuda de nível superior também inclui as opções registradas pelas extensões carregadas.

```sh
pi [options] [--] [@files...] [messages...]
pi install <source> [options]
pi remove <source> [options]
pi uninstall <source> [options]
pi update [target] [options]
pi list
pi config [options]
pi auth <check|print-api-key|print-bearer-token> [options]
pi mcp <list|login|logout> [options]
```

<a id="modes"></a>

## Invocação e saída

```sh
pi
pi --print "Summarize this repository"
git diff | pi --print "Review this change"
pi --mode json "Inspect this repository" > events.jsonl
```

Com stdin e stdout no terminal, o Pi abre a interface de usuário (UI) do terminal a menos que `--print`, `--mode json` ou `--mode rpc` selecione outra interface. Quando qualquer um dos fluxos é redirecionado e nem o modo JSON nem o RPC é selecionado, o Pi usa o modo print. Consulte [Integração CLI](cli-integration.md) para escolher entre integração interativa, print, JSON, RPC e SDK.

| Entrada | Comportamento |
|---|---|
| `message` | Fornecer um prompt inicial |
| `@path` | Incluir um arquivo de texto ou imagem no primeiro prompt |
| stdin canalizado (piped) | Anexar seu conteúdo ao primeiro prompt |
| `--` | Parar o parsing de opções para que um prompt possa começar com `-` |

O Pi resolve `@path` a partir do diretório de trabalho atual. O diretório de trabalho também controla a configuração do projeto, descoberta de recursos e agrupamento de sessões.

`--print` controla se o Pi é executado uma vez e encerra. `--mode` seleciona a interface de saída. `--mode text` não força a execução de uma única vez (one-shot) quando stdin e stdout são terminais; use `--print` para esse comportamento.

| Opção | Comportamento |
|---|---|
| `-p`, `--print` | Executar os prompts fornecidos, escrever o texto final do assistente no stdout e sair |
| `--mode text` | Selecionar saída em texto; ainda abrir a interface do terminal quando stdin e stdout forem terminais |
| `--mode json` | Executar os prompts fornecidos, escrever eventos JSONL no stdout e sair |
| `--mode rpc` | Ler comandos JSONL no stdin e escrever respostas e eventos no stdout até o encerramento (shutdown) |
| `--export <input> [output]` | Exportar um arquivo de sessão para HTML e sair; derivar o destino quando `output` for omitido |

O modo RPC rejeita argumentos `@file`. Os modos JSON e RPC reservam o stdout para registros de protocolo. Consulte [Fluxo de Eventos JSON](json.md) e [Protocolo RPC](rpc.md).

<a id="model-options"></a>

## Modelos

```sh
pi --model sonnet:high
```

Consulte [Escolha um Modelo](models.md) para seleção de modelo e [Provedores](providers.md) para credenciais.

- `--provider <name>`<br>
  Restringe a busca de `--model` a um provedor. Ele requer `--model`.
- `--model <pattern>`<br>
  Seleciona por ID exato ou correspondência parcial (fuzzy) de ID/nome. Ele aceita `provider/id` e um sufixo opcional `:<thinking>`.
- `--api-key <key>`<br>
  Usa uma substituição de chave de API não persistente. Requer um modelo selecionado por meio de `--model` ou `--models`.
- `--thinking <level>`<br>
  Define `off`, `minimal`, `low`, `medium`, `high`, `xhigh` ou `max`. Substitui o sufixo de um `--model` e é limitado às capacidades do modelo.
- `--models <patterns>`<br>
  Define um escopo separado por vírgulas para inicialização e alternância (cycling). Ele aceita IDs exatos, correspondências fuzzy, globs insensíveis a maiúsculas/minúsculas e sufixos `:<thinking>` opcionais.
- `--list-models [search]`<br>
  Lista modelos disponíveis, filtrados opcionalmente por uma pesquisa fuzzy, e depois sai.

<a id="session-options"></a>

## Sessões

```sh
pi --continue
```

Consulte [Sessões e Contexto](sessions.md) para retomada, bifurcação (forking), nomenclatura e armazenamento de sessões.

- `-c`, `--continue`<br>
  Continua a sessão mais recente para o projeto atual.
- `-r`, `--resume`<br>
  Abre o seletor de sessão.
- `--session <path|id>`<br>
  Abre por caminho de arquivo, ID exato ou ID parcial. O Pi pesquisa primeiro no projeto atual e oferece fazer fork de uma correspondência entre projetos.
- `--session-id <id>`<br>
  Abre o ID exato da sessão do projeto ou o cria se ausente. IDs aceitam letras, números, `.`, `_` e `-`.
- `--fork <path|id>`<br>
  Faz um fork de uma sessão existente em uma nova sessão para o projeto atual.
- `--session-dir <dir>`<br>
  Substitui o armazenamento e a pesquisa. Tem precedência sobre `PI_CODING_AGENT_SESSION_DIR` e a configuração `sessionDir`.
- `--no-session`<br>
  Usa uma sessão em memória que não é persistida.
- `-n`, `--name <name>`<br>
  Define o nome de exibição da sessão.

Restrições:

- IDs de sessão devem começar e terminar com uma letra ou número.
- `--fork` não pode ser combinado com `--session`, `--continue`, `--resume` ou `--no-session`.
- `--session-id` não pode ser combinado com `--session`, `--continue` ou `--resume`. Combine-o com `--fork` para escolher o novo ID.

<a id="tool-options"></a>

## Ferramentas (Tools)

```sh
pi --tools read,grep,find,ls --print "Review this project"
```

Consulte [Configurações](settings.md#tools) para configurar a seleção padrão de ferramentas.

- `-t`, `--tools <list>`<br>
  Substitui a seleção padrão por uma allowlist separada por vírgulas de ferramentas embutidas, de extensão ou customizadas. Entradas são nomes de ferramentas ou padrões onde `*` corresponde a qualquer caractere. Ferramentas MCP são mantidas a menos que uma entrada comece com `mcp__` (veja [Ferramentas MCP](#mcp-tools)). Uma lista contendo apenas entradas `+name` e `-name` não é uma allowlist; em vez disso, ela altera a seleção padrão.
- `-xt`, `--exclude-tools <list>`<br>
  Desabilita ferramentas ou padrões separados por vírgulas após todas as outras opções de seleção, incluindo ferramentas MCP.
- `-nbt`, `--no-builtin-tools`<br>
  Desabilita ferramentas embutidas padrão mantendo as ferramentas de extensão e customizadas.
- `-nt`, `--no-tools`<br>
  Inicia com todas as ferramentas embutidas, de extensão, customizadas e MCP desabilitadas.

As ferramentas habilitadas por padrão são `read`, `bash`, `edit` e `write`, a menos que `defaultTools` as altere. `--tools` com nomes simples (plain names) substitui toda a seleção, portanto, nomeie todas as ferramentas desejadas. Assim como `defaultTools`, também aceita uma lista de apenas entradas `+name` e `-name`, que adiciona ou remove ferramentas da seleção padrão: `pi --tools +codemode,-write` mantém as outras ferramentas padrão, habilita `codemode` e desabilita `write`. Essas entradas recebem nomes exatos de ferramentas, não padrões `*`; use `--exclude-tools` para desabilitar ferramentas por padrão. Nomes simples e entradas `+name`/`-name` não podem ser misturados. `/reload` habilita ferramentas recém-adicionadas em `defaultTools`, mas uma ferramenta removida com `-name` permanece removida.

<a id="mcp-tools"></a>

### Ferramentas MCP

`--tools` seleciona as ferramentas declaradas ao modelo. Isso não remove ferramentas MCP, cujo alcance é definido por sua [exposição](mcp.md#control-tool-exposure): `pi --tools read,codemode` mantém todas as ferramentas MCP chamáveis por scripts codemode. Uma ferramenta MCP que nenhuma entrada nomeia ou corresponde nunca é declarada diretamente, independente de sua exposição; apenas `tool_search`, se listada, pode carregá-la. Uma vez que uma entrada começa com `mcp__`, `--tools` também filtra ferramentas MCP, logo, isso mantém apenas as ferramentas do servidor `radius`:

```sh
pi --tools read,bash,codemode,'mcp__radius__*'
```

As ferramentas de recursos MCP (`list_mcp_resources`, `list_mcp_resource_templates`, `read_mcp_resource`) contam como ferramentas MCP. Para remover ferramentas MCP, use `--exclude-tools 'mcp__*'` ou [`--no-mcp`](#resource-options).

| Embutida (Built-in) | Propósito |
|---|---|
| `read` | Ler arquivos de texto e imagens suportadas |
| `bash` | Executar comandos de shell |
| `powershell` | Executar comandos PowerShell no Windows |
| `edit` | Aplicar substituições de texto exatas a um arquivo existente |
| `write` | Criar ou sobrescrever um arquivo |
| `grep` | Pesquisar conteúdo de arquivos |
| `find` | Encontrar caminhos usando padrões glob |
| `ls` | Listar conteúdo do diretório |

Extensões embutidas adicionam mais duas ferramentas. Elas estão desativadas por padrão; a extensão MCP as ativa quando um servidor MCP necessita delas (veja [MCP](mcp.md#exposure)). Para habilitá-las você mesmo, nomeie-as em `--tools` ou `defaultTools`.

| Extensão embutida | Propósito |
|---|---|
| `codemode` | Executar JavaScript que chama as outras ferramentas, por exemplo, em paralelo com `Promise.allSettled`; apenas a saída do script chega ao modelo |
| `tool_search` | Pesquisar ferramentas que não estão declaradas ao modelo (exposição `codemode` e `deferred`, como ferramentas MCP) e declarar as correspondências para a próxima chamada |

### Habilitar codemode

Para ativar o `codemode` para cada sessão, adicione-o às ferramentas padrão em `~/.3pi/agent/settings.json` ou no `.3pi/settings.json` de um projeto:

```json
{
  "defaultTools": ["+codemode"]
}
```

Isso mantém `read`, `bash`, `edit` e `write` e adiciona `codemode`. Para uma invocação, adicione-o com `--tools`:

```sh
pi --tools +codemode
```

O Codemode é útil sem MCP: os scripts podem executar várias chamadas de ferramenta em paralelo, filtrar saídas extensas antes que atinjam o modelo, chamar modelos classificadores como o Jev da TypeSafe através de `models.classify()` (veja [Modelos classificadores](models.md#use-classifier-models)) e gerar imagens através de `models.generateImages()` (veja [Modelos de imagem](models.md#use-image-models)).

### Como funciona o codemode

Os scripts rodam em uma sandbox QuickJS e alcançam as outras ferramentas através de `tools.<name>(args)`. [Codemode](codemode.md) descreve a API de script, como as ferramentas são listadas e encontradas, o global `store()` e `models`, bem como seus limites.

### Pesquisa de ferramenta (Tool search)

`tool_search` está desativado por padrão; ative com `"defaultTools": ["+tool_search"]` ou `--tools`. Ele usa a mesma classificação do `searchTools()` para encontrar ferramentas não declaradas e declarar as correspondências para a próxima chamada do modelo. As ferramentas carregadas são registradas na sessão como outras alterações de ferramenta, portanto, elas permanecem declaradas naquele branch.

<a id="resource-options"></a>

## Recursos

```sh
pi --extension ./review.ts
```

Consulte [Configuração](configuration.md) para diretórios convencionais e confiança no projeto, [Configurações](settings.md#resources) para caminhos configurados e [Pacotes Pi](packages.md) para fontes de pacotes.

- `-e`, `--extension <path>`<br>
  Carrega um arquivo ou diretório de extensão, ou uma extensão embutida, como `builtin:mcp`, e é repetível.
- `-ne`, `--no-extensions`<br>
  Desabilita extensões descobertas, configuradas e embutidas. Caminhos de `-e` explícitos ainda carregam, então `pi -ne -e builtin:mcp` mantém apenas o suporte MCP embutido.
- `--no-mcp`<br>
  Desabilita o suporte MCP embutido para esta execução: nenhum servidor se conecta e não há ferramentas MCP ou `/mcp`. Isso não afeta uma extensão que substitui o suporte MCP embutido.
- `--skill <path>`<br>
  Carrega um arquivo ou diretório de skill e é repetível.
- `-ns`, `--no-skills`<br>
  Desabilita skills descobertas e configuradas. Caminhos `--skill` explícitos ainda carregam.
- `--prompt-template <path>`<br>
  Carrega um arquivo ou diretório de prompt-template e é repetível.
- `-np`, `--no-prompt-templates`<br>
  Desabilita templates descobertos e configurados. Caminhos `--prompt-template` explícitos ainda carregam.
- `--theme <path>`<br>
  Carrega um arquivo ou diretório de tema e é repetível.
- `--use-theme <name[/name]>`<br>
  Seleciona o tema inicial interativo para esta execução.
- `--no-themes`<br>
  Desabilita temas descobertos e configurados. Caminhos `--theme` explícitos ainda carregam.
- `-nc`, `--no-context-files`<br>
  Desabilita a descoberta de `AGENTS.md` e `CLAUDE.md`.

Caminhos de recursos se aplicam apenas ao processo atual. Caminhos relativos são resolvidos a partir do diretório de trabalho atual.

<a id="prompt-and-display-options"></a>

## Prompts e processo

```sh
pi --append-system-prompt ./instructions.md
```

Consulte [Configuração](configuration.md) para configurações salvas, [Segurança](security.md#understand-project-trust) para confiança no projeto e [Variáveis de Ambiente](environment-variables.md) para controles do processo.

- `--system-prompt <text|path>`<br>
  Substitui o system prompt padrão por texto ou conteúdo de um arquivo existente.
- `--append-system-prompt <text|path>`<br>
  Anexa texto ou um arquivo existente ao system prompt e é repetível.
- `--tui-mode <mode>`<br>
  Usa o modo de terminal `fullscreen` (padrão) ou `regular`.
- `--verbose`<br>
  Mostra informações de inicialização interativas verbosas, sobrescrevendo `quietStartup`.
- `-a`, `--approve`<br>
  Confia na configuração e nos recursos locais do projeto para este processo.
- `-na`, `--no-approve`<br>
  Ignora configurações e recursos locais do projeto restritos por confiança para este processo.
- `--offline`<br>
  Desabilita a atividade de rede automática, incluindo atualizações do catálogo de modelos. Equivalente a `PI_OFFLINE=1`.
- `-h`, `--help`<br>
  Exibe a ajuda, incluindo flags registradas pelas extensões carregadas, e sai.
- `-v`, `--version`<br>
  Mostra a versão do Pi e sai.

Extensões podem registrar opções adicionais de formulário longo. Opções curtas desconhecidas são rejeitadas.

## Comandos de pacotes

```sh
pi install npm:@scope/package
```

Consulte [Pacotes Pi](packages.md) para formatos de fonte, filtragem, instalação e escopo de projeto.

### Tarefas comuns

| Tarefa | Comando |
|---|---|
| Instalar um pacote | `pi install <source>` |
| Listar pacotes configurados | `pi list` |
| Remover um pacote e sua entrada de configuração | `pi remove <source>` |
| Configurar quais recursos do pacote carregar | `pi config` |

Adicione `--local` ou `-l` em `install`, `remove`, `uninstall` ou `config` para usar as configurações do projeto em vez das globais.

### Atualizar o Pi ou pacotes

Executar `pi update` sem um alvo atualiza o próprio Pi.

| Tarefa | Comando |
|---|---|
| Atualizar o Pi | `pi update` |
| Atualizar todos os pacotes instalados | `pi update --extensions` |
| Atualizar um pacote instalado | `pi update <source>` |
| Atualizar os catálogos de modelos | `pi update --models` |
| Atualizar o Pi e todos os pacotes instalados | `pi update --all` |

Adicione `--force` para reinstalar o Pi quando a atualização selecionada incluir o Pi.

`pi update` não consegue atualizar o Pi quando outro gerenciador de pacotes o fornece, como o Nix. Atualize o Pi com aquele gerenciador, por exemplo `nix profile upgrade pi`. As atualizações de pacote e catálogo de modelos continuam funcionando.

### Aliases e opções de comando

- `pi uninstall <source>` é um alias para `pi remove <source>`.
- `pi update --self`, `pi update self` e `pi update pi` são aliases para `pi update`.
- `pi update --extension <source>` é um alias para `pi update <source>`.
- `-a`, `--approve` confia em arquivos locais do projeto para um comando. `-na`, `--no-approve` ignora arquivos locais restritos por confiança.
- Anexe `-h` ou `--help` a um comando para ver sua sintaxe exata e restrições de opções.

## Comandos de credencial

```sh
pi auth check --provider openai --json
```

Comandos de autenticação requerem `--provider <provider>` ou `--model <model>`. Consulte [Provedores](providers.md) para os métodos suportados.

| Comando | Descrição |
|---|---|
| `pi auth check` | Imprime `ready`, `not_ready` ou `invalid`; sai com status `0`, `1` ou `2`, respectivamente |
| `pi auth print-api-key` | Imprime a chave da API resolvida |
| `pi auth print-bearer-token` | Imprime um token bearer OAuth resolvido |

| Opção | Aplica-se a | Descrição |
|---|---|---|
| `--provider <provider>` | Todos | Resolver credenciais para um provedor |
| `--model <model>` | Todos | Resolver credenciais de um modelo; pode ser combinado com `--provider` |
| `--json` | `auth check` | Escrever o resultado estruturado em JSON |
| `--credentials` | `auth check` | Emitir a credencial resolvida quando pronta |
| `--no-refresh` | `auth check` | Não atualizar credenciais OAuth expiradas; atualizar (refresh) é o padrão |
| `--min-expiry <duration>` | `print-bearer-token` | Exigir o tempo de vida restante do token usando `ms`, `s`, `m` ou `h`, como por exemplo `30m` |

Comandos que imprimem credenciais gravam os segredos no stdout.

## Comandos MCP

Esses comandos funcionam fora de uma sessão, então agentes podem executá-los por meio do `bash`. Consulte [Servidores MCP](mcp.md).

| Comando | Descrição |
|---|---|
| `pi mcp add <server> [options] -- <command> [args...]` | Adicionar ou substituir um servidor stdio no `mcp.json`; `--env KEY=VALUE` (repetível) e `--cwd <dir>` configuram seu ambiente e diretório de trabalho. Argumentos após o comando são repassados para ele |
| `pi mcp add <server> [options] --url <url>` | Adicionar ou substituir um servidor HTTP transmíssivel; `--header KEY=VALUE` (repetível), `--bearer-token-env-var <NAME>` (envia `Authorization: Bearer ${NAME}`), `--oauth-client-id`, `--oauth-client-secret`, `--oauth-callback-port`, e `--oauth-client-name` configuram a autenticação |
| `pi mcp remove <server>` | Remover um servidor do `mcp.json`; as credenciais OAuth armazenadas são preservadas |
| `pi mcp list [--json]` | Conectar a cada servidor habilitado e exibir seu estado, ferramentas e erros; sai com código `1` se houver alguma configuração inválida ou se um servidor habilitado não estiver conectado |
| `pi mcp login <server> [--timeout <seconds>]` | Realizar login num servidor OAuth: abre a página de autorização e aguarda pelo navegador (padrão 300 segundos); um terminal também aceita colar a URL de redirecionamento |
| `pi mcp logout <server>` | Apagar as credenciais OAuth salvas de um servidor |

`add` e `remove` alteram `~/.3pi/agent/mcp.json`, ou `.3pi/mcp.json` no diretório atual com `--local` (`-l`). `add` também aceita `--exposure <mode>` (veja [Exposição](mcp.md#exposure)) e `--description <text>` e não tenta conectar; rode `pi mcp list` para verificar o servidor.

Os arquivos `.3pi/mcp.json` de um projeto são lidos somente caso os projetos já sejam ambientes de confiança.
