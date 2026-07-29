import React from 'react';

interface StrainVerseAppIconProps {
  size?: number;
  className?: string;
}

/** App mark: SpiritsVerse-style illustration — three hands passing a joint (public/logo-master.png). */
const StrainVerseAppIcon: React.FC<StrainVerseAppIconProps> = ({ size = 24, className = '' }) => (
  <img
    src="/pwa-192.png"
    alt=""
    width={size}
    height={size}
    className={`object-contain flex-shrink-0 ${className}`}
    aria-hidden="true"
  />
);

export default StrainVerseAppIcon;
