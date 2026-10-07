# Providers

A maioria dos provedores (providers) hospedados suporta um ou ambos os métodos de autenticação:

- Entrar através de um fluxo de navegador ou dispositivo apoiado por OAuth.
- Fornecer uma chave de API (API key).

Use `/login [provider]` para ver os métodos suportados por um provider. O Amazon Bedrock e o Google Vertex AI também podem usar credenciais em nuvem do ambiente.

## Autenticar interativamente

Execute `/login` e selecione um provider. O Pi guia você através do fluxo de OAuth ou de chave de API e salva a credencial resultante em [`auth.json`](configuration.md#agent-directory).

Em uma máquina remota ou headless (sem interface gráfica), um retorno de chamada (callback) OAuth pode não chegar ao processo local. Quando solicitado, cole a URL de redirecionamento final ou código de autorização de volta no Pi.

Execute `/logout` e selecione um provider para remover a sua credencial armazenada. Isso não remove variáveis de ambiente, não remove a autenticação de `models.json` nem revoga a credencial no provedor.

O `auth.json` pode conter chaves de API e tokens OAuth. Mantenha-o privado e não faça commit dele.

## Usar uma chave de API do ambiente

As variáveis de ambiente são úteis em CI (integração contínua) e em qualquer lugar onde o Pi não deva armazenar a chave. Defina a variável antes de iniciar o Pi:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pi
```

A Anthropic também reconhece `ANTHROPIC_OAUTH_TOKEN` como uma credencial de API e `ANTHROPIC_AUTH_TOKEN` como autenticação de bearer. Sem chave definida, a Anthropic pode usar workload identity federation se as variáveis corretas estiverem presentes.

## Carregar uma chave de API a partir de um comando

Para usar um gerenciador de segredos sem gravar a chave resolvida em disco, defina a `key` de um provedor no `auth.json` como um comando prefixado com `!`:

```json
{
  "anthropic": {
    "type": "api_key",
    "key": "!security find-generic-password -ws 'anthropic'"
  }
}
```

O Pi executa o comando quando a chave é necessária pela primeira vez e armazena em cache a sua saída padrão (stdout) para o tempo de vida do processo.

## Configuração Específica de Provider

Os provedores abaixo têm configuração adicional, precisam de definições a mais ou podem usar credenciais fornecidas por sua plataforma.

### Radius

O Radius é um serviço criado para o Pi pelos construtores do Pi, Earendil Works. Fornece um gateway de IA customizável e controle no nível da organização.
Execute `/login radius` para iniciar.

### Azure OpenAI

O ID do provedor é `azure` (anteriormente `azure-openai-responses`). O provedor serve modelos OpenAI e modelos da Microsoft Foundry. Defina uma chave de API e um URL base ou nome de recurso (`AZURE_OPENAI_BASE_URL` ou `AZURE_OPENAI_RESOURCE_NAME`). Use mapas de nomes de implantação se o nome do deployment for diferente do modelo.

### Amazon Bedrock

O Bedrock pode usar um bearer token (`AWS_BEARER_TOKEN_BEDROCK`) ou credenciais ambientes da AWS (perfil nomeado, chaves IAM com token de sessão temporário, task credentials de ECS, IRSA, etc.).

### Cloudflare AI Gateway

O gateway requer token, account ID e gateway ID. Configure através das variáveis (`CLOUDFLARE_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_GATEWAY_ID`).

### Cloudflare Workers AI

O Workers AI requer um token (`CLOUDFLARE_API_KEY`) e o ID da conta (`CLOUDFLARE_ACCOUNT_ID`).

### Google Vertex AI

Use uma chave de API da Google Cloud (`GOOGLE_CLOUD_API_KEY`). Para Application Default Credentials, configure um projeto e localização e faça login usando a gcloud (`gcloud auth application-default login`). O Pi também suporta arquivos de chaves de conta de serviço configurando `GOOGLE_APPLICATION_CREDENTIALS`.
