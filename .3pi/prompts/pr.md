---
description: Revisar PRs de URLs com problema estruturado e análise de código
argument-hint: "<PR-URL>"
---
Você recebeu uma ou mais URLs de GitHub PR: $@

Para cada URL de PR, faça o seguinte na ordem:
1. Adicione a label `inprogress` ao PR via GitHub CLI antes de a análise começar. Se a adição da label falhar, relate isso explicitamente e continue.
2. Leia a página do PR por completo. Inclua descrição, todos os comentários, todos os commits e todos os arquivos alterados.
3. Identifique quaisquer issues vinculadas referenciadas no corpo do PR, comentários, mensagens de commit ou links cruzados. Leia cada issue por completo, incluindo todos os comentários.
4. Analise o diff do PR sem fazer checkout ou mudar para o branch do PR. Use `gh pr diff`, `gh pr view`, `gh api` e arquivos locais do branch main; se o conteúdo do arquivo do PR for necessário, use referências obtidas com `git show <ref>:<path>` ou arquivos temporários. Leia todos os arquivos de código relevantes por completo, sem truncamento, e compare com o diff. Não faça fetch dos blobs de arquivo do PR a menos que um arquivo esteja faltando no main ou o contexto do diff seja insuficiente. Inclua caminhos de código relacionados que não estão no diff, mas são necessários para validar o comportamento.
5. Não verifique por uma entrada no changelog. De acordo com o CONTRIBUTING.md, PRs de contribuidores não devem editar o `CHANGELOG.md` — o mantenedor adiciona a entrada ao fazer o merge.
6. Verifique se packages/coding-agent/README.md, packages/coding-agent/docs/*.md, packages/coding-agent/examples/**/*.md requerem modificação. Isso geralmente acontece quando features existentes foram alterados, ou novos features foram adicionados.
7. Forneça uma revisão estruturada com estas seções:
   - What it does: um parágrafo curto descrevendo a alteração e sua intenção.
   - Good: escolhas sólidas ou melhorias.
   - Bad: problemas concretos, regressões, testes ausentes ou riscos.
   - Ugly: problemas sutis ou de alto impacto.
   - Tests: o que está coberto, o que está faltando e se os testes existentes são adequados.
   - Open questions for you: apenas coisas bloqueando uma decisão de merge que precisem do input do usuário. Omita a seção inteiramente se não houver nenhuma.

Formato de saída por PR:
PR: <url>
What it does:
- ...
Good:
- ...
Bad:
- ...
Ugly:
- ...
Tests:
- ...
Open questions for you:
- ...

Se nenhum problema for encontrado, diga isso em Bad e Ugly.
