# @earendil-works/3pi-tui

Framework de interface de terminal minimalista (minimal terminal UI framework) com renderização diferencial (differential rendering) e saída sincronizada para aplicações CLI interativas sem cintilação (flicker-free).

## Features

- **Interchangeable Renderers**: Interface `TUI` compartilhada com implementações de main-screen e alternate-screen
- **Differential Rendering**: Atualiza apenas linhas alteradas ou as linhas do viewport
- **Application-owned Scrolling**: O viewport do alternate-screen suporta navegação por mouse, trackpad e teclado
- **Synchronized Output**: Usa CSI 2026 para atualizações de tela atômicas (sem flicker)
- **Bracketed Paste Mode**: Lida com colagens grandes (pastes) corretamente com marcadores para >10 linhas
- **Component-based**: Interface Component simples com método render()
- **Theme Support**: Componentes aceitam interfaces de tema para estilização customizável
- **Built-in Components**: Text, TruncatedText, Input, Editor, Markdown, Loader, SelectList, SettingsList, MouseRegion, Spacer, Image, Box, Container, VStack, HStack, ScrollView
- **Inline Images**: Renderiza imagens em terminais que suportam protocolos de gráficos Kitty ou iTerm2
- **Autocomplete Support**: Caminhos de arquivo (file paths) e comandos de barra (slash commands)

## Quick Start

```typescript
import { type TUI, Text, Editor, ProcessTerminal, TuiMainScreen, matchesKey } from "@earendil-works/3pi-tui";

// Create terminal
const terminal = new ProcessTerminal();

// Create the default main-screen renderer through the shared TUI interface
const tui: TUI = new TuiMainScreen(terminal);

// Add components
tui.addChild(new Text("Welcome to my app!"));

import { defaultEditorTheme as editorTheme } from './test/test-themes.ts';
const editor = new Editor(tui, editorTheme);
editor.onSubmit = (text) => {
  console.log("Submitted:", text);
  tui.addChild(new Text(`You said: ${text}`));
};
tui.addChild(editor);

// Focus the editor so it receives keyboard input
tui.setFocus(editor);

// In raw mode Ctrl+C doesn't send SIGINT — intercept it here to allow exit
tui.addInputListener((data) => {
  if (matchesKey(data, 'ctrl+c')) {
    tui.stop();
    process.exit(0);
  }
});

// Start
tui.start();
```

## Core API

### TUI interface and renderers

A interface compartilhada `TUI` atua no gerenciamento dos componentes (component management), focos, overlays, input, queries sobre ciclo de vida ao terminal e na renderização. Escolha um renderizador concreto (concrete renderer) apenas ao construir a aplicação:

- `TuiMainScreen` renderiza no buffer do terminal principal e preserva o scrollback nativo (terminal scrollback).
- `TuiAltScreen` renderiza sob altura restrita de exibição do viewport associado num outro buffer do terminal alternativo, controlando toda rolagem da app de forma própria (application-owned scrolling). Enquanto parado ou em retorno às raízes da tela principal o mesmo é incumbido do repasse na emissão integral atrelada (document final).

```typescript
import { type TUI, TuiAltScreen, TuiMainScreen } from "@earendil-works/3pi-tui";

const tui: TUI = new TuiMainScreen(terminal);
// To use an application-owned viewport in the alternate terminal buffer instead:
// const tui: TUI = new TuiAltScreen(terminal);

tui.addChild(component);
tui.removeChild(component);
tui.start();
tui.stop();
tui.requestRender(); // Request a re-render

// Global debug key handler (Shift+Ctrl+D)
tui.onDebug = () => console.log("Debug triggered");
```

### Colors and terminal styles

Cores são valores que podem ser convertidos ou misturados antes da renderização do terminal:

```typescript
import {
  colorToRgb,
  foregroundAnsi,
  getTerminalColorMode,
  mixColors,
  parseColor,
  rgbColor,
  styleText,
} from "@earendil-works/3pi-tui";

const accent = parseColor("oklch(70% 0.12 220)");
const background = parseColor("#20242a");
const foreground = mixColors(accent, background, 0.2);

const text = styleText(
  "Ready",
  { fg: foreground, bg: background, bold: true },
  getTerminalColorMode(),
);
```

`Color` é uma cor ANSI indexada, uma cor sRGB ou uma cor OKLCH. Cada cor converte para sRGB, portanto a matemática de cores como `mixColors()` sempre funciona. Os índices de 0 a 15 seguem a paleta do terminal do usuário, então seus valores sRGB são aproximações. `styleText()` converte cores para saída truecolor ou 256-color com base no modo do terminal solicitado.

`parseColor()` também aceita OKHSL, como em `okhsl(250 60% 55%)`; `okhslColor()` o constrói em código e `colorToOkhsl()` lê os canais OKHSL de qualquer cor. A saturação OKHSL é relativa ao máximo que a gama sRGB permite na matriz (hue) e na luminosidade (lightness), de modo que todo valor está na gama e saturações iguais parecem igualmente coloridas em todas as matizes. As cores OKHSL são convertidas para sRGB quando criadas.

Conversões não sofrem caching. Cores OKLCH, especialmente as fora do gamut sRGB, são mais custosas em conversão de recursos para o sRGB comparados às ansi e sRGB. Assegurando que caso você opte a reusar uma cor por diversos ou a todo frame repita ela a partir do resultado e não convertida repetidamente.

```typescript
const { r, g, b } = colorToRgb(mixColors(accent, background, 0.2));
const foreground = rgbColor(r, g, b); // cheap to render repeatedly
const foregroundCode = foregroundAnsi(foreground, getTerminalColorMode());
```

### Alternate-screen viewport layouts

O `TuiAltScreen` pode processar os limites de exibição numa região de escopo absoluto em base terminal. O `VStack` e `HStack` vão prover restrições à dimensão contida; de parte oposta tem os preenchimentos alocados pela via do `ScrollView` atribuindo scrollbar em seu espaço alocado na view nativa dele. Tais atributos do sistema seguem uma intuição onde propositalmente não aparecem na variante `TuiMainScreen`, visto o que gerencia todo atributo scroll (terminal scrollback) restringe tal papel ali.

```typescript
import {
  Container,
  isViewportTUI,
  ScrollView,
  Text,
  VStack,
} from "@earendil-works/3pi-tui";

const transcript = new Container();
transcript.addChild(new Text("History"));

const editorAndFooter = new VStack([
  editor,
  new Text("status"),
]);

if (isViewportTUI(tui)) {
  tui.setLayoutRoot(new VStack([
    {
      component: new ScrollView(transcript, {
        follow: "end",
        primary: true,
        overscroll: "chain",
      }),
      basis: 0,
      grow: 1,
      minSize: 1,
    },
    {
      component: editorAndFooter,
      basis: "auto",
      shrink: 1,
      minSize: 1,
    },
  ]));
}
```

A entrada para a lista alocada pelas stacks admitem um dos tais: `basis`, `grow`, `shrink`, `minSize`, `maxSize` atrelado aos callbacks adaptativos dispostos por `visible`. Passar do ponteiro giratório (mouse-wheel) na tela de foco induz ao delta não aplicado aos escopos de visão scroll passarem do local direto a serem encadeados/consumidos das root/outer (outer scroll views). As ações atreladas aos limites por sua vez repassadas pela interação via primary scroll view garantem às janelas ativas as leituras dos movimentos de roda perante setores da tela sem habilitação em alternate-screen navigation. Assim como na sua navegação interna com base às instâncias captáveis relativas do atalho padrão comum aos jumps via marcadores de navegação ao redor os OSC 133 prompt markers. Com `Ctrl+Shift+F`, exiba, ou acione a fechar os acessos à borda das guias localizadoras (search panel). Esse visor (search panel) mostra os ícones de ação de avanço ou recuo dispostos (setas clicáveis) à visualização ao anterior ou adiante base às ocorrências rastreadas ao termo, que no seu preset, o fluxo acorre utilizando `Enter`/`Ctrl+G` e para reversão `Shift+Enter`/`Ctrl+Shift+G`; com a exceção aos escapes por `Escape`. O parâmetro `TuiAltScreenOptions.searchMatchStyle` a sua disposição tal como seu semelhante customizável atende por `searchCurrentMatchStyle` no destacamento de referências de base, e via formatação por atrelado hover se vale com o uso de `searchNavigationButtonStyle`. `TuiAltScreenOptions.scrollToEndIndicator` vai produzir algo contendo uma faixa estática orientada a exibição e disposta central aos eventos ocorridos após rolagem atrelado a `follow: "end"`; onde uma chamada de clique aciona ou impulsiona um redirecionamento ativando acompanhamento ao final de tela mais recente (end-following).

Geometrias das definições nas camadas internas são reatribuídas sempre pelo sistema quando novas exigências a tela acorrem no processamento por cada call de render em cada quadro do layout demandado (frame). Todas subseções de componente dispostas à stateful permanecem na integridade sendo os históricos processados de seus dados armazenados não violados (rendered-line caches remain effective). Chamadas a render (como chamando por: `render(width)`) oriundas num destes de estrutura da base vão derivar uma folha (document) infinda ou seja em proporções indefinidas na totalização integral a todo material na volta na sua visualização principal de volta nativa (main screen).

### Overlays

Overlays renderizam componentes sobre um conteúdo subjacente do background que se encontra já instanciado visual. De utilidade quando precisa instanciar interfaces ao usuário a exemplo dialogs, menus rápidos e modal UI.

```typescript
// Show overlay with default options (centered, max 80 cols)
const handle = tui.showOverlay(component);

// Show overlay with custom positioning and sizing
// Values can be numbers (absolute) or percentage strings (e.g., "50%")
const handle = tui.showOverlay(component, {
  // Sizing
  width: 60,              // Fixed width in columns
  width: "80%",           // Width as percentage of terminal
  minWidth: 40,           // Minimum width floor
  maxHeight: 20,          // Maximum height in rows
  maxHeight: "50%",       // Maximum height as percentage of terminal

  // Anchor-based positioning (default: 'center')
  anchor: 'bottom-right', // Position relative to anchor point
  offsetX: 2,             // Horizontal offset from anchor
  offsetY: -1,            // Vertical offset from anchor

  // Percentage-based positioning (alternative to anchor)
  row: "25%",             // Vertical position (0%=top, 100%=bottom)
  col: "50%",             // Horizontal position (0%=left, 100%=right)

  // Absolute positioning (overrides anchor/percent)
  row: 5,                 // Exact row position
  col: 10,                // Exact column position

  // Margin from terminal edges
  margin: 2,              // All sides
  margin: { top: 1, right: 2, bottom: 1, left: 2 },

  // Responsive visibility
  visible: (termWidth, termHeight) => termWidth >= 100  // Hide on narrow terminals

  // Focus behavior
  nonCapturing: true       // Don't auto-focus when shown
});

// OverlayHandle methods
handle.hide();              // Permanently remove the overlay
handle.setHidden(true);     // Temporarily hide (can show again)
handle.setHidden(false);    // Show again after hiding
handle.isHidden();          // Check if temporarily hidden
handle.focus();             // Focus and bring to visual front
handle.unfocus();           // Release focus to normal fallback
handle.unfocus({ target: baseComponent }); // Release this overlay to a specific component
handle.unfocus({ target: null });   // Release this overlay and leave focus empty
handle.isFocused();         // Check if overlay has focus
handle.getBounds();         // Get last rendered terminal-relative bounds

handle.unfocus();
// Overlay loses focus; TUI falls back to another visible capturing overlay or the previous focus target.

handle.unfocus({ target: null });
// Overlay loses focus; no component receives input until focus is set again.

// A focused visible overlay reclaims keyboard input after temporary replacement UI
// releases focus. If you want a specific component to receive input while overlays remain
// visible, call handle.unfocus({ target: component }).

// Hide topmost overlay
tui.hideOverlay();

// Check if any visible overlay is active
tui.hasOverlay();
```

**Anchor values**: `'center'`, `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`, `'top-center'`, `'bottom-center'`, `'left-center'`, `'right-center'`

**Resolution order**:
1. `minWidth` é aplicado como um limite inferior após o cálculo da largura
2. Para posição: absoluto `row`/`col` > percentagem `row`/`col` > `anchor`
3. `margin` restringe a posição final para permanecer dentro dos limites do terminal
4. A função de retorno `visible` controla se o overlay é renderizado (chamada a cada frame)

### Component Interface

Todos os componentes implementam:

```typescript
interface Component {
  render(width: number): string[];
  handleInput?(data: string): void;
  handleMouse?(event: TuiMouseEvent): TuiMouseEventResult | undefined;
  invalidate(): void;
}
```

| Method | Description |
|--------|-------------|
| `render(width)` | Retorna um array de strings, uma por linha. Cada linha **não deve exceder `width`** ou o TUI retornará um erro. Use `truncateToWidth()` ou quebra manual (wrapping) para garantir isso. |
| `handleInput?(data)` | Chamado quando o componente tem foco e recebe input de teclado. A string `data` contém a entrada nativa do terminal (pode conter sequências de escape ANSI). |
| `handleMouse?(event)` | Chamado pelo `TuiAltScreen` para inputs normalizados de ponteiro direcionados ao componente. |
| `invalidate()` | Obrigatório. Limpa qualquer estado renderizado cacheado de forma que o próximo `render()` recomece do zero. Componentes sem estado renderizado no cache podem simplesmente deixar esta implementação em branco. |

O TUI adiciona uma SGR reset íntegro e a sequência de reajuste OSC 8 num final respectivo de via na renderização. Todos esses estilos aplicados pelo utilitário deixam o seu estado extinto ou decaído perante uma mudança decorrida da pulação natural da via (cross line boundaries). Para que estilos ao fluxo que cruzem ou venham pular sejam resgatados, faça uma aplicação iterativa deles de forma individual via código ou lance em chamadas do ajudante ao envolto multi linha via repasse pelo `wrapTextWithAnsi()`. 

### Mouse Input

`TuiAltScreen` normatiza cliques ou rolamentos provindos por vias da matriz de inputs (SGR mouse input) sobre componentes referenciados ou capturados por cima por overlays no escopo delimitado à verificação por batidas base na (hit-tests). Os retornos contém as variantes de base para componente com indicação relacional: `x`/`y`, de forma absoluta num modo por tela `screenX`/`screenY`, retângulos dispostos (bounds), e identificadores (button) ou adendos do ponteiro capturados, de forma ao número acionado e deltas com acionamento ao scrool no respectivo (wheel delta). De forma nativa com base de scrollback gerenciado, no ambiente via `TuiMainScreen` nunca as chamadas a mouse chegam nas verificações nativas da tela original do seu console base.

```typescript
import type { TuiMouseEvent, TuiMouseEventResult } from "@earendil-works/3pi-tui";

handleMouse(event: TuiMouseEvent): TuiMouseEventResult | undefined {
  if (event.type === "click" && event.button === "left") {
    this.expanded = !this.expanded;
    return { handled: true };
  }
  if (event.type === "press" && event.button === "left") {
    return { handled: true, capture: true, focus: true };
  }
  if (event.type === "drag") {
    this.updateFromPointer(event.x, event.y);
    return { handled: true, render: true };
  }
  return undefined;
}
```

O retorno de propriedades dispostas `handled` é responsável por anular chamadas nativas em repasse na execução. Atributos vindos na `capture` mantêm subsequentes transições arrastadas sobre drag e liberação presas ou contidas focadas para aquele ponto correspondido do item comutado. `focus` em paralelo emiti requisições e assume foco das chaves nos digitamentos pelo meio virtual via teclado nativo (keyboard focus). A opção flag via repasse com valor no true de `render` atende aos retornos solicitantes que forçam re-redesenhamentos: ações sobre um press, rolagem de delta ou em acionamento contido providos por via de uma chamada com retorno padronizado ao true (defaulting), movidos ao longo de solturas ou passagens não induzidas sem intersecções que afetem e transitem a falso no render. Quando o estado referencial demandar visivelmente passe com ele ao true, do contrário defina por uma interatividade de passividade (handled no-op) como nula ao render: false. Todas solicitações atreladas coalescem suas requisições baseando diferencial em uma terminal nativa sem comprometer sua eficácia.

As dinâmicas interativas da rota sem retorno mantêm defaults originais no alternate-screen; roda do rolamento que trafega ou envia saltos aos contidos alocando do restante no topo `ScrollView`, botões centrais na marca arrasto puxam cópias (select text), ligações embutidas OSC 8 transitam adiante e em aberturas antes de suas invocações parentes ou ativadoras (click handlers), enquanto comandos em toques do eixo direito sustentem emulação com interatividade paste original disposta base ao default de prancheta nativa da máquina. Acionar sem puxar no click somente se procede a tal modo sem as presenças com drags após sua conclusão originária por press/release.

Use `MouseRegion` para acionar propriedades adicionais atrelado a comportamento por mouse se esquivando de modificações perante um componente na camada disposta ao render:

```typescript
const collapsible = new MouseRegion(content, (event) => {
  if (event.type !== "click" || event.button !== "left") return undefined;
  expanded = !expanded;
  return { handled: true };
});
```

A via disposta nos encaminhamentos atrelados ao envio interno no uso com `Container` ou componentes em `Box` para seus filhos restabelece a intersecção pautado ao limite contido aos retornos da última validação do quadro por base na geometria processada, de meio a isentar atualizações de rendering ao transitar livre de toques a fim de validar as referidas dimensões de intersecção dispostas nos aninhamentos subjacentes. Modelos de dimensões alocados internamente no formato a disposições sobre as vias pelo `VStack`, o repasse para `HStack`, tal como nos repasses contidos com chamadas pelas `ScrollView` atuam valendo-se pelas frames contidas das definições e de sua constituição via alternate-screen base.

### Focusable Interface (IME Support)

Os componentes que mostram cursor e suportam ou demandem inputs em linguagens através de editores via software dispostos (Input Method Editor) base para suporte nos editores devem acatar ou implementar a interface da provida categoria disposta de `Focusable`:

```typescript
import { CURSOR_MARKER, type Component, type Focusable } from "@earendil-works/3pi-tui";

class MyInput implements Component, Focusable {
  focused: boolean = false;  // Set by TUI when focus changes
  
  render(width: number): string[] {
    const marker = this.focused ? CURSOR_MARKER : "";
    // Emit marker right before the fake cursor
    return [`> ${beforeCursor}${marker}\x1b[7m${atCursor}\x1b[27m${afterCursor}`];
  }

  invalidate(): void {}
}
```

No enquadro via provisão em `Focusable` nos momentos de acoplagem com os inputs de foco pelo componente, no provido estado do TUI:
1. Passa com a flag preenchida por `focused = true` base na propriedade dele;
2. Verifica nos conteúdos as emissões renderizadas do marco demarcado atrelado a ele sob a menção originária de identificador de zero espaços do tipo da referida APC na escapada em sequenciamento (zero-width APC escape sequence);
3. Aponta originariamente na base real de terminais o percurso exato por curso dispostos nos ambientes com suportes de instâncias atreladas na renderização local;
4. Aponta apenas na renderização à visão provida de ativa base na opção preestabelecida e flag configurável habilitada `showHardwareCursor`.

Os referidos marcadores nas vias visuais ocultam e mantem tal traçado na instância em sua raiz oculta via terminal em bases padrão de acesso (hidden by default). Preservando todo preenchimento do espaço fictício acionado da sua via a nível e meio pelo terminal que transita, em manter focos e acompanhar na janela (candidate windows) base nos acessos às linhas mesmo nulas na visibilidade aos suportes originais. Alguns dos consoles atrelados demandam ou atrelam suporte com presunções das visibilidades de seu original acionador afim a promover com intersecção nas respostas à via provida com o IME originário via máquina; basta repassar com sua instância na verificação na construção original ou acionamentos no render base através ativado `showHardwareCursor` passando como construtor nas propriedades nativas em chamada ou invocando de antemão pelo configurador atrelado com o modo via `setShowHardwareCursor(true)`. O referido suporte e implementações vêm nos built-in das utilidades contidas a nível local com base de origens nas instâncias presentes contidas dentro `Editor` do `Input`.

**Container components com inputs aninhados:** Sendo via uma raiz (container) na forma a dialog e afins constados as instâncias (inputs, selects, etc.) quando contêm descendência originária pelo referencial `Input` na descendência ao container de modo à raiz provida ser também um `Focusable` onde com sua implementação deve reajustar com passagem na mudança a todos dependentes à via nativa:

```typescript
import { Container, type Focusable, Input } from "@earendil-works/3pi-tui";

class SearchDialog extends Container implements Focusable {
  private searchInput: Input;

  // Propagate focus to child input for IME cursor positioning
  private _focused = false;
  get focused(): boolean { return this._focused; }
  set focused(value: boolean) {
    this._focused = value;
    this.searchInput.focused = value;
  }

  constructor() {
    super();
    this.searchInput = new Input();
    this.addChild(this.searchInput);
  }
}
```

Ficando as ausências desse acionamento vinculadas as aparições descabidas e descentralizadas do prompt com prospecções gerenciais num desalinhar em posições do idioma (ex.: coreanos e adjacências atrelado) nas originais opções ao formato exibido em digitação ao IME.

## Built-in Components

### Container

Agrupa componentes filhos.

```typescript
const container = new Container();
container.addChild(component);
container.removeChild(component);
```

### Box

Container que aplica preenchimento e cor de fundo a todos os filhos.

```typescript
const box = new Box(
  1,                              // paddingX (default: 1)
  1,                              // paddingY (default: 1)
  (text) => chalk.bgGray(text)   // optional background function
);
box.addChild(new Text("Content"));
box.setBgFn((text) => chalk.bgBlue(text));  // Change background dynamically
```

### Text

Exibe texto multilinha com quebra de linha automática (word wrapping) e preenchimento.

```typescript
const text = new Text(
  "Hello World",                  // text content
  1,                              // paddingX (default: 1)
  1,                              // paddingY (default: 1)
  (text) => chalk.bgGray(text)   // optional background function
);
text.setText("Updated text");
text.setCustomBgFn((text) => chalk.bgBlue(text));
```

### TruncatedText

Texto de linha única que trunca para caber na largura da viewport. Útil para linhas de status e cabeçalhos.

```typescript
const truncated = new TruncatedText(
  "This is a very long line that will be truncated...",
  0,  // paddingX (default: 0)
  0   // paddingY (default: 0)
);
```

### Input

Entrada de texto de linha única com rolagem horizontal.

```typescript
const input = new Input();
input.onSubmit = (value) => console.log(value);
input.setValue("initial");
input.getValue();
```

Clicar posiciona o cursor e dá foco de teclado à entrada no alternate-screen mode.

**Atalhos de teclado (Key Bindings):**
- `Enter` - Submeter
- `Ctrl+A` / `Ctrl+E` - Início/fim da linha
- `Ctrl+W` ou `Alt+Backspace` - Deletar palavra para trás
- `Ctrl+U` - Deletar do cursor até o início da linha
- `Ctrl+K` - Deletar do cursor até o fim da linha
- `Ctrl+Left` / `Ctrl+Right` - Navegação por palavra
- `Alt+Left` / `Alt+Right` - Navegação por palavra
- Teclas de seta (Arrow keys), Backspace e Delete funcionam conforme esperado

### Editor

Editor de texto multilinha com autocomplete, preenchimento de arquivos (file completion), manipulação de colar (paste) e rolagem vertical quando o conteúdo excede a altura do terminal.

```typescript
interface EditorTheme {
  borderColor: (str: string) => string;
  selectList: SelectListTheme;
}

interface EditorOptions {
  paddingX?: number;  // Horizontal padding (default: 0)
}

const editor = new Editor(tui, theme, options?);  // tui is required for height-aware scrolling
editor.onSubmit = (text) => console.log(text);
editor.onChange = (text) => console.log("Changed:", text);
editor.disableSubmit = true; // Disable submit temporarily
editor.setAutocompleteProvider(provider);
editor.borderColor = (s) => chalk.blue(s); // Change border dynamically
editor.setPaddingX(1); // Update horizontal padding dynamically
editor.getPaddingX();  // Get current padding
```

**Features:**
- Clicar para posicionar o cursor e clicar nas linhas de autocomplete no alternate-screen mode
- Edição multilinha com quebra de linha (word wrap)
- Autocomplete de comandos com barra (digite `/`)
- Autocomplete de caminhos de arquivo (aperte `Tab`)
- Manipulação de colagens grandes (pastes >10 linhas cria o marcador `[paste #1 +50 lines]`)
- Linhas horizontais acima/abaixo do editor
- Renderização de cursor fake (cursor real fica invisível)

**Atalhos de teclado:**
- `Enter` - Submeter
- `Shift+Enter`, `Ctrl+Enter`, ou `Alt+Enter` - Nova linha (depende do terminal, Alt+Enter é o mais confiável)
- `Tab` - Autocomplete
- `Ctrl+K` - Deletar até o fim da linha
- `Ctrl+U` - Deletar até o início da linha
- `Ctrl+W` ou `Alt+Backspace` - Deletar palavra para trás
- `Alt+D` ou `Alt+Delete` - Deletar palavra para frente
- `Ctrl+A` / `Ctrl+E` - Início/fim da linha
- `Ctrl+]` - Pular adiante para o caractere (aguarda o próximo pressionamento de tecla, então move o cursor para a primeira ocorrência)
- `Ctrl+Alt+]` - Pular para trás para o caractere
- Setas, Backspace e Delete funcionam como esperado

### Markdown

Renderiza markdown com syntax highlighting e suporte a temas.

```typescript
interface MarkdownTheme {
  heading: (text: string) => string;
  link: (text: string) => string;
  linkUrl: (text: string) => string;
  code: (text: string) => string;
  codeBlock: (text: string) => string;
  codeBlockBorder: (text: string) => string;
  quote: (text: string) => string;
  quoteBorder: (text: string) => string;
  hr: (text: string) => string;
  listBullet: (text: string) => string;
  bold: (text: string) => string;
  italic: (text: string) => string;
  strikethrough: (text: string) => string;
  underline: (text: string) => string;
  highlightCode?: (code: string, lang?: string) => string[];
}

interface DefaultTextStyle {
  color?: (text: string) => string;
  bgColor?: (text: string) => string;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
}

const md = new Markdown(
  "# Hello\n\nSome **bold** text",
  1,              // paddingX
  1,              // paddingY
  theme,          // MarkdownTheme
  defaultStyle    // optional DefaultTextStyle
);
md.setText("Updated markdown");
```

**Features:**
- Títulos, negrito, itálico, blocos de código (code blocks), listas, links e blocos de citação (blockquotes)
- Tags HTML renderizadas como texto simples
- Syntax highlighting opcional através de `highlightCode`
- Suporte a preenchimento (padding)
- Render caching para desempenho

### Loader

Spinner de loading animado.

```typescript
const loader = new Loader(
  tui,                              // TUI instance for render updates
  (s) => chalk.cyan(s),            // spinner color function
  (s) => chalk.gray(s),            // message color function
  "Loading..."                      // message (default: "Loading...")
);
loader.start();
loader.setMessage("Still loading...");
loader.stop();
```

### CancellableLoader

Estende `Loader` com manipulação da tecla Escape e com AbortSignal para cancelar operações assíncronas.

```typescript
const loader = new CancellableLoader(
  tui,                              // TUI instance for render updates
  (s) => chalk.cyan(s),            // spinner color function
  (s) => chalk.gray(s),            // message color function
  "Working..."                      // message
);
loader.onAbort = () => done(null); // Called when user presses Escape
doAsyncWork(loader.signal).then(done);
```

**Propriedades:**
- `signal: AbortSignal` - Abortado quando o usuário aperta Escape
- `aborted: boolean` - Se o loader foi abortado
- `onAbort?: () => void` - Callback executado quando o usuário aperta Escape

### SelectList

Lista de seleção interativa com navegação via teclado.

```typescript
interface SelectItem {
  value: string;
  label: string;
  description?: string;
}

interface SelectListTheme {
  selectedPrefix: (text: string) => string;
  selectedText: (text: string) => string;
  description: (text: string) => string;
  scrollInfo: (text: string) => string;
  noMatch: (text: string) => string;
}

const list = new SelectList(
  [
    { value: "opt1", label: "Option 1", description: "First option" },
    { value: "opt2", label: "Option 2", description: "Second option" },
  ],
  5,      // maxVisible
  theme   // SelectListTheme
);

list.onSelect = (item) => console.log("Selected:", item);
list.onCancel = () => console.log("Cancelled");
list.onSelectionChange = (item) => console.log("Highlighted:", item);
list.setFilter("opt"); // Filter items
```

**Controles:**
- Mover do mouse/scroll: Destacar linhas (highlight rows) no alternate-screen mode
- Clique: Selecionar linha
- Setas do teclado: Navegação
- Enter: Selecionar
- Escape: Cancelar

### SettingsList

Painel de configurações (Settings panel) com ciclo (cycling) de valores e submenus.

```typescript
interface SettingItem {
  id: string;
  label: string;
  description?: string;
  currentValue: string;
  values?: string[];  // If provided, Enter/Space cycles through these
  submenu?: (currentValue: string, done: (selectedValue?: string) => void) => Component;
}

interface SettingsListTheme {
  label: (text: string, selected: boolean) => string;
  value: (text: string, selected: boolean) => string;
  description: (text: string) => string;
  cursor: string;
  hint: (text: string) => string;
}

const settings = new SettingsList(
  [
    { id: "theme", label: "Theme", currentValue: "dark", values: ["dark", "light"] },
    { id: "model", label: "Model", currentValue: "gpt-4", submenu: (val, done) => modelSelector },
  ],
  10,      // maxVisible
  theme,   // SettingsListTheme
  (id, newValue) => console.log(`${id} changed to ${newValue}`),
  () => console.log("Cancelled")
);
settings.updateValue("theme", "light");
```

**Controles:**
- Mover mouse/scroll: Destacar linhas em alternate-screen mode
- Clique: Ativar uma linha
- Setas do teclado: Navegação
- Enter/Espaço: Ativar (fazer um ciclo de valores ou abrir submenu)
- Escape: Cancelar

### Spacer

Linhas vazias para espaçamento vertical.

```typescript
const spacer = new Spacer(2); // 2 empty lines (default: 1)
```

### Image

Renderiza imagens inline para terminais que suportam o protocolo gráfico do Kitty (Kitty, Ghostty, WezTerm) ou as imagens inline do iTerm2. Faz fallback para um placeholder (espaço reservado) de texto em terminais não suportados.

```typescript
interface ImageTheme {
  fallbackColor: (str: string) => string;
}

interface ImageOptions {
  maxWidthCells?: number;
  maxHeightCells?: number;
  filename?: string;
}

const image = new Image(
  base64Data,       // base64-encoded image data
  "image/png",      // MIME type
  theme,            // ImageTheme
  options           // optional ImageOptions
);
tui.addChild(image);
```

Formatos suportados: PNG, JPEG, GIF, WebP. As dimensões são feitas via parsing automaticamente do cabeçalho de metadados nativo na imagem (image headers).

#### Compatibilidade para imagem nativa via render em visão alternate-screen (Alternate-screen image compatibility)

No `TuiAltScreen` exibições ou manipulações de instâncias por base na tela visual ou providencias no escopo (viewport cropping) atuam de base natural (graphics protocol), via suportes como aos do Ghostty/Kitty. Imagens provindas pelas instâncias que processam baseadas nativamente ao visual estrito em via (inline-image protocol) presente originariamente nos moldes do iTerm2 são deficientes por predefinição nativa por sua origem na aplicação não dando acionamento na eliminação via redimensionamentos nos scrollings, resultando dessa maneira numa sujeira na manipulação ou instâncias (stale images) travadas originadas ou processadas nestes repaints ao visor alternativo. Visando anular esse erro `TuiAltScreen` faz no fallback nas ocorrências um repasse estático pautado via placeholders a texto nos respectivos instanciamentos e de base via as ferramentas iTerm2 de render (iTerm2). As exibições normais das vias a imagem nativa seguem mantidas e geradas de forma normal via render original vindo pelo fluxo principal no (main screen).

## Autocomplete

### CombinedAutocompleteProvider

Suporta autocompletar tanto comandos de barra (slash commands) quanto paths (caminhos de arquivo).

```typescript
import { CombinedAutocompleteProvider } from "@earendil-works/3pi-tui";

const provider = new CombinedAutocompleteProvider(
  [
    { name: "help", description: "Show help" },
    { name: "clear", description: "Clear screen" },
    { name: "delete", description: "Delete last message" },
  ],
  process.cwd() // base path for file completion
);

editor.setAutocompleteProvider(provider);
```

**Features:**
- Digite `/` para ver slash commands
- Pressione `Tab` para autocompletar um caminho de arquivo
- Funciona com `~/`, `./`, `../` e o prefixo `@`
- Filtra apenas arquivos anexáveis (attachable files) sob o prefixo `@`

## Key Detection

Use `matchesKey()` com o auxiliar `Key` para detectar o input no teclado (tem suporte ao protocolo de teclado do Kitty):

```typescript
import { matchesKey, Key } from "@earendil-works/3pi-tui";

if (matchesKey(data, Key.ctrl("c"))) {
  process.exit(0);
}

if (matchesKey(data, Key.enter)) {
  submit();
} else if (matchesKey(data, Key.escape)) {
  cancel();
} else if (matchesKey(data, Key.up)) {
  moveUp();
}
```

**Identificadores de tecla** (use `Key.*` ou o equivalente de string para autocompletar as propriedades literais na verificação via typescript):
- Básicas: `Key.enter`, `Key.escape`, `Key.tab`, `Key.space`, `Key.backspace`, `Key.delete`, `Key.home`, `Key.end`
- Setas: `Key.up`, `Key.down`, `Key.left`, `Key.right`
- Modificadores: `Key.ctrl("c")`, `Key.shift("tab")`, `Key.alt("left")`, `Key.ctrlShift("p")`
- A sintaxe via formatação string atende as verificações também: `"enter"`, `"ctrl+c"`, `"shift+tab"`, `"ctrl+shift+p"`

## Rendering modes

`TuiMainScreen` emprega três estratégias distintas no ato do processo ao rendering:

1. **First Render**: Envia no output da tela as disposições de todos as linhas da aplicação em curso evadindo das exclusões nos scrolls (scrollback)
2. **Width Changed or Change Above Viewport**: Apaga a tela limpando e aplica uma provisão geral ao redesenho (fully re-render)
3. **Normal Update**: Pula e transita nos eixos visuais o cursor apontando a última e inicial localização da via alterada, deleta e encerra após nisto apagando as sequências que foram repassadas ao final das margens preenchidas geradas

A renderização na visão estrita na instância `TuiAltScreen` reserva a integridade alocando limites totais atrelados. Preserva-se toda originalidade do percurso legado a rolagem nativa perante fluxos únicos documentados isentos no limite (layout root). Alocar sob regência (setLayoutRoot) disposições via utilitários: `VStack`, `HStack` ou instâncias internas providas via render base do `ScrollView` reserva e limita o ambiente provido com delimitações locais e atreladas estritamente num percurso autônomo na manipulação originária ao escopo correspondido de sua via. Em casos em que os locais correspondidos são modificados sem que a visão contida seja deslocada de rolamento originária se faz a tratativa e o arranjo restrito via inplace perante o alvo delimitado focado local, gerencia nos streamings ou chamadas vindos mantendo ou fixando do lado de foco à subida/descida provido nativa ao rolar. No uso do teclado base navegativo sob controle ou manipulação giratória provida da máquina ou do auxílio giratório de cliques a alteração original contida do rolamento terminal em manipulações das vias fica intacto sem sofrer impactos ou violações. Incluindo as puladas entre vias base pelo uso estrito original provido sob marcos OSC 133 prompt markers. Barras visuais contidas da rolagem expandem com passagens (hover) ou sustentam comutação atrelada a puxões ou percurso base (track-click) clicável nas abas ao visor de rolagem. Um link ao toque em originário acoplado via (OSC 8 hyperlink) em clique nativo vai lançar-se via roteadores base nos aplicativos encarregados de chamadas para URI no seu sistema de máquina base (URL handler). Nas ações via ponteiros contidos por base nas manipulações originadas ao ato contido pelo arrastar-e-puxar o seu foco principal faz repasse no selecionar. Este percurso faz acionamento via `TuiAltScreenOptions.copyOnSelect` que se estiver isento a restrição por default ao false o respectivo material referenciado transita o percurso original ao escopo nativo da via copiada usando o trajeto das áreas ao colar contido OSC 52; onde manter estritamente esse acionamento a puxão focado (drag) transita nas extremidades ou repassa na rolagem de forma continuada em subida/descida atrelando expansão nativa as regiões (off-screen content) das vias. Base nativas aos visuais no protocolo ao `Kitty images` atuam com eficácia disposta restritamente (cropping), caindo sua respectiva eficiência em acionar-se ao limite referenciado do iTerm2 onde como preterido na incompatibilidade local ou deficiência base do referencial da protocolo, sem ações atreladas e manipuladas na visualização nativa na via em processamentos durante os repaints nas suas exibições em tela via viewports ele falha então fazendo transições cegas restritas em placeholder e texto básico originário da via referida.

No âmbito nativo ou original a qual seja os ambientes as validações e requisições no limite ao output originado envelopam os trânsitos da mesma no escopo das proteções CSI contidos (synchronized output) no ato base em `\x1b[?2026h` e também do marco dispostos em `\x1b[?2026l` atrelado com os resultados via exibições ou resoluções imunes (flicker-free).

## Terminal Interface

O fluxo provido via ambiente utilitário no desenvolvimento original do pacote tem o suporte da implementação via a instâncias dispostas no tipo `Terminal` presente:

```typescript
interface Terminal {
  start(onInput: (data: string) => void, onResize: () => void): void;
  stop(): void;
  write(data: string): void;
  get columns(): number;
  get rows(): number;
  moveBy(lines: number): void;
  hideCursor(): void;
  showCursor(): void;
  clearLine(): void;
  clearFromCursor(): void;
  clearScreen(): void;
}
```

**Built-in implementations:**
- `ProcessTerminal` - Usa `process.stdin/stdout`
- `VirtualTerminal` - Para testes (usa `@xterm/headless`)

## Utilities

```typescript
import { visibleWidth, truncateToWidth, wrapTextWithAnsi } from "@earendil-works/3pi-tui";

// Get visible width of string (ignoring ANSI codes)
const width = visibleWidth("\x1b[31mHello\x1b[0m"); // 5

// Truncate string to width (preserving ANSI codes, adds ellipsis)
const truncated = truncateToWidth("Hello World", 8); // "Hello..."

// Truncate without ellipsis
const truncatedNoEllipsis = truncateToWidth("Hello World", 8, ""); // "Hello Wo"

// Wrap text to width (preserving ANSI codes across line breaks)
const lines = wrapTextWithAnsi("This is a long line that needs wrapping", 20);
// ["This is a long line", "that needs wrapping"]
```

## Creating Custom Components

Ao criar componentes personalizados, **cada linha retornada por `render()` não deve exceder o parâmetro `width`**. O TUI lançará um erro se alguma linha for mais larga que o terminal.

### Handling Input

Use `matchesKey()` com o helper `Key` para entrada de teclado:

```typescript
import { matchesKey, Key, truncateToWidth } from "@earendil-works/3pi-tui";
import type { Component } from "@earendil-works/3pi-tui";

class MyInteractiveComponent implements Component {
  private selectedIndex = 0;
  private items = ["Option 1", "Option 2", "Option 3"];
  
  public onSelect?: (index: number) => void;
  public onCancel?: () => void;

  handleInput(data: string): void {
    if (matchesKey(data, Key.up)) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    } else if (matchesKey(data, Key.down)) {
      this.selectedIndex = Math.min(this.items.length - 1, this.selectedIndex + 1);
    } else if (matchesKey(data, Key.enter)) {
      this.onSelect?.(this.selectedIndex);
    } else if (matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c"))) {
      this.onCancel?.();
    }
  }

  render(width: number): string[] {
    return this.items.map((item, i) => {
      const prefix = i === this.selectedIndex ? "> " : "  ";
      return truncateToWidth(prefix + item, width);
    });
  }

  invalidate(): void {}
}
```

### Handling Line Width

Use os utilitários fornecidos para garantir que as linhas caibam:

```typescript
import { visibleWidth, truncateToWidth } from "@earendil-works/3pi-tui";
import type { Component } from "@earendil-works/3pi-tui";

class MyComponent implements Component {
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  render(width: number): string[] {
    // Option 1: Truncate long lines
    return [truncateToWidth(this.text, width)];

    // Option 2: Check and pad to exact width
    const line = this.text;
    const visible = visibleWidth(line);
    if (visible > width) {
      return [truncateToWidth(line, width)];
    }
    // Pad to exact width (optional, for backgrounds)
    return [line + " ".repeat(width - visible)];
  }

  invalidate(): void {}
}
```

### ANSI Code Considerations

Tanto `visibleWidth()` quanto `truncateToWidth()` tratam corretamente os códigos de escape ANSI:

- `visibleWidth()` ignora códigos ANSI ao calcular a largura
- `truncateToWidth()` preserva códigos ANSI e os fecha corretamente ao truncar

```typescript
import chalk from "chalk";

const styled = chalk.red("Hello") + " " + chalk.blue("World");
const width = visibleWidth(styled); // 11 (not counting ANSI codes)
const truncated = truncateToWidth(styled, 8); // Red "Hello" + " W..." with proper reset
```

### Caching

Para desempenho, componentes devem fazer cache (cached) de sua saída de renderização e renderizar novamente apenas quando necessário:

```typescript
class CachedComponent implements Component {
  private text: string;
  private cachedWidth?: number;
  private cachedLines?: string[];

  render(width: number): string[] {
    if (this.cachedLines && this.cachedWidth === width) {
      return this.cachedLines;
    }

    const lines = [truncateToWidth(this.text, width)];

    this.cachedWidth = width;
    this.cachedLines = lines;
    return lines;
  }

  invalidate(): void {
    this.cachedWidth = undefined;
    this.cachedLines = undefined;
  }
}
```

## Example

Consulte `test/chat-simple.ts` para um exemplo completo de chat interface com:
- Mensagens markdown com cores de fundo personalizadas
- Spinner de loading (carregamento) durante as respostas
- Editor com autocompletar e comandos `/` (slash commands)
- Spacers entre mensagens

Execute-o:
```bash
node test/chat-simple.ts
```

## Development

```bash
# Install dependencies (from monorepo root)
npm install

# Run type checking
npm run check

# Run the demo
node test/chat-simple.ts
```

### Debug logging

Defina `PI_TUI_WRITE_LOG` para capturar a stream ANSI em estado bruto gravada em stdout.

```bash
PI_TUI_WRITE_LOG=/tmp/tui-ansi.log node test/chat-simple.ts
```
