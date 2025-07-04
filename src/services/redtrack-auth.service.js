import prisma from '../config/database.js';

class RedTrackAuthService {
  /**
   * Get valid authentication credentials
   * @returns {Promise<Object|null>} Auth credentials or null if expired
   */
  async getValidAuth() {
    try {
      console.log('[RedTrackAuth] Fetching valid authentication...');
      
      const auth = await prisma.redTrackAuth.findFirst({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!auth) {
        console.log('⚠️ [RedTrackAuth] No valid authentication found');
        return null;
      }

      console.log('[RedTrackAuth] Found valid auth:', {
        hasToken: !!auth.token,
        tokenPreview: auth.token ? `${auth.token.substring(0, 20)}...` : 'none',
        hasCookies: !!auth.cookies,
        expiresAt: auth.expiresAt,
        isActive: auth.isActive
      });

      return {
        token: auth.token,
        cookies: auth.cookies,
        expiresAt: auth.expiresAt
      };
    } catch (error) {
      console.error('[RedTrackAuth] Error getting auth:', error);
      return null;
    }
  }

  /**
   * Save new authentication credentials
   * @param {Object} credentials - Token and cookies
   * @param {string} credentials.token - Bearer token
   * @param {string} credentials.cookies - Cookie string
   * @param {number} credentials.expiresInHours - Hours until expiration (default: 24)
   * @returns {Promise<Object>} Created auth record
   */
  async saveAuth({ token, cookies, expiresInHours = 24 }) {
    try {
      // Desativar credenciais anteriores
      await prisma.redTrackAuth.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      // Criar nova autenticação
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      const auth = await prisma.redTrackAuth.create({
        data: {
          token,
          cookies,
          expiresAt,
          isActive: true
        }
      });

      console.log('✅ RedTrack authentication saved successfully');
      return auth;
    } catch (error) {
      console.error('Error saving RedTrack auth:', error);
      throw error;
    }
  }

  /**
   * Check if authentication is expiring soon
   * @param {number} hoursThreshold - Hours before expiration to consider "soon" (default: 2)
   * @returns {Promise<Object>} Status object
   */
  async checkAuthStatus(hoursThreshold = 2) {
    try {
      const auth = await this.getValidAuth();
      
      if (!auth) {
        return {
          valid: false,
          expired: true,
          expiringSoon: false,
          message: 'No valid authentication found'
        };
      }

      const now = new Date();
      const timeDiff = auth.expiresAt - now;
      const hoursRemaining = timeDiff / (1000 * 60 * 60);

      return {
        valid: true,
        expired: false,
        expiringSoon: hoursRemaining <= hoursThreshold,
        hoursRemaining: Math.max(0, hoursRemaining),
        expiresAt: auth.expiresAt,
        message: hoursRemaining <= hoursThreshold 
          ? `Authentication expiring in ${hoursRemaining.toFixed(1)} hours`
          : 'Authentication is valid'
      };
    } catch (error) {
      console.error('Error checking auth status:', error);
      return {
        valid: false,
        expired: true,
        error: error.message
      };
    }
  }

  /**
   * Delete all authentication records
   * @returns {Promise<number>} Number of deleted records
   */
  async clearAllAuth() {
    try {
      const result = await prisma.redTrackAuth.deleteMany({});
      console.log(`🗑️ Deleted ${result.count} authentication records`);
      return result.count;
    } catch (error) {
      console.error('Error clearing auth:', error);
      throw error;
    }
  }
}

export default new RedTrackAuthService();