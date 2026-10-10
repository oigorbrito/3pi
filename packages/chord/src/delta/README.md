# Chord Delta

O Chord Delta produz revisões JSON imutáveis e lotes de operações exatas para
réplicas ordenadas. Importe-o de `@earendil-works/chord/delta`.

A imutabilidade é um contrato de propriedade. Nada é congelado ou copiado defensivamente,
então uma mutação ilegal não é detectada. Ela corrompe o estado silenciosamente.

```ts
import { applyImmutable, applyImmutableBatches, track } from "@earendil-works/chord/delta";

const initial = { output: "", entries: [] as { id: number }[] };
const tracker = track(initial); // `initial` is transferred: never mutate it again

const change = tracker.beginChange();
change.state.output += "done\n"; // the draft is mutable only while the change is open
change.state.entries.push({ id: 1 }); // placed values are cloned; the caller keeps its object
const prepared = change.prepare(); // draft handles are unusable from here on

// tracker.value, prepared.base, prepared.value, and prepared.ops (including paths
// and payloads) are immutable by contract.
tracker.adopt(prepared); // tracker.value === prepared.value

// Shares containers with prepared.base and the op payloads: never mutate it either.
const replica = applyImmutable(prepared.base, prepared.ops);
```

## Direitos de mutação

| Valor | Pode sofrer mutação? |
| --- | --- |
| Root passado para `track()`, `prepareReplace()`, `replicatedState()`, ou `replace()` | Não. A propriedade foi transferida para o tracker. |
| `change.state` e handles lidos a partir dele | Sim, apenas enquanto essa mudança estiver aberta. Após `prepare()`, `abort()`, ou outra adoção, todo uso lançará erro. Escritas através de um handle cujo elemento foi removido do draft são ignoradas. |
| Valor externo após ser atribuído ou inserido em um draft | Sim. O draft armazenou um clone validado. |
| `tracker.value`, `prepared.base`, revisões mais antigas retidas | Não. |
| `prepared.value`, `prepared.ops`, tuplas op, paths, permutações, payloads | Não. Os payloads podem ser os mesmos objetos que partes de `prepared.value`. |
| Entradas e resultado de `applyImmutable()` / `applyImmutableBatches()` | Não. O resultado compartilha contêineres com ambas as entradas. |
| Valores do estado replicado (`value`, valores de listener, consumidores de loopback) | Não. Consumidores em processo podem compartilhar os contêineres do provedor. |
| Réplica mutável passada para `apply()` | Apenas através de `apply()`, com batches que ele possui exclusivamente. Código que a edita entre batches quebra a convergência. |
| Batch passado para `apply()` | Consumido. `apply()` adota os contêineres de payload na réplica. Use uma cópia desanexada para exatamente uma réplica e nunca a toque novamente. |

## Reexecutando lotes

O replay imutável é o caminho in-process preferido. Um batch pode se expandir (fan out) para qualquer
número de réplicas imutáveis:

```ts
let replica = tracker.value; // shared with authority; never mutated
// For each adopted batch, in order:
replica = applyImmutable(replica, prepared.ops); // replica must equal prepared.base
```

Quando apenas o resultado final de um backlog ordenado é necessário, reexecute seus batches
sem concatenar suas operações. Um escopo de copy-on-write é compartilhado em toda
a chamada completa, então nenhuma revisão intermediária é exposta ou é segura para reter:

```ts
replica = applyImmutableBatches(
  replica,
  queuedFrames.map((frame) => frame.ops),
);
```

Use chamadas separadas de `applyImmutable()` quando cada revisão intermediária for
publicada ou retida.

O replay mutável precisa de um starting root desanexado e uma cópia desanexada de cada batch
para cada réplica. Nunca aplique um batch em memória para duas réplicas mutáveis:

```ts
import { apply } from "@earendil-works/chord/delta";

const detach = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let replica = detach(tracker.value); // exclusively owned starting root
// For each adopted batch, in order:
replica = apply(replica, detach(prepared.ops)); // fresh copy for this replica only
// Only apply() may change `replica`; do not edit it in application code.
```

Analisar (parsing) uma mensagem serializada separadamente por réplica também é um detachment válido.
`decode()` não copia payloads, então decodificar um `WireOp[]` em memória para duas
réplicas mutáveis as fará criar alias uma da outra.

## O que fazer e o que não fazer

- Crie um root novo e então transfira-o; valide roots não confiáveis no seu limite de ingestão (ingestion boundary).
- Mantenha o compartilhamento estrutural (structural sharing) entre revisões, por exemplo `replace(ctx, { ...state.value, changed })`.
- Clone ou serialize antes de entregar qualquer valor publicado para código que possa mutá-lo.
- Finalize cada mudança com `prepare()` ou `abort()`.
- Não reutilize um contêiner em dois lugares em um root transferido.
- Não sofra mutação de nada que o tracker possua, tenha publicado ou recebido de um batch.
- Não guarde handles de draft após sua mudança ou coloque um handle que já foi finalizado (settled).
- Não infira significado do formato do op. Apenas o valor resultante é contratual.

## Roots e placements

Roots completos são confiáveis. `track()` e `prepareReplace()` tomam posse em O(1)
e nunca percorrem a árvore (walk the tree). Roots devem ser JSON estrito, acíclico e livre de aliases: arrays simples e densos, objetos simples ou sem protótipo (null-prototype) com propriedades de dados (data properties) próprias e enumeráveis, strings, booleanos, números finitos e `null`. Violações têm
comportamento não especificado. Por exemplo, um contêiner compartilhado por duas chaves pode fazer com que
`prepared.value` divirja do que as réplicas calculam a partir de `prepared.ops`.

Placements de draft são copiados, e esse percurso (walk) de cópia também valida. Placements vêm
de escritas de propriedades, escritas de índice, `push`, `unshift`, `splice`, `fill` e
`copyWithin`. Um valor não-estrito lança `TypeError` antes que o draft mude;
por exemplo, `push(valid, invalid)` não insere nada. Valores rejeitados incluem:
ciclos, accessors (nunca invocados), chaves symbol, instâncias de classes, arrays esparsos ou
não-simples, funções, bigint, `NaN`, infinitos e `undefined`.
Objetos null-prototype são aceitos e preservados. Posicionar um handle de draft clona
seu conteúdo atual. Posicionar um valor em várias paths produz contêineres independentes.

Regras de `undefined`:

- `draft.obj.key = undefined` exclui `key`.
- `arr[i] = undefined`, `push(undefined)`, `unshift`, `splice` e `fill` com `undefined` lançam erro.
- `undefined` aninhado em qualquer lugar dentro de um objeto ou array posicionado lança erro. Ele não é descartado como o `JSON.stringify` faz.

Arrays continuam densos. Escrever além do próximo índice e excluir um elemento lançam erro.
Aumentar o `length` insere `null`; encolhê-lo remove elementos.

## Ciclo de vida (Lifecycle)

`tracker.value` é a última revisão adotada. `beginChange()` abre um overlay
draft sobre ela e nunca a modifica. Um draft pode permanecer aberto através de um `await`.
`prepare()` materializa o candidato e os ops e não altera a autoridade.
`adopt()` verifica a preparação e troca o ponteiro do root.

Várias mudanças podem ser abertas ou preparadas a partir de uma revisão. Adotar uma torna todas as
outras obsoletas (stale): drafts abertos tornam-se inutilizáveis e seu `prepare()` lança erro, e
concorrentes preparados são rejeitados por `adopt()`. `adopt()` também rejeita preparações externas,
abortadas e já consumidas. `Change.abort()` ou
`Prepared.abort()` após `prepare()` impede a adoção. O candidato continua
legível.

Batches sem operação (no-op):

- `ops` vazio significa `prepared.value === prepared.base`. Escritas restauradas para seu valor original e atribuições de contêiner profundamente iguais (deeply equal) geralmente são normalizadas para vazias.
- A igualdade ignora a ordem da chave e o protótipo. Uma atribuição profundamente igual mantém a ordem e o protótipo da revisão anterior, mesmo que o draft tenha mostrado os novos.
- Edições estruturais de array podem emitir um exact batch não vazio mesmo quando o resultado for profundamente igual.
- Adotar um no-op ainda avança `tracker.revision` e torna obsoletos os concorrentes. O estado replicado não publica no-ops.

`prepareReplace(value)` é uma operação de root inteiro, não um diff. Se `value` for
profundamente igual ao root atual, `ops` ficará vazio e o root atual será mantido
(a comparação pode atravessar ambas as árvores). Caso contrário, `ops` será `[["r", value]]`
e `prepared.value === value`, para que as réplicas recebam o root completo.

Mutators de array: `push`, `pop`, `shift`, `unshift`, `splice`, `reverse`, `sort`,
`fill`, e `copyWithin`. Os handles retidos acompanham os elementos através da reindexação.

## Operações

As paths contêm chaves de objeto e índices de array de inteiros não negativos.

| Tupla | Significado |
| --- | --- |
| `["r", value]` | Substitui o valor completo. |
| `["s", path, value]` | Define uma propriedade de objeto ou elemento de array. |
| `["d", path]` | Exclui uma propriedade de objeto ou remove um elemento de array. |
| `["a", path, text]` | Acrescenta a uma string. |
| `["t", path, count]` | Remove `count` unidades de código UTF-16 do início de uma string. |
| `["p", path, index, remove, items]` | Executa o splice de um array. |
| `["m", path, permutation]` | Reordena um array: `new[i] = old[permutation[i]]`. |

Batches são exatos mas não canônicos. A mesma mudança pode usar tuplas diferentes,
e grandes conjuntos de edição podem ser combinados (fold) em uma região splice, um ancestral `s`, ou `r`.

Chaves reservadas: o tracker nunca emite `__proto__`, `constructor` ou
`prototype` como um segmento de path. Uma mutação em ou abaixo de tal chave é combinada (folded) em um
conjunto (set) do ancestral seguro mais próximo, ou `r` na raiz (root). `apply()`, `applyImmutable()`, `applyImmutableBatches()`, e `decoder()` rejeitam
esses segmentos com `UnsafePathError`.
Os appliers escrevem valores como propriedades de dados próprias (own data properties), nunca por meio de um setter de prototype.
Os appliers verificam a forma do op e a segurança da path, mas não a estrita do payload (payload strictness). As réplicas
de estado replicado do Chord validam cada revisão resultante.

`encoder()` interna paths repetidas em tuplas `WireOp`; `decoder()` valida
e restaura tuplas `Op`. Use um par encoder/decoder por fluxo (stream) de estado ordenado.
Os IDs de path abrangem batches e um `r` redefine ambos os dicionários. Após um erro de decode ou
apply, descarte o decoder e a réplica e recupere-se de um `r` posterior.

## Limites e footguns

- Sem congelamento (freezing). Mutar qualquer valor imutável corrompe o estado silenciosamente.
- Compartilhamento de loopback (Loopback sharing): consumidores de serviço in-process podem receber os contêineres do provedor. Uma mutação do consumidor corrompe a autoridade e faz com que as réplicas remotas divirjam.
- Uma mudança dentro de um array plano (flat array) grande copia o armazenamento do ponteiro desse array para a nova revisão.
- A validação de placement custa tempo e memória em inserções em massa. Em um benchmark que fez unshift de objetos de três campos de 100 mil (100k), foram adicionados cerca de 19 ms e 20 MiB de heap transitório.
- Proxies externos como placements, callbacks de coerção de argumentos que mutam o draft, índices de array não-primitivos e resultados de comparadores não numéricos estão fora do contrato. Assim como comparadores de sort (sort comparators) que preparam (prepare), abortam ou adotam. O comportamento é não especificado.
- A identidade do objeto não é replicada. Cada path é um placement de valor independente.
- Um tracker é uma sequência de revisão. A ordem de entrega e a persistência pertencem ao protocolo circundante.
