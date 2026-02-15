-- Math Quiz Database Schema
-- Run this manually or it auto-runs on server start

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  correct_answer DOUBLE PRECISION NOT NULL,
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'solved')),
  winner VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  solved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  total_wins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_wins ON users(total_wins DESC);
