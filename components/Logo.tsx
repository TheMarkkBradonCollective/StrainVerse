import React from 'react';
import { Sprout } from 'lucide-react';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

const iconSizes: Record<LogoSize, number> = {
  sm: 20,
  md: 24,
  lg: 36,
  xl: 44,
};

const markBox: Record<LogoSize, string> = {
  sm: 'w-8 h-8 rounded-xl',
  md: 'w-10 h-10 rounded-2xl',
  lg: 'w-14 h-14 rounded-[1.25rem]',
  xl: 'w-16 h-16 rounded-[1.35rem]',
};

export const LogoMark: React.FC<{ size?: LogoSize; className?: string }> = ({ size = 'md', className = '' }) => (
  <span
    className={`${markBox[size]} inline-flex items-center justify-center bg-[var(--accent)] text-white shadow-[var(--shadow-card)] flex-shrink-0 ${className}`}
    aria-hidden="true"
  >
    <Sprout size={iconSizes[size] * 0.55} strokeWidth={2.4} />
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
