import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function Profile() {
  const { theme, toggleTheme } = useTheme();
  const { username } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'posts' | 'collection'>('posts');

  // Örnek profil verisi (backend gelene kadar)
  const profile = {
    username: username || 'kullanici',
    level: 12,
    xp: 2450,
    itibar: 384,
    bio: 'Anime aşığı. Jujutsu Kaisen, Demon Slayer hayranı.',
    postsCount: 47,
    followers: 234,
    following: 156,
    avatar: null,
    banner: null,
    ruhKarakteri: 'Gojo Satoru',
    izlenenSaat: 1240,
    puanOrtalamasi: 8.4,
  };

  // Örnek gönderi grid'i
  const posts = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    content: `Örnek gönderi ${i + 1}`,
    nsfw: i === 4,
  }));

  // Örnek rozetler
  const badges = [
    { id: 1, name: 'İlk Gönderi', tier: 'Bronz', description: 'İlk gönderini paylaştın!', earned: true },
    { id: 2, name: '10 Takipçi', tier: 'Gümüş', description: '10 takipçiye ulaştın.', earned: true },
    { id: 3, name: 'Anime Uzmanı', tier: 'Altın', description: '50 farklı anime izledin.', earned: true },
    { id: 4, name: 'Efsane', tier: 'Efsanevi', description: 'Topluluk oylamasıyla seçildin.', earned: false },
    { id: 5, name: 'İlk Beğeni', tier: 'Bronz', description: 'Bir gönderin beğenildi.', earned: true },
    { id: 6, name: 'Teori Ustası', tier: 'Altın', description: '10 uzun analiz yazdın.', earned: false },
  ];

  const handleLogout = () => {
    localStorage.removeItem('animefox-token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-amoled-bg dark:bg-amoled-bg bg-gray-50 transition-colors duration-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-20 bg-amoled-bg/90 dark:bg-amoled-bg/90 bg-white/90 backdrop-blur border-b border-amoled-border dark:border-amoled-border border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/feed" className="text-fox-500 font-bold text-xl">AnimeFox</Link>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-amoled-surface">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-400">Çıkış</button>
          </div>
        </div>
      </nav>

      {/* Profil Banner */}
      <div className="h-40 bg-gradient-to-r from-fox-500 to-fox-700 relative">
        <div className="absolute -bottom-12 left-6 w-24 h-24 rounded-full border-4 border-amoled-bg dark:border-amoled-bg border-white bg-fox-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
          {profile.username[0]?.toUpperCase()}
        </div>
      </div>

      {/* Profil Bilgileri */}
      <div className="max-w-3xl mx-auto px-6 pt-14">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white dark:text-white text-gray-900">{profile.username}</h1>
            <p className="text-sm text-gray-400">Seviye {profile.level} • {profile.xp} XP • {profile.itibar} İtibar</p>
            <p className="text-gray-400 mt-1">{profile.bio}</p>
          </div>
          <button className="border border-fox-500 text-fox-500 px-4 py-2 rounded-full text-sm hover:bg-fox-500 hover:text-white transition-colors">
            Profili Düzenle
          </button>
        </div>

        {/* Ruh Karakteri Vitrini */}
        <div className="mt-4 bg-amoled-card dark:bg-amoled-card bg-white border border-fox-500/30 rounded-xl p-4 flex items-center gap-4 animate-glow">
          <div className="w-16 h-16 rounded-full bg-fox-500/20 flex items-center justify-center text-fox-500 text-2xl">
            🦊
          </div>
          <div>
            <p className="text-xs text-gray-500">Ruh Karakteri</p>
            <p className="text-lg font-bold text-fox-500">{profile.ruhKarakteri}</p>
            <p className="text-xs text-gray-500">Premium üyelere özel</p>
          </div>
        </div>

        {/* Takipçi sayıları */}
        <div className="flex gap-6 mt-4 text-sm">
          <span className="text-gray-400"><strong className="text-white dark:text-white text-gray-900">{profile.postsCount}</strong> gönderi</span>
          <span className="text-gray-400"><strong className="text-white dark:text-white text-gray-900">{profile.followers}</strong> takipçi</span>
          <span className="text-gray-400"><strong className="text-white dark:text-white text-gray-900">{profile.following}</strong> takip</span>
        </div>

        {/* Sekmeler */}
        <div className="flex border-b border-amoled-border dark:border-amoled-border border-gray-200 mt-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-fox-500 border-b-2 border-fox-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}>
            Gönderiler
          </button>
          <button
            onClick={() => setActiveTab('collection')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'collection'
                ? 'text-fox-500 border-b-2 border-fox-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}>
            Koleksiyon & İstatistikler
          </button>
        </div>

        {/* Gönderiler Grid */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-3 gap-1 mt-4 pb-20">
            {posts.map(post => (
              <div key={post.id}
                className="aspect-square bg-amoled-surface dark:bg-amoled-surface bg-gray-200 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer relative">
                <span className="text-gray-500 text-xs">{post.content}</span>
                {post.nsfw && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded">+18</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Koleksiyon & İstatistikler */}
        {activeTab === 'collection' && (
          <div className="mt-4 pb-20 space-y-6">
            {/* İstatistikler */}
            <div className="bg-amoled-card dark:bg-amoled-card bg-white border border-amoled-border dark:border-amoled-border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white dark:text-white text-gray-900 mb-3">İstatistikler</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">İzlenen Anime</p>
                  <p className="text-white dark:text-white text-gray-900 font-bold">{profile.izlenenSaat} saat</p>
                </div>
                <div>
                  <p className="text-gray-500">Puan Ortalaması</p>
                  <p className="text-white dark:text-white text-gray-900 font-bold">{profile.puanOrtalamasi}/10</p>
                </div>
                <div>
                  <p className="text-gray-500">Favori Tür</p>
                  <p className="text-fox-500 font-bold">Shounen</p>
                </div>
                <div>
                  <p className="text-gray-500">En Çok İzlenen</p>
                  <p className="text-fox-500 font-bold">Jujutsu Kaisen</p>
                </div>
              </div>
            </div>

            {/* Rozet Koleksiyonu */}
            <div className="bg-amoled-card dark:bg-amoled-card bg-white border border-amoled-border dark:border-amoled-border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white dark:text-white text-gray-900 mb-3">Rozet Koleksiyonu</h3>
              <div className="grid grid-cols-3 gap-3">
                {badges.map(badge => (
                  <div key={badge.id}
                    className={`relative p-3 rounded-lg border text-center ${
                      badge.earned
                        ? 'border-fox-500/50 bg-fox-500/10'
                        : 'border-amoled-border dark:border-amoled-border border-gray-300 bg-amoled-surface dark:bg-amoled-surface bg-gray-100 opacity-50'
                    }`}
                    title={badge.description}>
                    <div className={`text-2xl mb-1 ${badge.earned ? '' : 'grayscale'}`}>
                      {badge.tier === 'Efsanevi' ? '👑' : badge.tier === 'Altın' ? '🥇' : badge.tier === 'Gümüş' ? '🥈' : '🥉'}
                    </div>
                    <p className={`text-xs font-medium ${badge.earned ? 'text-fox-500' : 'text-gray-500'}`}>
                      {badge.name}
                    </p>
                    <p className="text-xs text-gray-500">{badge.tier}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}