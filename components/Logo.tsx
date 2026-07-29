import React from 'react';
import StrainVerseAppIcon from './icons/StrainVerseAppIcon';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

const iconSizes: Record<LogoSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 64,
};

const markBox: Record<LogoSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-16 h-16',
};

export const LogoMark: React.FC<{ size?: LogoSize; className?: string }> = ({ size = 'md', className = '' }) => (
  <span className={`${markBox[size]} inline-flex flex-shrink-0 ${className}`} aria-hidden="true">
    <StrainVerseAppIcon size={iconSizes[size]} className="w-full h-full shadow-[var(--shadow-card)]" />
  </span>
);

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  titleClassName?: string;
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  className = '',
  titleClassName = 'text-xl',
}) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <LogoMark size={size} />
    {showText && (
      <div>
        <h1 className={`font-extrabold tracking-tight text-[var(--text-main)] ${titleClassName}`}>StrainVerse</h1>
        {showTagline && (
          <p className="text-[var(--text-muted)] text-sm -mt-0.5">The Universe of Strains, Powered by You.</p>
        )}
      </div>
    )}
  </div>
);

export default Logo;
