import collageLogo from '../assets/collage-logo.png';
import collageLogoWhite from '../assets/collage-logo-white.png';

export function Brand({
  inverse = false,
  dark = false,
  white = false,
  className = '',
}: {
  inverse?: boolean;
  dark?: boolean;
  white?: boolean;
  className?: string;
}) {
  if (dark || white) {
    return (
      <div className={`inline-flex items-center shrink-0 ${className}`}>
        <img
          src={collageLogoWhite}
          alt="Collage"
          className="h-6 sm:h-8 md:h-9 w-auto max-w-[100px] sm:max-w-none object-contain"
        />
      </div>
    );
  }

  return inverse ? (
    <div
      className={`inline-flex items-center rounded-xl bg-white px-3 py-1.5 shadow-sm shrink-0 ${className}`}
    >
      <img
        src={collageLogo}
        alt="Collage · Creating Results"
        className="h-6 sm:h-7 w-auto max-w-[105px] sm:max-w-none object-contain"
      />
    </div>
  ) : (
    <div className={`inline-flex items-center shrink-0 ${className}`}>
      <img
        src={collageLogo}
        alt="Collage · Creating Results"
        className="h-6 sm:h-8 md:h-9 w-auto max-w-[105px] sm:max-w-none object-contain"
      />
    </div>
  );
}
