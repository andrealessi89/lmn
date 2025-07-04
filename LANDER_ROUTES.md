# Rotas de Criação de Landers no RedTrack

## 1. Criar Lander Padrão

### Endpoint
```
POST /api/redtrack/landers
```

### Body
```json
{
  "domain": "earthglowdaily.com"
}
```

### Resposta de Sucesso (201)
```json
{
  "message": "Lander created successfully for earthglowdaily.com",
  "landerId": "63e4f8a2b4c5d6e7f8a9b0c1",
  "domainId": "68670be292263387f8e07ea2",
  "data": {
    "id": "63e4f8a2b4c5d6e7f8a9b0c1",
    "title": "(Automação) Lander | earthglowdaily.com",
    "url": "https://earthglowdaily.com/wtlander?utm_source={sub8}&utm_medium=cpc&utm_campaign={sub6}",
    // ... outros campos
  }
}
```

### Exemplo cURL
```bash
curl -X POST http://localhost:5000/api/redtrack/landers \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "earthglowdaily.com"
  }'
```

## 2. Criar Lander Customizada

### Endpoint
```
POST /api/redtrack/landers/custom
```

### Body
```json
{
  "domain": "earthglowdaily.com",
  "title": "Minha Lander Personalizada",
  "url": "https://earthglowdaily.com/special-offer?utm_source={sub8}&utm_medium={sub7}",
  "numberOfOffers": 3,
  "offerId": "offer123"
}
```

### Campos
- `domain` (obrigatório): Domínio base (sem rt.)
- `title` (opcional): Título customizado da lander
- `url` (opcional): URL customizada da lander
- `numberOfOffers` (opcional): Número de ofertas
- `offerId` (opcional): ID da oferta

### Resposta de Sucesso (201)
```json
{
  "message": "Custom lander created successfully for earthglowdaily.com",
  "landerId": "63e4f8a2b4c5d6e7f8a9b0c1",
  "domainId": "68670be292263387f8e07ea2",
  "data": {
    "id": "63e4f8a2b4c5d6e7f8a9b0c1",
    "title": "Minha Lander Personalizada",
    "url": "https://earthglowdaily.com/special-offer?utm_source={sub8}&utm_medium={sub7}",
    // ... outros campos
  }
}
```

### Exemplo cURL
```bash
curl -X POST http://localhost:5000/api/redtrack/landers/custom \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "earthglowdaily.com",
    "title": "Special Summer Offer",
    "url": "https://earthglowdaily.com/summer?utm_source={sub8}",
    "numberOfOffers": 5,
    "offerId": "summer2025"
  }'
```

## Pré-requisitos

⚠️ **IMPORTANTE**: Antes de criar landers, você precisa:

1. **Ter credenciais válidas** do RedTrack salvas no sistema
   - Use a rota `/api/admin/redtrack/credentials` para atualizar as credenciais

2. **O domínio deve estar registrado** no RedTrack
   - Use a rota `/api/redtrack/domains` para registrar o domínio primeiro

## Fluxo Completo de Automação

```bash
# 1. Atualizar credenciais (token + cookies)
curl -X POST http://localhost:5000/api/admin/redtrack/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "cookies": [...]
  }'

# 2. Registrar domínio no RedTrack
curl -X POST http://localhost:5000/api/redtrack/domains \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "earthglowdaily.com"
  }'

# 3. Criar lander
curl -X POST http://localhost:5000/api/redtrack/landers \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "earthglowdaily.com"
  }'
```

## Erros Comuns

### 400 - Bad Request
```json
{
  "error": "Domain is required"
}
```

### 401 - Unauthorized
```json
{
  "error": "No valid RedTrack authentication found. Please update credentials via admin panel."
}
```

### 404 - Domain Not Found
```json
{
  "error": "Domínio earthglowdaily.com não encontrado no RedTrack"
}
```

## Notas Técnicas

1. **Tracking Domain**: O sistema automaticamente adiciona o prefixo `rt.` ao domínio
2. **Script de Tracking**: Automaticamente incluído no campo `lp_views`
3. **URL de Click**: Configurada como `https://rt.{domain}/click`
4. **Valores Padrão**:
   - Title: `(Automação) Lander | {domain}`
   - URL: `https://{domain}/wtlander?utm_source={sub8}&utm_medium=cpc&utm_campaign={sub6}`
   - Script: `<script src="https://rt.{domain}/track.js"></script>`