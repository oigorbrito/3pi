# Personalizar o Pi com temas

Temas controlam as cores que o Pi usa no modo interativo e nas exportações HTML. O Pi inclui os temas `system`, `dark` e `light`. Você pode selecionar um tema, seguir a aparência clara ou escura do seu terminal ou criar sua própria paleta.

## Usar as cores do seu terminal

O tema `system` é o padrão. Ele constrói as cores do Pi a partir do tema do seu terminal, para que o Pi corresponda ao terminal em vez de trazer sua própria paleta:

- O Pi consulta as cores de primeiro plano (foreground) e de fundo (background) padrão do terminal e suas 16 cores ANSI.
- Cada cor do Pi assume sua matiz (hue) de uma cor ANSI, por exemplo, erros de vermelho e links de azul.
- O Pi define a luminosidade (lightness) de cada cor para que ela se destaque do fundo com um contraste mínimo. O texto do corpo mantém pelo menos uma taxa de contraste WCAG de 4.5:1 no fundo e em todos os painéis.
- Quando o terminal alterna entre claro e escuro, o Pi consulta as cores novamente e reconstrói o tema.

O tema se adapta ao que o terminal relata:

| O terminal relata | Resultado |
|---|---|
| Fundo e cores ANSI | Cores da paleta do terminal, posicionadas para o fundo real. |
| Apenas fundo | Matizes próprias do Pi, posicionadas para o fundo real. |
| Nada | Índices de cores ANSI e as cores padrão do terminal, que o próprio terminal renderiza. O texto secundário é fraco e os painéis não têm cor de fundo. |

O Pi pede ao terminal suas cores quando inicia. Os terminais geralmente respondem em alguns milissegundos, e o Pi espera no máximo 100 ms antes de mostrar o cabeçalho de inicialização. Se o terminal não responder a tempo, o Pi usa o fallback de cor ANSI e ainda aplica as cores se elas chegarem depois, por exemplo, através de uma conexão SSH lenta. `system` é um nome reservado: um tema personalizado com esse nome é ignorado.

<a id="selecting-a-theme"></a>

## Escolher um tema

Abra `/settings` e selecione **Theme**. Você pode usar um tema para todas as aparências do terminal ou escolher temas separados para terminais claros e escuros.

A seleção é salva como a [configuração](settings.md#terminal-and-display) `theme`:

```json
{
  "theme": "dark"
}
```

Sem uma configuração `theme`, o Pi usa `system`.

O modo automático armazena o tema claro primeiro e o tema escuro em segundo:

```json
{
  "theme": "light/dark"
}
```

O Pi decide se o terminal é claro ou escuro com base em suas cores de fundo e primeiro plano relatadas. Se o terminal não relatar seu fundo, o Pi usa a notificação de claro/escuro do terminal, depois a variável de ambiente `COLORFGBG`, e então escuro. A mesma decisão escolhe o tema de um par claro/escuro e a aparência de `system`. Quando o modo automático está ativo, o Pi muda os temas quando o terminal relata uma mudança de aparência. Os nomes dos temas não podem conter `/` porque o Pi o reserva para este formato de configuração.

Use `--use-theme` para escolher o tema inicial para uma invocação sem alterar a configuração salva:

```bash
pi --use-theme light
pi --use-theme light/dark
```

Veja [CLI resources](cli.md#resources) para a opção de linha de comando.

## Criar um tema personalizado

Copie um dos [temas integrados](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/src/modes/interactive/theme) ou crie um novo arquivo JSON em conformidade com o [schema](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json). Os temas integrados usam cores OKHSL, com variáveis para cores que vários papéis compartilham, para que você possa ajustar matiz, saturação ou luminosidade diretamente.

1. Salve o arquivo como `<agent-dir>/themes/my-theme.json`. O diretório do agent é `~/.3pi/agent` por padrão.
2. Defina seu `name` para `my-theme`.
3. Altere valores em `vars` e `colors`.
4. Selecione `my-theme` através de `/settings`.

Use o nome do tema como o nome do arquivo. O Pi recarrega rapidamente (hot-reload) o tema de usuário ativo apenas a partir de `<agent-dir>/themes/<name>.json`. Execute `/reload` após adicionar ou alterar um tema de qualquer outra fonte.

## Entender o arquivo de tema

| Propriedade | Obrigatório | Responsabilidade |
|---|---|---|
| `$schema` | Não | Habilita validação e autocompletar do editor contra o schema publicado do Pi. |
| `name` | Sim | Identifica o tema em seletores e configurações. Deve ser único, não pode conter `/` e não pode ser `system`. |
| `appearance` | Não | `"dark"` ou `"light"`: o fundo para o qual o tema foi projetado. O Pi o detecta a partir das cores do tema quando omitido. |
| `vars` | Não | Define valores de cores reutilizáveis. Variáveis podem referenciar outras variáveis. |
| `colors` | Sim | Atribui cores aos papéis (roles) da UI do terminal. O schema identifica os papéis obrigatórios e opcionais. |
| `export` | Não | Substitui os fundos da página e do painel nas exportações HTML. |

Uma cor pode ser escrita em seis formas:

| Forma | Exemplo | Significado |
|---|---|---|
| RGB hexadecimal | `"#0af"` ou `"#00aaff"` | Uma cor sRGB de três ou seis dígitos. |
| OKLCH | `"oklch(62% 0.1 200)"` | Luminosidade perceptual, croma e matiz. |
| OKHSL | `"okhsl(250 60% 55%)"` | Matiz, saturação e luminosidade. A saturação é relativa ao máximo que a gama (gamut) sRGB permite naquela matiz e luminosidade, então todo valor está na gama e a mesma saturação parece igualmente colorida. |
| Índice de 256 cores | `39` | Um índice de paleta ANSI de `0` a `255`. |
| Referência de variável | `"primary"` | O valor de uma entrada em `vars`. |
| Padrão do terminal | `""` | A cor de primeiro plano ou de fundo padrão do terminal. |

As cores padrão do terminal são renderizadas como as próprias cores do terminal. Onde o Pi precisa de um valor concreto, como exportação HTML ou cálculos de cores em extensions, ele usa as cores padrão que o terminal relata, ou um palpite de preto ou branco com base na aparência do tema.

O Pi resolve referências de variáveis em cadeia. Uma variável ausente ou uma referência circular torna o tema inválido. O Pi usa truecolor quando disponível, mapeia OKLCH para sRGB (gamut-map) e aproxima cores para terminais de 256 cores. As exportações HTML convertem valores OKHSL para hexadecimal porque o CSS não os suporta. Se as cores diferirem de seus valores de origem, verifique as configurações de detecção e contraste do truecolor do seu terminal. Veja [Configure Your Terminal](terminal-setup.md#override-detected-capabilities).

Use o [schema JSON de tema](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json) para as propriedades exatas, cores obrigatórias e tipos de valores aceitos.

O Pi relata arquivos de tema inválidos durante a inicialização e `/reload`.

## Encontrar a cor para alterar

As cores do tema descrevem os papéis (roles) da interface em vez de componentes individuais. Use esses grupos para encontrar a parte relevante do schema:

| Área | Nomes das cores |
|---|---|
| Interface geral | `accent`, `border*`, `text`, `muted`, `dim`, `success`, `error`, `warning` |
| Seleção e tela cheia | `selectedBg`, `searchMatch*`, `scrollbar*` |
| Mensagens | `userMessage*`, `customMessage*`, `thinkingText` |
| Execução de ferramentas | `toolPendingBg`, `toolSuccessBg`, `toolErrorBg`, `toolTitle`, `toolOutput` |
| Markdown | `md*` |
| Diffs de ferramentas | `toolDiff*` |
| Destaque de sintaxe | `syntax*` |
| Modos de editor | `thinking*`, `bashMode` |
| Exportação HTML | `export.pageBg`, `export.cardBg`, `export.infoBg` |

O schema é a referência de formato. Os temas integrados fornecem valores completos que você pode copiar e ajustar.

Cinco cores são opcionais e herdam outra cor quando omitidas:

| Cor opcional | Fallback |
|---|---|
| `scrollbarTrack` | `muted` |
| `scrollbarThumb` | `text` |
| `searchMatchBg` | `selectedBg` |
| `searchMatchText` | `text` |
| `thinkingMax` | `thinkingXhigh` |

Se as cores `export` forem omitidas, o Pi deriva os fundos da página HTML e do painel a partir de `userMessageBg`.

## Carregar um tema de um projeto ou pacote

Coloque um tema de projeto em `.3pi/themes/`. Os temas de projeto são carregados apenas após a concessão do [trust do projeto](security.md#understand-project-trust).

Você também pode carregar arquivos e diretórios de temas através da configuração `themes` ou distribuí-los em um Pi package. Veja [Configuration](configuration.md), [Settings](settings.md#resources) e [Pi Packages](packages.md).

Cada tema carregado deve ter um nome exclusivo. O Pi relata nomes duplicados como colisões de recursos.
