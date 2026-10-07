---
name: release
description: Preparar, publicar, verificar e recuperar releases do pi. Use para preparação de release, testes de fumaça (smoke tests) de release local, publicação e CI de release com falha ou anúncios.
---

# Lançando o pi (Release)

Execute os comandos do repositório a partir da raiz do repositório (dois diretórios acima desta skill), a menos que instruído de outra forma.

**Lockstep versioning**: todos os packages compartilham uma versão; toda release atualiza todos juntos. `patch` = correções + adições, `minor` = breaking changes. Sem releases major.

1. **Atualizar CHANGELOGs**: pergunte ao usuário se ele executou o prompt `/cl` no último commit na branch `main`. Caso contrário, ele deve executar `/cl` primeiro para auditar e atualizar a seção `[Unreleased]` de cada package antes de lançar a release.

2. **Teste de fumaça (smoke test) local**: compile uma release não publicada e faça o smoke test de fora do repositório (para que não consiga resolver arquivos do workspace):
   ```bash
   npm run release:local -- --out /tmp/pi-local-release --force
   cd /tmp

   # Testes de fumaça de instalação do package Node
   /tmp/pi-local-release/node/pi --help
   /tmp/pi-local-release/node/pi --version
   /tmp/pi-local-release/node/pi --list-models
   /tmp/pi-local-release/node/pi -p "Say exactly: ok"
   /tmp/pi-local-release/node/pi

   # Testes de fumaça do binário do Bun
   /tmp/pi-local-release/bun/pi --help
   /tmp/pi-local-release/bun/pi --version
   /tmp/pi-local-release/bun/pi --list-models
   /tmp/pi-local-release/bun/pi -p "Say exactly: ok"
   /tmp/pi-local-release/bun/pi
   ```
   Verifique a inicialização do Node e do Bun, listagem de model/conta, inicialização interativa e pelo menos um prompt real com o provedor padrão pretendido. Os comandos isolados `/tmp/pi-local-release/node/pi` e `/tmp/pi-local-release/bun/pi` iniciam o modo interativo; execute cada um no tmux, envie um prompt e aguarde a resposta do model antes de considerar o smoke test interativo como aprovado. Falhas são bloqueadores de release, a menos que o usuário aceite explicitamente o risco.

   Carregue e siga [interactive-testing.md](interactive-testing.md) para o fluxo de trabalho do tmux. Inicie cada binário de release de `/tmp`, não da raiz do repositório.

3. **Executar o script de release**:
   ```bash
   PI_ALLOW_LOCKFILE_CHANGE=1 npm_config_min_release_age=0 npm run release:patch    # correções + adições
   PI_ALLOW_LOCKFILE_CHANGE=1 npm_config_min_release_age=0 npm run release:minor    # breaking changes
   ```
   Use `npm_config_min_release_age=0` apenas para o comando de release. A restrição de idade (age gate) normal do npm do repositório pode bloquear a atualização do lockfile da release quando a versão do package atual do workspace foi publicada recentemente. Revise qualquer lockfile ou diffs de bloqueio de instalação que a release cria antes de fazer push.

   O script de release atualiza a fixação (pin) do catálogo de models do Nix (`nix/model-catalog.json`) se estiver obsoleto, aumenta (bump) todas as versões dos packages, atualiza os changelogs, regenera os artefatos de release, executa `npm run check`, faz commit de `Release vX.Y.Z`, cria a tag `vX.Y.Z`, adiciona novas seções de changelog `## [Unreleased]`, faz commit de `Add [Unreleased] section for next cycle`, então faz push da `main` e da tag. Não execute novamente o script de release após uma tag ter sido enviada via push.

4. **A CI verifica e anuncia a release no npm**: o push da tag `vX.Y.Z` aciona `.github/workflows/build-binaries.yml`. O job `publish-npm` usa a publicação confiável do npm através do GitHub Actions OIDC com o ambiente `npm-publish`; não é necessário nenhum fluxo de `npm publish`, `npm whoami`, OTP ou WebAuthn local. Após a publicação, `announce-pi-dev-release` verifica se todo package público do workspace resolve na versão exata da release e se seu tarball do npm está disponível, então escreve o marcador de release verificada no R2. `pi.dev/api/latest-version` lê esse marcador; ele nunca deve anunciar uma release do npm antes de este job ser concluído com sucesso.

5. **A CI compila a release do Nix**: o push da tag também aciona `.github/workflows/nix.yml`, que compila o flake com tag no Linux e no macOS e, em seguida, faz um fast-forward na branch `stable` para o commit da release. `nix run github:earendil-works/pi/stable` executa a versão mais recente. Se a build do Nix falhar, a branch `stable` permanece na release anterior; a tag não pode ser corrigida, então corrija a `main` e lance a correção na próxima release.

6. **Se a publicação ou o anúncio da CI falhar**: inspecione o job que falhou. O ajudante de publicação é idempotente e pula as versões de package já presentes no npm; o job de anúncio verifica a disponibilidade novamente antes de atualizar o marcador do R2. Execute novamente o job ou workflow que falhou após corrigir o CI ou problemas transitórios do npm. Não execute novamente `npm run release:patch` ou `npm run release:minor` para a mesma versão.
