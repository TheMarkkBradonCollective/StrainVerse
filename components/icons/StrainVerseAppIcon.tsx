import React from 'react';

interface StrainVerseAppIconProps {
  size?: number;
  className?: string;
}

/** App mark: bong pass + lit joint pass, SpiritsVerse illustration (public/logo-master.png). */
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
