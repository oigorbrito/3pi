# Virtual Models

Um virtual model (modelo virtual) é um model selecionável que escolhe um model físico para cada requisição. Use um para rotear por tarefa, custo ou estado da conversa. Por exemplo, um roteador pode enviar perguntas rápidas para um model pequeno e problemas difíceis para um model grande, enquanto o usuário seleciona um único model.

Registre os virtual models a partir de uma [extension](extensions.md). Eles aparecem em `/model`, `--model`, nos modelos no escopo (scoped models) e nas configurações como qualquer outro model. Um virtual model pode ser listado sob qualquer provider, incluindo um com models físicos, como `openai-codex/auto`.

## Seleção e despacho (dispatch)

Um virtual model seleciona um model e um nível de thinking. Um roteador mapeia esse par para um par físico em cada requisição:

```
selecionado (virtual model, virtual level) -> despachado (physical model, physical level)
jev/auto:low                               -> anthropic/claude-sonnet-4-5:high
```

O nível de thinking virtual é uma entrada para o roteador. O seu significado depende do roteador; não precisa corresponder a um orçamento de raciocínio.

O Pi mantém os dois pares separados:

| | Seleção | Despacho |
|---|---|---|
| Registrado em | Entradas `model_change` e `thinking_level_change` | Cada mensagem do assistente: `provider`, `api`, `model`, `thinkingLevel` |
| Visível como | `ctx.model`, `ctx.thinkingLevel`, `PI_MODEL`, `PI_REASONING_LEVEL`, `/model` | A mensagem de assistente de cada resposta |

Os providers recebem apenas os models físicos. Mensagens de assistente nomeiam o model físico, para que reproduzir uma conversa em diferentes models físicos funcione da mesma forma que após uma mudança manual de model. Retomar uma sessão restaura a seleção virtual a partir da sua entrada `model_change` mais recente. Se o virtual model não estiver mais registrado, o Pi faz o fallback para o model físico que respondeu por último.

No modo interativo, o rodapé mostra o model roteado ao lado da seleção, por exemplo `auto • high → gpt-5.6-luna • medium`. `/session` lista o custo para cada model físico.

O uso do contexto usa os limites do model físico que produziu a resposta mais recente, mesmo se essa resposta veio antes da troca para o virtual model. Sem uma resposta assim, ele usa os limites declarados no virtual model, se houver. A compactação verifica os mesmos limites, e novamente os limites do model para o qual cada requisição é roteada. Se a janela de contexto desse model for muito pequena para a conversa, o Pi compacta antes de enviar a requisição; a rota permanece como o roteador escolheu.

## Registrar um virtual model

```typescript
import type { ExtensionAPI } from "@earendil-works/3pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerVirtualModel({
    provider: "router",
    id: "auto",
    name: "Auto",
    thinkingLevels: ["low", "high"],
    route(request, ctx) {
      // Follow-ups de tools e tentativas (retries) ficam no model que lidou com a vez.
      const sticky = request.failed ?? request.previous;
      if (request.reason !== "user" && sticky) {
        return { model: sticky.model, thinkingLevel: sticky.thinkingLevel ?? "medium" };
      }
      const id = request.thinkingLevel === "high" ? "claude-sonnet-4-5" : "claude-haiku-4-5";
      return { model: ctx.modelRegistry.find("anthropic", id)!, thinkingLevel: "medium" };
    },
  });
}
```

- `provider` é o provider sob o qual o model está listado. Pode ser qualquer ID de provider. Um provider pode listar vários virtual models ao lado dos seus models físicos. Em um provider físico, o virtual model fica disponível quando esse provider possui credenciais. Em um ID que nenhum provider usa, ele está sempre disponível.
- `id` não deve ser o ID de um model físico desse provider. Se uma atualização de catálogo (catalog refresh) adicionar posteriormente um model físico com o mesmo ID, o virtual model o oculta.
- `thinkingLevels` lista os níveis oferecidos para seleção. O padrão é `["off"]`.
- `contextWindow` e `maxTokens` são mostrados antes da primeira resposta. Limites não definidos são desconhecidos.
- `input` lista os tipos de entrada (input) oferecidos para seleção. O padrão é texto e imagens; models físicos sem suporte a imagem recebem placeholders.

O registro segue as mesmas regras de enfileiramento e reload de `pi.registerProvider()`. Registrar o mesmo provider e ID novamente substitui o virtual model. `pi.unregisterVirtualModel(provider, id)` o remove; `pi.unregisterProvider()` não. O código do SDK pode registrar um sem uma extension: `modelRuntime.registerVirtualModel(definition)`.

## Rotear requisições

`route(request, ctx)` é executado antes de cada requisição feita com o virtual model e retorna `{ model, thinkingLevel }`. O model pode ser qualquer model físico no catálogo cujo provider tenha credenciais; procure-o usando `ctx.modelRegistry`. Um virtual model não pode rotear para outro virtual model. O Pi restringe (clamps) o nível de thinking ao model retornado.

| Campo | Significado |
|---|---|
| `model`, `thinkingLevel` | O virtual model e nível selecionados |
| `reason` | Por que a requisição é feita, veja abaixo |
| `previous` | Model físico e nível de thinking da resposta de sucesso mais recente em `messages` |
| `failed` | Para `retry`: model físico, nível de thinking e `message` de assistente da requisição que falhou, que `messages` não contém mais. A mensagem carrega `stopReason` e `errorMessage`. Ausente quando o próprio roteamento falha |
| `state` | Estado do roteador retornado por último neste ramo da sessão, veja abaixo |
| `messages` | A conversa para esta requisição, incluindo mensagens de sistema |
| `signal` | Sinal de abortamento da requisição |

| `reason` | Requisição |
|---|---|
| `user` | Primeira requisição após uma mensagem que o usuário escreveu, incluindo mensagens de follow-up e steering |
| `continuation` | Qualquer outra requisição no agent loop, como após resultados de tools ou mensagens de extension |
| `retry` | Repetição automática após uma requisição que falhou, inclusive após compactação por um estouro de contexto |
| `direct` | Requisição feita fora do agent loop, como um resumo de compactação ou uma extension chamando `ctx.modelRegistry.streamSimple()` |

Retornar `previous` para `continuation` e `failed` para `retry` mantém válidos os caches de prompt e signatures de thinking. Alternar os models entre as rodadas (turns) é permitido, mas perde o cache de prompt. Uma repetição (retry) também pode alternar para outro model, por exemplo, quando `failed.message.errorMessage` relata que um provider está sobrecarregado ou que o contexto estourou.

Se `route()` lançar uma exceção (throw) ou retornar um virtual model ou um model sem credenciais, a requisição termina com uma resposta de erro.

## Manter estado de roteamento

`route()` pode retornar `state` ao lado do model. O Pi o armazena no ramo (branch) da sessão e o passa de volta como `request.state` em requisições posteriores. Use isso para decisões que o transcript não registra, como resultados de classificador ou uma fase de roteamento:

```typescript
pi.registerVirtualModel<{ phase: "plan" | "build" }>({
  provider: "router",
  id: "phased",
  name: "Phased",
  route(request, ctx) {
    const state = request.state ?? { phase: "plan" };
    const id = state.phase === "plan" ? "claude-opus-4-5" : "claude-haiku-4-5";
    return { model: ctx.modelRegistry.find("anthropic", id)!, thinkingLevel: "medium", state };
  },
});
```

- O estado (state) deve ser serializável em JSON. Retornar `undefined` ou o próprio `request.state` mantém o estado atual.
- O Pi armazena qualquer outro objeto retornado como o novo estado, antes do envio da requisição, mesmo quando ele é igual ao estado atual. Retorne um novo objeto apenas quando o estado for alterado. O estado permanece armazenado caso a requisição falhe depois.
- O estado segue a árvore da sessão, então forks e a navegação `/tree` veem o estado de seu ramo. Ele sobrevive à compactação.
- Requisições `direct` não possuem estado, e o Pi ignora o estado que elas retornam.

O transcript já registra a seleção e cada model despachado, e `ctx.sessionManager.getBranch()` expõe ambos.

Roteadores podem chamar outros models através de `ctx.modelRegistry`, por exemplo `ctx.modelRegistry.classify()` com um classificador do tipo `classifier` de `ctx.modelRegistry.findOfType("classifier", provider, id)`. A chamada adiciona latência antes do primeiro token da rodada.

Veja [`jev-router.ts`](../examples/extensions/jev-router.ts) para um roteador completo. Ele planeja num model OpenAI Codex forte escolhido pelo classificador Jev, deixa esse model fazer a primeira edição, e depois alterna uma vez para um model mais barato, aceitando uma única falta (miss) de cache de prompt. Ele mantém a fase como estado do roteador.
