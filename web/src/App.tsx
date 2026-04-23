import { useState, useEffect } from 'react';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { useAuth } from './hooks/useAuth';
import { api } from './services/api';

function App() {
  const [hash, setHash] = useState(window.location.hash);
  const { user, login, register, logout, getToken, setUser } = useAuth();

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // 刷新用户信息
  useEffect(() => {
    const token = getToken();
    if (token && user) {
      api.getMe(token)
        .then((freshUser) => setUser(freshUser))
        .catch(() => {});
    }
  }, [hash]);

  const route = hash.replace('#', '') || '/';

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    // 登录后刷新用户信息
    const token = getToken();
    if (token) {
      try {
        const freshUser = await api.getMe(token);
        setUser(freshUser);
      } catch (err) {
        console.error('Failed to refresh user:', err);
      }
    }
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    await register(username, email, password);
    // 注册后刷新用户信息
    const token = getToken();
    if (token) {
      try {
        const freshUser = await api.getMe(token);
        setUser(freshUser);
      } catch (err) {
        console.error('Failed to refresh user:', err);
      }
    }
  };

  switch (route) {
    case '/game':
      return <GamePage />;
    case '/login':
      return (
        <LoginPage
          onLogin={handleLogin}
          onGoToRegister={() => (window.location.hash = '/register')}
          onGoHome={() => (window.location.hash = '/')}
        />
      );
    case '/register':
      return (
        <RegisterPage
          onRegister={handleRegister}
          onGoToLogin={() => (window.location.hash = '/login')}
          onGoHome={() => (window.location.hash = '/')}
        />
      );
    case '/leaderboard':
      return <LeaderboardPage />;
    case '/profile':
      return <ProfilePage />;
    default:
      return (
        <HomePage
          user={user}
          onLogout={logout}
          onGoToGame={() => (window.location.hash = '/game')}
          onGoToLogin={() => (window.location.hash = '/login')}
          onGoToRegister={() => (window.location.hash = '/register')}
          onGoToLeaderboard={() => (window.location.hash = '/leaderboard')}
          onGoToProfile={() => (window.location.hash = '/profile')}
        />
      );
  }
}

export default App;
