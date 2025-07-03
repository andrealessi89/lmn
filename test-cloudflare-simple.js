import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function test() {
  try {
    console.log('🚀 Criando DNS records para bodydawn.com...\n');
    
    const response = await axios.post(`${API_URL}/cloudflare/dns/default`, {
      domain: 'bodydawn.com',
      subdomain: 'test'
    });
    
    console.log('✅ Resposta:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

test();