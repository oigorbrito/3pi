# Semântica

A referência é a `NodeExecutionEnv` (`packages/durable/src/env/node.ts`) do Durable na máquina remota. A suíte de conformidade de env do Durable e `test/differential.test.ts` verificam cada regra abaixo.

## Divisão de trabalho

| Preocupação | Onde |
|---|---|
| Resolução de caminho: `~` (home remoto), `file://`, relativo ao `cwd`; no Windows caminhos relativos ao drive contra os diretórios de trabalho do remoto | cliente, regras de `path` do sistema remoto |
| Checkpoints de aborto de cada método | cliente, como `NodeExecutionEnv` |
| Mapeamento de código de erro (`ENOENT` → `not_found`, ...) | cliente, como `toFileError` do `NodeExecutionEnv` |
| Tamanhos de leitura do `readFile`, limite de tamanho e decodificação (`StringDecoder`, byte-order mark mantido) sobre o `open(path, "r")` do daemon | cliente |
| `writeFile` em gravações de 512 KiB com uma verificação de aborto antes de cada uma; `appendFile` sem verificações | cliente, sobre um arquivo aberto |
| Leitor de linha (Line reader) | cliente, leituras posicionais e `StreamDecoder` do Durable |
| Observação (Watching): snapshots, eventos nativos, polling | daemon, um port do `NodeFileWatcher` do Durable |
| Validação de timeout, precedência de resultado (erro de callback, timeout, aborto, falha de spill, exit code) | cliente |
| Chamadas de sistema (System calls), processos, arquivos de spill, varreduras de linha | daemon |
| Decodificação da saída do comando: por fluxo (stream), UTF-8 da WHATWG, apenas um byte-order mark inicial é descartado | daemon (`encoding_rs`) |

## Regras que as bibliotecas padrão não seguem

- `mkdir` recursivo: um diretório existente é aceito, um arquivo existente falha com `EEXIST`, um arquivo no caminho de um pai falha com `ENOTDIR`. Gravações criam pais ausentes dessa maneira.
- `rm`: um caminho ausente falha a menos que use `force`; um diretório sem `recursive` falha com `ERR_FS_EISDIR` (código `FileError` `unknown`).
- `mkdtemp`: `mkdtemp(3)` de `<tmpdir>/<prefix>XXXXXX`; o prefixo é unido usando o POSIX `path.join`, de forma que `../x` funciona.
- `tmpdir`: `TMPDIR`, `TMP`, `TEMP`, depois `/tmp` (Termux: `$PREFIX/tmp`), barra final removida.
- `listDir`: nomes em ordem de bytes, como no `scandir` da libuv; falha se qualquer entrada não puder sofrer lstat. `openDirReader` mantém a ordem do diretório, pula entradas removidas entretanto, e preenche cada página após pular. Nomes que não são UTF-8 são decodificados com caracteres de substituição e sofrem lstat sob esse nome, então eles falham com `ENOENT` como no Node.
- `openBinaryReader`: open (abertura) não bloqueante; diretórios falham com `is_directory`, outros arquivos não regulares com `invalid`; `noFollow` recusa um link simbólico final (`O_NOFOLLOW`).
- `readBinaryFile`, `readTextFile` e `openTextLineReader` abrem qualquer arquivo como `open(path, "r")`: `/dev/null` é lido vazio, um FIFO bloqueia até ter um gravador, e um diretório falha ao ser lido (um leitor de linhas no `readLine`). Um arquivo regular é lido até o seu tamanho na abertura; outros arquivos até o seu final.
- `readBinaryFile` retorna um `Buffer`, o reader lê em um `Uint8Array` simples, como o Node faz.
- Windows: códigos de erro são traduções da libuv; um `rm` de um link simbólico ou junção apontando para um diretório remove o link; criar um arquivo onde um diretório existe falha com `EISDIR`; tempos de modificação (modification times) antes de 1970 são negativos.

## Comandos

- Uma string roda através do shell: um `shellPath` configurado que não existe (seguindo links) falha com `shell_unavailable`; caso contrário `/bin/bash`, `which bash`, depois `sh`, com `-c`. Um array `argv` roda o seu programa diretamente; no Windows ele é buscado como a libuv faz (diretório de trabalho, depois `PATH`, adicionando `.com` e `.exe`), e arquivos em lote (batch files) são recusados.
- O diretório de trabalho deve existir (`spawn_error`).
- Ambiente (Environment): com `inheritEnv` (padrão), o ambiente do daemon, depois `shellEnv`, depois `env`; sem ele, apenas `env`.
- Cada comando recebe uma nova sessão (grupo de processos), disposições de sinais padrão e uma máscara de sinais vazia. Timeout, aborto e `cleanup()` matam o grupo com `SIGKILL`.
- Após a saída do processo, a saída continua sendo coletada até que ambos os pipes terminem, ou que se passem 100 ms sem saída; o timeout continua se aplicando nesse ínterim. Os pipes são fechados quando o comando assenta, mesmo se um descendente os mantiver abertos.
- Um aborto assenta como `aborted`; `cleanup()` mata sem abortar, de modo que o comando assenta com exit code 137.
- Um processo morto por um sinal reporta `128 + signal`.
- Spill: assim que a saída cruzar `spill.afterBytes` ou `spill.afterLines` (contados nos fragmentos/chunks brutos na ordem de chegada, como o Node os conta), a saída bruta completa vai para `pi-output-<uuid>.log` num novo diretório `tmp-`.

## Observação (Watching)

- O daemon executa o `NodeFileWatcher` do Durable perto dos arquivos: eventos nativos (inotify, FSEvents) apenas disparam um escaneamento novo sem repique (debounced rescan), e mudanças são a diferença entre os snapshots mais os caminhos de eventos. Leituras não são eventos.
- Windows e sistemas de arquivos de rede ou FUSE usam de polling (sondagem), como o `NodeExecutionEnv` faz; a falta de watches nativos muda para o polling e avisa (overflow).
- Quando a conexão for perdida o cliente abre o observador de novo caso o daemon for instanciado lá novamente emitindo do mesmo status de aviso (overflow).
