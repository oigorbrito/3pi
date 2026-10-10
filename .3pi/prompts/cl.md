---
description: Auditar entradas do changelog antes da release
---
Audite as entradas do changelog para todos os commits desde a última release.

## Processo

1. **Encontre a última tag de release:**
   ```bash
   git tag --sort=-version:refname | head -1
   ```

2. **Liste todos os commits desde essa tag:**
   ```bash
   git log <tag>..HEAD --oneline
   ```

3. **Leia a seção [Unreleased] de cada package:**
   - packages/ai/CHANGELOG.md
   - packages/tui/CHANGELOG.md
   - packages/coding-agent/CHANGELOG.md

4. **Para cada commit, verifique:**
   - Pular: atualizações de changelog, alterações apenas de docs, tarefas de manutenção (housekeeping) de release
   - Pular: alterações em catálogos gerados de model (por exemplo `packages/ai/src/models.generated.ts`) a menos que acompanhadas de uma alteração intencional voltada para o produto em código/docs não gerados.
   - Determine qual package ou packages o commit afeta (use `git show <hash> --stat`)
   - Verifique se existe uma entrada no changelog no(s) package(s) afetado(s)
   - Para contribuições externas (PRs), verifique o formato: `Description ([#N](url) by [@user](url))`

5. **Regra de duplicação entre packages:**
   Alterações em `ai`, `agent` ou `tui` que afetam usuários finais devem ser duplicadas para o changelog do `coding-agent`, já que o coding-agent é o package voltado para o usuário que depende deles.

6. **Adicionar seção New Features após as correções no changelog:**
   - Insira uma seção `### New Features` no início de `## [Unreleased]` em `packages/coding-agent/CHANGELOG.md`.
   - Proponha os principais novos features ao usuário para confirmação antes de escrevê-los.
   - Faça links para docs relevantes e seções sempre que possível.

7. **Relatório:**
   - Liste os commits com entradas ausentes
   - Liste as entradas que precisam de duplicação entre packages
   - Adicione quaisquer entradas ausentes diretamente

## Referência de Formato do Changelog

Seções (em ordem):
- `### Breaking Changes` - Alterações de API exigindo migração
- `### Added` - Novos features
- `### Changed` - Alterações em funcionalidades existentes
- `### Fixed` - Correções de bug
- `### Removed` - Features removidos

Atribuição:
- Interna: `Fixed foo ([#123](https://github.com/earendil-works/pi/issues/123))`
- Externa: `Added bar ([#456](https://github.com/earendil-works/pi/pull/456) by [@user](https://github.com/user))`
