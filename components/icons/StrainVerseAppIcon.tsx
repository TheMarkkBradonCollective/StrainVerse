import React from 'react';

interface StrainVerseAppIconProps {
  size?: number;
  className?: string;
}

/** App mark: hands holding buds on black with smoke (matches public/logo-master.png). */
const StrainVerseAppIcon: React.FC<StrainVerseAppIconProps> = ({ size = 24, className = '' }) => (
  <img
    src="/pwa-192.png"
    alt=""
    width={size}
    height={size}
    className={`rounded-[22%] object-cover flex-shrink-0 ${className}`}
    aria-hidden="true"
  />
);

export default StrainVerseAppIcon;
