# Codemode

A ferramenta `codemode` permite que o modelo escreva um script em JavaScript que chama as outras ferramentas (tools) do pi e executa modelos não LLM, como classificadores e modelos de imagem. Apenas a saída do script chega ao modelo, então um script pode executar chamadas em paralelo e filtrar resultados grandes antes que o modelo os veja. Para ativá-lo, veja [Habilitar codemode](cli.md#enable-codemode).

## Scripts

A entrada da ferramenta é o código-fonte bruto em JavaScript, não JSON e não uma cerca de código (code fence) markdown. Ele roda como o corpo de uma função assíncrona em uma sandbox QuickJS, então `await` e `return` no nível superior funcionam. A sandbox não tem APIs do Node, sistema de arquivos, rede ou temporizadores (timers); os scripts alcançam o mundo externo apenas através das ferramentas e de `models`.

Um script pode começar com uma linha de opções:

```js
// @options: {"max_output_tokens": 2000, "timeout_ms": 60000}
```

- `max_output_tokens` (padrão 10000) limita a saída. Uma saída mais longa mantém seu início e fim, e o texto completo é escrito em um arquivo temporário cujo caminho é incluído no resultado. Um script falha quando sua saída ultrapassa 16777216 caracteres de texto e dados de imagem em base64 ou 100000 chamadas a `text()`, `image()` e `console`; escreva dados muito grandes em um arquivo com uma ferramenta em vez disso.
- `timeout_ms` é um prazo rígido para todo o script. Fica indefinido por padrão. A geração de imagens pode levar minutos, portanto, não defina um prazo curto para scripts que geram imagens.

O resultado começa com `Script completed` ou `Script failed`, o wall time (tempo real) e a saída. Itens de texto e imagem aparecem em ordem, cada um em sua própria linha. Quando a saída possui mais de um item de texto (de `text()` ou `return`), cada um começa com uma linha `==> text N/M <==`. As chamadas de `console` seguem em um bloco `<console_output>` com uma linha por chamada. Um script que falha mantém sua saída parcial, seguido por `Script error:` e o erro. As chamadas de ferramenta são reais: chamadas feitas antes de uma falha não são desfeitas. Chamadas que ainda estão em execução quando o script termina são canceladas, e promessas não resolvidas são descartadas.

## Globais

| Global | Propósito |
|---|---|
| `tools.<name>(args)` | Chamar uma ferramenta. Veja [Chamar ferramentas](#call-tools). |
| `text(value)` | Adicionar um item de texto à saída. Strings são adicionadas como estão, outros valores como JSON. |
| `image(value)` | Adicionar uma imagem à saída: uma URL base64 `data:`, um objeto `{ image_url }`, ou um bloco de imagem `{ type: "image", data, mimeType }` como os retornados por ferramentas MCP e `models.generateImages()`. URLs remotas não são suportadas. PNG, JPEG, GIF e WebP são aceitos. Cada imagem também é salva em um arquivo temporário, e o resultado exibe o caminho antes da imagem. |
| `console.log(...)` | Adicionar uma linha ao bloco `<console_output>` após as outras saídas. Argumentos são unidos com espaços; `info`, `warn`, `error` e `debug` fazem o mesmo. |
| `return value` | Um `return` no nível superior adiciona o valor como `text()`. |
| `exit()` | Terminar o script com sucesso. |
| `store(key, value)` / `load(key)` | Manter valores JSON pequenos através de chamadas de `codemode`. Veja [Armazenar valores](#store-values). |
| `ALL_TOOLS` | Toda ferramenta que pode ser chamada como `{ name, description }`, incluindo ferramentas que a descrição não lista. |
| `searchTools(query, { limit?, namespace? })` | Classificar as ferramentas chamáveis por relevância (BM25, limite padrão 8). Resolve para `{ name, description }[]`. |
| `describeTool(name)` | Resolve para a descrição e declaração TypeScript de uma ferramenta, ou `undefined`. |
| `describeNamespace(name)` | Resolve para `{ name, description?, instructions?, tools }` para um namespace como um servidor MCP, ou `undefined`. |
| `models` | Listar e executar modelos não LLM. Veja [Modelos](#models). |

## Chamar ferramentas

Toda ferramenta que a sessão pode chamar é um método de `tools`, nomeado pelo seu identificador: caracteres que não são válidos em um identificador JavaScript se tornam `_`, então a ferramenta MCP `mcp__dev-radius__search` passa a ser `tools.mcp__dev_radius__search`. Cada método recebe um objeto com os argumentos da ferramenta.

Para o que uma chamada resolve depende da ferramenta:

- Ferramentas com um esquema de saída (output schema) resolvem para um valor estruturado. `bash` resolve para `{ output, truncated, full_output_path?, exit_code, wall_time_seconds }`, inclusive para códigos de saída diferentes de zero. Seu `output` não é limitado às 2000 linhas ou 50KB que o modelo vê: ele guarda até 1 MiB, e saídas maiores mantêm seus primeiros e últimos 512 KiB em torno de um marcador de omissão, com `truncated` definido e a saída completa no `full_output_path`.
- As ferramentas MCP resolvem para o seu `CallToolResult`, incluindo `isError` e `structuredContent`.
- `read` resolve para o texto do arquivo, ou, no caso de uma imagem, para um bloco de imagem `{ type: "image", data, mimeType, note }` que o `image()` mostra. `data` é a imagem base64 que o modelo veria e `note` é o texto que a acompanha, como dicas de redimensionamento.
- Outras ferramentas, como `edit` e `write`, resolvem para a sua saída em texto.

Uma chamada que falha, é bloqueada ou recebe argumentos inválidos rejeita com um `Error` que carrega o texto de erro da ferramenta. Use `Promise.allSettled()` para manter os resultados das chamadas que forem bem-sucedidas.

A descrição de `codemode` lista as ferramentas com suas declarações em TypeScript, agrupadas por namespace (por exemplo, um servidor MCP). Ferramentas com exposição `deferred` (diferida), que incluem as ferramentas MCP com a exposição padrão `codemode`, não são listadas, de modo que a descrição se mantém a mesma enquanto os servidores MCP se conectam. As declarações listadas compartilham um orçamento de 3000 tokens estimados (`codemode.inlineBudget` nas [configurações](settings.md#tools)). Os scripts encontram as outras ferramentas com `searchTools()`, `describeTool()`, `describeNamespace()` ou filtrando `ALL_TOOLS`.

Enquanto o `codemode` estiver ativo, o `codemode.mode` nas [configurações](settings.md#tools) decide como as demais ferramentas são apresentadas. Com `on` (padrão), as ferramentas declaradas permanecem declaradas e suas descrições informam como chamá-las a partir de scripts. Com `only`, elas são ocultadas do modelo e listadas apenas na descrição do `codemode`, de modo que o modelo passe a chamá-las através dos scripts. As declarações de ferramentas na descrição de `codemode`, em `describeTool()` e em `ALL_TOOLS` carregam as diretrizes de prompt das ferramentas, uma vez que as regras do system prompt cobrem apenas as ferramentas ativamente declaradas.

## Armazenar valores

`store(key, value)` mantém um valor JSON sob uma chave string para chamadas futuras de `codemode`; armazenar `undefined` apaga a chave. `load(key)` retorna o valor armazenado, ou `undefined`. As gravações são mantidas somente quando o script é bem-sucedido: cada script de sucesso que armazena valores acrescenta uma entrada personalizada `codemode-store` na sessão, assim, as sessões retomadas mantêm os valores e cada ramificação vê somente os valores escritos no seu respectivo percurso.

O store serve para estados de tamanho reduzido como IDs, cursores ou resumos. Um único valor pode deter no máximo 262144 caracteres de JSON e todos os valores combinados um total de 1048576 caracteres. Não guarde dados/mídia de imagens no store; exponha as imagens utilizando o `image()`, o qual de quebra também garante que as mesmas sejam devidamente resguardadas a salvo nos arquivos temporários locais.

## Modelos

`models` alcança o catálogo de modelos e roda modelos não LLM com as credenciais da sessão atual: classificadores (classifiers), que respondem a perguntas tipadas sobre estado em JSON e, no caso de alguns modelos, sobre imagens; e modelos de imagem (image models), que geram imagens. Os modelos de chat estão todos listados mas não é possível invocá-los pelos scripts diretamente. Quais classificadores ou geradores de imagem estão em vigor e atuantes podem ser consultados via [Uso de modelos classificadores](models.md#use-classifier-models) e em [Uso de modelos geradores de imagens](models.md#use-image-models).

```ts
type ModelType = "chat" | "image" | "classifier";

/** A catalog entry. `provider` and `id` identify it; other fields depend on the type. */
interface ModelInfo {
  type?: ModelType;
  provider: string;
  id: string;
  name: string;
  api: string;
  input: ("text" | "image")[];
  contextWindow?: number;
  [key: string]: unknown;
}

declare const models: {
  /** Every known model of a type, optionally for one provider. */
  getModelsOfType(type: ModelType, provider?: string): Promise<ModelInfo[]>;
  /** Models of a type whose provider has working credentials. */
  getAvailableOfType(type: ModelType, provider?: string): Promise<ModelInfo[]>;
  /** One catalog entry, or undefined. */
  getModelOfType(type: ModelType, provider: string, id: string): Promise<ModelInfo | undefined>;
  /** Answer `context.questions` about `context.state`; answers are in `result.answers` by question ID. */
  classify(model: ModelInfo, context: ClassifierContext): Promise<ClassifierResult>;
  /** Generate images from `context.input` text and image blocks; show `result.output` blocks with image(). Can take minutes. */
  generateImages(model: ModelInfo, context: ImagesContext): Promise<ImagesResult>;
};
```

`classify()` e `generateImages()` utilizam-se unicamente de ambos `provider` e o seu respectivo `id` atrelado no `model`, contudo encaminhar um espelho tipo `{ provider, id }` pode acabar tendo a mesma via em termos efetivos ou validos nesse ponto. Elas evitam e pulam na tentativa e também se poupam perante ao lançamento forçado em face ao lidar lidando diante provedores sob erro nos servidores nativos externos: cheque os campos voltados diretamente focados nas saídas apontados dentro via `stopReason` e logo a seguir pelo corpo correspondente nos logados textuais gerados explicitamente no interior do seu próprio log descritivo, explicitados sob a respectiva rubrica detalhada e transcrita por inteiro sob a insígnia daquele mesmo local de mensagem associada à diretriz batizada no nome por si só atestado por parte e com a titularidade autodenominada pela classe nomeada especificamente nas suas descrições listadas a partir daquilo onde estão designadas sobre os cabeçalhos registrados sob seus parâmetros ditados em relação atreladas aos campos explícitos e dispostos nos limites contidos apontados por lá expostos nas assinaturas descritas em cima das linhas apontadas sob a ótica dessas classes focadas sobre suas respectivas especificidades - o log atestado com a flag predeterminada de erros por `errorMessage`. Restringe as tentativas executadas sendo limitadas por padrão tendo o seu topo num teto fixo configurado tendo o volume estabelecido batendo a barreira restritiva para a contagem da banda a um totalizando a soma englobada sob um agrupamento não estourando os estritos 4 únicos processos contíguos correndo operando simultaneamente todos atuando acionados agindo sob um só comando a partir oriundos unicamente a cada ocorrência isolada, ou de modo fracionado na divisão ou particionamento via processos rodados de um por script respectivo e local gerador único disparador; de forma tal onde as excessos acima das métricas/sufixos quantitativas impostas de contingentes que extrapolarem aquelas citadas restrições impostas vão e precisam acabar caindo forçadamente em filas em forma retida contendo pausas presas de tempo atreladas em tempos que incorrem em aguardos de reaberturas até o destrave visando reabrirem novamente espaços/blocos liberados sob aberturas dos limites nos canais/vias em aberturas das passagens livres e vazias correspondentes na linha por demanda na grade para retomadas; assim sendo as invocações feitas através de loops nas aplicações executadas tendo em vista varreduras/atuações sobre o agrupamento englobando várias promessas assíncronas ativas ou operadas lidando de forma simultânea e/ou lidando também na interação agindo interagindo diante coleções em conjuntos sobre o seu corpo base focada usando no final das contas como via condutiva principal no formato agrupado via `Promise.all()` frente as abordagens ou interações contendo lida de tratos abordando numerosos casos lidando com quantidades ou listas cheias atestam atestam por uma tranquilidade na condução da vida sob esses mesmos trâmites ou situações citadas e relatadas. O dispêndio ou consumo atestado mediante o relatório apurado do emprego final desses expedientes vai ter os seus dados contábeis listados sendo acrescidos anexos associados sob o saldo final das faturas na rubrica do acionamento final nos relatórios focando naquele dado momento com relação a seu acionamento gerador das ferramentas atrelado no resultado em relação da ferramenta principal operando com foco central e alvo atuante perante a ação no acionamento batizada nominada pelas suas propriedades nas suas rubricas sob a aba via `codemode`, os quais terão devidamente computados integrados como montantes e também consolidados perante as tabelas contabilizadas refletindo custos somados atestados e apurados nos valores englobados resultantes em torno final de custos nos fechamentos mensais dos caixas sobre todas das respectivas faturas.

O mapeamentos relativos de credenciais (os números identificadores no corpo a fim das autenticações - IDs de acesso aos respectivos perfis em instâncias) divergem na abordagem atrelada sob vias cruzadas atuando sob a intermediação de serviços paralelos entre terceirizadas entre diferentes e isoladas parceiras terceirizadas nos seus provedores - a título comparativo tem-se por exemplificação casos práticos lidando de ponta-a-ponta variando a sua via em casos oscilando diante ou partindo lidando da ponta do tipo: `typesafe/jev-latest` contra, numa versão comparativa contendo um intermediador atrelado num elo do tipo num esquema parecido por e debaixo sob a aba usando as linhas com caminhos cruzando via `openrouter/typesafe/jev-1.13`... Na dúvida faça e use das propriedades/atributos da linha do serviço executado buscando aplicar os devidos resgates empregando/invocando a respectiva classe/parâmetros em métodos listados do estilo da função/comando formatado via chamada: `models.getAvailableOfType(type)` com a meta/escopo sendo a finalidade do resgate da recuperação de identificações que atestem sua validez funcional diante da checagem em suas interações lidando nos cenários onde houver e contiver preenchidas devidamente fornecidas suas chaves criptografadas (credenciais atuais do momento) condizentes e preenchidas sem falhas relativas em seus conteúdos associados.

### Classify (Classificar)

```ts
interface ClassifierContext {
  /** The data to classify. */
  state: Record<string, unknown>;
  /** Images judged together with `state`. Only models whose `input` includes "image" accept them. */
  images?: { type: "image"; data: string; mimeType: string }[];
  /** Questions by ID. One call answers all of them. */
  questions: Record<string, ClassifierQuestion>;
}

type ClassifierQuestion =
  /** Pick one label. `criteria` maps each label to what it means. */
  | { type: "choice"; instructions: string; criteria: Record<string, string> }
  /** Score on an ordered scale. `criteria` describes each level, lowest first. */
  | { type: "score"; instructions: string; criteria: string[] }
  /** Yes or no. */
  | { type: "bool"; instructions: string; criteria: { true: string; false: string } };

interface ClassifierResult {
  provider: string;
  model: string;
  /** Answers by question ID. */
  answers: Record<string, ClassifierAnswer>;
  usage?: ModelUsage;
  stopReason: "stop" | "error" | "aborted";
  errorMessage?: string;
}

type ClassifierAnswer =
  | { type: "choice"; choice: string; probabilities: Record<string, number>; confidence: number }
  /** `score` is the expected level index, from 0 to `criteria.length - 1`. */
  | { type: "score"; score: number; confidence: number }
  /** Probability of `true`. */
  | { type: "bool"; probability: number };

/** Token counts and cost in USD, when the service reports them. */
type ModelUsage = { input: number; output: number; totalTokens: number; cost: { total: number } };
```

Classifique vários itens chamando `classify()` uma vez por item. Este script ordena mensagens de feedback, por exemplo, aquelas retornadas por uma ferramenta no início do script:

```js
const jev = await models.getModelOfType("classifier", "typesafe", "jev-latest");
const results = await Promise.all(
  messages.map((message) =>
    models.classify(jev, {
      state: { message },
      questions: {
        sentiment: {
          type: "choice",
          instructions: "How does the user feel about the product?",
          criteria: { positive: "Satisfied or happy", negative: "Unhappy or frustrated", neutral: "Neither" },
        },
        urgency: {
          type: "score",
          instructions: "How urgently does this need a reply?",
          criteria: ["no reply needed", "reply this week", "reply today"],
        },
      },
    }),
  ),
);
return results.map((result, i) =>
  result.stopReason === "stop"
    ? { message: messages[i], sentiment: result.answers.sentiment.choice, urgency: result.answers.urgency.score }
    : { message: messages[i], error: result.errorMessage },
);
```

Classificadores cujo `input` inclui `"image"` também julgam imagens. O `tools.read()` retorna um arquivo de imagem como um bloco de imagem que o campo `images` aceita. Outros classificadores retornam um resultado de erro quando `images` não está vazio.

```js
const luna = await models.getModelOfType("classifier", "openai", "gpt-6-luna");
const photo = await tools.read({ path: "screenshot.png" });
const result = await models.classify(luna, {
  state: { task: "Settings page redesign" },
  images: [photo],
  questions: {
    broken: {
      type: "bool",
      instructions: "Does the screenshot show a broken layout?",
      criteria: { true: "Overlapping, cut-off, or misaligned elements", false: "Clean layout" },
    },
  },
});
```

### Gerar Imagens

```ts
interface ImagesContext {
  /** The prompt as text blocks, plus image blocks to edit or use as references. */
  input: (TextBlock | ImageBlock)[];
}

interface ImagesResult {
  provider: string;
  model: string;
  /** Generated images, and text blocks for models that also return text. */
  output: (TextBlock | ImageBlock)[];
  usage?: ModelUsage;
  stopReason: "stop" | "error" | "aborted";
  errorMessage?: string;
}

type TextBlock = { type: "text"; text: string };
/** `data` is base64. */
type ImageBlock = { type: "image"; data: string; mimeType: string };
```

Mostre imagens geradas com `image(block)`. Não faça log nem tente imprimir no output `data` usando `text()`, `console` ou `return`: ele é gigante e o modelo é incapaz de efetuar a devida leitura em formatos estruturados como sendo formatações do tipo puramente originado como strings literais de um texto. O `image()` salva cada gerada individualmente para um documento/arquivo a salvo de caráter temporário isoladamente em caminhos e dispõe sua url ou referência local resultante apontando na frente associado atrelado no momento e em relação ao seu retorno e resultado efetivado gerado em tela; de forma para ser que permita viabilizando as repassagens logo posteriormente via uma etapa sequencial nos turnos ou fluxos rodando subsequentes ou posteriores virem a ter o privilégio e a chance do ato de viabilidade na manipulação ou migrações do trajeto copiando ou movimentando na gestão sob o percurso apontado naquele path o arquivo com destino ao seu final respectivo.

```js
// @options: {"timeout_ms": 300000}
const painter = await models.getModelOfType("image", "openrouter", "google/gemini-2.5-flash-image");
const result = await models.generateImages(painter, {
  input: [{ type: "text", text: "A red fox in the snow, watercolor" }],
});
if (result.stopReason !== "stop") return result.errorMessage;
for (const block of result.output) {
  if (block.type === "image") image(block);
  else text(block.text);
}
```

## Limites

- A VM na qual o script opera porta uma capacidade limitada travada ao teto dos seus respectivos 256 MB nas alocações correspondentes à liberação ao emprego/consumo atrelados voltadas perante a memória de sistema. Um possível ou potencial esgotamento desta resulta diretamente culminando disparando `InternalError: out of memory`; prefira filtragens atuantes e apurações por agregar via sumários perante dados imensos sob a contramão da abordagem na acumulação dos mesmos nas variáveis e contextos de escopos presentes nos percursos efetuados durante a operação destas correntes.
- Os roteiros rodando sob e contendo as aguardadas nas diretrizes ditadas pelas pausas sobre promessas aguardando algo das atuações mas com ausência e inexistência associada ao ato de um encaminhamento na execução chamadas das tarefas englobando `tool call` (ou ainda em falta delas ficando presas pendentes), essas tendem irremediavelmente de praxe estourar de modo prematuro falhando no primeiro lapso imediato sob a face nítida da total supressão ausência explícita imposta por contarem ausentes a disponibilidade e do suporte à lida operada pelos temporizadores/cronometragens na estrutura interna das formatações na sandbox ali estabelecida - `timers`.
- Os scripts encontram se vedados de modo a contarem desabilitados sendo incapacitados mediante a deflagrarem os comandos em prol do começo impulsionando os envios no acionamento nos direcionamentos ordenados focados para a invocação da geração executada aos arranques das inicializações por debaixo via cascatas deflagrando aberturas em cima ou sob as asas atreladas gerando arranques/acoplamentos em mais aberturas rodando outros roteiros scripts batizados no seu agrupamento da família em `codemode` alheios isolados.
