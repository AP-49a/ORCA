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
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none orca-brand-logo flex-shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      role="img"
      aria-label={alt}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={ORCA_LOGO_PATH}
      />
    </svg>
  );
};


