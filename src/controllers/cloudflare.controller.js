import { cloudflareService } from '../services/cloudflare.service.js';

export const createDefaultDNSRecords = async (req, res, next) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ 
        error: 'Domain is required' 
      });
    }

    const defaultRecords = [
      {
        type: 'A',
        name: '@',
        content: '147.79.108.93',
        proxied: true
      },
      {
        type: 'CNAME',
        name: 'link',
        content: 'connect.domains-twr.com',
        proxied: false
      },
      {
        type: 'CNAME',
        name: 'rt',
        content: 'exmfr.ttrk.io',
        proxied: false
      }
    ];

    const results = await cloudflareService.createDNSRecords(domain, defaultRecords);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      message: `Default DNS records created for ${domain}`,
      domain,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length
      },
      results
    });
  } catch (error) {
    next(error);
  }
};

export const createDNSRecords = async (req, res, next) => {
  try {
    const { domain, records } = req.body;

    if (!domain) {
      return res.status(400).json({ 
        error: 'Domain is required' 
      });
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ 
        error: 'Records array is required and must not be empty' 
      });
    }

    const results = await cloudflareService.createDNSRecords(domain, records);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      message: `DNS records processed for ${domain}`,
      domain,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length
      },
      results
    });
  } catch (error) {
    next(error);
  }
};

export const listDNSRecords = async (req, res, next) => {
  try {
    const { domain } = req.params;

    if (!domain) {
      return res.status(400).json({ 
        error: 'Domain is required' 
      });
    }

    const records = await cloudflareService.listDNSRecords(domain);

    res.json({
      domain,
      total: records.length,
      records
    });
  } catch (error) {
    next(error);
  }
};