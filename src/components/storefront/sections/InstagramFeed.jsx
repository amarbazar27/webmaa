'use client';
import { ExternalLink, Camera } from 'lucide-react';
import { resolveSectionData } from '@/lib/homepageDemoData';

function InstagramIcon({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function InstagramFeed({ data }) {
  const d = resolveSectionData('instagram_feed', data);
  const embedUrl = d?.embedUrl;

  const sampleInstaPhotos = [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
  ];

  return (
    <div className="px-4 py-6 md:py-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <InstagramIcon size={18} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {d?.title || 'Instagram Feed'}
          </h2>
        </div>

        <a
          href={embedUrl?.startsWith('http') ? embedUrl : 'https://instagram.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-black text-purple-600 hover:text-purple-700 flex items-center gap-1"
        >
          <span>Follow Us</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {embedUrl && embedUrl.includes('elfsight') ? (
        <div className="rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          <iframe
            src={embedUrl}
            className="w-full"
            height="400"
            frameBorder="0"
            scrolling="no"
            allowTransparency
            title="Instagram Feed"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {sampleInstaPhotos.map((photo, i) => (
            <a
              key={i}
              href={embedUrl?.startsWith('http') ? embedUrl : 'https://instagram.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-3xl overflow-hidden aspect-square shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <img
                src={photo}
                alt="Instagram post"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <InstagramIcon size={24} />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
