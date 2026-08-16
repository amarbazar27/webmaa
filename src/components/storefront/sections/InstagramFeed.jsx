'use client';
export default function InstagramFeed({ data }) {
  const embedUrl = data?.embedUrl;
  if (!embedUrl) return null;

  return (
    <div className="px-4 py-5">
      <h2 className="text-base font-black text-slate-900 mb-4">{data?.title || '📸 Instagram Feed'}</h2>
      <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
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
    </div>
  );
}
