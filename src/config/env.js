import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  redtrackApiKey: process.env.REDTRACK_API_KEY,
  redtrack: {
    apiKey: process.env.REDTRACK_API_KEY,
    baseUrl: 'https://api.redtrack.io/api/v2'
  },
  cloackme: {
    cookie: process.env.CLOACKME_COOKIE,
    baseUrl: 'https://cloak.click/api'
  },
  cloudflare: {
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    baseUrl: 'https://api.cloudflare.com/client/v4'
  }
};