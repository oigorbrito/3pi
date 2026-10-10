# `@earendil-works/3pi-example-plugin`

Este pacote fornece as facetas de Chord convencionais `session` e `tui`. A faceta Session-worker fornece um serviço de saudação remoto. A faceta TUI contribui com `/hello` e chama esse serviço.

O pacote não requer um script de build. O Pi solicita ao Chord a descoberta de `src/session.ts` e `src/tui.ts`, compila ambas as entradas no cache de plugins de propriedade do servidor, e envia o artefato TUI aos clientes.

A partir da raiz do repositório:

```bash
PI_EXPERIMENTAL=1 ./pi-test.sh server \
  -e "$PWD/packages/coding-agent/examples/plugins/pi-example-plugin"
```

Alternativamente, um cliente pode selecionar o plugin para a Sessão que cria ou retoma em um servidor local:

```bash
PI_EXPERIMENTAL=1 ./pi-test.sh client \
  -e "$PWD/packages/coding-agent/examples/plugins/pi-example-plugin"
```

Repita o `-e` para selecionar vários pacotes de plugins. Os caminhos de clientes são resolvidos localmente e enviados apenas para um servidor Unix; clientes do Radius não podem selecionar caminhos no sistema de arquivos do servidor. A Sessão e as facetas TUI correspondentes são armazenadas com aquela Sessão, para que gerações de servidor posteriores e clientes possam retomá-la sem os argumentos de plugin. Outras Sessões e seus workers não são afetados. Uma Sessão ativa rejeita seleções de pacotes diferentes em vez de ser reiniciada.

`server -e` estabelece as facetas de Sessão e TUI padrão do perfil de servidor. Iniciar um servidor explícito no foreground sem o `-e` limpa o padrão. A seleção pelo cliente nunca altera a geração de faceta raiz do servidor.

Execute `/hello Armin` no TUI. Após editar uma faceta, execute `/reload`. O servidor reconstrói o pacote de forma atômica, recarrega a geração do Session-worker anexado, atualiza a geração atual do TUI e serve o novo artefato para futuros clientes.

Os metadados do pacote podem sobrescrever ou desativar as entradas convencionais:

```json
{
  "chord": {
    "facets": {
      "session": "./src/worker.ts",
      "tui": false
    }
  }
}
```
