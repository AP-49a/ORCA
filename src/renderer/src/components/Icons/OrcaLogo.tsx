import React, { useState, useEffect } from 'react';
import blackLogo from '../../assets/orca-logo.png';
import whiteLogo from '../../assets/orca-logo-white.png';

interface OrcaLogoProps {
  className?: string;
  size?: number;
  alt?: string;
}

/**
 * Lightweight hook that tracks whether Windows is in dark mode.
 * Reads the initial value via orcaAPI.getTheme() and subscribes to live
 * nativeTheme 'updated' events pushed from the main process.
 */
function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Query the current theme from the main process
    window.orcaAPI?.getTheme().then((dark) => setIsDark(dark));

    // Subscribe to live theme-change events
    const unsub = window.orcaAPI?.onThemeChanged((dark) => setIsDark(dark));

    return () => {
      unsub?.();
    };
  }, []);

  return isDark;
}

export const OrcaLogo: React.FC<OrcaLogoProps> = ({
  className = 'w-6 h-6',
  size,
  alt = 'ORCA',
}) => {
  const isDark = useIsDarkMode();
  const src = isDark ? whiteLogo : blackLogo;

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      role="img"
      aria-label={alt}
      className={`select-none pointer-events-none orca-brand-logo flex-shrink-0 object-contain ${className}`}
      style={size ? { width: size, height: size } : undefined}
    />
  );
};
