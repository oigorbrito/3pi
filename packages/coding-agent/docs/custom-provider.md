# Provedores Personalizados

Uma extensão de provedor conecta o Pi a um serviço de modelo que necessita de autenticação customizada, descoberta de modelo, tratamento de requisições ou streaming. Se o serviço já se comunica por uma API suportada, configure-o no `models.json`.

As extensões de provedor rodam dentro do Pi e podem inspecionar credenciais, prompts, definições de ferramentas, respostas de modelos e uso (usage). Trate-as como código confiável e evite fazer log de segredos ou payloads do provedor.

## Escolha a menor integração

| Requisito | Use |
|---|---|
| Adicionar modelos através de uma API suportada | [`models.json`](models.md#configure-a-compatible-endpoint) |
| Alterar um endpoint de provedor existente ou cabeçalhos | `models.json` ou uma pequena extensão de provedor |
| Descobrir modelos dinamicamente | Um provedor com `refreshModels` |
| Adicionar um fluxo de `/login` | Um provedor com configuração OAuth nativa ou legada |
| Implementar um protocolo wire não suportado | Um provedor com `stream` ou `streamSimple` |

Uma extensão de provedor é uma [extensão](extensions.md), portanto ela segue o mesmo comportamento de carregamento, confiança, recarregamento (reload) e erro.

## Registrar um provedor

Chame `pi.registerProvider()` a partir da factory da extensão. O Pi aguarda as factories assíncronas antes de continuar a inicialização, de modo que os provedores registrados ali ficam disponíveis para a seleção de modelo da inicialização e para o `pi --list-models`.

Existem duas formas de registro:

- Registrar um `Provider` completo de `@earendil-works/3pi-ai` para autenticação nativa, filtragem, descoberta, atualização (refresh) e comportamento de streaming.
- Registrar um nome de provedor com `ProviderConfig` para o formulário de configuração legado usado por extensões existentes.

Dê preferência a um provedor completo para novas integrações que possuam mais do que metadados estáticos de modelo e endpoint. O Pi compõe substituições do `models.json` por cima de um provedor nativo registrado.

Registrar apenas `baseUrl` ou `headers` para um provedor existente preserva seus modelos integrados. Fornecer `models` na forma legada substitui os modelos daquele provedor em operações de chat, imagem e classificador. Um `type` omitido significa `"chat"`; modelos de imagem e de classificação requerem discriminantes explícitos e implementações mapeadas por seus valores `api` por meio dos campos `images` e `classifiers`.

Por exemplo, um provedor de operações mistas pode registrar modelos não-chat e suas implementações em conjunto:

```typescript
pi.registerProvider("media-tools", {
  apiKey: "$MEDIA_TOOLS_API_KEY",
  models: [
    {
      type: "image",
      id: "image-v1",
      name: "Image V1",
      api: "media-images",
      baseUrl: "https://media.example.com/v1",
      input: ["text"],
      output: ["image"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    },
    {
      type: "classifier",
      id: "classifier-v1",
      name: "Classifier V1",
      api: "media-classifier",
      baseUrl: "https://media.example.com/v1",
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 64000,
    },
  ],
  images: {
    "media-images": { generateImages: async (model, context, options) => result },
  },
  classifiers: {
    "media-classifier": { classify: async (model, context, options) => result },
  },
});
```

Valores `baseUrl` no nível do modelo têm precedência sobre o endpoint do provedor. Se nenhuma lista `models` for fornecida, os modelos integrados de todas as operações permanecem registrados. IDs de modelo iguais em diferentes operações continuam distintos, incluindo seus cabeçalhos específicos do modelo.

As chamadas feitas após o carregamento inicial da extensão entram em vigor imediatamente. Use `pi.unregisterProvider()` para remover o provedor dinâmico e restaurar o comportamento integrado que ele havia substituído.

Veja o [provedor GitLab Duo](../examples/extensions/custom-provider-gitlab-duo/) testado para obter um exemplo de registro completo que delega o streaming para as implementações de API integradas.

## Fornecer autenticação

Provedores estáticos podem resolver uma chave de API a partir de um literal, interpolação de ambiente ou um comando. Esses valores utilizam a mesma sintaxe do `models.json`:

- `$NOME` e `${NOME}` leem variáveis de ambiente.
- Um `!` à esquerda usa a saída de um comando.
- `$$` emite um literal `$`.
- `$!` emite um literal `!`.

Utilize a autenticação de provedor nativa quando a integração precisar de credenciais armazenadas, resolução customizada, ambiente específico do provedor ou múltiplos métodos de login.

Um provedor OAuth provê um nome de exibição, um fluxo de login, uma atualização de token e a resolução do access-token. Após o registro, ele aparece no `/login`, e o Pi armazena as credenciais retornadas em `~/.3pi/agent/auth.json`.

Callbacks de OAuth são agnósticos em relação à interface do usuário (UI). Eles podem abrir uma URL de autorização, mostrar um device code, informar progresso, solicitar entrada ou pedir que o usuário escolha um método de login. Honre os cancelamentos e o sinal de abort (abort signal) fornecido durante as solicitações de rede.

Nunca grave access tokens, refresh tokens, cabeçalhos de autorização ou as respostas completas do provedor nos logs comuns.

## Fornecer e atualizar modelos

Todo modelo requer um ID, um nome de exibição (display name), capacidades de entrada (input capabilities) e metadados de custo. Modelos de chat e classificador também requerem uma janela de contexto; os modelos de chat precisam de um limite de saída e suporte a raciocínio (reasoning); modelos de imagem declaram suas modalidades de saída. Escolha a implementação de API no nível de provedor a não ser que um dos modelos exija uma substituição (override).

Defina `promptCache.short` ou `promptCache.long` para o tempo de vida em segundos de cache de melhor esforço do provedor, quando o Pi precisar manter aquecido um cache de prompt inativo. Deixe-os indefinidos para desabilitar o aquecimento do cache (cache warming) naquele nível de retenção.

Flags de compatibilidade descrevem diferenças verificadas em uma API que, de outra forma, seria compatível. Não os ative baseando-se apenas na afirmação de um endpoint sobre compatibilidade.

Confirme os campos da requisição e o comportamento da resposta em relação ao servidor real.

Use `refreshModels` quando o catálogo disponível vier de um serviço ativo. Passe `context.signal` ao lidar com I/O bloqueante (blocking I/O) para que os chamadores possam cancelar as atualizações.

As duas formas de registro possuem diferentes contratos de atualização (refresh):

- Um `Provider` completo não retorna nada. Ele chama `context.publish({ update })` para instalar o estado do modelo sob responsabilidade do provedor; logo após, seu `getModels()` síncrono expõe a lista mais recente.
- A configuração legada `ProviderConfig.refreshModels` retorna definições de modelo para operações mistas. O Pi substitui os modelos dinâmicos daquele registro pela lista retornada e aplica qualquer persistência solicitada.

Publique dados de catálogo persistidos somente quando for previsto que eles devem sobreviver em diferentes execuções. Um serviço contínuo, como o llama.cpp, pode atualizar sua própria lista em memória sem ter que persistir; um catálogo remoto pode manter um instantâneo (snapshot) caso necessite ligar offline.

## Reutilizar uma API de streaming suportada

Use uma das implementações de API do Pi AI sempre que o protocolo do provedor coincidir.

Implementações suportadas cobrem as Anthropic Messages, OpenAI Chat Completions e Responses, Google Generative AI e Vertex, Azure OpenAI Responses, Mistral Conversations e Bedrock Converse.

O provedor ainda pode personalizar a autenticação, as base URLs, cabeçalhos, filtros de modelo e descoberta, delegando ao mesmo tempo a conversão de requisições e de streaming para uma das implementações de API existentes.

Isso é mais seguro do que copiar uma implementação de streaming, pois preserva a conversão de mensagens do Pi, o manuseio de ferramentas, a contabilidade de uso, o cancelamento e os comportamentos de compatibilidade.

## Implementar streaming personalizado

Implemente o `streamSimple` apenas quando nenhuma das implementações de API pré-existentes for capaz de representar o serviço. Estude primeiramente as implementações sob [`packages/ai/src/api`](https://github.com/earendil-works/pi/tree/main/packages/ai/src/api).

O fluxo recebe um `TranscriptContext` normalizado. System prompts e as declarações das ferramentas vivem em mensagens de sistema (system messages) de transcrição, então faça a leitura a partir de `getCurrentSystemPrompt(context.messages)` e `getCurrentTools(context.messages)` em vez de esperar um `context.systemPrompt` ou `context.tools`. Um modelo que oferece suporte a mensagens de sistema no meio da conversação pode recebê-las em seu local respectivo; do contrário, invoque `collapseSystemMessages(context)` para reunir as últimas system messages no escopo da mensagem líder.

Uma transmissão personalizada (custom stream) deve:

1. Criar uma mensagem de assistente contendo: provedor, modelo, carimbo de data e hora (timestamp), stop reason pendente, conteúdo e uso zerado.
2. Após obter êxito na configuração da requisição, emitir um único evento `start` antes de emitir os eventos de conteúdo.
3. Atualizar a mensagem concomitantemente à emissão dos eventos de texto, thinking (raciocínio) e eventos balanceados da tool-call.
4. Finalizar o uso (usage), custo (cost), o conteúdo e o stop reason.
5. Emitir exatamente um evento terminal do tipo `done` ou `error` e fechar a conexão de transmissão.
6. Converter os cancelamentos em um resultado abortado (aborted).

A configuração da requisição pode falhar antes de `start`; nesse cenário, o stream deve encerrar diretamente como um `error`. A falta de autenticação de requisição igualmente pode gerar um disparo síncrono de erro antes que um fluxo seja de fato retornado.

Os índices de conteúdo se referem aos blocos da mensagem da assistência. Atualize cada bloco antes de disparar o evento, que possui um campo `partial` que expõe esse respectivo estado. Os argumentos de um tool-call (chamada de ferramenta) devem conter a entrada analisada e válida (parsed input) por meio de `toolcall_end`.

A transmissão também deve honrar a instrumentação de solicitação enviada de `SimpleStreamOptions`:

- Invoque `options.onPayload` antes do despacho da solicitação do provedor e utilize qualquer payload substituto proveniente desse retorno.
- Invoque `options.onResponse` logo após apanhar a resposta, mas ainda antes do corpo dela (body) ser consumido de vez.
- Aguarde (Await) `options.onProviderStreamEvent?.(providerEvent, model)` perante cada evento lido do provedor que fora estruturado pelo parser antes da normalização do mesmo.
- Transmita via passthrough (pass through) o sinal de encerramento (abort signal) bem como o ambiente configurado pelo respectivo escopo do provedor.

Estes gatilhos (hooks) alimentam as análises/inspeções das requisições via extensão, eventos via resposta de cabeçalho (response-header) bem como viabilizam o rastreio das retransmissões/observações do lado do provedor. Ao não os implementar, se constrói um formato destoante e com conduta inconsistente quando equiparado em oposição aos demais agentes suportados pela estrutura interna do Pi.

## Reportar falhas e métricas de utilização

Mapeie e informe qual foi exatamente o motivo da quebra/parada final explícita do processo (`terminal stop reason`). Tratativas de erros ou abortagens (aborted) carecem obrigatoriamente de ter atrelados uma devida justificativa - neste caso repassados via `errorMessage`; Resoluções bem-sucedidas necessitam carregar atreladas: um volume condizente acerca da parte requerente (`input`), saída proveniente da resolução solicitada (`output`), cache atrelado e os seus relativos tokens somados como totais e o balanço consolidado final (`cost values`).

O Pi tenta efetuar de praxe suas compactações, visando contornar uma falha em decorrência de limite de buffer/janela esgotado. Caso alguma mensagem não padronizada venha a aparecer de ponta a ponta do serviço, deve se repassar apenas aquela extrapolação contida oriunda da reposta em um modo padronizado chamado de excedente restrito: para o retorno `context_length_exceeded` do evento/módulo central e assegurado a um handler tipo `message_end`.

Não permita tampouco, tente promover sobreposição dos comportamentos voltados à rate limit (limitações) limitadoras pontuais das API provedoras traduzindo-as deliberadamente às custas de "overflows contextuais". Pois há de fato um procedimento predeterminado/regra interna do Pi agindo pontualmente lidando exatamente sob este aspecto das lógicas referentes às interrupções e falhas passageiras.

## Testar a integração

Teste no mínimo:

- respostas textuais corriqueiras ou eventuais vazias/em branco;
- ocorrências de uso das "ferramentas" envolvidas bem como de seus respectivos processamentos/respostas.
- os parâmetros e inputs imagéticos associados às entregas feitas em conjunto das ferramentas de imagens naqueles moldes em que existam um devido e explícito suporte prévio ativo a eles;
- registros em contabilidades e apurações sobre despesas com consumos reais;
- ações que impliquem o disparo efetivo ou contorno sob intervenções ativas na operação via recurso de suspensão (abort behavior);
- cenários onde há extrapolação atrelada na grade da janelas do contexto (context overflow) envolvido.
- corrompimento na emissão ou o recebimento falho a transmissões picotadas de trechos/streams não preenchidos integralmente ou ainda sem estrutura formatada final válida.
- limitações envolvendo e abrangendo fronteiras atreladas à tipagem estrita associadas aos moldes advindos das normatizações Unicode base em operação.
- permutas e/ou transferências de estado (session handoffs) delegando a passagem fluida da batuta nos fluxos durante uma eventual troca ou migração inter e multi provedores;
- recargas decorrentes de um refresh nas frentes das garantias e da checagem em cima das permissões validáveis e ainda com relação aos eventuais abandonos das suas prerrogativas de credencial (autenticação).

Os testes atrelados sob o teto da listagem [`packages/ai/test`](https://github.com/earendil-works/pi/tree/main/packages/ai/test) fixam todas as atuações esperadas aos quais a totalidade das plataformas integradas internamente estão subordinadas na mesma sintonia. Sendo assim, antes de testar em modelos de prontos/pré-moldados (manual prompts) elabore um mapeamento adaptado com relação aos conjuntos em torno desse tipo de verificação em si.

Acione a extensão executando-a explicitamente durante todas as etapas focadas diretamente em seus passos do desenvolvimento prévio, logo depois repasse para uma rota e local devidamente habilitado a ser descoberto no Pi ou parta direto publicando e encaminhado à rede/store via formatação encapsulada e estruturada do [Pi package](packages.md) - e invoque seguidamente `/reload` posterior sempre após toda ou qualquer alteração efetivada nestes respectivos módulos ou frentes nas sessões de acompanhamentos ativos.
