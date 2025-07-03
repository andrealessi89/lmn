import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testDomainInfo() {
  const testDomain = 'bodydawn.com';
  
  console.log('🔍 Testando busca de informações do domínio...\n');
  
  try {
    // Teste 1: Buscar status do domínio
    console.log(`1. Verificando status de ${testDomain}:`);
    const statusResponse = await axios.get(`${API_URL}/redtrack/domains/${testDomain}/status`);
    console.log('Status:', JSON.stringify(statusResponse.data, null, 2));
    
    // Teste 2: Buscar informações completas
    console.log(`\n2. Buscando informações completas de ${testDomain}:`);
    const infoResponse = await axios.get(`${API_URL}/redtrack/domains/${testDomain}/info`);
    console.log('Info completa:', JSON.stringify(infoResponse.data, null, 2));
    
    // Teste 3: Testar com domínio inexistente
    console.log('\n3. Testando com domínio inexistente:');
    try {
      await axios.get(`${API_URL}/redtrack/domains/dominio-inexistente.com/info`);
    } catch (error) {
      console.log('Erro esperado:', error.response.data);
    }
    
  } catch (error) {
    console.error('\n❌ Erro:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Erro:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Erro de conexão:', error.message);
    }
  }
}

testDomainInfo();