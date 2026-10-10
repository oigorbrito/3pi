# Modelos Locais com llama.cpp

O Pi suporta o servidor roteador do [llama.cpp](https://github.com/ggml-org/llama.cpp). O roteador descobre múltiplos modelos GGUF e os carrega ou descarrega sob demanda.

Use um build atual do llama.cpp com suporte a roteador. Siga as [instruções de build](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md) ou instale uma [release pré-compilada](https://github.com/ggml-org/llama.cpp/releases) para a sua plataforma.

## Inicie o roteador

Inicie o `llama-server` sem `--model` ou `-m`. Passar um modelo inicia o modo de modelo único em vez do modo roteador.

```bash
llama-server \
  --models-dir ~/models \
  --no-models-autoload \
  --jinja \
  --host 127.0.0.1 \
  --port 8080 \
  -ngl 999 \
  -c 32768
```

Opções importantes:

- `--models-dir ~/models` descobre arquivos GGUF locais.
- `--no-models-autoload` mantém o carregamento explícito através do `/llama`.
- `--jinja` habilita templates de chat compatíveis e tool calling.
- `-ngl 999` descarrega o máximo de camadas possível para a GPU.
- `-c 32768` define a janela de contexto para cada modelo carregado. Omita para usar o contexto nativo do modelo, o que pode exigir substancialmente mais memória.

Um modelo de arquivo único pode ficar diretamente no diretório de modelos. Coloque modelos multimodais e de múltiplas partes (shards) em subdiretórios separados:

```text
~/models/
├── llama-3.2-1b-Q4_K_M.gguf
├── gemma-3-4b-it-Q4_K_M/
│   ├── gemma-3-4b-it-Q4_K_M.gguf
│   └── mmproj-F16.gguf
└── large-model-Q4_K_M/
    ├── large-model-Q4_K_M-00001-of-00003.gguf
    ├── large-model-Q4_K_M-00002-of-00003.gguf
    └── large-model-Q4_K_M-00003-of-00003.gguf
```

Reinicie o roteador após adicionar arquivos manualmente. Para tamanhos de contexto por modelo e outras opções, use os [presets de modelo do llama.cpp](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md#model-presets).

## Configure o Pi

Inicie o Pi e configure o provider:

```text
/login llama.cpp
```

Digite a URL do roteador e a chave de API opcional. A URL padrão é `http://127.0.0.1:8080`.

Se você iniciar o roteador com `--no-models-autoload`, o `/login llama.cpp` armazena apenas a conexão. Execute `/llama` para carregar um modelo, e depois `/model` para selecionar o modelo carregado para a sessão atual.

Variáveis de ambiente podem configurar os mesmos valores sem `/login`:

```bash
export LLAMA_BASE_URL=http://127.0.0.1:8080
export LLAMA_API_KEY=optional-secret
pi
```

Se o servidor usar uma chave de API, inicie o `llama-server` com o valor de `--api-key` correspondente. Mantenha `--host 127.0.0.1` para acesso apenas local.

## Gerencie modelos

Execute:

```text
/llama
```

- Selecione um modelo descarregado para carregá-lo.
- Selecione um modelo carregado para descarregá-lo.
- Selecione **Download model…**, pesquise no Hugging Face e escolha um repositório e quantização. Valores exatos de `owner/repository[:quant]` também funcionam.
- Pressione Esc durante um carregamento ou download para confirmar o cancelamento.

A pesquisa do Hugging Face usa `HF_TOKEN` quando definido, e então verifica `$HF_TOKEN_PATH`, `$HF_HOME/token`, `$XDG_CACHE_HOME/huggingface/token`, e `~/.cache/huggingface/token`. A pesquisa também funciona sem autenticação, sujeita a limites de taxa mais baixos. O Pi avisa antes de baixar repositórios restritos e fornece o link para a página de acesso deles. O servidor llama.cpp realiza o download, então o seu processo também deve ter o `HF_TOKEN` quando o repositório selecionado exigir acesso.

Se houver outros modelos carregados, o Pi pergunta se deve descarregá-los primeiro ou mantê-los carregados. O Pi não descarrega modelos silenciosamente e nunca deleta arquivos de modelo. O roteador pode ser compartilhado com outros clientes, então o `/llama` sempre exibe o estado atual do roteador.

Modelos carregados e inativos (sleeping) aparecem em `/model`. Modelos inativos acordam automaticamente quando selecionados. Com o carregamento automático do roteador habilitado, os modelos de preset descarregados também aparecem e carregam quando selecionados. Com `--no-models-autoload`, carregue um modelo através de `/llama` antes de selecioná-lo.

Se o roteador desconectar, o `/llama` mostra **Retry** e **Close**. Retry reconecta e atualiza o estado do modelo sem repetir a operação interrompida.

## Classificação

Modelos de classificação respondem perguntas tipadas de `choice` (escolha), `bool` e `score` (pontuação) sobre o estado JSON, como os modelos Jev da TypeSafe. O modelo os alcança a partir de scripts [`codemode`](cli.md#enable-codemode), e extensões através de `ctx.modelRegistry.classify()`; veja [Modelos classificadores](models.md#use-classifier-models). O Pi lista os modelos do llama.cpp como classificadores de duas maneiras:

- **Modelos de decisão** como [Julia-1, Laya, Kev, lev, e OpenJev](https://huggingface.co/collections/ggml-org/decision-models-6abf80cca3c83f127060a769) respondem nativamente através do endpoint `/v1/systemone` do llama.cpp. Eles aparecem apenas como classificadores, com a API `typesafe-system-one`, e não em `/model`.
- **Modelos de chat** também são listados como classificadores com o mesmo ID e a API `llama-cpp-classify`, que lê as respostas a partir das probabilidades do próximo token conforme descrito abaixo.

llama.cpp 0.6.0 e versões posteriores relatam modelos de decisão na lista de modelos do roteador: seu `architecture.output_modalities` contém `decisions`. O roteador lê isso dos metadados GGUF sem carregar o modelo, então o Pi reconhece modelos de decisão descarregados e inativos também. Compilações mais antigas do llama.cpp não relatam isso, e o Pi lista seus modelos de decisão como modelos de chat.

### Modelos de chat como classificadores

O modelo não gera uma resposta. Cada pergunta se torna um prompt de chat: o estado, toda pergunta da requisição, o estado novamente, e então a pergunta com suas respostas sob rótulos de token único. Rótulos são letras para uma escolha (até 62 opções), `Yes`/`No` para um booleano, e dígitos para uma pontuação (até 10 níveis). A segunda cópia do estado é lida com as perguntas visíveis, o que melhorou a precisão no JevBench com modelos pequenos. O Pi lê as probabilidades dos rótulos como o próximo token e as normaliza. Uma escolha retorna a probabilidade de cada opção e uma confiança de `(n * peak - 1) / (n - 1)`; uma pontuação retorna o nível esperado.

- Probabilidades de rótulo bruto geralmente são superconfiantes. A opção `temperature` por requisição divide os logits dos rótulos antes da normalização; valores acima de 1 suavizam a distribuição. Não muda nenhuma resposta.
- As perguntas rodam uma após a outra. Tudo antes da última pergunta é igual para todas as perguntas de uma requisição, então o cache de prompt do servidor o avalia uma vez. O estado aparece duas vezes, então precisa do dobro de seu tamanho no contexto.
- Modelos pequenos podem seguir instruções escritas dentro do estado. O prompt diz ao modelo para julgar o estado como dados, mas isso não é uma garantia.
- Modelos híbridos como o Qwen3.5 não podem retroceder um prompt parcialmente em cache sem checkpoints de contexto. Se cada pergunta reprocessar todo o estado, inicie o roteador com `--ctx-checkpoints 32 --checkpoint-min-step 0`.

## Solução de Problemas

Verifique se o roteador está acessível:

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/models
```

- **Nenhum modelo em `/llama`:** Verifique o `--models-dir`, o layout do diretório, e reinicie o roteador.
- **Modelo ausente de `/model` com `--no-models-autoload`:** Carregue-o com `/llama` primeiro.
- **O carregamento falha ou usa memória demais:** Reduza `-c` ou descarregue outro modelo.
- **O servidor não está no modo roteador:** Inicie-o sem `--model`, `-m`, ou `-hf`.

Para remover o provider `llama.cpp` e o `/llama`, desabilite `llama.cpp` em Built-in no `pi config`, ou defina `"extensions": ["-builtin:llama.cpp"]` nas [configurações](settings.md#resources).
