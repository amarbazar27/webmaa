'use client';
import { useState } from 'react';
import { Play, X } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

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
  const d = resolveSectionData('video_reels', data);
  const [activeVideo, setActiveVideo] = useState(null);
  const primary = themeVars?.primaryColor || '#6D28D9';
  const reels = d?.urls || [];

  if (!reels.length) return null;

  return (
    <div className="px-4 py-6 md:py-8 max-w-[1400px] mx-auto">
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 tracking-tight">
        {d?.title || '🎬 Video Reels'}
      </h2>
      <p className="text-xs text-slate-500 font-medium mb-4">ভিডিও দেখে জেনে নিন পণ্যের বিস্তারিত</p>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none">
        {reels.map((reel, i) => (
          <button
            key={i}
            onClick={() => setActiveVideo(reel)}
            className="flex-shrink-0 w-36 sm:w-44 md:w-52 rounded-3xl overflow-hidden relative group cursor-pointer shadow-md bg-slate-950 aspect-[9/16]"
          >
            {/* Thumbnail */}
            <div className="w-full h-full">
              {reel.thumbnail ? (
                <img
                  src={reel.thumbnail}
                  alt={reel.title || `Reel ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: `${primary}20` }}>
                  <Play size={32} style={{ color: primary }} />
                </div>
              )}
            </div>

            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Play size={18} fill={primary} style={{ color: primary, marginLeft: 2 }} />
              </div>
            </div>

            {reel.title && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-white text-xs font-bold line-clamp-2 text-left leading-snug">{reel.title}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div 
          className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" 
          onClick={() => setActiveVideo(null)}
        >
          <div className="relative w-full max-w-sm aspect-[9/16]" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setActiveVideo(null)} 
              className="absolute -top-10 right-0 text-white hover:text-slate-300 transition-colors p-2"
            >
              <X size={24} />
            </button>
            <iframe
              src={getEmbedUrl(activeVideo.url)}
              className="w-full h-full rounded-3xl"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
