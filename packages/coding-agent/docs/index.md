# Pi

Pi é um agente de IA extensível que funciona no seu terminal. Dê a ele um objetivo e uma pasta de trabalho, e ele pode inspecionar arquivos, rodar comandos, editar conteúdo e trabalhar em tarefas de múltiplas etapas.

Use o Pi para desenvolvimento de software, notas de pesquisa, projetos de escrita, arquivos de dados ou hobbies. Você pode usar o Pi como ele é, orientá-lo para se adaptar ao seu fluxo de trabalho, ou construir outras aplicações alimentadas pelo Pi usando o SDK.

## Comece a usar o Pi

Novo no Pi? Siga o [Quickstart](quickstart.md) para instalar o Pi, conectar um modelo e completar sua primeira tarefa.

Se o Pi já estiver instalado, escolha o que você quer fazer:

- [Use o Pi interativamente](usage.md) para adicionar arquivos, rodar comandos, direcionar o trabalho em andamento e exportar resultados.
- [Escolha um modelo](models.md) ou conecte uma assinatura, chave de API, modelo local ou endpoint compatível.
- [Continue ou ramifique uma sessão](sessions.md) para retomar o trabalho ou explorar outra abordagem sem perder o histórico.
- [Configure o Pi](configuration.md) com as suas preferências, pastas de trabalho, instruções e recursos reutilizáveis.
- [Entenda como o Pi funciona](how-pi-works.md), incluindo tools, contexto, sessões e o loop do agente.

## Customize o Pi

O Pi pode reutilizar prompts, carregar instruções especializadas, adicionar integrações executáveis, mudar sua interface de terminal, conectar serviços de modelo e distribuir esses recursos como packages.
Use o [seletor de customização do Quickstart](quickstart.md#choose-how-to-customize-pi) para selecionar o menor mecanismo que atenda à sua necessidade.

## Automatize ou incorpore o Pi

- Use o [modo de impressão](cli.md#invocation-and-output) para tarefas únicas e roteirizadas.
- Use o [modo JSON event stream](json.md) para consumir eventos estruturados de uma execução.
- Use o [modo RPC](rpc.md) para controlar um processo separado do Pi.
- Use o [TypeScript SDK](sdk.md) para rodar o Pi dentro de uma aplicação.

## Encontre informações de referência e configuração

Use as páginas de referência para procurar [opções do CLI](cli.md), [configurações](settings.md), [providers](providers.md), [keybindings](keybindings.md) e [variáveis de ambiente](environment-variables.md).

Para ajuda específica por plataforma, veja [Configuração do Terminal](terminal-setup.md), [Windows](windows.md), [tmux](tmux.md), [Termux no Android](termux.md) ou [Containerização](containerization.md).

## Trabalhe com segurança

As tools e extensões do Pi rodam com as permissões do processo do Pi. A confiança do projeto controla quais recursos do projeto o Pi carrega, mas não isola as chamadas de tool. Revise [Segurança](security.md) antes de usar arquivos não confiáveis, repositórios, extensões ou automação autônoma.
