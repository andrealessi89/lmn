
# 🧠 CONTEXTO DO PROJETO

Estamos criando um sistema para automação de campanhas de tráfego pago (Google, Facebook, TikTok), que integra com duas plataformas externas:

- **RedTrack** (gerenciador de landers e domínios)
- **CloackMe** (sistema de cloacking com regras avançadas de redirecionamento)

No momento, **o foco é apenas no tráfego do Google**, e queremos construir **primeiramente o backend** usando **Node.js** (pode ser em Express ou Next.js API Routes).

---

## 🎯 OBJETIVO ATUAL

Criar um backend que permita:

- Receber um domínio, nome de produto e flag se o tráfego terá cloacker ou não.
- Com base nisso, criar:
  - Domínio no RedTrack
  - Campanha no CloackMe (se necessário)
  - Lander e Prelander no RedTrack com URLs corretas
- Salvar e usar cookies/tokens de autenticação para RedTrack e CloackMe
- Usar SQLite como banco de dados (via Prisma)

---

## 🧱 ARQUITETURA DE ENDPOINTS DO BACKEND

### 1. `/api/config`
Gerencia os tokens/cookies das integrações.

- `GET /api/config`: retorna configurações salvas
- `POST /api/config`: salva ou atualiza configurações

### 2. `/api/structure/google`
Cria toda a estrutura para tráfego Google (com ou sem cloacker).

- `POST`: recebe `{ domain, product, cloaker: true/false }` e processa fluxo completo

### 3. `/api/domains`

- `GET`: lista domínios existentes no RedTrack (via `api_key`)
- `POST`: cria novo domínio, se ainda não existir

### 4. `/api/cloackme`

- `POST`: cria campanha no CloackMe via cookie (`clkp-token`)
- O payload enviado segue este modelo (substituindo "DOMINIO"):

```json
{
  "name": "DOMINIO | google | PRODUTO",
  "pages": {
    "white": {
      "type": "redirect",
      "content": "https://DOMINIO/wtlander"
    },
    "offers": [
      {
        "type": "content",
        "content": "https://DOMINIO/FOURLETTERSlander",
        "share": 100
      }
    ]
  },
  "mode": "advanced",
  "active": true,
  "filters": {
    "google": true,
    "bots": true,
    "proxy": true,
    "cloakup_ai": true,
    "adspy": true,
    "geolocation": {
      "allow": true,
      "countries": ["US"]
    },
    "device": {
      "allow": true,
      "devices": ["desktop", "smartphone", "tablet", "unknown"]
    },
    "browser_language": {
      "allow": true,
      "languages": ["en", "en-us", "en-gb"]
    },
    "referer": { "block_null": false, "allow": true },
    "query": { "allow": true, "params": {}, "condition": "some" },
    "domain": { "allow": true, "domains": [] },
    "isp": { "allow": true, "isps": [] },
    "os": { "allow": true, "os": [] },
    "user_agent": { "allow": true, "user_agents": [] },
    "browser": { "allow": true, "browsers": [] },
    "whitelist": [],
    "blacklist": []
  }
}
```

### 5. `/api/landers`

- `POST`: cria a lander no RedTrack.
  - Se cloacker ativo → URL: `https://DOMINIO/ck?...`
  - Se sem cloacker → URL: `https://DOMINIO/FOURLETTERSlander?...`

### 6. `/api/prelanders`

- `POST`: cria a prelander no RedTrack.
  - Sempre com URL: `https://DOMINIO/FOURLETTERpre?...`

---

## 🧰 STACK

- Node.js
- SQLite (com Prisma)
- Express.js ou Next.js (API Routes)
- Axios para chamadas HTTP
- Estrutura modular de serviços e controllers
- Arquivos `.env` para segredos e tokens

---

## ✅ SUA TAREFA

Crie a estrutura do **backend** com base nos endpoints acima.  
Implemente primeiro as rotas e serviços, simulando os requests externos (RedTrack e CloackMe) com `axios`.  
O banco de dados deve ser em SQLite e armazenar ao menos a tabela `Config`.

Não precisa frontend por enquanto.
