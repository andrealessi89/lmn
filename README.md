# Campaign Automation Backend

Backend para automação de campanhas de tráfego pago com integrações RedTrack, Cloudflare e CloackMe.

## 🚀 Instalação

```bash
npm install
```

## ⚙️ Configuração

Crie um arquivo `.env` com as seguintes variáveis:

```env
PORT=5000
DATABASE_URL="file:./dev.db"

# RedTrack - Sistema de rastreamento
REDTRACK_API_KEY="sua_api_key_redtrack"

# CloackMe - Sistema de cloaking
CLOACKME_COOKIE="seu_cookie_cloackme"

# Cloudflare - Gerenciamento de DNS
CLOUDFLARE_API_TOKEN="seu_token_cloudflare"
CLOUDFLARE_ZONE_ID="seu_zone_id_cloudflare"
```

## 🏃 Execução

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start

# Gerenciar banco de dados
npm run prisma:studio      # Interface visual do banco
npm run prisma:migrate     # Executar migrations
npm run prisma:generate    # Gerar cliente Prisma
```

## 📚 Visão Geral da API

A API fornece endpoints para gerenciar domínios, campanhas e integrações com serviços externos.

### 🏥 Health Check
```http
GET /api/health
```

Verifica se a API está funcionando corretamente.

**Resposta:**
```json
{
    "status": "ok",
    "timestamp": "2025-07-03T21:00:00.000Z",
    "service": "Campaign Automation API",
    "version": "1.0.0"
}
```

## 📡 RedTrack API

Sistema de rastreamento de campanhas integrado com RedTrack. Todos os domínios são automaticamente prefixados com `rt.` para rastreamento.

### 1️⃣ Registrar Domínio Individual

```http
POST /api/redtrack/domains
Content-Type: application/json

{
    "domain": "exemplo.com"
}
```

**Descrição:** Registra um domínio no RedTrack com prefixo `rt.` e SSL automático habilitado.

**Resposta de Sucesso (201):**
```json
{
    "message": "Domain rt.exemplo.com registered successfully",
    "domain": "rt.exemplo.com",
    "data": {
        "id": "123",
        "url": "rt.exemplo.com",
        "type": "track",
        "ssl": {
            "active": false,
            "use_auto_generated_ssl": true
        }
    }
}
```

**Possíveis Erros:**
- `400` - Domain already exists
- `401` - Invalid API key
- `429` - Rate limit exceeded

### 2️⃣ Registrar Múltiplos Domínios

```http
POST /api/redtrack/domains/batch
Content-Type: application/json

{
    "domains": ["exemplo1.com", "exemplo2.com", "exemplo3.com"]
}
```

**Descrição:** Registra vários domínios em lote. Processa até 10 domínios por vez para evitar timeout.

**Resposta (200):**
```json
{
    "message": "Domain registration completed",
    "summary": {
        "total": 3,
        "successful": 2,
        "failed": 1
    },
    "results": [
        {
            "domain": "rt.exemplo1.com",
            "data": {
                "id": "123",
                "url": "rt.exemplo1.com",
                "type": "track"
            }
        },
        {
            "domain": "rt.exemplo3.com",
            "error": "Domain already exists"
        }
    ]
}
```

### 3️⃣ Listar Domínios

```http
GET /api/redtrack/domains?page=1&limit=50&search=exemplo
```

**Descrição:** Lista todos os domínios cadastrados com suporte a paginação e busca.

**Parâmetros Query:**
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | number | 1 | Número da página |
| `limit` | number | 50 | Itens por página |
| `search` | string | - | Filtrar por nome |

**Resposta:**
```json
{
    "domains": [
        {
            "id": "123",
            "url": "rt.exemplo.com",
            "type": "track",
            "ssl": {
                "active": true,
                "use_auto_generated_ssl": true
            }
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 50,
        "total": 100,
        "totalPages": 2
    }
}
```

### 4️⃣ Verificar Status do Domínio

```http
GET /api/redtrack/domains/:domain/status
```

**Descrição:** Verifica rapidamente se um domínio está ativo no RedTrack.

**Exemplo:**
```http
GET /api/redtrack/domains/bodydawn.com/status
```

**Resposta - Domínio Encontrado:**
```json
{
    "domain": "rt.bodydawn.com",
    "active": true,
    "id": "12345",
    "ssl": {
        "active": true
    }
}
```

**Resposta - Domínio Não Encontrado:**
```json
{
    "domain": "rt.bodydawn.com",
    "active": false,
    "error": "Domínio \"rt.bodydawn.com\" não encontrado após varrer todas as páginas."
}
```

### 5️⃣ Obter Informações Detalhadas do Domínio

```http
GET /api/redtrack/domains/:domain/info
```

**Descrição:** Busca informações completas do domínio, incluindo ID, percorrendo todas as páginas se necessário.

**Exemplo:**
```http
GET /api/redtrack/domains/bodydawn.com/info
```

**Resposta - Domínio Encontrado (200):**
```json
{
    "success": true,
    "domain": "rt.bodydawn.com",
    "id": "12345",
    "name": "BodyDawn Campaign",
    "type": "track",
    "ssl": {
        "active": true,
        "use_auto_generated_ssl": true
    },
    "status": "active",
    "created_at": "2025-07-01T10:00:00Z",
    "updated_at": "2025-07-03T15:30:00Z"
}
```

**Resposta - Domínio Não Encontrado (404):**
```json
{
    "error": "Domínio \"rt.exemplo.com\" não encontrado após varrer todas as páginas.",
    "domain": "rt.exemplo.com"
}
```

**Características:**
- Busca paginada (100 itens por página)
- Procura por URL exata ou nome do domínio
- Retorna ID necessário para outras operações
- Logs detalhados durante a busca

### 6️⃣ Criar Lander (Landing Page)

```http
POST /api/redtrack/landers
Content-Type: application/json

{
    "domain": "exemplo.com"
}
```

**Descrição:** Cria uma landing page no RedTrack para o domínio especificado. 

⚠️ **Importante:** Requer autenticação válida configurada via painel admin.

**Resposta de Sucesso (201):**
```json
{
    "message": "Lander created successfully for exemplo.com",
    "landerId": "abc123",
    "domainId": "12345",
    "data": {
        "id": "abc123",
        "title": "(Automação) Lander | exemplo.com",
        "type": "l",
        "domain_id": "12345",
        "typeUrl": "https://rt.exemplo.com/click",
        "url": "https://exemplo.com/wtlander?utm_source={sub8}&utm_medium=cpc&utm_campaign={sub6}",
        "lp_views": "<script src=\"https://rt.exemplo.com/track.js\"></script>",
        "created_at": "2025-07-03T22:00:00Z"
    }
}
```

**Resposta de Erro (400):**
```json
{
    "error": "No valid RedTrack authentication found. Please update credentials via admin panel."
}
```

**Fluxo da criação:**
1. Busca automaticamente o ID do domínio no RedTrack
2. Cria a lander com configurações padrão
3. Configura tracking script e parâmetros UTM

### 📋 Exemplos de Uso

**JavaScript/Node.js:**
```javascript
// Registrar domínio
const response = await axios.post('http://localhost:5000/api/redtrack/domains', {
    domain: 'bodydawn.com'
});

// Buscar informações completas do domínio
const info = await axios.get('http://localhost:5000/api/redtrack/domains/bodydawn.com/info');
console.log('ID do domínio:', info.data.id);

// Criar lander (requer autenticação configurada)
const lander = await axios.post('http://localhost:5000/api/redtrack/landers', {
    domain: 'bodydawn.com'
});

// Verificar status
const status = await axios.get('http://localhost:5000/api/redtrack/domains/bodydawn.com/status');

// Listar domínios
const domains = await axios.get('http://localhost:5000/api/redtrack/domains');
```

**cURL:**
```bash
# Registrar um domínio
curl -X POST http://localhost:5000/api/redtrack/domains \
  -H "Content-Type: application/json" \
  -d '{"domain":"bodydawn.com"}'

# Buscar informações completas (com ID)
curl http://localhost:5000/api/redtrack/domains/bodydawn.com/info

# Criar lander (requer autenticação)
curl -X POST http://localhost:5000/api/redtrack/landers \
  -H "Content-Type: application/json" \
  -d '{"domain":"bodydawn.com"}'

# Verificar status
curl http://localhost:5000/api/redtrack/domains/bodydawn.com/status

# Registrar múltiplos domínios
curl -X POST http://localhost:5000/api/redtrack/domains/batch \
  -H "Content-Type: application/json" \
  -d '{"domains":["site1.com","site2.com","site3.com"]}'

# Listar domínios
curl http://localhost:5000/api/redtrack/domains
```

## ☁️ Cloudflare API

Gerenciamento automatizado de registros DNS para campanhas de tráfego pago.

### 1️⃣ Criar Registros DNS Padrão

```http
POST /api/cloudflare/dns/default
Content-Type: application/json

{
    "domain": "exemplo.com"
}
```

**Descrição:** Cria automaticamente 3 registros DNS essenciais:
- **Registro A**: Domínio principal → `147.79.108.93` (com proxy)
- **CNAME link**: `link.dominio.com` → `connect.domains-twr.com`
- **CNAME rt**: `rt.dominio.com` → `exmfr.ttrk.io`

**Resposta de Sucesso (200):**
```json
{
    "message": "Default DNS records created for exemplo.com",
    "domain": "exemplo.com",
    "summary": {
        "total": 3,
        "successful": 3,
        "failed": 0
    },
    "results": [
        {
            "success": true,
            "record": {
                "id": "2046cd3b3c142eccc37b1c82fdb522ed",
                "name": "exemplo.com",
                "type": "A",
                "content": "147.79.108.93",
                "proxied": true,
                "ttl": 1
            }
        },
        {
            "success": true,
            "record": {
                "id": "d9d065cb53b2809440cce1c13a581fe7",
                "name": "link.exemplo.com",
                "type": "CNAME",
                "content": "connect.domains-twr.com",
                "proxied": false,
                "ttl": 3600
            }
        },
        {
            "success": true,
            "record": {
                "id": "b8da38577c9d23fbb99d6c8b5ffcb9c3",
                "name": "rt.exemplo.com",
                "type": "CNAME",
                "content": "exmfr.ttrk.io",
                "proxied": false,
                "ttl": 3600
            }
        }
    ]
}
```

### 2️⃣ Criar Registros DNS Personalizados

```http
POST /api/cloudflare/dns
Content-Type: application/json

{
    "domain": "exemplo.com",
    "records": [
        {
            "type": "A",
            "name": "app",
            "content": "1.2.3.4",
            "proxied": true,
            "ttl": 3600
        }
    ]
}
```

**Descrição:** Cria registros DNS personalizados conforme necessidade.

### 3️⃣ Listar Registros DNS

```http
GET /api/cloudflare/dns/:domain
```

**Descrição:** Lista todos os registros DNS de um domínio.

**Exemplo:**
```http
GET /api/cloudflare/dns/bodydawn.com
```

## 🏗️ Estrutura do Projeto

```
📦 campaign-automation-backend/
├── 📁 src/
│   ├── 📁 controllers/     # Controladores das rotas
│   ├── 📁 services/        # Lógica de negócio e integrações
│   ├── 📁 routes/          # Definição de rotas da API
│   ├── 📁 config/          # Configurações e conexões
│   ├── 📁 middlewares/     # Middlewares customizados
│   └── 📄 server.js        # Entrada da aplicação
├── 📁 prisma/              # Schema do banco de dados
├── 📄 .env                 # Variáveis de ambiente
├── 📄 package.json         # Dependências do projeto
└── 📄 README.md            # Documentação
```

## 🔐 Gerenciamento de Autenticação RedTrack

### Interface Admin

Acesse a interface administrativa para gerenciar credenciais do RedTrack:

```
http://localhost:5000/admin.html
```

### Como obter as credenciais:

1. **Faça login** no painel RedTrack: https://app.redtrack.io
2. **Abra o DevTools** (F12) e vá para a aba **Network**
3. **Recarregue a página** e procure por requisições para `/api/`
4. **Copie o Bearer Token**: 
   - Procure no header `Authorization: Bearer eyJhbG...`
   - Copie apenas o token (sem "Bearer ")
5. **Copie os Cookies**:
   - No header `Cookie:`, copie todo o conteúdo

### Endpoints Admin:

```http
# Verificar status da autenticação
GET /api/admin/redtrack/auth/status

# Atualizar credenciais
POST /api/admin/redtrack/auth
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "cookies": "rtkclickid-store=...",
  "expiresInHours": 24
}

# Limpar todas as credenciais
DELETE /api/admin/redtrack/auth
```

## 🧪 Scripts de Teste

```bash
# Testar integração Cloudflare
node test-cloudflare-simple.js

# Testar integração RedTrack
node test-redtrack.js

# Testar busca de informações do domínio
node test-redtrack-info.js
```

## 🔧 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Prisma** - ORM para banco de dados
- **Axios** - Cliente HTTP
- **SQLite** - Banco de dados (desenvolvimento)

## 📝 Notas Importantes

1. **RedTrack**: Todos os domínios são automaticamente prefixados com `rt.`
2. **Cloudflare**: Requer Zone ID correto no `.env`
3. **Rate Limits**: APIs externas possuem limites de requisições
4. **SSL**: RedTrack configura SSL automaticamente para domínios

## 🤝 Contribuindo

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request