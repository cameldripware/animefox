import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [nsfwOk, setNsfwOk] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [animeSearch, setAnimeSearch] = useState('');
  const [animeResults, setAnimeResults] = useState<any[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<any[]>([]);

  const [bio, setBio] = useState('');
  const [publicProfile, setPublicProfile] = useState(true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [contractError, setContractError] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);

  const checkPasswordStrength = (pass: string) => {
    let s = 0;
    if (pass.length >= 8) s += 20;
    if (/[A-Z]/.test(pass)) s += 20;
    if (/[a-z]/.test(pass)) s += 20;
    if (/[0-9]/.test(pass)) s += 20;
    if (/[^A-Za-z0-9]/.test(pass)) s += 20;
    setPasswordStrength(Math.min(s, 100));
    setPassword(pass);
  };

  const checkUsername = async (name: string) => {
    setUsername(name);
    if (name.length < 3) {
      setUsernameError('Kullanıcı adı en az 3 karakter olmalıdır.');
      setUsernameAvailable(false);
      return;
    }
    const { data } = await supabase.from('profiles').select('username').eq('username', name).single();
    if (data) {
      setUsernameError('Bu kullanıcı adı alınmış.');
      setUsernameAvailable(false);
    } else {
      setUsernameError('');
      setUsernameAvailable(true);
    }
  };

  const checkEmail = async (mail: string) => {
    setEmail(mail);
    if (!mail.includes('@') || !mail.includes('.')) {
      setEmailError('Geçerli bir e-posta adresi giriniz.');
      setEmailAvailable(false);
      return;
    }
    const { data } = await supabase.from('profiles').select('email').eq('email', mail).single();
    if (data) {
      setEmailError('Bu e-posta adresi zaten kullanılıyor.');
      setEmailAvailable(false);
    } else {
      setEmailError('');
      setEmailAvailable(true);
    }
  };

  const searchAnime = useCallback(async (q: string) => {
    setAnimeSearch(q);
    if (q.length < 2) { setAnimeResults([]); return; }
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=9`);
      const data = await res.json();
      setAnimeResults(data.data || []);
    } catch { setAnimeResults([]); }
  }, []);

  const selectAnime = (a: any) => {
    if (selectedAnime.find((x) => x.mal_id === a.mal_id)) return;
    if (selectedAnime.length >= 3) return;
    setSelectedAnime([...selectedAnime, a]);
    setAnimeSearch('');
    setAnimeResults([]);
  };

  const removeAnime = (id: number) => setSelectedAnime(selectedAnime.filter((x) => x.mal_id !== id));

  const handleStepTwoContinue = () => {
    if (!agreed) {
      setContractError('Devam edebilmek için lütfen Kullanıcı Sözleşmesini okuyup onaylayınız.');
      return;
    }
    setContractError('');
    setStep(3);
  };

  const handleRegister = async () => {
    setError('');
    if (!email || !username || !password) { setError('Tüm zorunlu alanları doldurunuz.'); return; }
    if (password !== passwordConfirm) { setError('Şifreler eşleşmiyor.'); return; }
    if (password.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); return; }
    if (selectedAnime.length !== 3) { setError('Tam olarak 3 favori anime seçmelisiniz.'); return; }

    setLoading(true);
    try {
      await registerUser(email, password, username, {
        bio: bio || null,
        birth_date: birthDate || null,
        public_profile: publicProfile,
        nsfw_ok: nsfwOk,
        favorite_anime: selectedAnime.map((a) => ({
          mal_id: a.mal_id,
          title: a.title,
          image_url: a.images?.jpg?.image_url || ''
        }))
      });
      window.location.href = '/feed';
    } catch (err: any) {
      const msg = err?.message || 'Kayıt sırasında bir sorun oluştu. Lütfen tekrar deneyin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fullscreen-landing" style={{ overflowY: 'auto', alignItems: 'flex-start', paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
      <div className="glass-card animate-fade-up" style={{ maxWidth: '540px', margin: '0 auto', maxHeight: 'none', overflowY: 'visible' }}>
        <Link to="/" style={{ position: 'absolute', top: '18px', right: '20px', color: 'var(--text-muted)', fontSize: '1.4rem', textDecoration: 'none', zIndex: 3 }}>&times;</Link>

        <h1 className="logo-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>ANIMEFOX</h1>
        <p className="japanese-sub" style={{ marginBottom: '1rem' }}>アニメフォックス</p>

        <div className="japanese-quote">
          <span className="jp-text">新たな旅が始まる</span>
          <span className="jp-romanji">arata na tabi ga hajimaru</span>
        </div>

        <div className="step-progress">
          {[1, 2, 3, 4].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <div className={`step-dot ${step > s ? 'done' : ''} ${step === s ? 'active' : ''}`}>
                {step > s ? '\u2713' : s}
              </div>
              {i < 3 && <div className={`step-line ${step > s ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="error-message">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="13" /><circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
            </svg>
            {error}
          </div>
        )}

        {/* ADIM 1 */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
            <h3 className="title-gradient">Haydi Başlayalım!</h3>
            <p className="subtitle" style={{ fontSize: '0.85rem' }}>Anime dünyasına katılmak için</p>

            <div className="form-group">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0116 0v1" /></svg>
              <input type="text" className={`form-input ${usernameError ? 'error' : usernameAvailable ? 'valid' : ''}`} placeholder="Kullanıcı Adı" 
                value={username} onChange={(e) => checkUsername(e.target.value)} minLength={3} maxLength={20} />
              {usernameError && <p style={{ color: 'var(--accent-red)', fontSize: '0.7rem', marginTop: '4px' }}>{usernameError}</p>}
              {usernameAvailable && !usernameError && username.length >= 3 && <p style={{ color: 'var(--accent-green)', fontSize: '0.7rem', marginTop: '4px' }}>Kullanılabilir</p>}
            </div>

            <div className="form-group">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 8l9 6 9-6" /></svg>
              <input type="email" className={`form-input ${emailError ? 'error' : emailAvailable ? 'valid' : ''}`} placeholder="E-posta Adresi" 
                value={email} onChange={(e) => checkEmail(e.target.value)} autoComplete="email" />
              {emailError && <p style={{ color: 'var(--accent-red)', fontSize: '0.7rem', marginTop: '4px' }}>{emailError}</p>}
              {emailAvailable && !emailError && email.includes('@') && <p style={{ color: 'var(--accent-green)', fontSize: '0.7rem', marginTop: '4px' }}>Kullanılabilir</p>}
            </div>

            <div className="form-group">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <input type="date" className="form-input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={{ colorScheme: 'dark' }} />
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>13 yaşından büyük olmalısınız</p>

            <button type="submit" className="btn-gradient" disabled={!usernameAvailable || !emailAvailable || !username || !email}>
              İLERİ
            </button>
          </form>
        )}

        {/* ADIM 2 */}
        {step === 2 && (
          <div>
            <h3 className="title-gradient">Hesabını Güvenli Tut</h3>

            <div className="form-group">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="11" width="14" height="10" rx="2" /><circle cx="12" cy="16" r="1" /><path d="M9 11V7a3 3 0 016 0v4" /></svg>
              <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Şifre" value={password} onChange={(e) => checkPasswordStrength(e.target.value)} autoComplete="new-password" style={{ paddingRight: '70px' }} />
              <button type="button" className="password-toggle-text" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'GİZLE' : 'GÖSTER'}</button>
            </div>

            {password.length > 0 && (
              <>
                <div className="strength-bar"><div className="strength-bar-fill" style={{ width: `${passwordStrength}%`, background: passwordStrength < 30 ? 'var(--accent-red)' : passwordStrength < 60 ? '#EAB308' : passwordStrength < 80 ? '#84CC16' : 'var(--accent-green)' }} /></div>
                <p className="strength-text">{passwordStrength < 30 ? 'Zayıf' : passwordStrength < 60 ? 'Orta' : passwordStrength < 80 ? 'İyi' : 'Güçlü'}</p>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                  {[
                    { ok: password.length >= 8, text: 'En az 8 karakter' },
                    { ok: /[A-Z]/.test(password), text: 'Bir büyük harf' },
                    { ok: /[0-9]/.test(password), text: 'Bir rakam' },
                    { ok: /[^A-Za-z0-9]/.test(password), text: 'Bir özel karakter' }
                  ].map((r, i) => (
                    <span key={i} style={{ display: 'block', color: r.ok ? 'var(--accent-green)' : 'var(--text-muted)' }}>{r.ok ? '\u2713' : '\u2717'} {r.text}</span>
                  ))}
                </div>
              </>
            )}

            <div className="form-group">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="11" width="14" height="10" rx="2" /><circle cx="12" cy="16" r="1" /><path d="M9 11V7a3 3 0 016 0v4" /></svg>
              <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Şifre Tekrar" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} autoComplete="new-password" />
            </div>

            {/* SÖZLEŞME ONAYI - ZORUNLU */}
            <div style={{
              border: contractError ? '1px solid var(--accent-red)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '1rem',
              background: contractError ? 'rgba(239,68,68,0.05)' : 'transparent',
              transition: 'all 0.25s ease'
            }}>
              <label className="custom-checkbox" style={{ marginBottom: 0 }}>
                <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); if (e.target.checked) setContractError(''); }} />
                <span className="checkbox-box" />
                <span className="checkbox-label">
                  <button type="button" className="link-gradient" onClick={() => setShowContract(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}>
                    KULLANICI SÖZLEŞMESİ
                  </button>
                  'ni okudum, tüm maddeleri anladım ve onaylıyorum.
                </span>
              </label>
              {contractError && (
                <p style={{ color: 'var(--accent-red)', fontSize: '0.7rem', marginTop: '8px', paddingLeft: '30px' }}>{contractError}</p>
              )}
            </div>

            <label className="custom-checkbox">
              <input type="checkbox" checked={nsfwOk} onChange={(e) => setNsfwOk(e.target.checked)} />
              <span className="checkbox-box" />
              <span className="checkbox-label">18 yaşından büyüğüm ve NSFW içerik görebilirim (Opsiyonel)</span>
            </label>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep(1)} className="btn-outline-gradient" style={{ flex: 1 }}>GERİ</button>
              <button onClick={handleStepTwoContinue} className="btn-gradient" style={{ flex: 1 }}>İLERİ</button>
            </div>
          </div>
        )}

        {/* ADIM 3 */}
        {step === 3 && (
          <div>
            <h3 className="title-gradient">Sevdiğin 3 Animeyi Seç</h3>
            <p className="subtitle" style={{ fontSize: '0.85rem' }}>Algoritma senin için özelleşsin</p>

            <div className="form-group" style={{ position: 'relative' }}>
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16" y2="16" /></svg>
              <input type="text" className="form-input" placeholder="Anime ara..." value={animeSearch} onChange={(e) => searchAnime(e.target.value)} />
              {animeResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                  {animeResults.map((a: any) => (
                    <button key={a.mal_id} onClick={() => selectAnime(a)} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(236,72,153,0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >{a.title}</button>
                  ))}
                </div>
              )}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.8rem' }}>Seçilen: {selectedAnime.length}/3</p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  flex: 1, aspectRatio: '3/4', borderRadius: '12px',
                  border: selectedAnime[i] ? '2px solid var(--pink-500)' : '2px dashed rgba(255,255,255,0.15)',
                  overflow: 'hidden', position: 'relative',
                  background: selectedAnime[i] ? 'transparent' : 'rgba(255,255,255,0.02)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all var(--transition-normal)'
                }}>
                  {selectedAnime[i] ? (
                    <>
                      <img src={selectedAnime[i].images?.jpg?.image_url || ''} alt={selectedAnime[i].title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => removeAnime(selectedAnime[i].mal_id)}
                        style={{ position: 'absolute', top: '6px', right: '6px', background: 'var(--accent-red)', border: 'none', color: '#FFF', borderRadius: '50%', width: '22px', height: '22px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>&times;</button>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '6px 8px' }}>
                        <p style={{ color: '#FFF', fontSize: '0.6rem', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{selectedAnime[i].title}</p>
                      </div>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Slot {i + 1}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="anime-grid">
              {animeResults.slice(0, 9).map((a: any) => {
                const isSel = selectedAnime.some((x) => x.mal_id === a.mal_id);
                const isFull = selectedAnime.length >= 3 && !isSel;
                return (
                  <div key={a.mal_id} className={`anime-card ${isSel ? 'selected' : ''} ${isFull ? 'disabled' : ''}`}
                    onClick={() => !isFull && !isSel && selectAnime(a)}>
                    <img src={a.images?.jpg?.image_url || ''} alt={a.title} />
                    <div className="anime-card-title">{a.title}</div>
                  </div>
                );
              })}
            </div>

            {animeResults.length > 0 && (
              <button onClick={() => searchAnime(animeSearch + ' ')} className="btn-outline-gradient" style={{ marginTop: '0.5rem', height: '44px', fontSize: '0.85rem' }}>
                Daha Fazla Yükle
              </button>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
              <button onClick={() => setStep(2)} className="btn-outline-gradient" style={{ flex: 1 }}>GERİ</button>
              <button onClick={() => setStep(4)} disabled={selectedAnime.length !== 3} className="btn-gradient" style={{ flex: 1 }} title={selectedAnime.length !== 3 ? '3 anime seçmelisiniz' : ''}>İLERİ</button>
            </div>
          </div>
        )}

        {/* ADIM 4 */}
        {step === 4 && (
          <div>
            <h3 className="title-gradient">Profilini Kişiselleştir</h3>
            <p className="subtitle" style={{ fontSize: '0.85rem' }}>(Opsiyonel Adım)</p>

            <div className="form-group">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0116 0v1" /></svg>
              <textarea className="form-input" placeholder="Hakkımda (Bio)" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={250} style={{ height: '90px', paddingTop: '14px', resize: 'none' }} />
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-0.7rem', marginBottom: '1rem' }}>{bio.length} / 250</p>

            <label className="custom-checkbox">
              <input type="checkbox" checked={publicProfile} onChange={(e) => setPublicProfile(e.target.checked)} />
              <span className="checkbox-box" />
              <span className="checkbox-label">Profilimi herkese açık yap</span>
            </label>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep(3)} className="btn-outline-gradient" style={{ flex: 1 }}>GERİ</button>
              <button onClick={handleRegister} disabled={loading} className="btn-gradient animate-pulse-strong" style={{ flex: 1 }}>
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.7s linear infinite' }}><circle cx="12" cy="12" r="10" strokeDasharray="28" strokeDashoffset="8" /></svg>
                    Kaydediliyor...
                  </>
                ) : 'KAYDI TAMAMLA'}
              </button>
            </div>
          </div>
        )}

        {/* SÖZLEŞME MODAL - TAM METİN */}
        {showContract && (
          <div className="modal-overlay" onClick={() => setShowContract(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>KULLANICI SÖZLEŞMESİ</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '1.2rem' }}>Son güncelleme: 12 Mayıs 2026</p>

              <p><strong>MADDE 1 — TARAFLAR VE TANIMLAR</strong><br />
              İşbu Kullanıcı Sözleşmesi, AnimeFox platformuna üye olan gerçek veya tüzel kişi ile Platform'un sahibi ve işleticisi arasında, Kullanıcı'nın Platform'a kayıt işlemini tamamlamasıyla akdedilmiş sayılır. Platform, 5651 sayılı Kanun kapsamında yer sağlayıcı sıfatını haizdir.</p>

              <p><strong>MADDE 2 — HESAP GÜVENLİĞİ</strong><br />
              Kullanıcı, hesap bilgilerinin gizliliğinden münhasıran sorumludur. 13 yaşından küçükler Platform'a üye olamaz. Yanıltıcı bilgilerle oluşturulan hesaplar kalıcı olarak kapatılır.</p>

              <p><strong>MADDE 3 — İÇERİK POLİTİKASI VE TELİF</strong><br />
              5846 sayılı Fikir ve Sanat Eserleri Kanunu'na aykırı içerik paylaşımı yasaktır. Kullanıcı, paylaştığı içeriklerden bireysel olarak sorumludur.</p>

              <p><strong>MADDE 4 — YASAKLI DAVRANIŞLAR</strong><br />
              5816 sayılı Atatürk Aleyhine İşlenen Suçlar Hakkında Kanun kapsamındaki fiiller, şehitlerimize ve gazilerimize hakaret, nefret söylemi, terör propagandası, çocuk istismarı ve 5237 sayılı TCK'da düzenlenen suçları oluşturan fiiller kesinlikle yasaktır. Tespiti halinde hesap kalıcı olarak kapatılır ve Cumhuriyet Başsavcılığı'na suç duyurusunda bulunulur.</p>

              <p><strong>MADDE 5 — NSFW POLİTİKASI</strong><br />
              Yetişkin içerikler yalnızca +18 etiketiyle ve 18 yaş üstü kullanıcılar tarafından paylaşılabilir. TCK 226'ya aykırı içerikler yasaktır.</p>

              <p><strong>MADDE 6 — KİŞİSEL VERİLER</strong><br />
              Kullanıcı verileri 6698 sayılı KVKK'ya uygun işlenir. Veriler üçüncü taraflarla ticari amaçlarla paylaşılmaz.</p>

              <p><strong>MADDE 7 — MODERASYON VE YAPTIRIMLAR</strong><br />
              İhlal halinde içerik kaldırma, hesap askıya alma veya kalıcı kapatma uygulanır.</p>

              <p><strong>MADDE 8 — SUÇ DUYURUSU YÜKÜMLÜLÜĞÜ</strong><br />
              5816 sayılı Kanun, TCK 299-302, şehitlere/gazilere hakaret, çocuk istismarı, terör propagandası gibi durumlarda vakit kaybetmeksizin adli makamlara suç duyurusunda bulunulur.</p>

              <p><strong>MADDE 9-15 — DİĞER HÜKÜMLER</strong><br />
              Platform, Sözleşme'yi tek taraflı değiştirme hakkına sahiptir. Uyuşmazlıklarda İstanbul Merkez Mahkemeleri yetkilidir. Sözleşme, Kullanıcı tarafından onaylandığı anda yürürlüğe girer.</p>

              <button onClick={() => setShowContract(false)} className="btn-gradient" style={{ marginTop: '1.5rem' }}>KAPAT</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Zaten hesabın var mı? <Link to="/login" className="link-gradient">Giriş Yap</Link>
          </p>
        )}
      </div>
    </div>
  );
}