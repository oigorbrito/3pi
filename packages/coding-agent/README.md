<p align="center">
  <a href="https://pi.dev">
    <img alt="Pi logo" src="https://pi.dev/logo-auto.svg" width="128">
  </a>
</p>
<p align="center">
  <a href="https://discord.com/invite/3cU7Bz4UPx"><img alt="Discord" src="https://img.shields.io/badge/discord-community-5865F2?style=flat-square&logo=discord&logoColor=white" /></a>
  <a href="https://www.npmjs.com/package/@earendil-works/3pi-coding-agent"><img alt="npm" src="https://img.shields.io/npm/v/@earendil-works/3pi-coding-agent?style=flat-square&logo=npm&logoColor=white" /></a>
</p>

> Novas issues e PRs de novos contribuidores são fechadas automaticamente. Os mantenedores revisam envios fechados diariamente. Veja [CONTRIBUTING.md](https://github.com/earendil-works/pi/blob/main/CONTRIBUTING.md).

# Pi

O Pi é um agente (harness) mínimo e extensível, que você pode transformar no que desejar.

Adapte o Pi aos seus fluxos de trabalho (workflows), não o contrário. Personalize o Pi usando [extensions](docs/extensions.md), [skills](docs/skills.md), [prompt templates](docs/prompt-templates.md) e [themes](docs/themes.md). Empacote-os como pacotes para o Pi e faça o compartilhamento os publicando ou através do comando npm como pelo próprio modelo remoto de git.

Pi é disponibilizado e construído sobre fundações robustas na funcionalidade a padrão (defaults) do dia-a-dia embora deliberadamente abdique das subfunções inerentes em partes àquela versão complexa no trabalho do que subentende o fato em usar de ramificações do mesmo como um tipo de modalidade de plano (plan mode) de ramificações paralelas (sub-agents). Aproxime o Pi construindo as partes de que for em real demanda pro negócio ao passo do instale ou então baixe o pacote pronto para ter seu molde atuando onde convier.

Utilize interativamente o Pi através desse seu uso, na interface gráfica em uso, ou mesmo nos modos e esquemas como para gerar automatizações por saídas por impressão via código ou JSON. Empregue recursos disto em interfaces chamadas pelo protocolo próprio (RPC) bem com crie e consolide apps inteiros a partindo também deste kit próprio de TypeScript via uso.

## Começando (Getting started)

Instale a interface de linha de comando (cli):

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

No Windows:

```shell
powershell -c "irm https://pi.dev/install.ps1 | iex"
```

O instalador anexa (pin) todas as dependências e atualiza o Pi usando o script `pi update`. Alternativamente, você pode instalar a CLI diretamente, baixando pelo npm e a invocando ali a ignorar que seja de qualquer recurso a qual obrigue que as ramificações acoplem suas exigências para o próprio modelo transitivo (transitive dependencies) sem a premissa fundamental:

```bash
npm install -g --ignore-scripts @earendil-works/3pi-coding-agent
```

O Pi irá assim de fato pedir pelo Node.js em sua forma da sua build de 22.19, a caso contrário de fato, você tenha ele mais velhinho. Um detalhe, nestas três bases comuns do macOS, as instalações ali rodadas bem onde ele não esteja presente acabam o implementando em substituto ou mesmo por lá deixando à espera disso como via e assim atuar (Windows, macOS, Linux). 

Para distribuições Linux, nas bases também ligadas do MacOS, com aquele esquema de se atuar de Nix como uma das possibilidades para trazer as execuções instaladas ao nível estável: faça o download e já jogue na build ao mandar instalar do github de perfil do comando de execução estável na flag (stable) sendo `nix profile add github:earendil-works/pi/stable` no bash do ambiente do usuário. Em dúvida ou mesmo na intenção em atualizar, passe e observe esse detalhe por base na documentação [quickstart](docs/quickstart.md#1-install-pi).

Inicie o fluxo de seu terminal focando aquele lugar base do local:

```bash
cd /path/to/project
pi
```

Ao adotar alguma daquelas bases em inteligências das prementes (built-in AI provider) atue fazendo o input `/login` em execução deste próprio painel lá contido. Após ali isso ser fechado com seus repasses corretos ao login com assinatura validada ou chave (API key) para essa ação, basta repassar o trabalho. 

Acessar pela aba na via da documentação de (docs) fará que os fluxos corretos em vias normais [documentation](docs/index.md) sirvam de instrução completa a instrução em forma.

## Compartilhe as suas seções em bases duráveis (OSS) do seu coding agent.

Caso use e tenha os acessos pelo recurso focado nessa linha aberta, nós sempre pediremos por partilhar essas entradas pelo compartilhamento em publicações delas a seu bem querer nessas partes interligando OSS session.

Esse repasse faz do aprendizado as formas dos grandes usos que formam toda esta rede que alimenta os projetos, fluxos e que são avaliações das melhoras constantes de todas aquelas premissas. Tudo sendo feito na via dessa avaliação nas rotinas normais do dev. 

Se quiser uma melhor explicação, entre no portal lá da página oficial e clique [this post on X](https://x.com/badlogicgames/status/2037811643774652911).

Para efetivar em tornar visíveis as mesmas e assim criar seu escopo e poder publicar faça o seu roteamento via de [`badlogic/pi-share-hf`](https://github.com/badlogic/pi-share-hf) sob uma chave e também acessos aos sistemas do portal daquele do uso (Hugging Face) CLI para a execução que irá precisar dos mesmos recursos da conta (Hugging Face account).

- Aquele roteiro completo ao modo para sua condução prática está no video linkado logo à seguir em [Demo video](https://x.com/badlogicgames/status/2041151967695634619) contendo aquele resumo prático e como seguir publicando suas sessões por ele.
- Essas são sessões compartilhadas do projeto do Pi ali dispostas sob base: [`badlogicgames/pi-mono` on Hugging Face](https://huggingface.co/datasets/badlogicgames/pi-mono).

## Desenvolvimento (Development)

Clone as matrizes (repository) deste diretório de base da ferramenta, execute instalando aquilo o qual for inerente como uma dependência deste uso, depois por fim atue partindo sempre de onde essas vias correm na fonte e a execute diretamente com o chamado da build do source (source):

```bash
git clone https://github.com/earendil-works/pi
cd pi
npm install --ignore-scripts
./pi-test.sh
```

A base do teste local por script do Pi pelo chamado de bash a `pi-test.sh` se possibilita acioná-lo seja da aba de qual diretório for. Aquilo que diz em preservar e deixar contido num escopo sem mexer com outras partes dos seus recursos o faz ser uma saída com o respeito no terminal e à execução local na chamada (caller's working directory).

Antecedendo um passo com uma alteração via a chamada ou push pro repositório as requisições se obrigam às etapas em chamadas de análise: 

```bash
npm run check
./test.sh
```

É mais que obrigatório uma breve repassada de olho via [CONTRIBUTING.md](https://github.com/earendil-works/pi/blob/main/CONTRIBUTING.md) abrindo como guia de o por quê um PR for ter chegado até lá ou como vai seguir de volta ali aberto a issue ou um (pull request). Lá é que reside essa portaria ao tipo de entrada destas ditas contribuições as listagens mínimas para aquelas referidas checagens à obrigatoriedades da issue na forma certa e de qualidade (issue quality bar). Da mesma forma acople isto por também abrir as pautas do [AGENTS.md](https://github.com/earendil-works/pi/blob/main/AGENTS.md) sabendo da formatação ligada unicamente para esse uso no repositório ali exposto as regras pro projeto na atuação dos releases.

## Licença (License)

MIT
