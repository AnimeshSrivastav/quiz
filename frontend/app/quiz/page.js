'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function QuizPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [winnerBanner, setWinnerBanner] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [recentWinners, setRecentWinners] = useState([]);
  const [questionLoading, setQuestionLoading] = useState(true);
  const [showNewQuestion, setShowNewQuestion] = useState(false);

  const inputRef = useRef(null);
  const eventSourceRef = useRef(null);

  // ── Load username from localStorage ────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('mathquiz_username');
    if (!saved) {
      router.push('/');
      return;
    }
    setUsername(saved);
  }, [router]);

  // ── Fetch the active question ──────────────────────────
  const fetchActiveQuestion = useCallback(async () => {
    try {
      setQuestionLoading(true);
      const res = await fetch(`${API_URL}/api/questions/active`);
      const data = await res.json();
      if (data.success && data.question) {
        setQuestion(data.question);
        setFeedback(null);
        setAnswer('');
      }
    } catch (err) {
      console.error('Failed to fetch question:', err);
    } finally {
      setQuestionLoading(false);
    }
  }, []);

  // ── Setup SSE connection ───────────────────────────────
  useEffect(() => {
    if (!username) return;

    fetchActiveQuestion();

    const eventSource = new EventSource(`${API_URL}/api/events`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', (e) => {
      const data = JSON.parse(e.data);
      setConnected(true);
      setOnlinePlayers(data.onlinePlayers || 1);
    });

    eventSource.addEventListener('winner', (e) => {
      const data = JSON.parse(e.data);
      setWinnerBanner(data);
      setRecentWinners((prev) => [data, ...prev].slice(0, 5));

      // Auto-hide winner banner when new question arrives
      setTimeout(() => {
        setWinnerBanner(null);
      }, 3500);
    });

    eventSource.addEventListener('new_question', (e) => {
      const data = JSON.parse(e.data);
      setShowNewQuestion(true);
      setTimeout(() => {
        setQuestion(data.question);
        setFeedback(null);
        setAnswer('');
        setShowNewQuestion(false);
        if (inputRef.current) inputRef.current.focus();
      }, 300);
    });

    eventSource.addEventListener('player_count', (e) => {
      const data = JSON.parse(e.data);
      setOnlinePlayers(data.count);
    });

    eventSource.addEventListener('heartbeat', (e) => {
      const data = JSON.parse(e.data);
      setConnected(true);
      if (data.onlinePlayers) setOnlinePlayers(data.onlinePlayers);
    });

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [username, fetchActiveQuestion]);

  // ── Submit answer ──────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting || !question) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`${API_URL}/api/questions/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          answer: answer.trim(),
          username,
        }),
      });

      const data = await res.json();

      setFeedback({
        type: data.result,
        message: data.message,
      });

      // Clear answer on wrong attempt so user can try again
      if (data.result === 'incorrect') {
        setAnswer('');
        if (inputRef.current) inputRef.current.focus();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Connection error. Please try again.',
      });
    }

    setIsSubmitting(false);
  };

  // ── Logout ─────────────────────────────────────────────
  const handleLogout = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    localStorage.removeItem('mathquiz_username');
    router.push('/');
  };

  // ── Feedback styling helper ────────────────────────────
  const getFeedbackStyle = (type) => {
    switch (type) {
      case 'won':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400';
      case 'late':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-400';
      case 'incorrect':
        return 'bg-rose-500/15 border-rose-500/40 text-rose-400';
      default:
        return 'bg-gray-500/15 border-gray-500/40 text-gray-400';
    }
  };

  // Don't render until username is loaded
  if (!username) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Header ───────────────────────────────────────── */}
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/quiz" className="flex items-center gap-2.5">
            <span className="text-2xl">⚡</span>
            <span className="text-lg font-bold text-gradient hidden sm:inline">
              Math Quiz Arena
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-2 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-red-400'
                }`}
              />
              <span className="text-gray-400 hidden sm:inline">
                {onlinePlayers} online
              </span>
            </div>

            {/* Leaderboard link */}
            <Link
              href="/leaderboard"
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">Leaderboard</span>
            </Link>

            {/* User info */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-300">
                {username[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-300 font-medium hidden sm:inline">
                {username}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-400 transition-colors ml-1"
                title="Leave arena"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative">
        {/* Winner Banner Overlay */}
        {winnerBanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-card p-10 text-center animate-bounce-in max-w-md mx-4">
              <div className="text-6xl mb-4">
                {winnerBanner.winner === username ? '🏆' : '⚡'}
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {winnerBanner.winner === username ? (
                  <span className="text-gradient">You Won!</span>
                ) : (
                  <span className="text-amber-400">
                    {winnerBanner.winner} wins!
                  </span>
                )}
              </h2>
              <p className="text-gray-400 text-lg">
                <span className="text-gray-300 font-mono">{winnerBanner.questionText}</span>
              </p>
              <p className="text-gray-500 text-sm mt-3">Next question loading...</p>
            </div>
          </div>
        )}

        <div className="w-full max-w-2xl space-y-6">
          {/* ─── Question Card ────────────────────────── */}
          <div className={`glass-card overflow-hidden transition-all duration-300 ${
            showNewQuestion ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}>
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800/60 bg-gray-900/40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium text-emerald-400">
                  LIVE — Question #{question?.id || '...'}
                </span>
              </div>
              <span className="text-xs text-gray-600">
                {question?.created_at
                  ? new Date(question.created_at).toLocaleTimeString()
                  : ''}
              </span>
            </div>

            {/* Question display */}
            <div className="px-6 py-10 text-center">
              {questionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : question ? (
                <div className="animate-fade-in">
                  <p className="text-sm text-gray-500 mb-3 uppercase tracking-wider font-medium">
                    Solve this
                  </p>
                  <h2 className="text-5xl sm:text-6xl font-bold font-mono tracking-wide text-white mb-2">
                    {question.question_text} = <span className="text-violet-400">?</span>
                  </h2>
                </div>
              ) : (
                <p className="text-gray-500 text-lg">No question available</p>
              )}
            </div>

            {/* Answer form */}
            <div className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  ref={inputRef}
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Your answer..."
                  className="input-field text-xl font-mono text-center flex-1"
                  disabled={
                    isSubmitting ||
                    feedback?.type === 'won' ||
                    feedback?.type === 'late'
                  }
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={
                    !answer.trim() ||
                    isSubmitting ||
                    feedback?.type === 'won' ||
                    feedback?.type === 'late'
                  }
                  className="btn-primary text-lg px-8 whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Submit'
                  )}
                </button>
              </form>

              {/* Feedback message */}
              {feedback && (
                <div
                  className={`mt-4 px-4 py-3 rounded-xl border text-center font-medium animate-slide-up ${getFeedbackStyle(
                    feedback.type
                  )}`}
                >
                  {feedback.message}
                </div>
              )}
            </div>
          </div>

          {/* ─── Recent Winners ────────────────────────── */}
          {recentWinners.length > 0 && (
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Recent Activity
              </h3>
              <div className="space-y-2.5">
                {recentWinners.map((w, i) => (
                  <div
                    key={`${w.questionId}-${i}`}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                      i === 0
                        ? 'bg-violet-500/10 border border-violet-500/20'
                        : 'bg-gray-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-sm">
                        🏆
                      </div>
                      <span
                        className={`font-medium ${
                          w.winner === username
                            ? 'text-violet-300'
                            : 'text-gray-300'
                        }`}
                      >
                        {w.winner}
                        {w.winner === username && (
                          <span className="text-xs text-violet-500 ml-1.5">(you)</span>
                        )}
                      </span>
                    </div>
                    <span className="text-gray-600 text-sm font-mono">
                      {w.questionText}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── How It Works (shown when no recent activity) ─ */}
          {recentWinners.length === 0 && (
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                How It Works
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <div className="text-2xl mb-2">🧮</div>
                  <p className="text-sm text-gray-400">
                    Everyone sees the same question
                  </p>
                </div>
                <div className="p-4">
                  <div className="text-2xl mb-2">⚡</div>
                  <p className="text-sm text-gray-400">
                    First correct answer wins
                  </p>
                </div>
                <div className="p-4">
                  <div className="text-2xl mb-2">🏆</div>
                  <p className="text-sm text-gray-400">
                    Climb the leaderboard
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
