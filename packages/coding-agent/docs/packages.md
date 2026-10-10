# Packages do Pi

Packages do Pi instalam e distribuem extensões, skills, templates de prompt e temas como uma única unidade. Use um package quando uma customização deve ser compartilhada através do npm ou git, ou quando vários recursos pertencem ao mesmo grupo.

Um package é um diretório comum ou um package do npm. Ele pode expor diretórios de recursos convencionais, declarar caminhos explícitos na chave `pi` no `package.json`, e carregar suas próprias dependências de tempo de execução.

## Instalar e gerenciar packages

Instale a partir do npm, git ou um caminho local:

```bash
pi install npm:@example/pi-tools@1.0.0
pi install git:github.com/example/pi-tools@v1
pi install ./local-package
```

`pi list` mostra os packages configurados. Use `pi remove <source>` para remover um e `pi update --extensions` para reconciliar instalações de package.

Instalações pessoais são gravadas em `~/.3pi/agent/settings.json`. Adicione `--local` ou `-l` para gravar a declaração do package em `.3pi/settings.json`. O Pi lê as declarações desse arquivo apenas após a confiança do projeto (project trust) ser concedida.

Packages do projeto são instalados e carregados apenas após a confiança do projeto ser resolvida. Eles podem executar código de extensão, então revise a fonte antes de instalar.

Use `--extension` ou `-e` para experimentar um package por uma invocação sem adicioná-lo às configurações:

```bash
pi -e npm:@example/pi-tools
```

## Escolher uma fonte

| Fonte | Exemplo | Comportamento |
|---|---|---|
| npm | `npm:@example/pi-tools@1.0.0` | Instalado sob o diretório npm do Pi |
| git | `git:github.com/example/pi-tools@v1` | Clonado e reconciliado com a ref selecionada |
| URL | `https://github.com/example/pi-tools` | Tratado como uma fonte git |
| Local | `./pi-tools` | Carregado do caminho resolvido sem cópia |

Especificações versionadas de npm são fixadas. Tags e commits do Git também são fixados; atualizações reconciliam o checkout mas não movem uma ref configurada.

## Criar um package

O package mais simples usa diretórios convencionais:

```text
my-pi-package/
├── package.json
├── extensions/
├── skills/
├── prompts/
└── themes/
```

Use um manifesto explícito quando os recursos estiverem em outro lugar ou precisarem de filtro:

```json
{
  "name": "my-pi-package",
  "keywords": ["3pi-package"],
  "pi": {
    "extensions": ["./src/extension.ts"],
    "skills": ["./resources/skills"],
    "prompts": ["./resources/prompts/*.md"],
    "themes": ["./resources/themes/*.json"]
  }
}
```

A palavra-chave `pi-package` torna um package do npm elegível para descoberta na galeria de packages do Pi.

## Declarar dependências

Coloque os packages de tempo de execução (runtime) importados por extensões em `dependencies`. O Pi instala as dependências do package quando ele instala uma fonte npm ou git.

Declare os packages providos pelo host (como `@earendil-works/3pi-ai`) em `peerDependencies` e não os faça bundle (não os embuta). O Pi suprime a instalação automática de peer dependencies para packages npm gerenciados.

Não liste os packages fornecidos pelo host em `dependencies`.

## Selecionar recursos do package

A forma de objeto nas configurações restringe quais recursos carregam de um package:

```json
{
  "packages": [
    {
      "source": "npm:@example/pi-tools",
      "extensions": ["extensions/*.ts", "!extensions/legacy.ts"],
      "skills": [],
      "prompts": ["prompts/review.md"]
    }
  ]
}
```

## Entender escopo e identidade

O mesmo package pode aparecer nas configurações pessoais e de projeto. Uma entrada de projeto normalmente substitui a entrada pessoal. Com `autoload: false`, a entrada de projeto age como um filtro sobre o package pessoal.

O Pi identifica packages npm pelo nome, packages git pela URL do repositório sem a referência (ref), e locais pelo caminho absoluto.
