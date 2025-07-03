import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.CLOUDFLARE_API_TOKEN;

console.log('Token do .env:', token);
console.log('Token length:', token?.length);
console.log('');

async function testSimple() {
  try {
    console.log('Testando chamada simples para Cloudflare...');
    
    const response = await axios.get('https://api.cloudflare.com/client/v4/zones?name=bodydawn.com', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Sucesso!');
    console.log('Zonas encontradas:', response.data.result?.length || 0);
    
    if (response.data.result?.[0]) {
      console.log('Zone ID:', response.data.result[0].id);
      console.log('Zone Name:', response.data.result[0].name);
    }
    
  } catch (error) {
    console.log('❌ Erro:', error.response?.status, error.response?.statusText);
    console.log('Detalhes:', error.response?.data);
  }
}

testSimple();