import axios from 'axios';

const CLOUDFLARE_API_TOKEN = "YyhJ2HwUd7xymJU3s4GBBefmki6mMg8_4BG";
const CLOUDFLARE_BASE_URL = "https://api.cloudflare.com/client/v4";

async function testCloudflareDirectly() {
  console.log('🔍 Testando API da Cloudflare diretamente...\n');

  try {
    // Teste 1: Verificar token
    console.log('1️⃣ Verificando validade do token...');
    const verifyResponse = await axios.get(
      `${CLOUDFLARE_BASE_URL}/user/tokens/verify`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Token válido:', verifyResponse.data);
    console.log('');

    // Teste 2: Listar zonas
    console.log('2️⃣ Listando zonas disponíveis...');
    const zonesResponse = await axios.get(
      `${CLOUDFLARE_BASE_URL}/zones`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Zonas encontradas:', zonesResponse.data.result?.length || 0);
    
    if (zonesResponse.data.result && zonesResponse.data.result.length > 0) {
      zonesResponse.data.result.forEach(zone => {
        console.log(`   - ${zone.name} (ID: ${zone.id})`);
      });
    }

    // Teste 3: Buscar zona específica
    console.log('\n3️⃣ Buscando zona bodydawn.com...');
    const domainResponse = await axios.get(
      `${CLOUDFLARE_BASE_URL}/zones?name=bodydawn.com`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (domainResponse.data.result && domainResponse.data.result.length > 0) {
      const zone = domainResponse.data.result[0];
      console.log('✅ Zona encontrada:', {
        name: zone.name,
        id: zone.id,
        status: zone.status
      });
    } else {
      console.log('❌ Zona bodydawn.com não encontrada');
    }

  } catch (error) {
    console.error('\n❌ Erro na API da Cloudflare:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data?.errors && error.response.data.errors.length > 0) {
        console.error('\nDetalhes dos erros:');
        error.response.data.errors.forEach(err => {
          console.error(`- Código ${err.code}: ${err.message}`);
        });
      }
    } else {
      console.error('Erro:', error.message);
    }

    console.log('\n💡 Possíveis soluções:');
    console.log('1. Verifique se o token tem as permissões corretas:');
    console.log('   - Zone:Read');
    console.log('   - DNS:Edit');
    console.log('2. Certifique-se de que o token não expirou');
    console.log('3. Verifique se o domínio está na sua conta Cloudflare');
  }
}

testCloudflareDirectly();