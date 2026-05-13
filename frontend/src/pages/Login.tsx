import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Tüm alanları doldurmanız gerekmektedir.');
      return;
    }
    setLoading(true);
    try {
      await loginUser(email, password);
      window.location.href = '/feed'
    } catch (err: any) {
      setError('E-posta veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fullscreen-landing">
      <div className="glass-card animate-fade-up">
        <Link to="/" style={{ position: 'absolute', top: '18px', right: '20px', color: 'var(--text-muted)', fontSize: '1.4rem', textDecoration: 'none', zIndex: 3 }}>&times;</Link>

        <h1 className="logo-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>ANIMEFOX</h1>
        <p className="japanese-sub" style={{ marginBottom: '1rem' }}>アニメフォックス</p>

        <div className="japanese-quote">
          <span className="jp-text">運命は自ら切り開け</span>
          <span className="jp-romanji">unmei wa mizukara kiri hirake</span>
        </div>

        <h2 className="title-gradient" style={{ fontSize: '1.3rem' }}>Tekrar Hoş Geldin!</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 8l9 6 9-6" />
            </svg>
            <input type="email" className={`form-input ${error ? 'error animate-shake' : ''}`}
              placeholder="E-posta"
              value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} autoComplete="email" />
          </div>

          <div className="form-group">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5" y="11" width="14" height="10" rx="2" /><circle cx="12" cy="16" r="1" /><path d="M9 11V7a3 3 0 016 0v4" />
            </svg>
            <input type={showPassword ? 'text' : 'password'} className={`form-input ${error ? 'error animate-shake' : ''}`}
              placeholder="Şifre"
              value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password" style={{ paddingRight: '70px' }} />
            <button type="button" className="password-toggle-text" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'GİZLE' : 'GÖSTER'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="13" /><circle cx="12" cy="16.5" r="0.5" fill="currentColor" /></svg>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '8px' }}>
            <label className="custom-checkbox" style={{ marginBottom: 0 }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span className="checkbox-box" />
              <span className="checkbox-label">Beni Hatırla</span>
            </label>
            <a href="#" className="link-gradient" style={{ fontSize: '0.78rem' }}>Şifremi Unuttum?</a>
          </div>

          <button type="submit" className="btn-gradient" disabled={loading}>
            {loading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.7s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="28" strokeDashoffset="8" />
                </svg>
                Giriş yapılıyor...
              </>
            ) : 'GİRİŞ YAP'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Hesabın yok mu? <Link to="/register" className="link-gradient">Kayıt Ol</Link>
          </p>
        </form>
      </div>
    </div>
  );
}