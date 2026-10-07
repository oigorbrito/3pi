# Modo RPC

O modo RPC executa o Pi como um subprocesso de longa duração controlado através de registros JSON em stdin e stdout. Use-o para integrações independentes de linguagem, isolamento de processos, IDEs e interfaces de usuário personalizadas.

Para uma integração Node.js ou Bun no mesmo processo, prefira o [SDK](sdk.md). Para uma integração TypeScript baseada em subprocesso, prefira o `RpcClient` exportado, que inicia o Pi, correlaciona respostas, expõe métodos de comando tipados e entrega eventos a ouvintes.

| Interface | Fronteira do processo | Modelo de controle | Melhor uso |
|---|---|---|---|
| [SDK](sdk.md) | Mesmo processo | Métodos diretos e eventos TypeScript | Hosts Node.js ou Bun que desejam acesso completo à API |
| RPC | Processo filho | Comandos JSONL, respostas e eventos | Outras linguagens, processos isolados, IDEs ou clientes personalizados |

## Iniciar modo RPC

```bash
pi --mode rpc --no-session
```

As opções normais da CLI ainda selecionam a pasta de trabalho, model, ferramentas, recursos e comportamento da sessão. As escolhas comuns incluem `--provider`, `--model`, `--name`, `--no-session` e `--session-dir`. Veja [Linha de Comando](cli.md) para a interface completa e específica da versão; `pi --help` tem autoridade sobre a versão instalada.

O modo RPC rejeita argumentos de prompt `@file`. Envie prompts através do comando [`prompt`](rpc-commands.md#prompt) em vez disso.

## Registros de protocolo

O protocolo possui quatro famílias de registros:

| Direção | Registro | Propósito |
|---|---|---|
| stdin | Comando | Solicitar que o Pi avise, inspecione o estado, altere a configuração ou gerencie a sessão |
| stdout | `response` | Informar se um comando foi bem-sucedido e retornar os dados do comando |
| stdout | Evento de sessão | Transmitir atividade de execução, mensagem, ferramenta, fila, compactação e repetição (retry) |
| Ambos | Registro de UI da Extensão | Encaminhar interações de extensão suportadas entre o Pi e o cliente |

Veja [Comandos RPC](rpc-commands.md), [Stream de Eventos JSON](json.md) e [Interface de Extensão RPC](rpc-extension-ui.md) para as definições de registro canônicas.

### Correlacionar comandos e respostas

Todo comando aceita um `id` em formato de string opcional. Uma resposta correspondente repete-o:

```json
{"id":"req-1","type":"get_state"}
{"id":"req-1","type":"response","command":"get_state","success":true,"data":{"...":"..."}}
```

Use IDs exclusivos sempre que mais de um comando puder estar pendente. O manuseio de comandos é assíncrono, portanto os clientes devem se correlacionar por ID em vez da ordem de resposta.

Os eventos de sessão geralmente não têm ID de comando porque eles descrevem a atividade da sessão. `bash_execution_update` é a exceção: quando o comando [`bash`](rpc-commands.md#bash) de origem tem um ID, seus eventos de saída repetem esse ID.

Um `extension_ui_response` usa o ID fornecido por seu `extension_ui_request`. Ele não produz uma resposta de comando normal.

## Enquadramento

O RPC usa enquadramento JSONL estrito. Escreva um objeto JSON completo por registro e termine-o com LF (`\n`). Leia stdout como um byte ou stream UTF-8 e divida os registros apenas em LF. Remova um retorno de carro anterior opcional para aceitar entrada CRLF.

Não use um leitor de linha genérico que trata os separadores de linha ou parágrafo Unicode como limites de registro. Em particular, `readline` do Node.js também se divide em `U+2028` e `U+2029`, que são válidos dentro de strings JSON.

Leia stdout continuamente. O Pi respeita a contrapressão de stdout, mas um cliente que para de ler pode travar o processo. Respeite a contrapressão de stdin ao escrever comandos. Stdout é reservado para registros de protocolo; diagnósticos e logs do aplicativo vão para stderr.

## Ciclo de vida da execução

Uma resposta `prompt` bem-sucedida significa que o prompt foi aceito, enfileirado ou tratado. Isso não significa que o trabalho do model foi concluído:

```json
{"id":"req-2","type":"prompt","message":"Revise este repositório"}
{"id":"req-2","type":"response","command":"prompt","success":true,"data":{"disposition":"started"}}
```

`data.disposition` relata o que aconteceu com o prompt. Se for `"handled"`, nenhuma execução foi iniciada para este prompt, portanto não aguarde por `agent_settled`. Veja [Comandos RPC](rpc-commands.md#prompt) para todos os valores.

Continue consumindo [eventos](json.md) após essa resposta. `agent_end` marca o fim de uma execução do agent de baixo nível, mas repetições (retries), recuperação de transbordamento, compactação, direcionamento ou trabalhos de acompanhamento ainda podem se seguir. Espere por `agent_settled` quando o cliente precisar saber que o Pi não continuará automaticamente.

Assine antes de enviar um prompt para evitar perder uma conclusão rápida. `RpcClient.promptAndWait()` faz isso internamente. Se estiver usando chamadas `RpcClient` separadas, instale o ouvinte de evento antes de `prompt()` e chame `waitForIdle()` somente enquanto uma execução estiver ativa.

## Erros

Um comando com falha retorna uma resposta com `success: false`:

```json
{"id":"req-3","type":"response","command":"set_model","success":false,"error":"Model não encontrado: invalid/model"}
```

JSON malformado produz uma resposta de análise sem um ID de requisição:

```json
{"type":"response","command":"parse","success":false,"error":"Falha ao analisar o comando: Token inesperado..."}
```

Uma resposta de sucesso cobre apenas o processamento de comando. Falhas de provedores e abortos após a aceitação de um prompt aparecem na mensagem e stream de eventos.

Os clientes também devem lidar com falhas na inicialização do processo filho, saídas inesperadas, diagnósticos no stderr, cancelamento e os seus próprios prazos (deadlines). Não analise o stderr como dados de protocolo.

## Encerramento

Feche o stdin do processo filho para solicitar um encerramento ordenado. O Pi descarta o runtime ativo antes de sair. Os clientes ainda devem lidar com os sinais de processo e saídas inesperadas.

Uma extensão também pode solicitar o encerramento através do contexto da extensão. O Pi conclui o encerramento após o comando atual ou após a execução ativa emitir `agent_settled`.

## Cliente mínimo

Este exemplo em Python usa um leitor binário (pipe), que faz a divisão em LF sem tratar os separadores Unicode como limites de protocolo:

```python
import json
import subprocess

process = subprocess.Popen(
    ["pi", "--mode", "rpc", "--no-session"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
)

assert process.stdin is not None
assert process.stdout is not None

command = {"id": "prompt-1", "type": "prompt", "message": "Olá"}
process.stdin.write(json.dumps(command).encode("utf-8") + b"\n")
process.stdin.flush()

while line := process.stdout.readline():
    record = json.loads(line)
    if record.get("type") == "message_update":
        update = record["assistantMessageEvent"]
        if update["type"] == "text_delta":
            print(update["delta"], end="", flush=True)
    elif record.get("type") == "agent_settled":
        print()
        break

process.stdin.close()
process.wait()
```

Para clientes TypeScript mantidos, use o [exemplo de cliente RPC verificado](../examples/rpc-client.ts). Ele exige uma Pi CLI compilada, pois o exemplo do repositório aponta para `dist/cli.js`.

## Referência

- [Comandos RPC](rpc-commands.md): todos os comandos stdin e respostas
- [Stream de Eventos JSON](json.md): eventos de sessão stdout compartilhados e reconstrução de stream
- [Interface de Extensão RPC](rpc-extension-ui.md): caixas de diálogo, notificações, respostas e limitações
- [Tipos de Mensagem](message-types.md): mensagens e blocos de conteúdo usados por respostas e eventos
- [Formato de Arquivo de Sessão](session-format.md): entradas retornadas por comandos de sessão
- [`rpc-types.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/rpc/rpc-types.ts): definições de protocolo TypeScript exportadas
- [`RpcClient`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/modes/rpc/rpc-client.ts): implementação de cliente subprocesso

## âncoras de referência movidas

As referências detalhadas que estavam anteriormente nesta página agora possuem páginas dedicadas. Essas âncoras preservam os links existentes.

<a id="prompt"></a>
<a id="steer"></a>
<a id="follow_up"></a>
<a id="abort"></a>
<a id="clear_queue"></a>
<a id="new_session"></a>
<a id="get_state"></a>
<a id="get_messages"></a>
<a id="set_model"></a>
<a id="cycle_model"></a>
<a id="get_available_models"></a>
<a id="set_thinking_level"></a>
<a id="cycle_thinking_level"></a>
<a id="get_available_thinking_levels"></a>
<a id="set_steering_mode"></a>
<a id="set_follow_up_mode"></a>
<a id="compact"></a>
<a id="set_auto_compaction"></a>
<a id="set_auto_retry"></a>
<a id="abort_retry"></a>
<a id="bash"></a>
<a id="abort_bash"></a>
<a id="get_session_stats"></a>
<a id="export_html"></a>
<a id="switch_session"></a>
<a id="fork"></a>
<a id="clone"></a>
<a id="get_fork_messages"></a>
<a id="get_entries"></a>
<a id="get_tree"></a>
<a id="get_last_assistant_text"></a>
<a id="set_session_name"></a>
<a id="get_commands"></a>

Os detalhes do comando foram movidos para [Comandos RPC](rpc-commands.md).

<a id="message_update-streaming"></a>
<a id="bash_execution_update"></a>
<a id="compaction_start--compaction_end"></a>
<a id="summarization_retry_scheduled--summarization_retry_attempt_start--summarization_retry_finished"></a>

Os detalhes do evento foram movidos para [Stream de Eventos JSON](json.md).

<a id="extension-ui-protocol"></a>

Os detalhes da interação da extensão foram movidos para [Interface de Extensão RPC](rpc-extension-ui.md).
