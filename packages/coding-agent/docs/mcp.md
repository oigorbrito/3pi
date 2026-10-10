# Servidores MCP

O Pi conecta-se a servidores do [Model Context Protocol](https://modelcontextprotocol.io) (MCP) através de stdio ou HTTP streamable e disponibiliza as suas tools e recursos para o modelo.

## Configuração rápida

Adicione um servidor stdio local, verifique a conexão, e então inicie o Pi:

```bash
pi mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem .
pi mcp list
pi
```

Para um servidor remoto:

```bash
pi mcp add docs --url https://example.com/mcp --bearer-token-env-var DOCS_TOKEN
pi mcp list
```

Esses comandos adicionam servidores no nível de usuário por padrão. Adicione `--local` ou `-l` para gravar a configuração do projeto em vez disso:

```bash
pi mcp add -l tools --env API_KEY='${TOOLS_KEY}' -- uvx tools-mcp
```

Use `/mcp` dentro de uma sessão interativa para inspecionar conexões, fazer login, reconectar, mudar a exposição (exposure), ou ativar/desativar servidores. Execute `/reload` após adicionar, remover ou alterar um servidor fora da sessão.

## Configure servidores

O Pi lê servidores do nível de usuário de `~/.3pi/agent/mcp.json` e servidores do projeto de `.3pi/mcp.json`. A configuração do projeto é lida apenas após a [confiança do projeto](security.md#understand-project-trust) ser concedida. Uma entrada de projeto substitui uma entrada de usuário com o mesmo nome.

Uma entrada de projeto sem `command`, `url`, ou `type` sobrescreve apenas `enabled`, `exposure`, e `toolExposure` do servidor do usuário com o mesmo nome e mantém o restante, incluindo `env`, `headers`, e `auth`. Por exemplo, isso desativa um servidor de usuário em um projeto:

```json
{
  "mcpServers": {
    "internal-tools": { "enabled": false }
  }
}
```

O formato corresponde ao de outros clientes MCP:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    },
    "docs": {
      "url": "https://example.com/mcp",
      "headers": { "Authorization": "Bearer ${DOCS_TOKEN}" },
      "description": "Busque e leia a documentação do produto"
    }
  }
}
```

Servidores stdio usam `command`, `args`, `env`, e `cwd`. Valores de `cwd` relativos são resolvidos contra o diretório da sessão. Um `~/` no início de `command`, um argumento, ou `cwd` nomeia o diretório home.

Servidores HTTP usam `url`, `headers`, e `oauth` (veja [Autenticar com OAuth](#authenticate-with-oauth)). O transporte SSE legado não é suportado.

Ambos os tipos de servidor suportam:

- `timeout`: tempo limite por requisição em segundos (padrão 60). Notificações de progresso o redefinem.
- `enabled: false`: manter a entrada sem conectar a ela.
- `exposure` e `toolExposure`: controla como as tools chegam ao modelo (veja [Controlar exposição de tool](#control-tool-exposure)).
- `description`: o que o servidor oferece, em uma frase. Isso lista o servidor no prompt de sistema (veja [Controlar exposição de tool](#control-tool-exposure)), a busca de tool o ranqueia por isso, e `describeNamespace()` do codemode o retorna. Sem ele, a primeira linha das instruções do servidor é usada assim que ele se conectar.

Mantenha servidores pessoais e servidores com credenciais no arquivo do usuário. Use o arquivo do projeto apenas para os servidores que o projeto exige, e apenas em projetos confiáveis.

### Regras de configuração

- Nomes de servidor podem conter apenas letras, dígitos, `_` e `-`. As tools recebem o nome `mcp__<server>__<tool>`, com cada caractere que não seja letra, dígito ou `_` substituído por `_`; tools de um servidor cujos nomes então colidam todas recebem um sufixo de hash. Nomes de servidor que diferem apenas em `-` e `_` contam como o mesmo servidor.
- `type` é opcional. Um `command` seleciona stdio e uma `url` seleciona streamable HTTP. Quando presente, `type` deve ser `stdio`, `http`, ou `streamable-http`.
- `sse` é rejeitado. Servidores que documentam um endpoint SSE frequentemente também fornecem streamable HTTP, comumente em `/mcp` em vez de `/sse`.
- `command` é um executável e `args` contém os seus argumentos. Não é uma string de comando do shell.
- Valores de `env` e `headers` podem usar variáveis de ambiente como `${GITHUB_TOKEN}`. Eles também podem rodar um comando com `!command`, mas o comando deve compor o valor todo, por exemplo `"Authorization": "!echo Bearer $(gh auth token)"`.
- Entradas inválidas são relatadas e ignoradas sem impedir que outros servidores se conectem.

`pi mcp add` e `pi mcp remove` cobrem mudanças comuns do shell. Veja [comandos MCP](cli.md#mcp-commands) para as suas opções.

### Inspecionar ou alterar um servidor

`/mcp` lista os servidores configurados com os seus status, contagem de tools, exposição e fonte de configuração. Servidores que precisam de atenção aparecem primeiro. Selecione um servidor para inspecionar as suas tools e detalhes da conexão, reconectar, entrar ou sair (login/logout), mudar exposição ou ativá-lo/desativá-lo.

Alterações de estado (ativo/inativo) ou de exposição são salvas no arquivo que define o servidor, sem substituir conteúdo não relacionado. Em um projeto confiável, "Ativar neste projeto" e "Desativar neste projeto" adicionam uma substituição de projeto para um servidor de usuário.

Os comandos de shell funcionam sem uma sessão: `pi mcp add`, `pi mcp remove`, `pi mcp list`, `pi mcp login` e `pi mcp logout`. Comandos de shell não carregam extensões.

### Diagnosticar problemas de conexão

Execute `pi mcp list` para conectar a todo servidor ativado e imprimir o seu estado, tools e erros. Ele sai com status 1 quando uma entrada é inválida ou um servidor ativado não está conectado. `/mcp` mostra o erro de conexão completo e o final do stderr de um servidor stdio que falhou.

O Pi reporta erros de configuração, conexões falhas e necessidades de login uma vez após a inicialização. Notificações de log do servidor são anexadas a `~/.3pi/agent/mcp.log` como `<time> [<server>] <level> <logger>: <message>`.

O Pi conecta a todo servidor ativado em segundo plano quando uma sessão inicia. As tools do servidor aparecem quando ele conecta. O primeiro prompt espera até 10 segundos apenas por servidores com tools `direct`, que devem ser declaradas em sua requisição. Outros servidores são esperados quando necessários: um script do codemode espera pelos servidores que ele nomeia (`mcp__<server>`) e, quando chama `searchTools()` ou lê `ALL_TOOLS`, espera por todos eles.

Parar um servidor stdio fecha o seu stdin, envia SIGTERM, depois SIGKILL ao grupo de processos. Isso também para servidores lançados através de wrappers como `npx` ou `uvx`.

## Migrar configuração de outro cliente

Mova a entrada convertida para baixo de `mcpServers` em `mcp.json`, depois rode `pi mcp list` para validá-la.

| Cliente | Conversão |
|---|---|
| Claude Desktop, Claude Code, ou Cursor | Copie a entrada `mcpServers` existente. |
| VS Code | Mova uma entrada do objeto superior `servers` e substitua os prompts `${input:...}` por variáveis de ambiente `${NAME}`. |
| Codex | Converta campos TOML de `[mcp_servers.<name>]` como `command`, `args`, `env`, e `url` para JSON. |
| OpenCode | Converta `"type": "local"` para uma entrada stdio, divida o seu array `command` em `command` e `args`, renomeie `environment` para `env`, e substitua `{env:NAME}` por `${NAME}`. Converta `"type": "remote"` para uma entrada URL. |

## Autenticar com OAuth

Servidores remotos que usam OAuth, como Sentry, não precisam de credenciais no `mcp.json`:

```json
{
  "mcpServers": {
    "sentry": { "url": "https://mcp.sentry.dev/mcp" }
  }
}
```

Quando o servidor rejeita uma conexão não autenticada, `/mcp` mostra que precisa de login. Selecione "Sign in", rode `/mcp login sentry`, ou rode `pi mcp login sentry`. O Pi abre a página de autorização e espera a aprovação. Se o navegador roda em outra máquina, cole a URL de redirecionamento de volta na tela de login.

O Pi registra-se com o servidor de autorização, armazena tokens em `~/.3pi/agent/mcp-auth.json`, e os renova (refresh) quando expiram.

O OAuth se aplica a servidores HTTP sem um cabeçalho `Authorization`. Para um servidor que não suporta registro dinâmico de cliente, configure um cliente registrado:

```json
{
  "mcpServers": {
    "example": {
      "url": "https://mcp.example.com/mcp",
      "oauth": { "clientId": "my-client", "clientSecret": "${EXAMPLE_SECRET}", "callbackPort": 8765 }
    }
  }
}
```

(Restante das opções de OAuth omitidas por brevidade, pois detalham configuração avançada de clientId/callbackPort, documentada identicamente no original).

## Controlar exposição de tool

Cada tool do servidor é registrada como `mcp__<server>__<tool>`. A `exposure` do servidor determina como o modelo a atinge:

| Exposição | Comportamento | Uso típico |
|---|---|---|
| `codemode` (padrão) | Chamável de scripts de [`codemode`](cli.md#tools). | Servidores MCP gerais. |
| `deferred` | Não declarada até que [`tool_search`](cli.md#tools) a encontre. | Servidores grandes que devem ser chamados após busca. |
| `direct` | Declarada ao modelo como uma tool built-in. | Conjuntos de tools pequenos e frequentemente usados. |
| `hidden` | Registrada mas inacessível. | Servidores ou tools que devem continuar indisponíveis. |

`codemode-deferred` é aceito como alias para `codemode`.

A exposição por tool pode ser sobrescrita através de `toolExposure`.

## Usar recursos

Quando um servidor conectado oferece recursos, o Pi adiciona as tools de recurso `list_mcp_resources`, `list_mcp_resource_templates`, e `read_mcp_resource`.

Essas tools alcançam todo servidor ativado, não oculto (non-hidden) com recursos. A sua exposição é a exposição mais ampla dentre os servidores (ex: `direct`, depois `codemode`).

## Permissões

Toda chamada MCP passa pelo pipeline de tools do Pi. Os manipuladores de extensão `tool_call` e `tool_result`, incluindo os de permissões, portanto aplicam-se a tools do MCP.

## Extensões e SDK

Extensões podem adicionar servidores para a sessão atual usando `pi.registerMcpServer(name, config)`. Além disso, o suporte embutido ao MCP pode ser substituído por uma extensão que registre a rota `/mcp`. No SDK, pode-se usar o MCP através das extensões correspondentes de codemode e tool-search.
