# Comandos RPC

Abaixo a lista de comandos suportados pelo RPC via JSONL.

## Prompt
`prompt`: envia prompt.
`steer`: altera direção.
`follow_up`: adiciona tarefa após o agent terminar.

## Sessões
`new_session`: nova sessão.
`switch_session`: troca sessão.
`compact`: compacta tokens.
`bash`: roda comando bash que vai para a fila do contexto.

Essas requisições suportam `id` para correlacionar respostas.
O retorno tem formato:
```json
{"type": "response", "command": "prompt", "success": true}
```
