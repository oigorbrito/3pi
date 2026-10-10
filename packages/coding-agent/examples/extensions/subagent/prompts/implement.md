---
description: Fluxo de trabalho completo de implementação - scout reúne contexto, planner cria plano, worker implementa
---
Use a ferramenta subagent com o parâmetro chain para executar este fluxo de trabalho:

1. Primeiro, use o agente "scout" para encontrar todo o código relevante para: $@
2. Em seguida, use o agente "planner" para criar um plano de implementação para "$@" usando o contexto da etapa anterior (use o placeholder {previous})
3. Finalmente, use o agente "worker" para implementar o plano da etapa anterior (use o placeholder {previous})

Execute isso como uma chain, passando a saída entre as etapas via {previous}.
