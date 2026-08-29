const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

class AuthService {
  generateToken(user) {
    const userId = user.id || user._id;
    return jwt.sign(
      {
        id: userId,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  async registerUser({ name, email, password, role = 'operator' }) {
    const existing = await User.findOne({ email });
    if (existing) {
      const err = new Error('A user with this email address already exists');
      err.statusCode = 409;
      err.code = 'EMAIL_ALREADY_EXISTS';
      throw err;
    }

    const user = await User.create({ name, email, password, role });
    const token = this.generateToken(user);
    return {
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async loginUser({ email, password }) {
    const userWithPassword = await User.findOne({ email }, true);
    if (!userWithPassword) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isMatch = await User.comparePassword(password, userWithPassword.password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const userId = userWithPassword.id || userWithPassword._id;
    await User.updateLastLogin(userId);

    const token = this.generateToken(userWithPassword);
    return {
      user: {
        id: userId,
        name: userWithPassword.name,
        email: userWithPassword.email,
        role: userWithPassword.role,
        lastLogin: new Date(),
      },
      token,
    };
  }

  async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }
    return {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }
}

module.exports = new AuthService();
