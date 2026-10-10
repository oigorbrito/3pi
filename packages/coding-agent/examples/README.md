# Exemplos

Códigos de exemplo para o SDK do pi-coding-agent, integração de processos e extensões.

## Integração via CLI

[`rpc-client.ts`](rpc-client.ts) utiliza o typed `RpcClient` para executar o Pi em um processo filho, fazer streaming de eventos e aguardar que a execução seja concluída (settle).

Compile (build) o pacote coding-agent antes de executá-lo a partir do checkout de um repositório:

```bash
node examples/rpc-client.ts "Explain this repository"
```

## Diretórios

### [sdk/](sdk/)
Uso programático via `createAgentSession()`. Mostra como customizar modelos, prompts, ferramentas, extensões e o gerenciamento de sessões.

### [extensions/](extensions/)
Exemplos de extensões demonstrando:
- Manipuladores de eventos de ciclo de vida (interceptação de ferramentas, portões de segurança, modificações no contexto)
- Ferramentas customizadas (listas de tarefas, perguntas, subagentes, truncamento de saída)
- Comandos e atalhos de teclado
- UI customizada (rodapés, cabeçalhos, editores, overlays)
- Integração com Git (checkpoints, auto-commit)
- Modificações no system prompt e compactação customizada
- Integrações externas (SSH, monitores de arquivo, sincronização de tema com o sistema)
- Provedores customizados (Anthropic com streaming customizado, GitLab Duo)

### [plugins/pi-example-plugin/](plugins/pi-example-plugin/)
Um pacote de plugin experimental que o Pi compila automaticamente em facetas independentes de Session-worker e TUI no Chord.

## Documentação

- [Exemplos do SDK](sdk/README.md)
- [Integração da CLI](../docs/cli-integration.md)
- [Documentação de Extensões](../docs/extensions.md)
- [Documentação de Skills](../docs/skills.md)
