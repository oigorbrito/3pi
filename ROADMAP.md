# Roadmap do 3pi

> **Objetivo:** evoluir o projeto 3pi para melhorar custo por tarefa concluída, confiabilidade e autonomia controlada sem perder simplicidade, compatibilidade com o upstream ou capacidade de reverter mudanças.
>
> **Regra de ouro:** nenhuma otimização é considerada ganho até ser medida em tarefas comparáveis. Não trocar evidência por intuição.

## Estado atual

Este documento é o plano de trabalho e não uma declaração de que as funcionalidades já foram implementadas.

- [ ] Estabelecer baseline reproduzível de tarefas, custo, tokens, latência e taxa de sucesso.
- [ ] Auditar o estado do repositório, branches, workflows e divergência do upstream.
- [ ] Inventariar issues e PRs relevantes do upstream e do projeto, com paginação completa e sem duplicação.
- [ ] Avaliar features candidatas de projetos doadores uma por vez.
- [ ] Publicar resultados e decisões com links para PRs, testes e medições.

**Situação inicial:** este roadmap não registra benchmark próprio concluído. Até os testes serem executados e publicados, qualquer ganho de custo ou qualidade permanece uma hipótese.

## Regras não negociáveis

1. **Não fazer push direto na `main` por automação.** Alterações passam por branch e Pull Request.
2. **Não fazer merge automaticamente.** A revisão e a decisão final são humanas.
3. **Manter o upstream rastreável.** Sincronizações devem ser PRs revisáveis; não reescrever histórico compartilhado nem fazer force-push na `main`.
4. **Uma variável por experimento.** Evitar combinar várias mudanças no mesmo benchmark.
5. **Medir a tarefa completa.** Incluir tokens de entrada e saída, chamadas de ferramentas, tentativas, custo monetário e latência.
6. **Preservar uma baseline.** Comparar a mesma suíte, modelos, prompts, limites e ambiente.
7. **Toda feature deve ser reversível.** Preferir flags, extensões ou mudanças isoladas quando viável.
8. **Não importar um framework inteiro sem justificativa.** Estudar o componente mínimo necessário, dependências e licença.
9. **Segurança não pode regredir silenciosamente.** Registrar permissões, acesso a arquivos, execução de comandos e tratamento de credenciais.
10. **Atualizar o roadmap em cada sessão de trabalho.** Registrar status, evidências, decisões e próximo passo.

## Prioridades e fases

Avançar por critérios de saída, não apenas por prazo. Só considerar uma fase concluída quando suas evidências estiverem disponíveis.

### Fase 0 — Controle do projeto e baseline (P0)

**Estado: A FAZER**

- [ ] Confirmar branch principal, remote upstream, workflow de sincronização e permissões.
- [ ] Auditar merges e divergências entre branches; avaliar correções separadamente e sem reversões automáticas.
- [ ] Inventariar issues e PRs do upstream e do projeto com paginação completa; documentar limitações, duplicatas e correspondências.
- [ ] Selecionar tarefas representativas: bug reproduzível, mudança pequena, refatoração e tarefa que exija testes.
- [ ] Registrar versões do Pi, Node, sistema operacional, modelo/provedor, parâmetros, prompts e comandos.
- [ ] Capturar baseline com pelo menos 3 execuções por tarefa quando viável; publicar resultados brutos e mediana.
- [ ] Definir limites de tempo, custo e tentativas, além de critérios objetivos de conclusão.

**Saída exigida:** instruções de reprodução, conjunto fixo de tarefas, resultados da baseline e relatório do estado do repositório.

### Fase 1 — Eficiência de contexto e edição (P0)

**Estado: BLOQUEADA ATÉ A BASELINE**

Investigar:

- [ ] Seleção de arquivos e contexto relevante para reduzir leituras repetidas.
- [ ] Edição por diff/patch em vez de reescrita completa, quando compatível.
- [ ] Compactação ou resumo do histórico, validando que requisitos importantes não se perdem.
- [ ] Eliminação de chamadas redundantes de ferramentas e leituras repetidas de estado.
- [ ] Encerramento da execução quando critérios objetivos de conclusão forem satisfeitos.

**Projetos para estudar:** [Aider](https://github.com/Aider-AI/aider) (edição, mapa do repositório e contexto) e [Pi upstream](https://github.com/earendil-works/pi) (extensões e contexto nativo).

**Aceitação:** comparação A/B na mesma suíte; relatar tokens de entrada/saída, custo, latência, sucesso, tentativas e falhas. Só adotar se o ganho for repetível e não houver regressão relevante de qualidade.

### Fase 2 — Execução, recuperação e segurança (P1)

**Estado: NÃO INICIADA**

- [ ] Mapear o comportamento atual de shell, edição, testes, erros e permissões.
- [ ] Avaliar checkpoints e recuperação segura após falhas de patch ou testes.
- [ ] Avaliar sandbox, limites de escrita e modos graduais de aprovação.
- [ ] Testar timeouts, limites de saída e cancelamento.
- [ ] Testar tarefas interrompidas, comandos com falha, arquivos modificados e repetição de execução.

**Projetos para estudar:** [OpenAI Codex CLI](https://github.com/openai/codex) para políticas de execução e sandbox; [OpenHands Software Agent SDK](https://github.com/OpenHands/software-agent-sdk) para ambientes de execução; Pi upstream como base de integração.

**Aceitação:** testes de segurança e regressão documentados; permissões e comportamento padrão explícitos; mudança reversível. Não retirar shell nem aumentar a autonomia sem evidência e análise de risco.

### Fase 3 — Roteamento de modelos e custo (P1)

**Estado: NÃO INICIADA**

- [ ] Medir custo real por tarefa e por modelo/provedor em tarefas equivalentes.
- [ ] Definir quando roteamento ou fallback é permitido e quais erros o acionam.
- [ ] Separar custo estimado de custo efetivamente faturado.
- [ ] Avaliar falhas de autenticação, limites de taxa, indisponibilidade e respostas incompatíveis.
- [ ] Manter a seleção explícita de modelo e uma forma de desligar o roteamento.

**Aceitação:** ganho medido em custo por tarefa concluída, sem degradação inaceitável da taxa de sucesso; fallback testado e comportamento previsível. Um modelo barato não é necessariamente mais econômico se exigir mais tentativas.

### Fase 4 — Harness de avaliação contínua (P0 transversal)

**Estado: A FAZER; acompanha todas as fases**

- [ ] Manter tarefas e critérios de sucesso versionados.
- [ ] Automatizar execuções repetíveis sem expor segredos.
- [ ] Guardar resultados por commit/PR e configuração.
- [ ] Medir taxa de conclusão, tokens, custo, latência, chamadas de ferramenta, tentativas e regressões.
- [ ] Comparar baseline e candidato; repetir resultados inesperados.
- [ ] Distinguir falha do harness, do provedor e da tarefa.

**Projeto para estudar:** [SWE-agent](https://github.com/SWE-agent/SWE-agent), como referência para avaliação em tarefas reais de engenharia de software — não como prova de que os mesmos resultados ocorrerão no 3pi.

**Aceitação:** toda afirmação de que uma feature é “mais barata”, “mais rápida” ou “melhor” deve incluir comandos de reprodução e resultados comparáveis.

### Fase 5 — Integração seletiva e manutenção (P2)

**Estado: NÃO INICIADA**

- [ ] Revisar licença, dependências, manutenção e superfície de segurança antes de adaptar código de outros projetos.
- [ ] Preferir uma extensão isolada quando ela cumprir o requisito.
- [ ] Documentar origem, versão/commit do projeto doador e alterações locais.
- [ ] Executar testes relevantes, build, lint e typecheck disponíveis.
- [ ] Preparar PR pequeno, com motivação, trade-offs, resultados e instruções de rollback.
- [ ] Atualizar o roadmap e o registro de decisões após cada merge aprovado.

**Aceitação:** revisão humana aprovada, testes passando, impacto documentado e caminho de reversão conhecido.

## Matriz de projetos doadores

| Projeto | O que investigar | O que não assumir |
|---|---|---|
| [Pi upstream](https://github.com/earendil-works/pi) | Extensões, contexto, APIs, compatibilidade e correções upstream | Que toda mudança upstream deve entrar imediatamente |
| [Aider](https://github.com/Aider-AI/aider) | Seleção de arquivos, mapa do repositório, formatos de edição | Que patches menores significam menos tokens totais |
| [OpenAI Codex CLI](https://github.com/openai/codex) | Sandbox, aprovações e controles de execução | Que a arquitetura inteira é compatível com Pi |
| [OpenHands SDK](https://github.com/OpenHands/software-agent-sdk) | Isolamento e ciclo de vida do ambiente de execução | Que o framework completo compensa o custo de integração |
| [SWE-agent](https://github.com/SWE-agent/SWE-agent) | Protocolo de benchmark e tarefas de engenharia | Que resultados publicados se reproduzem sem controlar ambiente e modelo |

Nenhum código deve ser copiado automaticamente. Para cada candidato, registrar: feature exata, caminho/commit de origem, licença, dependências, plano de teste, esforço estimado e decisão (adotar, adaptar, rejeitar ou adiar).

## Protocolo mínimo de benchmark

Para cada tarefa e configuração, registrar:

- Identificador da tarefa e commit do código testado.
- Modelo, provedor, versão/parâmetros e configuração do harness.
- Resultado: passou/falhou segundo critérios objetivos.
- Tokens de entrada e saída, quando disponíveis; não misturar estimativas com medições.
- Custo monetário real ou estimado, identificando qual.
- Duração, chamadas de modelo/ferramenta e número de tentativas.
- Erros, intervenção humana e observações.
- Comando ou script para reproduzir.

Comparar baseline e candidato nas mesmas tarefas e condições. Relatar mediana e dispersão; não esconder falhas em uma média agregada. Se a amostra for pequena, declarar isso. Não adotar mudanças com base em uma única execução.

## Portões de decisão experimental (reconciliação do plano)

Esta seção torna obrigatórias as salvaguardas metodológicas descritas no roadmap. Ela não afirma que os experimentos já foram executados.

### Antes de cada experimento

Registrar em issue ou documento versionado, antes de observar os resultados:

- Hipótese e mecanismo esperado; qual variável será alterada e quais permanecerão fixas.
- Tarefas, versões, modelo/provedor, parâmetros, ambiente, limites de custo/tempo/tentativas e critérios de sucesso.
- Métrica primária e métricas de proteção (guardrails), incluindo taxa de conclusão e regressões relevantes.
- Regra de decisão: ganho mínimo relevante, margem máxima tolerada de regressão e método de agregação.
- Número de execuções e limitações conhecidas. Três execuções por tarefa são apenas um ponto de partida exploratório, não prova estatística por si só.

### Como declarar um resultado

- **Ganho de eficiência:** reportar custo por tarefa concluída, não apenas custo por tentativa nem tokens isolados.
- **Qualidade:** publicar taxa de sucesso e falhas por tarefa junto das métricas de custo e latência.
- **Comparabilidade:** executar baseline e candidato nas mesmas tarefas e condições; se houver desvio, documentá-lo e não tratar a comparação como equivalente.
- **Incerteza:** mostrar resultados individuais, mediana e dispersão. Amostras pequenas ou resultados inconsistentes devem ser classificados como inconclusivos, não como vitória.
- **Custo:** distinguir custo faturado de estimativa e explicar componentes não medidos.
- **Repetição:** repetir resultados inesperados e verificar se a melhoria se mantém em mais de uma tarefa representativa.

### Portão para adotar, rejeitar ou investigar mais

- **ADOTAR:** o ganho mínimo pré-definido foi atingido de forma reproduzível e os guardrails de qualidade, segurança e compatibilidade foram respeitados.
- **REJEITAR:** não há ganho relevante, o resultado piora de forma consistente, ou o custo/risco de manutenção supera o benefício.
- **INCONCLUSIVO:** dados insuficientes, ruído elevado ou conflito entre métricas; aumentar a amostra ou restringir a hipótese antes de decidir.
- Não escolher limites depois de ver os resultados. Se não houver amostra suficiente para uma conclusão estatística, declarar explicitamente a limitação, sem alegar significância.

### Ordem de prioridade

Ordenar iniciativas por impacto potencial no objetivo, evidência disponível, esforço de implementação, risco de regressão e custo de manutenção. Prioridade alta não substitui a baseline nem autoriza pular testes. Preferir a menor mudança isolada que teste a hipótese; não remover shell, ampliar autonomia ou trocar o harness inteiro sem evidência específica.

## Definition of Done — quando uma feature está concluída

Uma feature só pode ser marcada como **CONCLUÍDA** se:

1. Existe issue/objetivo e hipótese explícita.
2. A implementação está em um PR revisável.
3. Os testes relevantes passaram, com resultados registrados.
4. O benchmark foi comparado à baseline, quando a mudança promete eficiência ou qualidade.
5. Segurança, compatibilidade e regressões foram consideradas.
6. Há instrução de ativação/desativação ou rollback.
7. A documentação e este roadmap foram atualizados.

Status permitidos: **A FAZER**, **EM INVESTIGAÇÃO**, **EM IMPLEMENTAÇÃO**, **BLOQUEADA**, **EM VALIDAÇÃO**, **CONCLUÍDA**, **REJEITADA**. Sempre anexar link para issue, PR ou benchmark; status sem evidência não significa conclusão.

## Registro de decisões

| Data | Decisão | Evidência | Consequência / próxima revisão |
|---|---|---|---|
| 2026-10-09 | Estabelecer roadmap com baseline antes das otimizações | Não há benchmark próprio concluído registrado neste documento | Executar Fase 0; atualizar após auditoria e inventário |

## Handoff obrigatório ao encerrar uma sessão

Deixar para a próxima sessão um resumo com:

1. **Fase atual e objetivo imediato**
2. **Concluído nesta sessão**, com links e evidências
3. **Não concluído e bloqueios**
4. **Decisões tomadas e justificativas**
5. **Arquivos, branches e PRs alterados**
6. **Próxima ação única, concreta e verificável**
7. **Testes/benchmarks a executar e resultados existentes**

Não afirmar que algo foi feito se apenas foi planejado, pesquisado ou discutido.

## Próximo passo recomendado

Completar a **Fase 0**: auditar o estado real do repositório e da sincronização, verificar divergências entre branches e concluir um inventário paginado de issues/PRs. Em paralelo, preparar a primeira versão do benchmark antes de implementar otimizações de tokens.
