# Variáveis de Ambiente

O Pi usa variáveis de ambiente de três maneiras:

- Variáveis como `PI_OFFLINE` configuram o processo do Pi.
- O Pi define marcadores de processo para que processos filhos possam identificar o Pi como o agent inicializador.
- Comandos executados pelas ferramentas de shell chamáveis pelo LLM recebem variáveis `PI_*` descrevendo a sessão atual.

As variáveis de chave de API do provedor estão documentadas separadamente em [Provedores](providers.md#use-an-api-key-from-the-environment).

## Marcador de Processo

Os pontos de entrada CLI e RPC definem dois marcadores de processo:

- `AI_AGENT=pi` é um marcador genérico que permite que ferramentas identifiquem o Pi como o agent que iniciou o processo.
- `PI_CODING_AGENT=true` é específico do Pi e permite que processos filhos detectem que estão rodando dentro do Pi.

Processos filhos herdam ambos os marcadores. Eles não são específicos da sessão e não são definidos automaticamente quando o Pi é incorporado através do SDK.

## Ambiente de Sessão da Ferramenta de Shell

Os comandos executados pelas ferramentas (tools) `bash` e `powershell` recebem o estado da sessão atual do Pi:

| Variável | Descrição |
|----------|-------------|
| `PI_SESSION_ID` | ID da sessão atual |
| `PI_SESSION_FILE` | Caminho absoluto para o arquivo JSONL da sessão atual; não definido (unset) para sessões efêmeras |
| `PI_PROVIDER` | Provedor de modelo atualmente selecionado |
| `PI_MODEL` | ID do modelo atualmente selecionado |
| `PI_REASONING_LEVEL` | Nível de raciocínio efetivo atual: `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, ou `max` |

Os valores são resolvidos quando cada comando inicia. Portanto, trocar de modelo ou alterar o nível de raciocínio afeta o próximo comando de shell sem reiniciar o Pi. `PI_PROVIDER` e `PI_MODEL` identificam o modelo do Pi selecionado, não um modelo upstream diferente que um roteador (router) pode escolher internamente.

Quando questionado sobre qual modelo ou provedor está rodando, inspecione essas variáveis em vez de inferir a resposta a partir do system prompt:

```bash
printf '%s/%s\n' "$PI_PROVIDER" "$PI_MODEL"
printf 'reasoning=%s session=%s\n' "$PI_REASONING_LEVEL" "$PI_SESSION_ID"
```

O arquivo de sessão pode ser inspecionado diretamente quando a sessão é persistente:

```bash
if [ -n "$PI_SESSION_FILE" ]; then
  tail -n 1 "$PI_SESSION_FILE"
fi
```

Essas variáveis são injetadas nas ferramentas `bash` e `powershell` chamáveis pelo LLM. Elas não são injetadas em comandos `!` ou `!!` digitados pelo usuário.

### Ferramentas de Shell Personalizadas

Ferramentas criadas com `createBashTool()` ou `createPowerShellTool()` expõem o ambiente da sessão por padrão quando registradas no Pi. A injeção ocorre antes do `spawnHook`, então um hook recebe as variáveis em `ctx.env`:

```typescript
const bashTool = createBashTool(cwd, {
  spawnHook: (ctx) => ({
    ...ctx,
    env: { ...ctx.env, CI: "1" },
  }),
});
```

Desative os metadados da sessão independentemente do spawn hook:

```typescript
const powershellTool = createPowerShellTool(cwd, {
  exposeSessionEnvironment: false,
  spawnHook: (ctx) => ctx,
});
```

Quando desativado, o Pi remove os valores herdados para essas variáveis de forma que processos aninhados do Pi não exponham metadados de sessão-pai desatualizados.

## Configuração do Processo Pi

Essas variáveis são lidas pelo próprio Pi:

| Variável | Descrição |
|----------|-------------|
| `PI_CODING_AGENT_DIR` | Substitui o diretório de configuração; o padrão é `~/.3pi/agent` |
| `PI_CODING_AGENT_SESSION_DIR` | Substitui o armazenamento de sessão; sobrescrito por `--session-dir` |
| `PI_PACKAGE_DIR` | Substitui o diretório de pacotes, útil para caminhos de store do Nix/Guix |
| `PI_OFFLINE` | Desativa atividade de rede automática, incluindo atualizações de catálogo de modelos |
| `PI_SKIP_VERSION_CHECK` | Desativa a verificação de versão mais recente no `pi.dev` |
| `PI_TELEMETRY` | Substitui a telemetria de instalação/atualização e cabeçalhos de atribuição de provedor: `1`/`true`/`yes` ou `0`/`false`/`no` |
| `PI_CACHE_RETENTION` | Defina como `long` para cache de prompt estendido do provedor onde suportado |
| `PI_SHARE_VIEWER_URL` | Substitui a URL base usada por `/share` |
| `PI_RADIUS_GATEWAY` | Substitui a origem do gateway Radius usada por uploads `/bug` e conexões de retransmissão Radius |
| `PI_HARDWARE_CURSOR` | Defina como `1` para mostrar o cursor de hardware; veja [Configuração do terminal](terminal-setup.md) |
| `PI_HYPERLINKS` | Substitui a detecção de hyperlink OSC 8 com `1`, `0`, ou `auto` |
| `PI_IMAGE_PROTOCOL` | Substitui a detecção de imagem inline com `kitty`, `iterm2`, `none`, ou `auto` |
| `PI_TRUE_COLOR` | Substitui a detecção de truecolor com `1`, `0`, ou `auto` |
| `PI_TUI_ESC_TIMEOUT` | Quanto tempo esperar após um único ESC antes de tratá-lo como Escape, em milissegundos; o padrão é `100` via SSH e `10` caso contrário. Aumente se a entrada da tecla Alt for lida incorretamente como Escape |
| `VISUAL`, `EDITOR` | Editor externo de fallback quando `externalEditor` não está definido |
| `HTTP_PROXY`, `HTTPS_PROXY` | Proxy de requisições HTTP de saída |

As credenciais do provedor como `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` e configurações específicas do provedor estão listadas em [Provedores](providers.md#use-an-api-key-from-the-environment).
