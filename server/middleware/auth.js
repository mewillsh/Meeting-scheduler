const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access Denied' });

  try {
    // Handle both "Bearer token" and direct token formats
    const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const verified = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid Token' });
  }
};
