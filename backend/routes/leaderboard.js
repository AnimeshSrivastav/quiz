const express = require('express');
const router = express.Router();
const pool = require('../db/pool');


router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT username, total_wins, created_at
       FROM users
       WHERE total_wins > 0
       ORDER BY total_wins DESC, created_at ASC
       LIMIT 50`
    );

    res.json({ success: true, leaderboard: result.rows });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/stats', async (req, res) => {
  try {
    const [questionsResult, usersResult] = await Promise.all([
      pool.query(`SELECT
        COUNT(*) FILTER (WHERE status = 'solved') AS total_solved,
        COUNT(*) FILTER (WHERE status = 'active') AS total_active
        FROM questions`),
      pool.query(`SELECT COUNT(*) AS total_users FROM users`),
    ]);

    res.json({
      success: true,
      stats: {
        totalSolved: parseInt(questionsResult.rows[0].total_solved),
        totalActive: parseInt(questionsResult.rows[0].total_active),
        totalUsers: parseInt(usersResult.rows[0].total_users),
      },
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
