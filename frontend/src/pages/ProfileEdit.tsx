import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { uploadAvatar, uploadBanner } from '../lib/api';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [banner, setBanner] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [publicProfile, setPublicProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropType, setCropType] = useState<'avatar' | 'banner'>('avatar');
  const [cropSrc, setCropSrc] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setUsername(data.username || '');
        setBio(data.bio || '');
        setAvatar(data.avatar || '');
        setBanner(data.banner || '');
        setWebsite(data.website || '');
        setLocation(data.location || '');
        setPublicProfile(data.public_profile !== false);
      } else {
        setUsername(user.user_metadata?.username || '');
      }
    }
  };

  const handleFileSelect = (type: 'avatar' | 'banner', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (type === 'avatar') {
        setAvatarPreview(src);
        setCropSrc(src);
        setCropType('avatar');
        setShowCropModal(true);
      } else {
        setBannerPreview(src);
        setCropSrc(src);
        setCropType('banner');
        setShowCropModal(true);
      }
      handleUpload(type, file);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (type: 'avatar' | 'banner', file: File) => {
    if (!user) return;
    setUploadProgress(0);
    if (type === 'avatar') setAvatarUploading(true);
    else setBannerUploading(true);

    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) { clearInterval(interval); return prev; }
          return prev + Math.random() * 15;
        });
      }, 200);

      const url = type === 'avatar'
        ? await uploadAvatar(file, user.id)
        : await uploadBanner(file, user.id);

      clearInterval(interval);
      setUploadProgress(100);

      if (type === 'avatar') {
        setAvatar(url);
        await supabase.from('profiles').update({ avatar: url }).eq('id', user.id);
      } else {
        setBanner(url);
        await supabase.from('profiles').update({ banner: url }).eq('id', user.id);
      }

      setTimeout(() => {
        setUploadProgress(0);
        if (type === 'avatar') setAvatarUploading(false);
        else setBannerUploading(false);
        setShowCropModal(false);
        setMessage('Fotograf basariyla guncellendi.');
      }, 500);
    } catch (err: any) {
      setUploadProgress(0);
      if (type === 'avatar') setAvatarUploading(false);
      else setBannerUploading(false);
      setShowCropModal(false);
      setMessage('Yukleme basarisiz: ' + (err.message || 'Bilinmeyen hata'));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage('');
    const { error } = await supabase.from('profiles').update({
      username,
      bio,
      avatar,
      banner,
      website,
      location,
      public_profile: publicProfile
    }).eq('id', user.id);
    if (error) {
      setMessage('Guncelleme basarisiz: ' + error.message);
    } else {
      setMessage('Profil basariyla guncellendi.');
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #333', borderTopColor: '#EC4899', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      {(avatarUploading || bannerUploading) && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', pointerEvents: 'all'
        }}>
          <div style={{ width: '300px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
              {avatarUploading ? 'Profil Fotografiniz Yukleniyor...' : 'Kapak Fotografiniz Yukleniyor...'}
            </p>
            <div style={{ width: '100%', height: '6px', background: '#262626', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #A78BFA, #EC4899)', borderRadius: '3px', transition: 'width 0.3s ease', width: `${uploadProgress}%` }} />
            </div>
            <p style={{ color: '#8e8e8e', fontSize: '13px' }}>%{Math.round(uploadProgress)}</p>
            <p style={{ color: '#8e8e8e', fontSize: '11px', marginTop: '20px' }}>Lutfen yukleme tamamlanana kadar bekleyiniz...</p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#0095f6', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>Geri</button>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, flex: 1 }}>Profili Duzenle</h2>
          <button onClick={handleSave} disabled={loading || avatarUploading || bannerUploading} style={{ background: '#0095f6', border: 'none', color: '#fff', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (loading || avatarUploading || bannerUploading) ? 0.5 : 1 }}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</button>
        </div>

        {message && (
          <p style={{
            color: message.includes('basari') ? '#10B981' : '#EF4444',
            fontSize: '13px', marginBottom: '16px', padding: '10px',
            background: '#1a1a1a', borderRadius: '8px'
          }}>{message}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px', background: '#1a1a1a', borderRadius: '12px', cursor: avatarUploading ? 'not-allowed' : 'pointer', opacity: avatarUploading ? 0.6 : 1 }} onClick={() => !avatarUploading && avatarInputRef.current?.click()}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: (avatarPreview || avatar) ? `url(${avatarPreview || avatar}) center/cover` : 'linear-gradient(135deg, #A78BFA, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '24px', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
            {!(avatarPreview || avatar) && (user?.user_metadata?.username?.[0]?.toUpperCase() || 'A')}
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>Profil Fotografi</p>
            <p style={{ fontSize: '12px', color: '#0095f6', margin: 0 }}>{avatarUploading ? 'Yukleniyor...' : 'Fotograf Degistir'}</p>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileSelect('avatar', e)} />
        </div>

        <div style={{ marginBottom: '24px', padding: '16px', background: '#1a1a1a', borderRadius: '12px', cursor: bannerUploading ? 'not-allowed' : 'pointer', opacity: bannerUploading ? 0.6 : 1 }} onClick={() => !bannerUploading && bannerInputRef.current?.click()}>
          <div style={{ width: '100%', height: '150px', borderRadius: '8px', background: (bannerPreview || banner) ? `url(${bannerPreview || banner}) center/cover` : '#262626', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8e8e8e', fontSize: '13px', position: 'relative' }}>
            {!(bannerPreview || banner) && 'Kapak Fotografi Ekle'}
          </div>
          <p style={{ fontSize: '12px', color: '#0095f6', margin: 0 }}>{bannerUploading ? 'Yukleniyor...' : 'Kapak Fotografi Degistir'}</p>
          <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileSelect('banner', e)} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#8e8e8e', margin: '0 0 6px' }}>Kullanici Adi</p>
          <input value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#8e8e8e', margin: '0 0 6px' }}>Hakkimda</p>
          <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={250} style={{ width: '100%', height: '80px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
          <p style={{ color: '#8e8e8e', fontSize: '11px', textAlign: 'right', margin: '4px 0 0' }}>{bio.length}/250</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#8e8e8e', margin: '0 0 6px' }}>Web Sitesi</p>
          <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#8e8e8e', margin: '0 0 6px' }}>Konum</p>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Istanbul, Turkiye" style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#1a1a1a', borderRadius: '12px', cursor: 'pointer' }}>
          <span style={{ fontSize: '14px' }}>Herkese Acik Profil</span>
          <div onClick={() => setPublicProfile(!publicProfile)} style={{ width: '48px', height: '28px', borderRadius: '14px', background: publicProfile ? '#0095f6' : '#333', position: 'relative', transition: 'background 0.2s ease' }}>
            <div style={{ position: 'absolute', top: '2px', left: publicProfile ? '22px' : '2px', width: '24px', height: '24px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s ease' }} />
          </div>
        </label>
      </div>

      {showCropModal && cropSrc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '20px' }}>
          <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>{cropType === 'avatar' ? 'Profil Fotografi Onizleme' : 'Kapak Fotografi Onizleme'}</p>
          <div style={{ width: cropType === 'avatar' ? '280px' : '100%', height: cropType === 'avatar' ? '280px' : '200px', borderRadius: cropType === 'avatar' ? '50%' : '8px', overflow: 'hidden', border: '2px solid #EC4899', boxShadow: '0 0 30px rgba(236,72,153,0.4)' }}>
            <img src={cropSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button onClick={() => { setShowCropModal(false); setAvatarPreview(''); setBannerPreview(''); }} style={{ background: 'none', border: '1px solid #8e8e8e', color: '#fff', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>Iptal</button>
            <button onClick={() => setShowCropModal(false)} style={{ background: '#0095f6', border: 'none', color: '#fff', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600 }}>Onayla</button>
          </div>
        </div>
      )}
    </div>
  );
}