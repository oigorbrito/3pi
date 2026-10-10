# Executar o Pi no tmux

O Pi funciona dentro do tmux, mas o tmux pode relatar `Shift+Enter`, `Ctrl+Enter` e o `Enter` simples como a mesma tecla. Habilite teclas estendidas para que o Pi possa distingui-las.

## Verifique sua versão do tmux

```bash
tmux -V
```

Para tmux 3.5 ou mais recente, use a configuração recomendada de CSI-u abaixo. Para tmux 3.2 a 3.4, use a configuração de versão mais antiga.

## Habilitar teclas estendidas no tmux 3.5 ou mais recente

Adicione estas linhas ao `~/.tmux.conf`:

```tmux
set -g extended-keys on
set -g extended-keys-format csi-u
```

O Pi solicita o relatório de teclas estendidas quando o terminal não fornece o protocolo de teclado do Kitty diretamente. CSI-u é o formato mais confiável para encaminhar teclas modificadas pelo tmux.

## Reiniciar o tmux

A configuração se aplica ao servidor tmux. Para garantir que ela esteja ativa, feche suas sessões do tmux e inicie um novo servidor.

Se você decidir parar o servidor pela linha de comando, salve seu trabalho primeiro. Este comando encerra todas as sessões gerenciadas por esse servidor:

```bash
tmux kill-server
tmux
```

## Verificar teclas modificadas

Inicie o Pi dentro da nova sessão do tmux e verifique se:

1. `Shift+Enter` insere uma nova linha no editor.
2. `Enter` envia o prompt.
3. `Alt+Enter` enfileira um follow-up no macOS e Linux. Windows e WSL usam `Ctrl+Q` por padrão.

Se essas teclas ainda se comportarem como `Enter` simples, verifique se o terminal fora do tmux pode relatar teclas modificadas. Veja [Configure your terminal](terminal-setup.md).

## Usar tmux 3.2 até 3.4

Essas versões suportam teclas estendidas, mas não `extended-keys-format csi-u`. Adicione apenas:

```tmux
set -g extended-keys on
```

O Pi suporta o formato `modifyOtherKeys` do xterm usado por essas versões. Reinicie o tmux e repita as etapas de verificação.

Para versões mais antigas, atualize o tmux ou use o Pi fora do tmux em vez de depender dos atalhos de Enter modificados.
