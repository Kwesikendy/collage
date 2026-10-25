import collageLogo from '../assets/collage-logo.png';

export function Brand({ inverse = false, className = '' }: { inverse?: boolean; className?: string }) {
  return inverse ? (
    <div className={`inline-flex items-center rounded-xl bg-white px-3.5 py-1.5 shadow-sm transition-transform duration-200 hover:scale-[1.02] ${className}`}>
      <img src={collageLogo} alt="Collage · Creating Results" className="h-7 w-auto object-contain" />
    </div>
  ) : (
    <div className={`inline-flex items-center transition-transform duration-200 hover:scale-[1.02] ${className}`}>
      <img src={collageLogo} alt="Collage · Creating Results" className="h-8 md:h-9 w-auto object-contain" />
    </div>
  );
}
