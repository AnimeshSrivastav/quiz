const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { generateQuestion } = require('../services/questionGenerator');
const sseManager = require('../services/sseManager');


router.get('/active', async (req, res) => {
  try {
    let result = await pool.query(
      `SELECT id, question_text, status, winner, created_at, solved_at
       FROM questions
       WHERE status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`
    );

    // Auto-create a question if none is active
    if (result.rows.length === 0) {
      const { question_text, correct_answer } = generateQuestion();
      result = await pool.query(
        `INSERT INTO questions (question_text, correct_answer, status)
         VALUES ($1, $2, 'active')
         RETURNING id, question_text, status, winner, created_at`,
        [question_text, correct_answer]
      );
      console.log('Auto-created new question:', result.rows[0].id);
    }

    res.json({ success: true, question: result.rows[0] });
  } catch (error) {
    console.error('Error getting active question:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/questions/answer
 * Submit an answer for the active question
 *
 * CONCURRENCY: Uses atomic UPDATE with WHERE conditions to guarantee
 * only one winner per question, even under simultaneous submissions.
 */
router.post('/answer', async (req, res) => {
  try {
    const { questionId, answer, username } = req.body;

    if (!questionId || answer === undefined || answer === '' || !username) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: questionId, answer, username',
      });
    }

    const numericAnswer = parseFloat(answer);
    if (isNaN(numericAnswer)) {
      return res.status(400).json({
        success: false,
        result: 'invalid',
        message: 'Answer must be a valid number',
      });
    }

    const updateResult = await pool.query(
      `UPDATE questions
       SET status = 'solved', winner = $1, solved_at = NOW()
       WHERE id = $2 AND status = 'active' AND correct_answer = $3
       RETURNING id, question_text, correct_answer, winner, created_at, solved_at`,
      [username, questionId, numericAnswer]
    );

    if (updateResult.rowCount > 0) {
 
      const solvedQuestion = updateResult.rows[0];

      await pool.query(
        `UPDATE users SET total_wins = total_wins + 1 WHERE username = $1`,
        [username]
      );

    
      const { question_text, correct_answer } = generateQuestion();
      const newQuestion = await pool.query(
        `INSERT INTO questions (question_text, correct_answer, status)
         VALUES ($1, $2, 'active')
         RETURNING id, question_text, status, winner, created_at`,
        [question_text, correct_answer]
      );

    
      sseManager.broadcast('winner', {
        questionId: solvedQuestion.id,
        questionText: solvedQuestion.question_text,
        winner: username,
        solvedAt: solvedQuestion.solved_at,
      });

   
      setTimeout(() => {
        sseManager.broadcast('new_question', {
          question: newQuestion.rows[0],
        });
      }, 3500);

      return res.json({
        success: true,
        result: 'won',
        message: 'You Won! 🎉',
      });
    }

  
    const question = await pool.query(
      'SELECT id, status, correct_answer, winner FROM questions WHERE id = $1',
      [questionId]
    );

    if (!question.rows[0]) {
      return res.status(404).json({
        success: false,
        result: 'error',
        message: 'Question not found',
      });
    }

    const q = question.rows[0];

    if (q.status === 'solved') {
      if (parseFloat(q.correct_answer) === numericAnswer) {
        return res.json({
          success: true,
          result: 'late',
          message: `Correct, but too late! ${q.winner} got it first.`,
        });
      }
      return res.json({
        success: true,
        result: 'incorrect',
        message: 'Incorrect — and the question has already been solved.',
      });
    }

    return res.json({
      success: true,
      result: 'incorrect',
      message: 'Incorrect. Try again!',
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;
