# Referência de Keybindings

O Pi expõe ações nomeadas, como `app.session.new`, às quais podem ser atribuídas keybindings (atalhos de teclado). Você pode alterar atribuições padrão ou vincular ações não atribuídas na [configuração de usuário](configuration.md#agent-directory) do Pi.

Execute `/hotkeys` para ver os atalhos ativos para o editor principal e o aplicativo.

## Atribuir keybindings

Crie `<agent-dir>/keybindings.json`. O diretório do agente é por padrão `~/.3pi/agent` e é descrito em [Diretório do agente](configuration.md#agent-directory).

Mapeie cada identificador de ação para uma tecla ou uma lista de teclas:

```json
{
  "app.session.new": "ctrl+shift+n",
  "app.session.tree": ["ctrl+shift+t", "alt+shift+t"]
}
```

Um valor configurado substitui o padrão para aquela ação. Use uma lista vazia para desabilitar as keybindings de uma ação:

```json
{
  "tui.altScreen.pageUp": []
}
```

Após editar o arquivo, execute `/reload` para aplicar as alterações à sessão ativa.

## Sintaxe das teclas

Escreva uma tecla como `modificador+tecla`. Modificadores são `ctrl`, `shift`, `alt` e `super`. Você pode combinar modificadores. As teclas válidas são:

- **Letras:** `a-z`
- **Dígitos:** `0-9`
- **Especiais:** `escape`, `esc`, `enter`, `return`, `tab`, `space`, `backspace`, `delete`, `insert`, `clear`, `home`, `end`, `pageUp`, `pageDown`, `up`, `down`, `left`, `right`
- **Função:** `f1`-`f12`
- **Símbolos:** `` ` ``, `-`, `=`, `[`, `]`, `\`, `;`, `'`, `,`, `.`, `/`, `!`, `@`, `#`, `$`, `%`, `^`, `&`, `*`, `(`, `)`, `_`, `+`, `|`, `~`, `{`, `}`, `:`, `<`, `>`, `?`

Exemplos: `ctrl+shift+x`, `alt+ctrl+x`, `ctrl+shift+alt+x`, `super+k`, `ctrl+super+k` e `ctrl+1`.

As associações com `super` requerem um terminal que relate o modificador separadamente, tipicamente através do protocolo de teclado Kitty. Elas podem não funcionar em terminais sem esse suporte.

## Ações

### Terminal UI

#### Movimento do cursor

| Id do Keybinding | Padrão | Descrição |
|---|---|---|
| `tui.editor.cursorUp` | `up` | Move o cursor para cima, navegando no histórico mais antigo no topo |
| `tui.editor.cursorDown` | `down` | Move o cursor para baixo, navegando no histórico mais recente na parte inferior |
| `tui.editor.historyPrevious` | Nenhum | Seleciona a entrada anterior do histórico de prompt |
| `tui.editor.historyNext` | Nenhum | Seleciona a próxima entrada do histórico de prompt |
| `tui.editor.cursorLeft` | `left`, `ctrl+b` | Move o cursor para a esquerda |
| `tui.editor.cursorRight` | `right`, `ctrl+f` | Move o cursor para a direita |
| `tui.editor.cursorWordLeft` | `alt+left`, `ctrl+left`, `alt+b` | Move o cursor uma palavra para a esquerda |
| `tui.editor.cursorWordRight` | `alt+right`, `ctrl+right`, `alt+f` | Move o cursor uma palavra para a direita |
| `tui.editor.cursorLineStart` | `home`, `ctrl+a` | Move para o início da linha |
| `tui.editor.cursorLineEnd` | `end`, `ctrl+e` | Move para o fim da linha |
| `tui.editor.jumpForward` | `ctrl+]` | Pula para frente até o caractere |
| `tui.editor.jumpBackward` | `ctrl+alt+]` | Pula para trás até o caractere |
| `tui.editor.pageUp` | `pageUp`, `ctrl+pageUp` | Rola para cima por página |
| `tui.editor.pageDown` | `pageDown`, `ctrl+pageDown` | Rola para baixo por página |

As ações dedicadas de histórico navegam no histórico de prompt independentemente da posição do cursor e têm precedência sobre ações do aplicativo que usam a mesma tecla.

#### Edição de texto

| Id do Keybinding | Padrão | Descrição |
|---|---|---|
| `tui.editor.deleteCharBackward` | `backspace` | Deleta caractere para trás |
| `tui.editor.deleteCharForward` | `delete`, `ctrl+d` | Deleta caractere para frente |
| `tui.editor.deleteWordBackward` | `ctrl+w`, `alt+backspace` | Deleta palavra para trás |
| `tui.editor.deleteWordForward` | `alt+d`, `alt+delete` | Deleta palavra para frente |
| `tui.editor.deleteToLineStart` | `ctrl+u` | Deleta até o início da linha |
| `tui.editor.deleteToLineEnd` | `ctrl+k` | Deleta até o fim da linha |
| `tui.editor.yank` | `ctrl+y` | Cola o texto deletado mais recentemente |
| `tui.editor.yankPop` | `alt+y` | Alterna através do texto deletado após o yank |
| `tui.editor.undo` | `ctrl+-` (`ctrl+z` no Windows; `alt+z` no WSL) | Desfaz a última edição |

#### Entrada e seleção

| Id do Keybinding | Padrão | Descrição |
|---|---|---|
| `tui.input.newLine` | `shift+enter`, `ctrl+j` | Insere uma nova linha |
| `tui.input.submit` | `enter` | Envia a entrada |
| `tui.input.tab` | `tab` | Tab ou autocompletar |
| `tui.input.copy` | `ctrl+c` | Copia a seleção |
| `tui.select.up` | `up` | Move a seleção para cima |
| `tui.select.down` | `down` | Move a seleção para baixo |
| `tui.select.pageUp` | `pageUp` | Página para cima na lista |
| `tui.select.pageDown` | `pageDown` | Página para baixo na lista |
| `tui.select.confirm` | `enter` | Confirma a seleção |
| `tui.select.cancel` | `escape`, `ctrl+c` | Cancela a seleção |

#### Tela cheia

No modo de tela cheia, essas ações controlam a transcrição e têm precedência sobre ações do editor usando a mesma tecla.

| Id do Keybinding | Padrão | Descrição |
|---|---|---|
| `tui.altScreen.pageUp` | `pageUp` | Rola a transcrição para cima por uma página |
| `tui.altScreen.pageDown` | `pageDown` | Rola a transcrição para baixo por uma página |
| `tui.altScreen.halfPageUp` | Nenhum | Rola a transcrição para cima por meia página |
| `tui.altScreen.halfPageDown` | Nenhum | Rola a transcrição para baixo por meia página |
| `tui.altScreen.lineUp` | Nenhum | Rola a transcrição para cima por uma linha |
| `tui.altScreen.lineDown` | Nenhum | Rola a transcrição para baixo por uma linha |
| `tui.altScreen.previousPrompt` | `ctrl+shift+up`, `ctrl+up` (`ctrl+up` apenas no Windows e WSL) | Pula para a mensagem marcada anterior |
| `tui.altScreen.nextPrompt` | `ctrl+shift+down`, `ctrl+down` (`ctrl+down` apenas no Windows e WSL) | Pula para a próxima mensagem marcada |
| `tui.altScreen.search` | `ctrl+shift+f` (`ctrl+f` no Windows e WSL) | Pesquisa na transcrição renderizada |
| `tui.altScreen.searchNext` | `enter`, `ctrl+g` | Seleciona a próxima correspondência de pesquisa durante a pesquisa |
| `tui.altScreen.searchPrevious` | `shift+enter`, `ctrl+shift+g` | Seleciona a correspondência de pesquisa anterior durante a pesquisa |
| `tui.altScreen.searchClose` | `escape` | Fecha a pesquisa de transcrição |
| `tui.altScreen.top` | `ctrl+home` | Rola para o início da transcrição |
| `tui.altScreen.bottom` | `ctrl+end` | Rola para o fim da transcrição e acompanha as novas saídas |

### Aplicativo

| Id do Keybinding | Padrão | Descrição |
|--------|---------|-------------|
| `app.interrupt` | `escape` | Cancela / aborta |
| `app.clear` | `ctrl+c` | Limpa o editor (primeiro) / sai (segundo) |
| `app.exit` | `ctrl+d` | Sai (quando o editor está vazio) |
| `app.suspend` | `ctrl+z` (Nenhum no Windows) | Suspende para o plano de fundo |
| `app.editor.external` | `ctrl+g` | Abre no editor externo (`externalEditor`, `$VISUAL`, `$EDITOR`, Notepad no Windows, ou `nano` nos outros) |
| `app.clipboard.pasteImage` | `ctrl+v` (`alt+v` no Windows e WSL) | Cola arquivos no macOS, imagens, ou texto da área de transferência |

No Windows nativo, `app.suspend` não tem um padrão porque os terminais do Windows não suportam o controle de jobs Unix. Se você o atribuir manualmente, o Pi mostrará uma mensagem de status em vez de suspender. WSL usa o comportamento normal de `ctrl+z` e `fg`.

### Sessões

| Id do Keybinding | Padrão | Descrição |
|--------|---------|-------------|
| `app.session.new` | Nenhum | Inicia uma nova sessão (`/new`) |
| `app.session.tree` | Nenhum | Abre o navegador de árvore de sessões (`/tree`) |
| `app.session.fork` | Nenhum | Faz um fork da sessão atual (`/fork`) |
| `app.session.resume` | Nenhum | Abre o seletor de continuação de sessão (`/resume`) |
| `app.session.togglePath` | `ctrl+p` | Alterna a exibição do caminho |
| `app.session.toggleSort` | `ctrl+s` | Alterna o modo de ordenação |
| `app.session.toggleNamedFilter` | `ctrl+n` | Alterna o filtro de apenas nomeadas |
| `app.session.rename` | `ctrl+r` | Renomeia a sessão |
| `app.session.delete` | `ctrl+d` | Deleta a sessão |
| `app.session.deleteNoninvasive` | `ctrl+backspace` | Deleta a sessão quando a query está vazia |

### Modelos e Thinking

| Id do Keybinding | Padrão | Descrição |
|--------|---------|-------------|
| `app.model.select` | `ctrl+l` | Abre o seletor de modelos |
| `app.model.cycleForward` | `ctrl+p` | Alterna para o próximo modelo |
| `app.model.cycleBackward` | `shift+ctrl+p` (`alt+p` no Windows e WSL) | Alterna para o modelo anterior |
| `app.models.save` | `ctrl+s` | Salva o modelo padrão selecionado ou configuração de modelo em escopo nas configurações |
| `app.thinking.cycle` | `shift+tab` | Alterna o nível de thinking |
| `app.thinking.save` | `ctrl+s` | Salva o nível de thinking atual nas configurações |
| `app.thinking.toggle` | `ctrl+t` | Colapsa ou expande os blocos de thinking |

### Exibição e Fila de Mensagens

| Id do Keybinding | Padrão | Descrição |
|--------|---------|-------------|
| `app.tools.expand` | `ctrl+o` | Colapsa ou expande a saída da tool |
| `app.message.copy` | `ctrl+x` | Copia a mensagem selecionada em `/tree`; no modo de tela cheia, copia a seleção ativa quando `fullscreenCopyOnSelect` for `false`; caso contrário, copia a última mensagem do assistente. Em telas de login OAuth, copia a URL de login |
| `app.message.followUp` | `alt+enter` (`ctrl+q` no Windows e WSL) | Enfileira mensagem de follow-up |
| `app.message.dequeue` | `alt+up` (`alt+q` no Windows e WSL) | Restaura mensagens enfileiradas para o editor |

### Navegação em Árvore

| Id do Keybinding | Padrão | Descrição |
|--------|---------|-------------|
| `app.tree.foldOrUp` | `ctrl+left`, `alt+left` | Dobra o segmento do ramo atual, ou pula para o início do segmento anterior |
| `app.tree.unfoldOrDown` | `ctrl+right`, `alt+right` | Desdobra o segmento do ramo atual, ou pula para o início do próximo segmento ou fim do ramo |
| `app.tree.editLabel` | `shift+l` | Edita o rótulo no nó da árvore selecionado |
| `app.tree.toggleLabelTimestamp` | `shift+t` | Alterna os carimbos de data/hora do rótulo na árvore |
| `app.tree.filter.default` | `ctrl+d` | Define o filtro da árvore para a visualização padrão |
| `app.tree.filter.noTools` | `ctrl+t` | Alterna o filtro da árvore que esconde resultados de tool |
| `app.tree.filter.userOnly` | `ctrl+u` | Alterna o filtro da árvore que mostra apenas mensagens de usuário |
| `app.tree.filter.labeledOnly` | `ctrl+l` | Alterna o filtro da árvore que mostra apenas entradas rotuladas |
| `app.tree.filter.all` | `ctrl+a` | Alterna o filtro da árvore que mostra todas as entradas |
| `app.tree.filter.cycleForward` | `ctrl+o` | Alterna o filtro da árvore para frente |
| `app.tree.filter.cycleBackward` | `shift+ctrl+o` | Alterna o filtro da árvore para trás |

### Seletor de Modelos em Escopo

Usado dentro do seletor de modelos em escopo (aberto via `/scoped-models`).

| Id do Keybinding | Padrão | Descrição |
|--------|---------|-------------|
| `app.models.enableAll` | `ctrl+a` | Habilita todos os modelos (ou todos que correspondam à pesquisa atual) |
| `app.models.clearAll` | `ctrl+x` | Limpa todos os modelos (ou todos que correspondam à pesquisa atual) |
| `app.models.toggleProvider` | `ctrl+p` | Alterna todos os modelos para o provider atual |
| `app.models.reorderUp` | `alt+up` | Move o modelo selecionado para cima na ordem de ciclo |
| `app.models.reorderDown` | `alt+down` | Move o modelo selecionado para baixo na ordem de ciclo |
