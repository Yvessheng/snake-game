import { useState, useEffect } from 'react';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { useAuth } from './hooks/useAuth';

function App() {
  const [hash, setHash] = useState(window.location.hash);
  const { user, login, register, logout } = useAuth();

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const route = hash.replace('#', '') || '/';

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    await register(username, email, password);
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
