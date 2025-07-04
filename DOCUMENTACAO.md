# 📚 Documentação - Sistema de Automação de Campanhas

## 🏗️ Estrutura do Projeto

```
automacao/
├── src/
│   ├── config/        # Configurações da aplicação
│   ├── controllers/   # Controladores das rotas
│   ├── middlewares/   # Middlewares customizados
│   ├── routes/        # Definição das rotas da API
│   ├── services/      # Lógica de negócio e integrações
│   ├── utils/         # Funções utilitárias
│   └── server.js      # Arquivo principal do servidor
├── prisma/
│   └── schema.prisma  # Schema do banco de dados
├── public/            # Arquivos estáticos (admin panel)
├── .env               # Variáveis de ambiente
├── .gitignore         # Arquivos ignorados pelo git
├── package.json       # Dependências e scripts
├── TODO.md            # Lista de tarefas
└── DOCUMENTACAO.md    # Este arquivo
```

## 🚀 Como Iniciar o Projeto

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Edite o arquivo `.env` com suas credenciais:
```
DATABASE_URL="file:./dev.db"
PORT=5000
REDTRACK_API_KEY=sua_api_key_aqui
CLOACKME_COOKIE=seu_cookie_aqui
```

### 3. Inicializar Banco de Dados
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Instalar Playwright (para criação de landers)
```bash
npx playwright install chromium
```

### 5. Iniciar o Servidor
```bash
# Modo desenvolvimento (com hot reload)
npm run dev

# Modo produção
npm start
```

## 🔐 Painel Administrativo

Acesse `http://localhost:5000/admin.html` para:
- Atualizar credenciais do RedTrack (token e cookies)
- Visualizar status da autenticação
- Gerenciar configurações do sistema

## 🔌 Endpoints da API

### 1. **Health Check** - `/api/health`
- `GET /api/health` - Verifica status do servidor

### 2. **Configurações** - `/api/config`
- `GET /api/config` - Retorna configurações salvas
- `POST /api/config` - Salva ou atualiza configurações

### 3. **Admin** - `/api/admin`
- `POST /api/admin/auth/redtrack` - Atualiza credenciais do RedTrack
  ```json
  {
    "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "cookies": "cookie_string_aqui",
    "expiresInHours": 24
  }
```
- `GET /api/admin/auth/status` - Verifica status da autenticação RedTrack

### 4. **RedTrack** - `/api/redtrack`

#### Domínios
- `POST /api/redtrack/domains` - Registra um domínio
  ```json
  {
    "domain": "exemplo.com"
  }
  ```
- `POST /api/redtrack/domains/batch` - Registra múltiplos domínios
  ```json
  {
    "domains": ["exemplo1.com", "exemplo2.com"]
  }
  ```
- `GET /api/redtrack/domains` - Lista domínios com paginação
  - Query params: `page`, `limit`, `search`
- `GET /api/redtrack/domains/:domain/status` - Verifica status de um domínio
- `GET /api/redtrack/domains/:domain/info` - Obtém informações detalhadas

#### Landers
- `POST /api/redtrack/landers` - Cria lander com parâmetros customizados
  ```json
  {
    "domain": "exemplo.com",
    "url": "https://exemplo.com",
    "slug": "wtlander",
    "parameters": {
      "utm_source": "{sub8}",
      "utm_medium": "cpc",
      "utm_campaign": "{sub6}",
      "custom_param": "value"
    },
    "product": "Proizenith",
    "platform": "Google",
    "hasCloaker": true
  }
  ```
  - **domain** (obrigatório): Domínio base sem "rt."
  - **url** (obrigatório): URL base da lander
  - **slug** (opcional): Caminho/slug da URL (padrão: "wtlander")
  - **parameters** (opcional): Objeto com parâmetros da URL
  - **product** (obrigatório): Nome do produto
  - **platform** (obrigatório): Plataforma de anúncio (Google, Facebook, TikTok, etc.)
  - **hasCloaker** (opcional): Se tem cloaker ativo (padrão: false)
  
  **Formato do título gerado**: `(Produto)(Cloaker) Inner| Lander | Plataforma | domínio`
  
  **Exemplo**: `(Proizenith)(Cloaker) Inner| Lander | Google | innerleafwellness.com`

#### Pré-landers
- `POST /api/redtrack/prelanders` - Cria pré-lander com parâmetros customizados
  ```json
  {
    "domain": "exemplo.com",
    "url": "https://exemplo.com",
    "slug": "innerpre",
    "parameters": {
      "utm_source": "{sub8}",
      "utm_medium": "cpc",
      "utm_campaign": "{sub6}",
      "custom_param": "value"
    },
    "product": "Proizenith",
    "platform": "Google",
    "hasCloaker": true
  }
  ```
  - **domain** (obrigatório): Domínio base sem "rt."
  - **url** (obrigatório): URL base da pré-lander
  - **slug** (opcional): Caminho/slug da URL (padrão: "innerpre")
  - **parameters** (opcional): Objeto com parâmetros da URL
  - **product** (obrigatório): Nome do produto
  - **platform** (obrigatório): Plataforma de anúncio (Google, Facebook, TikTok, etc.)
  - **hasCloaker** (opcional): Se tem cloaker ativo (padrão: false)
  
  **Formato do título gerado**: `(Produto)(Cloaker) Inner | PreLander | Plataforma | domínio`
  
  **Exemplo**: `(Proizenith)(Cloaker) Inner | PreLander | Google | innerleafwellness.com`
  
  **Diferença principal**: O tipo é definido como `'p'` (prelander) em vez de `'l'` (lander)

- `POST /api/redtrack/landers/custom` - Cria lander customizada
  ```json
  {
    "domain": "exemplo.com",
    "title": "Título Customizado",
    "url": "https://exemplo.com",
    "slug": "custom-path",
    "parameters": {
      "utm_source": "{sub8}",
      "utm_medium": "cpc"
    },
    "numberOfOffers": 3,
    "offerId": "offer123"
  }
  ```

### 5. **Estrutura Google** - `/api/structure/google`
- `POST /api/structure/google` - Cria estrutura completa para tráfego Google
  ```json
  {
    "domain": "exemplo.com",
    "product": "produto-teste",
    "cloaker": true
  }
  ```

### 6. **CloackMe** - `/api/cloackme`
- `POST /api/cloackme` - Cria campanha no CloackMe

### 7. **Cloudflare** - `/api/cloudflare`
- `POST /api/cloudflare/dns` - Cria DNS records customizados
  ```json
  {
    "domain": "exemplo.com",
    "records": [
      {
        "type": "A",
        "name": "@",
        "content": "147.79.108.93",
        "proxied": true
      }
    ]
  }
  ```
- `POST /api/cloudflare/dns/default` - Cria DNS records padrão
  ```json
  {
    "domain": "exemplo.com"
  }
  ```
- `GET /api/cloudflare/dns/:domain` - Lista DNS records de um domínio

## 🗄️ Modelos de Dados

### Config
```prisma
model Config {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Domain
```prisma
model Domain {
  id              String   @id @default(cuid())
  domain          String   @unique
  product         String
  cloakerEnabled  Boolean  @default(false)
  redtrackId      String?
  cloackmeId      String?
  landerId        String?
  prelanderId     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Campaign
```prisma
model Campaign {
  id          String   @id @default(cuid())
  name        String
  platform    String   @default("google")
  domainId    String
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### RedTrackAuth
```prisma
model RedTrackAuth {
  id          String   @id @default(cuid())
  token       String
  cookies     String
  expiresAt   DateTime
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 🔧 Scripts Disponíveis

- `npm start` - Inicia o servidor
- `npm run dev` - Inicia em modo desenvolvimento
- `npm run prisma:generate` - Gera cliente Prisma
- `npm run prisma:migrate` - Executa migrações
- `npm run prisma:studio` - Abre interface visual do banco

## 🛠️ Serviços e Integrações

### RedTrack Service
- **Autenticação**: Usa token JWT e cookies armazenados no banco
- **Fallback**: Se a API retornar erro 403, usa Playwright para simular navegador
- **Logs detalhados**: Todos os métodos têm logs para debug

### Cron Service
- Verifica periodicamente o status das credenciais
- Pode ser configurado para executar tarefas agendadas

### Autenticação RedTrack
- Token e cookies devem ser atualizados via painel admin
- Sistema verifica validade antes de cada requisição
- Alertas quando credenciais estão próximas de expirar

## 📝 Notas de Desenvolvimento

- O projeto usa ESM (ES Modules)
- Banco de dados SQLite via Prisma
- Autenticação via API Key (RedTrack) e Cookie (CloackMe)
- Porta padrão: 5000
- Playwright usado como fallback para contornar proteções anti-bot
- Todos os endpoints têm tratamento de erro detalhado

## 🚨 Troubleshooting

### Erro ao criar lander
1. Verifique se as credenciais estão atualizadas no painel admin
2. Confirme que o domínio existe no RedTrack
3. Verifique os logs do console para mensagens detalhadas

### Erro 403 Forbidden
- Sistema tentará automaticamente via Playwright
- Se persistir, atualize token e cookies no painel admin

### Playwright não funciona
```bash
# Reinstalar browsers
npx playwright install chromium
```

## 📊 Fluxo de Criação de Lander

1. **Busca credenciais** no banco de dados
2. **Obtém ID do domínio** via API pública
3. **Monta URL completa** com base + slug + parâmetros
4. **Tenta criar lander** via API direta
5. **Se falhar com 403**, usa Playwright como fallback
6. **Retorna resultado** com ID da lander criada

### Exemplo de Criação Completa
Com os parâmetros:
```json
{
  "domain": "innerleafwellness.com",
  "url": "https://innerleafwellness.com",
  "slug": "wtlander",
  "parameters": {
    "utm_source": "{sub8}",
    "utm_medium": "cpc",
    "utm_campaign": "{sub6}"
  },
  "product": "Proizenith",
  "platform": "Google",
  "hasCloaker": true
}
```

**URL gerada**: `https://innerleafwellness.com/wtlander?utm_source={sub8}&utm_medium=cpc&utm_campaign={sub6}`

**Título gerado**: `(Proizenith)(Cloaker) Inner| Lander | Google | innerleafwellness.com`

### Exemplo de Criação de Pré-lander
Com os mesmos parâmetros mas para pré-lander:
```json
{
  "domain": "innerleafwellness.com",
  "url": "https://innerleafwellness.com",
  "slug": "innerpre",
  "parameters": {
    "utm_source": "{sub8}",
    "utm_medium": "cpc",
    "utm_campaign": "{sub6}"
  },
  "product": "Proizenith",
  "platform": "Google",
  "hasCloaker": true
}
```

**URL gerada**: `https://innerleafwellness.com/innerpre?utm_source={sub8}&utm_medium=cpc&utm_campaign={sub6}`

**Título gerado**: `(Proizenith)(Cloaker) Inner | PreLander | Google | innerleafwellness.com`