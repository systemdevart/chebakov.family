import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import './AdminLogin.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = login(username, password);

    if (success) {
      navigate('/admin/dashboard');
    } else {
      setError('Неверное имя пользователя или пароль');
    }

    setIsLoading(false);
  };

  return (
    <div className="admin-login">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <Lock size={28} />
          </div>
          <h1>Панель администратора</h1>
          <p>Семейное древо Чебаковых</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <div className="input-wrapper">
              <User size={18} />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите имя"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <div className="input-wrapper">
              <Lock size={18} />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
