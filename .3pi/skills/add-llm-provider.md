---
name: add-llm-provider
description: Checklist para adicionar um novo provedor LLM ao packages/ai. Cobre os tipos core, implementação do provedor, lazy registration, model generation, matriz completa de testes, ligações do coding-agent e docs.
---

# Adicionando um Novo Provedor LLM (packages/ai)

Um novo provedor afeta vários arquivos. Trabalhe por essas etapas na ordem.

## 1. Tipos Core (`packages/ai/src/types.ts`)

- Adicione o identificador de API ao union type `Api` (por exemplo, `"bedrock-converse-stream"`).
- Crie a interface de opções estendendo `StreamOptions`.
- Adicione o mapeamento ao `ApiOptionsMap`.
- Adicione o nome do provedor ao union type `KnownProvider`.

## 2. Implementação do Provedor (`packages/ai/src/providers/`)

Crie um arquivo de provedor exportando:

- `stream<Provider>()` retornando `AssistantMessageEventStream`.
- `streamSimple<Provider>()` para mapeamento de `SimpleStreamOptions`.
- Interface de opções específica do provedor.
- Funções de conversão de mensagem/ferramenta (tool).
- Parsing de resposta que emite eventos padronizados (`text`, `tool_call`, `thinking`, `usage`, `stop`).

## 3. Exports do Provedor e Lazy Registration

- Adicione um export de subpath de package em `packages/ai/package.json` apontando para `./dist/providers/<provider>.js`.
- Adicione re-exports `export type` em `packages/ai/src/index.ts` para tipos de opções de provedor que devem permanecer disponíveis a partir do entry root.
- Registre o provedor em `packages/ai/src/providers/register-builtins.ts` por meio de wrappers de carregador lento (lazy loader); não importe módulos de implementação do provedor estaticamente lá.
- Adicione detecção de credenciais em `packages/ai/src/env-api-keys.ts`.

## 4. Geração de Models (`packages/ai/scripts/generate-models.ts`)

- Adicione lógica para buscar/analisar (parse) models da fonte do provedor.
- Mapeie para a interface padronizada `Model`.

## 5. Testes (`packages/ai/test/`)

- Sempre adicione o provedor a `stream.test.ts` com pelo menos um model representativo, mesmo que ele reutilize uma impl de API existente como `openai-completions`.
- Adicione o provedor à matriz mais ampla, onde aplicável: `tokens.test.ts`, `abort.test.ts`, `empty.test.ts`, `context-overflow.test.ts`, `unicode-surrogate.test.ts`, `tool-call-without-result.test.ts`, `image-tool-result.test.ts`, `total-tokens.test.ts`, `cross-provider-handoff.test.ts`.
- Para `cross-provider-handoff.test.ts`, adicione pelo menos um par de provedor/model. Se o provedor expõe várias famílias de model (por exemplo, GPT e Claude), adicione pelo menos um par por família.
- Para autenticação não padrão, crie um utilitário (por exemplo `bedrock-utils.ts`) com detecção de credenciais.

## 6. Coding Agent (`packages/coding-agent/`)

- `src/core/model-resolver.ts`: adicione o ID de model padrão a `defaultModelPerProvider`.
- `src/core/provider-display-names.ts`: adicione o display name de login da chave de API para que `/login` e a UI relacionada mostrem o provedor para autenticação de API-key embutida.
- `src/cli/args.ts`: adicione a documentação da variável de ambiente.
- `README.md`: adicione instruções de configuração do provedor.
- `docs/providers.md`: adicione instruções de configuração, variável de ambiente e a chave no `auth.json`.

## 7. Documentação

- `packages/ai/README.md`: adicione à tabela de provedores, documente as opções/autenticação e adicione variáveis de ambiente.
- `packages/ai/CHANGELOG.md`: adicione entrada em `## [Unreleased]`.
