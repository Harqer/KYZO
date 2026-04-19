import express from 'express';
import { verifyClerkSessionToken } from '../config/jwtVerification';
import { ApiResponse } from '../types';

const router = express.Router();

// Test JWT verification endpoint
router.post('/verify', async (req: express.Request, res: express.Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      } as ApiResponse);
    }

    // Verify the token
    const verifiedToken = await verifyClerkSessionToken(token);
    
    return res.json({
      success: true,
      data: {
        verified: true,
        tokenData: verifiedToken,
        // Show token expiration info
        expiresAt: new Date(verifiedToken.exp * 1000).toISOString(),
        issuedAt: new Date(verifiedToken.iat * 1000).toISOString(),
        isExpired: verifiedToken.exp * 1000 < Date.now(),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Token verification failed',
    } as ApiResponse);
  }
});

// Get public key for frontend verification
router.get('/public-key', (req: express.Request, res: express.Response) => {
  return res.json({
    success: true,
    data: {
      publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1E/7D+tGo9RY1bojAFEn
saRI4rlJ6WlThHSonkjl0NFp27l9pywIPA6CODe7EkNcNHVPhQOsu6Q3fbEOhfJ9
efvKQcF35phyht1FwQ+IrgvMB+clOY8Q98nA5nsnG1VJdinrOnD1e0wp5MPi3/dc
FTkAsxx/30b2fZR5wxm/DuwpT9eOoxswtpjQsZSMoyBOgltnxD5PPYPxfWd0cgrK
sW1KLQ98JTVD/imF+xdxFEpN+4H+UgJshAnzMeDIH0rG4m611jGrZ/N+4PQVDlr5
bYRev+WmSASqIm2k3zF6Shua3FvGxo4ieGXZK7ygeqFzES7qnHpsDFVnUWw8rFgM
hwIDAQAB
-----END PUBLIC KEY-----`,
      issuer: 'https://assuring-bear-40.clerk.accounts.dev',
      algorithm: 'RS256',
    },
  } as ApiResponse);
});

// Test endpoint to decode token without verification (for debugging)
router.post('/decode', (req: express.Request, res: express.Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      } as ApiResponse);
    }

    // Decode token without verification
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(token, { complete: true });
    
    return res.json({
      success: true,
      data: {
        decoded,
        header: decoded?.header,
        payload: decoded?.payload,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Token decode error:', error);
    return res.status(400).json({
      success: false,
      error: 'Failed to decode token',
    } as ApiResponse);
  }
});

export default router;
