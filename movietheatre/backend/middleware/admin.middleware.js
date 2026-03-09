const User = require('../models/User');

async function verifyAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { verifyAdmin };
