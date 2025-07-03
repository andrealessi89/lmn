import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testRedTrack() {
  try {
    console.log('🚀 Testando registro de domínio no RedTrack...\n');
    
    const testData = {
      domain: 'bodydawn.com'
    };
    
    console.log('Fazendo POST para /api/redtrack/domains');
    console.log('Dados:', testData);
    
    const response = await axios.post(`${API_URL}/redtrack/domains`, testData);
    
    console.log('\n✅ Sucesso!');
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(response.data, null, 2));
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

testRedTrack();