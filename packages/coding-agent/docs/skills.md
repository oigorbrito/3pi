# Skills

Skills dão ao Pi instruções especializadas e arquivos de suporte para um tipo particular de trabalho. O Pi anuncia cada skill disponível por nome e descrição, então carrega suas instruções completas apenas quando a tarefa exige.

Use uma skill quando um workflow precisar de mais contexto que um prompt template, mas não precisar de um novo ponto de integração executável. Skills podem agrupar scripts, referências e assets junto com suas instruções.

O Pi implementa a [Agent Skills specification](https://agentskills.io/specification). A maioria dos campos inválidos produz avisos em vez de interromper a inicialização.

## Criar uma skill

Uma skill é um diretório contendo `SKILL.md`:

```text
pdf-tools/
├── SKILL.md
├── scripts/
│   └── extract.sh
├── references/
│   └── formats.md
└── assets/
    └── template.json
```

Comece o `SKILL.md` com frontmatter seguido por instruções diretas:

```markdown
---
name: pdf-tools
description: Extrair texto e tabelas de arquivos PDF. Use ao ler, converter ou inspecionar PDFs.
---

# PDF tools

Leia `references/formats.md` antes de converter um documento. Execute scripts relativos a este diretório de skill.
```

A descrição determina quando o model considera carregar a skill. Indique o que a skill faz e quando ela se aplica. Evite descrições como "Ajuda com PDFs", que não fornecem informações de roteamento suficientes.

Use caminhos relativos do diretório da skill ao se referir a arquivos agrupados. O Pi diz ao model onde a skill reside para que ele possa resolver esses caminhos.

## Entender como as skills carregam

Na inicialização, o Pi escaneia os locais de skill configurados e adiciona o nome, a descrição e o caminho de cada skill ao system prompt. Ele não adiciona as instruções completas.

Quando uma tarefa corresponde, o model lê o `SKILL.md` e segue suas instruções. Isso mantém orientações detalhadas fora do contexto até que sejam necessárias. Um model pode falhar ao carregar uma skill relevante, então use `/skill:name` quando precisar forçar isso.

Argumentos após `/skill:name` são anexados às instruções carregadas como uma requisição do usuário:

```text
/skill:pdf-tools extract report.pdf
```

Defina `disable-model-invocation: true` no frontmatter quando uma skill deve estar disponível apenas através de seu comando explícito. A [configuração](settings.md) `enableSkillCommands` controla se os comandos de skill aparecem na descoberta de comandos interativa; comandos `/skill:name` inseridos manualmente ainda funcionam.

<a id="choose-where-it-loads"></a>

## Adicionar ao Pi

Coloque a skill no seu diretório de skills de usuário ou projeto. Diretórios contendo `SKILL.md` são descobertos recursivamente.

O Pi também suporta os locais da Agent Skills `~/.agents/skills/` e `.agents/skills/`. Diretórios `.agents/skills/` de projeto são descobertos do diretório de trabalho através de seus ancestrais, parando na raiz do repositório quando uma existe.

O Pi aceita algumas skills Markdown independentes, mas um diretório contendo `SKILL.md` é a forma portátil e deve ser preferida. Veja [Settings](settings.md#resources) e [Pi Packages](packages.md) para locais adicionais.

Skills de projeto podem instruir o model a executar scripts ou modificar arquivos. Revise skills desconhecidas e seus arquivos de suporte antes de conceder confiança (trust) ao projeto.

## Escrever frontmatter portátil

A Agent Skills specification define estes campos:

| Campo | Propósito |
|---|---|
| `name` | Nome de exibição e comando |
| `description` | Descrição de roteamento mostrada para o model |
| `license` | Nome da licença ou arquivo de licença incluído |
| `compatibility` | Requisitos de ambiente |
| `metadata` | Metadados adicionais de chave-valor |
| `allowed-tools` | Lista de ferramentas experimentais pré-aprovadas |
| `disable-model-invocation` | Ocultar a skill da seleção automática do model |

Nomes usam letras minúsculas, números e hifens, sem hifens no início, no fim ou consecutivos. Eles podem conter no máximo 64 caracteres; descrições podem conter no máximo 1024.

O Pi não exige nem avisa quando o nome declarado difere do diretório pai. Outras implementações de Agent Skills podem impor esse requisito, então nomes correspondentes continuam sendo a escolha portátil.

Arquivos `SKILL.md` malformados e skills declaradas sem descrições não são carregados. Colisões de nome mantêm a primeira skill descoberta e produzem um aviso.

## Validar e compartilhar uma skill

Execute o Pi de um local onde a skill seja detectável, então inspecione os diagnósticos de inicialização e o comando `/skill:name`. Execute `/reload` após editar uma skill durante uma sessão ativa.

Use um [Pi package](packages.md) para distribuir uma ou mais skills através do npm ou git. Mantenha a configuração de ambiente dentro da skill e declare quaisquer dependências de runtime necessárias no package.

Para exemplos, veja a [Anthropic skills collection](https://github.com/anthropics/skills) e a [Pi skills collection](https://github.com/badlogic/pi-skills).
