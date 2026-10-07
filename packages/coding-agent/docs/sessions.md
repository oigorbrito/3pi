# Sessões e Contexto

O Pi salva uma conversa como uma sessão. O branch ativo dessa sessão fornece o histórico de conversa para a próxima solicitação ao model. Use os comandos de sessão para continuar um trabalho, explorar outro branch ou reduzir a quantidade de histórico enviado ao model.

## Continuar ou mudar de sessão

O Pi salva sessões automaticamente, a menos que seja iniciado com `--no-session`.

```bash
pi --continue
pi --resume
```

O `--continue` abre a sessão mais recente no diretório de trabalho atual. O `--resume` abre o seletor de sessões. No modo interativo, `/resume` abre esse mesmo seletor e `/new` inicia uma nova sessão.

Use `/name` ou `--name` para atribuir um nome reconhecível para a sessão. Execute `/session` para conferir o arquivo da sessão atual, o ID, a quantidade de mensagens, os tokens consumidos e os custos associados.

O seletor de sessões permite que você faça pesquisas, altere o nome e exclua as sessões. Também é possível exibir caminhos, alterar a ordem de exibição e limitar os resultados às sessões com nome. Veja [Atalhos de teclado](keybindings.md#sessions) para atalhos adicionais.

## Escolher como criar um branch

O Pi arquiva os registros em um formato de árvore. Desse modo, o regresso a um ponto passado da conversa não exclui o branch abandonado.

| Ação | Resultado | Quando usar |
|---|---|---|
| `/tree` | Movimenta-se no arquivo da sessão ativa | Soluções semelhantes precisam permanecer juntas |
| `/fork` | Produz uma nova sessão a partir de uma mensagem anterior do utilizador | A solução alternativa necessita transformar-se num novo projeto separado |
| `/clone` | Duplica o branch ativo para uma nova sessão | É necessária uma duplicata independente do estado vigente |

No `/tree`, selecione a mensagem do utilizador para readicioná-la ao editor. Ao submeter a edição da mensagem, o programa irá compor outro branch. Ao selecionar respostas do assistente e outras entradas adicionais, a ação reiniciará a digitação sem dados na tela no momento selecionado.

Quando abandonar um branch, o Pi irá fazer o resumo dessas informações abandonadas e as anexar no novo branch, salvaguardando as instruções do arquivo, mesmo reduzindo a extensão textual da conversa.

Para árvores salvaguardadas, verifique os diferentes tipos acessando [Formato da Sessão](session-format.md).

## Administrar o contexto da conversa

Os modelos utilizam os branchs selecionados durante as sessões; o modelo não possui todos os recursos dos processos de conversação do sistema. O Pi engloba estas orientações ao prompt central de sistema e incorpora-os através dos recursos da plataforma. Consulte [Como Funciona o Pi](how-pi-works.md#context) sobre como incorporar os relatórios elaborados.

A rodapé indica a taxa quantitativa utilizada pelo contexto. A quantificação excede a taxa central pelo dimensionamento de espaço limite pela execução de processos; a diminuição temporal arquivada é ativada se necessário. Os eventos salvaguardados em síntese guardam referências. Contudo, os mesmos continuam não sendo subtraídos através de entradas e saídas pelo utilizador na árvore originária.

Abra o `/compact` na conversão condensada ativa e manual de instruções que preservam ou evitam tópicos no resgate contextual para os arquivos. Consulte [Configurações](settings.md#compaction).

Dificuldades relacionadas na prestação dos provedores do sistema e restrições poderão ser superadas corrigindo e recarregando atuações de compilações pelo comando ativado de compilação sem intervenções no fluxo automático.

Para dados e detalhes referentes aos gatilhos limitadores consulte os processos por meio do artigo em [Referência de Compactação](compaction.md).

## Restringir registros das sessões no sistema

Se não indicadas definições contrárias por padrão, as pastas `~/.3pi/agent/sessions/` centralizam o diretório principal da partição de operações do Pi. Use as tags `--session-dir`, a variável `PI_CODING_AGENT_SESSION_DIR`, ou em ambiente customizado por parâmetros como `sessionDir`. No que refere-se ao controle, o modelo imposto pela identificação através de linha de comandos atende às mais estritas especificações e primazias.

A identificação `--no-session` orienta a interrupção temporal, impossibilitando regressos quando as operações concluírem as exigências no encerramento de acesso.

Nas demandas quando já souber identificar os caminhos referentes pelo sistema de endereçamento e sessões pela especificação, opte pelas implementações `--session`. Na necessidade gerada para transcrever uma duplicata a partir da plataforma anterior nos parâmetros baseados ao se ingressar nas dinâmicas operacionais via interface por intermédio das instruções de texto do Pi, implemente o termo expresso como `--fork`.

## Exportação ou compartilhamento sistêmico

Inicie com `/export` e repasse a sessão para recursos aplicacionais em plataformas nos formatos HTML e extensões em código com o uso de chaves JSONL associadas. Ao executar o termo `/share`, transmitem-se arquivos a links direcionados ao visualizador externo. Atuando com instâncias de sistemas Radius de forma sincronizada com as certificações operacionais ativadas o uso da base é transferida aos Gist nos formatos privados das chaves da identificação do Github pelas rotinas operacionais associadas se o acesso falhar com as referências operacionais por falta destas identificações com Radius.

Faça análises críticas nas informações enviadas. Atributos da linha de conversações entre processos de arquivos com comandos nas plataformas locais em computadores pessoais são propensas ao acesso não seguro se houver omissão prévia com dados de comandos da ferramenta interna, registros originários gerados pelo acesso local ou conteúdos de extensão não assegurados nos textos.

## Fazer registro ou submeter bugs na plataforma

Abra `/bug [description]` e direcione os desenvolvedores para as intercorrências. Submeta a ocorrência com uma representação nas transações do sistema ao modelo interativo pela identificação da sumariação da requisição ao relatar problemas na transcrição pela sensibilidade operacional identificada por registros da utilização interna no decorrer do processamento dos processos de conversação do utilizador pelo software base em utilização nos casos registrados pelas atuações da plataforma na versão submetida aos relatórios.

O escopo operacional enviado engloba particularidades operacionais vinculadas nas características da configuração utilizada limitadas na omissão das informações restritas, senhas pessoais com os erros processados. As permissões Radius de autenticação efetuam processos por submissões na área no sistema e caso isto falhar um erro reportará ao formato comprimido Zip na partilha para efetuar transferências por caminhos restritos ao modelo Radius; este ambiente não pede ingresso. Os desenvolvimentos continuam e a resposta ao feedback por Radius também abrange soluções e revisões que ocorrem caso se instale os comandos exportados.
