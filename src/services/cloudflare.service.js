import axios from 'axios';
import { config } from '../config/env.js';

class CloudflareService {
  constructor() {
    this.token = config.cloudflare.apiToken;
    this.baseUrl = config.cloudflare.baseUrl;
  }

  async getZoneId(domain) {
    const res = await axios.get(`${this.baseUrl}/zones?name=${domain}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data.result[0]?.id || null;
  }

  async createDNSRecord(zoneId, record) {
    return axios.post(`${this.baseUrl}/zones/${zoneId}/dns_records`, record, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createDNSRecords(domain, records) {
    const results = [];
    
    try {
      const zoneId = await this.getZoneId(domain);
      if (!zoneId) {
        throw new Error(`Zone ID not found for ${domain}`);
      }

      for (const record of records) {
        try {
          const recordData = {
            type: record.type,
            name: record.name,
            content: record.content,
            ttl: record.ttl || 3600,
            proxied: record.proxied || false
          };

          const response = await this.createDNSRecord(zoneId, recordData);
          
          results.push({
            success: true,
            record: response.data.result
          });
        } catch (error) {
          results.push({
            success: false,
            record,
            error: error.response?.data?.errors || error.message
          });
        }
      }
    } catch (error) {
      throw error;
    }

    return results;
  }

  async listDNSRecords(domain) {
    try {
      const zoneId = await this.getZoneId(domain);
      if (!zoneId) {
        return [];
      }

      const res = await axios.get(`${this.baseUrl}/zones/${zoneId}/dns_records`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      return res.data.result || [];
    } catch (error) {
      console.error('Error listing DNS records:', error.response?.data || error.message);
      return [];
    }
  }
}

export const cloudflareService = new CloudflareService();