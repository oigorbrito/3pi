# Aliases de Shell

O Pi inicia um shell não interativo em subprocessos para rodar Bash. Ele não usa aliases por padrão.

Use `shellPath` para mudar o Bash. `shellCommandPrefix` para configuração antes de comandos.

```json
{
  "shellPath": "~/.local/bin/bash",
  "shellCommandPrefix": "shopt -s expand_aliases\nsource ~/.bash_aliases"
}
```

O prefixo entra com `!comando`.
