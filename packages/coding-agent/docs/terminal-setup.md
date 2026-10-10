# Configurar seu terminal

A maioria dos terminais modernos funciona com o Pi sem configuração adicional. Use esta página quando as teclas modificadas, rolagem, links, imagens, cores ou posicionamento do editor de método de entrada (IME) não se comportarem como esperado.

O Pi usa protocolos de teclas estendidos para que os terminais possam distinguir combinações como `Shift+Enter` e `Alt+Enter` do `Enter` simples. Proxies de terminal, multiplexadores e terminais de IDE integrados podem alterar ou descartar essas informações.

## Solução de problemas

| Sintoma | Comece aqui |
|---|---|
| `Shift+Enter` envia em vez de inserir uma linha | A seção do seu terminal abaixo; para tmux, veja [Run Pi in tmux](tmux.md) |
| `Alt+Enter` não enfileira um follow-up | [WezTerm](#wezterm), [Alacritty](#alacritty), ou [Windows Terminal](#windows-terminal) |
| Rolagem em tela cheia é incomumente lenta | [iTerm2](#iterm2) |
| Links funcionam, mas não mostram pré-visualização ao passar o mouse | [Ghostty](#ghostty) |
| Imagens ou cores embutidas não são detectadas | [Sobrescrever capacidades detectadas](#override-detected-capabilities) |
| Uma janela de candidatos de IME aparece no lugar errado | [WezTerm](#wezterm) ou [IntelliJ IDEA](#intellij-idea-integrated-terminal) |
| Teclas modificadas falham apenas dentro do tmux | [Run Pi in tmux](tmux.md) |

Use `/hotkeys` para inspecionar os atalhos ativos do Pi. Veja [Keybindings](keybindings.md) para alterá-los.

## Kitty

O Kitty suporta o protocolo de teclado necessário sem configuração adicional.

## iTerm2

O modo de terminal regular funciona sem configuração adicional.

### Corrigir rolagem lenta em tela cheia

No modo de tela cheia, o Pi é dono da viewport, então o iTerm2 envia relatórios da roda do mouse em vez de rolar o histórico nativo do terminal. Gestos rápidos de trackpad podem então mover apenas cerca de uma linha por vez.

Para alterar este comportamento:

1. Abra **iTerm2 > Settings > Advanced**.
2. Procure por **Trackpad scrolls fast?**.
3. Defina como **No**.

Esta é uma configuração geral do iTerm2 e também pode alterar a rolagem nativa do trackpad. O comportamento subjacente é rastreado na [iTerm2 issue 9619](https://gitlab.com/gnachman/iterm2/-/work_items/9619).

## Apple Terminal

O Pi habilita relatórios aprimorados de teclas quando disponíveis. Se o Terminal.app ainda enviar Return simples para `Shift+Enter`, o Pi usa um fallback de modificador local do macOS e o trata como `Shift+Enter`.

O fallback funciona apenas quando o Pi é executado no mesmo Mac que o Terminal.app. Ele não pode inspecionar o estado do modificador local quando o Pi é executado em outra máquina via SSH.

## Ghostty

Adicione este mapeamento à configuração do Ghostty se `Alt+Backspace` não funcionar:

```text
keybind = alt+backspace=text:\x1b\x7f
```

O arquivo de configuração fica em `~/Library/Application Support/com.mitchellh.ghostty/config` no macOS e `~/.config/ghostty/config` no Linux.

Configurações mais antigas do Claude Code podem conter:

```text
keybind = shift+enter=text:\n
```

Isso envia um linefeed bruto, que o Pi não consegue distinguir de `Ctrl+J`. Remova o mapeamento se uma instalação mais antiga do Claude Code for a única razão pela qual você o adicionou. O Pi já vincula `Ctrl+J` como uma alternativa para nova linha, então o mapeamento pode parecer funcionar enquanto ainda impede que o Pi e o tmux recebam um evento `Shift+Enter` real.

### Abrir links no modo de tela cheia

Os links permanecem clicáveis no modo de tela cheia, mas o Ghostty não mostra seu sublinhado de hover normal ou pré-visualização de URL enquanto o Pi captura a entrada do mouse. Segure `Shift+Command` no macOS ou `Shift+Ctrl` no Linux para usar o manuseio de links nativo do Ghostty.

## WezTerm

O WezTerm normalmente relata `Shift+Enter` através das teclas estendidas do xterm. Para habilitar o protocolo de teclado do Kitty explicitamente, crie `~/.wezterm.lua`:

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.enable_kitty_keyboard = true
return config
```

### Encaminhar Alt+Enter no macOS

O WezTerm vincula `Option+Enter` para tela cheia por padrão no macOS. Para usá-lo para a fila de follow-ups do Pi, adicione esta entrada à sua tabela `config.keys`:

```lua
{
  key = 'Enter',
  mods = 'ALT',
  action = wezterm.action.SendString('\x1b[13;3u'),
}
```

Uma configuração mínima completa é:

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.keys = {
  {
    key = 'Enter',
    mods = 'ALT',
    action = wezterm.action.SendString('\x1b[13;3u'),
  },
}
return config
```

### Posicionar uma janela de candidatos de IME no WSL

Se os candidatos de IME CJK não seguirem o cursor de texto do Pi no WSL, mostre o cursor de hardware:

```bash
export PI_HARDWARE_CURSOR=1
pi
```

Como alternativa, você pode definir `showHardwareCursor` como `true` nas configurações do Pi.

## Alacritty

O Alacritty normalmente relata `Shift+Enter`. No macOS, `Option+Enter` pode chegar como `Enter` simples. Adicione isto ao `~/.config/alacritty/alacritty.toml` para encaminhá-lo para o Pi:

```toml
[[keyboard.bindings]]
key = "Enter"
mods = "Alt"
chars = "\u001b[13;3u"
```

Reinicie o Alacritty após alterar o arquivo.

## Terminal integrado do VS Code

O VS Code 1.109.5 e mais recentes habilitam o protocolo de teclado do Kitty no terminal integrado por padrão.

Para uma versão mais antiga, adicione uma vinculação de terminal `Shift+Enter` ao `keybindings.json`:

```json
{
  "key": "shift+enter",
  "command": "workbench.action.terminal.sendSequence",
  "args": { "text": "\u001b[13;2u" },
  "when": "terminalFocus"
}
```

O arquivo de usuário `keybindings.json` está normalmente localizado em:

- macOS: `~/Library/Application Support/Code/User/keybindings.json`
- Linux: `~/.config/Code/User/keybindings.json`
- Windows: `%APPDATA%\\Code\\User\\keybindings.json`

## Terminal integrado do Zed

Adicione estas vinculações ao `keymap.json` do Zed:

```json
{
  "context": "Terminal",
  "bindings": {
    "shift-enter": ["terminal::SendText", "\u001b[13;2u"],
    "ctrl--": ["terminal::SendText", "\u001b[45;5u"],
    "ctrl-alt-]": ["terminal::SendText", "\u001b[93;7u"]
  }
}
```

## Windows Terminal

O Windows Terminal usa os padrões de atalhos de Windows e WSL do Pi. Veja [Keybindings](keybindings.md) para a lista completa.

### Encaminhar Shift+Enter

Abra o `settings.json` do Windows Terminal com `Ctrl+Shift+,` ou **Settings > Open JSON file**. Adicione este objeto ao seu array `actions`:

```json
{
  "command": { "action": "sendInput", "input": "\u001b[13;2u" },
  "keys": "shift+enter"
}
```

Feche completamente e reabra o Windows Terminal, então verifique se `Shift+Enter` insere uma nova linha no Pi.

### Usar Alt+Enter para follow-ups

O Windows Terminal vincula `Alt+Enter` para tela cheia por padrão. Portanto, o Pi usa `Ctrl+Q` para follow-ups no Windows e WSL.

Para usar `Alt+Enter` em vez disso, configure o Windows Terminal para encaminhar a tecla e vincule `app.message.followUp` a `alt+enter` no `keybindings.json` do Pi. Veja [Keybindings](keybindings.md#assign-keybindings).

## xfce4-terminal e Terminator

Esses terminais não conseguem distinguir de forma confiável teclas Enter modificadas do `Enter` simples. Vinculações personalizadas como `Ctrl+Enter` ou `Shift+Enter`, portanto, podem não funcionar.

Use um terminal com suporte moderno a teclas estendidas quando precisar desses atalhos, como Kitty, Ghostty, WezTerm, iTerm2, Windows Terminal ou uma build compatível do Alacritty.

## Terminal integrado do IntelliJ IDEA

O terminal integrado do IntelliJ IDEA não consegue distinguir de forma confiável `Shift+Enter` do `Enter` simples. Use `Ctrl+J` para uma nova linha ou execute o Pi em um terminal com suporte moderno a teclas estendidas.

Se uma janela de candidatos de IME não seguir o cursor de texto, mostre o cursor de hardware:

```bash
export PI_HARDWARE_CURSOR=1
pi
```

## Sobrescrever capacidades detectadas

O Pi detecta automaticamente hyperlinks OSC 8, protocolos de imagem embutida e suporte a truecolor. Um proxy de terminal ou multiplexador pode tornar essa detecção imprecisa.

| Capacidade | Variável de ambiente | Configuração |
|---|---|---|
| Hyperlinks | `PI_HYPERLINKS=1\|0\|auto` | `terminal.hyperlinks: true\|false\|"auto"` |
| Imagens embutidas | `PI_IMAGE_PROTOCOL=kitty\|iterm2\|none\|auto` | `terminal.images: "kitty"\|"iterm2"\|false\|"auto"` |
| Truecolor | `PI_TRUE_COLOR=1\|0\|auto` | `terminal.trueColor: true\|false\|"auto"` |

Configurações têm precedência sobre variáveis de ambiente. Um valor não definido ou `auto` preserva a detecção automática.

Apenas force uma capacidade suportada por todo o caminho do terminal. Sequências de escape não suportadas podem corromper a renderização. Veja [Environment Variables](environment-variables.md#pi-process-configuration) e [Settings](settings.md) para as definições de valores canônicos.
