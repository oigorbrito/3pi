# Escolha um Modelo

Para um provider integrado (built-in), comece com `/login`, depois escolha um modelo com `/model`. Use configuração customizada de modelo apenas quando o Pi já não incluir o provider ou endpoint de que você precisa.

## Escolha uma conexão

| O que você tem | Configuração recomendada |
|---|---|
| Uma assinatura suportada | Faça login através de `/login` |
| Uma chave de API de provider | Armazene-a via `/login` ou defina a variável de ambiente correspondente |
| Um modelo local GGUF | Conecte o Pi ao roteador do llama.cpp |
| Um endpoint compatível com OpenAI, Anthropic ou Google | Adicione-o em `models.json` |
| Um provider com protocolo ou fluxo de autenticação customizado | Crie ou instale uma extensão de provider |

Navegue pelo [catálogo de modelos](https://pi.dev/models) para provedores atuais, IDs de modelo, capacidades e limites.

## Autenticar

Execute `/login` e selecione um provider. O Pi armazena credenciais em [`auth.json`](configuration.md#agent-directory). Rode `/logout` para removê-las.
Você também pode prover a chave da API através de uma variável de ambiente do provider (útil em ambientes CI). Quando várias fontes estão configuradas, o Pi tem uma ordem de precedência que começa pelo argumento `--api-key`.

## Selecionar um modelo

Execute `/model` para pesquisar modelos disponíveis. Pressione `Ctrl+S` em um modelo para salvá-lo como o padrão.
Rode `/thinking` para selecionar o nível de thinking para o modelo atual. `Ctrl+S` ali salva o nível padrão.
`Ctrl+P` alterna entre modelos disponíveis. Use `/scoped-models` para controlar o ciclo de modelos.

## Conectar modelos locais

O Pi integra-se diretamente ao roteador do llama.cpp. O comando `/llama` gerencia o roteador, enquanto `/model` seleciona um dos modelos carregados.

Siga [Modelos Locais com llama.cpp](llama-cpp.md) para detalhes. Para Ollama, LM Studio, vLLM, etc., configure um endpoint compatível em `models.json`.

## Configure um endpoint compatível

Use [`models.json`](configuration.md#agent-directory) quando um endpoint falar uma API que o Pi já suporte (como a maioria das instalações do Ollama ou proxies).

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        { "id": "qwen2.5-coder:7b" }
      ]
    }
  }
}
```

A chave "dummy" torna o modelo disponível ao Pi; o Ollama a ignora.

### Descrever entrada e cache

Use `inputLimits.images.resize` para controlar como o Pi redimensiona e codifica as imagens antes de enviá-las.
Use `promptCache` para declarar os tempos de retenção do cache daquele endpoint (ajuda o Pi a otimizar prompts).

### Configurar amostragem por nível de thinking

APIs compatíveis com OpenAI suportam `samplingParams` (parâmetros de amostragem) customizados por nível, aplicáveis aos níveis internos do Pi (ex. `off`, `minimal`, `low`, etc.).

## Usar modelos classificadores

Modelos de classificação não fazem conversas longas; eles respondem perguntas simples e retornam escolhas, booleanos ou pontuações. Podem ser invocados por scripts em `codemode`.
A API de decisões (Decisions API) da OpenAI exige chave de API explícita (`gpt-6-luna`), assim como outros provedores System One que oferecem o Jev. Eles não aparecem no `/model`, mas sim através da tool `codemode`.

## Usar modelos de imagem

Modelos de geração de imagens seguem fluxo semelhante aos classificadores. O Pi usa provedores como OpenRouter para modelos de imagens, acessíveis via `codemode`. Extensões também podem utilizá-los através do método `ctx.modelRegistry.generateImages()`.

## Adicionar um provider customizado

Use uma extensão quando o provider precisar de streaming customizado ou modos de descoberta não suportados nativamente. Veja [Custom Providers](custom-provider.md).

## Solução de problemas

### Um modelo não aparece
Confirme se o provedor tem autenticação funcional.

### A autenticação funciona em apenas um terminal
Verifique se a chave de API não veio de uma variável de ambiente definida em apenas uma sessão de shell.

### O login abre um navegador em outra máquina
Complete a autenticação e cole o URL ou código redirecionado na tela do Pi.

### Um endpoint compatível rejeita as requisições
Verifique os tipos de API no seu arquivo `models.json`. O servidor upstream pode não suportar o formato da requisição que o Pi tenta mandar.
