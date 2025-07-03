import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const TEST_DOMAIN = 'bodydawn.com';

async function testCloudflare() {
  console.log('🌩️  Testando integração Cloudflare...\n');

  try {
    console.log('1️⃣ Testando criação de DNS records padrão...');
    console.log(`   Domínio: ${TEST_DOMAIN}`);
    console.log('   Records:');
    console.log('   - A @ 147.79.108.93 (com proxy)');
    console.log('   - CNAME link connect.domains-twr.com (sem proxy)');
    console.log('   - CNAME rt exmfr.ttrk.io (sem proxy)\n');

    const createResponse = await axios.post(`${API_URL}/cloudflare/dns/default`, {
      domain: TEST_DOMAIN
    });

    console.log('✅ Resposta:', JSON.stringify(createResponse.data, null, 2));
    console.log('');

    console.log('2️⃣ Listando DNS records criados...');
    const listResponse = await axios.get(`${API_URL}/cloudflare/dns/${TEST_DOMAIN}`);
    
    console.log('✅ Records encontrados:');
    listResponse.data.records.forEach(record => {
      console.log(`   - ${record.type} ${record.name} -> ${record.content} (proxy: ${record.proxied})`);
    });

    console.log('\n🎉 Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('   Detalhes:', error.response.data.error);
    }
  }
}

console.log('⏳ Iniciando teste em 2 segundos...');
setTimeout(testCloudflare, 2000);