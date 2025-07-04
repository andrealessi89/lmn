import redtrackAuthService from '../services/redtrack-auth.service.js';

/**
 * Get current authentication status
 */
export const getAuthStatus = async (req, res, next) => {
  try {
    const status = await redtrackAuthService.checkAuthStatus();
    return res.json(status);
  } catch (error) {
    next(error);
  }
};

/**
 * Update RedTrack authentication credentials
 */
export const updateRedTrackAuth = async (req, res, next) => {
  try {
    const { token, cookies, expiresInHours } = req.body;

    if (!token || !cookies) {
      return res.status(400).json({
        error: 'Token and cookies are required'
      });
    }

    // Handle cookies as array or string
    let cookieString = cookies;
    if (Array.isArray(cookies)) {
      // Convert cookie array to string format
      cookieString = cookies
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join('; ');
    }

    const auth = await redtrackAuthService.saveAuth({
      token,
      cookies: cookieString,
      expiresInHours: expiresInHours || 24
    });

    return res.status(200).json({
      message: 'Authentication updated successfully',
      expiresAt: auth.expiresAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear all authentication records
 */
export const clearRedTrackAuth = async (req, res, next) => {
  try {
    const count = await redtrackAuthService.clearAllAuth();
    
    return res.json({
      message: `Cleared ${count} authentication records`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update RedTrack credentials from Playwright/Puppeteer capture
 */
export const updateRedTrackCredentials = async (req, res, next) => {
  try {
    const { token, cookies } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token is required'
      });
    }

    if (!cookies || (Array.isArray(cookies) && cookies.length === 0)) {
      return res.status(400).json({
        error: 'Cookies are required'
      });
    }

    // Convert cookie array to string format
    const cookieString = cookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');

    // Save credentials
    const auth = await redtrackAuthService.saveAuth({
      token,
      cookies: cookieString,
      expiresInHours: 24 // Default to 24 hours
    });

    // Log cookie names for debugging
    console.log('📥 Received credentials update');
    console.log('🍪 Cookies received:', cookies.map(c => c.name).join(', '));
    console.log('🔑 Token length:', token.length);

    return res.status(200).json({
      success: true,
      message: 'Credentials updated successfully',
      expiresAt: auth.expiresAt,
      cookieCount: cookies.length
    });
  } catch (error) {
    console.error('Error updating credentials:', error);
    next(error);
  }
};

