# Formato de Arquivo de Sessão

Sessões são armazenadas como arquivos JSONL (JSON Lines). Cada linha é um objeto JSON com um campo `type`. As entradas da sessão formam uma estrutura de árvore através dos campos `id`/`parentId`, habilitando o branching in-place sem a necessidade de criar novos arquivos.

Para a criação programática, persistência e navegação em árvores, consulte a [`API SessionManager`](sdk.md#sessionmanager-api).

## Local do Arquivo

```
~/.3pi/agent/sessions/--<path>--/<timestamp>_<session-id>.jsonl
```

Por padrão, `<session-id>` é um UUID. Os chamadores podem fornecer um ID personalizado via SDK ou `--session-id`. Para `<path>`, o Pi remove o separador de caminho inicial e substitui `/`, `\\` e `:` por `-`.

## Excluir Sessões

Sessões podem ser apagadas deletando seus arquivos `.jsonl` em `~/.3pi/agent/sessions/`.

O Pi também suporta a exclusão de sessões interativamente em `/resume` (selecione a sessão e pressione `Ctrl+D`, depois confirme). Quando disponível, o Pi utiliza o executável `trash` do sistema para contornar perdas imediatas e não excluir o recurso prematuramente.

## Versão da Sessão

Sessões possuem um campo de versão no cabeçalho:

- **Version 1**: Sequência de entrada linear (legada, migrada automaticamente no carregamento)
- **Version 2**: Estrutura em árvore com ligação `id`/`parentId`
- **Version 3**: Regra `hookMessage` foi trocada por `custom` na padronização (unificação nas extensões)

Sessões existentes são migradas de maneira automática para a versão atual (v3) no momento em que a sessão ativa um carregamento em memória da plataforma.

## Códigos-fontes (Source Files)

Fontes do repositório ([pi](https://github.com/earendil-works/pi)):
- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/session-manager.ts) - Entradas e recursos do SessionManager
- [Tipos de Mensagens](message-types.md) - Elementos relacionados e compartilhamento na plataforma
- [`packages/coding-agent/src/core/messages.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/messages.ts) - Informações baseadas e definições ampliadas
- [`packages/ai/src/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/ai/src/types.ts) - Especificação para integração das bases com o SDK da infra
- [`packages/agent/src/types.ts`](https://github.com/earendil-works/pi/blob/main/packages/agent/src/types.ts) - Regras ligadas às conexões entre união e parâmetros via `AgentMessage` extensível

Para as definições de compilação em código na plataforma referidas sob diretrizes de TypeScript dentro dos projetos operacionais em andamento nas máquinas do utilizador nas suas configurações, certifique-se sobre o apontamento `node_modules/@earendil-works/3pi-coding-agent/dist/` bem como as conexões efetuadas em conformidade pelas dependências ativadas durante processamentos atrelados aos acessos à infraestrutura via `node_modules/@earendil-works/3pi-ai/dist/`.

## Mensagens

Um processo no atributo das transações contínuas nas sessões `message` arquiva e preserva o seu correspondente parâmetro alocado referenciado a `AgentMessage`.

Tópicos associados aos eventos temporais gerados na execução (Timestamps), alocação com a finalidade operacional referenciada por (roles), assim como o arquivamento sob definições nos blocos referentes ao modelo formativo encontram as referências aplicacionais expostas na [Tipos de Mensagens](message-types.md). Registros indicativos em eventos da sessão sob datas encontram referências ISO 8601; a informação que é alocada internamente reflete sua correspondência processual a identificações referentes ao Unix baseadas por parâmetros avaliados através do cálculo temporal sobre referências estabelecidas e alocadas por unidades milissegundos.

## Definição da Base da Entrada

Todo o atributo de eventos correspondente às sessões em processo contínuo (exceto no processo isolado definido para atuações referenciadas como `SessionHeader`) tem expansão ao ser agregado sob os trâmites do acesso baseados aos esquemas previstos via `SessionEntryBase`:

```typescript
interface SessionEntryBase {
  type: string;
  id: string;           // Usualmente referências correspondentes com formatação sobre os moldes previstos em processos sob o hexadecimal a base estrutural a 8 caracteres, caso negativo tem a identificação de retorno predefinida no parâmetro gerado por UUID
  parentId: string | null;  // Identificações associadas de parentalidade na árvore relativas a parentes de entradas em andamento correspondentes nas transações. (null é referenciado para raízes)
  timestamp: string;    // Estruturas processadas no Timestamp referenciado pela formatação baseada pela padronização adotada na implementação (ISO)
}
```

## Tipos de Entradas na Árvore

### SessionHeader

Estruturado na alocação ao cabeçalho inicial sob as determinações dos caminhos baseados. Fica isento das implementações das ramificações que compreendem as ligações operacionais aos fluxos implementados na árvore gerada nas operações pelo acesso processado, consequentemente exclui associações do tipo `id`/`parentId`.

```json
{"type":"session","version":3,"id":"uuid","timestamp":"2024-12-03T14:00:00.000Z","cwd":"/path/to/project"}
```

Para sessões com as correspondências herdadas sob dinâmicas operacionais a partir das requisições relativas a atuações na interface sobre caminhos a gerar as ramificações de bifurcações associadas pela chamada de identificações processadas pela definição expressa (obtida via as requisições geradas por `/fork`, `/clone`, ou instanciadas em ambiente processual sobre os parâmetros nas operações `newSession({ parentSession })`):

```json
{"type":"session","version":3,"id":"uuid","timestamp":"2024-12-03T14:00:00.000Z","cwd":"/path/to/project","parentSession":"/path/to/original/session.jsonl"}
```

### SessionMessageEntry

Constitui-se como um fator que compreende informações agregadas numa mensagem presente em correspondência com as dinâmicas num ambiente de conversas geradas nas sessões ativadas nos processos interativos. A base estrutural do objeto com campo `message` retém no seu escopo a conformidade que contém os agrupamentos processados via chamadas de dados agregadas à requisição base por instâncias referenciadas no formato correspondente das variáveis associadas à base operacional através do formato alocado em `AgentMessage`.

A arquitetura das alocações que transportam informações de controle do sistema operam de forma processada sob a lógica de armazenagem com a correspondência na requisição para enviar definições ligadas com escopos inerentes aos comandos (prompt) com ferramentas geradas que suportam e complementam as atividades efetuadas: as ações de ativação requerem persistir em correspondência ao passo das chamadas com requisições processuais interativas aos modelos gerados, enquanto implementações futuras persistem sob informações relativas aos ajustes sistêmicos processados via mensagens, sendo aplicadas instâncias processuais que efetuam patches através dos recursos de compilações atreladas sobre as áreas correspondentes via comandos (nomeando as atribuições que determinam o apagamento no preenchimento de campos por associações de valor sobre parâmetros do caso nas correspondências definidas por variáveis a obter os conteúdos aplicados com `null` nos registros para o desaparecimento das menções); listar as propriedades adicionadas/removidas de forma análoga atua nas bases do recurso, aplicando definições através de propriedades na forma de parâmetros correspondentes em instâncias sob variáveis atribuídas para a base com as designações expressas a definir a variável nos comandos por associações sobre o array de ferramentas no parâmetro obtido pelas execuções da verificação atrelada sobre `toolsAdded`/`toolsRemoved`. Reproduzir estas ações geram os campos a definir as diretrizes contínuas ativas correspondendo à sua posição operacional no parâmetro ativo sob a avaliação pontual aplicada pela definição correspondente associada à ausência por registros segregadores das funções com atuações de informações e dos dados de comandos e funções associadas num modelo alocado.

```json
{"type":"message","id":"a0b1c2d3","parentId":null,"timestamp":"2024-12-03T14:00:00.000Z","message":{"role":"system","content":"","sections":{"preamble":"You are an expert coding assistant...","tools":"<tools>\n- read: ...\n</tools>","cwd":"/project"},"toolsAdded":[{"name":"read","description":"...","parameters":{}}],"timestamp":1733234400000}}
{"type":"message","id":"d4e5f6g7","parentId":"c3d4e5f6","timestamp":"2024-12-03T14:04:00.000Z","message":{"role":"system","content":"","sections":{"skills":"<skills>...</skills>"},"toolsRemoved":[{"name":"write"}],"timestamp":1733234640000}}
```

### ModelChangeEntry

Sessões antigas em sistemas cujos dados são processados que carecem com escopos associados na inserção do fator com informações de comandos na entrada anterior operam na base de dados com as determinações equivalentes e contínuas processando os formatos por correspondências processuais análogas de preenchimentos pelas determinações da inicialização com comandos nas configurações equivalentes em parâmetros processados nas mensagens.

### ThinkingLevelChangeEntry

Emitido quando há troca do nível de reasoning.

### UsageEntry

Registra métricas.

### CompactionEntry

Registros compactados.

### ContextEditEntry

Edição.

### BranchSummaryEntry
Sumário do ramo.

### CustomEntry e LabelEntry
Personalizações.
