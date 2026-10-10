# Executar o Pi no Windows

Execute o Pi como um processo nativo do Windows ou dentro do Windows Subsystem for Linux (WSL). O Windows nativo usa o Git Bash por padrão para os comandos Bash e pode opcionalmente expor o PowerShell ao model. O Pi dentro do WSL usa o ambiente Linux e sua instalação Bash.

Siga o [Quickstart](quickstart.md) principal para instalar e autenticar o Pi. Use esta página para escolher e configurar seu ambiente de comando.

## Escolher Windows nativo ou WSL

| Ambiente | Ambiente de comando | Use-o quando |
|---|---|---|
| Windows nativo com Git Bash | Git Bash para a ferramenta `bash` integrada e comandos `!` | Seus arquivos e ferramentas de desenvolvimento residem principalmente no Windows |
| Windows nativo com a ferramenta `powershell` | PowerShell para as chamadas de ferramenta do model; o Bash permanece disponível para comandos `!` | A tarefa depende de módulos PowerShell ou comandos nativos do Windows |
| WSL | Bash Linux e ferramentas dentro da distribuição WSL selecionada | Seus arquivos e toolchain já residem no Linux ou WSL |

## Usar Git Bash no Windows nativo

Para a maioria dos usuários de Windows nativo, instalar o [Git for Windows](https://git-scm.com/download/win) é suficiente.

O Pi resolve o Bash nesta ordem:

1. `shellPath` do `~/.3pi/agent/settings.json`
2. Git Bash em `Program Files` ou `Program Files (x86)`
3. `bash.exe` no `PATH`, incluindo Cygwin, MSYS2 ou Bash do WSL legado

Inicie o Pi e insira este comando para verificar o shell:

```text
!printf 'Bash is working\n'
```

Se o Pi não encontrar o Bash, ele relata os locais que verificou. Instale o Git for Windows, coloque outro executável Bash no `PATH` ou configure `shellPath`.

## Deixar o model usar o PowerShell

A ferramenta opcional `powershell` executa comandos através do `pwsh.exe` quando disponível, e então faz o fallback para o Windows PowerShell. Ela inicia o PowerShell com `-NoProfile -NonInteractive -ExecutionPolicy Bypass`. Políticas de execução aplicadas por administrador ainda podem ter precedência.

Para substituir a ferramenta `bash` voltada para o model por `powershell`, adicione isto ao `~/.3pi/agent/settings.json`:

```json
{
  "defaultTools": ["read", "powershell", "edit", "write"]
}
```

`["-bash", "+powershell"]` faz o mesmo enquanto mantém quaisquer outras ferramentas padrão que você configurou.

Reinicie o Pi, depois peça para ele executar um comando PowerShell inofensivo. Os comandos de editor `!` e `!!` continuam a usar o Bash. A ferramenta `powershell` só está disponível quando o Pi é executado como um processo nativo do Windows.

Veja [Settings](settings.md#tools) para outras combinações de ferramentas.

## Usar um executável Bash personalizado

Defina `shellPath` quando o Bash estiver instalado em algum lugar que o Pi não descubra automaticamente:

```json
{
  "shellPath": "C:\\cygwin64\\bin\\bash.exe"
}
```

O JSON usa barras invertidas para sequências de escape. Quando você escreve um caminho Windows com barras invertidas, escreva cada barra invertida duas vezes, como mostrado acima.

Veja [Configure shell commands](shell-aliases.md) para prefixos de comando, aliases e o comportamento completo de resolução do shell.

## Configurar o Windows Terminal

O Windows Terminal reserva ou reescreve algumas teclas modificadas. Veja [Windows Terminal](terminal-setup.md#windows-terminal) para configurar `Shift+Enter` e `Alt+Enter`, e [Keybindings](keybindings.md) para os padrões de atalhos de Windows e WSL do Pi.
