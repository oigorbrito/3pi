# Contribuindo para o pi

Este guia existe para economizar o tempo de ambos os lados.

## Filosofia

Em primeiro lugar: **o núcleo (core) do pi é minimalista**.

Se a sua funcionalidade não pertence ao core, ela deve ser uma extension. PRs que incham (bloat) o core provavelmente serão rejeitados.

O core do pi existe para ser minimalista e para ser extensível, de forma que possa ser influenciado e manipulado por extensions. Mesmo pontos de conexão (hook points) para extensions, no entanto, devem ser bem considerados e discutidos para evitar a adição de inchaço que não pode ser mantido e interações complexas.

## A Regra de Ouro

**Você deve entender o seu código.** Se você não puder explicar o que as suas modificações fazem e como elas interagem com o restante do sistema, o seu PR será fechado.

Usar a IA para escrever código é válido. Enviar lixo (slop) gerado por IA sem compreendê-lo não é.

Se você utilizar um agent, execute-o a partir do diretório raiz do `pi` para que ele reconheça (picks up) automaticamente o `AGENTS.md`. Seu agent deve seguir as regras e diretrizes descritas naquele arquivo.

## Controle de Contribuição

Todas as issues e os PRs de novos contribuidores são fechados automaticamente por padrão.

Issues enviadas de sexta a domingo não possuem garantia de revisão. Se houver urgência, pergunte no Discord: https://discord.com/invite/3cU7Bz4UPx

Os mantenedores revisam diariamente as issues que foram fechadas automaticamente e reabrem as que valem a pena. As issues que não atingirem o nível de qualidade descrito abaixo não serão reabertas nem receberão resposta.

A aprovação ocorre por meio das respostas dos mantenedores nas issues:

- `lgtmi`: as suas futuras issues não serão fechadas automaticamente
- `lgtm`: as suas futuras issues e PRs não serão fechados automaticamente

O comando deve estar no início da resposta (opcionalmente após uma ou mais menções `@username`) ou no final. O `lgtmi` não concede os direitos para enviar PRs. Apenas o `lgtm` concede os direitos para enviar PRs.

## Nível de Qualidade Para as Issues

Se você abrir uma issue, você deve utilizar um dos dois modelos (templates) de issue do GitHub.

Se você abrir uma issue, mantenha-a curta, concreta e que valha a pena ler.

- Mantenha-a concisa. Se ela não couber em uma tela, ela está longa demais.
- Escreva com a sua própria voz (não use um LLM para gerar texto; se tiver que usar, acompanhe com um comentário marcando claramente como gerado por IA).
- Declare o bug ou o pedido (request) de forma clara.
- Explique por que isso importa.
- Se você mesmo quiser implementar a mudança, diga isso.

Se a issue for real e bem escrita, um mantenedor poderá reabri-la ou responder com `lgtmi` ou `lgtm` na posição do comando descrita acima.

## Bloqueio

Se você ignorar este documento duas vezes, ou se você inundar (spam) o rastreador (tracker) com issues geradas por agentes, a sua conta no GitHub será bloqueada permanentemente.

Se você enviar um grande volume de issues através de automação, a sua conta do GitHub será bloqueada permanentemente. Sem chance de voltar atrás.

## Antes de Enviar um PR

Não abra um PR a menos que você já tenha sido aprovado por um mantenedor usando `lgtm` na posição do comando descrita acima.

Antes de enviar um PR:

```bash
npm run check
./test.sh
```

Ambos devem passar.

Não edite o `CHANGELOG.md`. As entradas do changelog são adicionadas pelos mantenedores.

Se você estiver adicionando um novo provedor em `packages/ai`, veja o `AGENTS.md` para os testes obrigatórios.

## Dúvidas?

Pergunte no [Discord](https://discord.com/invite/nKXTsAcmbT).

## FAQ

### Por que as novas issues e os PRs são fechados automaticamente?

O pi recebe mais issues do que os mantenedores conseguem revisar com responsabilidade em tempo real. Muitos relatos não atingem o nível de qualidade exposto neste guia ou não seguem o CONTRIBUTING.md. Alguns são jogados no repositório de forma irracional via um agent, em vez de serem revisados e moldados pela pessoa que os envia. O fechamento automático cria uma margem (buffer) para que os mantenedores possam revisar o tracker no seu próprio ritmo e reabrir as issues que atingirem o nível de qualidade.

### Por que as issues enviadas no final de semana possuem prioridade menor?

Nós fazemos a triagem (triage) no tracker durante o horário comercial. Isso significa que mais issues podem se acumular no fim de semana. Tudo que for enviado de sexta a domingo pode ser deixado passar ou receber prioridade mais baixa na fila de revisão da segunda-feira. Se um problema for urgente, pergunte no Discord e inclua a versão curta, os passos de reprodução (repro) e os logs pertinentes.

### Por que algumas issues ficam sem resposta?

Dar uma resposta também é um trabalho de manutenção. Issues com pouco valor (low-signal), relatórios pouco claros, duplicatas e issues que não seguirem este guia podem ser fechadas sem haver discussão. Isso mantém o tempo disponível para os bugs reprodutíveis, solicitações criteriosas e contribuidores que fizeram o trabalho de tornar as suas denúncias fáceis de serem resolvidas (actionable).

### Por que não deixar a IA fazer a triagem (triage) de tudo?

A IA pode ajudar a agrupar duplicatas, resumir relatos e apontar informações que estejam faltando. Ela não é confiável para tomar as decisões finais dos mantenedores. Issues refinadas geradas por IA ainda podem estar erradas, levar a conclusões enganosas (misleading) ou ser caras de se investigar. A revisão humana continua sendo a barreira (gate) final.

### Isso é hostil para com os contribuidores?

Não. É uma medida de proteção (guardrail) contra o esgotamento (burnout) e o excesso (spam) no tracker. Issues curtas, concretas e reprodutíveis são bem-vindas. Contribuições elaboradas são bem-vindas. Lixo (slop) automatizado, noções de privilégio (entitlement) e um grande número de denúncias que não requerem muito esforço (low-effort) não são.

## Onde posso me informar sobre os planos?

O Earendil usa RFCs para debater sobre mudanças maiores. Nem todas elas são públicas, mas grande parte é. Elas podem ser encontradas no [rfc.earendil.com](https://rfc.earendil.com/keyword/pi/).
