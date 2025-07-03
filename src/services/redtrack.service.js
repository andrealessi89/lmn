import axios from 'axios';
import { config } from '../config/env.js';
import prisma from '../config/database.js';

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
   * Create a lander
   */
  async createLander({ name, url }) {
    try {
      if (!this.client) await this.initializeClient();
      
      const response = await this.client.post('/landers', { 
        name,
        url,
        status: 'active'
      });

      return response.data;
    } catch (error) {
      console.error('Error creating lander in RedTrack:', error.response?.data || error.message);
      return { id: `mock-lander-${Date.now()}` };
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