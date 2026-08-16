'use client';
import { useState } from 'react';
import { Play, X } from 'lucide-react';

function getEmbedUrl(url) {
  if (!url) return null;
  // YouTube Shorts
  if (url.includes('youtube.com/shorts/')) {
    const id = url.split('/shorts/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  }
  // YouTube regular
  if (url.includes('youtube.com/watch')) {
    const id = new URL(url).searchParams.get('v');
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  }
  // YouTube youtu.be
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  }
  // TikTok
  if (url.includes('tiktok.com')) {
    const id = url.match(/video\/(\d+)/)?.[1];
    if (id) return `https://www.tiktok.com/embed/v2/${id}`;
  }
  // Instagram Reel
  if (url.includes('instagram.com/reel/') || url.includes('instagram.com/p/')) {
    const id = url.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/)?.[1];
    if (id) return `https://www.instagram.com/p/${id}/embed/`;
  }
  return url;
}

export default function VideoReels({ data, themeVars }) {
  const [activeVideo, setActiveVideo] = useState(null);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const reels = (data?.urls || []).filter(r => r.url);

  if (!reels.length) return null;

  return (
    <div className="px-4 py-5">
      <h2 className="text-base font-black text-slate-900 mb-1">{data?.title || '🎬 Video Reels'}</h2>
      <p className="text-xs text-slate-500 font-medium mb-4">দেখুন এবং কিনুন</p>

      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {reels.map((reel, i) => (
          <button
            key={i}
            onClick={() => setActiveVideo(reel)}
            className="flex-shrink-0 w-32 md:w-40 rounded-2xl overflow-hidden relative group cursor-pointer shadow-md"
            style={{ aspectRatio: '9/16' }}
          >
            {/* Thumbnail */}
            <div className="w-full h-full bg-slate-900">
              {reel.thumbnail ? (
                <img src={reel.thumbnail} alt={reel.title || `Reel ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: primary + '20' }}>
                  <Play size={32} style={{ color: primary }} />
                </div>
              )}
            </div>
            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play size={18} fill={primary} style={{ color: primary, marginLeft: 2 }} />
              </div>
            </div>
            {reel.title && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-[10px] font-bold line-clamp-2 text-left">{reel.title}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4" onClick={() => setActiveVideo(null)}>
          <div className="relative w-full max-w-sm" style={{ aspectRatio: '9/16' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setActiveVideo(null)} className="absolute -top-10 right-0 text-white hover:text-slate-300 transition-colors">
              <X size={24} />
            </button>
            <iframe
              src={getEmbedUrl(activeVideo.url)}
              className="w-full h-full rounded-2xl"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
