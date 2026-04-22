import { useState } from 'react';
import type { FormEvent } from 'react';

const BG = '#0D1117';
const CARD_BG = '#161B22';
const BORDER = '#30363D';
const TEXT = '#F0F6FC';
const TEXT_SECONDARY = '#8B949E';
const NEON_BLUE = '#00D4FF';
const NEON_GREEN = '#00FF88';
const ERROR_COLOR = '#FF3366';

interface RegisterPageProps {
  onRegister: (username: string, email: string, password: string) => Promise<void>;
  onGoToLogin: () => void;
  onGoHome: () => void;
}

export function RegisterPage({ onRegister, onGoToLogin, onGoHome }: RegisterPageProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('密码至少8个字符');
      return;
    }
    setLoading(true);
    try {
      await onRegister(username, email, password);
      window.location.hash = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: TEXT }}>
      <button onClick={onGoHome} style={{ position: 'absolute', top: 16, left: 16, background: 'none', border: `1px solid ${BORDER}`, color: TEXT_SECONDARY, padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>
        ← 返回首页
      </button>
      <h1 style={{ fontSize: 48, margin: '0 0 8px', color: NEON_GREEN }}>SNAKE</h1>
      <p style={{ color: TEXT_SECONDARY, marginBottom: 32 }}>注册</p>
      <form onSubmit={handleSubmit} style={{ width: 320, background: CARD_BG, padding: 32, borderRadius: 12, border: `1px solid ${BORDER}` }}>
        {error && <div style={{ color: ERROR_COLOR, fontSize: 14, marginBottom: 16 }}>{error}</div>}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="用户名 (3-16字符)"
            required
            minLength={3}
            maxLength={16}
            pattern="^[a-zA-Z0-9_]+$"
            style={{ width: '100%', padding: '10px 12px', background: '#21262D', border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT, fontSize: 14 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            required
            style={{ width: '100%', padding: '10px 12px', background: '#21262D', border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT, fontSize: 14 }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码 (至少8字符)"
            required
            minLength={8}
            style={{ width: '100%', padding: '10px 12px', background: '#21262D', border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT, fontSize: 14 }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px 0', background: NEON_BLUE, border: 'none', borderRadius: 4, color: BG, fontWeight: 'bold', fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      <p style={{ marginTop: 24, color: TEXT_SECONDARY }}>
        已有账号？{' '}
        <span onClick={onGoToLogin} style={{ color: NEON_BLUE, cursor: 'pointer' }}>登录</span>
      </p>
    </div>
  );
}
