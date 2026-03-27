import React from 'react';

const AuthIllustration = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '360px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px'
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 520 520"
        role="img"
        aria-label="Learning illustration"
      >
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1e3a8a" stopOpacity="0.95" />
            <stop offset="1" stopColor="#0b1f3b" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#0b3d91" stopOpacity="0.9" />
            <stop offset="1" stopColor="#1e40af" stopOpacity="0.9" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#020617" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Background blobs */}
        <circle cx="120" cy="110" r="80" fill="url(#g2)" opacity="0.18" />
        <circle cx="420" cy="140" r="120" fill="url(#g1)" opacity="0.14" />
        <circle cx="360" cy="430" r="110" fill="url(#g2)" opacity="0.12" />

        {/* Book stack */}
        <g filter="url(#softShadow)">
          <path
            d="M130 195c0-18 14-32 32-32h160c18 0 32 14 32 32v210c0 18-14 32-32 32H162c-18 0-32-14-32-32V195z"
            fill="rgba(255,255,255,0.92)"
            stroke="rgba(11,31,59,0.12)"
            strokeWidth="2"
          />
          <path
            d="M162 160h160c18 0 32 14 32 32v24H162c-18 0-32 14-32 32V192c0-18 14-32 32-32z"
            fill="url(#g1)"
            opacity="0.9"
          />
          <path
            d="M162 210h160"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M162 250h160"
            stroke="rgba(255,255,255,0.65)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Pages */}
          <g opacity="0.35">
            <path d="M200 210h15v160h-15z" fill="#0b1f3b" />
            <path d="M240 210h15v160h-15z" fill="#0b1f3b" />
            <path d="M280 210h15v160h-15z" fill="#0b1f3b" />
            <path d="M320 210h15v160h-15z" fill="#0b1f3b" />
          </g>
        </g>

        {/* Floating sparkles */}
        <g>
          <path d="M80 320l10-24 10 24 24 10-24 10-10 24-10-24-24-10 24-10z" fill="url(#g2)" opacity="0.25" />
          <path d="M420 290l8-18 8 18 18 8-18 8-8 18-8-18-18-8 18-8z" fill="url(#g1)" opacity="0.22" />
          <circle cx="460" cy="210" r="7" fill="rgba(255,255,255,0.9)" />
          <circle cx="70" cy="210" r="6" fill="rgba(255,255,255,0.85)" />
        </g>

        {/* Title underline */}
        <path
          d="M170 450c90 20 160 20 230 0"
          stroke="rgba(30,58,138,0.32)"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default AuthIllustration;

