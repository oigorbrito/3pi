# Pi evals

Evals comportamentais para o coding agent do Pi, construídos com `vitest-evals`.

## File conventions

As definições de eval são planas sob `evals/`:

- `*.docs.eval.ts` é um eval de elevação (lift) de documentação. `eval:docs` roda cada caso em containers isolados `without_docs` e `with_docs` e relata o lift.
- Outros arquivos `*.eval.ts` são evals de host. `eval:host` roda-os com Vitest nesta máquina. Eles são suítes comuns do vitest-evals, não comparações pareadas.

O código do runner fica em `src/`:

- `cli.ts` orquestra uma comparação
- `docker.ts` faz o build das duas imagens, descobre os casos e roda um braço isolado
- `plan.ts` expande os casos em tarefas `(case, variant, repetition)`
- `report.ts` lê o JSON do Vitest, pareia os braços e calcula o lift
- `harness.ts` é o adaptador do vitest-evals

As suítes de eval e seus fixtures ficam sob `evals/`. Os arquivos de build de imagem ficam em `docker/`.

## Run evals

Evals de host (smoke, auditoria de documentação) e evals de lift de documentação precisam de `PI_PROVIDER` e `PI_MODEL`.

```bash
PI_PROVIDER=openai-codex PI_MODEL=gpt-5.6-sol npm run eval -w packages/evals
```

Isso roda os evals de host e, em seguida, a comparação de documentação. Flags extras da CLI após `--` vão apenas para `eval:docs`.

Host only:

```bash
PI_PROVIDER=openai-codex PI_MODEL=gpt-5.6-sol npm run eval:host -w packages/evals
```

Uma suíte host:

```bash
PI_PROVIDER=openai-codex PI_MODEL=gpt-5.6-sol \
  npm run eval:host -w packages/evals -- evals/documentation-audit.eval.ts
```

## Run documentation comparisons

A partir da raiz do repositório:

```bash
npm run eval:docs -w packages/evals -- \
  --provider openai-codex \
  --model gpt-5.6-sol
```

`PI_PROVIDER` e `PI_MODEL` fornecem os mesmos defaults. Ambos os valores são obrigatórios.

O padrão é uma execução por variante (variant). Aumente as repetições explicitamente ao medir a estabilidade:

```bash
npm run eval:docs -w packages/evals -- \
  evals/extensions.docs.eval.ts \
  --runs-per-variant 5
```

`PI_EVAL_RUNS_PER_VARIANT=5` é equivalente. Filtros do Vitest são aplicados durante a descoberta:

```bash
npm run eval:docs -w packages/evals -- -t "adds the model"
```

O runner:

1. Monta o repositório de forma efêmera para um build Docker, empacota os packages atuais do workspace usando o maquinário de instalação consumer do repositório, e então cria imagens separadas `without_docs` e `with_docs` a partir do runtime em staging.
2. Descobre os casos selecionados em ambas as imagens e requer coortes idênticas.
3. Planeja cada braço `(case, variant, model, runNumber)` antes da execução.
4. Roda cada braço em um container novo. Um braço ausente ou com falha é registrado e a coorte planejada continua.
5. Lê o JSON nativo do Vitest através de `@vitest-evals/core/node` quando um relatório existe.
6. Pareia os braços exatos e escreve o relatório de comparação. Pares bloqueados retêm o lift de destaque (headline); o processo termina com saída não-zero.

A ordem de repetição se alterna pelo número da execução para reduzir o viés de ordem.

## Documentation variants

`without_docs` omite o `README.md` do coding-agent, `CHANGELOG.md`, `docs/` e `examples/`, e então remove a seção de roteamento de documentação do Pi do system prompt padrão.

`with_docs` inclui esses arquivos e usa o prompt padrão inalterado.

Ambas as variantes instalam os mesmos tarballs locais do workspace. Overrides existentes do npm garantem que as dependências internas do Pi do coding-agent também venham do repositório atual em vez do registry. Documentação e arquivos fonte de packages de dependência interna são removidos simetricamente para que não possam atuar como instruções alternativas. A inicialização valida a allowlist da imagem e verifica se o package coding-agent instalado resolve a partir de `dist/`. Definições de eval, helpers de evaluator, fixtures e configurações do Vitest são propriedade do root e ficam ilegíveis depois que o harness cai permanentemente para um UID sem privilégios. Cada execução recebe um novo home, diretório do agent, workspace, diretório de sessão e sistema de arquivos do container.

Evals de documentação permitem apenas `read`, `write`, `edit`, `grep`, `find` e `ls` por padrão. Eles não expõem ferramentas shell ou de busca na web. Tráfego para o provider ainda requer acesso à rede do container, portanto o Docker sozinho não pode provar que código arbitrário escrito por um agent nunca usa a rede.

## Results

Cada invocação cria um diretório ignorado `.eval/<timestamp>_<id>/` contendo:

- `protocol.json`: modelo, IDs das imagens, casos, tarefas e digest do protocolo.
- `expected-runs.json`: a coorte planejada completa.
- `observations.jsonl`: resultados normalizados e telemetria.
- `tasks/*/vitest.json`: JSON nativo para cada braço isolado.
- `<variant>/sessions/*/session.jsonl`: sessões nativas do Pi.
- `report.json` e `report.txt`: comparações pareadas.

Um par contribui para o lift da taxa de aprovação (pass-rate) apenas quando ambos os braços produzem exatamente uma pontuação. Braços ausentes, duplicados, pulados, pendentes, sem pontuação ou com erros bloqueiam o par. Se qualquer par em um conjunto de evals for bloqueado, as taxas de aprovação de destaque são retidas. A telemetria ausente permanece indisponível em vez de ser tratada como zero.

O relatório sinaliza ausência de lift, deltas negativos, controles ou tratamentos saturados e instabilidade (flakiness) observada. Uma repetição não pode estabelecer estabilidade.

Os artifacts podem conter prompts, respostas, código gerado e saída das ferramentas.

## Write an eval

Use uma suíte comum `describeEval(...)` e uma chamada explícita `run(...)` por caso:

```ts
import { describeEval, StructuredOutputJudge } from "vitest-evals";
import { createPiDocumentationEvalHarness } from "../src/harness.ts";

const harness = createPiDocumentationEvalHarness();
const judge = StructuredOutputJudge({ expected: { ok: true }, match: "strict", allowExtras: false });

describeEval("Target workflow", { harness, judges: [judge], judgeThreshold: null }, (it) => {
  it("completes the task", async ({ run }) => {
    await run("Complete the target task.");
  });
});
```

O runner externo é dono das variantes, repetições, isolamento, identidade, persistência e relatórios. Os arquivos de eval devem conter apenas a configuração do cenário, a tarefa do modelo e a classificação determinística.

Use `judgeThreshold: null` para pontuação comparativa. Uma pontuação baixa é um dado, não uma falha de infraestrutura. Reserve as asserções do Vitest para invariantes quebras na suíte.
