import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="fullscreen-landing">
      <div className="glass-card animate-fade-up" style={{ textAlign: 'center', background: 'var(--bg-card)', backdropFilter: 'blur(50px)' }}>
        
        {/* Logo */}
        <h1 className="logo-gradient" style={{ marginBottom: '0.3rem' }}>ANIMEFOX</h1>
        <p className="japanese-sub" style={{ marginBottom: '1.5rem' }}>アニメフォックス</p>

        {/* Japonca özlü söz */}
        <div className="japanese-quote">
          <span className="jp-text">心はアニメに宿る</span>
          <span className="jp-romanji">kokoro wa anime ni yadoru</span>
        </div>

        {/* Alt başlık */}
        <p className="subtitle" style={{ color: 'var(--text-secondary)', marginBottom: '1.8rem' }}>
          Ruhunu animeye ver. Gerisi kendiliğinden gelir.
        </p>

        {/* Butonlar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Link to="/register" className="btn-gradient animate-pulse-strong">
            KATIL
          </Link>
          <Link to="/login" className="btn-outline-gradient">
            GİRİŞ
          </Link>
        </div>

        {/* Alt */}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', letterSpacing: '0.08em', marginTop: '2rem', fontWeight: 500 }}>
          ANIMEFOX &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}