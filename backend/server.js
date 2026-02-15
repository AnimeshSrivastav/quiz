require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');
const sseManager = require('./services/sseManager');
const { generateQuestion } = require('./services/questionGenerator');

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors({ origin: '*' }));
app.use(express.json());


app.use((req, res, next) => {
  if (req.path !== '/api/events' && req.path !== '/api/health') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});


app.use('/api/users', require('./routes/users'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/leaderboard', require('./routes/leaderboard'));




app.get('/api/events', (req, res) => {

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no', 
  });


  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  sseManager.addClient(clientId, res);


  res.write(
    `event: connected\ndata: ${JSON.stringify({
      clientId,
      onlinePlayers: sseManager.getClientCount(),
    })}\n\n`
  );


  sseManager.broadcast('player_count', {
    count: sseManager.getClientCount(),
  });


  const heartbeat = setInterval(() => {
    res.write(
      `event: heartbeat\ndata: ${JSON.stringify({
        time: Date.now(),
        onlinePlayers: sseManager.getClientCount(),
      })}\n\n`
    );
  }, 25000);


  req.on('close', () => {
    clearInterval(heartbeat);

    setTimeout(() => {
      sseManager.broadcast('player_count', {
        count: sseManager.getClientCount(),
      });
    }, 100);
  });
});


app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    onlinePlayers: sseManager.getClientCount(),
  });
});


async function initializeDatabase() {
  console.log('Initializing database...');

  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      question_text TEXT NOT NULL,
      correct_answer DOUBLE PRECISION NOT NULL,
      status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'solved')),
      winner VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      solved_at TIMESTAMP WITH TIME ZONE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      total_wins INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Create indexes (IF NOT EXISTS prevents errors on re-run)
  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status)'
  );
  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at DESC)'
  );
  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_users_wins ON users(total_wins DESC)'
  );

  console.log('Database tables ready.');

  // Ensure at least one active question exists
  const active = await pool.query(
    "SELECT id FROM questions WHERE status = 'active' LIMIT 1"
  );

  if (active.rows.length === 0) {
    const { question_text, correct_answer } = generateQuestion();
    const result = await pool.query(
      "INSERT INTO questions (question_text, correct_answer, status) VALUES ($1, $2, 'active') RETURNING id, question_text",
      [question_text, correct_answer]
    );
    console.log(
      `Created initial question #${result.rows[0].id}: ${result.rows[0].question_text}`
    );
  } else {
    console.log(`Active question found: #${active.rows[0].id}`);
  }
}
async function start() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
     
      console.log(`  Math Quiz API running on port ${PORT}`);
    
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
