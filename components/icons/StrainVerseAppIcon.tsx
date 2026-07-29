import React from 'react';

interface StrainVerseAppIconProps {
  size?: number;
  className?: string;
}

/** App mark: cannabis leaf on black with smoke (matches public/logo.svg). */
const StrainVerseAppIcon: React.FC<StrainVerseAppIconProps> = ({ size = 24, className = '' }) => (
  <img
    src="/logo.svg"
    alt=""
    width={size}
    height={size}
    className={`rounded-[22%] object-cover flex-shrink-0 ${className}`}
    aria-hidden="true"
  />
);

export default StrainVerseAppIcon;
