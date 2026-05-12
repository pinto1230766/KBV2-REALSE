import React from 'react';

interface KbvLogoProps {
  className?: string;
  size?: number | string;
}

export const KbvLogo: React.FC<KbvLogoProps> = ({ className, size = "100%" }) => {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl"
      >
        <defs>
          <clipPath id="appleSquircle">
            <path d="M0,50 C0,5 5,0 50,0 C95,0 100,5 100,50 C100,95 95,100 50,100 C5,100 0,95 0,50" />
          </clipPath>

          <linearGradient id="primaryBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0057FF" />
            <stop offset="100%" stopColor="#00144D" />
          </linearGradient>
          
          <radialGradient id="meshGlow" cx="20%" cy="20%" r="80%" fx="20%" fy="20%">
            <stop offset="0%" stopColor="#00D1FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#00D1FF" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="logoGloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.2" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Squircle Container */}
        <g clipPath="url(#appleSquircle)">
          <rect width="100" height="100" fill="url(#primaryBg)" />
          <rect width="100" height="100" fill="url(#meshGlow)" />
          <rect width="100" height="100" fill="url(#logoGloss)" />
          <path d="M1,50 C1,6 6,1 50,1 C94,1 99,6 99,50 C99,94 94,99 50,99 C6,99 1,94 1,50" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" fill="none" />
        </g>

        {/* KBV Main Branding */}
        <text 
          x="50.2" 
          y="42.2" 
          textAnchor="middle" 
          fill="black" 
          fillOpacity="0.3"
          style={{ 
            fontFamily: 'Arial, system-ui, sans-serif', 
            fontWeight: 900, 
            fontSize: '32px',
            letterSpacing: '-0.05em'
          }}
        >
          KBV
        </text>
        <text 
          x="50" 
          y="42" 
          textAnchor="middle" 
          fill="white"
          style={{ 
            fontFamily: 'Arial, system-ui, sans-serif', 
            fontWeight: 900, 
            fontSize: '32px',
            letterSpacing: '-0.05em'
          }}
        >
          KBV
        </text>

        {/* Cape Verde Flag "Seal" in Bottom-Left */}
        <g transform="translate(22, 78)">
          <circle r="10" fill="#003399" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
          {/* White-Red-White stripes */}
          <rect x="-10" y="0" width="20" height="1" fill="white" />
          <rect x="-10" y="1" width="20" height="1" fill="#D21034" />
          <rect x="-10" y="2" width="20" height="1" fill="white" />
          {/* Circle of 10 gold stars */}
          <circle r="4.5" cx="-1" cy="1" fill="none" stroke="#FFD700" strokeWidth="1.2" strokeDasharray="0.3 2.5" />
        </g>

        {/* Footer Section: FP + Copyright - Refined sizing */}
        <g transform="translate(68, 70)">
          <rect x="-15" y="-8" width="30" height="0.4" fill="white" fillOpacity="0.25" rx="0.2" />
          <text 
            x="-2" 
            y="8" 
            textAnchor="middle" 
            fill="white" 
            fillOpacity="0.85"
            style={{ 
              fontFamily: 'Arial, system-ui, sans-serif', 
              fontWeight: 700, 
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
          >
            FP
          </text>
          <text 
            x="8" 
            y="6" 
            textAnchor="middle" 
            fill="white" 
            fillOpacity="0.8"
            style={{ 
              fontFamily: 'Arial, system-ui, sans-serif', 
              fontWeight: 400, 
              fontSize: '5px'
            }}
          >
            ©
          </text>
        </g>
      </svg>
    </div>
  );
};
