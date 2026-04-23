import type { User, AuthResponse, LeaderboardResponse, MyRankResponse, ScoreSubmission, ScoreResult } from '../types';

export interface AchievementInfo {
  key: string;
  name: string;
  description: string;
  unlockedAt: string | null;
}

const BASE_URL = '/api';

function getAuthHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export const api = {
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Registration failed');
    }
    return res.json();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }
    return res.json();
  },

  async getMe(token: string): Promise<User> {
    const res = await fetch(`${BASE_URL}/users/me`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to fetch user');
    }
    return res.json();
  },

  async submitScore(token: string, input: ScoreSubmission): Promise<ScoreResult> {
    const res = await fetch(`${BASE_URL}/scores`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to submit score');
    }
    return res.json();
  },

  async getLeaderboard(limit = 20, offset = 0): Promise<LeaderboardResponse> {
    const res = await fetch(`${BASE_URL}/leaderboard?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  },

  async getMyRank(token: string): Promise<MyRankResponse> {
    const res = await fetch(`${BASE_URL}/leaderboard/me`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to fetch rank');
    }
    return res.json();
  },

  async getAchievements(token: string): Promise<{ achievements: AchievementInfo[] }> {
    const res = await fetch(`${BASE_URL}/achievements`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to fetch achievements');
    }
    return res.json();
  },
};
