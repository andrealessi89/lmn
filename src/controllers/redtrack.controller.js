import redtrackService from '../services/redtrack.service.js';

export const registerDomain = async (req, res, next) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({
        error: 'Domain is required'
      });
    }

    const result = await redtrackService.registerDomain(domain);

    if (result.success) {
      return res.status(201).json({
        message: `Domain ${result.domain} registered successfully`,
        domain: result.domain,
        data: result.data
      });
    } else {
      return res.status(result.status || 400).json({
        error: result.error,
        domain: result.domain
      });
    }
  } catch (error) {
    next(error);
  }
};

export const registerMultipleDomains = async (req, res, next) => {
  try {
    const { domains } = req.body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({
        error: 'Domains array is required'
      });
    }

    const results = await redtrackService.batchRegisterDomains(domains);

    return res.status(200).json({
      message: 'Domain registration completed',
      summary: results.summary,
      results: results.results
    });
  } catch (error) {
    next(error);
  }
};

export const checkDomainStatus = async (req, res, next) => {
  try {
    const { domain } = req.params;

    if (!domain) {
      return res.status(400).json({
        error: 'Domain parameter is required'
      });
    }

    const result = await redtrackService.checkDomainStatus(domain);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getDomainInfo = async (req, res, next) => {
  try {
    const { domain } = req.params;

    if (!domain) {
      return res.status(400).json({
        error: 'Domain parameter is required'
      });
    }

    const result = await redtrackService.getDomainInfo(domain);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json({
        error: result.error,
        domain: result.domain
      });
    }
  } catch (error) {
    next(error);
  }
};

export const listDomains = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    
    const result = await redtrackService.listDomains({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      search
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createLander = async (req, res, next) => {
  try {
    console.log('[createLander] Received request:', {
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.url
    });

    const { domain, url, slug, parameters, product, platform, hasCloaker } = req.body;

    // Validações
    if (!domain) {
      console.log('[createLander] Error: Domain is required');
      return res.status(400).json({
        error: 'Domain is required'
      });
    }

    if (!url) {
      console.log('[createLander] Error: URL is required');
      return res.status(400).json({
        error: 'URL is required'
      });
    }

    if (!product) {
      console.log('[createLander] Error: Product is required');
      return res.status(400).json({
        error: 'Product is required'
      });
    }

    if (!platform) {
      console.log('[createLander] Error: Platform is required');
      return res.status(400).json({
        error: 'Platform is required'
      });
    }

    console.log('[createLander] Creating lander with params:', {
      domain,
      url,
      slug: slug || 'wtlander',
      parameters: parameters || {},
      product,
      platform,
      hasCloaker: hasCloaker || false
    });

    const result = await redtrackService.createLanderWithLookup({
      domain,
      url,
      slug: slug || 'wtlander',
      parameters: parameters || {},
      product,
      platform,
      hasCloaker: hasCloaker || false
    });
    
    console.log('[createLander] Service result:', result);

    if (result.success) {
      console.log('[createLander] Success - Lander created with ID:', result.landerId);
      return res.status(201).json({
        message: `Lander created successfully for ${domain}`,
        landerId: result.landerId,
        domainId: result.domainInfo.id,
        data: result.data
      });
    } else {
      console.log('[createLander] Failed:', result.error);
      return res.status(400).json({
        error: result.error
      });
    }
  } catch (error) {
    console.error('[createLander] Exception:', error);
    next(error);
  }
};

export const createCustomLander = async (req, res, next) => {
  try {
    const { 
      domain, 
      title, 
      url, 
      numberOfOffers,
      offerId 
    } = req.body;

    if (!domain) {
      return res.status(400).json({
        error: 'Domain is required'
      });
    }

    const result = await redtrackService.createCustomLander({
      domain,
      title,
      url,
      numberOfOffers,
      offerId
    });

    if (result.success) {
      return res.status(201).json({
        message: `Custom lander created successfully for ${domain}`,
        landerId: result.landerId,
        domainId: result.domainInfo.id,
        data: result.data
      });
    } else {
      return res.status(400).json({
        error: result.error
      });
    }
  } catch (error) {
    next(error);
  }
};

export const createPrelander = async (req, res, next) => {
  try {
    console.log('[createPrelander] Received request:', {
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.url
    });

    const { domain, url, slug, parameters, product, platform, hasCloaker } = req.body;

    // Validações
    if (!domain) {
      console.log('[createPrelander] Error: Domain is required');
      return res.status(400).json({
        error: 'Domain is required'
      });
    }

    if (!url) {
      console.log('[createPrelander] Error: URL is required');
      return res.status(400).json({
        error: 'URL is required'
      });
    }

    if (!product) {
      console.log('[createPrelander] Error: Product is required');
      return res.status(400).json({
        error: 'Product is required'
      });
    }

    if (!platform) {
      console.log('[createPrelander] Error: Platform is required');
      return res.status(400).json({
        error: 'Platform is required'
      });
    }

    console.log('[createPrelander] Creating prelander with params:', {
      domain,
      url,
      slug: slug || 'innerpre',
      parameters: parameters || {},
      product,
      platform,
      hasCloaker: hasCloaker || false
    });

    const result = await redtrackService.createPrelanderWithLookup({
      domain,
      url,
      slug: slug || 'innerpre',
      parameters: parameters || {},
      product,
      platform,
      hasCloaker: hasCloaker || false
    });
    
    console.log('[createPrelander] Service result:', result);

    if (result.success) {
      console.log('[createPrelander] Success - Prelander created with ID:', result.prelanderId);
      return res.status(201).json({
        message: `Prelander created successfully for ${domain}`,
        prelanderId: result.prelanderId,
        domainId: result.domainInfo.id,
        data: result.data
      });
    } else {
      console.log('[createPrelander] Failed:', result.error);
      return res.status(400).json({
        error: result.error
      });
    }
  } catch (error) {
    console.error('[createPrelander] Exception:', error);
    next(error);
  }
};