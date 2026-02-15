'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('mathquiz_username');
    if (saved) setCurrentUser(saved);

    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [lbRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/leaderboard`),
        fetch(`${API_URL}/api/leaderboard/stats`),
      ]);

      const lbData = await lbRes.json();
      const statsData = await statsRes.json();

      if (lbData.success) setLeaderboard(lbData.leaderboard);
      if (statsData.success) setStats(statsData.stats);
    } catch (err) {
      setError('Failed to load leaderboard. Is the server running?');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Header ───────────────────────────────────────── */}
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-2xl">⚡</span>
            <span className="text-lg font-bold text-gradient hidden sm:inline">
              Math Quiz Arena
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {currentUser && (
              <Link href="/quiz" className="btn-primary text-sm flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Back to Quiz
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────── */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/25 mb-4">
            <span className="text-3xl">🏆</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Leaderboard</h1>
          <p className="text-gray-500">Top math champions ranked by wins</p>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8 animate-slide-up">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Total Players</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-violet-400">{stats.totalSolved}</p>
              <p className="text-xs text-gray-500 mt-1">Questions Solved</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{stats.totalActive}</p>
              <p className="text-xs text-gray-500 mt-1">Active Now</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card p-8 text-center">
            <p className="text-rose-400 mb-4">{error}</p>
            <button onClick={fetchData} className="btn-secondary">
              Try Again
            </button>
          </div>
        )}

        {/* Leaderboard table */}
        {!loading && !error && (
          <div className="glass-card overflow-hidden animate-slide-up">
            {leaderboard.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-4">🎯</div>
                <p className="text-gray-400 text-lg mb-2">No winners yet</p>
                <p className="text-gray-600 text-sm">
                  Be the first to solve a question!
                </p>
                {currentUser && (
                  <Link href="/quiz" className="btn-primary mt-6 inline-block">
                    Start Playing
                  </Link>
                )}
              </div>
            ) : (
              <div>
                {/* Table header */}
                <div className="grid grid-cols-12 px-6 py-3 border-b border-gray-800/60 bg-gray-900/40 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-2">Rank</div>
                  <div className="col-span-7">Player</div>
                  <div className="col-span-3 text-right">Wins</div>
                </div>

                {/* Table rows */}
                <div className="divide-y divide-gray-800/40">
                  {leaderboard.map((player, index) => {
                    const isCurrentUser = player.username === currentUser;
                    const rank = index + 1;

                    return (
                      <div
                        key={player.username}
                        className={`grid grid-cols-12 px-6 py-4 items-center transition-colors ${
                          isCurrentUser
                            ? 'bg-violet-500/8 border-l-2 border-l-violet-500'
                            : 'hover:bg-gray-800/20'
                        } ${rank <= 3 ? 'py-5' : ''}`}
                      >
                        {/* Rank */}
                        <div className="col-span-2">
                          {rank <= 3 ? (
                            <span className="text-2xl">{MEDALS[rank - 1]}</span>
                          ) : (
                            <span className="text-gray-600 font-mono text-lg font-bold pl-1">
                              {rank}
                            </span>
                          )}
                        </div>

                        {/* Player name */}
                        <div className="col-span-7 flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                              rank === 1
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : rank === 2
                                ? 'bg-gray-400/15 text-gray-300 border border-gray-500/30'
                                : rank === 3
                                ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                            }`}
                          >
                            {player.username[0].toUpperCase()}
                          </div>
                          <div>
                            <span
                              className={`font-medium ${
                                isCurrentUser ? 'text-violet-300' : 'text-gray-200'
                              } ${rank <= 3 ? 'text-lg' : ''}`}
                            >
                              {player.username}
                            </span>
                            {isCurrentUser && (
                              <span className="text-xs text-violet-500 ml-2">(you)</span>
                            )}
                          </div>
                        </div>

                        {/* Wins */}
                        <div className="col-span-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold ${
                              rank === 1
                                ? 'bg-amber-500/15 text-amber-300'
                                : rank <= 3
                                ? 'bg-gray-700/40 text-gray-200'
                                : 'bg-gray-800/40 text-gray-400'
                            }`}
                          >
                            {player.total_wins}
                            <span className="text-xs font-normal opacity-60">
                              {player.total_wins === 1 ? 'win' : 'wins'}
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Refresh button */}
        {!loading && leaderboard.length > 0 && (
          <div className="text-center mt-6">
            <button
              onClick={fetchData}
              className="btn-secondary text-sm inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        )}
      </main>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-gray-800/40 py-6 text-center text-xs text-gray-700">
        Math Quiz Arena — Real-time competitive math challenge
      </footer>
    </div>
  );
}
