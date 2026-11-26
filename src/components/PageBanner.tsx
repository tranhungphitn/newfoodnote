import React, {useState} from 'react';
import {ChefHat} from 'lucide-react';

interface PageBannerProps {
  src: string;
  alt: string;
  accent?: 'orange' | 'blue' | 'green' | 'black';
}

const FALLBACK_BG: Record<NonNullable<PageBannerProps['accent']>, string> = {
  orange: 'from-[#FFF7ED] via-[#F7F7F5] to-[#FEF2F2]',
  blue: 'from-[#EFF6FF] via-[#F7F7F5] to-[#F0F9FF]',
  green: 'from-[#ECFDF5] via-[#F7F7F5] to-[#FFF7ED]',
  black: 'from-[#F7F7F5] via-[#FFFFFF] to-[#FFF7ED]',
};

const FALLBACK_ICON: Record<NonNullable<PageBannerProps['accent']>, string> = {
  orange: 'text-[#EA580C]',
  blue: 'text-[#1D4ED8]',
  green: 'text-[#047857]',
  black: 'text-[#111110]',
};

export const PageBanner: React.FC<PageBannerProps> = ({src, alt, accent = 'orange'}) => {
  const [failed, setFailed] = useState(false);

  return (
    <section className="overflow-hidden border border-[#E4E4E0] bg-[#F7F7F5]">
      {!failed ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-[116px] w-full object-cover object-center sm:h-[150px]"
        />
      ) : (
        <div
          className={`flex h-[116px] w-full items-center justify-center bg-gradient-to-r sm:h-[150px] ${FALLBACK_BG[accent]}`}
        >
          <ChefHat className={`h-7 w-7 ${FALLBACK_ICON[accent]}`} />
        </div>
      )}
    </section>
  );
};
