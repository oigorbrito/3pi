# Regras de Desenvolvimento

## Estilo de Conversação

- Mantenha as respostas curtas e concisas.
- Sem emojis em commits, issues, comentários de PR ou código.
- Sem enrolação ou texto preenchedor animado (por exemplo, "Obrigado @user" em vez de "Muito obrigado @user!").
- Apenas prosa técnica, seja direto.
- Use linguagem concisa, clara e simples. Defina o jargão inevitável antes de usá-lo.
- Explique designs e problemas não triviais como: problema, exemplo concreto ou pequeno rastro (trace), depois a solução. Declare por que a solução é necessária e faça a distinção de uma complexidade opcional.
- Prefira comportamento concreto e pequenas ilustrações a resumos abstratos, terminologia densa ou listas não explicadas de alterações.
- Quando o usuário fizer uma pergunta, responda-a primeiro antes de fazer edições ou rodar comandos de implementação.
- Ao responder ao feedback do usuário ou a uma análise, diga explicitamente se você concorda ou discorda antes de dizer o que mudou.

## Qualidade de Código

- Leia os arquivos na íntegra antes de fazer mudanças abrangentes, antes de editar arquivos que você não inspecionou completamente, e quando for solicitado a investigar ou auditar. Não dependa de trechos de pesquisa (search snippets) para mudanças amplas.
- Sem `any` a menos que seja absolutamente necessário.
- Transforme em código inline (inline) funções auxiliares (helpers) de uma única linha que tenham apenas um local de chamada.
- Verifique o node_modules para tipos de APIs externas; não tente adivinhar.
- **Sem importações inline** (`await import()`, `import("pkg").Type`, importações de tipo dinâmicas). Apenas importações de nível superior (top-level imports).
- Em `packages/coding-agent`, resolva os assets do pacote através de funções auxiliares (helpers) em `src/config.ts`. Não use `__dirname` diretamente; os helpers consideram checkouts de fonte, instalações via npm e binários autônomos.
- Nunca remova ou faça downgrade de código para consertar erros de tipo de dependências desatualizadas; em vez disso, atualize a dependência.
- Use apenas a sintaxe descartável do TypeScript (Node strip-only mode) no código verificado pela configuração raiz (`packages/*/src`, `packages/*/test`, `packages/coding-agent/examples`): sem propriedades de parâmetro, `enum`, `namespace`/`module`, `import =`, `export =` ou outros construtos que precisem de emissão (emit) em JS. Use campos explícitos com atribuições no construtor.
- Sempre pergunte antes de remover uma funcionalidade ou código que pareça intencional.
- Não preserve a compatibilidade com versões anteriores (backward compatibility) a menos que o usuário solicite.
- Nunca faça hardcode (codifique diretamente) de checagens de teclas (por exemplo, `matchesKey(keyData, "ctrl+x")`). Adicione padrões em `DEFAULT_EDITOR_KEYBINDINGS` ou `DEFAULT_APP_KEYBINDINGS` para que permaneçam configuráveis.
- Nunca modifique `packages/ai/src/models.generated.ts` diretamente; atualize `packages/ai/scripts/generate-models.ts` em vez disso e, em seguida, gere novamente. Incluir as diferenças do `models.generated.ts` resultante é sempre OK, mesmo se a regeneração incluir alterações de metadados do modelo de upstream que não tenham relação.

## Comandos

- Após mudanças no código (não na documentação): `npm run check` (saída completa, sem tail). Conserte todos os erros, avisos e informações antes de commitar. Isso não roda os testes.
- Nunca rode `npm run build` ou `npm test` a menos que seja solicitado pelo usuário.
- Nunca rode a suíte completa do vitest diretamente: ela inclui testes e2e que são ativados quando variáveis de ambiente de endpoint/autenticação estão presentes. Para todos os testes que não sejam e2e, execute `./test.sh` a partir da raiz do repositório. Caso contrário, rode testes específicos a partir da raiz do pacote:
  - Vitest: `node "$(git rev-parse --show-toplevel)/node_modules/vitest/dist/cli.js" --run test/specific.test.ts`
  - `packages/tui` (`node:test`): `node --test test/specific.test.ts`
- Se você criar ou modificar um arquivo de teste, rode-o e repita as iterações (iterate) no teste ou na implementação até que passe.
- Para `packages/coding-agent/test/suite/`, use `test/suite/harness.ts` + o provedor simulado (faux provider). Nada de APIs de provedores reais, chaves ou tokens pagos.
- Quando criar testes de regressão (regressions tests) para consertar uma issue do GitHub, adicione um comentário com o número da issue do GitHub ao lado do teste.
- Para scripts ad-hoc, escreva-os (`write`) em um arquivo temporário (por exemplo, `/tmp`), rode-os, edite se necessário, remova quando terminar. Não incorpore scripts de várias linhas em comandos `bash`.
- Nunca commite a menos que o usuário peça.

## Dependências e Segurança de Instalação

- Trate alterações em dependências npm e no lockfile como código revisado. As dependências diretas externas continuam fixadas em versões exatas.
- Ao atualizar o `undici`, você DEVE ler seu changelog/notas de release para a versão de destino e avaliar se alguma alteração pode afetar a funcionalidade antes de aplicar a atualização.
- Hidrate/atualize localmente com `npm install --ignore-scripts`; em estilo CI/limpo com `npm ci --ignore-scripts`. Não execute scripts de ciclo de vida (lifecycle scripts) a não ser que o usuário peça.
- Se os metadados da dependência mudarem, atualize o `package-lock.json` com `npm install --package-lock-only --ignore-scripts`.
- Se `packages/coding-agent/install-lock/` precisar ser recriado (regen), rode `node scripts/generate-coding-agent-install-lock.mjs` (verifique com `--check` ou `npm run check`). Novas dependências com scripts de ciclo de vida precisam de revisão e uma entrada de lista de permissão (allowlist) explícita nesse script; nunca adicione uma de forma silenciosa.
- O pre-commit bloqueia commits de lockfile a não ser que `PI_ALLOW_LOCKFILE_CHANGE=1`. Não contorne a menos que o usuário queira que a alteração do lockfile seja commitada.

## Git

Múltiplas sessões do 3pi podem estar rodando neste cwd ao mesmo tempo, cada uma modificando arquivos diferentes. As operações Git que tocarem em arquivos que não foram staged (unstaged), que foram staged, ou não rastreados (untracked) fora das suas próprias modificações vão sobrescrever o trabalho de outras sessões. Siga estas regras:

Realizando Commits (Committing):

- Faça commit apenas dos arquivos que VOCÊ alterou NESTA sessão.
- Faça o stage de caminhos explícitos (`git add <path1> <path2>`); nunca `git add -A` / `git add .`.
- Antes de commitar, rode `git status` e verifique se você está fazendo o stage apenas dos seus arquivos.
- O arquivo `packages/ai/src/models.generated.ts` pode ser sempre incluído junto aos seus arquivos.
- Formato da mensagem: `{feat,fix,docs}[(ai,tui,agent,coding-agent)]: <commit message> (opcionalmente com várias linhas)`. A mensagem deve ser informativa e concisa.

Nunca execute (destrói o trabalho de outros agentes ou contorna as verificações):

- `git reset --hard`, `git checkout .`, `git clean -fd`, `git stash`, `git add -A`, `git add .`, `git commit --no-verify`.

Se ocorrerem conflitos de rebase:

- Resolva os conflitos apenas nos arquivos que você modificou.
- Se um conflito estiver num arquivo que você não modificou, aborte e pergunte ao usuário.
- Nunca faça force push.

## Issues e PRs

Veja o `CONTRIBUTING.md` para o controle de contribuição (workflows de auto-close, `lgtm`/`lgtmi`, nível de qualidade).

Ao revisar PRs:

- Não execute `gh pr checkout`, `git switch`, ou de outra forma mova a worktree para a branch do PR a menos que o usuário peça explicitamente.
- Use `gh pr view`, `gh pr diff`, `gh api` e localmente `git show`/`git diff` usando referências (refs) já buscadas (fetched) para inspecionar os metadados do PR, commits e patches sem alterar as branches.
- Se você precisar do conteúdo dos arquivos do PR, busque-os (fetch) e os leia em arquivos temporários ou use `git show <ref>:<path>` sem alternar as branches.

Ao criar issues:

- Adicione labels `pkg:*` para pacotes afetados (`pkg:agent`, `pkg:ai`, `pkg:coding-agent`, `pkg:tui`); use todos que se aplicarem.

Ao postar comentários em issue/PR:

- Escreva o comentário num arquivo temporário e poste com `gh issue/pr comment --body-file` (nunca markdown de várias linhas via `--body`).
- Mantenha os comentários concisos, técnicos, no tom do usuário.
- Finalize cada comentário postado pela IA com a linha de aviso gerada pela IA especificada pelo prompt de origem (ex. `Este comentário foi gerado pela IA pelo /wr`).

Ao fechar issues através de um commit:

- Inclua `fixes #<number>` ou `closes #<number>` na mensagem para que o merge feche automaticamente a issue. Para múltiplas issues, repita a palavra-chave por issue (`closes #1, closes #2`); uma palavra-chave compartilhada (`closes #1, #2`) fecha apenas a primeira.

## Testando o Modo Interativo do 3pi com tmux

Para testar o modo interativo do 3pi, carregue e siga [.3pi/skills/interactive-testing.md](.3pi/skills/interactive-testing.md).

## Changelog

Localização: `packages/*/CHANGELOG.md` (um por pacote).

Seções sob `## [Unreleased]`: `### Breaking Changes` (mudanças na API que requerem migração), `### Added`, `### Changed`, `### Fixed`, `### Removed`.

Regras:

- Todas as novas entradas ficam sob `## [Unreleased]`. Leia a seção completa primeiro e adicione no final das subseções existentes; nunca as duplique.
- As seções de versão lançada (release) (ex: `## [0.12.2]`) são imutáveis; nunca as modifique.
- Não crie entradas de changelog ao trabalhar em uma branch diferente da `main` ou de um pull request.

Atribuição:

- Internas (de issues): `Fixed foo bar ([#123](https://github.com/earendil-works/3pi/issues/123))`
- Contribuições externas: `Added feature X ([#456](https://github.com/earendil-works/3pi/pull/456) por [@username](https://github.com/username))`

## Releasing

Para a preparação da release, publicação, verificação ou recuperação, carregue e siga [.3pi/skills/release.md](.3pi/skills/release.md).

## Sobrescrita (Override) do Usuário

Se as instruções do usuário entrarem em conflito com alguma regra neste documento, peça a confirmação explícita antes de sobrescrevê-la (override). Apenas então execute as instruções do usuário.
