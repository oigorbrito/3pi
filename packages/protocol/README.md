# @earendil-works/3pi-protocol

Envelopes roteados independentes de runtime (runtime-neutral), codificação CBOR e framing de byte-stream para o protocolo experimental do Pi.

O protocolo versão `8` define:

- um version handshake que identifica o `serverId` lógico;
- alvos (targets) explícitos de requisição para o servidor e Session;
- requisições e respostas correlacionadas com payloads strict-JSON opacos;
- cancelamento de request, atualizações de subscrição opacas e alterações de anexo (attachment) fora de banda;
- códigos de erro não vazios opacos e mensagens de transporte delimitadas.

Um alvo de servidor contém `{ serverId }`; um alvo de Session contém `{ serverId, sessionId, attachmentId }`. A rota combinada limita as chamadas a um servidor lógico, Session durável e um anexo de apresentação ativo. O gerenciamento `attach()` e `detach()` não retorna identificadores de roteamento; o servidor publica a rota ativa selecionada em uma mensagem `attachment` fora de banda. A desconexão libera apenas o anexo daquela apresentação depois que as chamadas admitidas terminam (settle).

O Chord é dono da semântica de payload transportada dentro desses envelopes: chamadas `{ serviceId, instance?, member, args }`, o vocabulário de controle `$chord.service`, os catálogos de serviço, as atualizações e snapshots de subscrição, os códigos de erro de serviço e codecs de caminhos Delta independentes para os estados replicados. O `pi-protocol` valida que cada payload opaco é um strict JSON, mas não valida ou exporta sua gramática Chord. Clientes e servidores fazem o parse desses valores através de `@earendil-works/chord` no limite do adapter do serviço.

O estado do diretório da sessão, resultados de gerenciamento, transcripts, modelos, plugins, e todos os outros valores da aplicação permanecem como dados de serviço opacos. A Session durável e o seu Harness continuam sendo locais ao processo worker da Session. Chamadas de servidor e de Session roteiam opacamente aos seus providers proprietários, onde o Chord e a aplicação os validam e invocam.

O ciclo de vida do servidor e do worker estão intencionalmente fora desse protocolo público. O coordenador local experimental é apenas um roteador de mensagens opaco; cada processo de servidor substituível possui um ciclo de vida de protocolo privado.

Cada frame wire consiste em quatro bytes sem sinal big-endian como tamanho do payload, seguido por um único item de comprimento definido do CBOR. O `encodeClientMessage()` e `encodeServerMessage()` validam e codificam frames completos. `ClientMessageDecoder` e `ServerMessageDecoder` aceitam fragmentação ou coalescência arbitrária de stream.

```ts
import {
  PROTOCOL_VERSION,
  encodeClientMessage,
  ServerMessageDecoder,
  type ClientHello,
} from "@earendil-works/3pi-protocol";

const hello: ClientHello = { type: "hello", version: PROTOCOL_VERSION };
transport.send(encodeClientMessage(hello));

const decoder = new ServerMessageDecoder({ maxFrameLength: 1024 * 1024 });
for (const message of decoder.push(incomingChunk)) handleServerMessage(message);
decoder.end();
```

Todos os schemas de envelope rejeitam propriedades desconhecidas em objetos, e codecs recursivamente rejeitam payloads opacos não JSON, incluindo números não finitos, arrays de bytes, `undefined`, protótipos e ciclos. Violações de envelopes, CBOR malformados e framing inválido lançam `ProtocolValidationError`. Adapters específicos de payloads devem realizar sua própria validação semântica após decodificar. Transportes devem preservar a ordem dos bytes. Autenticação peer e contextos de serviços autenticados não são implementados pelo transporte experimental.

Limites padrão são 16 MiB por payload CBOR/frame, 1.000.000 de elementos em arrays ou entradas em mapas, e 64 níveis aninhados de itens. O protocolo é experimental e não possui garantias de compatibilidade.
