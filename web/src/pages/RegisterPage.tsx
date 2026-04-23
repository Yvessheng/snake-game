import { useState } from 'react';
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

  const handleRegister = async () => {
    setError('');
    if (password.length < 8) {
      setError('密码至少需要8个字符');
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
    <div style={{ minHeight: '100vh', background: theme.bg.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: theme.text.primary }}>
      <button onClick={onGoHome} style={{ position: 'absolute', top: 4, left: 4, background: '#C0C0C0', border: '2px outset #FFFFFF', color: '#000', padding: '3px 10px', cursor: 'pointer', fontSize: 12 }}>
        ← 首页
      </button>

      {/* Win98 Dialog */}
      <div style={{ width: 300, background: theme.bg.surface, border: theme.bevel.raised }}>
        {/* Title bar */}
        <div style={{ background: theme.titleBar.active, color: theme.text.inverse, padding: '2px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, userSelect: 'none' }}>
          <span style={{ padding: '0 2px' }}>注册</span>
        </div>
        {/* Content */}
        <div style={{ padding: 16 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <h1 style={{ fontSize: 20, margin: '0 0 4px', fontWeight: 700, color: theme.accent.blue }}>SNAKE</h1>
          </div>

          {error && <div style={{ color: theme.accent.pink, fontSize: 12, marginBottom: 12, padding: '4px 6px', background: '#FFFFFF', border: theme.bevel.sunken }}>{error}</div>}

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: theme.text.primary, display: 'block', marginBottom: 2 }}>用户名</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" required style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: theme.text.primary, display: 'block', marginBottom: 2 }}>邮箱</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" required style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: theme.text.primary, display: 'block', marginBottom: 2 }}>密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少8个字符" required style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>

          <button
            type="button"
            onClick={handleRegister}
            disabled={loading}
            style={{ width: '100%', padding: '6px 0', background: '#C0C0C0', border: '2px outset #FFFFFF', color: '#000', fontWeight: 700, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer', outline: 'none' }}
            onMouseDown={(e) => { if (!loading) (e.target as HTMLButtonElement).style.borderStyle = 'inset'; }}
            onMouseUp={(e) => { (e.target as HTMLButtonElement).style.borderStyle = 'outset'; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.borderStyle = 'outset'; }}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: 16, color: theme.text.secondary, fontSize: 12 }}>
        已有账号？{' '}
        <span onClick={onGoToLogin} style={{ color: '#0000FF', cursor: 'pointer', textDecoration: 'underline', fontWeight: 700 }}>登录</span>
      </p>
    </div>
  );
}
