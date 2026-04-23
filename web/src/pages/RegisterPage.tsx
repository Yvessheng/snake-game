import { useState } from 'react';
import type { FormEvent } from 'react';
import { theme } from '../types/theme';

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

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: theme.bg.elevated,
    border: `1px solid ${theme.border.default}`,
    borderRadius: theme.radius.sm,
    color: theme.text.primary,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: theme.text.primary }}>
      <button onClick={onGoHome} style={{ position: 'absolute', top: 16, left: 16, background: 'transparent', border: `1px solid ${theme.border.default}`, color: theme.text.secondary, padding: '6px 14px', borderRadius: theme.radius.sm, cursor: 'pointer', fontSize: 13 }}>
        ← 首页
      </button>
      <h1 style={{ fontSize: 48, margin: '0 0 6px', fontWeight: 900, letterSpacing: 4, color: theme.accent.green }}>SNAKE</h1>
      <p style={{ color: theme.text.muted, marginBottom: 28, fontSize: 14 }}>注册</p>
      <form onSubmit={handleSubmit} style={{ width: 340, background: theme.bg.surface, padding: 32, borderRadius: theme.radius.lg, border: `1px solid ${theme.border.subtle}`, boxShadow: theme.shadow.modal }}>
        {error && <div style={{ color: theme.accent.pink, fontSize: 13, marginBottom: 16, padding: '8px 12px', background: `${theme.accent.pink}12`, borderRadius: theme.radius.sm }}>{error}</div>}
        <div style={{ marginBottom: 14 }}>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用户名 (3-16字符)" required minLength={3} maxLength={16} pattern="^[a-zA-Z0-9_]+$" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" required style={inputStyle} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码 (至少8字符)" required minLength={8} style={inputStyle} />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px 0', background: theme.accent.blue, border: 'none', borderRadius: theme.radius.sm, color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      <p style={{ marginTop: 20, color: theme.text.muted, fontSize: 14 }}>
        已有账号？{' '}
        <span onClick={onGoToLogin} style={{ color: theme.accent.blue, cursor: 'pointer', fontWeight: 600 }}>登录</span>
      </p>
    </div>
  );
}
