---
description: simplificar um workpackage concluído
---

Revise o workpackage concluído e simplifique sua implementação sem alterar o comportamento pretendido.

## Escopo

- Foco no código adicionado ou afetado pelo workpackage e no código próximo necessário para simplificá-lo de forma coerente.
- Não realize limpezas não relacionadas.
- Leia os arquivos afetados por completo e entenda os invariantes relevantes, locais de chamada, testes e API pública antes de editar.
- Otimize para um design direto, coerente e sustentável — não para o menor diff.

## O que remover ou simplificar

- Remova abstrações que não têm responsabilidade clara ou não reduzem a complexidade real.
- Faça inline de helpers triviais, wrappers, adapters e camadas de repasse quando eles obscurecem em vez de esclarecer o comportamento.
- Remova lógica duplicada e coloque o comportamento compartilhado na camada existente apropriada.
- Remova flexibilidade especulativa, configuração, pontos de extensão e mecanismos genéricos que não têm requisito atual.
- Remova programação defensiva especulativa dentro de código confiável. Valide nas fronteiras de confiança reais; dependa de tipos e invariantes estabelecidos internamente.
- Não mantenha comportamento de fallback para estados que deveriam ser impossíveis. Prefira corrigir o invariante ou modelo de tipos.
- Simplifique estado excessivo, flags booleanas, ramificações, indireção e casos especiais. Reformule a representação subjacente quando for mais clara.
- Reforce os tipos do TypeScript para que estados inválidos sejam irrepresentáveis. Evite `any`, asserções desnecessárias, tipos amplos e campos opcionais para estados impossíveis.
- Prefira código direto e legível em vez de esperteza, abstração prematura e infraestrutura estilo framework.
- Delete comentários que meramente reescrevem o código, mas preserve comentários que explicam restrições, intenções ou decisões não óbvias.

## Portão de aprovação para remoções significativas

Antes de fazer qualquer remoção significativa ou potencialmente intencional, pare e peça a aprovação do usuário. Primeiro explique:

1. o que você propõe remover ou alterar;
2. por que parece desnecessário ou excessivamente defensivo;
3. que comportamento, compatibilidade, extensibilidade, validação ou tratamento de falhas pode ser afetado;
4. o substituto mais simples, se houver; e
5. sua recomendação.

Aguarde a aprovação explícita antes de aplicar essa alteração. Não agrupe aprovação para várias decisões independentes; apresente-as separadamente quando as desvantagens (tradeoffs) diferirem.

Trate uma decisão como significativa quando ela remover ou alterar materialmente qualquer um dos seguintes:

- comportamento visível ao usuário ou fluxos de trabalho suportados;
- APIs públicas, formatos persistidos, comportamento de protocolo ou compatibilidade com versões anteriores;
- validação, autorização, verificações de segurança, recuperação, novas tentativas (retries), fallbacks ou tratamento de erros;
- uma abstração ou ponto de extensão que pareça deliberado ou tenha vários consumidores;
- funcionalidade coberta por testes ou documentação;
- código cujo propósito ou invariante seja incerto.

Limpezas rotineiras e que preservam o comportamento não exigem aprovação, como fazer inline de um helper trivial de uso único, remover uma ramificação inacessível provada como impossível pelo modelo de tipos ou excluir duplicação recém-adicionada. Se houver dúvida se uma remoção é significativa, pergunte.

## Restrições

- Preserve o comportamento pretendido a menos que o usuário aprove explicitamente uma alteração.
- Não remova código meramente porque não está sendo usado até que você tenha verificado se é uma API pública, ponto de extensão, ponto de entrada gerado ou superfície de compatibilidade intencionalmente retida.
- Não substitua código claro por uma nova abstração apenas para reduzir a contagem de linhas.
- Não enfraqueça os testes para permitir a simplificação. Atualize os testes apenas quando uma alteração de comportamento aprovada ou uma estrutura equivalente mais limpa o exigir.
- Siga as instruções de validação e testes do repositório após as edições.

## Conclusão

Após editar, revise o diff final em busca de complexidade evitável, duplicação, indireção, ramificações defensivas e alterações acidentais de comportamento. Relate:

- o que foi simplificado;
- em quais invariantes a implementação agora se baseia;
- quaisquer remoções significativas que você não fez porque a aprovação não foi concedida; e
- a validação realizada e seus resultados.

Passar nos testes e nas verificações de tipo é necessário, mas não suficiente. Deixe o código afetado mais fácil de entender e alterar.
