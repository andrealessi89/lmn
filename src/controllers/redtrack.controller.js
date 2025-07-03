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