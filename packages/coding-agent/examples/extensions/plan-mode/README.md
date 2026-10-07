# Extensão Plan Mode

Modo de exploração somente leitura (read-only) para análise segura de código.

## Funcionalidades

- **Ferramentas de escrita embutidas desativadas**: Desativa edição/escrita enquanto preserva outras ferramentas ativas
- **Allowlist do bash**: Apenas comandos bash somente leitura são permitidos
- **Extração de plano**: Extrai etapas numeradas de seções `Plan:`
- **Rastreamento de progresso**: Widget mostra o status de conclusão durante a execução
- **Marcadores [DONE:n]**: Rastreamento explícito de conclusão de etapa
- **Persistência de sessão**: O estado sobrevive à retomada da sessão (session resume)

## Comandos

- `/plan` - Alternar modo de plano (plan mode)
- `/todos` - Mostrar o progresso do plano atual
- `Ctrl+Alt+P` - Alternar modo de plano (atalho)

## Uso

1. Ative o modo de plano (plan mode) com `/plan` ou a flag `--plan`
2. Peça ao agente para analisar o código e criar um plano
3. O agente deve produzir um plano numerado sob um cabeçalho `Plan:`:

```
Plan:
1. First step description
2. Second step description
3. Third step description
```

4. Escolha "Execute the plan" quando solicitado
5. Durante a execução, o agente marca as etapas concluídas com as tags `[DONE:n]`
6. O widget de progresso mostra o status de conclusão

## Como Funciona

### Modo de Plano (Somente Leitura)
- Ferramentas de edição/escrita integradas desativadas
- Outras ferramentas ativas permanecem disponíveis
- Comandos bash filtrados através de allowlist
- O agente cria um plano sem fazer alterações

### Modo de Execução
- Acesso total às ferramentas restaurado
- O agente executa os passos em ordem
- Marcadores `[DONE:n]` acompanham a conclusão
- O widget mostra o progresso

### Lista de Comandos Permitidos (Command Allowlist)

Comandos seguros (permitidos):
- Inspeção de arquivos: `cat`, `head`, `tail`, `less`, `more`
- Pesquisa: `grep`, `find`, `rg`, `fd`
- Diretório: `ls`, `pwd`, `tree`
- Leitura do Git: `git status`, `git log`, `git diff`, `git branch`
- Informações de pacotes: `npm list`, `npm outdated`, `yarn info`
- Informações do sistema: `uname`, `whoami`, `date`, `uptime`

Comandos bloqueados:
- Modificação de arquivos: `rm`, `mv`, `cp`, `mkdir`, `touch`
- Escrita do Git: `git add`, `git commit`, `git push`
- Instalação de pacotes: `npm install`, `yarn add`, `pip install`
- Sistema: `sudo`, `kill`, `reboot`
- Editores: `vim`, `nano`, `code`
