import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// SVG Icon bilesenleri - EMOJI YOK
const HomeIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const SearchIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const PlusIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const ReelsIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="4"/><line x1="8" y1="2" x2="8" y2="22"/><line x1="16" y1="2" x2="16" y2="22"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="2" y1="16" x2="22" y2="16"/></svg>);
const ProfileIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0116 0v1"/></svg>);
const HeartIcon = ({ filled }: { filled: boolean }) => (<svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#ed4956' : 'none'} stroke={filled ? '#ed4956' : '#fff'} strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>);
const CommentIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>);
const BookmarkIcon = ({ saved }: { saved: boolean }) => (<svg width="22" height="22" viewBox="0 0 24 24" fill={saved ? '#fff' : 'none'} stroke="#fff" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>);
const ShareIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>);
const MessageIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>);

// Hashtag ve mention render edici
function renderContent(text: string) {
  if (!text) return '';
  const parts = text.split(/([#@][\w\u00C0-\u024F]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#') && part.length > 1) {
      return <Link key={i} to={`/hashtag/${part.slice(1)}`} style={{ color: '#0095f6', textDecoration: 'none' }}>{part}</Link>;
    }
    if (part.startsWith('@') && part.length > 1) {
      return <Link key={i} to={`/profile/${part.slice(1)}`} style={{ color: '#0095f6', textDecoration: 'none', fontWeight: 600 }}>{part}</Link>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function Feed() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({});
  const [posts, setPosts] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [newPostNsfw, setNewPostNsfw] = useState(false);
  const [newPostType, setNewPostType] = useState<'text' | 'poll'>('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [showCommentsFor, setShowCommentsFor] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [animeTrending, setAnimeTrending] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    loadAll();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) loadMorePosts();
    }, { threshold: 0.5 });
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) observerRef.current.observe(sentinel);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, posts]);

  const loadAll = async () => {
    await Promise.all([loadUser(), loadPosts(1), loadSuggestions(), loadTrendingAnime(), loadNotifications()]);
    setLoading(false);
  };

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) setProfile(prof);
    }
  };

  const loadPosts = async (pageNum: number) => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).range((pageNum - 1) * 10, pageNum * 10 - 1);
    if (data && data.length > 0) {
      const postsWithUsers = await Promise.all(data.map(async (post) => {
        const { data: prof } = await supabase.from('profiles').select('username, avatar').eq('id', post.user_id).single();
        return { ...post, user: { username: prof?.username || 'anon', avatar: prof?.avatar || '' } };
      }));
      if (pageNum === 1) setPosts(postsWithUsers);
      else setPosts(prev => [...prev, ...postsWithUsers]);
      setHasMore(data.length === 10);
    } else setHasMore(false);
  };

  const loadMorePosts = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage);
  };

  const loadSuggestions = async () => {
    const { data } = await supabase.from('profiles').select('username, id, avatar').limit(8);
    if (data) setSuggestions(data.filter(s => s.id !== user?.id));
  };

  const loadTrendingAnime = async () => {
    try {
      const res = await fetch('https://api.jikan.moe/v4/top/anime?limit=10');
      const json = await res.json();
      setAnimeTrending(json.data || []);
    } catch {}
  };

  const loadNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from('likes').select('*, post:posts(content)').order('created_at', { ascending: false }).limit(20);
    if (data) setNotifications(data);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user) return;
    const postData: any = {
      user_id: user.id,
      content: newPost,
      image: newPostImage || null,
      nsfw: newPostNsfw,
      type: newPostType
    };
    if (newPostType === 'poll') postData.poll_options = pollOptions.filter(o => o.trim());
    
    const { data: newP, error } = await supabase.from('posts').insert(postData).select().single();
    if (error) {
      alert('Paylaşım başarısız: ' + error.message);
      return;
    }
    if (newP) {
      setPosts([{ ...newP, user: { username: profile.username || user.user_metadata?.username || 'sen', avatar: profile.avatar || '' } }, ...posts]);
      setNewPost(''); setNewPostImage(''); setNewPostNsfw(false); setNewPostType('text'); setPollOptions(['', '']); setShowCreate(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPosts.has(postId);
    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
      setLikedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
      setLikedPosts(prev => new Set(prev).add(postId));
    }
  };

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    const { data: existing } = await supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', targetId).single();
    if (existing) {
      await supabase.from('follows').delete().eq('id', existing.id);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
    }
    loadSuggestions();
  };

  const handleBookmark = async (postId: string) => {
    if (!user) return;
    const isSaved = savedPosts.has(postId);
    if (isSaved) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('post_id', postId);
      setSavedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, post_id: postId });
      setSavedPosts(prev => new Set(prev).add(postId));
    }
  };

  const loadComments = async (postId: string) => {
    if (showCommentsFor === postId) { setShowCommentsFor(null); return; }
    const { data } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    setComments(prev => ({ ...prev, [postId]: data || [] }));
    setShowCommentsFor(postId);
  };

  const addComment = async (postId: string) => {
    if (!commentText.trim() || !user) return;
    const { data } = await supabase.from('comments').insert({ user_id: user.id, post_id: postId, content: commentText }).select().single();
    if (data) {
      setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data] }));
      setCommentText('');
    }
  };

  const handleReport = async (postId: string) => {
    if (!user) return;
    await supabase.from('reports').insert({ reporter_id: user.id, post_id: postId, reason: 'Topluluk kurallarına aykırı', status: 'pending' });
    alert('Gönderi raporlandı. Moderatörlerimiz inceleyecektir.');
  };

  const handleBlock = async (targetId: string) => {
    if (!user || !confirm('Bu kullanıcıyı engellemek istediğinize emin misiniz?')) return;
    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: targetId });
    setPosts(prev => prev.filter(p => p.user_id !== targetId));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('animefox-token');
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #333', borderTopColor: '#EC4899', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', maxWidth: '1265px', width: '100%' }}>

        {/* MOBIL UST BAR */}
        {isMobile && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: '#000', borderBottom: '1px solid #262626', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '20px', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #A78BFA, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AnimeFox</h1>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', position: 'relative' }}>
                <MessageIcon />
                {notifications.length > 0 && <span style={{ position: 'absolute', top: -2, right: -4, width: 8, height: 8, background: '#ed4956', borderRadius: '50%' }} />}
              </button>
            </div>
          </div>
        )}

        {/* SOL SIDEBAR - SADECE PC */}
        {!isMobile && (
          <div style={{ width: '245px', padding: '8px 12px 0', borderRight: '1px solid #262626', position: 'fixed', top: 0, left: 'max(0px, calc((100vw - 1265px) / 2))', height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
            <Link to="/feed" style={{ padding: '25px 12px 16px', textDecoration: 'none' }}>
              <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '24px', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #A78BFA, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AnimeFox</h1>
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              {[
                { icon: <HomeIcon />, label: 'Ana Sayfa' },
                { icon: <SearchIcon />, label: 'Keşfet', action: () => navigate('/explore') },
                { icon: <ReelsIcon />, label: 'Reels' },
                { icon: <MessageIcon />, label: 'Mesajlar', action: () => navigate('/messages') },
                { icon: <PlusIcon />, label: 'Oluştur', action: () => setShowCreate(true) },
              ].map((item, i) => (
                <button key={i} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit', transition: 'background 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {item.icon} <span>{item.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', fontFamily: 'inherit', fontSize: '15px', marginBottom: '4px' }}>
              <MessageIcon />
              <span>Bildirimler</span>
              {notifications.length > 0 && <span style={{ background: '#ed4956', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, marginLeft: 'auto' }}>{notifications.length}</span>}
            </button>
            <Link to="/profile/edit" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', textDecoration: 'none', color: '#fff', marginBottom: '12px', borderRadius: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: profile.avatar ? `url(${profile.avatar}) center/cover` : 'linear-gradient(135deg, #A78BFA, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>{!profile.avatar && (profile.username?.[0]?.toUpperCase() || 'A')}</div>
              <span style={{ fontSize: '14px', flex: 1 }}>{profile.username || 'Profil'}</span>
            </Link>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#8e8e8e', cursor: 'pointer', fontSize: '13px', padding: '8px 12px', textAlign: 'left', fontFamily: 'inherit' }}>Çıkış yap</button>
          </div>
        )}

        {/* BILDIRIM PANELI */}
        {showNotifications && (
          <div style={{ position: 'fixed', top: isMobile ? 48 : 0, right: isMobile ? 0 : 'max(0px, calc((100vw - 1265px) / 2 + 245px))', width: isMobile ? '100%' : '360px', height: isMobile ? 'calc(100vh - 48px)' : '100vh', background: '#000', border: '1px solid #262626', zIndex: 200, overflowY: 'auto', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Bildirimler</h3>
              <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: '#8e8e8e', cursor: 'pointer', fontSize: '20px', fontFamily: 'inherit' }}>&times;</button>
            </div>
            {notifications.length === 0 ? <p style={{ color: '#8e8e8e', fontSize: '13px' }}>Henüz bildirim yok</p> : notifications.map((n: any, i: number) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #262626', fontSize: '13px', color: '#ccc' }}>
                <strong style={{ color: '#fff' }}>{n.user_id?.slice(0, 8)}</strong> gönderini beğendi: {n.post?.content?.slice(0, 40)}...
              </div>
            ))}
          </div>
        )}

        {/* ORTA AKIŞ */}
        <div ref={feedRef} style={{ flex: 1, maxWidth: '630px', marginLeft: isMobile ? 0 : '245px', padding: isMobile ? '54px 0 60px' : '16px 24px' }}>
          {/* Story şeridi */}
          <div style={{ display: 'flex', gap: '14px', padding: '16px 8px', marginBottom: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {suggestions.slice(0, 8).map((s, i) => (
              <div key={i} style={{ textAlign: 'center', flexShrink: 0, cursor: 'pointer' }}>
                <div style={{ width: '62px', height: '62px', borderRadius: '50%', background: 'linear-gradient(135deg, #A78BFA, #EC4899)', padding: '2px', marginBottom: '4px' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: s.avatar ? `url(${s.avatar}) center/cover` : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px' }}>{!s.avatar && (s.username?.[0]?.toUpperCase() || 'A')}</div>
                </div>
                <span style={{ color: '#8e8e8e', fontSize: '11px' }}>{s.username || 'user'}</span>
              </div>
            ))}
          </div>

          {/* Gönderi oluşturma */}
          {!showCreate ? (
            <div onClick={() => setShowCreate(true)} style={{ background: '#1a1a1a', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #262626' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: profile.avatar ? `url(${profile.avatar}) center/cover` : 'linear-gradient(135deg, #A78BFA, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>{!profile.avatar && (profile.username?.[0]?.toUpperCase() || 'A')}</div>
              <span style={{ color: '#8e8e8e', fontSize: '14px' }}>Ne düşünüyorsun?</span>
            </div>
          ) : (
            <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #262626' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                {[{ type: 'text', label: 'Metin' }, { type: 'poll', label: 'Anket' }].map(t => (
                  <button key={t.type} onClick={() => setNewPostType(t.type as any)} style={{
                    background: newPostType === t.type ? '#262626' : 'transparent', border: 'none', color: newPostType === t.type ? '#fff' : '#8e8e8e',
                    borderRadius: '20px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit'
                  }}>{t.label}</button>
                ))}
              </div>
              <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder={newPostType === 'poll' ? 'Anket sorunu yaz...' : 'Ne düşünüyorsun? #hashtag @kullanici'} maxLength={500}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', height: '80px' }} />
              {newPostType === 'poll' && (
                <div style={{ marginTop: '8px' }}>
                  {pollOptions.map((opt, i) => (
                    <input key={i} value={opt} onChange={e => { const newOpts = [...pollOptions]; newOpts[i] = e.target.value; setPollOptions(newOpts); }}
                      placeholder={`Seçenek ${i + 1}`} style={{ width: '100%', background: '#262626', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit', marginBottom: '6px' }} />
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <input type="text" value={newPostImage} onChange={e => setNewPostImage(e.target.value)} placeholder="Görsel linki (opsiyonel)"
                  style={{ flex: 1, background: '#262626', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '12px', outline: 'none', fontFamily: 'inherit' }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8e8e8e', fontSize: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newPostNsfw} onChange={e => setNewPostNsfw(e.target.checked)} style={{ accentColor: '#ed4956' }} /> +18
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <span style={{ color: '#8e8e8e', fontSize: '11px' }}>{newPost.length}/500</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#8e8e8e', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>İptal</button>
                  <button onClick={handleCreatePost} disabled={!newPost.trim()} style={{ background: newPost.trim() ? '#0095f6' : '#1a1a1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Paylaş</button>
                </div>
              </div>
            </div>
          )}

          {/* Gönderi akışı */}
          {posts.map(post => (
            <div key={post.id} style={{ background: '#1a1a1a', borderRadius: '12px', marginBottom: '16px', border: '1px solid #262626', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px' }}>
                <Link to={`/profile/${post.user?.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#fff', flex: 1 }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: post.user?.avatar ? `url(${post.user.avatar}) center/cover` : 'linear-gradient(135deg, #A78BFA, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>{!post.user?.avatar && (post.user?.username?.[0]?.toUpperCase() || 'A')}</div>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{post.user?.username || 'kullanıcı'}</span>
                </Link>
                <span style={{ color: '#8e8e8e', fontSize: '11px' }}>{new Date(post.created_at).toLocaleDateString('tr-TR')}</span>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => { const el = document.getElementById(`menu-${post.id}`); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; }} style={{ background: 'none', border: 'none', color: '#8e8e8e', cursor: 'pointer', fontSize: '16px', fontWeight: 700, padding: '4px' }}>...</button>
                  <div id={`menu-${post.id}`} style={{ display: 'none', position: 'absolute', right: 0, top: 24, background: '#262626', borderRadius: '8px', padding: '4px', zIndex: 10, minWidth: '150px' }}>
                    <button onClick={() => handleReport(post.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#ed4956', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Raporla</button>
                    <button onClick={() => handleBlock(post.user_id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#ed4956', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Engelle</button>
                  </div>
                </div>
              </div>

              {post.image && (
                <div style={{ width: '100%', background: '#000', position: 'relative' }}>
                  <img src={post.image} alt="" style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', filter: post.nsfw ? 'blur(30px)' : 'none' }} />
                  {post.nsfw && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#fff', fontSize: '36px', fontWeight: 700 }}>+18</span>}
                </div>
              )}

              {post.content && (
                <div style={{ padding: '0 14px 10px' }}>
                  <p style={{ color: '#fff', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>{renderContent(post.content)}</p>
                </div>
              )}

              {post.type === 'poll' && post.poll_options && (
                <div style={{ padding: '0 14px 10px' }}>
                  {post.poll_options.map((opt: string, i: number) => (
                    <div key={i} style={{ background: '#262626', borderRadius: '8px', padding: '10px 14px', marginBottom: '6px', cursor: 'pointer', color: '#ccc', fontSize: '13px', border: '1px solid #333' }}>{opt}</div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '14px', padding: '6px 14px' }}>
                <button onClick={() => handleLike(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><HeartIcon filled={likedPosts.has(post.id)} /></button>
                <button onClick={() => loadComments(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><CommentIcon /></button>
                <button onClick={() => navigator.clipboard.writeText(window.location.origin + '/post/' + post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><ShareIcon /></button>
                <button onClick={() => handleBookmark(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginLeft: 'auto' }}><BookmarkIcon saved={savedPosts.has(post.id)} /></button>
              </div>

              {showCommentsFor === post.id && (
                <div style={{ padding: '0 14px 12px', borderTop: '1px solid #262626' }}>
                  {(comments[post.id] || []).map((c: any) => (
                    <p key={c.id} style={{ fontSize: '13px', color: '#ccc', margin: '6px 0' }}><strong style={{ color: '#fff', marginRight: '6px' }}>{c.user_id?.slice(0, 8)}</strong>{c.content}</p>
                  ))}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Yorum ekle..." style={{ flex: 1, background: '#262626', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '12px', outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={() => addComment(post.id)} disabled={!commentText.trim()} style={{ background: 'none', border: 'none', color: '#0095f6', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', opacity: commentText.trim() ? 1 : 0.3 }}>Paylaş</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div id="scroll-sentinel" style={{ height: '1px' }} />

          {posts.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8e8e8e' }}>
              <p style={{ fontSize: '15px' }}>Henüz gönderi yok</p>
              <p style={{ fontSize: '13px' }}>İlk gönderiyi sen paylaş!</p>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p style={{ textAlign: 'center', color: '#8e8e8e', fontSize: '12px', padding: '20px' }}>Tüm gönderileri gördün</p>
          )}
        </div>

        {/* SAĞ PANEL - SADECE PC */}
        {!isMobile && (
          <div style={{ width: '320px', padding: '36px 0 0 20px' }}>
            <Link to="/profile/edit" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', textDecoration: 'none' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: profile.avatar ? `url(${profile.avatar}) center/cover` : 'linear-gradient(135deg, #A78BFA, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>{!profile.avatar && (profile.username?.[0]?.toUpperCase() || 'A')}</div>
              <div>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>{profile.username || 'kullanıcı'}</p>
                <p style={{ color: '#8e8e8e', fontSize: '12px', margin: 0 }}>Anime sever</p>
              </div>
            </Link>

            <p style={{ color: '#8e8e8e', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Trend Animeler</p>
            {animeTrending.slice(0, 5).map((a: any) => (
              <div key={a.mal_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                <img src={a.images?.jpg?.small_image_url || ''} alt="" style={{ width: '34px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', fontSize: '12px', fontWeight: 500, margin: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{a.title}</p>
                  <p style={{ color: '#8e8e8e', fontSize: '10px', margin: '0' }}>Puan: {a.score || '?'}</p>
                </div>
              </div>
            ))}

            <p style={{ color: '#8e8e8e', fontSize: '13px', fontWeight: 600, margin: '20px 0 12px' }}>Önerilenler</p>
            {suggestions.slice(0, 5).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: s.avatar ? `url(${s.avatar}) center/cover` : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '12px' }}>{!s.avatar && (s.username?.[0]?.toUpperCase() || 'A')}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', fontSize: '13px', fontWeight: 500, margin: '0' }}>{s.username}</p>
                  <p style={{ color: '#8e8e8e', fontSize: '11px', margin: '0' }}>Platformda yeni</p>
                </div>
                <button onClick={() => handleFollow(s.id)} style={{ background: 'none', border: 'none', color: '#0095f6', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Takip et</button>
              </div>
            ))}

            <p style={{ fontSize: '11px', color: '#555', marginTop: '30px' }}>&copy; {new Date().getFullYear()} AnimeFox</p>
          </div>
        )}

        {/* MOBIL ALT NAVBAR */}
        {isMobile && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', borderTop: '1px solid #262626', display: 'flex', justifyContent: 'space-around', padding: '8px 0 16px', zIndex: 100 }}>
            {[
              { icon: <HomeIcon />, label: 'Ana Sayfa' },
              { icon: <SearchIcon />, label: 'Keşfet', action: () => navigate('/explore') },
              { icon: <PlusIcon />, label: 'Oluştur', action: () => setShowCreate(true) },
              { icon: <ReelsIcon />, label: 'Reels' },
              { icon: <ProfileIcon />, label: 'Profil', action: () => navigate('/profile/edit') },
            ].map((item, i) => (
              <button key={i} onClick={item.action} style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontFamily: 'inherit', minWidth: '44px', minHeight: '44px', justifyContent: 'center' }}>
                {item.icon}
                <span style={{ fontSize: '10px', color: '#8e8e8e' }}>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}