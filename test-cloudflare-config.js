import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function setupAndTest() {
  console.log('🔧 Configurando e testando Cloudflare...\n');

  try {
    console.log('1️⃣ Verificando token da Cloudflare...');
    console.log('   Nota: Certifique-se de que o token está configurado no arquivo .env');
    console.log('   CLOUDFLARE_API_TOKEN=seu_token_aqui\n');

    console.log('2️⃣ Salvando token via API de configuração...');
    const configResponse = await axios.post(`${API_URL}/config`, {
      key: 'cloudflare_api_token',
      value: 'ieim8xzcDsGq2rXg9qwU',
      description: 'Cloudflare API Token'
    });
    console.log('✅ Token salvo:', configResponse.data);

    console.log('\n3️⃣ Testando criação de DNS records...');
    const dnsResponse = await axios.post(`${API_URL}/cloudflare/dns/default`, {
      domain: 'bodydawn.com'
    });
    console.log('✅ DNS records criados:', JSON.stringify(dnsResponse.data, null, 2));

  } catch (error) {
    console.error('\n❌ Erro:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Detalhes:', error.response.data.error);
    }
    
    console.log('\n💡 Dicas de resolução:');
    console.log('1. Verifique se o token da Cloudflare está correto');
    console.log('2. Certifique-se de que o domínio existe na sua conta Cloudflare');
    console.log('3. Verifique se o token tem permissões para gerenciar DNS');
  }
}

setupAndTest();