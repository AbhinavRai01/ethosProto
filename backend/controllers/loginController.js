const User = require('../models/user');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

const login = async (req, res) => {
  const { username, password } = req.body;

  // Check for missing credentials
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare plaintext password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send response
    res.json({
      token,
      user: { username: user.username },
    });
  } catch (err) {
    console.error('❌ Error during login:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { login };
