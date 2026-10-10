# Executar o Pi no Android com Termux

O Pi é executado no Android através do [Termux](https://termux.dev/), um emulador de terminal e ambiente Linux. Entrada de texto, ferramentas de arquivo e comandos de shell são suportados. O Pi pode copiar e colar texto através da área de transferência (clipboard) do Android com o Termux:API. Colar imagem do clipboard não é suportado.

## Antes de começar

Instale o Termux a partir do [GitHub ou F-Droid](https://github.com/termux/termux-app#installation). Não use a versão obsoleta da Google Play.

O [Termux:API](https://github.com/termux/termux-api#installation) é opcional. Instale-o apenas quando quiser que o Pi copie ou cole o texto do clipboard do Android, ou quando os comandos de shell precisarem das APIs do dispositivo Android.

## Instalar o Pi

1. Atualize os pacotes do Termux:

   ```bash
   pkg update && pkg upgrade
   ```

2. Instale o Node.js e o Git:

   ```bash
   pkg install nodejs git
   ```

3. Instale o Pi:

   ```bash
   npm install -g --ignore-scripts @earendil-works/3pi-coding-agent
   ```

4. Verifique a instalação:

   ```bash
   pi --version
   ```

5. Abra a pasta em que você quer trabalhar e inicie o Pi:

   ```bash
   cd /path/to/working-folder
   pi
   ```

Continue com o [Quickstart](quickstart.md#3-choose-a-model) principal para conectar um model e executar sua primeira tarefa.

## Acessar o armazenamento compartilhado do Android

O Termux não pode acessar o armazenamento compartilhado do Android até que você conceda permissão. Execute isto uma vez:

```bash
termux-setup-storage
```

Após a aprovação, o armazenamento compartilhado do Android fica disponível em `/storage/emulated/0` e através dos links que o Termux cria em `~/storage/`.

Apenas conceda esta permissão quando o Pi dever ser capaz de acessar esses arquivos. Comandos e ferramentas em execução no Termux usam as mesmas permissões de armazenamento que o processo do Termux.

## Usar comandos de clipboard

O Pi usa `termux-clipboard-set` para copiar texto e `termux-clipboard-get` para o seu atalho de colar do clipboard. Os comandos de shell podem usar ambos os comandos diretamente. Instale o aplicativo Termux:API e seu pacote de linha de comando:

```bash
pkg install termux-api
```

Verifique a integração:

```bash
printf 'Pi clipboard test' | termux-clipboard-set
termux-clipboard-get
```

O segundo comando deve imprimir `Pi clipboard test`.

A API de clipboard do Termux suporta apenas texto. O atalho de colar do clipboard do Pi insere esse texto no editor, mas não consegue anexar imagens do clipboard.

## Adicionar instruções específicas do Termux

O Pi detecta que está sendo executado no Termux, mas não consegue inferir como você deseja que ele interaja com o Android. Adicione apenas os detalhes do ambiente relevantes para o seu trabalho ao `~/.3pi/agent/AGENTS.md`:

````markdown
# Termux environment

- Pi runs in Termux on Android.
- Shared Android storage is under `/storage/emulated/0`.
- Open URLs with `termux-open-url "https://example.com"`.
- Open files with `termux-open <path>`.
- Do not access shared storage unless the task requires it.
````

Execute `/reload` após alterar o arquivo durante uma sessão ativa.

## Solução de problemas

### A integração de clipboard falha

Confirme que você instalou ambos os componentes:

1. O aplicativo Android Termux:API a partir da mesma fonte que o Termux
2. O pacote de linha de comando `termux-api`

Em seguida, execute os comandos de verificação de clipboard acima fora do Pi. Se eles falharem lá, corrija a instalação do Termux:API antes de tentar novamente o comando de cópia do Pi.

### O armazenamento compartilhado relata permissão negada

Execute `termux-setup-storage`, aprove a solicitação de permissão do Android e tente novamente o caminho em `~/storage/` ou `/storage/emulated/0`.

### O Pi não é encontrado após a instalação

Abra um novo shell do Termux e execute:

```bash
npm prefix -g
command -v pi
```

Confirme que o diretório global de binários do npm está no `PATH`, então reinstale o Pi se o pacote estiver ausente.
