# Início Rápido

O Pi roda no seu terminal e trabalha com arquivos na sua máquina. Para usá-lo, você precisa de acesso a um model através de um provedor suportado. Isso pode ser uma assinatura, uma chave de API ou um model local.

Para a configuração nativa no Windows, leia [Configuração no Windows](windows.md). Para Android, leia [Configuração no Termux](termux.md).

## 1. Instalar o Pi

No macOS ou Linux, você pode usar o instalador:

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

O instalador fixa todas as dependências e atualiza o Pi com `pi update`. Alternativamente, instale o Pi a partir do npm, o que não fixa dependências transitivas. Isso requer Node.js 22.19 ou mais recente:

```bash
npm install -g --ignore-scripts @earendil-works/3pi-coding-agent
```

O Pi não requer scripts de ciclo de vida de dependência para uma instalação normal do npm.

Com Nix no macOS ou Linux, instale o lançamento mais recente do flake do Pi. O Nix compila o Pi a partir do código-fonte:

```bash
nix profile add github:earendil-works/pi/stable
```

Versões mais antigas do Nix usam `nix profile install` em vez disso. Atualize com `nix profile upgrade pi`; `pi update` não pode atualizar uma instalação do Nix. Para fixar uma release, use uma tag como `github:earendil-works/pi/v1.0.0`.

Verifique a instalação:

```bash
pi --version
```

## 2. Iniciar o Pi

Mude para a pasta com a qual você deseja que o Pi trabalhe e, em seguida, inicie-o:

```bash
cd /caminho/para/pasta
pi
```

A pasta de trabalho ajuda o Pi a descobrir arquivos relevantes, instruções e configurações. O Pi também a utiliza para agrupar as sessões salvas.

<p align="center"><img src="images/interactive-mode.png" alt="Pi rodando em um terminal com uma conversa, editor de entrada e rodapé de status" width="750"></p>

A interface mostra a sua conversa, um editor para prompts e comandos, e um rodapé com a pasta atual, model e status da sessão. Consulte [Usar o Pi no terminal](usage.md) para aprender a adicionar arquivos, executar comandos, direcionar o trabalho em andamento e gerenciar resultados.

## 3. Escolher um model

Um **model** gera as respostas do Pi. Um **provedor** é o serviço ou conta que o Pi usa para acessar esse model.

No Pi, execute:

```text
/login
```

Escolha um provedor e siga as instruções para usar uma assinatura ou armazenar uma chave de API. Execute `/model` em seguida se desejar selecionar um model disponível diferente.

Consulte [Escolher um model e provedor](models.md) para provedores suportados, autenticação via variável de ambiente, models locais e endpoints personalizados.

## 4. Passar uma tarefa para o Pi

O Pi mostra cada leitura de arquivo, pesquisa, comando e edição que ele realiza. Ele não pede permissão antes de cada chamada de ferramenta.

Insira uma tarefa que corresponda ao seu trabalho, por exemplo:

```text
Resuma @meeting-notes.md e salve os itens de ação em action-items.md.
```

```text
Explique como este repositório está estruturado e como executar suas validações.
```

```text
Compare @previous.csv com @current.csv e resuma as principais alterações.
```

Digite `@` no editor para procurar por um arquivo em vez de digitar seu caminho completo. Quando o Pi terminar, revise a resposta e quaisquer arquivos alterados. Use controle de versão ou backups para trabalhos importantes. Para trabalhos não supervisionados ou não confiáveis, use um container ou outra sandbox. Veja [Segurança](security.md).

## Continuar mais tarde

O Pi salva as sessões automaticamente. Saia do Pi e, em seguida, retome a sessão mais recente para a mesma pasta de trabalho com:

```bash
pi --continue
```

Use `/resume` para escolher outra sessão salva. Consulte [Continuar ou fazer branch de uma sessão](sessions.md) para saber mais sobre nomeação de sessão, branching, compactação, exportação e compartilhamento.

## Próximos passos

- [Usar o Pi interativamente](usage.md) para aprender sobre entrada, comandos, atalhos e mensagens enfileiradas.
- [Adicionar instruções](configuration.md#context-files) que o Pi deve seguir sempre que trabalhar em uma pasta.
- [Escolher um model e provedor](models.md).

### Escolher como personalizar o Pi

Comece com o mecanismo menos poderoso que atenda à sua necessidade:

| Necessidade | Comece com |
|---|---|
| Dar ao Pi instruções persistentes para uma pasta | [`AGENTS.md`](configuration.md#context-files) |
| Reutilizar um prompt do menu `/` | [Template de prompt](prompt-templates.md) |
| Adicionar instruções específicas de tarefas e arquivos de suporte | [Skill](skills.md) |
| Adicionar ferramentas executáveis, comandos ou manipuladores de eventos | [Extensão](extensions.md) |
| Criar um componente de terminal customizado | [Terminal UI](tui.md) |
| Conectar a um serviço de model não suportado | [Provedor customizado](custom-provider.md) |
| Instalar ou distribuir vários recursos | [Pacote do Pi](packages.md) |

## Desinstalar o Pi

Se você instalou o Pi com npm, execute:

```bash
npm uninstall -g @earendil-works/3pi-coding-agent
```

Se você usou o instalador, execute-o novamente e escolha **Uninstall Pi**:

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

Se você instalou o Pi com Nix, execute:

```bash
nix profile remove pi
```

Nenhum desses métodos remove a configuração, credenciais, sessões ou pacotes do Pi instalados em `~/.3pi/agent/`.
