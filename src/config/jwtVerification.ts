import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Clerk JWT verification configuration
export const clerkJwtConfig = {
  // Your Clerk domain
  clerkDomain: 'https://assuring-bear-40.clerk.accounts.dev',
  
  // JWKS endpoint
  jwksUri: 'https://assuring-bear-40.clerk.accounts.dev/.well-known/jwks.json',
  
  // Public key for verification (fallback)
  publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1E/7D+tGo9RY1bojAFEn
saRI4rlJ6WlThHSonkjl0NFp27l9pywIPA6CODe7EkNcNHVPhQOsu6Q3fbEOhfJ9
efvKQcF35phyht1FwQ+IrgvMB+clOY8Q98nA5nsnG1VJdinrOnD1e0wp5MPi3/dc
FTkAsxx/30b2fZR5wxm/DuwpT9eOoxswtpjQsZSMoyBOgltnxD5PPYPxfWd0cgrK
sW1KLQ98JTVD/imF+xdxFEpN+4H+UgJshAnzMeDIH0rG4m611jGrZ/N+4PQVDlr5
bYRev+WmSASqIm2k3zF6Shua3FvGxo4ieGXZK7ygeqFzES7qnHpsDFVnUWw8rFgM
hwIDAQAB
-----END PUBLIC KEY-----`,
};

// Create JWKS client
const client = jwksClient({
  jwksUri: clerkJwtConfig.jwksUri,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: ms('10h'),
});

function ms(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 0;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

// Get signing key from JWKS
export function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(key.getPublicKey());
    });
  });
}

// Verify Clerk JWT token
export async function verifyClerkToken(token: string): Promise<any> {
  try {
    // Decode token without verification to get header
    const decodedToken = jwt.decode(token, { complete: true }) as any;
    
    if (!decodedToken || !decodedToken.header) {
      throw new Error('Invalid token format');
    }

    const kid = decodedToken.header.kid;
    
    // Get signing key
    const signingKey = await getSigningKey(kid);
    
    // Verify token
    const verifiedToken = jwt.verify(token, signingKey, {
      algorithms: ['RS256'],
      issuer: clerkJwtConfig.clerkDomain,
      audience: 'api-*', // Clerk's default audience
    });

    return verifiedToken;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

// Middleware to verify Clerk JWT
export function verifyClerkJWT(req: any, res: any, next: any) {
  const token = extractTokenFromRequest(req);
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
    });
  }

  verifyClerkToken(token)
    .then((decoded) => {
      req.auth = decoded;
      next();
    })
    .catch((error) => {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    });
}

// Extract token from various sources
function extractTokenFromRequest(req: any): string | null {
  // Try Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookies
  if (req.cookies && req.cookies.__session) {
    return req.cookies.__session;
  }

  // Try query parameters (not recommended for production)
  if (req.query.token) {
    return req.query.token as string;
  }

  return null;
}

// Verify session token specifically for Clerk
export async function verifyClerkSessionToken(token: string): Promise<{
  userId: string;
  sessionId: string;
  exp: number;
  iat: number;
  azp: string;
  iss: string;
  sub: string;
}> {
  const payload = await verifyClerkToken(token);
  
  // Validate required fields
  if (!payload.sub || !payload.azp || !payload.exp) {
    throw new Error('Invalid session token structure');
  }

  return {
    userId: payload.sub,
    sessionId: payload.sid || payload.session_id,
    exp: payload.exp,
    iat: payload.iat,
    azp: payload.azp,
    iss: payload.iss,
    sub: payload.sub,
  };
}
