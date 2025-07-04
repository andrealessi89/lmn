// arquivo: teste.js
import { chromium } from 'playwright';
import axios from 'axios';


// ====== CONFIGURAÇÃO ======
// 1) Chave da API pública (para listar domain_id)
const apiKey = 'ieim8xzcDsGq2rXg9qwU'; // substitua pela sua API key pública

// 2) Token JWT capturado do painel (Authorization header) para criar landers
const bearerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXAiOjEsImlhdCI6MTc1MTU5OTQ2NSwiZXhwIjoxNzUxNjg1ODY1LCJ1c2VyX2lkIjoiNjYxZjBjODE1NzQ0YWYwMDAxZjllMDEzIiwic2lkIjoiNjg2NzQ5NjkxYjcxNDUxY2ZjMWYxYzdiIiwidGlkIjoiNjg2NzQ5NjkxYjcxNDUxY2ZjMWYxYzdjIn0.2b41VEj-Pv0BTPMfConbIncSDoaMH7CpofTDgqKIz9I'

// 3) Cookies completos capturados em DevTools > Network > Request Headers
const cookies = ''

// 4) Lista de domínios-base para automatizar (sem "rt.")

const baseDomains = ['bodydawn.com'];

const trackingSubdomain = (domain) => `rt.${domain}`;

// ====== BUSCAR domain_id ======
async function getDomainId(domainName) {
  const trackingDomain = trackingSubdomain(domainName).toLowerCase();
  const per = 100;
  let page = 1;

  while (true) {
    const url = `https://api.redtrack.io/domains?api_key=${apiKey}&page=${page}&per=${per}`;
    const res = await axios.get(url, {
      headers: {
        Accept: 'application/json',
        Cookie: cookies,
        Referer: 'https://app.redtrack.io/domains',
        Origin: 'https://app.redtrack.io',
      },
    });

    const { items, total } = res.data;
    const match = items.find((d) =>
      d.url.toLowerCase() === trackingDomain ||
      (d.name && d.name.toLowerCase() === domainName.toLowerCase())
    );

    if (match) return match.id;
    if (page * per >= total) break;
    page++;
  }

  throw new Error(`Domínio "${domainName}" não encontrado.`);
}

// ====== CRIAR LANDER VIA BROWSER ======
async function createLanderViaBrowser(domain, domainId, token) {
  const browser = await chromium.launch({ headless: false }); // usar headless: false para bypass
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    console.log(`🌐 Abrindo app.redtrack.io`);
    await page.goto('https://app.redtrack.io/landers', { waitUntil: 'domcontentloaded' });

    const trackingDomain = trackingSubdomain(domain);
    const payload = {
      title: `(Automação) Lander | ${domain}`,
      type: 'l',
      domain_id: domainId,
      typeUrl: `https://${trackingDomain}/click`,
      url: `https://${domain}/wtlander?utm_source={sub8}&utm_medium=cpc&utm_campaign={sub6}`,
      lp_views: `<script src="https://${trackingDomain}/track.js"></script>`,
      lp_protect: '',
      listicle: false,
      tags: [],
    };

    console.log(`📤 Criando lander via navegador para ${domain}`);
    const result = await page.evaluate(async ({ token, payload }) => {
      const res = await fetch('https://app.redtrack.io/api/landings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      return { status: res.status, data };
    }, { token, payload });

    console.log('✅ Lander criada:', result);
    return result;

  } catch (err) {
    console.error('❌ Erro no navegador:', err);
  } finally {
    await browser.close();
  }
}

// ====== EXECUÇÃO PRINCIPAL ======
(async () => {
  for (const domain of baseDomains) {
    console.log(`🚀 Iniciando: ${domain}`);
    try {
      const domainId = await getDomainId(domain);
      console.log(`🆔 Domain ID: ${domainId}`);
      await createLanderViaBrowser(domain, domainId, bearerToken);
    } catch (err) {
      console.error(`❌ Falha em ${domain}:`, err.message);
    }
  }
})();