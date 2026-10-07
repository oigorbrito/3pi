# @earendil-works/3pi-env

Ambientes de execução remota para [Pi Durable](../durable): as ferramentas de um agent rodam em outra máquina, geralmente via SSH, enquanto o worker Durable, seu armazenamento e credenciais permanecem locais.

- `pi-env` (`daemon/`): um pequeno programa em Rust que roda na máquina remota. Ele fala um protocolo emoldurado no stdin e stdout ([docs/protocol.md](docs/protocol.md)) e executa operações de arquivo e comandos lá.
- `RemoteExecutionEnv`: um `ExecutionEnv` Durable que se comunica com o daemon através de uma `Connection`. Seus resultados correspondem ao `NodeExecutionEnv` rodando na máquina remota; apenas as mensagens de erro podem diferir ([docs/semantics.md](docs/semantics.md)).

```ts
import { acceptHostKey, connectSsh, RemoteExecutionEnv, scanHostKey, sshConnection } from "@earendil-works/3pi-env";

const target = { host: "gpu-box", knownHostsFile: "/data/ssh/known_hosts", hostKeyAlias: "3pi-env-gpu" };
// Once: show the host's key fingerprint to the owner, who compares it out of band and accepts it.
const { lines, fingerprints } = await scanHostKey(target);
await acceptHostKey(target, lines);

// Detects the remote system, deploys the daemon if missing (named by its SHA-256 and verified before every start),
// and returns a connection that starts it over ssh.
const { connection } = await connectSsh(target);
const env = new RemoteExecutionEnv({ connection, id: "3pi-env:gpu", cwd: "/home/me/project" });

// Or lazily: nothing happens until the first operation, which detects, deploys and connects. A failure (no network,
// untrusted host key) is that operation's error, and the next operation tries again.
const lazy = sshConnection(target);
const lazyEnv = new RemoteExecutionEnv({ connection: lazy.connection, id: "3pi-env:gpu", cwd: "/home/me/project" });
```

O pacote envia o daemon para todos os sistemas remotos suportados em `bin/`. O `ssh` roda com `BatchMode`, verificação estrita de host-key contra o arquivo known-hosts da própria aplicação sob um alias fixo, sem encaminhamento de nenhum tipo, sem shared connections ou comandos configurados, e sem encaminhar a localidade (locale) local. No Windows, a detecção e o deploy passam pelo PowerShell, e o daemon inicia através do shell padrão do servidor (cmd.exe ou PowerShell).

Sistemas remotos suportados: Linux, macOS, Android (Termux) e Windows, em x86-64 e arm64. No Windows, comandos em string rodam através do Git Bash assim como o `NodeExecutionEnv` os roda lá; comandos argv rodam diretamente.

## Development

`npm run build:daemon` compila o daemon com Cargo; os testes se comunicam com `daemon/target/debug/pi-env` através de um pipe, ou com o binário nomeado por `PI_ENV_DAEMON` (CI testa os builds de release dessa maneira). Eles executam a suíte de conformidade de env do Durable contra o `RemoteExecutionEnv` e comparam sequências aleatórias de operações e as ferramentas do Durable contra o `NodeExecutionEnv` na mesma máquina. `test/ssh-external.test.ts` roda a suíte sobre um servidor SSH real quando `PI_ENV_SSH_HOST` estiver definido.
