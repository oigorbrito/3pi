# Darwin native prebuilds

Fornece estado da tecla modificadora (modifier-key) e acesso assíncrono à área de transferência de texto, imagem e caminho de arquivo usando AppKit.

## Building

No macOS, execute a partir da raiz do repositório:

```sh
npm --prefix packages/tui run build:native:darwin
```

O build usa o Apple clang e o SDK do macOS encontrado através do `xcrun`. Tanto Intel quanto Apple Silicon podem construir ambos os alvos: arm64 (macOS 11+) e x64 (macOS 10.15+).

Cross-building requer um toolchain Darwin com um SDK do macOS e um linker Mach-O, como o osxcross:

```sh
CC=/path/to/osxcross/clang SDKROOT=/path/to/MacOSX.sdk \
  npm --prefix packages/tui run build:native:darwin
```

O SDK deve ser obtido e usado sob a licença da Apple. O clang puro ou o Zig sozinho não são suficientes.
