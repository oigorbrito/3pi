# Política de Segurança

Este documento deve te orientar a compreender o conceito de segurança por trás do Pi e, também, sobre onde estão os seus limites.

Geralmente, o Pi é um agente de código (coding agent) executado localmente, dentro da fronteira de segurança do usuário que o roda. É da responsabilidade do usuário monitorar as suas operações ou contê-lo em um container, máquina virtual ou em outra solução de Sandbox.

O Pi trata a conta de usuário local e os arquivos em que aquela conta pode gravar (writable) como componentes inseridos na mesma fronteira de confiança (trust boundary) que o processo em si do Pi. Se um atacante for capaz de modificar arquivos sob o diretório base (home) do usuário, workspace, arquivos de iniciação (startup) do shell, ambiente, ou na configuração do Pi, eles, em geral, poderão influenciar o Pi ou outras ferramentas locais do desenvolvedor. Relatórios que dependam de tal acesso de gravação (write access) local prévio não são vulnerabilidades de segurança a menos que comprovem como o Pi cede tal acesso de gravação ou ultrapassa um limite de privilégio do sistema operacional.

O Pi depende que os seus usuários instalem extensões confiáveis, utilizem skills que sejam seguros e usem o pi unicamente em repositórios de confiança. O motivo disso é que arquivos como o `AGENTS.md` ou as instruções nos comentários podem ser usados, de forma trivial, para ataques de prompt injection contra o coding agent, e não há como se proteger contra isso.

## Relatando uma Vulnerabilidade

Caso você acredite que encontrou uma vulnerabilidade de segurança no pi ou em um outro pacote dentro deste repositório, por favor a reporte de forma privada ao:

- Enviar um email para `security@earendil.com`, ou
- Abrir um relatório privado através dos Conselhos de Segurança (Security Advisories) do GitHub deste repositório

Por favor inclua:

- A descrição do problema e de seu impacto
- Os passos para o reproduzir, uma prova do conceito (proof of concept), ou logs relevantes
- O pacote (package) afetado, versão, commit, ou configuração
- Quaisquer formas de atenuação (mitigations) conhecidas

Não abra uma issue pública em casos de relatórios com sensibilidade de segurança. Iremos avaliar os relatórios e coordenaremos as divulgações nos locais e momentos mais adequados.

## Escopo

As falhas de segurança encontradas nos pacotes que são distribuídos, nas ferramentas de linha de comando (CLI), APIs e no código do repositório se situam dentro do escopo assim como infraestrutura operada pela earendil em `pi.dev`.

## Fora de Escopo

- A execução do código a nível local ou o comportamento de isolamento (sandbox) (o coding agent do Pi foi planejado de forma intencional para não possuir sandbox)
- O comportamento das extensões ou dos skills do pi instalados pelo usuário
- Os riscos decorrentes de trabalhos desenvolvidos em repositórios de risco
- Os riscos de se instalar extensions, skills, packages ou ferramentas que não são confiáveis
- Os problemas causados pela interferência (MITM) de proxies que não são de confiança
- A exposição de uma instalação Pi para a rede pública (internet)
- Ataques de Prompt injection
- Os segredos expostos que representam credenciais (credentials) de terceiros / controladas por usuários
- Relatórios que exijam as capacidades de criar, alterar, deletar, ou substituir arquivos, diretórios, symlinks, variáveis de ambiente, configurações de shell, ou qualquer outro estado local sob o controle do usuário (user-controlled) na máquina alvo. Isso vai desde o `~/.3pi`, `~/.3pi/agent/models.json`, os arquivos do workspace, `AGENTS.md`, skills, extensões, configuração das extensões, dotfiles e arquivos sincronizados através de NFS, até os perfis que utilizam roaming (roaming profiles), ou os gerenciadores (managers) de dotfiles, com exceção de se o relatório conseguir expor que o próprio Pi consegue conceder tal acesso.
- Questões ocasionadas pelas configurações enfraquecidas ou desabilitadas deliberadamente pelo próprio usuário.
- O uso de processos envolvendo reivindicações de recurso/DOS (negativa de serviço) e que demandam a injeção via input local / de confiabilidade a fim de prejudicar ou interromper de alguma maneira as operações do coding agent do pi.
- Os relatórios que tratem de processos e de dados gerados pelos modelos onde se contemple a exibição dos outputs corrompidos, ou de resultados perversos (malicious).
- Ações no âmbito local iniciadas ou consentidas (approved) pelo usuário, as quais foram demonstradas ser problemas sob o formato de vulnerabilidades (vulnerabilities).

## Avisos para quem relatar (Reporters)

Os relatórios mais úteis mostram um desvio (bypass) de limite de segurança atual e reprodutível com impacto demonstrado. Relatórios que mostram apenas comportamento esperado do agente local, prompt injection ou uma extensão/skill confiável maliciosa não são vulnerabilidades de segurança sob este modelo.

Por exemplo, um relatório mostrando que conteúdos maliciosos escritos em um arquivo de configuração confiável do Pi fazem com que o Pi execute comandos, carregue ferramentas controladas por um atacante, envie credenciais para um endpoint controlado por um atacante ou de outra forma mude o seu comportamento, está fora do escopo.

Quando possível, inclua o caminho exato afetado, a versão do pacote ou o commit SHA, a configuração e uma prova de conceito contra o release mais recente ou o `main` mais recente. Para relatórios de dependência, inclua evidências de que a dependência enviada (shipped) foi afetada e que a falha pode ser alcançada através do Pi. Para relatórios de segredos expostos, inclua evidências de que a credencial é de propriedade do Earendil ou concede acesso à infraestrutura ou aos serviços operados pelo Earendil.
