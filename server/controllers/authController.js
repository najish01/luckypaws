const User = require('../model/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Add bcrypt for password hashing

const authController = {
  // Register new user
  async register(req, res) {
    try {
      const { full_Name, email, password } = req.body;

      // Validate input
      if (!full_Name || !email || !password) {
        return res.status(400).json({ 
          message: 'All fields are required' 
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Email already registered' 
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const user = await User.create({
        full_Name,
        email,
        password: hashedPassword // Store hashed password
      });

      // Generate token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          fullName: user.full_Name,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Registration failed', 
        error: error.message 
      });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ 
          message: 'Email and password are required' 
        });
      }

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid credentials' 
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid credentials' 
        });
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Generate token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          fullName: user.full_Name,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Login failed', 
        error: error.message 
      });
    }
  },

  // Get current user
  async getCurrentUser(req, res) {
    try {
      const user = await User.findByPk(req.user.userId, {
        attributes: { exclude: ['password'] } // Never send password
      });
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      res.json({ 
        success: true,
        user 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Error fetching user', 
        error: error.message 
      });
    }
  },

  // Logout user (if you need to handle token invalidation)
  async logout(req, res) {
    try {
      // If you're using token blacklisting or session management,
      // handle that here

      res.json({ 
        success: true,
        message: 'Logged out successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Logout failed', 
        error: error.message 
      });
    }
  }
};

module.exports = authController;
