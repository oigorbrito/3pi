<p align="center">
  <a href="https://3Pi.dev">
    <img alt="3Pi logo" src="https://3Pi.dev/logo-auto.svg" width="128">
  </a>
</p>
<p align="center">
  <a href="https://discord.com/invite/3cU7Bz4UPx"><img alt="Discord" src="https://img.shields.io/badge/discord-community-5865F2?style=flat-square&logo=discord&logoColor=white" /></a>
  <a href="https://www.npmjs.com/package/@earendil-works/3Pi-coding-agent"><img alt="npm" src="https://img.shields.io/npm/v/@earendil-works/3Pi-coding-agent?style=flat-square" /></a>
</p>

> Novas issues e PRs de novos contribuidores são fechadas automaticamente por padrão. Os mantenedores revisam as issues fechadas automaticamente diariamente. Veja [CONTRIBUTING.md](CONTRIBUTING.md).

# 3Pi

3Pi é um harness de agente extensível e minimalista que você pode customizar como preferir.

Adapte o 3Pi aos seus workflows, não o contrário. Customize o 3Pi com [extensions](packages/coding-agent/docs/extensions.md), [skills](packages/coding-agent/docs/skills.md), [prompt templates](packages/coding-agent/docs/prompt-templates.md) e [themes](packages/coding-agent/docs/themes.md). Empacote-os como [3Pi packages](packages/coding-agent/docs/packages.md) e compartilhe via npm ou git.

O 3Pi vem com configurações padrão poderosas, mas ignora recursos como sub-agents e modo plan. Peça ao 3Pi para construir o que você deseja ou instale um pacote que faça as coisas do seu jeito.

Use o 3Pi [interativamente](packages/coding-agent/docs/usage.md), automatize-o no [modo print ou JSON](packages/coding-agent/docs/cli.md), controle-o via [RPC](packages/coding-agent/docs/rpc.md) ou crie aplicativos com o [3Pi TypeScript SDK](packages/coding-agent/docs/sdk.md). Veja o [OpenClaw](https://github.com/OpenClaw/OpenClaw) para uma integração no mundo real.

## Começando

Instale a interface de linha de comando (CLI):

```bash
curl -fsSL https://3Pi.dev/install.sh | sh
```

No Windows:

```shell
powershell -c "irm https://3Pi.dev/install.ps1 | iex"
```

O instalador fixa (pins) todas as dependências e atualiza o 3Pi com `3Pi update`. Alternativamente, instale diretamente com npm, que não fixa as dependências transitivas:

```bash
npm install -g --ignore-scripts @earendil-works/3Pi-coding-agent
```

O 3Pi requer Node.js 22.19 ou mais recente. Os instaladores do macOS, Linux e Windows podem instalá-lo se necessário. O 3Pi não requer scripts de ciclo de vida (lifecycle scripts) de dependência para uma instalação normal do npm.

Inicie o 3Pi no diretório onde você quer que ele trabalhe:

```bash
cd /path/to/project
3Pi
```

Para um provedor de AI integrado, rode `/login` dentro do 3Pi para conectar uma assinatura ou API key. Então dê uma tarefa ao 3Pi.

Veja a [documentação](https://3Pi.dev/docs/latest) para instruções completas de configuração e uso, ou [visite 3Pi.dev](https://3Pi.dev) para demos.

## Rodando com Nix

```bash
nix run github:earendil-works/3Pi/stable
```

`stable` aponta para a release mais recente. Instale-a com `nix profile add github:earendil-works/3Pi/stable` e atualize com `nix profile upgrade 3Pi`. Use uma release tag como `github:earendil-works/3Pi/v1.0.0` para fixar (pin) uma versão, ou `github:earendil-works/3Pi` para mudanças não publicadas na branch `main`. O Nix faz o build do 3Pi a partir do código fonte.

Suporta ARM64 e x86-64 no Linux e macOS. Use `nix build .` ou `nix run .` para compilar ou rodar o seu checkout.

Os builds do Nix são offline, então os dados do modelo embutido vêm de uma revisão do catálogo de modelos do 3Pi.dev fixada em `nix/model-catalog.json`. Em tempo de execução (runtime), o 3Pi ainda sobrepõe dados de catálogo mais recentes do 3Pi.dev como de costume. O fluxo de trabalho do Nix substitui a fixação na branch `main` quando ela não corresponde mais ao checkout, por exemplo, depois que um provedor é adicionado ou ganha um novo tipo de modelo. Para atualizá-lo manualmente:

```bash
npm run update:model-catalog-pin
```

## Pacotes

Este monorepo contém a CLI do 3Pi e suas bibliotecas de suporte.

| Package | Description |
|---------|-------------|
| **[@earendil-works/chord](packages/chord)** | Runtime de composição de aplicativos autônomo para serviços, estado replicado, RPC e plugins |
| **[@earendil-works/3Pi-telemetry](packages/telemetry)** | Contratos de telemetria neutros em relação ao fornecedor, adaptador de referência, testes de conformidade e schemas tipados |
| **[@earendil-works/3Pi-ai](packages/ai)** | API de LLM unificada para múltiplos provedores (OpenAI, Anthropic, Google, etc.) |
| **[@earendil-works/3Pi-durable](packages/durable)** | Runtime de conversação, task e documento durável |
| **[@earendil-works/3Pi-agent-core](packages/agent)** | Agent runtime com chamadas de ferramentas e gerenciamento de estado |
| **[@earendil-works/3Pi-coding-agent](packages/coding-agent)** | CLI interativa do agente de código (coding agent) |
| **[@earendil-works/3Pi-tui](packages/tui)** | Biblioteca de interface de terminal (TUI) com renderização diferencial |

Para automação do Slack/chat e workflows veja [earendil-works/3Pi-chat](https://github.com/earendil-works/3Pi-chat).

## Permissões e Containerização

O 3Pi não inclui um sistema de permissão integrado para restringir o acesso ao sistema de arquivos (filesystem), processos, rede ou credenciais. Por padrão, ele é executado com as permissões do usuário e do processo que o iniciou.

Se você precisa de limites mais fortes, coloque o 3Pi em um container ou sandbox. Veja [packages/coding-agent/docs/containerization.md](packages/coding-agent/docs/containerization.md) para três padrões:

- **Gondolin extension**: mantenha o `3Pi` e a autenticação do provedor no host enquanto roteia as ferramentas integradas e comandos `!` em uma micro-VM Linux local.
- **Docker simples**: rode o processo `3Pi` inteiro em um container local para isolamento simples.
- **OpenShell**: rode o processo `3Pi` inteiro em um sandbox controlado por políticas.

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes de contribuição e [AGENTS.md](AGENTS.md) para regras específicas do projeto (tanto para humanos quanto para agentes). Planos de longo prazo para o 3Pi também podem ser encontrados em [RFCs](https://rfc.earendil.com/keyword/3Pi/).

## Desenvolvimento

```bash
npm install --ignore-scripts  # Instala todas as dependências sem executar scripts de ciclo de vida
npm run build         # Atualiza os dados do modelo e, em seguida, compila todos os pacotes
npm run build:offline # Recompila usando dados de modelo existentes sem acesso à rede
npm run check         # Executa lint, format e verificação de tipo (type check)
./test.sh            # Roda os testes (ignora testes dependentes de LLM sem API keys)
./3Pi-test.sh         # Roda o 3Pi a partir das fontes (pode ser executado a partir de qualquer diretório)
```

### Usando pacotes locais fora do monorepo

Compile (build) todos os pacotes públicos em um único conjunto coerente de artefatos locais:

```bash
npm run pack:packages -- --out .artifacts/3Pi-packages
```

Isso atualiza os dados do modelo antes de compilar o `3Pi-ai`. Para evitar o acesso à rede quando os dados do modelo já estiverem hidratados, passe `--offline-model-data`.

Em seguida, configure um projeto externo para consumir um pacote e resolver todas as suas dependências do 3Pi a partir do mesmo conjunto de artefatos. npm é o padrão:

```bash
node scripts/use-local-packages.mjs \
  --manifest .artifacts/3Pi-packages/manifest.json \
  --consumer ../my-project \
  --package @earendil-works/3Pi-durable \
  --package @earendil-works/3Pi-agent-core
cd ../my-project
npm install --ignore-scripts
```

Para um projeto pnpm, aponte `--consumer` para a raiz do workspace:

```bash
node scripts/use-local-packages.mjs \
  --manifest .artifacts/3Pi-packages/manifest.json \
  --consumer ../my-project \
  --package @earendil-works/3Pi-agent-core \
  --package-manager pnpm
cd ../my-project
pnpm install --ignore-scripts
```

Repita `--package` para cada dependência direta. O comando atualiza o `package.json` do consumidor com referências `file:` locais baseadas em conteúdo. Ele escreve sobrescritas (overrides) transitivas no `package.json` para o npm ou `pnpm-workspace.yaml` para o pnpm. Mantenha o diretório do artefato disponível ao instalar ou atualizar o consumidor. Execute ambos os comandos novamente após alterar o código fonte do 3Pi.

## Construindo binários autônomos (standalone) a partir do código fonte da release

As releases do GitHub incluem um arquivo de código fonte versionado coberto pelo arquivo `SHA256SUMS` da release. Extraia-o e execute o mesmo script de build usado para os binários autônomos oficiais:

```bash
VERSION="<release-version>"
tar -xzf "3Pi-${VERSION}-source.tar.gz"
cd "3Pi-${VERSION}"
./scripts/build-binaries.sh --offline-model-data --platform linux-x64 --out "$PWD/out"
```

O arquivo inclui os dados do modelo da release e pré-compilações (prebuilds) nativas. `--offline-model-data` usa esses dados do modelo sem atualizar os catálogos dos provedores. O script instala as dependências e compila o executável com seus ativos em runtime; passe `--skip-install` se as dependências já foram fornecidas.

## Fortalecimento (hardening) da cadeia de suprimentos

Nós tratamos as alterações de dependência do npm como alterações de código revisadas.

- As dependências externas diretas são fixadas em versões exatas. Os pacotes internos do workspace permanecem com intervalos de versão.
- `.npmrc` define `save-exact=true` e `min-release-age=2` para evitar releases de dependência no mesmo dia durante a resolução do npm.
- O `package-lock.json` é a fonte da verdade para dependências. O pré-commit (pre-commit) bloqueia commits acidentais do lockfile a menos que `PI_ALLOW_LOCKFILE_CHANGE=1` esteja configurado.
- `npm run check` verifica as dependências diretas fixadas, compatibilidade de importação nativa do TypeScript, e o lock de instalação do coding-agent gerado.
- O instalador do 3Pi.dev instala a partir de `packages/coding-agent/install-lock/`, gerado do lockfile raiz, para fixar (pin) dependências transitivas. O pacote npm não fixa as dependências transitivas.
- Testes locais rápidos (smoke tests) de release e publicação npm usam o mesmo empacotador de tarball; o npm publica os tarballs validados em vez de reempacotar diretórios do workspace.
- Instalações locais de release, instalações documentadas do npm, e `3Pi update --self` usam `--ignore-scripts` onde for suportado.
- O CI instala com `npm ci --ignore-scripts`, e um workflow agendado no GitHub roda `npm audit --omit=dev` mais `npm audit signatures --omit=dev`.
- A geração de lock de instalação tem uma lista de permissão (allowlist) explícita para scripts de ciclo de vida de dependência; novas dependências com scripts de ciclo de vida falharão nas verificações até serem revisadas.

## Compartilhe as sessões do seu coding agent de código aberto (OSS)

Se você usar o 3Pi ou outros coding agents para trabalho de código aberto, por favor compartilhe as suas sessões.

Dados públicos de sessão OSS ajudam a melhorar os coding agents com tarefas do mundo real, uso de ferramentas, falhas e correções em vez de benchmarks simples (toy).

Para a explicação completa, veja [este post no X](https://x.com/badlogicgames/status/2037811643774652911).

Para publicar sessões, use [`badlogic/3Pi-share-hf`](https://github.com/badlogic/3Pi-share-hf). Leia o seu README.md para instruções de configuração. Tudo o que você precisa é uma conta no Hugging Face, o CLI do Hugging Face e o `3Pi-share-hf`.

Você também pode assistir a [este vídeo](https://x.com/badlogicgames/status/2041151967695634619), onde mostro como publico minhas sessões do `3Pi-mono`.

Eu publico regularmente as minhas próprias sessões de trabalho do `3Pi-mono` aqui:

- [badlogicgames/3Pi-mono no Hugging Face](https://huggingface.co/datasets/badlogicgames/3Pi-mono)

## Licença

MIT

<p align="center">
  O domínio <a href="https://3Pi.dev">3Pi.dev</a> foi graciosamente doado por
  <br /><br />
  <a href="https://exe.dev"><img src="packages/coding-agent/docs/images/exy.png" alt="Mascote Exy" width="48" /><br />exe.dev</a>
</p>
