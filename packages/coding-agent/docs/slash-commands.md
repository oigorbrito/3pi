# Slash commands

Digite `/` no editor de terminal do Pi para pesquisar os comandos disponíveis na sessão atual. Esta página lista os comandos integrados na versão (release) atual do Pi.

Extensions, prompt templates e skills podem adicionar comandos. O menu de comandos no Pi é, portanto, a referência exata para os recursos carregados na sua sessão.

## Models e configurações

| Comando | Descrição |
|---|---|
| `/settings` | Abrir configurações |
| `/model [provider/model]` | Selecionar um model |
| `/thinking [level]` | Definir o nível de thinking |
| `/scoped-models` | Configurar os models usados pela alternância interativa |
| `/login [provider]` | Adicionar autenticação do provider |
| `/logout` | Remover autenticação do provider |
| `/llama` | Gerenciar models no roteador llama.cpp configurado |

## Sessões e contexto

| Comando | Descrição |
|---|---|
| `/new` | Iniciar uma nova sessão |
| `/resume` | Alternar para outra sessão salva |
| `/name [name]` | Definir o nome de exibição da sessão, ou mostrar o nome atual quando omitido |
| `/session` | Mostrar informações e estatísticas da sessão atual |
| `/tree` | Navegar na árvore da sessão |
| `/fork` | Criar uma nova sessão a partir de uma mensagem de usuário anterior |
| `/clone` | Duplicar a sessão atual em sua posição atual |
| `/compact [instructions]` | Compactar o contexto atual, opcionalmente com instruções personalizadas |
| `/import <path>` | Importar e retomar uma sessão JSONL |

## Exportar e compartilhar

| Comando | Descrição |
|---|---|
| `/copy` | Copiar a última mensagem do assistente |
| `/export [path]` | Exportar a sessão como HTML ou JSONL |
| `/share` | Fazer upload da sessão e retornar um link de visualização |
| `/bug [description]` | Preparar um relatório de bug privado para os desenvolvedores do Pi |

Revise uma sessão antes de exportá-la ou compartilhá-la. Sessões podem conter prompts, argumentos de ferramentas, saída de comandos, conteúdos de arquivos e credenciais expostas durante a conversa.

## Runtime e projeto

| Comando | Descrição |
|---|---|
| `/trust` | Salvar uma decisão de trust do projeto para futuros processos do Pi |
| `/reload` | Recarregar atalhos de teclado (keybindings), extensions, skills, templates, temas e arquivos de contexto |
| `/hotkeys` | Mostrar atalhos de teclado ativos |
| `/changelog` | Mostrar entradas do changelog |
| `/quit` | Sair do Pi |

## Comandos adicionados por recursos

- Extensions podem registrar comandos com seus próprios argumentos e comportamento de autocompletar.
- Cada prompt template está disponível sob seu nome de template.
- Skills estão disponíveis como `/skill:name` quando os comandos de skill estão habilitados.

Use `/reload` após adicionar ou alterar um recurso de comando descoberto. Veja [Extensions](extensions.md), [Prompt Templates](prompt-templates.md) e [Skills](skills.md) para suas regras de carregamento e nomenclatura.
