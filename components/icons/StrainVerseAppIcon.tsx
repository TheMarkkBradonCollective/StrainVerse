import React from 'react';

interface StrainVerseAppIconProps {
  size?: number;
  className?: string;
}

/** App mark: cannabis toast — bong, joint, pipe, dab rig + dab tool (no wax pen). */
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
