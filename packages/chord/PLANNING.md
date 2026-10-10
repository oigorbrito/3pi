# Plano de implementação do Chord

> **Status:** Plano de implementação ativo. O contexto, JSON estrito (strict JSON), estado replicado (replicated state), publicação/consumo de serviços, host/loader da faceta (facet host/loader) e o empacotamento inicial (bundling) da faceta Node e carregamento de geração (generation loading) já estão ativos no Chord. RPC simétrico e substituição de geração estrutural (structural generation replacement) permanecem planejados. Este não é um contrato de API pública estável ainda.

## 1. Objetivo

O Chord será a base neutra em relação à aplicação para:

1. carregar (loading), compor, descarregar (unloading), recarregar e empacotar (bundling) plugins;
2. declarar e consumir serviços locais ou remotos;
3. transportar chamadas de serviço e assinaturas sobre a infraestrutura (plumbing) de RPC simétrico; e
4. replicar o estado do último valor autoritativo (authoritative latest-value state) para consumidores locais e remotos.

## 2. Limite de dependência (Dependency boundary)

A direção da dependência é estrita:

```text
@earendil-works/chord
        ↑
Pi agent, protocol, server, coding agent, TUI, and future applications
```

O Chord deve:
- não ter dependência de outro pacote do workspace do Pi;
- não conter importações de `@earendil-works/3pi-*` ou caminhos relativos fora de `packages/chord`;
- usar vocabulário neutro para aplicativos (application-neutral vocabulary) no código-fonte, erros, testes e exemplos;
- possuir todos os tipos genéricos em tempo de execução (runtime types) necessários pela sua API pública;
- manter o carregamento (loading) e o empacotamento (bundling) específicos do Node separados do runtime neutro da plataforma; e
- ser compilável (buildable), testável, empacotável e utilizável sem resolver outro pacote Pi.

Os termos a seguir não devem se tornar conceitos do Chord: Session, Harness, AgentLane, server, client, attachment, TUI, model, tool, hook, provider credential, ou workspace. Eles pertencem aos consumidores.

## 3. Modelo arquitetural

### 3.1 Vocabulário de trabalho

- **Plugin**: uma unidade de composição (composition unit) ativada de forma independente.
- **Plugin module**: um módulo JavaScript exportando um ou mais plugins.
- **Loaded generation**: plugins mais os recursos pertencentes ao carregamento.
- **Host**: um grafo de serviço e plugin montado.
- **Service token**: um ID de serviço estável em tempo de execução, mais informações de tipo.
- **Provider**: o proprietário de um serviço singleton ou coleção baseada em chave (keyed).
- **Connection**: uma fonte neutra de transporte (transport-neutral).
- **Peer**: um ponto de extremidade de um canal RPC simétrico.
- **Replicated state**: revisões de origem imutáveis inicializadas.

### 3.2 Camadas (Layering)

```text
plugin loader and bundler
        ↓
plugin host, lifecycle, and dependency graph
        ↓
service tokens, providers, facades, and keyed instances
        ↓
replicated state and service subscriptions
        ↓
symmetric RPC peer and transport adapter
        ↓
strict JSON, invocation context, cancellation, and errors
```

## 4. Contexto de invocação e JSON estrito

O Chord necessita de um contexto de invocação neutro e pequeno, pois não pode depender do `Context` do Harness do Pi.
O contexto não cruza o RPC como um valor de negócios.
O Chord é dono do contrato estático `JsonValue`. Argumentos remotos, resultados, erros, devem ser JSON estrito finito (sem `undefined`, símbolos, arrays esparsos, mapas, etc.).

## 5. Plugins e ciclo de vida (lifecycle)

### 5.1 Forma do plugin (Plugin shape)

A configuração (Setup) é uma declaração síncrona. A API se baseia em:
```ts
interface Plugin {
  readonly id: string;
  setup(environment: PluginEnvironment): void;
}
```

O setup não deve invocar serviços assíncronos ou ler o estado replicado.

### 5.2 Montagem (Assembly)

Após todos os plugins terminarem o setup, o host coleta provisões, resolve requisições (requirements), e rejeita ciclos de dependência ou instâncias duplicadas.
Ativa os provedores antes dos consumidores.

### 5.3 Propriedade de recursos (Resource ownership)

Cada geração de plugin possui suas funções de limpeza (cleanup) e registros de recursos. A limpeza ocorre na ordem inversa do registro.

### 5.4 Gerações de módulos carregados

O carregamento de módulos e a ativação de plugins são domínios separados. O Chord usa bundles CommonJS para as facetas Node e compila cada geração diretamente com `node:vm`.

## 6. Carregamento, descarregamento e recarregamento (Loading, unloading, and reload)

### 6.1 Atualizações de host (Host updates)

As atualizações são serializadas.
**Substituição que preserva a forma (Shape-preserving replacement)**: Ocorre quando o substituto mantém IDs, dependências e interfaces. Fachadas (Facades) são preservadas.
**Substituição estrutural (Structural replacement)**: Ao adicionar ou remover plugins, o host substitui a geração inteira de uma só vez, com cutover (transição) total.

### 6.2 Chamadas durante descarregamento (unload)

As chamadas são feitas no substituto ou falham, mantendo referências se a conexão for perdida, mas sem "rollback".

## 7. Serviços

### 7.1 Tokens e modos

Tokens de serviço têm um ID estável. Os modos (modes) são:
- **singleton**: um provider, muitos consumers;
- **keyed**: um owner, instâncias dinâmicas, muitos observers.

### 7.2 Serviços locais e 7.3 Remotos
Locais são confiáveis, remotos operam via chamadas strict JSON ou valores de estado replicado.

### 7.4 Fachadas singleton estáveis (Stable singleton facades)
Permitem chamadas transparentes independentemente da origem ou estado.
### 7.5 Serviços baseados em chave (Keyed services)
Permitem a dinâmica por gerações próprias em tarefas isoladas via `spawn()` ou `observe()`.

## 8. Estado replicado (Replicated state)

O estado autoritativo lida com o repasse fiel de informações por revisões de valor imutável publicadas atomicamente, decodificadas e repassadas perfeitamente mantendo sequências e lidando com falhas, descartes por substituição ou atrasos de rede na hidratação da réplica. O Chord provê a ferramenta transacional de cópia para tais casos. Não suporta mesclagem de CRDT (CRDT merging) ou persistência assíncrona off-line.

## 9. RPC simétrico (Symmetric RPC plumbing)

Não há cliente ou servidor fixo. O Chord opera via pontos simétricos (peers). Tratativas de rede ou autenticação ficam nos adaptadores. Falhas de conexão não operam desfazimentos das tarefas da aplicação de negócio (durable business mutations). O pacote também mantém seus modelos próprios de erro.

## 10. Empacotamento (Bundling)

Utiliza-se o empacotador (bundler) para separar dependências locais para a arquitetura de runtime flexível. Gera entradas empacotadas para as facetas no ecossistema (Node CommonJS artifacts).

## 11. Limite de migração Pi (Pi migration boundary)

A migração só prosseguirá pós a validação própria nas lógicas bases sem alterar os repositórios centrais. Arquivos antigos em `packages/agent/src/plugins/services/` terão a competência assumida por estruturas no Chord progressivamente.

## 12. Layout proposto do código-fonte (Proposed source layout)

Descreve a árvore de arquivos, como `src/types.ts`, `src/services/`, `src/rpc/`, etc.

## 13. Pacotes de trabalho (Work packages)

Os pacotes de trabalho (WP) englobam WP0 a WP8, detalhando as etapas desde testes, contexto, pares RPC, serviço, plugins, bundles e migração, garantindo entrega modular do runtime de composição e facetas.

## 14. Matriz de conformidade requerida (Required conformance matrix)

Cobertura obrigatória cobrindo o grafo de plugins, serviços, reprodução (replication) assíncrona transacional contínua (atomic snapshot) e o RPC simétrico isolado do resto do mono repositório.

## 15. Não-metas para a implementação inicial (Non-goals)
- Banco de dados/estado durável.
- Resolução de pacotes/registros de descoberta.
- Interfaces de interface de usuário (UI trees).
- Reversibilidade de mutações após falhas incertas.

## 16. Decisões requeridas (Decisions required)
Decisões para antes das implementações como nomenclatura definitiva (Plugin vs Facet, Peer, etc) e a máquina responsável pelo bundle (esbuild).

## 17. Definição de pronto (Definition of done)
Um serviço não relacionado pode definir serviços, comunicação isolada RPC conectável a uma matriz sem vínculos e restrições. Replicar perfeitamente. E, ter um ecossistema host para a dependência livre do repositório maior.
