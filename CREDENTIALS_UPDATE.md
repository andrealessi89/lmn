# Atualização de Credenciais RedTrack

## Nova Rota: `/api/admin/redtrack/credentials`

### Método: POST

Atualiza as credenciais do RedTrack usando o formato de captura do Playwright/Puppeteer.

### Endpoint
```
POST http://localhost:5000/api/admin/redtrack/credentials
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Body
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "cookies": [
    {
      "name": "cookie_name",
      "value": "cookie_value",
      "domain": ".redtrack.io",
      "path": "/",
      "expires": 1751684461,
      "httpOnly": false,
      "secure": false,
      "sameSite": "Lax"
    }
  ]
}
```

### Campos Obrigatórios
- `token` (string): JWT token do RedTrack
- `cookies` (array): Array de objetos de cookies
  - `name` (string): Nome do cookie
  - `value` (string): Valor do cookie
  - Outros campos são opcionais e ignorados

### Resposta de Sucesso (200)
```json
{
  "success": true,
  "message": "Credentials updated successfully",
  "expiresAt": "2025-01-05T10:00:00.000Z",
  "cookieCount": 20
}
```

### Resposta de Erro (400)
```json
{
  "error": "Token is required"
}
```

## Exemplo de Uso

### cURL
```bash
curl -X POST http://localhost:5000/api/admin/redtrack/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "cookies": [
      {
        "name": "_GRECAPTCHA",
        "value": "09ANMylNDrsPVNMfq7nJtg1ndykugzjx7YCpBis..."
      },
      {
        "name": "rtkclickid-store",
        "value": "6867393f28e16f0764257c90"
      }
    ]
  }'
```

### JavaScript
```javascript
const updateCredentials = async (token, cookies) => {
  const response = await fetch('http://localhost:5000/api/admin/redtrack/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token, cookies })
  });

  const result = await response.json();
  console.log(result);
};
```

## Notas Importantes

1. **Formato de Cookies**: A rota aceita cookies no formato de array de objetos (como retornado pelo Playwright/Puppeteer)
2. **Conversão Automática**: Os cookies são automaticamente convertidos para o formato string usado internamente
3. **Validade**: As credenciais são salvas com validade padrão de 24 horas
4. **Logs**: A rota registra no console os nomes dos cookies recebidos para debugging