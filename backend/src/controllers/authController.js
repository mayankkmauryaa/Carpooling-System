const { authService } = require('../services');
const { ApiResponse } = require('../dto');
const { blacklistToken } = require('../middleware/auth');

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(ApiResponse.created(result, 'User registered successfully'));
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.user.id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    if (req.token) {
      blacklistToken(req.token);
    }
    res.json(ApiResponse.success(null, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json(ApiResponse.success({ user }));
  } catch (error) {
    next(error);
  }
};

exports.verify = async (req, res, next) => {
  try {
    res.json({ status: 'success', data: { valid: true, userId: req.user.id } });
  } catch (error) {
    next(error);
  }
};

exports.googleAuth = async (req, res, next) => {
  try {
    const authUrl = authService.getGoogleAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

exports.googleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    const result = await authService.googleCallback(code);
    const statusCode = result.isNewUser ? 201 : 200;
    res.status(statusCode).json(ApiResponse.success(result, result.isNewUser ? 'Account created with Google' : 'Logged in with Google'));
  } catch (error) {
    next(error);
  }
};

exports.googleMobile = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const result = await authService.googleAuth(idToken);
    const statusCode = result.isNewUser ? 201 : 200;
    res.status(statusCode).json(ApiResponse.success(result, result.isNewUser ? 'Account created with Google' : 'Logged in with Google'));
  } catch (error) {
    next(error);
  }
};

exports.linkGoogleAccount = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const result = await authService.linkGoogleAccount(req.user.id, idToken);
    res.json(ApiResponse.success(result, result.message));
  } catch (error) {
    next(error);
  }
};
