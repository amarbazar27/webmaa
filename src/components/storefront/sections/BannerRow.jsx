'use client';
export default function BannerRow({ data }) {
  const banners = data?.banners || [];
  if (!banners.length) return null;
  const cols = banners.length === 1 ? 'grid-cols-1' : banners.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3';

  return (
    <div className={`px-4 py-3 grid ${cols} gap-3`}>
      {banners.map((b, i) => (
        <a key={i} href={b.linkUrl || '#'} className="block rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]">
          <img src={b.imageUrl} alt={b.title || `Banner ${i + 1}`} className="w-full h-28 md:h-40 object-cover" />
        </a>
      ))}
    </div>
  );
}
