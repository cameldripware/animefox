import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Post {
  id: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  source: string | null;
  source_url: string | null;
  hashtags: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profiles?: { username: string | null; avatar: string | null } | null;
}

interface Profile {
  id: string;
  username: string | null;
  avatar: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helper functions                                                   */
/* ------------------------------------------------------------------ */
function parseHashtags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    return raw
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t.startsWith('#'))
      .slice(0, 10);
  } catch {
    return [];
  }
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'şimdi';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}dk`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}s`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}g`;
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

/* ------------------------------------------------------------------ */
/*  SVG Icons (no emoji)                                               */
/* ------------------------------------------------------------------ */
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconPlay = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" opacity="0.85">
    <polygon points="6,3 20,12 6,21" />
  </svg>
);

const IconHeart = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#ed4956' : 'none'} stroke={filled ? '#ed4956' : '#fff'} strokeWidth="1.6">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const IconComment = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </svg>
);

const IconBookmark = ({ saved }: { saved: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={saved ? '#fff' : 'none'} stroke="#fff" strokeWidth="1.6">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

const IconShare = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IconChevronLeft = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.55)" />
    <polyline points="14,7 8,12 14,17" stroke="#fff" strokeWidth="2" fill="none" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.55)" />
    <polyline points="10,7 16,12 10,17" stroke="#fff" strokeWidth="2" fill="none" />
  </svg>
);

const IconClose = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function Explore() {
  /* ---- state ---- */
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [commentText, setCommentText] = useState('');

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadedMedia, setLoadedMedia] = useState<Set<string>>(new Set());

  /* ---- refs ---- */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  /* ---- derived ---- */
  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeTag) {
      result = result.filter(
        (p) => p.hashtags && p.hashtags.toLowerCase().includes(activeTag.toLowerCase())
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          (p.content && p.content.toLowerCase().includes(q)) ||
          (p.hashtags && p.hashtags.toLowerCase().includes(q)) ||
          (p.source && p.source.toLowerCase().includes(q))
      );
    }
    return result;
  }, [posts, activeTag, search]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => parseHashtags(p.hashtags).forEach((t) => set.add(t)));
    return Array.from(set).slice(0, 20);
  }, [posts]);

  /* ---- fetch posts ---- */
  const fetchPosts = useCallback(async (page: number, append = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const from = (page - 1) * 12;
      const to = from + 11;
      const { data, error: err } = await supabase
        .from('bot_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (err) throw err;
      if (!mountedRef.current) return;

      const newPosts = (data || []) as Post[];
      if (append) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const unique = newPosts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...unique];
        });
      } else {
        setPosts(newPosts);
      }
      hasMoreRef.current = newPosts.length === 12;
    } catch (e: any) {
      if (mountedRef.current) setError(e.message || 'Gönderiler yüklenemedi');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  }, []);

  const fetchComments = useCallback(async (postId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('comments')
        .select('*, profiles(username, avatar)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (err) throw err;
      if (!mountedRef.current) return;

      const comments = (data || []) as Comment[];
      setCommentsMap((prev) => ({ ...prev, [postId]: comments }));

      const newProfiles: Record<string, Profile> = {};
      comments.forEach((c) => {
        if (c.profiles && c.user_id) {
          newProfiles[c.user_id] = {
            id: c.user_id,
            username: c.profiles.username,
            avatar: c.profiles.avatar,
          };
        }
      });
      if (Object.keys(newProfiles).length > 0) {
        setProfilesMap((prev) => ({ ...prev, ...newProfiles }));
      }
    } catch {}
  }, []);

  /* ---- initial load ---- */
  useEffect(() => {
    mountedRef.current = true;
    fetchPosts(1);
    return () => {
      mountedRef.current = false;
    };
  }, [fetchPosts]);

  /* ---- realtime subscriptions ---- */
  useEffect(() => {
    const postChannel = supabase
      .channel('explore-posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bot_queue' },
        (payload) => {
          const newPost = payload.new as Post;
          setPosts((prev) => {
            if (prev.some((p) => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bot_queue' },
        (payload) => {
          const updated = payload.new as Post;
          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'bot_queue' },
        (payload) => {
          const deletedId = payload.old?.id;
          if (deletedId) setPosts((prev) => prev.filter((p) => p.id !== deletedId));
        }
      )
      .subscribe();

    const commentChannel = supabase
      .channel('explore-comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
          const newComment = payload.new as Comment;
          setCommentsMap((prev) => {
            const existing = prev[newComment.post_id] || [];
            if (existing.some((c) => c.id === newComment.id)) return prev;
            return { ...prev, [newComment.post_id]: [...existing, newComment] };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments' },
        (payload) => {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setCommentsMap((prev) => {
              const next = { ...prev };
              Object.keys(next).forEach((postId) => {
                next[postId] = next[postId].filter((c) => c.id !== deletedId);
              });
              return next;
            });
          }
        }
      )
      .subscribe();

    const profileChannel = supabase
      .channel('explore-profiles')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updated = payload.new as Profile;
          setProfilesMap((prev) => ({ ...prev, [updated.id]: updated }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postChannel);
      supabase.removeChannel(commentChannel);
      supabase.removeChannel(profileChannel);
    };
  }, []);

  /* ---- infinite scroll ---- */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          const nextPage = pageRef.current + 1;
          pageRef.current = nextPage;
          fetchPosts(nextPage, true);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchPosts, allLoaded]);

  /* ---- media loaded tracking ---- */
  const onMediaLoad = useCallback(
    (postId: string) => {
      setLoadedMedia((prev) => {
        const next = new Set(prev);
        next.add(postId);
        if (next.size >= filteredPosts.length && filteredPosts.length > 0) {
          setAllLoaded(true);
        }
        return next;
      });
    },
    [filteredPosts.length]
  );

  useEffect(() => {
    setAllLoaded(false);
    setLoadedMedia(new Set());
  }, [filteredPosts]);

  /* ---- comment submission ---- */
  const submitComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from('comments').insert({
      user_id: user.id,
      post_id: selectedPost.id,
      content: commentText.trim(),
    });
    if (!err) {
      setCommentText('');
      fetchComments(selectedPost.id);
    }
  };

  /* ---- navigation ---- */
  const openModal = (post: Post, idx: number) => {
    setSelectedPost(post);
    setSelectedIdx(idx);
    fetchComments(post.id);
  };

  const closeModal = () => setSelectedPost(null);

  const goNext = () => {
    if (selectedIdx < filteredPosts.length - 1) {
      const next = selectedIdx + 1;
      setSelectedIdx(next);
      setSelectedPost(filteredPosts[next]);
      fetchComments(filteredPosts[next].id);
    }
  };

  const goPrev = () => {
    if (selectedIdx > 0) {
      const prev = selectedIdx - 1;
      setSelectedIdx(prev);
      setSelectedPost(filteredPosts[prev]);
      fetchComments(filteredPosts[prev].id);
    }
  };

  /* ---- keyboard ---- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedPost) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedPost, selectedIdx, filteredPosts]);

  /* ---- responsive ---- */
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ---- render helpers ---- */
  const renderMedia = (post: Post, inGrid = true, index = 0) => {
    const mediaUrl = post.video_url || post.image_url || post.thumbnail_url;
    if (!mediaUrl) return null;

    const loaded = loadedMedia.has(post.id);
    const isHighPriority = index < 8; // ilk 8 karta öncelik
    const style: React.CSSProperties = {
      width: '100%',
      height: '100%',
      objectFit: inGrid ? 'cover' : 'contain',
      opacity: loaded ? 1 : 0,
      transition: 'opacity 0.4s ease',
      background: '#1a1a1a',
    };

    if (post.video_url) {
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <video
            src={post.video_url}
            poster={post.thumbnail_url || undefined}
            preload={isHighPriority ? 'auto' : 'metadata'}
            controls={!inGrid}
            autoPlay={!inGrid}
            playsInline
            muted={inGrid}
            onLoadedData={() => onMediaLoad(post.id)}
            style={style}
          />
          {inGrid && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            >
              <IconPlay />
            </div>
          )}
        </div>
      );
    }

    return (
      <img
        src={mediaUrl}
        alt={post.content || 'Gönderi görseli'}
        loading="lazy"
        decoding="async"
        fetchpriority={isHighPriority ? 'high' : 'auto'}
        onLoad={() => onMediaLoad(post.id)}
        onError={() => onMediaLoad(post.id)}
        style={style}
      />
    );
  };

  /* ---- main render ---- */
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* ---------- HERO ---------- */}
      <section
        style={{
          position: 'relative',
          padding: isMobile ? '60px 16px 32px' : '80px 32px 48px',
          textAlign: 'center',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(236,72,153,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(168,85,247,0.08) 0%, transparent 50%)',
          borderBottom: '1px solid #262626',
        }}
      >
        <h1
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: isMobile ? '2.5rem' : '3.5rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #A78BFA, #EC4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 8px',
          }}
        >
          AnimeFox
        </h1>
        <p
          style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: '#8e8e8e',
            margin: '0 0 8px',
            fontWeight: 400,
          }}
        >
          Keşfet
        </p>
        <p
          style={{
            fontSize: '0.9rem',
            color: '#6b6b6b',
            margin: '0 0 24px',
            maxWidth: 480,
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.5,
          }}
        >
          Anime dünyasından seçkin anlar, editler ve sanat eserleri.
        </p>

        {/* search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: 520,
            margin: '0 auto 16px',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 12,
            padding: '0 16px',
          }}
        >
          <IconSearch />
          <input
            type="text"
            placeholder="Gönderi, hashtag veya kaynak ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 15,
              padding: '14px 0',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* tags */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 8,
            maxWidth: 600,
            margin: '0 auto',
          }}
        >
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              style={{
                background: activeTag === tag ? '#EC4899' : '#1a1a1a',
                border: activeTag === tag ? 'none' : '1px solid #333',
                color: activeTag === tag ? '#fff' : '#8e8e8e',
                borderRadius: 20,
                padding: '6px 16px',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* ---------- CONTENT AREA ---------- */}
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: isMobile ? '16px 8px' : '24px 16px',
        }}
      >
        {/* loading */}
        {loading && posts.length === 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div
              style={{
                width: 36,
                height: 36,
                border: '4px solid #333',
                borderTopColor: '#EC4899',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        )}

        {/* error */}
        {error && !loading && (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              color: '#ef4444',
              background: '#1a1a1a',
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            <p style={{ margin: 0 }}>{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchPosts(1);
              }}
              style={{
                marginTop: 12,
                background: '#EC4899',
                border: 'none',
                color: '#fff',
                borderRadius: 8,
                padding: '8px 20px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Tekrar dene
            </button>
          </div>
        )}

        {/* empty */}
        {!loading && !error && filteredPosts.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 80,
              color: '#8e8e8e',
            }}
          >
            <p style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>
              Henüz gönderi yok
            </p>
            <p style={{ fontSize: 14, margin: 0 }}>
              Bot çalıştığında anime içerikleri burada görünecek.
            </p>
          </div>
        )}

        {/* grid / mobile feed */}
        {filteredPosts.length > 0 && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? 'repeat(2, 1fr)'
                  : 'repeat(4, 1fr)',
                gap: isMobile ? 6 : 12,
              }}
            >
              {filteredPosts.map((post, idx) => (
                <div
                  key={post.id}
                  onClick={() => openModal(post, idx)}
                  style={{
                    aspectRatio: '1 / 1',
                    background: '#1a1a1a',
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'transform 0.2s ease',
                    contentVisibility: 'auto',
                    containIntrinsicSize: '300px',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      'scale(1)';
                  }}
                >
                  {renderMedia(post, true, idx)}
                </div>
              ))}
            </div>

            {/* global spinner at bottom */}
            {!allLoaded && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 40,
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    border: '4px solid #333',
                    borderTopColor: '#EC4899',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span style={{ color: '#8e8e8e', fontSize: 13 }}>
                  {loadedMedia.size} / {filteredPosts.length} içerik yükleniyor...
                </span>
              </div>
            )}

            {/* sentinel */}
            <div ref={sentinelRef} style={{ height: 1 }} />
          </>
        )}
      </section>

      {/* ---------- MODAL (desktop / mobile overlay) ---------- */}
      {selectedPost && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.96)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
          onClick={closeModal}
        >
          {/* close */}
          <button
            onClick={closeModal}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <IconClose />
          </button>

          {/* prev */}
          {selectedIdx > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              style={{
                position: 'absolute',
                left: isMobile ? 8 : 24,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              <IconChevronLeft />
            </button>
          )}

          {/* next */}
          {selectedIdx < filteredPosts.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              style={{
                position: 'absolute',
                right: isMobile ? 8 : 24,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              <IconChevronRight />
            </button>
          )}

          {/* content */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: isMobile ? '100%' : '85%',
              maxWidth: 560,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
            }}
          >
            {/* media */}
            <div
              style={{
                width: '100%',
                maxHeight: isMobile ? '50vh' : '65vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000',
              }}
            >
              {renderMedia(selectedPost, false)}
            </div>

            {/* info & actions */}
            <div style={{ padding: 20, background: '#111' }}>
              <div
                style={{
                  display: 'flex',
                  gap: 18,
                  marginBottom: 14,
                }}
              >
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <IconHeart filled={false} />
                </button>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <IconComment />
                </button>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <IconShare />
                </button>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    marginLeft: 'auto',
                  }}
                >
                  <IconBookmark saved={false} />
                </button>
              </div>

              {selectedPost.content && (
                <p
                  style={{
                    fontSize: 14,
                    color: '#ccc',
                    lineHeight: 1.5,
                    margin: '0 0 6px',
                  }}
                >
                  {selectedPost.content}
                </p>
              )}

              <p
                style={{
                  fontSize: 12,
                  color: '#8e8e8e',
                  margin: '0 0 12px',
                }}
              >
                {selectedPost.source
                  ? `Kaynak: ${selectedPost.source}`
                  : ''}
                {selectedPost.created_at
                  ? ` · ${relativeTime(selectedPost.created_at)}`
                  : ''}
              </p>

              {/* comments */}
              <div
                style={{
                  borderTop: '1px solid #262626',
                  paddingTop: 14,
                }}
              >
                {(commentsMap[selectedPost.id] || []).slice(0, 5).map((c) => {
                  const profile = c.profiles || profilesMap[c.user_id];
                  return (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: profile?.avatar
                            ? `url(${profile.avatar}) center/cover`
                            : '#333',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <span
                          style={{ fontWeight: 600, fontSize: 13, marginRight: 6 }}
                        >
                          {profile?.username || c.user_id?.slice(0, 8)}
                        </span>
                        <span style={{ fontSize: 13, color: '#ccc' }}>
                          {c.content}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Yorum yaz..."
                    style={{
                      flex: 1,
                      background: '#262626',
                      border: 'none',
                      borderRadius: 20,
                      padding: '10px 16px',
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={submitComment}
                    disabled={!commentText.trim()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0095f6',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      opacity: commentText.trim() ? 1 : 0.3,
                      fontFamily: 'inherit',
                    }}
                  >
                    Paylaş
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}