---
name: interactive-testing
description: Testar e depurar o modo interativo do pi em um terminal tmux controlado. Use para verificações de comportamento da TUI e testes de fumaça (smoke tests) de release interativos.
---

# Testando o Modo Interativo do pi com tmux

Execute a TUI em um terminal controlado (a partir da raiz do repositório, dois diretórios acima desta skill):

```bash
tmux new-session -d -s pi-test -x 80 -y 24
tmux send-keys -t pi-test "./pi-test.sh" Enter
sleep 3 && tmux capture-pane -t pi-test -p     # capturar após a inicialização
tmux send-keys -t pi-test "sua mensagem aqui" Enter
tmux send-keys -t pi-test Escape               # teclas especiais (também C-o para ctrl+o, etc.)
tmux kill-session -t pi-test
```

Para testes de fumaça (smoke tests) de release, inicie a sessão tmux com `-c /tmp` e substitua `./pi-test.sh` pelo caminho absoluto para o binário da release. Teste ambos os binários do Node e do Bun separadamente, envie um prompt e aguarde a resposta do model; a inicialização por si só não é um smoke test aprovado.
