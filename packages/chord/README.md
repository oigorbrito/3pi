# @earendil-works/chord

Chord é um runtime de composição de aplicativos para sistemas montados a partir de
plugins/extensões. Ele fornece facetas (facets), serviços, estado replicado e um
limite de serviço remoto plugável. Ele é desenvolvido como um pacote autônomo (standalone) no
monorepo do Pi, mas não é um pacote Pi: não depende de nenhum outro pacote do
workspace do Pi e pode ser usado por aplicativos não relacionados.

## Para que serve o Chord

Um único recurso de aplicativo pode precisar ser executado em vários ambientes: por
exemplo, um agente worker, uma interface de usuário no terminal (TUI) e uma WebUI remota. O Chord fornece os
mecanismos genéricos para escrever tais extensões de uma forma que seja agradável tanto para
humanos quanto para agentes.

O design possui algumas peças conectadas:

- **Plugins** são unidades de configuração (setup) síncronas que declaram os serviços que eles fornecem
  e exigem (require). Depois que todo plugin tiver declarado sua forma, um host valida o
  grafo completo de dependências, liga os serviços, ativa provedores antes de consumidores e
  descarta recursos na ordem inversa de dependência.  Essas unidades são chamadas
  de *facetas* (facets).

- **Facetas** (Facets) são partes de um plugin.  Cada faceta é empacotada separadamente e é executada
  no processo ou ambiente onde deve ser executada.  Você pode usar facetas
  para dividir um plugin em partes separadas que precisam ser carregadas em processos e ambientes
  diferentes (como backend, browser, TUI, etc.)

- **Serviços** são tokens tipados e estáveis com apenas um provedor (**singleton**)
  ou instâncias dinâmicas baseadas em chaves (**keyed**).  Um serviço pode ser local ao processo, com
  um contrato JavaScript irrestrito ou ser exposto remotamente. Consumidores retêm uma
  fachada (facade) estável enquanto um provedor se desconecta ou é substituído.

- **O estado replicado** (Replicated state) expõe estado autoritativo (authoritative state) a consumidores
  conectados locais e remotos. Produtores publicam transações de overlay (overlay transactions) atômicas com
  `change(context, callback)`; consumidores recebem valores imutáveis completos. Proxies
  de rascunho (draft proxies) existem apenas durante o callback e tornam-se inutilizáveis depois. A preparação (preparation)
  materializa um candidato imutável estruturalmente compartilhado e exatamente um lote de
  operação decodificada, enquanto cada stream estado-cliente remoto detém um path-codec independente de
  estado. Réplicas ficam "não prontas" em desconexões ou substituições até serem reidratadas.

- **Rastreamento de delta** (Delta tracking) registra e consolida (coalesces) operações sobre JSON simples rastreados.
  Ele preserva operações comuns de string e array, suporta batches básicos duráveis
  e valida operações não confiáveis conforme elas são aplicadas. Batches
  garantem convergência, mas não são canônicos ou necessariamente os menores.

- **Fontes de serviço remoto** anunciam (advertise) serviços disponíveis fora de um host de faceta (facet host)
  e abrem vínculos (bindings) para os serviços de que suas facetas precisam. Bindings carregam chamadas
  lógicas e assinaturas por meio de um adaptador fornecido pelo aplicativo. O Chord
  requer argumentos strict-JSON, resultados, instantâneos (snapshots), atualizações e catálogos,
  mas não prescreve framing, roteamento, transporte ou um envelope de fio de aplicativo (application wire envelope). `JsonRepresentation<T>` deriva um tipo seguro (wire-safe) para dados de aplicativo
  com payloads desconhecidos, enquanto `isJsonValue()` valida valores recebidos em um
  limite do adaptador (adapter boundary). Peers de RPC simétricos estão planejados como uma implementação opcional
  desse limite.

- **Contexto**: O Chord fornece um sistema de contexto semelhante ao Go para cancelamentos e
  valores de aplicação dentro de uma invocação (invocation-scoped). Os aplicativos podem carregar permissões ou
  telemetria por meio desses valores, sem que o Chord dependa de nenhum deles.

O ambiente de execução atual (current runtime) exporta os tokens de serviço (service tokens), provedores singleton e com chave (keyed providers), vínculos remotos (remote bindings), estado replicado (replicated state), hosts e adaptadores a partir de (from)
`@earendil-works/chord`. Importe os tipos públicos (public types) bem como as referências de runtime geral pelo modelo
root do pacote. Elementos do ambiente e de controle do contexto residem contudo em
`@earendil-works/chord/context` buscando evadir de contaminações à principal entrada (root API).
Assinaturas exclusivas operam referências em subdiretórios reservados contendo `chord.*` sob prefixo: `$chord.*`.

## Remote service adapters

Chord mantém o gerenciamento interno às rotinas para comunicação assíncrona transport-independent. Produtores e receptores utilizam `createServiceCatalogueCall()`, `createServiceSubscribeCall()`, acompanhados a `createServiceUnsubscribeCall()` aos acessos operados à gestão por chamada à estrutura `$chord.service`.
`createRemoteServiceEndpoint()` opera por um consumo dedicado (provider consumer) cada assinatura e sua decorrente inativação de recursos. Ao mesmo tempo: `parseServiceCall()`,
`parseServiceCatalogue()`, integrados às checagens decodificadoras em fluxo para avaliação confirmam o padrão de envio compatível restrito ao limitador das garantias adotadas no contrato strict-JSON na base limite dos meios adaptados. Modelos listados contendo as ocorrências referenciam, ademais, erros específicos definidos via `RemoteServiceErrorCode` por atribuição no array de controle `REMOTE_SERVICE_ERROR_CODES`.

Operações correspondentes pelo modelo do (Replicated state) demandam instâncias exclusivas originadas de `createServiceStateEncoder()` na via transmissora em oposição às geradas de `createServiceStateDecoder()` pela via destinatária para cada (subscription). Elementos e estruturas construídos mantêm independentes modelos decodificáveis correspondentes (path dictionary) dedicados e restritos ao fluxo por componente, renovando tais registros operacionais mediante ausências de compatibilidade, trocas efetuadas ou hidratações recentes. Aplicações controlam tais componentes livremente em seus próprios sistemas, roteamentos ou envelopamentos operacionais - eximindo os responsáveis sob manutenção do Chord das definições obrigatórias sobre tais bases arquiteturais de envio ou transporte.

Contratos sobre os consumidores capturam integralizações em snapshot retendo atualizações acumulativas aguardando aval no processo sob espera na ativação do fluxo transmissor (activation). Tais atualizações não sobrepõem limites acima dos parâmetros base de contingência com 100 frames restritos à reserva pendente; na ocasião de adição em escala de mais um referencial: 101 – impõe-se ação limitadora reiniciando tudo, onde subscreve a ordem pelo envio no modelo tipado com (type: reset) abrigando as instâncias operacionais exclusivas com (snapshot e valores raiz contidos em root). Com tal limite atuando os eventos operacionais mantêm íntegras as gerações de registro sem descartar (spawn/close/replacement) instâncias em atraso relativas. Operações em andamento de componentes por geração viva retêm inalterados seus referenciamentos ativos. O reset incorpora o contexto originado das ações e chamadas operacionais atreladas ao estouro correspondente (overflow).

Consumidores em decodificação lidam em mandatório restrito com todo restabelecimento anterior à captação perante envios adicionais (ordinary deltas). O comando contendo a origem de raiz no conteúdo em (ordinary state) não abre mão nem cede lacuna nas sequências geradas. Os processos e suas rotinas determinam a continuação contínua após a etapa descrita sob resets (must be contiguous). Os conectores e as redes sob adaptador não perdem, abandonam nem pulam a etapa das chamadas codificadas nos blocos (encoded delta batches), rejeitando ademais suprimir fluxos pendentes em restrições alheias aos quadros originados.

## Delta Tracking em JSON

O ambiente importado e voltado a funções de caráter restritivo de alterações em banco pode ser consultado pela chamada correspondente em `@earendil-works/chord/delta`:

```ts
import { applyImmutable, track } from "@earendil-works/chord/delta";

const tracker = track({ output: "", count: 0 });
const change = tracker.beginChange();
change.state.output += "done\n";
change.state.count += 1;
const prepared = change.prepare();

tracker.adopt(prepared);
const replica = applyImmutable(prepared.base, prepared.ops);
```

Sempre que acessado, o ambiente interno originado (tracker.value) retorna seu formato e os limites baseados sob adoções em revisões correspondentes inalteradas (latest adopted immutable revision). Não configuram nem promovem qualquer efeito às instâncias e a autoridade principal associada, tendo seu estado mudado em caso atrelado (adoption) na confirmação do limite correspondente. Estruturas (Assigned containers) espelham seus equivalentes retendo, partilhando sem mudanças estruturais diretas as informações contíguas em meio às atualizações ocorridas.

Por se referir a uma estrutura imutável de referenciamentos a confiabilidade substitui modelos voltados a captação defensiva bem como os tipos de congelamentos tradicionais. Os blocos `track(initial)`, `prepareReplace(value)`, `replicatedState(initial)` e de equivalência em `replace(context, value)` controlam sua origem desprovidos e livres de ciclos. Instâncias originadas nas propriedades não modificam tais informações distribuídas. O mesmo se atesta à validação por controle nas origens em repasse: vetadas antes aos cenários que busquem transições em modelos JSON de padrão não aceito ou compatível nas etapas ativas de configuração associadas (draft changes). Valores atestados mantêm-se alheios às travas impeditivas. Estruturas ligadas em laços de serviço no controle próprio partilham das diretrizes originais na interface correspondente (consumer loops) sendo indevido mutações sobre as linhas descritas resultantes do serviço, acarretando contaminação em caso de descumprimento; serializar com limitações se torna imprescindível (Clone or serialize).

Controle da imutabilidade no sistema replicado espelha-se por:

```ts
const initial = { output: "", count: 0 };
const status = env.replicatedState(initial); // transfers ownership of initial
status.change(context, (draft) => {
	draft.output += "done\n";
	draft.count += 1;
});
```

Mudanças autorizadas promovem sua exclusividade com revisões. Rejeições ocorrem perante erros atrelados à requisição associada (callback throws). Modelos associados (draft handles) perdem valia imediatamente. Funções derivadas produzem reduções na base ou adições ao contexto por arrays e operações de agrupamento correspondentes à raiz do sistema, cujos conectores encodam sob as redes base de cada cliente ou modelo.

### Public state subscriptions

Por padrão `state.subscribe(async (value, context, delivery) => { ... })` elabora serialização nas rotinas para assinatura. Processo e etapas sob (Hydration) abrem e executam o serviço independentes a limitações na disposição assíncrona; retornos são recebidos operando encerramento frente às próximas demandas. Funções estruturadas síncronas retêm seu formato inicial (synchronously). A avaliação interna sob escopo por estado (state.value) acopla aos modelos revisões anteriores sob demanda das entregas no fluxo submetido.

A limitação garante em fluxos de assinaturas retentivas (retains) no máximo as últimas 100 ordens operadas. Se ocorrem interrupções (overflow), a garantia foca na retenção recente do acúmulo de requisições preservadas na integridade associada. O descarte na origem afeta envios posteriores. Ao inverso, as inscrições pautadas pela consistência das métricas diretas mantêm controle às integrações garantindo fluidez síncrona.

Ao aplicar o processo oposto pela retirada associada ou anulação a função desfaz sem pausas requisições agendadas, impossibilitando ademais execuções pendentes. O processo rejeita e aponta exceções estruturadas no ciclo originado e relata a quem chamou, impedindo ou descontinuando a ocorrência sob falhas; recursos que controlam localizações apontam tais informações em seu rastreamento (local mutable states). Extinguir os contratos não afasta ou disfarça eventuais anulações na sequência base associada aos trâmites da requisição operacional corrente (running callback).

### Bundling e Facets
Utilização no Chord engloba `@earendil-works/chord/bundler` originário nos suportes via esbuild no agrupamento, referenciamento por entradas (ESM/TypeScript) independentes no CommonJS originados a partir de `package.json` baseadas também em integrações padronizadas ou submetidas ao uso por vias no fornecedor:

```json
{
  "name": "@example/my-plugin",
  "version": "1.0.0",
  "type": "module",
  "peerDependencies": {
    "@earendil-works/chord": "^0.84.4"
  },
  "chord": {
    "facets": {
      "worker": "./src/custom-worker.ts",
      "presentation": false
    }
  }
}
```

```ts
import { bundleFacetPackage } from "@earendil-works/chord/bundler";

await bundleFacetPackage({
	packagePath: "/path/to/my-plugin",
	outdir: "/application-owned/plugin-builds/my-plugin",
	defaultFacets: {
		worker: "src/worker.ts",
		presentation: "src/presentation.ts",
	},
});
```
Os caminhos associados sob `chord.facets` priorizam sobre configurações e referências passadas à anulação ou substituição das convenções originárias; peer dependencies em caso descrito tornam-se validadas de forma externa aos usos nos blocos no localizador do acesso integrado (externalized and resolved).

Os dados de saída incluem o formato atrelado a arquivos e informações (chord-facets.json), sob carregamento da integração orientada via acesso e compatibilidade no node:

```ts
import { createFacetBundleLoader } from "@earendil-works/chord/node";

const loader = createFacetBundleLoader({
	manifestPath: "/application-owned/plugin-builds/my-plugin/chord-facets.json",
	entry: "worker",
	resolveExternal: (specifier) => import.meta.resolve(specifier),
});
const loaded = await loader.load();
```
Tal acesso e formatação promovem atestações na estrutura original garantidas através das rotinas associadas (SHA-256) validando as matrizes de compilação nos modelos isolados correspondentes à estrutura interna, preservados sob escopos em diretórios ou bibliotecas vinculadas pela dependência ao suporte dinâmico no Node por integração isolada através da (restricted require) atreladas aos limites por esbuild. Liberações em processos inativos reduzem alocações em referências propiciando ao garbage collector as limpezas de memória subsequentes perante exclusão das referências locais originais do fornecimento gerador de dependência.

Atrelados às transições sob processos no Node por instâncias no modelo (readFacetBundleArtifact) geram cópia das assinaturas submetendo na origem, via adaptações temporárias do (createFacetBundleArtifactLoader) suas configurações de avaliação externas no ponto de cruzamento de entrada remetido.

Configurações ligadas a atualizações requerem acessos prévios à função `FacetHost.reload()`, gerindo recursos ativos descartados no caso de erros ou operados no final na troca concluída, com as instâncias no processo ativo preservando instâncias dinâmicas e roteamentos de funções locais que independem de reinicialização no caso de recargas (ordinary reload). As origens vinculadas geram suas bases através das chaves criadas por substitutos em diretório isolado provisório; o sistema assegura controle íntegro impedindo interrupções visíveis parciais ao ciclo associado de uso e dependência das funções ativas atreladas a compilação paralela à rotina.
