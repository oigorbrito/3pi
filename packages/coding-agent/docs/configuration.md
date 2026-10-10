# Configuração

O Pi suporta configuração em nível de usuário e de projeto. A configuração em nível de usuário fica no diretório do agent, que por padrão é `~/.3pi/agent`. A configuração do projeto fica em `.3pi` sob o diretório de trabalho e é carregada após a [confiança do projeto](security.md#understand-project-trust) (project trust) ser concedida. A única exceção é o `sessionDir`, que o Pi lê antes de resolver a confiança para que possa localizar as sessões.

No modo interativo, use `/settings` para alterar preferências comuns. Para outras opções, peça ao Pi para atualizar a configuração ou edite os arquivos relevantes diretamente. Execute `/reload` após alterar manualmente configurações, atalhos de teclado (keybindings), instruções ou recursos.

## Diretório do agent

O diretório do agent é mostrado como `<agent-dir>` abaixo. Defina sua localização com a variável de ambiente `PI_CODING_AGENT_DIR` ou a opção [`agentDir`](sdk.md) do SDK.

| Caminho | Responsabilidade |
|---|---|
| `<agent-dir>/settings.json` | [Configurações](settings.md) (settings) em nível de usuário, incluindo preferências, padrões, caminhos de recursos e declarações de pacotes do Pi. |
| `<agent-dir>/keybindings.json` | [Atalhos de teclado](keybindings.md) (keybindings) personalizados da interface de terminal e da aplicação. |
| `<agent-dir>/mcp.json` | [Servidores MCP](mcp.md) disponíveis em todos os projetos. |
| `<agent-dir>/models.json` | [Endpoints compatíveis, modelos e substituições de modelo](models.md#configure-a-compatible-endpoint). |
| `<agent-dir>/auth.json` | Chaves de API e credenciais OAuth salvas. |
| `<agent-dir>/AGENTS.override.md`, `AGENTS.md`, `AGENTS.MD`, `CLAUDE.md`, ou `CLAUDE.MD` | Instruções de usuário aplicadas em todos os diretórios de trabalho. |
| `<agent-dir>/SYSTEM.md` | Substitui o system prompt padrão do Pi. |
| `<agent-dir>/APPEND_SYSTEM.md` | Adiciona instruções ao system prompt do Pi. |
| `<agent-dir>/extensions/` | [Extensões](extensions.md) (extensions) do usuário. |
| `<agent-dir>/skills/` | [Skills](skills.md) do usuário e arquivos de suporte. |
| `<agent-dir>/prompts/` | [Templates de prompt](prompt-templates.md) do usuário expostos como slash commands. |
| `<agent-dir>/themes/` | Arquivos de [tema](themes.md) (theme) do usuário. |

## Diretório `.3pi` do projeto

| Caminho | Responsabilidade |
|---|---|
| `.3pi/settings.json` | [Configurações](settings.md) em nível de projeto, caminhos de recursos e declarações de pacotes do Pi. |
| `.3pi/mcp.json` | [Servidores MCP](mcp.md) do projeto. |
| `.3pi/SYSTEM.md` | Substitui o system prompt para o projeto. |
| `.3pi/APPEND_SYSTEM.md` | Adiciona instruções específicas do projeto ao system prompt. |
| `.3pi/extensions/` | Extensões do projeto. |
| `.3pi/skills/` | Skills do projeto e arquivos de suporte. |
| `.3pi/prompts/` | Templates de prompt do projeto expostos como slash commands. |
| `.3pi/themes/` | Arquivos de tema do projeto. |

Para `SYSTEM.md` e `APPEND_SYSTEM.md`, o arquivo do projeto confiável tem precedência sobre o arquivo correspondente no diretório do agent. Arquivos com o mesmo nome não são combinados.

## Arquivos de contexto

Os arquivos de contexto são separados da configuração `.3pi` do projeto. O Pi os carrega do diretório do agent, do diretório de trabalho e de seus diretórios pai. Um arquivo de contexto se aplica sempre que o Pi for executado em seu diretório ou em qualquer lugar abaixo dele.

Um `AGENTS.override.md` substitui `AGENTS.md` ou `CLAUDE.md` apenas no mesmo diretório. Ele não suprime arquivos de contexto do diretório do agent ou de outros diretórios.

A descoberta de arquivos de contexto não requer confiança do projeto.
