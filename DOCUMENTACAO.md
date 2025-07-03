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

### 4. Iniciar o Servidor
```bash
# Modo desenvolvimento (com hot reload)
npm run dev

# Modo produção
npm start
```

## 🔌 Endpoints da API

### 1. **Configurações** - `/api/config`
- `GET /api/config` - Retorna configurações salvas
- `POST /api/config` - Salva ou atualiza configurações

### 2. **Estrutura Google** - `/api/structure/google`
- `POST /api/structure/google` - Cria estrutura completa para tráfego Google
  ```json
  {
    "domain": "exemplo.com",
    "product": "produto-teste",
    "cloaker": true
  }
  ```

### 3. **Domínios** - `/api/domains`
- `GET /api/domains` - Lista domínios do RedTrack
- `POST /api/domains` - Cria novo domínio

### 4. **CloackMe** - `/api/cloackme`
- `POST /api/cloackme` - Cria campanha no CloackMe

### 5. **Landers** - `/api/landers`
- `POST /api/landers` - Cria lander no RedTrack

### 6. **Prelanders** - `/api/prelanders`
- `POST /api/prelanders` - Cria prelander no RedTrack

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
Armazena configurações e tokens das integrações.

### Domain
Registra domínios criados e suas associações.

### Campaign
Registra campanhas criadas nas plataformas.

## 🔧 Scripts Disponíveis

- `npm start` - Inicia o servidor
- `npm run dev` - Inicia em modo desenvolvimento
- `npm run prisma:generate` - Gera cliente Prisma
- `npm run prisma:migrate` - Executa migrações
- `npm run prisma:studio` - Abre interface visual do banco

## 📝 Notas de Desenvolvimento

- O projeto usa ESM (ES Modules)
- Banco de dados SQLite via Prisma
- Autenticação via API Key (RedTrack) e Cookie (CloackMe)
- Porta padrão: 5000