# Executar o Pi em um ambiente isolado

Use um ambiente isolado para limitar os arquivos, credenciais, processos e serviços de rede que os comandos gerados podem acessar ou afetar.

Você pode isolar o processo completo do Pi ou manter o Pi no host e rotear as ferramentas (tools) selecionadas para um ambiente isolado.

## Escolha um método de isolamento

| Método | Onde o Pi roda | O que é isolado | Tratamento de credenciais | Melhor para |
|---|---|---|---|---|
| Plain Docker | Contêiner | Pi, ferramentas embutidas (built-in), comandos `!` e extensões | Credenciais passadas para o contêiner | Um limite de contêiner local simples |
| Docker Sandboxes | Sandbox gerenciada | Pi, ferramentas embutidas, comandos `!` e extensões | As credenciais do provedor permanecem no host e são substituídas pelo proxy | Isolamento local gerenciado sem expor a chave real do provedor |
| OpenShell | Sandbox local ou remota | Pi, ferramentas embutidas, comandos `!` e extensões | Credenciais e roteamento de inferência controlados por política | Políticas de sistema de arquivos, processos, rede e credenciais |
| Extensão Gondolin | Host | Ferramentas embutidas e comandos `!` | As credenciais armazenadas do Pi permanecem no host, mas os comandos herdam variáveis de ambiente do host | Uma micro-VM local para execução de ferramentas mantendo a interface do host |

O método muda onde as extensões são executadas. Quando o processo completo do Pi roda dentro de um ambiente isolado, suas extensões também rodam lá. Quando o Pi do host delega ferramentas embutidas através do Gondolin, outras ferramentas de extensão ainda rodam no host a menos que também deleguem seu trabalho.

## Decida o que o Pi pode acessar

Um processo isolado ainda pode afetar recursos que você expõe a ele:

- Uma montagem de host de leitura e gravação permite que o Pi modifique esses arquivos do host.
- Montar `~/.3pi/agent` expõe suas credenciais, configurações, extensões e sessões do Pi.
- Variáveis de ambiente passadas para um contêiner ficam disponíveis para processos dentro dele.
- O acesso à rede pode permitir que código ou saída de ferramentas saia do ambiente.
- Isolamento apenas de ferramenta não restringe o processo do Pi no host ou as ferramentas de extensão que não usam o backend isolado.

Exponha apenas a pasta de trabalho, as credenciais e os destinos de rede necessários para a tarefa. Use montagens somente leitura ou copie os arquivos para dentro e fora do ambiente quando não quiser que gravações afetem o host.

## Executar o Pi no Plain Docker

O Plain Docker fornece o limite de contêiner de processo inteiro mais simples.

### Crie a imagem (Build)

Crie o `Dockerfile.3pi`:

```dockerfile
FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates git ripgrep \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g --ignore-scripts @earendil-works/3pi-coding-agent

WORKDIR /workspace
ENTRYPOINT ["pi"]
```

Faça o build do diretório contendo o arquivo:

```bash
docker build -t pi-sandbox -f Dockerfile.pi .
```

### Inicie o Pi

Na pasta de trabalho que você deseja que o Pi acesse, execute:

```bash
docker run --rm -it \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  -v pi-agent-home:/root/.3pi/agent \
  pi-sandbox
```

Substitua `ANTHROPIC_API_KEY` pela credencial requerida pelo seu provedor. O volume nomeado `pi-agent-home` mantém as configurações, credenciais e sessões locais do contêiner entre as execuções.

Não monte o diretório `~/.3pi/agent` do host a menos que o contêiner precise ter acesso à sua configuração e credenciais do Pi do host.

### Verifique o workspace

Dentro do Pi, execute:

```text
!pwd
```

O comando deve reportar `/workspace`. As alterações em `/workspace` são gravadas na pasta do host montada. Remova a montagem de vínculo (bind mount) ou use uma montagem somente leitura quando isso não for aceitável.

## Executar o Pi com Docker Sandboxes

O [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) roda o processo completo do Pi dentro de uma sandbox gerenciada. Seu proxy pode manter a credencial real do provedor no host e substituí-la quando as requisições saem da sandbox.

Configure as credenciais antes de criar a sandbox. Não execute `/login` dentro da sandbox porque isso escreve uma credencial real dentro dela.

### Use um token Claude Pro ou Max

Gere o token com `claude setup-token` em uma máquina com Claude Code. Se um secret `anthropic` já estiver configurado, remova-o primeiro para que o proxy não adicione um cabeçalho API-key juntamente com o bearer token:

```bash
sbx secret rm anthropic

sbx secret set-custom \
  --host api.anthropic.com \
  --env ANTHROPIC_OAUTH_TOKEN \
  --placeholder 'sk-ant-oat01-{rand}'
```

`sbx secret set-custom` lê o token real da entrada padrão. A sandbox recebe um espaço reservado (placeholder) no formato OAuth, que o proxy substitui apenas para requisições ao host configurado.

Para uma API key da Anthropic, use `sbx secret set anthropic` em vez disso.

### Inicie o Pi

Execute isso na pasta de trabalho que você deseja montar:

```bash
sbx run --kit "docker.io/sbx/pi-kit:latest" pi
```

Para uma sandbox existente, execute o Pi de forma não interativa com:

```bash
sbx exec <sandbox-name> -- pi -p "list the failing tests"
```

Veja a [documentação do kit do Pi](https://github.com/docker/sbx-kits-contrib/tree/main/pi) para outros provedores, solução de problemas e fixação de imagem (image pinning).

## Executar o Pi com OpenShell

O [NVIDIA OpenShell](https://docs.nvidia.com/openshell/about/overview) fornece sandboxes locais ou remotas com políticas de sistema de arquivos, processos, rede, credenciais e inferência.

### Selecione um gateway

Toda sandbox requer um gateway ativo:

```bash
openshell gateway add <gateway-url> --name <name>
openshell gateway select <name>
```

### Crie a sandbox

```bash
openshell sandbox create --name pi-sandbox --from pi -- pi
```

O Pi, suas ferramentas embutidas, comandos `!` e ferramentas de extensão rodam dentro do limite do OpenShell.

### Transfira arquivos para uma sandbox remota

Um gateway remoto não faz bind-mount da sua pasta de trabalho do host. Clone o repositório dentro da sandbox ou transfira os arquivos explicitamente:

```bash
openshell sandbox upload pi-sandbox ./working-folder /workspace
openshell sandbox download pi-sandbox /workspace/working-folder ./working-folder-out
```

O roteamento de inferência do OpenShell pode manter as credenciais do modelo brancas fora da sandbox. Quando configurado, aponte o Pi para o endpoint compatível com OpenAI ou compatível com Anthropic correspondente exposto pelo gateway.

## Roteie ferramentas através do Gondolin

O [Gondolin](https://github.com/earendil-works/gondolin) é uma micro-VM Linux local. Seu exemplo de extensão mantém o processo do Pi e as credenciais do provedor baseadas em arquivos no host, enquanto roteia as ferramentas embutidas e comandos de usuário `!` para dentro da VM.

Comandos dentro da VM herdam o ambiente de processo do host. As chaves do provedor fornecidas por meio de variáveis de ambiente podem, portanto, ficar visíveis dentro da VM. Não use esse padrão como um limite de credencial a menos que você remova as variáveis confidenciais ou altere o manuseio do ambiente da extensão.

O Gondolin requer Node.js 23.6 ou mais recente e o QEMU instalado através do gerenciador de pacotes do seu sistema operacional.

### Instale a extensão

De um checkout do código-fonte do Pi:

```bash
mkdir -p ~/.3pi/agent/extensions
cp -R packages/coding-agent/examples/extensions/gondolin ~/.3pi/agent/extensions/gondolin
cd ~/.3pi/agent/extensions/gondolin
npm install --ignore-scripts
```

### Inicie o Pi

Execute o Pi da pasta de trabalho que você deseja montar:

```bash
cd /path/to/working-folder
pi -e ~/.3pi/agent/extensions/gondolin
```

A extensão monta a pasta de trabalho do host em `/workspace` na VM e sobrescreve `read`, `write`, `edit`, `bash`, `grep`, `find` e `ls`. Alterações de arquivo em `/workspace` são gravadas no host.

Outras ferramentas de extensão ainda rodam no host a menos que deleguem explicitamente suas operações. Revise o [exemplo do Gondolin](../examples/extensions/gondolin/) antes de adicionar ferramentas que podem contornar o limite da VM.
