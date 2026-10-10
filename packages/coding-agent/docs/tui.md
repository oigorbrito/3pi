# Terminal UI

`@earendil-works/3pi-tui` fornece o sistema de componentes de terminal usado pelo Pi. Extensions o usam quando diálogos, notificações, texto de status e widgets integrados não são suficientes para a interação de que precisam.

Comece com os métodos `ctx.ui` a partir de uma [extension](extensions.md#interact-with-the-user). Construa um componente personalizado apenas quando a UI precisar de sua própria renderização, entrada de teclado ou mouse, foco, layout ou ciclo de vida.

## Escolher um ponto de integração

| Necessidade | Use |
|---|---|
| Selecionar, confirmar, input ou editor multilinha | `ctx.ui.select()`, `confirm()`, `input()` ou `editor()` |
| Feedback não bloqueante | `ctx.ui.notify()` ou `setStatus()` |
| Conteúdo persistente perto do editor | `ctx.ui.setWidget()` |
| Substituir o cabeçalho, rodapé ou editor | O factory de componente `ctx.ui` correspondente |
| Tela interativa temporária ou overlay | `ctx.ui.custom()` |
| Renderização personalizada para uma tool ou entrada de sessão | Um renderer de extension |

Essas APIs recebem o tema ativo e os keybindings do Pi onde necessário. Não crie um segundo renderizador de terminal dentro de uma extension.

## Entender o modelo de componentes

Um componente renderiza um array de linhas de terminal para uma largura disponível. Ele pode opcionalmente lidar com entrada de teclado e mouse, e deve invalidar a saída em cache quando seu estado ou conteúdo dependente do tema for alterado.

Cada linha renderizada deve caber na largura fornecida. Meça as colunas de terminal visíveis em vez do comprimento da string, porque escapes ANSI, caracteres largos, emojis e caracteres combinados alteram a largura de exibição.

Use `visibleWidth()`, `truncateToWidth()`, `sliceByColumn()` e `wrapTextWithAnsi()` em vez de implementar você mesmo o tratamento de largura do terminal. O Pi redefine o estilo e os hyperlinks após cada linha, então reaplique os estilos em cada linha renderizada.

Após alterar o estado do componente, invalide o componente afetado e chame o `tui.requestRender()` injetado. A TUI une as requisições de renderização e atualiza o terminal.

## Compor componentes integrados

O package inclui componentes para layouts e controles comuns:

- `Text`, `Markdown`, `Image` e `TruncatedText` renderizam conteúdo.
- `Container`, `VStack`, `HStack`, `Box` e `Spacer` compõem layouts.
- `Input` e `Editor` aceitam texto.
- `SelectList` e `SettingsList` implementam fluxos de seleção e configurações pesquisáveis.
- `ScrollView` fornece uma viewport de rolagem delimitada.
- `Loader` e `CancellableLoader` relatam trabalho em andamento.
- `MouseRegion` adiciona comportamento de ponteiro em torno de outro componente.

Prefira esses componentes a reconstruir seleção, rolagem, edição de texto ou tratamento de largura. Os exemplos de extension mostram como combiná-los com as bordas e temas do Pi.

## Lidar com entrada de teclado e foco

Use `matchesKey()` e `Key` para entrada de teclado do terminal. O parser leva em conta os protocolos de terminal suportados e os modificadores de tecla. Componentes de extension devem usar o `KeybindingsManager` injetado para ações de aplicativo configuráveis.

Um componente que exibe um cursor de texto deve implementar `Focusable` e colocar `CURSOR_MARKER` imediatamente antes de seu cursor visual. A TUI usa esse marcador para posicionar o cursor de hardware para editores de método de entrada (IME).

Containers que envolvem um `Input` ou `Editor` devem propagar seu estado `focused` para esse filho. Sem a propagação, a janela de candidatos de IME de idiomas como Chinês, Japonês e Coreano pode aparecer na posição incorreta da tela.

Estenda o `CustomEditor` do Pi ao substituir o editor principal. Ele preserva os atalhos da aplicação e os controles do agent.

Encaminhe as teclas que seu editor não possui para a implementação base e restaure o padrão limpando a factory do editor personalizado.

## Lidar com a entrada do mouse

O modo de tela cheia encaminha eventos de mouse normalizados para os componentes. Um handler pode marcar um evento como manipulado, capturar uma sequência de arrasto, solicitar foco ou solicitar uma renderização.

Eventos de rolagem não manipulados rolam o `ScrollView` mais próximo. Arrasto com o botão principal não manipulado permanece disponível para a seleção do transcript. Links OSC 8 têm precedência sobre regiões de clique que os envolvem.

O modo regular deixa a entrada do mouse para o terminal porque o terminal é dono do scrollback. Projete toda interação com um caminho de teclado, mesmo quando a entrada do mouse em tela cheia estiver disponível.

## Usar telas personalizadas e overlays

`ctx.ui.custom()` temporariamente dá a um componente o controle da área interativa e resolve quando esse componente chama o callback de conclusão fornecido.

Passe `overlay: true` para desenhar acima do conteúdo existente. As opções de overlay controlam o tamanho, âncoras, deslocamentos, margens e visibilidade responsiva. Um handle de overlay pode alterar o foco ou ocultar e mostrar temporariamente o overlay com `setHidden()` enquanto a interação permanecer ativa.

Overlays com foco retêm a posse da entrada entre renderizações normais. Se outro componente deve receber entrada enquanto um overlay permanece visível, libere ou redirecione explicitamente o foco através do handle.

Trate cada instância de componente personalizado como pertencente a uma interação. Crie uma nova instância ao iniciar essa interação novamente.

Conclua a interação com o callback de conclusão fornecido ao factory do componente. Ele resolve a promise `ctx.ui.custom()` e descarta (dispose) o componente. Não chame `OverlayHandle.hide()` em um overlay criado por `ctx.ui.custom()`.

Veja [`overlay-qa-tests.ts`](../examples/extensions/overlay-qa-tests.ts) para posicionamento, empilhamento, foco, visibilidade responsiva e comportamento de animação.

## Aplicar temas corretamente

Use o tema passado para a extension ou callback de componente. Helpers de tema produzem strings com estilo ANSI para cores semânticas como accent, muted text, success, warnings, errors, tool output e Markdown.

Use `theme.style()` para combinar cores de primeiro plano e de fundo com atributos de texto:

```typescript
return new Text(
  theme.style("Done!", {
    fg: "success",
    bg: "toolSuccessBg",
    bold: true,
  }),
  0,
  0,
);
```

A cor de um estilo pode ser um token semântico de tema ou uma `Color` concreta. Tokens de primeiro plano são aceitos como `fg` e tokens de fundo como `bg`; para usar a cor de um token na outra posição, passe sua cor concreta, por exemplo `{ fg: theme.colors.userMessageBg }`. Acesse as cores concretas através de `theme.colors` e use utilitários como `mixColors()` de `@earendil-works/3pi-tui` quando matemática de cores for necessária. Tokens que um tema define para o padrão do terminal renderizam com a cor do próprio terminal; `theme.colors` relata a cor que o terminal anunciou para eles, ou um palpite quando não anunciou. Use `theme.appearance` (`"dark"` ou `"light"`) para decidir, por exemplo, se deve clarear ou escurecer uma cor. O Pi converte o resultado em truecolor ou em uma saída de 256 cores com base nas capacidades do terminal. Tokens de tema são convertidos uma vez por tema; calcule cores concretas fora do caminho de renderização quando possível.

Os helpers existentes `theme.fg()` e `theme.bg()` permanecem disponíveis para aplicar uma cor semântica.

Não armazene permanentemente strings com cores de tema, a menos que `invalidate()` as reconstrua. Uma alteração de tema limpa os caches de renderização, mas não pode remover cores ANSI antigas incorporadas no estado do aplicativo.

Callbacks de tema avaliados durante a renderização não precisam de reconstrução especial. Componentes stateless também podem calcular a saída tematizada em cada renderização.

Use [Themes](themes.md) para criar paletas de terminal. Use o `getMarkdownTheme()` do Pi ao renderizar Markdown que deve corresponder ao tema ativo do aplicativo.

## Manter a renderização responsiva

A renderização é executada no caminho interativo. Faça cache de trabalhos caros de layout e destaque (highlighting) pela largura e conteúdo, e então limpe esse cache de `invalidate()`.

Mantenha a visualização padrão compacta e revele os detalhes por meio de expansão ou uma tela dedicada. Para renderização de tool personalizada, lide com resultados parciais e reutilize o componente anterior quando ele puder ser atualizado com segurança.

Use `PI_TUI_WRITE_LOG` para capturar o fluxo ANSI bruto ao diagnosticar problemas de renderização. Teste larguras estreitas, caracteres largos, eventos de redimensionamento, alterações de tema, transições de foco e ambos os modos regular e de tela cheia.

## Exemplos e código-fonte

Os exemplos de extensions verificados cobrem os padrões principais:

- [`preset.ts`](../examples/extensions/preset.ts) e [`tools.ts`](../examples/extensions/tools.ts) usam listas de seleção e configurações.
- [`qna.ts`](../examples/extensions/qna.ts) usa UI assíncrona cancelável.
- [`modal-editor.ts`](../examples/extensions/modal-editor.ts) substitui o editor.
- [`custom-footer.ts`](../examples/extensions/custom-footer.ts) substitui o rodapé.
- [`widget-placement.ts`](../examples/extensions/widget-placement.ts) coloca conteúdo persistente ao redor do editor.
- [`doom-overlay/`](../examples/extensions/doom-overlay/) demonstra um overlay renderizado continuamente.

As exportações públicas são definidas em [`packages/tui/src/index.ts`](https://github.com/earendil-works/pi/blob/main/packages/tui/src/index.ts). Veja [Extensions](extensions.md) para ciclo de vida de extension, estado, tools, eventos e comportamento de modos.
