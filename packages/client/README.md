# @earendil-works/3pi-client

Cliente agnóstico em relação ao transporte para o protocolo de serviço experimental Pi.

```ts
import { Client, type ByteTransportFactory } from "@earendil-works/3pi-client";

const transportFactory: ByteTransportFactory = async (handlers) => {
  // Connect using WebSocket, Unix socket, or another ordered byte transport.
  return {
    async send(chunk) {
      // Deliver bytes in invocation order and honor backpressure.
    },
    close() {},
  };
};

const client = await Client.connect({
  serverId: "01234567-89ab-4def-8123-456789abcdef",
  transportFactory,
});
const result = await client.request(
  { serverId: client.hello.serverId },
  { serviceId: "example.service", member: "read", args: [] },
);
```

O cliente verifica se o endpoint físico relata o `serverId` lógico esperado. As requisições (requests) de todo o servidor carregam esse ID, e cada requisição Session carrega o target ativo completo `{ serverId, sessionId, attachmentId }`. O endereço durável combinado evita erros de roteamento cross-server ou cross-session; o attachment ID gerado pelo servidor rejeita frames atrasados após alternância ou re-anexação (reattaching).

As APIs tipadas de servidor e Session são fornecidas por bindings de serviço do Chord pertencentes ao aplicativo. `createClientServiceTransport()` adapta uma rota de servidor ou Session resolvida de forma preguiçosa (lazily resolved) para um transporte Chord; `request()` e `subscribeService()` continuam sendo seus primitivos de baixo nível. O cliente usa os parsers de controle de serviço do Chord e o decodificador de estado por assinatura; `pi-protocol` valida apenas o envelope roteado e o limite de JSON estrito. Uma assinatura de serviço retorna um snapshot (instantâneo) completo do provider (provedor); o binding o instala e então chama `start()` para liberar atualizações em buffer durante a hidratação. O `Client` aplica alterações de attachment fora de banda (out-of-band) ordenadas, mas deliberadamente não constrói proxies de serviço tipados nem interpreta os contratos da aplicação.

As APIs de observação do aplicativo, como o `Transcript` do coding agent (agente de codificação), são serviços Chord comuns. O cliente não interpreta seus snapshots (instantâneos) ou atualizações.

Na desconexão ou no descarte (disposal), as requisições (requests) pendentes rejeitam localmente, mas o trabalho aceito ainda pode ser concluído remotamente antes que o attachment (anexo) seja liberado. O cliente limpa sua rota de attachment ativa. Ele nunca se reconecta ou repete as requisições (requests) automaticamente. Após a desconexão, chame `reconnect()`, anexe por meio do serviço de gerenciamento do aplicativo novamente e repita explicitamente apenas as operações conhecidas como seguras.

O coordenador local experimental apenas fornece um endpoint estável e retransmite (relays) o tráfego. Os processos de servidor substituíveis controlam o ciclo de vida da Session e do worker fora do protocolo cliente público.

Chame os manipuladores de transporte da seguinte forma:

- `handlers.onData(chunk)` para bytes de entrada;
- `handlers.onClose()` para um fechamento terminal ordenado;
- `handlers.onError(error)` para falhas de transporte.

Uma fábrica de transportes (transport factory) cria uma nova conexão autenticada para cada tentativa. As requisições são correlacionadas por ID e as falhas do servidor são expostas como `ServerError`.

## Sockets de domínio Unix (Unix-domain sockets)

Os consumidores de Node.js e Bun podem usar o transporte Unix separado:

```ts
import { Client } from "@earendil-works/3pi-client";
import { createUnixTransportFactory } from "@earendil-works/3pi-client/unix";

const client = new Client({
  serverId: "01234567-89ab-4def-8123-456789abcdef",
  transportFactory: createUnixTransportFactory({ path: "/tmp/pi.sock" }),
});
await client.connect();
```

O descobrimento (discovery) Unix examina um diretório de rota física (physical-route) explícito, obtém cada ID de servidor esperado a partir de seu nome de arquivo e os verifica através do handshake existente:

```ts
import { discoverUnixServers } from "@earendil-works/3pi-client/unix";

const routes = await discoverUnixServers({ directory: "/run/user/1000/pi" });
// [{ serverId: "...", path: "/run/user/1000/pi/<serverId>.sock" }]
```

Entradas malformadas, não-sockets, endpoints desatualizados ou não responsivos e incompatibilidades de servidor ID (server-ID mismatches) são ignoradas. O discovery é apenas leitura e sonda no máximo 16 sockets concorrentemente. Erros inesperados de filesystem e socket rejeitam a descoberta (discovery). Passe `timeoutMs` para substituir o timeout (tempo limite) da sonda padrão.

`ClientOptions.maxFrameLength` limita (bounds) os payloads do protocolo. `maxPendingBytes` limita a saída na fila do transporte Unix. Configure limites compatíveis em ambos os peers.
