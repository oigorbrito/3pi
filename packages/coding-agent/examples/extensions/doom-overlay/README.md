# DOOM Overlay Demo

Jogue DOOM como um overlay no pi. Demonstra que o sistema de overlay consegue lidar com renderização de jogos em tempo real a 35 FPS.

## Uso

```bash
pi --extension ./examples/extensions/doom-overlay
```

Em seguida, execute:
```
/doom-overlay
```

O arquivo WAD shareware (~4MB) é baixado automaticamente na primeira execução.

## Controles

| Ação | Teclas |
|--------|------|
| Mover | WASD ou Setas |
| Correr | Shift + WASD |
| Atirar | F ou Ctrl |
| Usar/Abrir | Espaço |
| Armas | 1-7 |
| Mapa | Tab |
| Menu | Esc |
| Pausar/Sair | Q |

## Como Funciona

DOOM roda como WebAssembly compilado a partir de [doomgeneric](https://github.com/ozkl/doomgeneric). Cada frame é renderizado usando caracteres de meio bloco (half-block) (▀) com cor de 24 bits, onde o pixel superior é a cor de primeiro plano e o pixel inferior é a cor de fundo.

O overlay usa:
- `width: "90%"` - 90% da largura do terminal
- `maxHeight: "80%"` - Máximo de 80% da altura do terminal
- `anchor: "center"` - Centralizado no terminal

A altura é calculada a partir da largura para manter a proporção de 3.2:1 do DOOM (levando em conta a renderização em meio bloco).

## Créditos

- [id Software](https://github.com/id-Software/DOOM) pelo DOOM original
- [doomgeneric](https://github.com/ozkl/doomgeneric) pela implementação portátil do DOOM
- [pi-doom](https://github.com/badlogic/pi-doom) pela integração original no pi
