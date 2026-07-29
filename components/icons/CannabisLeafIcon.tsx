import React from 'react';

interface CannabisLeafIconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/** Minimal line-art cannabis leaf matching the Verse app icon family. */
const CannabisLeafIcon: React.FC<CannabisLeafIconProps> = ({
  size = 24,
  strokeWidth = 2,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 22v-5.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M12 16.5V6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    <path
      d="M12 6c-.7-1.8-1-3.4-.8-5.2M12 6c.7-1.8 1-3.4.8-5.2"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 8.2c-2.8-1.1-5.1-2.8-6.8-5M12 8.2c2.8-1.1 5.1-2.8 6.8-5"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 10.5c-3.6-.5-6.8.2-9.2 2.5M12 10.5c3.6-.5 6.8.2 9.2 2.5"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12.8c-3.1 1-5.6 2.8-7.2 5.2M12 12.8c3.1 1 5.6 2.8 7.2 5.2"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 14.8c-2.4 1.6-4.2 3.4-5 5.5M12 14.8c2.4 1.6 4.2 3.4 5 5.5"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CannabisLeafIcon;
