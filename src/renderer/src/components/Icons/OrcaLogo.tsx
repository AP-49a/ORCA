import React from 'react';

interface OrcaLogoProps {
  className?: string;
  size?: number;
}

export const OrcaLogo: React.FC<OrcaLogoProps> = ({ className = 'w-6 h-6', size }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        <linearGradient id="orcaGrad" x1="2" y1="4" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284C7" />
          <stop offset="0.5" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="orcaWave" x1="4" y1="18" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" stopOpacity="0.8" />
          <stop offset="1" stopColor="#0284C7" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* Sleek Orca fin + ocean wave crest silhouette */}
      <path
        d="M6 24C9 24 12 21 15 16C17.5 11.5 21 6 27 5C24.5 10 22 14 18 19C14 24 9.5 27 4 27C4.6 26 5.3 25 6 24Z"
        fill="url(#orcaGrad)"
      />
      {/* Subtle under-wave splash */}
      <path
        d="M8 26.5C12 26.5 15.5 24 19 21C22 18 25 15 28 14.5C26 18 22.5 22 18 25C14 27.5 10.5 28 7 28C7.3 27.5 7.6 27 8 26.5Z"
        fill="url(#orcaWave)"
      />
      {/* Sleek eye/blowhole dot */}
      <circle cx="21" cy="9.5" r="1.5" fill="#FFFFFF" />
    </svg>
  );
};
