import axios from 'axios';
import { config } from '../config/env.js';
import prisma from '../config/database.js';

class CloackmeService {
  constructor() {
    this.baseUrl = config.cloackme.baseUrl;
  }

  async getCookie() {
    const configRecord = await prisma.config.findUnique({
      where: { key: 'cloackme_cookie' }
    });
    return configRecord?.value || config.cloackme.cookie;
  }

  async createCampaign({ domain, product }) {
    try {
      const cookie = await this.getCookie();
      
      const payload = {
        name: `${domain} | google | ${product}`,
        pages: {
          white: {
            type: "redirect",
            content: `https://${domain}/wtlander`
          },
          offers: [
            {
              type: "content",
              content: `https://${domain}/FOURLETTERSlander`,
              share: 100
            }
          ]
        },
        mode: "advanced",
        active: true,
        filters: {
          google: true,
          bots: true,
          proxy: true,
          cloakup_ai: true,
          adspy: true,
          geolocation: {
            allow: true,
            countries: ["US"]
          },
          device: {
            allow: true,
            devices: ["desktop", "smartphone", "tablet", "unknown"]
          },
          browser_language: {
            allow: true,
            languages: ["en", "en-us", "en-gb"]
          },
          referer: { block_null: false, allow: true },
          query: { allow: true, params: {}, condition: "some" },
          domain: { allow: true, domains: [] },
          isp: { allow: true, isps: [] },
          os: { allow: true, os: [] },
          user_agent: { allow: true, user_agents: [] },
          browser: { allow: true, browsers: [] },
          whitelist: [],
          blacklist: []
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/campaigns`,
        payload,
        {
          headers: {
            'Cookie': `clkp-token=${cookie}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating campaign in CloackMe:', error.response?.data || error.message);
      return { id: `mock-cloackme-${Date.now()}` };
    }
  }
}

export const cloackmeService = new CloackmeService();