const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

function generateToken(userId, isAdmin = false) {
  return jwt.sign({ id: userId, isAdmin }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await User.create({ name, email, passwordHash: password });
    const token = generateToken(user._id, user.isAdmin);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned. Please contact support.' });
    }

    const token = generateToken(user._id, user.isAdmin);
    res.json({ token, user });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
}

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function promoteAdmin(req, res) {
  const { email, setupCode } = req.body;
  if (!setupCode || setupCode !== process.env.ADMIN_SETUP_CODE) {
    return res.status(403).json({ message: 'Invalid setup code' });
  }
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { isAdmin: true },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const token = generateToken(user._id, true);
    res.json({ token, user, message: `${user.name} is now an admin` });
  } catch (err) {
    console.error('promoteAdmin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, login, getProfile, promoteAdmin };
