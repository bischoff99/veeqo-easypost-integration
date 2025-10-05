import { Request, Response, NextFunction } from 'express';

/**
 * Authentication Middleware
 * 
 * GOOGLE OAUTH INTEGRATION - CURRENTLY DISABLED
 * To enable Google OAuth authentication:
 * 1. Set ENABLE_GOOGLE_AUTH=true in your .env file
 * 2. Configure Google OAuth credentials:
 *    - GOOGLE_CLIENT_ID: Your Google OAuth client ID
 *    - GOOGLE_CLIENT_SECRET: Your Google OAuth client secret
 *    - GOOGLE_REDIRECT_URI: OAuth callback URL (e.g., https://your-domain.com/auth/google/callback)
 * 3. Install required dependencies: npm install passport passport-google-oauth20 express-session
 * 4. Implement the OAuth flow (see implementation guide below)
 * 
 * When disabled (default), all routes are publicly accessible.
 */

const ENABLE_GOOGLE_AUTH = process.env.ENABLE_GOOGLE_AUTH === 'true';

/**
 * Authentication middleware
 * - If ENABLE_GOOGLE_AUTH is false: passes all requests through
 * - If ENABLE_GOOGLE_AUTH is true: checks for valid session/token
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // If authentication is disabled, allow all requests
  if (!ENABLE_GOOGLE_AUTH) {
    return next();
  }

  // TODO: When enabling Google OAuth, implement authentication check here
  // Example implementation:
  // if (req.isAuthenticated && req.isAuthenticated()) {
  //   return next();
  // }
  // 
  // res.status(401).json({ 
  //   success: false, 
  //   error: 'Authentication required',
  //   message: 'Please log in with Google to access this resource'
  // });

  // For now, if auth is enabled but not implemented, return 501
  res.status(501).json({
    success: false,
    error: 'Authentication not implemented',
    message: 'Google OAuth is enabled but not yet configured. Please see middleware/auth.ts for setup instructions.'
  });
};

/**
 * Optional middleware for routes that work both with and without auth
 * Attaches user info if authenticated, but doesn't block unauthenticated requests
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!ENABLE_GOOGLE_AUTH) {
    return next();
  }

  // TODO: When enabling Google OAuth, attach user info if authenticated
  // if (req.isAuthenticated && req.isAuthenticated()) {
  //   req.user = req.session.user; // or however you store user info
  // }
  
  next();
};

/* 
 * IMPLEMENTATION GUIDE FOR GOOGLE OAUTH:
 * 
 * 1. Install dependencies:
 *    npm install passport passport-google-oauth20 express-session @types/passport @types/express-session
 * 
 * 2. Add to your main index.ts:
 *    import passport from 'passport';
 *    import session from 'express-session';
 *    import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
 *    
 *    app.use(session({
 *      secret: process.env.SESSION_SECRET!,
 *      resave: false,
 *      saveUninitialized: false
 *    }));
 *    
 *    app.use(passport.initialize());
 *    app.use(passport.session());
 *    
 *    passport.use(new GoogleStrategy({
 *      clientID: process.env.GOOGLE_CLIENT_ID!,
 *      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
 *      callbackURL: process.env.GOOGLE_REDIRECT_URI!
 *    }, (accessToken, refreshToken, profile, done) => {
 *      // Store user info in session or database
 *      return done(null, profile);
 *    }));
 *    
 *    passport.serializeUser((user, done) => done(null, user));
 *    passport.deserializeUser((user, done) => done(null, user as any));
 * 
 * 3. Add OAuth routes:
 *    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
 *    app.get('/auth/google/callback', 
 *      passport.authenticate('google', { failureRedirect: '/login' }),
 *      (req, res) => res.redirect('/')
 *    );
 *    app.get('/auth/logout', (req, res) => {
 *      req.logout(() => res.redirect('/'));
 *    });
 * 
 * 4. Update this middleware to use passport's req.isAuthenticated()
 */
