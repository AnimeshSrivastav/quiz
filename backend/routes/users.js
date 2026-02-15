const express = require('express');
const router = express.Router();
const pool = require('../db/pool');


router.post('/register', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    const cleaned = username.trim();

    if (cleaned.length < 2 || cleaned.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 2–20 characters',
      });
    }

    const result = await pool.query(
      `INSERT INTO users (username)
       VALUES ($1)
       ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
       RETURNING id, username, total_wins, created_at`,
      [cleaned]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/check/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await pool.query(
      'SELECT id, username, total_wins FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length > 0) {
      res.json({ exists: true, user: result.rows[0] });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
