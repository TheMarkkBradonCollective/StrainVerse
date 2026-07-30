import React from 'react';

interface StrainVerseAppIconProps {
  size?: number;
  className?: string;
}

/** App mark: SpiritsVerse comic cheers toast — bong, joint, pipe, dab rig (public/logo-master.png). */
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
