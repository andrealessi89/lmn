import axios from 'axios';
import { config } from '../config/env.js';
import prisma from '../config/database.js';
import redtrackAuthService from './redtrack-auth.service.js';
import { chromium } from 'playwright';

class RedtrackService {
  constructor() {
    this.baseUrl = config.redtrack.baseUrl;
    this.client = null;
    this.initializeClient();
  }

  async initializeClient() {
    const apiKey = await this.getApiKey();
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 30000
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (request) => {
        console.log('RedTrack API Request:', {
          method: request.method,
          url: request.url,
          data: request.data
        });
        return request;
      },
      (error) => {
        console.error('RedTrack API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log('RedTrack API Response:', {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        console.error('RedTrack API Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  async getApiKey() {
    const configRecord = await prisma.config.findUnique({
      where: { key: 'redtrack_api_key' }
    });
    return configRecord?.value || config.redtrack.apiKey;
  }

  async refreshApiKey() {
    const apiKey = await this.getApiKey();
    if (this.client) {
      this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  /**
   * Register a domain with RedTrack
   * @param {Object} domainData - Domain registration data
   * @param {string} domainData.domain - The domain to register
   * @param {string} domainData.campaignId - Campaign ID
   * @param {Object} domainData.settings - Additional domain settings
   * @returns {Promise<Object>} Registration response
   */
  async registerDomain(domain) {
    const fullDomain = `rt.${domain}`;
    const apiKey = await this.getApiKey();
    
    try {
      const response = await axios.post(
        `https://api.redtrack.io/domains?api_key=${apiKey}`,
        {
          url: fullDomain,
          ssl: { active: false },
          type: "track",
          use_auto_generated_ssl: true
        },
        {
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json"
          }
        }
      );

      return {
        success: true,
        data: response.data,
        domainId: response.data.domain_id,
        status: response.data.status
      };
    } catch (error) {
      return this.handleError(error, 'Domain registration failed');
    }
  }

  /**
   * Create a domain (legacy method for backward compatibility)
   */
  async createDomain(domain) {
    try {
      return await this.registerDomain({
        domain: domain,
        settings: {
          url: `https://${domain}`
        }
      });
    } catch (error) {
      console.error('Error creating domain in RedTrack:', error.response?.data || error.message);
      return { id: `mock-domain-${Date.now()}` };
    }
  }

  /**
   * Get domain ID and complete information
   * @param {string} domain - Domain to find (without rt. prefix)
   * @returns {Promise<Object>} Domain information with ID
   */
  async getDomainInfo(domain) {
    const trackingDomain = `rt.${domain}`.toLowerCase();
    const apiKey = await this.getApiKey();
    const per = 100; // itens por página
    let page = 1;

    while (true) {
      try {
        const url = `https://api.redtrack.io/domains?api_key=${apiKey}&page=${page}&per=${per}`;
        console.log(`🔍 Buscando página ${page} para domínio ${trackingDomain}`);
        
        const response = await axios.get(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 10000
        });

        const { items, total } = response.data;

        if (!Array.isArray(items)) {
          throw new Error(`Resposta inesperada: ${JSON.stringify(response.data)}`);
        }

        // Procura pelo domínio de tracking ou nome igual
        const match = items.find(d =>
          d.url.toLowerCase() === trackingDomain ||
          (d.name && d.name.toLowerCase() === domain.toLowerCase())
        );

        if (match) {
          return {
            success: true,
            domain: match.url,
            id: match.id,
            name: match.name,
            type: match.type,
            ssl: match.ssl,
            status: match.status,
            created_at: match.created_at,
            updated_at: match.updated_at
          };
        }

        // Se já varreu todas as páginas, sai
        if (page * per >= total) break;
        page++;
      } catch (error) {
        console.error(`❌ Erro ao buscar domain_id (página ${page}):`, error.message);
        return this.handleError(error, 'Failed to get domain info');
      }
    }

    return {
      success: false,
      domain: trackingDomain,
      error: `Domínio "${trackingDomain}" não encontrado após varrer todas as páginas.`
    };
  }

  /**
   * Check domain status (simplified version)
   * @param {string} domain - Domain to check (without rt. prefix)
   * @returns {Promise<Object>} Domain status information
   */
  async checkDomainStatus(domain) {
    const result = await this.getDomainInfo(domain);
    
    if (result.success) {
      return {
        domain: result.domain,
        active: result.status === 'active',
        id: result.id,
        ssl: result.ssl || { active: false }
      };
    } else {
      return {
        domain: `rt.${domain}`,
        active: false,
        error: result.error
      };
    }
  }

  /**
   * Update domain settings
   * @param {string} domainId - Domain ID to update
   * @param {Object} settings - New settings
   * @returns {Promise<Object>} Update response
   */
  async updateDomain(domainId, settings) {
    try {
      if (!this.client) await this.initializeClient();
      
      const response = await this.client.put(`/domains/${domainId}`, {
        settings: settings
      });

      return {
        success: true,
        data: response.data,
        message: 'Domain updated successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Domain update failed');
    }
  }

  /**
   * Delete a domain
   * @param {string} domainId - Domain ID to delete
   * @returns {Promise<Object>} Deletion response
   */
  async deleteDomain(domainId) {
    try {
      if (!this.client) await this.initializeClient();
      
      const response = await this.client.delete(`/domains/${domainId}`);

      return {
        success: true,
        data: response.data,
        message: 'Domain deleted successfully'
      };
    } catch (error) {
      return this.handleError(error, 'Domain deletion failed');
    }
  }

  /**
   * List all domains
   * @param {Object} filters - Optional filters
   * @param {string} filters.campaignId - Filter by campaign ID
   * @param {string} filters.status - Filter by status
   * @param {number} filters.page - Page number
   * @param {number} filters.limit - Items per page
   * @returns {Promise<Object>} List of domains
   */
  async listDomains(filters = {}) {
    const apiKey = await this.getApiKey();
    
    try {
      const response = await axios.get(
        `https://api.redtrack.io/domains?api_key=${apiKey}`,
        {
          headers: {
            "accept": "application/json"
          }
        }
      );

      let domains = response.data || [];
      
      // Filtrar por busca se fornecido
      if (filters.search) {
        domains = domains.filter(d => 
          d.url.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      // Paginação manual
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const start = (page - 1) * limit;
      const paginatedDomains = domains.slice(start, start + limit);

      return {
        domains: paginatedDomains,
        pagination: {
          page: page,
          limit: limit,
          total: domains.length,
          totalPages: Math.ceil(domains.length / limit)
        }
      };
    } catch (error) {
      console.error('Error listing domains from RedTrack:', error.response?.data || error.message);
      return {
        domains: [],
        error: error.message
      };
    }
  }

  /**
   * Get domain analytics
   * @param {string} domainId - Domain ID
   * @param {Object} dateRange - Date range for analytics
   * @param {string} dateRange.startDate - Start date (YYYY-MM-DD)
   * @param {string} dateRange.endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Domain analytics data
   */
  async getDomainAnalytics(domainId, dateRange = {}) {
    try {
      if (!this.client) await this.initializeClient();
      
      const params = {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      };

      const response = await this.client.get(`/domains/${domainId}/analytics`, { params });

      return {
        success: true,
        data: response.data,
        metrics: {
          clicks: response.data.clicks || 0,
          conversions: response.data.conversions || 0,
          revenue: response.data.revenue || 0,
          conversionRate: response.data.conversion_rate || 0
        }
      };
    } catch (error) {
      return this.handleError(error, 'Failed to get domain analytics');
    }
  }

  /**
   * Validate domain before registration
   * @param {string} domain - Domain to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateDomain(domain) {
    try {
      if (!this.client) await this.initializeClient();
      
      const response = await this.client.post('/domains/validate', { domain });

      return {
        success: true,
        isValid: response.data.valid,
        message: response.data.message,
        suggestions: response.data.suggestions || []
      };
    } catch (error) {
      return this.handleError(error, 'Domain validation failed');
    }
  }

  /**
   * Create a lander using internal API with authentication
   * @param {Object} params - Lander parameters
   * @param {string} params.domain - Base domain name (without rt.)
   * @param {string} params.domainId - RedTrack domain ID
   * @param {string} params.url - Base URL for the lander
   * @param {string} params.slug - URL slug/path
   * @param {Object} params.parameters - URL parameters
   * @param {string} params.product - Product name
   * @param {string} params.platform - Advertising platform
   * @param {boolean} params.hasCloaker - Whether cloaker is enabled
   * @returns {Promise<Object>} Created lander data
   */
  async createLander(params) {
    const { domain, domainId, url, slug = 'wtlander', parameters = {}, product, platform, hasCloaker = false } = params;
    
    console.log('[createLander] Starting with:', params);
    
    const auth = await redtrackAuthService.getValidAuth();
    console.log('[createLander] Auth status:', {
      hasAuth: !!auth,
      hasToken: !!auth?.token,
      hasCookies: !!auth?.cookies,
      expiresAt: auth?.expiresAt
    });
    
    if (!auth) {
      console.error('[createLander] No valid auth found');
      throw new Error('No valid RedTrack authentication found. Please update credentials via admin panel.');
    }

    // Construir URL com parâmetros sem codificar {sub}
    let fullUrl = `${url}/${slug}`;
    if (Object.keys(parameters).length > 0) {
      const paramString = Object.entries(parameters)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      fullUrl = `${fullUrl}?${paramString}`;
    }
    
    // Gerar título no formato: (Produto)(Cloaker) Inner| Lander | Plataforma | domínio
    const cloakerTag = hasCloaker ? '(Cloaker) ' : '';
    const title = `(${product})${cloakerTag}Inner| Lander | ${platform} | ${domain}`;
    
    const trackingDomain = `rt.${domain}`;
    const payload = {
      title: title,
      type: 'l',
      domain_id: domainId,
      typeUrl: `https://${trackingDomain}/click`,
      url: fullUrl,
      lp_views: `<script src="https://${trackingDomain}/track.js"></script>`,
      lp_protect: '',
      listicle: false,
      tags: []
    };
    
    console.log('[createLander] Payload:', JSON.stringify(payload, null, 2));
    console.log('[createLander] Headers:', {
      hasToken: !!auth.token,
      tokenPreview: auth.token ? `${auth.token.substring(0, 20)}...` : 'none',
      hasCookies: !!auth.cookies,
      cookiesLength: auth.cookies?.length || 0
    });

    try {
      const response = await axios.post('https://app.redtrack.io/api/landings', payload, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cookie': auth.cookies,
          'Origin': 'https://app.redtrack.io',
          'Referer': 'https://app.redtrack.io/landers',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      console.log(`✅ [createLander] Lander criada com sucesso para ${domain}`);
      console.log('[createLander] Response:', {
        status: response.status,
        data: response.data
      });
      
      return {
        success: true,
        data: response.data,
        landerId: response.data.id
      };
    } catch (error) {
      console.error(`❌ [createLander] Erro ao criar lander para ${domain}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        headers: error.response?.headers
      });
      return this.handleError(error, 'Failed to create lander');
    }
  }

  /**
   * Create lander via browser using Playwright (fallback method)
   * @param {Object} params - Lander parameters
   * @param {string} params.domain - Base domain name (without rt.)
   * @param {string} params.domainId - RedTrack domain ID
   * @param {string} params.url - Base URL for the lander
   * @param {string} params.slug - URL slug/path
   * @param {Object} params.parameters - URL parameters
   * @param {string} params.product - Product name
   * @param {string} params.platform - Advertising platform
   * @param {boolean} params.hasCloaker - Whether cloaker is enabled
   * @returns {Promise<Object>} Created lander data
   */
  async createLanderViaBrowser(params) {
    const { domain, domainId, url, slug = 'wtlander', parameters = {}, product, platform, hasCloaker = false } = params;
    
    console.log('[createLanderViaBrowser] Starting with Playwright for:', params);
    
    const auth = await redtrackAuthService.getValidAuth();
    if (!auth) {
      throw new Error('No valid RedTrack authentication found. Please update credentials via admin panel.');
    }

    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    });
    
    const page = await context.newPage();

    try {
      console.log(`🌐 [createLanderViaBrowser] Opening RedTrack app`);
      await page.goto('https://app.redtrack.io/landers', { waitUntil: 'domcontentloaded' });

      // Construir URL com parâmetros sem codificar {sub}
      let fullUrl = `${url}/${slug}`;
      if (Object.keys(parameters).length > 0) {
        const paramString = Object.entries(parameters)
          .map(([key, value]) => `${key}=${value}`)
          .join('&');
        fullUrl = `${fullUrl}?${paramString}`;
      }
      
      // Gerar título no formato: (Produto)(Cloaker) Inner| Lander | Plataforma | domínio
      const cloakerTag = hasCloaker ? '(Cloaker) ' : '';
      const title = `(${product})${cloakerTag}Inner| Lander | ${platform} | ${domain}`;
      
      const trackingDomain = `rt.${domain}`;
      const payload = {
        title: title,
        type: 'l',
        domain_id: domainId,
        typeUrl: `https://${trackingDomain}/click`,
        url: fullUrl,
        lp_views: `<script src="https://${trackingDomain}/track.js"></script>`,
        lp_protect: '',
        listicle: false,
        tags: [],
      };

      console.log(`📤 [createLanderViaBrowser] Creating lander via browser for ${domain}`);
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
      }, { token: auth.token, payload });

      console.log('✅ [createLanderViaBrowser] Lander created:', result);
      
      if (result.status === 200 || result.status === 201) {
        return {
          success: true,
          data: result.data,
          landerId: result.data.id
        };
      } else {
        throw new Error(`Failed with status ${result.status}: ${JSON.stringify(result.data)}`);
      }

    } catch (error) {
      console.error('❌ [createLanderViaBrowser] Browser error:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  /**
   * Create lander with automatic domain ID lookup
   * @param {Object} params - Lander parameters
   * @param {string} params.domain - Base domain name (without rt.)
   * @param {string} params.url - Base URL for the lander
   * @param {string} params.slug - URL slug/path (default: 'wtlander')
   * @param {Object} params.parameters - URL parameters to append
   * @param {string} params.product - Product name
   * @param {string} params.platform - Advertising platform (Google, Facebook, etc.)
   * @param {boolean} params.hasCloaker - Whether cloaker is enabled
   * @returns {Promise<Object>} Created lander data with domain info
   */
  async createLanderWithLookup(params) {
    try {
      const { domain, url, slug = 'wtlander', parameters = {}, product, platform, hasCloaker = false } = params;
      
      console.log('[createLanderWithLookup] Starting with params:', params);
      
      // Primeiro busca o ID do domínio
      console.log(`🔍 [createLanderWithLookup] Buscando informações do domínio ${domain}...`);
      const domainInfo = await this.getDomainInfo(domain);
      console.log('[createLanderWithLookup] Domain info result:', domainInfo);
      
      if (!domainInfo.success) {
        console.error('[createLanderWithLookup] Domain not found:', domain);
        throw new Error(`Domínio ${domain} não encontrado no RedTrack`);
      }

      console.log(`🆔 [createLanderWithLookup] Domain ID encontrado: ${domainInfo.id}`);
      
      // Criar a lander
      console.log('[createLanderWithLookup] Calling createLander with:', {
        domain,
        domainId: domainInfo.id,
        url,
        slug,
        parameters
      });
      // Tentar primeiro o método direto
      let landerResult = await this.createLander({ 
        domain, 
        domainId: domainInfo.id, 
        url, 
        slug, 
        parameters,
        product,
        platform,
        hasCloaker
      });
      
      // Se falhar com erro 403 ou similar, tentar via browser
      if (!landerResult.success && landerResult.error?.statusCode === 403) {
        console.log('[createLanderWithLookup] Direct method failed with 403, trying browser method...');
        try {
          const browserResult = await this.createLanderViaBrowser({ 
            domain, 
            domainId: domainInfo.id, 
            url, 
            slug, 
            parameters,
            product,
            platform,
            hasCloaker
          });
          landerResult = browserResult;
        } catch (browserError) {
          console.error('[createLanderWithLookup] Browser method also failed:', browserError);
          // Manter o erro original
        }
      }
      console.log('[createLanderWithLookup] Lander creation result:', landerResult);
      
      const finalResult = {
        ...landerResult,
        domainInfo
      };
      
      console.log('[createLanderWithLookup] Final result:', finalResult);
      return finalResult;
    } catch (error) {
      console.error(`❌ [createLanderWithLookup] Erro no processo de criação de lander:`, {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create custom lander with specific parameters
   * @param {Object} params - Lander parameters
   * @param {string} params.domain - Base domain name (without rt.)
   * @param {string} params.title - Custom title for the lander
   * @param {string} params.url - Custom URL for the lander
   * @param {number} params.numberOfOffers - Number of offers
   * @param {string} params.offerId - Offer ID
   * @returns {Promise<Object>} Created lander data with domain info
   */
  async createCustomLander(params) {
    try {
      const { domain, title, url, slug = 'wtlander', parameters = {}, numberOfOffers, offerId } = params;
      
      // Primeiro busca o ID do domínio
      console.log(`🔍 Buscando informações do domínio ${domain}...`);
      const domainInfo = await this.getDomainInfo(domain);
      
      if (!domainInfo.success) {
        throw new Error(`Domínio ${domain} não encontrado no RedTrack`);
      }

      console.log(`🆔 Domain ID encontrado: ${domainInfo.id}`);
      
      // Obter autenticação
      const auth = await redtrackAuthService.getValidAuth();
      
      if (!auth) {
        throw new Error('No valid RedTrack authentication found. Please update credentials via admin panel.');
      }

      const trackingDomain = `rt.${domain}`;
      
      // Construir payload customizado
      const payload = {
        title: title || `(Automação) Lander | ${domain}`,
        type: 'l',
        domain_id: domainInfo.id,
        typeUrl: `https://${trackingDomain}/click`,
        url: url || `https://${domain}/wtlander?utm_source={sub8}&utm_medium=cpc&utm_campaign={sub6}`,
        lp_views: `<script src="https://${trackingDomain}/track.js"></script>`,
        lp_protect: '',
        listicle: false,
        tags: []
      };

      // Adicionar parâmetros opcionais se fornecidos
      if (numberOfOffers) {
        payload.numberOfOffers = numberOfOffers;
      }
      if (offerId) {
        payload.offerId = offerId;
      }

      try {
        const response = await axios.post('https://app.redtrack.io/api/landings', payload, {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cookie': auth.cookies,
            'Origin': 'https://app.redtrack.io',
            'Referer': 'https://app.redtrack.io/landers',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        console.log(`✅ Lander customizada criada com sucesso para ${domain}`);
        return {
          success: true,
          data: response.data,
          landerId: response.data.id,
          domainInfo
        };
      } catch (error) {
        console.error(`❌ Erro ao criar lander customizada:`, error.response?.data || error.message);
        return this.handleError(error, 'Failed to create custom lander');
      }
    } catch (error) {
      console.error(`❌ Erro no processo de criação de lander customizada:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch register multiple domains
   * @param {Array} domains - Array of domain objects
   * @returns {Promise<Object>} Batch registration results
   */
  async batchRegisterDomains(domains) {
    try {
      const results = {
        successful: [],
        failed: [],
        total: domains.length
      };

      // Process domains in batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < domains.length; i += batchSize) {
        const batch = domains.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (domainStr) => {
          try {
            const domain = typeof domainStr === 'string' ? domainStr : domainStr.domain;
            const result = await this.registerDomain(domain);
            if (result.success) {
              results.successful.push({
                domain: `rt.${domain}`,
                data: result.data
              });
            } else {
              results.failed.push({
                domain: `rt.${domain}`,
                error: result.error.message
              });
            }
          } catch (error) {
            const domain = typeof domainStr === 'string' ? domainStr : domainStr.domain;
            results.failed.push({
              domain: `rt.${domain}`,
              error: error.message
            });
          }
        });

        await Promise.all(batchPromises);
      }

      return {
        summary: {
          total: results.total,
          successful: results.successful.length,
          failed: results.failed.length
        },
        results: [...results.successful, ...results.failed]
      };
    } catch (error) {
      return this.handleError(error, 'Batch domain registration failed');
    }
  }

  /**
   * Create a prelander using internal API with authentication
   * @param {Object} params - Prelander parameters
   * @param {string} params.domain - Base domain name (without rt.)
   * @param {string} params.domainId - RedTrack domain ID
   * @param {string} params.url - Base URL for the prelander
   * @param {string} params.slug - URL slug/path
   * @param {Object} params.parameters - URL parameters
   * @param {string} params.product - Product name
   * @param {string} params.platform - Advertising platform
   * @param {boolean} params.hasCloaker - Whether cloaker is enabled
   * @returns {Promise<Object>} Created prelander data
   */
  async createPrelander(params) {
    const { domain, domainId, url, slug = 'innerpre', parameters = {}, product, platform, hasCloaker = false } = params;
    
    console.log('[createPrelander] Starting with:', params);
    
    const auth = await redtrackAuthService.getValidAuth();
    console.log('[createPrelander] Auth status:', {
      hasAuth: !!auth,
      hasToken: !!auth?.token,
      hasCookies: !!auth?.cookies,
      expiresAt: auth?.expiresAt
    });
    
    if (!auth) {
      console.error('[createPrelander] No valid auth found');
      throw new Error('No valid RedTrack authentication found. Please update credentials via admin panel.');
    }

    // Construir URL com parâmetros sem codificar {sub}
    let fullUrl = `${url}/${slug}`;
    if (Object.keys(parameters).length > 0) {
      const paramString = Object.entries(parameters)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      fullUrl = `${fullUrl}?${paramString}`;
    }
    
    // Gerar título no formato: (Produto)(Cloaker) Inner | PreLander | Plataforma | domínio
    const cloakerTag = hasCloaker ? '(Cloaker) ' : '';
    const title = `(${product})${cloakerTag}Inner | PreLander | ${platform} | ${domain}`;
    
    const trackingDomain = `rt.${domain}`;
    const payload = {
      title: title,
      type: 'p', // 'p' para prelander
      domain_id: domainId,
      typeUrl: `https://${trackingDomain}/click`,
      url: fullUrl,
      lp_views: `<script src="https://${trackingDomain}/track.js"></script>`,
      lp_protect: '',
      listicle: false,
      tags: []
    };
    
    console.log('[createPrelander] Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post('https://app.redtrack.io/api/landings', payload, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cookie': auth.cookies,
          'Origin': 'https://app.redtrack.io',
          'Referer': 'https://app.redtrack.io/landers',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      console.log(`✅ [createPrelander] Prelander criada com sucesso para ${domain}`);
      console.log('[createPrelander] Response:', {
        status: response.status,
        data: response.data
      });
      
      return {
        success: true,
        data: response.data,
        prelanderId: response.data.id
      };
    } catch (error) {
      console.error(`❌ [createPrelander] Erro ao criar prelander para ${domain}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        headers: error.response?.headers
      });
      return this.handleError(error, 'Failed to create prelander');
    }
  }

  /**
   * Create prelander via browser using Playwright (fallback method)
   * @param {Object} params - Prelander parameters
   * @param {string} params.domain - Base domain name (without rt.)
   * @param {string} params.domainId - RedTrack domain ID
   * @param {string} params.url - Base URL for the prelander
   * @param {string} params.slug - URL slug/path
   * @param {Object} params.parameters - URL parameters
   * @param {string} params.product - Product name
   * @param {string} params.platform - Advertising platform
   * @param {boolean} params.hasCloaker - Whether cloaker is enabled
   * @returns {Promise<Object>} Created prelander data
   */
  async createPrelanderViaBrowser(params) {
    const { domain, domainId, url, slug = 'innerpre', parameters = {}, product, platform, hasCloaker = false } = params;
    
    console.log('[createPrelanderViaBrowser] Starting with Playwright for:', params);
    
    const auth = await redtrackAuthService.getValidAuth();
    if (!auth) {
      throw new Error('No valid RedTrack authentication found. Please update credentials via admin panel.');
    }

    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    });
    
    const page = await context.newPage();

    try {
      console.log(`🌐 [createPrelanderViaBrowser] Opening RedTrack app`);
      await page.goto('https://app.redtrack.io/landers', { waitUntil: 'domcontentloaded' });

      // Construir URL com parâmetros sem codificar {sub}
      let fullUrl = `${url}/${slug}`;
      if (Object.keys(parameters).length > 0) {
        const paramString = Object.entries(parameters)
          .map(([key, value]) => `${key}=${value}`)
          .join('&');
        fullUrl = `${fullUrl}?${paramString}`;
      }
      
      // Gerar título no formato: (Produto)(Cloaker) Inner | PreLander | Plataforma | domínio
      const cloakerTag = hasCloaker ? '(Cloaker) ' : '';
      const title = `(${product})${cloakerTag}Inner | PreLander | ${platform} | ${domain}`;
      
      const trackingDomain = `rt.${domain}`;
      const payload = {
        title: title,
        type: 'p', // 'p' para prelander
        domain_id: domainId,
        typeUrl: `https://${trackingDomain}/click`,
        url: fullUrl,
        lp_views: `<script src="https://${trackingDomain}/track.js"></script>`,
        lp_protect: '',
        listicle: false,
        tags: [],
      };

      console.log(`📤 [createPrelanderViaBrowser] Creating prelander via browser for ${domain}`);
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
      }, { token: auth.token, payload });

      console.log('✅ [createPrelanderViaBrowser] Prelander created:', result);
      
      if (result.status === 200 || result.status === 201) {
        return {
          success: true,
          data: result.data,
          prelanderId: result.data.id
        };
      } else {
        throw new Error(`Failed with status ${result.status}: ${JSON.stringify(result.data)}`);
      }

    } catch (error) {
      console.error('❌ [createPrelanderViaBrowser] Browser error:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  /**
   * Create prelander with automatic domain ID lookup
   * @param {Object} params - Prelander parameters
   * @param {string} params.domain - Base domain name (without rt.)
   * @param {string} params.url - Base URL for the prelander
   * @param {string} params.slug - URL slug/path (default: 'innerpre')
   * @param {Object} params.parameters - URL parameters to append
   * @param {string} params.product - Product name
   * @param {string} params.platform - Advertising platform (Google, Facebook, etc.)
   * @param {boolean} params.hasCloaker - Whether cloaker is enabled
   * @returns {Promise<Object>} Created prelander data with domain info
   */
  async createPrelanderWithLookup(params) {
    try {
      const { domain, url, slug = 'innerpre', parameters = {}, product, platform, hasCloaker = false } = params;
      
      console.log('[createPrelanderWithLookup] Starting with params:', params);
      
      // Primeiro busca o ID do domínio
      console.log(`🔍 [createPrelanderWithLookup] Buscando informações do domínio ${domain}...`);
      const domainInfo = await this.getDomainInfo(domain);
      console.log('[createPrelanderWithLookup] Domain info result:', domainInfo);
      
      if (!domainInfo.success) {
        console.error('[createPrelanderWithLookup] Domain not found:', domain);
        throw new Error(`Domínio ${domain} não encontrado no RedTrack`);
      }

      console.log(`🆔 [createPrelanderWithLookup] Domain ID encontrado: ${domainInfo.id}`);
      
      // Criar a prelander
      console.log('[createPrelanderWithLookup] Calling createPrelander with:', {
        domain,
        domainId: domainInfo.id,
        url,
        slug,
        parameters
      });
      // Tentar primeiro o método direto
      let prelanderResult = await this.createPrelander({ 
        domain, 
        domainId: domainInfo.id, 
        url, 
        slug, 
        parameters,
        product,
        platform,
        hasCloaker
      });
      
      // Se falhar com erro 403 ou similar, tentar via browser
      if (!prelanderResult.success && prelanderResult.error?.statusCode === 403) {
        console.log('[createPrelanderWithLookup] Direct method failed with 403, trying browser method...');
        try {
          const browserResult = await this.createPrelanderViaBrowser({ 
            domain, 
            domainId: domainInfo.id, 
            url, 
            slug, 
            parameters,
            product,
            platform,
            hasCloaker
          });
          prelanderResult = browserResult;
        } catch (browserError) {
          console.error('[createPrelanderWithLookup] Browser method also failed:', browserError);
          // Manter o erro original
        }
      }
      console.log('[createPrelanderWithLookup] Prelander creation result:', prelanderResult);
      
      const finalResult = {
        ...prelanderResult,
        domainInfo
      };
      
      console.log('[createPrelanderWithLookup] Final result:', finalResult);
      return finalResult;
    } catch (error) {
      console.error(`❌ [createPrelanderWithLookup] Erro no processo de criação de prelander:`, {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @param {string} defaultMessage - Default error message
   * @returns {Object} Error response
   */
  handleError(error, defaultMessage) {
    const errorResponse = error.response?.data;
    const statusCode = error.response?.status;

    let message = defaultMessage;
    let code = 'REDTRACK_API_ERROR';

    if (errorResponse) {
      message = errorResponse.message || errorResponse.error || defaultMessage;
      code = errorResponse.code || code;
    }

    if (statusCode === 401) {
      code = 'UNAUTHORIZED';
      message = 'Invalid API key or unauthorized access';
    } else if (statusCode === 429) {
      code = 'RATE_LIMIT';
      message = 'Rate limit exceeded. Please try again later';
    } else if (statusCode === 404) {
      code = 'NOT_FOUND';
      message = 'Resource not found';
    }

    console.error(`RedTrack API Error [${code}]:`, message);

    return {
      success: false,
      error: {
        code,
        message,
        statusCode,
        details: errorResponse
      }
    };
  }
}

export default new RedtrackService();