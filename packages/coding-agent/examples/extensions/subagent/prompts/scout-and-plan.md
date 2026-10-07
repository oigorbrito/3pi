---
description: Scout reúne contexto, planner cria plano de implementação (sem implementação)
---
Use a ferramenta subagent com o parâmetro chain para executar este fluxo de trabalho:

1. Primeiro, use o agente "scout" para encontrar todo o código relevante para: $@
2. Em seguida, use o agente "planner" para criar um plano de implementação para "$@" usando o contexto da etapa anterior (use o placeholder {previous})

Execute isso como uma chain, passando a saída entre as etapas via {previous}. NÃO implemente - apenas retorne o plano.
