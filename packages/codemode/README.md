# @earendil-works/3pi-codemode

Executa código JavaScript escrito pelo modelo em uma QuickJS VM (compilado em WebAssembly) onde a única capacidade é chamar as ferramentas injetadas (injected tools). As chamadas de ferramentas aninhadas nunca entram no contexto do LLM; apenas a saída (output) do script e o valor de retorno o fazem.

Os scripts utilizam `tools`, `ALL_TOOLS`, `text`, `image`, `exit`, `store`, e `load`, e podem começar com uma linha `// @options:`. O agente de codificação (coding agent) usa-o para a sua ferramenta `codemode` integrada. Ele não tem dependências pi e pode ser usado por si só para expor quaisquer funções (APIs remotas, servidores MCP, serviços de aplicativos) a scripts escritos pelo modelo.

## Uso

```ts
import { CodemodeSandbox } from "@earendil-works/3pi-codemode";

const sandbox = new CodemodeSandbox({
	timeoutMs: 60_000,
	tools: [
		{
			name: "read",
			execute: async (args, { signal }) => {
				const { path } = args as { path: string };
				return await readFile(path, "utf8");
			},
		},
	],
});

const result = await sandbox.execute(`
	const source = await tools.read({ path: "package.json" });
	text("bytes " + source.length);
	return JSON.parse(source).name;
`);

console.log(result.output); // [{ type: "text", text: "bytes 1234" }]
if (result.ok) console.log(result.value); // "@earendil-works/3pi-codemode"
else console.error(result.error.kind, result.error.message);

await sandbox.close();
```

`code` é o corpo (body) de uma função async: `return` e o top-level `await` funcionam. Dentro do script:

- `tools.<name>(args)` retorna uma promise. Argumentos e resultados fazem uma viagem de ida e volta (round trip) no JSON. Uma ferramenta (tool) que lança erro rejeita com um `Error` que carrega a mesma mensagem. Os nomes das ferramentas também são expostos como identificadores: caracteres que não são válidos em identificadores tornam-se `_` (`toCodemodeIdentifier`), de modo que `my-tool` é `tools.my_tool` assim como `tools["my-tool"]`.
- `ALL_TOOLS` lista `{ name, description }` para cada ferramenta, com `name` sendo o identificador.
- `text(value)` adiciona (appends) um item de texto a `result.output`; valores que não são strings recebem JSON-stringify. `console.log/info/warn/error/debug` adicionam itens de texto com `console: true`.
- `image(urlOrItem)` adiciona um item de imagem. Ele aceita uma base64 `data:` URL, `{ image_url }`, ou um bloco MCP `ImageContent` (`{ type: "image", data, mimeType }`). URLs remotas são rejeitadas.
- `exit()` finaliza o script com sucesso imediatamente, mantendo suas saídas e gravações da store.
- `globals` passados para a sandbox são chamados como funções top-level, por exemplo, um auxiliar (helper) de host `image(ref)`. Eles se comportam como ferramentas, mas não são registrados em `result.calls`. Um nome como `models.classify` coloca a função num objeto `models` congelado. Com `spread: true`, o `execute` recebe todos os argumentos de chamada como um array em vez do primeiro argumento, e a `signature` substitui a declaração gerada a partir dos schemas.
- `store(key, value)` e `load(key)` lêem e gravam valores JSON de forma síncrona. Consulte [Store](#store).
- Nada mais: sem timers, `fetch`, `process`, `require`, módulos ou `WebAssembly`. `eval` e `Function` funcionam, mas só produzem mais código dentro da mesma VM.

`timeoutMs: Infinity` desativa o prazo final (deadline); o script será executado até ser resolvido (settle) ou o sinal `signal` abortá-lo. Um script que espera por uma promise que nada consegue resolver (nenhuma chamada de ferramenta pendente e a VM não tem cronômetros ou I/O) falha imediatamente, em vez de travar (hanging).

`memoryLimitBytes` limita (caps) o heap da VM. Alocações além desse limite falham dentro do script como `InternalError: out of memory`.

## Store

`store`/`load` permitem que scripts mantenham valores em todas as execuções (executions). A própria sandbox não persiste nada: passe os valores atuais como `options.store`, e um resultado bem-sucedido informará o que o script alterou na forma de `result.storeWrites` (`{ set, delete }`). Execuções com falha não relatam nenhuma gravação.

```ts
const result = await sandbox.execute(`store("runs", (load("runs") ?? 0) + 1)`, { store: saved });
if (result.ok) {
	for (const key of result.storeWrites.delete) delete saved[key];
	Object.assign(saved, result.storeWrites.set);
}
```

O `load` retorna uma cópia, portanto, sua mutação não altera a store. Armazenar (storing) `undefined` exclui a chave. Um valor pode ter no máximo `MAX_STORE_VALUE_CHARS` (256 Ki) caracteres de JSON e todos os valores combinados (together) no máximo `MAX_STORE_TOTAL_CHARS` (1 Mi); gravações maiores lançam um `RangeError` no interior do script.

## Formato de código fonte (Source format)

`parseCodemodeSource()` aceita um script cuja primeira linha pode ser uma linha de opções (options line):

```js
// @options: {"max_output_tokens": 2000, "timeout_ms": 30000}
const source = await tools.read({ path: "package.json" });
text(JSON.parse(source).name);
```

Os campos suportados são `max_output_tokens`, um orçamento de token para o resultado, e `timeout_ms`, um limite de tempo (deadline) estrito. A sandbox não atua sobre eles; quem chama (the caller) é que decide. A linha de opções é substituída por uma linha vazia, de modo que os números de linha nos rastreamentos de pilha (stack traces) correspondam à entrada (input). Uma entrada vazia, um JSON inválido, campos desconhecidos ou uma linha de opções sem código lança o `CodemodeSourceError`. O `CODEMODE_SOURCE_GRAMMAR` é uma gramática do Lark (Lark grammar) para provedores (providers) que dão suporte a entradas de ferramentas restringidas por gramática (grammar-constrained tool input). Ambos estão também disponíveis através da leve (lightweight) entrada `@earendil-works/3pi-codemode/source`.

## Hosts empacotados (Bundled hosts)

Por padrão, a sandbox carrega o arquivo `quickjs-wasi/quickjs.wasm` do pacote instalado e inicia o arquivo do trabalhador (worker file) que se encontra junto ao módulo deste pacote. Nenhum deles existe no disco (disk) quando o host é agrupado (bundled), por isso você deve passar os dois:

```ts
import { CodemodeSandbox, loadQuickJSWasm } from "@earendil-works/3pi-codemode";

const sandbox = new CodemodeSandbox({
	tools,
	// Compiled once per path and cached.
	wasm: loadQuickJSWasm(pathToQuickJSWasm),
	// A file of your build containing `import "@earendil-works/3pi-codemode/worker";`
	workerUrl: new URL("./codemode-worker.js", import.meta.url),
});
```

`workerUrl` aceita uma URL ou uma string. Para um executável compilado por Bun, inclua o trabalhador (worker) como um ponto de entrada (entrypoint) adicional no pacote (build) e passe sua path de origem relativa como string, por exemplo
`"./src/codemode-worker.ts"`; Bun resolverá esse formato a partir de seu grafo de módulos (module graph) integrado.

## Declarações para o modelo (Declarations for the model)

Tools e globals podem conter `description`, `inputSchema`, e `outputSchema` (JSON Schema). `renderDeclarations()` as converte em declarações (declarations) TypeScript para uma descrição de ferramenta voltada ao modelo (model-facing tool description):

```ts
renderDeclarations({ tools: sandbox.tools, globals: sandbox.globals });
// declare const tools: {
//   /** Read a file */
//   read(args: {
//     path: string;
//   }): Promise<string>;
// };
```

Os schemas modelam as declarações apenas; valores não são validados através deles. As referências locais (local references) (`#/$defs/...`, `#/definitions/...`) são expandidas; as referências recursivas (recursive) e remotas (remote) são expostas como `unknown`.

## Usando junto ao pi-agent-core

Para dar a um `Agent` uma ferramenta codemode, exponha suas outras ferramentas para a sandbox e coloque o `execute()` dentro de um `AgentTool`:

```ts
import type { AgentTool } from "@earendil-works/3pi-agent-core";
import {
	type CodemodeJsonSchema,
	CodemodeSandbox,
	type CodemodeTool,
	renderDeclarations,
} from "@earendil-works/3pi-codemode";
import { Type } from "typebox";

const sandboxTools: CodemodeTool[] = agentTools.map((tool) => ({
	name: tool.name,
	description: tool.description,
	inputSchema: tool.parameters as CodemodeJsonSchema,
	outputSchema: (tool.outputSchema as CodemodeJsonSchema | undefined) ?? { type: "string" },
	execute: async (args, { signal }) => {
		const result = await tool.execute("nested", args as never, signal);
		if (tool.outputSchema && result.structuredContent !== undefined) return result.structuredContent;
		return result.content.map((block) => (block.type === "text" ? block.text : "")).join("\n");
	},
}));

const codemodeTool: AgentTool = {
	name: "codemode",
	label: "Codemode",
	description: `Run JavaScript that calls tools as \`await tools.<name>(args)\`. Output with text() or return.\n\n${renderDeclarations({ tools: sandboxTools })}`,
	parameters: Type.Object({ code: Type.String() }),
	execute: async (_toolCallId, { code }, signal) => {
		const sandbox = new CodemodeSandbox({ tools: sandboxTools });
		try {
			const result = await sandbox.execute(code, { signal });
			const content = [...result.output];
			if (result.ok && result.value !== undefined) content.push({ type: "text", text: JSON.stringify(result.value) });
			if (!result.ok) content.push({ type: "text", text: result.error.stack ?? result.error.message });
			return { content, details: undefined, isError: !result.ok };
		} finally {
			await sandbox.close();
		}
	},
};
```

Os itens em `result.output` já se configuram como os formatos (shape) `TextContent` e `ImageContent` de `@earendil-works/3pi-ai`. O acionamento de `tool.execute()` diretamente pula os hooks `beforeToolCall` e `afterToolCall` do agente. Para aplicá-los de maneira análoga nas chamadas aninhadas, encaminhe cada chamada através de `runToolCall()` de `@earendil-works/3pi-agent-core`, como no exemplo de [mcp-codemode](https://github.com/earendil-works/pi/tree/main/packages/agent/examples/mcp-codemode). Tal exemplo inclusive bloqueia as chamadas aninhadas (nested calls) reprovadas durante a operação do script, engajando (combining) ferramentas de codemode junto de ferramentas MCP (MCP tools).

## Resultados

`execute()` nunca rejeita (reject) em caso de falha de script (script failures). `result.error.kind` corresponde a algum dos:

| kind      | significado (meaning)                                                                     |
| --------- | --------------------------------------------------------------------------- |
| `script`  | o script lançou um erro ou falhou ao analisar; `stack` aponta para `codemode.js:<line>` |
| `timeout` | o tempo limite excedeu; o worker foi cancelado (terminated)                 |
| `aborted` | `options.signal` acionou ou foi chamado o `close()`; o worker foi encerrado (terminated) |
| `sandbox` | o worker ou a VM falhou; como em caso de problema com wasm (wasm trap) ou de falta de um worker file (arquivo ausente) |

`result.output` traz as mensagens de textos (text items) e imagens na ordem em que elas são emitidas pelo script (inclusive para casos que falham - failed executions). O provedor (host) guarda as referidas mensagens por inteiro a menos que a instrução resulte encerrada. Logo o seu conteúdo de output não avança (limited to) `MAX_OUTPUT_CHARS` (16 Mi) letras ou textos e dados em imagens com codificação base64 (base64 image data) e nem avança sobre `MAX_OUTPUT_ITEMS` (100000) elementos. Atravessando o teto das métricas descritas (Past either limit) o código emite erro associado ao `RangeError`, mesmo nos cenários de captação de falha (catches the error). A variável `result.calls` indica, sobre cada um dos comandos (tools) acessados via tool call: `status: "ok" | "error" | "cancelled"`. Aquela ferramenta não aguardada por instrução ao devolver uma informação em sua rotina (not awaited) finaliza abortada ao cruzar por um sinal (tool's signal) originando assim sua configuração de notificação pelo estado de cancelada (`cancelled`).

## Como funciona

Todo `execute()` provoca uma thread específica do tipo worker ou de suporte (o que costuma computar ~20 milésimos, abrangendo os esforços com relação a fundação do suporte associado a uma QuickJS VM a partir da interface originada e compilada em formato wasm (compiled wasm module)). Aquela mesma VM é tida enquanto uma subunidade com autonomia linear por endereço na sua reserva de memória e, com exceção da biblioteca (WASI shim) direcionada a atividades básicas operacionais (clock, random, stdout/stderr — rejeitados em sua extensão pelo worker file correspondente) unicamente apresenta ao longo da conexão interfaceada com host-call o fato impeditivo a scripts se cruzarem pela estrutura hospedeira de funções que não aquelas dispostas na matriz do suporte trabalhador correspondente (functions the worker registers).

Esse avaliador atrelado ao módulo e ao contexto restringe e constrói de forma hermética cada acesso global na VM (incluindo `tools`, `console`, e etc) sob os limites do sistema enclausurado. Cada linha elaborada compila seu código junto ao body originário, através do async correspondente.

Toda instrução voltada à busca via tool remete a interface host por via de mensagens operadas. Nesse fluxo contínuo processado o mesmo responde os dados json ao retorno associado em requisição, garantindo ao limite o uso por controle temporal à ação por prazos ou interrupções. Toda chamada cruzada no limite imposto obriga (aborts) acionando, então, a VM sobre (polling flags) o compartilhamento contínuo das bandeiras antes associadas ao momento `worker.terminate()`. Tal sinal indica indispensável importância sob Bun a partir das incompatibilidades geradas caso tal rotina seja feita durante as contínuas rodadas operadas (loop/spinning operations) que possam prender e inviabilizar em termos computacionais os caminhos (while true/await) acionados na base da máquina gerida por interfaces tipo wasm (spinning in wasm).

## Notas de tempo de execução (Runtime notes)

- O funcionamento assemelha-se entre plataformas (Node ou Bun) sob métricas equivalentes à interrupções e contenções do limite (`RangeError`). Vale menção: o acompanhamento contra exaustão via `QuickJS stack guard` compõe ativamente o controle por proteção; se bloqueado as consequências do processamento induzirão a armadilhas de fluxo em sobrecarga (stack overflows and traps).
- O tracejamento estruturado pelas (stack traces) no QuickJS induz formatação descrita através de limites assinalados: `at f (codemode.js:2:31)`. Semelhanças apontadas em prefixo: `Name: message` atrelam seu uso próximo da engine padrão V8, compartilhando de correta referência com base 1 por linhagens e correções ao rastreamento a nível colunar.
- Por pertencer a categoria interpretativa, a plataforma aponta aos usos integrativos (glue code) ou avaliações diretas os caminhos operacionais aceitáveis. Todavia, aprofundamentos por cálculos intensivos são executados mediante perda associada perante (slower than) em comparação ao modelo tipo V8.
