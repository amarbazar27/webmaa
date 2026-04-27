import Link from 'next/link';

export default function Logo({ href = "/", className = "" }) {
  return (
    <Link href={href} className={`flex items-center gap-2 group ${className}`}>
      <img 
        src="/logo.png" 
        alt="Messer Bazar" 
        // Using object-contain ensures it doesn't get distorted
        // drop-shadow gives subtle contrast on light/dark backgrounds
        className="h-[35px] md:h-[45px] w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
      />
      <span className="text-xl md:text-2xl font-black text-inherit tracking-tight whitespace-nowrap">
        Messer Bazar
      </span>
    </Link>
  );
}
