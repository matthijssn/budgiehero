const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Openbare routes
router.post('/register', register);
router.post('/login', login);

// Beveiligde route (voorbeeld)
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    message: 'Profile data',
    userId: req.user.id
  });
});

module.exports = router;