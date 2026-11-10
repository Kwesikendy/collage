import { useId } from 'react';
import collageLogo from '../assets/collage-logo.png';

export function Brand({
  inverse = false,
  dark = false,
  className = '',
}: {
  inverse?: boolean;
  dark?: boolean;
  className?: string;
}) {
  const filterId = useId();

  if (dark) {
    return (
      <div
        className={`inline-flex items-center transition-transform duration-200 hover:scale-[1.02] ${className}`}
      >
        <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="
                  -0.077 0 0 0 0.967
                  -1.044 0 0 0 1.077
                  -0.968 0 0 0 1.040
                  0      0 0 1 0
                "
              />
            </filter>
          </defs>
        </svg>
        <img
          src={collageLogo}
          alt="Collage · Creating Results"
          style={{ filter: `url(#${filterId})` }}
          className="h-8 md:h-9 w-auto object-contain"
        />
      </div>
    );
  }

  return inverse ? (
    <div
      className={`inline-flex items-center rounded-xl bg-white px-3.5 py-1.5 shadow-sm transition-transform duration-200 hover:scale-[1.02] ${className}`}
    >
      <img src={collageLogo} alt="Collage · Creating Results" className="h-7 w-auto object-contain" />
    </div>
  ) : (
    <div className={`inline-flex items-center transition-transform duration-200 hover:scale-[1.02] ${className}`}>
      <img src={collageLogo} alt="Collage · Creating Results" className="h-8 md:h-9 w-auto object-contain" />
    </div>
  );
}
