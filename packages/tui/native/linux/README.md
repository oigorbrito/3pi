# Linux clipboard helper

Fornece leituras assíncronas de texto e imagem no X11 usando `libxcb.so.1`. Prebuilds suportam x64 e arm64 no glibc e musl. As leituras têm esperas limitadas (bounded); se uma operação nativa travar, o helper permanecerá indisponível até que ela termine.

O coding-agent fará fallback para ferramentas de linha de comando quando as leituras nativas estiverem indisponíveis. Leituras no Wayland usam `wl-paste`; todas as escritas no Linux usam a linha de comando existente ou os caminhos da área de transferência do terminal.

## Building

Instale um compilador C e os headers de desenvolvimento do XCB, e então execute a partir da raiz do repositório em cada arquitetura Linux suportada:

```sh
npm --prefix packages/tui run build:native:linux
```

## Testing

Instale as dependências de build além do `pkg-config`, `Xvfb` e `xclip`, e então execute de `packages/tui`:

```sh
node --test test/native-clipboard-linux.test.ts
```

Os testes usam servidores X11 isolados, não a área de transferência do desktop. Eles são ignorados quando faltam dependências.
