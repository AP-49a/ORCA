import React from 'react';
import { ORCA_LOGO_PATH } from './OrcaLogoPath';

interface OrcaLogoProps {
  className?: string;
  size?: number;
  alt?: string;
}

export const OrcaLogo: React.FC<OrcaLogoProps> = ({
  className = 'w-6 h-6',
  size,
  alt = 'ORCA',
}) => {
  return (
    <svg
      viewBox="0 0 1024 1024"
      fill="currentColor"
      role="img"
      aria-label={alt}
      className={`select-none pointer-events-none orca-brand-logo flex-shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <path fillRule="evenodd" clipRule="evenodd" d={ORCA_LOGO_PATH} />
    </svg>
  );
};

