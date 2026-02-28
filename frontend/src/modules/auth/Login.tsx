import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, Shield, AlertCircle, UserPlus, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
        // Registration successful — switch to Sign In tab
        setSuccessMsg('Account created! Please sign in with your credentials.');
        setError('');
        setIsLogin(true);
        setUsername('');
        setEmail('');
        setPassword('');
        setShowPassword(false);
      }
    } catch (err: any) {
      setError(err.message || (isLogin ? 'Login failed' : 'Registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-form-side">
          <div className="form-card">
            <div className="form-header">
              <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
              <p>{isLogin ? 'Enter your credentials to access your dashboard' : 'Join our enterprise workforce management system'}</p>
            </div>

            <div className="auth-toggle">
              <button
                className={`toggle-btn ${isLogin ? 'active' : ''}`}
                onClick={() => { setIsLogin(true); setError(''); }}
              >
                Sign In
              </button>
              <button
                className={`toggle-btn ${!isLogin ? 'active' : ''}`}
                onClick={() => { setIsLogin(false); setError(''); }}
              >
                Sign Up
              </button>
              <div className={`active-bg ${isLogin ? 'left' : 'right'}`} />
            </div>

            {successMsg && (
              <div className="success-alert">
                <span>✓</span>
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="error-alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="input-group">
                  <User className="input-icon" size={20} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="input-group">
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" className="auth-btn" disabled={isLoading}>
                {isLoading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  </>
                )}
              </button>

              {isLogin && (
                <div className="login-hint">
                  <p>Trial Account: <strong>admin@ems.pro</strong> / <strong>admin123</strong></p>
                </div>
              )}
            </form>

            <div className="form-footer">
              <p>© 2026 Employee Management System. Secure Enterprise Portal</p>
            </div>
          </div>
        </div>

        <div className="auth-visual-side">
          <div className="visual-content">
            <div className="visual-logo">
              <Shield size={40} />
            </div>
            <h1>Employee Management System</h1>
            <p>Enterprise Workforce Management System</p>
            <div className="visual-features">
              <div className="feature-item">
                <div className="feature-dot" />
                <span>Real-time Analytics</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot" />
                <span>Employee Attendance</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot" />
                <span>Role-Based Access</span>
              </div>
            </div>
          </div>
          <div className="visual-overlay" />
        </div>
      </div>

      <style>{`
                .auth-page {
                    height: 100vh;
                    width: 100vw;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                    overflow: hidden;
                    font-family: 'Inter', system-ui, sans-serif;
                }

                .auth-container {
                    display: flex;
                    width: 100vw;
                    height: 100vh;
                    background: #fff;
                    overflow: hidden;
                    position: relative;
                }

                /* Visual Side */
                .auth-visual-side {
                    flex: 1.4;
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 80px;
                    color: #fff;
                    overflow: hidden;
                }

                .visual-overlay {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: url('https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80');
                    background-size: cover;
                    opacity: 0.1;
                    mix-blend-mode: overlay;
                }

                .visual-content {
                    position: relative;
                    z-index: 2;
                    max-width: 320px;
                }

                .visual-logo {
                    width: 64px;
                    height: 64px;
                    background: rgba(0,0,0,0.04);
                    color: var(--primary);
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 32px;
                    border: 1px solid rgba(0,0,0,0.06);
                }

                .visual-content h1 {
                    font-size: 1.75rem;
                    font-weight: 900;
                    letter-spacing: -0.5px;
                    line-height: 1.3;
                    margin-bottom: 12px;
                }

                .visual-content p {
                    color: #94a3b8;
                    font-size: 1.1rem;
                    margin-bottom: 40px;
                    line-height: 1.5;
                }

                .visual-features {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .feature-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 18px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    backdrop-filter: blur(4px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .feature-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--primary);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--primary);
                }

                .feature-item span {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #e2e8f0;
                }

                /* Form Side */
                .auth-form-side {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                    background: #fff;
                }

                .form-card {
                    width: 100%;
                    max-width: 440px;
                }

                .form-header {
                    margin-bottom: 32px;
                }

                .form-header h2 {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 8px;
                    letter-spacing: -0.5px;
                }

                .form-header p {
                    color: #64748b;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .auth-toggle {
                    display: flex;
                    background: #f1f5f9;
                    padding: 4px;
                    border-radius: 12px;
                    margin-bottom: 32px;
                    position: relative;
                }

                .toggle-btn {
                    flex: 1;
                    background: transparent;
                    border: none;
                    padding: 10px;
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #64748b;
                    cursor: pointer;
                    z-index: 2;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .toggle-btn.active {
                    color: #0f172a;
                }

                .active-bg {
                    position: absolute;
                    top: 4px;
                    bottom: 4px;
                    width: calc(50% - 4px);
                    background: #fff;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 1;
                }

                .active-bg.left { left: 4px; }
                .active-bg.right { left: calc(50%); }

                .error-alert {
                    background: #fff5f5;
                    border: 1px solid #fee2e2;
                    color: #e53e3e;
                    padding: 12px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .success-alert {
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    color: #16a34a;
                    padding: 12px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                .input-group {
                    position: relative;
                }

                .eye-toggle {
                    position: absolute;
                    right: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4px;
                    border-radius: 6px;
                    transition: color 0.2s;
                    z-index: 2;
                }

                .eye-toggle:hover {
                    color: var(--primary);
                }

                .input-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                    transition: all 0.2s;
                }

                .input-group input {
                    width: 100%;
                    padding: 14px 14px 14px 44px;
                    background: #f8fafc;
                    border: 1.5px solid #edf2f7;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    outline: none;
                    transition: all 0.2s;
                    color: #0f172a;
                }

                .input-group input:focus {
                    background: #fff;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px rgba(0,0,0,0.06);
                }

                .input-group input:focus + .input-icon {
                    color: var(--primary);
                }

                .auth-btn {
                    background: var(--primary);
                    color: #000;
                    border: none;
                    padding: 14px;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    transition: all 0.2s;
                    margin-top: 10px;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.12);
                }

                .auth-btn:hover:not(:disabled) {
                    background: var(--primary);
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.18);
                }

                .auth-btn:active {
                    transform: translateY(0);
                }

                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(0,0,0,0.1);
                    border-top-color: #000;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                .login-hint {
                    text-align: center;
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin-top: 4px;
                }

                .form-footer {
                    margin-top: 40px;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 0.8rem;
                }

                @media (max-width: 1024px) {
                    .auth-container { width: 95vw; height: auto; min-height: 600px; }
                    .auth-visual-side { display: none; }
                    .auth-form-side { padding: 60px; }
                }
            `}</style>
    </div>
  );
};

export default Login;
