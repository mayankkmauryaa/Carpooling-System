const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { jwt: jwtConfig, google: googleConfig } = require('../config');
const { userRepository } = require('../repositories');
const { AuthException, ConflictException, NotFoundException } = require('../exceptions');
const logger = require('../middleware/logger');

const googleClient = new OAuth2Client(googleConfig.GOOGLE_CLIENT_ID);

class AuthService {
  generateToken(userId) {
    return jwt.sign({ userId }, jwtConfig.JWT_SECRET || jwtConfig.secret, {
      expiresIn: jwtConfig.JWT_EXPIRES_IN || jwtConfig.expiresIn
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, jwtConfig.JWT_SECRET || jwtConfig.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw AuthException.tokenExpired();
      }
      throw AuthException.invalidToken();
    }
  }

  async register(userData) {
    const { email, password, firstName, lastName, phone, role } = userData;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw ConflictException.emailExists();
    }

    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

    const user = await userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || null,
      role: (role || 'rider').toUpperCase()
    });

    const token = this.generateToken(user.id);

    logger.info('User registered', { userId: user.id, email: user.email });

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  async login(email, password) {
    if (!email || !password) {
      throw AuthException.invalidCredentials();
    }

    const user = await userRepository.findByEmailWithPassword(email);
    
    if (!user) {
      logger.warn('Login failed - user not found', { email });
      throw AuthException.invalidCredentials();
    }

    if (!user.password) {
      logger.warn('Login failed - no password', { email });
      throw AuthException.invalidCredentials();
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn('Login failed - invalid password', { email });
      throw AuthException.invalidCredentials();
    }

    if (!user.isActive) {
      throw AuthException.accountDeactivated();
    }

    const token = this.generateToken(user.id);

    logger.info('User logged in', { userId: user.id });

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  async refreshToken(userId) {
    return {
      token: this.generateToken(userId)
    };
  }

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw NotFoundException.user(userId);
    }
    return this.sanitizeUser(user);
  }

  async googleAuth(idToken) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: googleConfig.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      const { email, given_name, family_name, picture, sub: googleId } = payload;

      const result = await this.findOrCreateGoogleUser({
        googleId,
        email,
        firstName: given_name || 'User',
        lastName: family_name || '',
        profilePicture: picture
      });

      const token = this.generateToken(result.user.id);

      logger.info('Google auth successful', { userId: result.user.id, email, isNewUser: result.isNewUser });

      return {
        user: this.sanitizeUser(result.user),
        token,
        isNewUser: result.isNewUser
      };
    } catch (error) {
      logger.error('Google auth failed', { error: error.message });
      throw AuthException.invalidToken();
    }
  }

  async findOrCreateGoogleUser(googleProfile) {
    const { googleId, email, firstName, lastName, profilePicture } = googleProfile;

    let user = await userRepository.findByEmail(email);

    if (user) {
      if (user.googleId && user.googleId !== googleId) {
        throw ConflictException.emailExists();
      }

      if (!user.googleId) {
        await userRepository.updateById(user.id, {
          googleId,
          isGoogleUser: true,
          emailVerified: true,
          ...(profilePicture && !user.profilePicture && { profilePicture })
        });
        user = await userRepository.findById(user.id);
      }

      return { user, isNewUser: false };
    }

    user = await userRepository.create({
      email,
      password: null,
      firstName: firstName || 'User',
      lastName: lastName || '',
      phone: null,
      role: 'RIDER',
      profilePicture: profilePicture || null,
      googleId,
      isGoogleUser: true,
      emailVerified: true
    });

    return { user, isNewUser: true };
  }

  async linkGoogleAccount(userId, idToken) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: googleConfig.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      const { sub: googleId, email } = payload;

      const existingGoogleUser = await userRepository.findByGoogleId(googleId);
      if (existingGoogleUser && existingGoogleUser.id !== userId) {
        throw ConflictException('Google account already linked to another user');
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        throw NotFoundException.user(userId);
      }

      if (user.googleId === googleId) {
        return { user: this.sanitizeUser(user), message: 'Google account already linked' };
      }

      await userRepository.updateById(userId, {
        googleId,
        isGoogleUser: true,
        emailVerified: true
      });

      user = await userRepository.findById(userId);

      logger.info('Google account linked', { userId, googleId });

      return {
        user: this.sanitizeUser(user),
        message: 'Google account linked successfully'
      };
    } catch (error) {
      if (error.status) throw error;
      logger.error('Google account linking failed', { error: error.message });
      throw AuthException.invalidToken();
    }
  }

  getGoogleAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: googleConfig.GOOGLE_CLIENT_ID,
      redirect_uri: googleConfig.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async googleCallback(code) {
    try {
      const { client_id, client_secret, redirect_uri } = googleConfig;

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id,
          client_secret,
          redirect_uri,
          grant_type: 'authorization_code'
        })
      });

      const tokens = await response.json();

      if (tokens.error) {
        throw new Error(tokens.error_description || 'Failed to exchange code for tokens');
      }

      return await this.googleAuth(tokens.id_token);
    } catch (error) {
      logger.error('Google callback failed', { error: error.message });
      throw AuthException.invalidToken();
    }
  }

  sanitizeUser(user) {
    if (!user) return null;
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new AuthService();
