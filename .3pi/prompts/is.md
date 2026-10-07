---
description: Analisar GitHub issues (bugs ou solicitações de recursos)
argument-hint: "<issue>"
---
Analisar issue(s) do GitHub: $ARGUMENTS

Para cada issue:

1. Se estiver rodando em CI (`CI=true`), não adicione a label `inprogress` e não atribua (assign) a issue. Caso contrário, adicione a label `inprogress` à issue via GitHub CLI e atribua a issue ao usuário `gh` local antes da análise começar. Se qualquer ação falhar, relate isso explicitamente e continue.
2. Leia a issue por completo, incluindo todos os comentários e issues/PRs vinculados. Use campos suportados pelo GitHub CLI, por exemplo:
   ```sh
   gh issue view <issue> --json title,body,comments,labels,assignees,state,url,author,createdAt,updatedAt,closedByPullRequestsReferences
   ```
3. Não confie na análise escrita na issue. Verifique independentemente o comportamento e derive sua própria análise do código e caminho de execução.

4. **Para bugs**:
   - Ignore qualquer análise de causa raiz na issue (provavelmente errada)
   - Leia todos os arquivos de código relacionados por completo (sem truncamento)
   - Rastreie o caminho do código e identifique a verdadeira causa raiz
   - Proponha uma correção

5. **Para feature requests**:
   - Não confie em propostas de implementação na issue sem verificação
   - Leia todos os arquivos de código relacionados por completo (sem truncamento)
   - Proponha a abordagem de implementação mais concisa
   - Liste os arquivos afetados e as alterações necessárias

NÃO implemente a menos que solicitado explicitamente. Analise e proponha apenas.
