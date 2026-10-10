# Windows native prebuilds

Fornece configuração de input no console, estado da tecla modificadora (modifier-key) e acesso assíncrono à área de transferência de texto/imagem. Ele se vincula ao `kernel32` e ao `user32`; nenhum header do Node é necessário.

## Building

No Windows, instale a workload "Desenvolvimento para Desktop com C++" do Visual Studio e, em seguida, execute a partir da raiz do repositório para compilar x64 e arm64:

```sh
npm --prefix packages/tui run build:native:win32
```

Para cross-builds ou toolchains customizadas, forneça compiladores compatíveis com MinGW:

```sh
PI_TUI_WIN32_TOOLCHAIN=mingw \
CC_X64=/path/to/x86_64-w64-mingw32-gcc \
CC_ARM64=/path/to/aarch64-w64-mingw32-gcc \
npm --prefix packages/tui run build:native:win32
```

## Testing clipboard writes

Em um desktop de teste Windows, execute a partir de `packages/tui` no PowerShell:

```powershell
$env:PI_TEST_NATIVE_CLIPBOARD = "1"
node --test test/native-platform.test.ts
```

Este teste opt-in verifica as escritas e leituras nativas de texto. **Ele substitui o conteúdo da área de transferência do sistema.**
