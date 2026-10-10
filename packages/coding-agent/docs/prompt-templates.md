# Templates de Prompt

Templates de prompt transformam arquivos Markdown em comandos `/` reutilizáveis. Use um quando quiser reutilizar o mesmo prompt sem adicionar comportamento executável ou um conjunto maior de instruções de suporte.

Um template pode aceitar argumentos e aparecer na auto-conclusão de comandos. O Pi pode carregar templates da configuração pessoal, configuração do projeto, de um caminho explícito ou de um package do Pi. A configuração do projeto carrega apenas após a confiança do projeto (project trust) ser concedida.

## Criar um template

Crie `~/.3pi/agent/prompts/review.md`:

```markdown
---
description: Revise mudanças preparadas (staged) no git
argument-hint: "[foco]"
---
Revise as mudanças preparadas. Foque em ${1:-correção, segurança e tratamento de erros}.
```

O nome do arquivo se torna o nome do comando, então este template está disponível como `/review`. A `description` aparece na auto-conclusão do comando. Se for omitida, o Pi usa a primeira linha não vazia.

`argument-hint` é opcional. Use `<angle brackets>` (colchetes angulares) para argumentos obrigatórios e `[square brackets]` (colchetes quadrados) para argumentos opcionais.

Execute `/reload` após adicionar ou alterar um template em uma sessão ativa.

<a id="invoke-a-template"></a>

## Usar um template

Digite o comando do template no editor:

```text
/review
/review concurrency
```

O Pi expande o template antes que o texto resultante entre no agente. As extensões recebem a entrada bruta primeiro através do evento `input`, a menos que um comando de extensão com o mesmo nome a manipule.

Templates suportam estas substituições:

| Sintaxe | Resultado |
|---|---|
| `$1`, `$2`, … | Um argumento posicional |
| `$@` ou `$ARGUMENTS` | Todos os argumentos unidos com espaços |
| `${1:-default}` | Primeiro argumento, ou um valor padrão (default) |
| `${@:-default}` | Todos os argumentos, ou um valor padrão |
| `${@:N}` | Argumentos começando na posição `N` |
| `${@:N:L}` | `L` argumentos começando na posição `N` |

Argumentos seguem o modelo de aspas como no shell, então `/review "compatibilidade de API"` fornece um único argumento contendo espaços.

<a id="choose-where-it-loads"></a>

## Adicionar ao Pi

Coloque o template no seu diretório de prompts de usuário ou do projeto. Diretórios convencionais de prompt carregam apenas filhos diretos que sejam `.md`.

As configurações e packages podem selecionar arquivos Markdown aninhados; um manifesto de package pode restringir a descoberta com caminhos explícitos e padrões de busca (globs). Veja [Configurações](settings.md#resources) e [Packages do Pi](packages.md) para essas opções.

Templates de projeto tornam-se comandos no editor após a confiança ser concedida. Revise o seu conteúdo antes de confiar em um projeto desconhecido. Veja [Segurança](security.md#understand-project-trust).
