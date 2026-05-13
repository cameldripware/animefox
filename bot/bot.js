const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  'https://xzcgenxbcvkikfbhfjyy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Y2dlbnhiY3ZraWtmYmhmanl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzAwNDgsImV4cCI6MjA5NDEwNjA0OH0.66ipmUxNPpH3db72_3L2LvciK6MgSktHkpe_mr2lxX8'
);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function generateHash(str) { return crypto.createHash('md5').update(str).digest('hex'); }

let TOTAL_INSERTED = 0;
let CYCLE_COUNT = 0;

async function insertQueue(item) {
  if (!item.content || item.content.length < 5) return;
  const hash = generateHash(item.source_url || item.image_url || item.video_url || item.content);
  const { data: exists } = await supabase.from('bot_queue').select('id').eq('content_hash', hash).single();
  if (exists) return;

  const { error } = await supabase.from('bot_queue').insert({
    content: item.content.slice(0, 500),
    image_url: item.image_url || null,
    video_url: item.video_url || null,
    thumbnail_url: item.thumbnail_url || null,
    source: item.source,
    source_url: item.source_url,
    hashtags: item.hashtags || '#anime',
    content_hash: hash
  });

  if (!error) {
    TOTAL_INSERTED++;
    console.log(`  + ${item.source}: ${item.content.slice(0, 50)}...`);
  }
}

// 1. Jikan API (MyAnimeList) - Anime, Manga, Karakter
async function fetchJikan() {
  const endpoints = [
    'top/anime', 'top/manga', 'top/characters',
    'seasons/now', 'seasons/upcoming', 'schedules'
  ];
  for (const endpoint of endpoints) {
    try {
      for (let page = 1; page <= 3; page++) {
        const res = await fetch(`https://api.jikan.moe/v4/${endpoint}?limit=25&page=${page}`);
        if (!res.ok) break;
        const data = await res.json();
        for (const item of (data.data || [])) {
          const title = item.title || item.name || 'Anime';
          await insertQueue({
            content: `${title} - Puan: ${item.score || item.favorites || '?'} | ${item.type || ''}`,
            image_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || null,
            thumbnail_url: item.images?.jpg?.small_image_url || null,
            source: 'MyAnimeList',
            source_url: item.url || '',
            hashtags: '#anime #trend #japon'
          });
        }
        console.log(`  Jikan ${endpoint} sayfa ${page}: ${data.data?.length || 0} icerik`);
        await sleep(800);
      }
    } catch (e) { console.log(`  Jikan ${endpoint} hata: ${e.message}`); }
  }
}

// 2. AniList API
async function fetchAniList() {
  const query = `query ($page: Int, $perPage: Int) { Page(page: $page, perPage: $perPage) { media(type: ANIME, sort: POPULARITY_DESC) { title { romaji english } coverImage { large medium } averageScore siteUrl } } }`;
  try {
    for (let page = 1; page <= 3; page++) {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { page, perPage: 25 } })
      });
      const data = await res.json();
      for (const item of (data.data?.Page?.media || [])) {
        await insertQueue({
          content: `${item.title?.romaji || item.title?.english || 'Anime'} - Puan: ${item.averageScore || '?'}`,
          image_url: item.coverImage?.large || null,
          thumbnail_url: item.coverImage?.medium || null,
          source: 'AniList',
          source_url: item.siteUrl || '',
          hashtags: '#anime #anilist'
        });
      }
      console.log(`  AniList sayfa ${page}: tamam`);
      await sleep(1000);
    }
  } catch (e) { console.log(`  AniList hata: ${e.message}`); }
}

// 3. Kitsu API
async function fetchKitsu() {
  try {
    for (let page = 0; page < 3; page++) {
      const res = await fetch(`https://kitsu.io/api/edge/anime?sort=popularityRank&page[limit]=20&page[offset]=${page * 20}`);
      const data = await res.json();
      for (const item of (data.data || [])) {
        await insertQueue({
          content: `${item.attributes?.canonicalTitle || 'Anime'} - Puan: ${item.attributes?.averageRating || '?'}`,
          image_url: item.attributes?.posterImage?.large || null,
          thumbnail_url: item.attributes?.posterImage?.small || null,
          source: 'Kitsu',
          source_url: `https://kitsu.io/anime/${item.id}`,
          hashtags: '#anime #kitsu'
        });
      }
      console.log(`  Kitsu sayfa ${page}: tamam`);
      await sleep(800);
    }
  } catch (e) { console.log(`  Kitsu hata: ${e.message}`); }
}

// 4. Safebooru (Sınırsız anime görseli)
async function fetchSafebooru() {
  try {
    for (let page = 1; page <= 3; page++) {
      const res = await fetch(`https://safebooru.org/index.php?page=dapi&s=post&q=index&tags=anime&limit=30&pid=${page}`);
      const text = await res.text();
      const matches = text.match(/file_url="([^"]+)"/g) || [];
      for (const match of matches.slice(0, 20)) {
        const url = match.match(/"([^"]+)"/)[1];
        await insertQueue({
          content: 'Anime artwork - Safebooru',
          image_url: url,
          thumbnail_url: url,
          source: 'Safebooru',
          source_url: url,
          hashtags: '#anime #artwork #safebooru'
        });
      }
      console.log(`  Safebooru sayfa ${page}: tamam`);
      await sleep(1000);
    }
  } catch (e) { console.log(`  Safebooru hata: ${e.message}`); }
}

// 5. Konachan API
async function fetchKonachan() {
  try {
    for (let page = 1; page <= 2; page++) {
      const res = await fetch(`https://konachan.com/post.json?tags=anime&limit=20&page=${page}`);
      const data = await res.json();
      for (const item of (data || [])) {
        await insertQueue({
          content: `Anime artwork - ${item.id}`,
          image_url: item.file_url || item.jpeg_url,
          thumbnail_url: item.preview_url || item.sample_url,
          source: 'Konachan',
          source_url: item.source || item.file_url,
          hashtags: '#anime #konachan #art'
        });
      }
      console.log(`  Konachan sayfa ${page}: tamam`);
      await sleep(1000);
    }
  } catch (e) { console.log(`  Konachan hata: ${e.message}`); }
}

// 6. Reddit (22 Subreddit)
async function fetchReddit() {
  const subreddits = [
    'anime', 'amv', 'AnimeART', 'animegifs', 'awwnimate', 'goodanimemes',
    'OnePiece', 'Naruto', 'JuJutsuKaisen', 'DemonSlayer', 'attackontitan', 'ChainsawMan',
    'dbz', 'BokuNoHeroAcademia', 'HunterXHunter', 'anime_irl', 'MemePiece', 'Konosuba',
    'MadokaMagica', 'DarlingInTheFranxx', 'KimetsuNoYaiba', 'ShingekiNoKyojin'
  ];
  for (const sub of subreddits) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=30`, {
        headers: { 'User-Agent': 'AnimeFoxBot/3.0' }
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const post of (data.data?.children || [])) {
        const p = post.data;
        if (p.over_18) continue;
        let imageUrl = null, videoUrl = null;
        let thumb = (p.thumbnail && p.thumbnail.startsWith('http')) ? p.thumbnail : null;

        if (p.url) {
          if (/\.(jpg|jpeg|png|gif)$/i.test(p.url)) imageUrl = p.url;
          else if (p.media?.reddit_video?.fallback_url) videoUrl = p.media.reddit_video.fallback_url.replace(/\?.*/, '');
          else if (p.url.includes('youtube.com') || p.url.includes('youtu.be')) videoUrl = p.url;
          else if (p.url.includes('v.redd.it')) videoUrl = p.url;
        }

        if (imageUrl || videoUrl) {
          await insertQueue({
            content: p.title.slice(0, 400),
            image_url: imageUrl,
            video_url: videoUrl,
            thumbnail_url: thumb,
            source: `Reddit r/${sub}`,
            source_url: `https://reddit.com${p.permalink}`,
            hashtags: '#anime #reddit #edit'
          });
        }
      }
      console.log(`  Reddit r/${sub}: tamam`);
      await sleep(1500);
    } catch (e) { console.log(`  Reddit r/${sub} hata: ${e.message}`); }
  }
}

// 7. Imgur
async function fetchImgur() {
  const tags = ['anime', 'animeart', 'animememes', 'animegirl', 'amv', 'weeb', 'otaku'];
  for (const tag of tags) {
    try {
      const res = await fetch(`https://api.imgur.com/3/gallery/t/${tag}/top/week/1`, {
        headers: { 'Authorization': 'Client-ID 546c25a59c58ad7' }
      });
      const data = await res.json();
      for (const item of (data.data?.items || []).slice(0, 15)) {
        let imageUrl = null, videoUrl = null;
        const img = item.images?.[0];
        if (img?.type === 'video/mp4') videoUrl = img.link;
        else imageUrl = img?.link || item.link;
        if (imageUrl || videoUrl) {
          await insertQueue({
            content: (item.title || 'Anime').slice(0, 300),
            image_url: imageUrl,
            video_url: videoUrl,
            thumbnail_url: img?.link || null,
            source: 'Imgur',
            source_url: item.link || '',
            hashtags: `#anime #imgur #${tag}`
          });
        }
      }
      console.log(`  Imgur ${tag}: tamam`);
      await sleep(1500);
    } catch (e) { console.log(`  Imgur ${tag} hata: ${e.message}`); }
  }
}

// 8. Tenor (GIF)
async function fetchTenor() {
  const queries = ['anime', 'anime edit', 'anime fight', 'amv', 'anime moment'];
  for (const q of queries) {
    try {
      const res = await fetch(`https://tenor.googleapis.com/v2/search?q=${q}&key=AIzaSyD-3P7vkmHX6O4H7mGmYw6JzeZ9vbZu_U0&limit=20`);
      const data = await res.json();
      for (const item of (data.results || [])) {
        await insertQueue({
          content: item.title || 'Anime GIF',
          image_url: item.media_formats?.gif?.url || null,
          thumbnail_url: item.media_formats?.tinygif?.url || null,
          source: 'Tenor',
          source_url: item.url || '',
          hashtags: '#anime #gif'
        });
      }
      console.log(`  Tenor ${q}: tamam`);
      await sleep(1500);
    } catch (e) { console.log(`  Tenor ${q} hata: ${e.message}`); }
  }
}

// 9. Wallhaven (Duvar kağıtları)
async function fetchWallhaven() {
  try {
    for (let page = 1; page <= 2; page++) {
      const res = await fetch(`https://wallhaven.cc/api/v1/search?q=anime&sorting=toplist&purity=sfw&page=${page}`);
      const data = await res.json();
      for (const item of (data.data || []).slice(0, 20)) {
        await insertQueue({
          content: `Duvar Kagidi: ${item.id} | ${item.resolution}`,
          image_url: item.path,
          thumbnail_url: item.thumbs?.large || item.path,
          source: 'Wallhaven',
          source_url: item.url || '',
          hashtags: '#anime #wallpaper'
        });
      }
      console.log(`  Wallhaven sayfa ${page}: tamam`);
      await sleep(1000);
    }
  } catch (e) { console.log(`  Wallhaven hata: ${e.message}`); }
}

// 10. YouTube API (Kısa videolar, editler)
async function fetchYouTube() {
  const API_KEY = 'AIzaSyD-3P7vkmHX6O4H7mGmYw6JzeZ9vbZu_U0';
  const queries = ['anime edit', 'anime amv', 'best anime moments', 'anime fight scene', 'anime trailer 2026'];
  for (const q of queries) {
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(q)}&type=video&videoDuration=short&key=${API_KEY}`);
      const data = await res.json();
      for (const item of (data.items || [])) {
        await insertQueue({
          content: item.snippet?.title || 'Anime Video',
          video_url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
          thumbnail_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
          source: 'YouTube',
          source_url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
          hashtags: '#anime #video #youtube'
        });
      }
      console.log(`  YouTube ${q}: tamam`);
      await sleep(2000);
    } catch (e) { console.log(`  YouTube ${q} hata: ${e.message}`); }
  }
}

// ==========================================
// SÜREKLİ ANA DÖNGÜ
// ==========================================
async function eternalLoop() {
  console.clear();
  console.log('╔══════════════════════════════════════╗');
  console.log('║     ANIMEFOX NIRVANA BOT AKTIF      ║');
  console.log('║     7/24 Surekli Icerik Cekiyor      ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
  
  while (true) {
    CYCLE_COUNT++;
    console.log(`\n=== DONGU #${CYCLE_COUNT} [${new Date().toLocaleTimeString('tr-TR')}] ===`);
    console.log('----------------------------------------');
    
    await fetchJikan();
    await sleep(2000);
    await fetchAniList();
    await sleep(1000);
    await fetchKitsu();
    await sleep(1000);
    await fetchSafebooru();
    await sleep(2000);
    await fetchKonachan();
    await sleep(2000);
    await fetchReddit();
    await sleep(2000);
    await fetchImgur();
    await sleep(2000);
    await fetchTenor();
    await sleep(2000);
    await fetchWallhaven();
    await sleep(2000);
    await fetchYouTube();
    
    const { count } = await supabase.from('bot_queue').select('*', { count: 'exact', head: true });
    console.log('----------------------------------------');
    console.log(`>>> TOPLAM IÇERIK: ${count || 0} | Bu dongude eklenen: ${TOTAL_INSERTED}`);
    console.log(`>>> Sonraki dongu: 10 saniye sonra...`);
    TOTAL_INSERTED = 0;
    await sleep(10000);
  }
}

eternalLoop();