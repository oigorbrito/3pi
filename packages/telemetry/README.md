# @earendil-works/3pi-telemetry

Contratos de telemetria neutros em relação ao fornecedor (vendor-neutral) e utilitários de schema tipados para os pacotes pi.

Este pacote fornece:

- um contrato explícito baseado em callback para `TelemetryContext` / `TelemetrySpan`;
- um `NOOP_TELEMETRY_CONTEXT` compartilhado;
- uma implementação de referência `InMemoryTelemetryContext`;
- definições de schema serializáveis com tipos inferidos de TypeScript;
- nenhum exporter, estado global de span atual, ou dependência de um backend de telemetria.

As aplicações podem usar a referência in-memory ou fornecer um adapter para OpenTelemetry, Sentry, logs ou outro backend. Os pacotes Pi passam contextos de telemetria explicitamente e definem seus schemas de domínio separadamente.

## Table of Contents

- [Installation](#installation)
- [Telemetry Concepts](#telemetry-concepts)
- [Core Context API](#core-context-api)
- [Adapter Contract](#adapter-contract)
- [No-op Context](#no-op-context)
- [In-Memory Reference Adapter](#in-memory-reference-adapter)
- [Adapter Conformance](#adapter-conformance)
- [Typed Schemas](#typed-schemas)
  - [Start and Completion Attributes](#start-and-completion-attributes)
- [Schema Metadata](#schema-metadata)
- [Pi Package Integration](#pi-package-integration)
- [Security and Portability](#security-and-portability)
- [API Reference](#api-reference)
- [Development](#development)
- [License](#license)

## Installation

```bash
npm install @earendil-works/3pi-telemetry
```

## Telemetry Concepts

Telemetria descreve o que um programa fez enquanto estava em execução. Este pacote modela esse trabalho usando spans, atributos (attributes), eventos (events), status e contexto (context) explícito:

| Concept | Plain-language meaning |
|---|---|
| **Span** | Um registro com duração (timed record) de uma operação, como carregar uma conta ou fazer uma solicitação de IA. Ele começa antes do trabalho e termina quando o trabalho é concluído. |
| **Parent and child spans** | Operações podem conter operações menores. Um span de solicitação pode conter uma busca no cache e uma consulta no banco de dados. Juntos, eles formam uma árvore (span tree) mostrando onde o tempo foi gasto. |
| **Attribute** | Um fato nomeado anexado a um span, como `provider: "openai"`, `cache.hit: true` ou `item_count: 12`. Atributos descrevem a operação e seu resultado. |
| **Event** | Uma ocorrência nomeada em um momento durante um span, como `retry.scheduled` ou `cache.lookup`. Eventos não têm duração e podem conter seus próprios atributos. |
| **Status** | O resultado da operação: `ok` ou `error`. Um status de erro pode incluir um nome e uma mensagem de erro. |
| **Context** | Um handle (identificador) apontando a que local um novo trabalho pertence na árvore de spans. Iniciar um span a partir de um contexto o torna filho desse contexto. |

Por exemplo, carregar uma conta poderia produzir esta telemetria:

```text
example.account.load                         span
├─ attributes: account.id=123, found=true   fatos sobre o span
├─ event: example.cache.lookup              ocorrência durante o span
│  └─ attribute: cache.hit=false            fato sobre o evento
└─ status: ok                               resultado final
```

Um span é um dado de diagnóstico, não estado de negócios. Registrá-lo não deve alterar se o carregamento da conta roda, obtém sucesso, falha ou é persistido. Um adapter traduz esses conceitos genéricos nos conceitos correspondentes usados ​​pelo OpenTelemetry, Sentry, logs ou outro backend.

## Core Context API

Um `TelemetryContext` inicia um span envolvendo um callback. O callback recebe um `TelemetrySpan`, que também é o contexto pai explícito para spans filhos (child spans).

```typescript
import {
  NOOP_TELEMETRY_CONTEXT,
  type TelemetryContext,
} from '@earendil-works/3pi-telemetry';

async function loadAccount(
  accountId: string,
  telemetryContext: TelemetryContext = NOOP_TELEMETRY_CONTEXT,
) {
  return telemetryContext.startSpan(
    {
      name: 'example.account.load',
      attributes: { 'example.account.id': accountId },
    },
    async (span) => {
      const account = await readAccount(accountId);
      span.setAttributes({ 'example.account.found': account !== undefined });
      return account;
    },
  );
}
```

Passe o span de callback para um trabalho de nível inferior para criar aninhamento explícito:

```typescript
return telemetryContext.startSpan({ name: 'example.parent' }, async (parentSpan) => {
  return parentSpan.startSpan({ name: 'example.child' }, async (childSpan) => {
    childSpan.addEvent('example.cache.lookup', { 'example.cache.hit': true });
    return performWork();
  });
});
```

Não há um método público `end()`. O `startSpan()` detém a conclusão (settlement) e mantém o span aberto até que o valor ou a promise do callback sejam resolvidos. Para uma falha esperada representada por um valor de retorno normal, defina o status explicitamente:

```typescript
return telemetryContext.startSpan({ name: 'example.save' }, async (span) => {
  const result = await save();
  if (!result.ok) {
    span.setStatus({
      status: 'error',
      error: { name: 'SaveError', message: result.reason },
    });
  }
  return result;
});
```

## Adapter Contract

Um adapter implementa `TelemetryContext` e faz a ponte entre a API genérica e seu backend. Ele deve:

- criar um child span e invocar o callback de forma síncrona, exatamente uma vez;
- preservar o valor retornado do callback e o valor de rejeição, retornando uma promise rejeitada com o mesmo valor após um throw síncrono;
- manter o span nativo aberto até que uma promise retornada seja resolvida (settles);
- tratar a conclusão normal como `ok` e throws/rejections como erros a menos que um status explícito tenha sido definido;
- fazer com que chamadas repetidas a `setStatus()` sigam o modelo "última gravação vence" (last-write-wins);
- fazer o merge de chamadas a `setAttributes()`, onde valores definidos mais tarde substituem os mais antigos e `undefined` é ignorado;
- tornar os métodos de gravação síncronos, passivos e sem throw (non-throwing);
- ignorar chamadas feitas após o settlement (conclusão);
- ignorar uma falha na chamada de gravação de forma atômica, suprimir falhas de backend e ainda executar o callback de negócios exatamente uma vez.

Os adapters podem ativar um contexto ambiente (ambient context) nativo do backend internamente para instrumentação automática, mas o código pi sempre propaga o pai por meio de argumentos `TelemetryContext`. Buffering do exporter, flush, sampling, IDs do backend e objetos de contexto específicos do backend pertencem ao adapter. Use a [suíte de conformidade de adapter](#adapter-conformance) para verificar essas semânticas observáveis.

## No-op Context

Use `NOOP_TELEMETRY_CONTEXT` quando a telemetria for opcional:

```typescript
import { NOOP_TELEMETRY_CONTEXT } from '@earendil-works/3pi-telemetry';

const result = await NOOP_TELEMETRY_CONTEXT.startSpan(
  { name: 'example.operation' },
  () => runOperation(),
);
```

O no-op context:

- invoca callbacks de forma síncrona;
- preserva valores retornados e rejections assíncronas, e converte um throw síncrono em uma promise rejeitada com o mesmo valor;
- usa um span inerte, congelado e compartilhado, inclusive para spans aninhados;
- não inspeciona ou retém nomes, atributos, eventos ou status.

## In-Memory Reference Adapter

O `InMemoryTelemetryContext` é a implementação de referência neutra quanto a backend. Ele é útil para testes, diagnósticos locais e aplicações que intencionalmente desejam captura process-local sem um exporter:

```typescript
import { InMemoryTelemetryContext } from '@earendil-works/3pi-telemetry';

const telemetry = new InMemoryTelemetryContext();

await telemetry.startSpan(
  { name: 'example.operation', attributes: { input: 'demo' } },
  async (span) => {
    span.addEvent('example.started');
    span.setAttributes({ output_count: 3 });
  },
);

console.log(telemetry.getSpans());
```

`getSpans()` retorna snapshots separados na ordem de início do span. Cada `RecordedTelemetrySpan` contém um ID numérico determinístico, ID do pai, atributos merged, eventos ordenados, status final, estado de settlement, e sequência de fim determinística. Ele não registra timestamps.

O adapter é seguro para uso como um `TelemetryContext` comum, mas o armazenamento é ilimitado e process-local. Crie uma nova instância para isolar testes ou escopos de gravação e não capture atributos sensíveis a não ser que a data policy do chamador os permita.

## Adapter Conformance

`@earendil-works/3pi-telemetry/testing` exporta uma suíte de conformidade independente de runner, modelada como casos agrupados. Um fixture fornece um novo contexto e converte os spans finalizados de seu backend em snapshots `RecordedTelemetrySpan` normalizados:

```typescript
import {
  createTelemetryAdapterConformance,
  type TelemetryAdapterFixture,
} from '@earendil-works/3pi-telemetry/testing';
import { describe, it } from 'vitest';

const conformance = createTelemetryAdapterConformance(async () => {
  const adapter = createMyTelemetryAdapter();
  return {
    context: adapter.context,
    getSpans: async () => adapter.normalizedSpans(),
    async [Symbol.asyncDispose]() {
      await adapter.close();
    },
  } satisfies TelemetryAdapterFixture;
});

for (const group of new Set(conformance.map((testCase) => testCase.group))) {
  describe(group, () => {
    for (const testCase of conformance.filter((candidate) => candidate.group === group)) {
      it(testCase.name, () => testCase.run());
    }
  });
}
```

A suíte verifica admissão síncrona única, identidade de resultado e rejeição, status automático e explícito, merge de atributos, ordenação de eventos, chamadas pós-settlement inertes, parentesco (parentage) aninhado e concorrente e supressão de falhas de payload de telemetria ilegível. `getSpans()` pode fazer um flush de um exporter assíncrono antes de retornar. O subpath testing usa as APIs de asserção do Node; o pacote raiz de telemetria permanece neutro em termos de runtime.

## Typed Schemas

A API de span de baixo nível intencionalmente aceita nomes abertos e sacos de atributos (attribute bags) para que os adapters permaneçam genéricos. Pacotes de domínio podem definir schemas fechados e serializáveis e inferir tipos exatos em TypeScript a partir deles.

```typescript
import {
  createTypedSpanStarter,
  defineTelemetrySchema,
} from '@earendil-works/3pi-telemetry';

export const EXAMPLE_TELEMETRY_SCHEMA = defineTelemetrySchema({
  version: 1,
  spans: {
    'example.read': {
      description: 'Read one resource',
      parents: { kind: 'any' },
      startAttributes: {
        'example.resource': {
          type: 'string',
          required: true,
          values: ['account', 'project'],
          description: 'Resource kind',
        },
      },
      endAttributes: {
        'example.item_count': {
          type: 'number',
          description: 'Number of returned items',
        },
      },
      events: {
        'example.cache': {
          description: 'Cache lookup result',
          attributes: {
            'example.cache.hit': {
              type: 'boolean',
              required: true,
              description: 'Whether the cache contained the resource',
            },
          },
        },
      },
      status: {
        default: 'ok',
        errorWhen: 'The read throws or returns an error result',
      },
    },
  },
} as const);

const startSpan = createTypedSpanStarter(
  telemetryContext,
  [EXAMPLE_TELEMETRY_SCHEMA],
);
```

O starter expõe uma sobrecarga (overload) por span e verifica nomes e atributos no momento da compilação. Nomes com valores de union devem ser estritamente tipados antes de uma chamada, preservando o relacionamento entre cada nome de runtime e seu schema de atributo. Seu callback recebe um starter filho sobre os mesmos schemas, já vinculado ao span do callback:

```typescript
await startSpan(
  'example.read',
  { 'example.resource': 'account' },
  async (span, startChildSpan) => {
    span.addEvent('example.cache', { 'example.cache.hit': true });
    const accounts = await readAccounts();
    span.setAttributes({ 'example.item_count': accounts.length });

    await startChildSpan(
      'example.read',
      { 'example.resource': 'project' },
      async (childSpan) => {
        const projects = await readProjects();
        childSpan.setAttributes({ 'example.item_count': projects.length });
      },
    );

    return accounts;
  },
);
```

### Start and Completion Attributes

`startAttributes` e `endAttributes` descrevem quando um atributo é normalmente conhecido, e não armazenamento de runtime separado:

| Schema field | How values are recorded | Requiredness |
|---|---|---|
| `startAttributes` | Passado no argumento `attributes` do typed starter quando o span é criado | Cada definição define explicitamente `required: true` ou `false` |
| `endAttributes` | Adicionado posteriormente através do método `setAttributes()` do span de escopo do schema | Sempre opcional |

Ambos os conjuntos se tornam atributos comuns no mesmo backend span. Não há um payload separado para end-attribute ou end callback. No exemplo anterior, `example.resource` é conhecido quando `example.read` começa, enquanto `example.item_count` é conhecido apenas depois que `readAccounts()` retorna:

```typescript
await startSpan(
  'example.read',
  { 'example.resource': 'account' }, // required start attribute
  async (span) => {
    const accounts = await readAccounts();
    span.setAttributes({
      'example.item_count': accounts.length, // optional completion attribute
    });
    return accounts;
  },
); // resolving the callback settles the span
```

"End" (Fim) significa enriquecimento de conclusão: um end attribute (atributo final) pode ser definido em qualquer ponto enquanto o callback estiver ativo e pode ser omitido quando não estiver disponível. Chamar `setAttributes()` zero vezes é válido. Isso é importante para falhas antecipadas, cancelamento e dados específicos do provedor que podem não existir em todos os caminhos.

Chamadas repetidas a `setAttributes()` mesclam (merge) no mesmo attribute bag (saco de atributos). Um valor definido mais tarde substitui um valor anterior pela mesma chave, enquanto `undefined` é ignorado. O método com escopo do schema aceita apenas os atributos finais declarados do span atual.

Os atributos não encerram o span. Retornar, resolver, lançar exceção (throw) ou rejeitar a partir do callback controla a conclusão (settlement); `startSpan()` realiza a operação final efetiva. As chamadas do adapter feitas após o settlement ficam inertes.

Um starter pode compor vários schemas versionados independentemente:

```typescript
import { AGENT_TELEMETRY_SCHEMAS } from '@earendil-works/3pi-agent-core';

const startAgentSpan = createTypedSpanStarter(
  telemetryContext,
  AGENT_TELEMETRY_SCHEMAS,
);
```

Os arrays de schema inline mantêm seus tipos de tupla automaticamente. Os arrays declarados separadamente devem usar `as const`. Nomes de span duplicados literais no array são rejeitados em tempo de compilação; os schemas não sofrem merge, não são inspecionados ou retidos em tempo de execução.

Tipos derivados de schemas rejeitam atributos requeridos ausentes, chaves desconhecidas, valores de conjuntos fechados inválidos, eventos não declarados e atributos em schemas vazios. Os end attributes são sempre um enriquecimento opcional; o sistema de tipagem não requer que `setAttributes()` seja chamado.

`defineTelemetrySchema()` é uma typed identity function. Ela retorna dados JSON serializáveis comuns e não executa validação em runtime ou imposição da regra de parentesco (parent-rule).

## Schema Metadata

Os tipos de atributo (attribute types) suportados são:

- `string`, `number` e `boolean`;
- `string[]`, `number[]` e `boolean[]`.

As definições de atributo suportam:

- `values`: um conjunto fechado (closed set) para valores escalares;
- `elementValues`: um conjunto fechado para elementos de array;
- `examples`: exemplos de documentação;
- `sensitive`: marca dados que requerem tratamento especial;
- `cardinality`: registra a cardinalidade esperada `low` ou `high`.

Os atributos start e event declaram `required`. Os atributos end não; veja [Start and Completion Attributes](#start-and-completion-attributes).

Parent metadata são dados de schema descritivos:

- `{ kind: 'any' }`: root (raiz) ou qualquer caller span;
- `{ kind: 'root_or_external' }`: root ou um span caller fora do schema;
- `{ kind: 'spans', spans: [...] }`: apenas os spans do schema listados.

Os adapters não precisam entender os objetos de schema. Ajuda e testes de instrumentação (instrumentation helpers) os utilizam para manter consistentes os nomes e atributos emitidos.

## Pi Package Integration

A propriedade dos pacotes é intencionalmente dividida:

- `@earendil-works/3pi-telemetry` detém o contrato independente de vendor, os no-op e contextos de referência in-memory, os utilitários de schema e a suíte de conformidade de adapter;
- `@earendil-works/3pi-ai` aceita e propaga o `telemetryContext` nas opções de solicitação do provedor, mas não detém nenhum telemetry schema;
- `@earendil-works/3pi-agent-core` possui e exporta os schemas de requisições AI pi e do harness, a sua tuple readonly combinada e utilitários tipados de span (typed span helpers).

```typescript
import {
  AGENT_TELEMETRY_SCHEMAS,
  AI_TELEMETRY_SCHEMA,
  HARNESS_TELEMETRY_SCHEMA,
  startAiSpan,
  startHarnessSpan,
} from '@earendil-works/3pi-agent-core';
```

Os schemas pi usam os nomes `pi.ai.*`, `pi.harness.*` e `pi.session.*` controlados pelo pi. Adapters podem traduzi-los para convenções do backend sem alterar o vocabulário pi emitido.

## Security and Portability

Telemetria é o diagnóstico restrito ao processo local (process-local), e não a durabilidade do estado da aplicação. Não persista um `TelemetryContext`, `TelemetrySpan`, ou objeto nativo de rastreio de um backend (backend-native trace object) em registros, mensagens, snapshots ou handles adiados.

Os valores de atributos são limitados intencionalmente a escalares primitivos e arrays. Instrumentação de domínio (Domain instrumentation) deve evitar lidar com os prompts, outputs ou argumentos de ferramenta (tool arguments), contéudos de arquivos, ou credenciais/payloads/cabeçalhos atrelados a um provider ou provedor, tão pouco os detalhes formatados livremente que resultem de algum erro a não ser se o seu schema e o controle normativo atrelado aos dados explicitamente lhes der validação e espaço condizente a uso.

O pacote não usa a `AsyncLocalStorage` tão pouco demais meios restritos vinculados a ambiente (ambient context API) originários da API ao ambiente de execução (runtime). Trata-se então ser favoravelmente passivo com os navegadores, bem como Node.js, Bun ou workers; devendo seus adapters ficarem condicionados ao respaldo originário e autoral referente à compatibilidade para as instâncias ativas do seu backend pertinente ao serviço de destino (backend adapters).

## API Reference

### Core types and values

| Export | Purpose |
|---|---|
| `TelemetryContext` | Inicia child spans gerenciados por callback |
| `TelemetrySpan` | Registra atributos, eventos e status; também atua como um child context |
| `SpanOptions` | Nome do span e start attributes opcionais |
| `SpanAttributes` / `AttributeValue` | Bag (saco) de atributos abertos no nível do adapter e valores suportados |
| `SpanStatus` | Status explícito `ok` ou `error` |
| `NOOP_TELEMETRY_CONTEXT` | Contexto passivo compartilhado para telemetria desativada |
| `InMemoryTelemetryContext` | Adapter de referência com gravação process-local determinística |
| `RecordedTelemetrySpan` | Snapshot normalizado de span capturado |
| `RecordedTelemetryEvent` | Snapshot normalizado de evento capturado |

### Schema definitions and inference

| Export | Purpose |
|---|---|
| `defineTelemetrySchema()` | Helper de identidade tipada para dados de schema serializáveis |
| `createTypedSpanStarter()` | Vincula um parent context a um ou mais vocabulários de schema |
| `TypedSpanStarter` | Tipo de starter exato com callbacks filhos vinculados recursivamente |
| `TelemetrySchemaDefinition` | Estrutura top-level do schema |
| `TelemetrySpanDefinition` | Metadados do span, parents, atributos, eventos e regra de status |
| `TelemetryAttributeType` | Nomes de tipos escalares e array suportados |
| `TelemetryAttributeMetadata` | Metadados de descrição, sensibilidade e cardinalidade |
| `TelemetryAttributeDefinition` | Tipo de atributo, valores permitidos, exemplos e metadados |
| `TelemetryStartAttributeDefinition` | Definição de atributo de início (start) com obrigatoriedade |
| `TelemetryEventAttributeDefinition` | Definição de atributo de evento (event) com obrigatoriedade |
| `TelemetryEventDefinition` | Descrição de evento e definições de atributos |
| `TelemetryParentDefinition` | Regra de open, external-root ou finite schema-parent |
| `TelemetrySchemaSpanName` | União (Union) dos nomes de span declarados |
| `TelemetrySchemaSpanStartAttributes` | Atributos inferidos exatos de start para um span |
| `TelemetrySchemaSpanEndAttributes` | Atributos inferidos de end opcionais para um span |
| `TelemetrySchemaSpanEventName` | União dos eventos declarados por um span |
| `TelemetrySchemaSpanEventAttributes` | Atributos inferidos exatos para um evento |
| `SchemaTelemetrySpan` | Visualização do span restrita a um span de schema |
| `TelemetrySchemaSpanUnion` | União discriminada de todos os spans em um schema |
| `InferStartAttributes` | Valores obrigatórios e opcionais inferidos das definições de start |
| `InferOptionalAttributes` | Valores opcionais inferidos das definições de end |
| `InferEventAttributes` | Valores obrigatórios e opcionais inferidos das definições de evento |
| `InferRequiredAndOptionalAttributes` | Utilitário de inferência compartilhado para definições com obrigatoriedade |
| `ExactTelemetryAttributes` | Rejeita chaves fora de um conjunto esperado de atributos |

### Testing subpath

| Export | Purpose |
|---|---|
| `createTelemetryAdapterConformance()` | Cria casos independentes da plataforma (runner) para averiguar conformidade nativa aos adaptadores (adapter conformance cases) |
| `TelemetryAdapterFixture` | Leitor em normalizados de snapshot (normalized snapshot reader) bem como ambiente (context) passivo focado a um caso único |
| `TelemetryAdapterFixtureFactory` | Fabrica e implementa as instâncias isoladas |
| `TelemetryAdapterConformanceCase` | Caso de uso testável no foco a ser provido nos ambientes de execução (test runners) |

## Development

A partir do diretório deste pacote:

```bash
npm test
npm run build
```

Checagem de tipos, formatação, linting e verificações smoke em todo o repositório rodam com:

```bash
npm run check
```

## License

MIT
