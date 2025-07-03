import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Iniciando testes da API...\n');

  try {
    console.log('1️⃣ Testando Health Check...');
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Health Check:', health.data);
    console.log('');

    console.log('2️⃣ Testando GET /api/config...');
    const configs = await axios.get(`${API_URL}/config`);
    console.log('✅ Configs:', configs.data);
    console.log('');

    console.log('3️⃣ Testando POST /api/config...');
    const newConfig = await axios.post(`${API_URL}/config`, {
      key: 'test_key',
      value: 'test_value',
      description: 'Test configuration'
    });
    console.log('✅ Config salva:', newConfig.data);
    console.log('');

    console.log('4️⃣ Testando GET /api/domains...');
    const domains = await axios.get(`${API_URL}/domains`);
    console.log('✅ Domínios:', domains.data);
    console.log('');

    console.log('5️⃣ Testando POST /api/structure/google...');
    const structure = await axios.post(`${API_URL}/structure/google`, {
      domain: 'test.com',
      product: 'test-product',
      cloaker: true
    });
    console.log('✅ Estrutura criada:', structure.data);
    console.log('');

    console.log('🎉 Todos os testes passaram!');
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

console.log('⏳ Aguardando 2 segundos para o servidor iniciar...');
setTimeout(testAPI, 2000);