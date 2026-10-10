---
description: Worker implementa, reviewer revisa, worker aplica o feedback
---
Use a ferramenta subagent com o parâmetro chain para executar este fluxo de trabalho:

1. Primeiro, use o agente "worker" para implementar: $@
2. Em seguida, use o agente "reviewer" para revisar a implementação da etapa anterior (use o placeholder {previous})
3. Finalmente, use o agente "worker" para aplicar o feedback da revisão (use o placeholder {previous})

Execute isso como uma chain, passando a saída entre as etapas via {previous}.
