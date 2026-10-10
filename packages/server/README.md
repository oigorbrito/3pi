# @earendil-works/3pi-server

Servidor local experimental que roteia clientes para Sessões (durable Sessions) hospedadas em aplicativos.

A versão atual suporta roteamento de serviços de faceta (facet-service routing) com escopo de servidor e de Sessão e anexos de apresentação múltipla (multi-presentation attachment). `RoutedServerServiceHost.attachClient()` cria um endpoint de serviço de servidor com escopo de conexão (connection-scoped) que tem recursos limitados de gerenciamento de anexo. `RoutedSessionHandle.attachClient()` retorna uma capability de Sessão com escopo de apresentação (presentation-scoped). Seu `invokeService()` encaminha um envelope opaco de service/member para o endpoint da Sessão selecionada; o servidor valida a rota do anexo, mas não carrega o contrato da faceta (facet contract).

- chamadas de serviço de servidor e subscrições são roteadas de forma opaca através do `RoutedServerServiceAttachment` da conexão;
- o `SessionDirectory`, de propriedade da aplicação, projeta o catálogo privado em um estado seguro para apresentação e replicado;
- o `SessionManagement`, de propriedade da aplicação, cria, remove, anexa (attaches) e desanexa Sessões sem expor IDs de rota em resultados de negócios;
- as mudanças de anexo (attachment changes) são publicadas fora de banda depois que o roteador instala ou limpa a rota ativa (live route);
- as chamadas de serviço de Sessão são roteadas por meio de `invokeService` sem a decodificação de payloads de negócios no lado do servidor;
- as atualizações de subscrição de serviço permanecem no escopo do anexo que fez a requisição;
- as observações da aplicação, como transcripts, são roteadas como um estado de serviço comum sem schemas de negócios pertencentes ao servidor.

Uma Sessão pode ter vários anexos de apresentação. Repetir o `attach` em uma conexão é idempotente; cada anexo bem-sucedido tem um `attachmentId` gerado pelo servidor, entregue apenas como dados de controle de roteamento. Requisições da Sessão carregam `{ serverId, sessionId, attachmentId }`, e o servidor rejeita rotas obsoletas ou que não coincidem. Perder uma conexão rejeita suas respostas locais, mas libera seu anexo apenas depois que as chamadas de serviço admitidas terminam (settle). O host decide quando a ausência de demanda de apresentação e a atividade do Harness local no worker permitem o descarte (retirement) do worker. O encerramento do servidor fecha todos os handles de Sessões roteadas, liberando sua posse de worker e Session writer.

```ts
import { randomUUID } from "node:crypto";
import {
  type RoutedServerServiceHost,
  type RoutedSessionHandle,
  type ServerHost,
  type SessionMetadata,
  SessionNotFoundError,
} from "@earendil-works/3pi-server";
import { createUnixServer, getUnixSocketPath } from "@earendil-works/3pi-server/unix";

interface StoredSession extends SessionMetadata {
  path: string;
}

async function startServer(
  serverServices: RoutedServerServiceHost,
  sessions: Map<string, StoredSession>,
  openRoutedSession: (session: StoredSession) => Promise<RoutedSessionHandle>,
) {
  const host: ServerHost<StoredSession> = {
    serverServices,
    async resolveSession(sessionId) {
      const metadata = sessions.get(sessionId);
      if (!metadata) throw new SessionNotFoundError(`Unknown session: ${sessionId}`);
      return metadata;
    },
    openSession: (metadata) => openRoutedSession(metadata),
  };

  const serverId = randomUUID();
  const server = createUnixServer(host, {
    serverId,
    path: getUnixSocketPath(serverId, "/run/user/1000/pi"),
  });
  await server.start();
  return server;
}
```

As aplicações fornecem um host obrigatório de serviço de servidor, um resolver de Sessão limitado e uma factory de Sessão roteada. O `SessionMetadata` requer apenas um `id`; as aplicações podem estendê-lo com seus próprios campos de armazenamento. A descoberta e o gerenciamento de Sessões são serviços de propriedade da aplicação; o servidor de protocolo apenas pede ao resolver pelos metadados ao rotear um anexo. O host cuida de adquirir a Session local ao worker e do Harness. As falhas são limpas nesse worker. Nem uma Sessão JavaScript aberta nem um Harness cruzam o limite do processo (process boundary).

O `serverId` é uma identidade lógica fornecida pelo launcher, não um endereço de soquete (socket address). O preset do Unix exige um `path` físico explícito; `getUnixSocketPath()` deriva um diretório selecionado pelo chamador. Escolha um diretório de runtime curto e privado, em vez de derivar a rota de um caminho de diretório home ilimitado. Um launcher de longa duração pode reutilizar o mesmo ID e caminho ao substituir um processo de servidor.

O `Server` compõe transportes através do `ServerListener`; a autenticação de peer continua sendo uma política da aplicação e não é implementada pelo transporte experimental Unix. O submódulo Unix fornece `createUnixListener()` e `createUnixServer()`. A validação de envelope roteado de baixo nível, o CBOR e o framing (enquadramento) vêm de `@earendil-works/3pi-protocol`; o Chord domina o parsing de controle de serviço, códigos de erro, snapshots e atualizações, e o encoder de estado replicado de cada subscrição.

O ciclo de vida do servidor e do worker é gerenciado fora do protocolo Pi público. O servidor de aplicação substituível converte anexos de conexão em atualizações de demanda privadas; o worker combina a demanda com marcação de geração com a atividade fidedigna do Harness. O coordenador experimental apenas fornece um roteamento estável e reporta mudanças genéricas de conexão nas gerações de servidor.
