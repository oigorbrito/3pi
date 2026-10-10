---
description: Atualizar um security advisory do GitHub para publicação
argument-hint: "<advisory-url-or-draft-path>"
---
Atualizar um security advisory do GitHub para publicação: $ARGUMENTS

Use `gh` para todas as operações do GitHub. Não publique o advisory, nem altere seu estado, ou solicite um CVE a menos que o usuário concorde explicitamente ou o rascunho em markdown diga explicitamente `request_cve: true`.

O GitHub não expõe comentários/discussões do security advisory do repositório através do esquema REST OpenAPI documentado ou do esquema GraphQL público. Um erro 404 de endpoints de API adivinhados, como `api.github.com/repos/.../security-advisories/<GHSA>/comments`, `.../timeline` ou `.../events` é esperado e não é, por si só, uma falha de autenticação. Não use uma sessão de navegador, cookies de navegador ou extração de cookies para buscar comentários do advisory. Em vez disso, diga claramente ao usuário que os comentários do advisory não foram incluídos e que ele pode colar quaisquer comentários relevantes se quiser que sejam considerados.

## Tratamento de entrada

- Se `$ARGUMENTS` for uma URL de security advisory do GitHub, inicie o fluxo de trabalho de investigação e elaboração do rascunho.
- Se `$ARGUMENTS` for um caminho para um rascunho existente em markdown, leia-o e aplique esse rascunho ao advisory.
- Em uma mensagem de acompanhamento após este prompt, se o usuário disser "update", "apply", "looks good", ou similar, trate isso como aprovação para aplicar o rascunho temporário em markdown escrito anteriormente. Releia o arquivo do disco antes de atualizar o GitHub.
- Se for aplicar um rascunho e não houver um caminho conhecido para o rascunho, peça ao usuário o caminho do arquivo markdown.

## Fluxo de trabalho inicial do advisory

1. Analise a URL do advisory para extrair `owner`, `repo` e o id `GHSA`.
2. Busque o advisory com:
   ```sh
   gh api repos/<owner>/<repo>/security-advisories/<GHSA>
   ```
   Registre a severidade original do advisory, o vetor CVSS e a pontuação CVSS exatamente como retornados antes de propor alterações.
3. Não busque os comentários/discussões do advisory a menos que o usuário os tenha colado na conversa:
   - Inspecione o JSON do advisory para obter referências, créditos, issues/PRs vinculados e quaisquer campos de discussão.
   - Não confie em endpoints de API inventados, como `/comments`, `/timeline` ou `/events`; eles comumente retornam 404 porque o GitHub não expõe os comentários de rascunhos de advisory através da API pública.
   - Não use uma sessão de navegador, cookies de navegador ou extração de cookies para buscar comentários.
   - Diga explicitamente ao usuário: `Os comentários do advisory não foram incluídos porque o GitHub não os expõe por meio da API pública. Cole quaisquer comentários relevantes se quiser que eles sejam considerados.`
   - Se o usuário colou comentários, leia e considere-os.
   - Nunca finja que comentários foram lidos.
4. Investigue independentemente:
   - Leia o texto do advisory, os metadados, o(s) package(s) afetado(s), as faixas de versão, o CVSS, a CWE, as referências e os issues/PRs/commits vinculados.
   - Inspecione o histórico de código relevante, as releases, os changelogs, os metadados do package e as tags.
   - Determine se a vulnerabilidade já foi corrigida.
   - Se corrigida, identifique a(s) versão(ões) com patch e a faixa correta de versões afetadas.
   - Não confie na análise do relator sem verificação.
5. Discuta o CVSS com o usuário antes de redigir a atualização final:
   - Proponha um vetor CVSS, pontuação e severidade.
   - Explique brevemente as métricas controversas.
   - Peça ao usuário para confirmá-lo ou ajustá-lo.
6. Pergunte se um CVE deve ser solicitado ao GitHub para este advisory.
7. Elabore um rascunho em markdown do advisory pronto para publicação em `/tmp`, por exemplo `/tmp/sa-<GHSA>.md`. Inclua tanto o CVSS original do advisory quanto o CVSS atualizado proposto/confirmado.
8. Informe ao usuário:
   - o caminho para o arquivo markdown temporário
   - a URL original do advisory
   - que ele pode editar o arquivo e depois dizer "update" ou fornecer o caminho

## Formato do rascunho em markdown

O arquivo de rascunho deve conter o frontmatter YAML seguido pelo corpo do advisory. Inclua todos os campos necessários para atualizar o GitHub e para decidir se deve solicitar um CVE.

```markdown
---
advisory_url: https://github.com/<owner>/<repo>/security/advisories/<GHSA>
owner: <owner>
repo: <repo>
ghsa_id: <GHSA>
summary: <resumo curto do advisory>
original_severity: <low|medium|high|critical|null>
original_cvss_vector: <CVSS original:3.1/... ou null>
original_cvss_score: <número original ou null>
severity: <proposta/confirmada low|medium|high|critical>
cvss_vector: <proposta/confirmada CVSS:3.1/...>
cvss_score: <número proposto/confirmado>
cwe_ids:
  - CWE-...
vulnerabilities:
  - package:
      ecosystem: npm
      name: <nome-do-package>
    vulnerable_version_range: <faixa>
    patched_versions: <faixa-ou-versão>
request_cve: false
---

# <Título do advisory>

<Descrição concisa da vulnerabilidade e do comportamento vulnerável.>

## Info

<Explicação técnica da causa raiz e do componente afetado. Concentre-se nos fatos necessários aos defensores e mantenedores. Não inclua passos de PoC, payloads de exploit ou strings de exploit copiáveis-e-coláveis.>

## Impact

<Quem pode explorá-la, pré-requisitos, impacto de confidencialidade/integridade/disponibilidade e suposições realistas de implantação.>

## Affected versions

- Affected: `<faixa>`
- Patched: `<versão ou faixa>`

## The solution

<Descreva a correção e a release com patch.>

## Recommendations

<Orientações de upgrade e mitigações operacionais.>

## Workarounds

<Soluções alternativas (workarounds), se houver; caso contrário, pule esta seção inteiramente>

## Timeline

- YYYY-MM-DD: Relatório recebido
- YYYY-MM-DD: Correção commitada
- YYYY-MM-DD: Versão corrigida em release
- YYYY-MM-DD: Advisory publicado

## Credits

<Atribuição ao repórter/pesquisador, se apropriado, caso contrário pule a seção.>

## References

- <links para releases, commits, advisories, documentação>
```

Use o estilo de advisory do curl como inspiração: seções claras, linguagem direta, fatos de versão afetada/corrigida, recomendações, timeline e créditos. Não inclua um PoC.

## Aplicando um rascunho ao GitHub

Quando o usuário aprovar com "update"/similar ou fornecer um caminho markdown:

1. Releia o arquivo markdown do disco. Nunca dependa do conteúdo gerado anteriormente na memória.
2. Analise o frontmatter YAML e o corpo.
3. Construa um payload JSON em um arquivo temporário. Mapeie os campos da seguinte forma:
   - `summary` do frontmatter
   - `description` do corpo do markdown após o frontmatter
   - `severity` do frontmatter, se presente
   - `cvss_vector_string` de `cvss_vector`
   - `cwe_ids` do frontmatter
   - `vulnerabilities` do frontmatter
   - Não envie `original_severity`, `original_cvss_vector` ou `original_cvss_score`; esses campos são retidos apenas para contexto de auditoria.
4. Atualize o advisory com:
   ```sh
   gh api -X PATCH repos/<owner>/<repo>/security-advisories/<GHSA> --input /tmp/<payload>.json
   ```
5. Se e somente se o frontmatter do markdown contiver `request_cve: true`, solicite um CVE com:
   ```sh
   gh api -X POST repos/<owner>/<repo>/security-advisories/<GHSA>/cve
   ```
   Trate "already requested" (já solicitado) ou "already assigned" (já atribuído) como erros não fatais e relate-os.
6. Relate o que foi atualizado:
   - a URL do advisory
   - o resumo (summary)
   - a faixa afetada
   - as versões com patch
   - vetor/pontuação/severidade CVSS originais
   - vetor/pontuação/severidade CVSS atualizados
   - se o CVE foi solicitado

## Regras de segurança

- Não inclua material de PoC no corpo final do advisory.
- Não solicite um CVE a menos que `request_cve: true` esteja presente no arquivo markdown.
- Não publique o advisory nem altere seu estado a menos que o usuário solicite explicitamente.
- Não busque comentários do advisory através de sessões ou cookies do navegador. Declare que os comentários não foram incluídos e convide o usuário a colar os comentários relevantes se ele quiser que sejam considerados.
- Se houver incerteza nas faixas afetadas, versões com patch, CVSS ou status de solicitação de CVE, pergunte ao usuário antes de aplicar.
