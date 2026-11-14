// Night road scene behind the Home screen (mountains, sky glow, road with lane lines).
// Pure SVG, so it works offline and needs no image files.
export default function HomeBackdrop() {
  return (
    <svg className="home-backdrop" viewBox="0 0 480 620" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#050c1c" />
          <stop offset="0.45" stopColor="#0c2147" />
          <stop offset="0.75" stopColor="#17407a" />
          <stop offset="1" stopColor="#1d5598" />
        </linearGradient>
        <linearGradient id="mtnFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b3a6b" />
          <stop offset="1" stopColor="#0f2447" />
        </linearGradient>
        <linearGradient id="mtnNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d2142" />
          <stop offset="1" stopColor="#081327" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#20395f" />
          <stop offset="1" stopColor="#0a1528" />
        </linearGradient>
        <radialGradient id="horizon" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#9cc7ff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#9cc7ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#080e1c" stopOpacity="0" />
          <stop offset="1" stopColor="#080e1c" stopOpacity="1" />
        </linearGradient>
      </defs>

      <rect width="480" height="620" fill="url(#sky)" />
      {/* stars */}
      {[[40, 30], [110, 70], [190, 24], [300, 48], [380, 22], [440, 80], [260, 90], [70, 120], [410, 140]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1} fill="#cfe2ff" opacity="0.7" />
      ))}
      {/* distant mountains */}
      <path d="M0 330 L60 255 L105 295 L170 215 L235 300 L300 235 L360 290 L420 240 L480 300 L480 360 L0 360Z" fill="url(#mtnFar)" />
      {/* near mountains / hills */}
      <path d="M0 360 L0 300 L70 322 L140 285 L200 335 L240 350 L280 335 L350 290 L420 325 L480 295 L480 360Z" fill="url(#mtnNear)" />
      <ellipse cx="240" cy="348" rx="140" ry="22" fill="url(#horizon)" />
      {/* road */}
      <path d="M232 345 L248 345 L520 620 L-40 620Z" fill="url(#road)" />
      <path d="M232 345 L-40 620" stroke="#5aa2ff" strokeOpacity="0.35" strokeWidth="2" />
      <path d="M248 345 L520 620" stroke="#5aa2ff" strokeOpacity="0.35" strokeWidth="2" />
      {/* centre dashes */}
      {[[345, 358], [372, 392], [408, 440], [455, 505], [520, 600]].map(([a, b], i) => (
        <rect key={i} x={240 - 1.5 - i * 0.6} y={a} width={3 + i * 1.2} height={(b - a) * 0.55} fill="#e8f1ff" opacity={0.35 + i * 0.1} />
      ))}
      <rect y="300" width="480" height="320" fill="url(#fade)" />
    </svg>
  );
}
