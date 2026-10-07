# Executar o Pi com Segurança

Trate os comandos e códigos gerados pelos models como não confiáveis. O Pi pode ler, alterar e executar arquivos com as permissões da conta que o iniciou e não solicita aprovação antes de cada chamada de ferramenta. As extensões, instaladores de pacotes, servidores de linguagem e outros processos filhos são executados com essas mesmas permissões, a menos que um sistema operacional ou limite de virtualização os restrinja.

Arquivos, comentários, instruções, saídas de comandos e respostas do model podem orientar o model através de injeção de prompt. A confiança do projeto controla quais recursos do projeto são carregados na inicialização, mas isso não torna o conteúdo ou as ações resultantes seguras.

A segurança advém de limitar os arquivos, credenciais, processos e serviços de rede aos quais o Pi pode acessar e afetar caso uma ação gerada seja incorreta ou hostil. Assistir à transcrição, usar a confiança do projeto e revisar as alterações não criam um limite de segurança.

## Escolha como executar o Pi

As diferentes maneiras de executar o Pi colocam limites diferentes naquilo a que os comandos gerados podem aceder:

| Como o Pi é executado | O que permanece protegido |
|---|---|
| Diretamente, com as permissões de seu usuário do sistema operacional | Qualquer coisa que esse usuário não possa acessar. Uma conta de usuário dedicada pode restringir essas permissões, mas o Pi ainda compartilha o sistema operacional e a rede com outros usuários. |
| Inteiramente dentro de um container, máquina virtual ou sandbox | Arquivos de host e processos que você não expõe ao ambiente. As credenciais e os serviços de rede permanecem acessíveis se os disponibilizar lá dentro. Geralmente, essa é a opção prática mais forte. |
| Fora do ambiente isolado, com apenas suas ferramentas integradas em execução | Os recursos do host ficam protegidos contra ações realizadas por meio dessas ferramentas. O próprio Pi e outras extensões permanecem fora da fronteira, de modo que essa é uma forma mais restrita de isolamento. |

A pasta de trabalho controla a descoberta de recursos e a localização padrão para as ferramentas, mas não impede que os comandos acessem outros caminhos disponíveis para o processo do Pi.

Independentemente da opção escolhida, forneça apenas os arquivos e os serviços necessários para a tarefa. Mantenha as credenciais fora do ambiente sempre que possível, ou use credenciais de escopo restrito e de curta duração. Restrinja o acesso à rede quando os comandos não precisarem dela.

Para instruções de configuração e as limitações de cada método de isolamento, veja [Executar o Pi num ambiente isolado](containerization.md).

<a id="project-trust"></a>

## Entender a confiança do projeto

A confiança do projeto (project trust) controla se o Pi carrega a maioria das configurações e dos recursos fornecidos por uma pasta de trabalho. Ela impede que uma pasta carregue silenciosamente extensões executáveis antes de você aprová-la.

A confiança do projeto não é um limite de inicialização completo. O Pi lê a configuração `sessionDir` do projeto ao selecionar ou criar uma sessão, antes de resolver a confiança do projeto. A recusa de confiança evita o carregamento das demais configurações de projeto e recursos protegidos, mas não desfaz a pesquisa inicial do diretório da sessão.

A confiança do projeto não limita aquilo que as chamadas das ferramentas podem aceder ou afetar. Depois que o Pi é iniciado, as ferramentas ativadas ainda usam as permissões do sistema operacional do processo do Pi. Instruções e outros conteúdos na pasta também podem influenciar o model.

### Recursos protegidos pela confiança do projeto

O Pi requer uma decisão de confiança do projeto quando encontra qualquer um dos seguintes recursos no diretório de trabalho atual:

- `.3pi/settings.json`
- `.3pi/mcp.json`
- `.3pi/extensions`, `.3pi/skills`, `.3pi/prompts`, ou `.3pi/themes`
- `.3pi/SYSTEM.md` ou `.3pi/APPEND_SYSTEM.md`
- `.agents/skills` do projeto no diretório atual ou em um diretório ancestral

Um diretório `.3pi` vazio não requer a confiança do projeto.

A concessão de confiança do projeto permite ao Pi carregar:

- configurações do projeto
- servidores MCP do projeto a partir de `.3pi/mcp.json`
- extensões, skills, templates de prompt, temas e arquivos de prompt do sistema contidos em `.3pi`
- pacotes em falta configurados pelas definições do projeto
- extensões locais e de pacotes do projeto

Recusar a confiança do projeto omite esses recursos protegidos, com exceção da verificação inicial `sessionDir` descrita acima.

Arquivos de contexto como `AGENTS.override.md`, `AGENTS.md` e `CLAUDE.md` carregam independentemente da confiança do projeto, a menos que você desative o carregamento de contexto. Trate as instruções de uma pasta como dados de entrada não confiáveis mesmo ao recusar a confiança do projeto.

### Como o Pi escolhe a decisão de confiança

Uma substituição da linha de comandos `--approve` ou `--no-approve` é aplicada primeiro. Quando há recursos protegidos e nenhuma substituição na linha de comando:

1. As extensões em nível de usuário e de linha de comando podem processar o evento `project_trust`. A primeira extensão que retornar sim ou não fica com a decisão.
2. Se nenhuma extensão decidir, o Pi procura por uma decisão guardada para o diretório atual ou para um dos seus pais. Aplica-se a decisão mais próxima.
3. Se não houver decisão guardada aplicável, o Pi segue a configuração global `defaultProjectTrust`, cujo padrão é `"ask"`.

As decisões salvas usam os caminhos de diretório canônicos e vivem em:

```text
~/.3pi/agent/trust.json
```

Use `/trust` para guardar uma decisão para processos futuros do Pi.

### Confiança de projeto sem prompt interativo

Os modos Print, JSON e RPC não conseguem mostrar o prompt de confiança incorporado. Se nenhuma substituição na linha de comando, extensão ou decisão guardada for aplicável:

- `defaultProjectTrust: "always"` carrega os recursos de projeto protegidos.
- `defaultProjectTrust: "ask"` ou `"never"` os ignora.

Use `--approve` ou `--no-approve` quando uma execução automatizada precisar de uma decisão explícita única.

## Reduzir o impacto e melhorar a recuperação

Estas práticas não substituem o isolamento, mas reduzem a exposição e facilitam a recuperação:

- Conceda ao Pi acesso apenas aos arquivos e serviços necessários para a tarefa.
- Utilize snapshots, backups ou controle de versão antes de grandes alterações.
- Avalie as extensões e pacotes antes de os carregar. Extensões são executadas dentro do processo do Pi.
- Dê preferência a credenciais de escopo restrito e de curta duração.
- Verifique diffs e a saída gerada antes de aplicar os resultados noutro sistema.
- Verifique sessões antes de as exportar ou partilhar. Elas podem conter prompts, os argumentos da ferramenta, a saída de comandos, conteúdo de arquivo e credenciais reveladas na conversa.

## Relatar problemas de segurança

Siga a [Política de Segurança](https://github.com/earendil-works/pi/blob/main/SECURITY.md) do repositório. Não abra um problema público para enviar um relatório sensível de segurança.

O comportamento esperado do agent local, a injeção de prompt por conteúdo não confiável, a ausência de uma sandbox embutida e os comportamentos advindos das extensões ou skills instalados pelos utilizadores encontram-se fora da fronteira de segurança, a menos que o relatório comprove um contorno na fronteira de privilégio ou um acesso que o utilizador local já não possuía.
