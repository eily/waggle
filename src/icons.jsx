// Waggle SVG icon library — all icons share the same 36x36 viewBox
// Use size prop to scale (default 24)

const d = {
  teal: "#0F6E56",
  tealLight: "#E0F5EE",
  tealMid: "#C8EDE1",
  tealSoft: "#9FE1CB",
  amber: "#D4880A",
  amberLight: "#FEF3DC",
  amberMid: "#FAC775",
  red: "#C93B3A",
  redLight: "#FCEAEA",
  gray: "#9CA3AF",
  grayLight: "#D1D5DB",
};

function Icon({ size = 24, children, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden={!title}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

export function BeeFull({ size = 24, muted }) {
  const stroke = muted ? d.gray : d.teal;
  const body = muted ? d.grayLight : d.tealSoft;
  const wing = muted ? d.grayLight : d.tealSoft;
  const stripe = muted ? d.grayLight : d.teal;
  return (
    <Icon size={size}>
      <ellipse cx="18" cy="21" rx="7" ry="9" fill={body} stroke={stroke} strokeWidth="1.5" />
      <rect x="13" y="14" width="10" height="3" rx="1.5" fill={stripe} />
      <rect x="13" y="19" width="10" height="2.5" rx="1.25" fill={stripe} />
      <rect x="13" y="23.5" width="10" height="2.5" rx="1.25" fill={stripe} />
      <ellipse cx="10" cy="16" rx="6.5" ry="3" fill={wing} opacity="0.65" transform="rotate(-28 10 16)" />
      <ellipse cx="26" cy="16" rx="6.5" ry="3" fill={wing} opacity="0.65" transform="rotate(28 26 16)" />
      <line x1="15.5" y1="12" x2="13" y2="7" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="20.5" y1="12" x2="23" y2="7" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="12.5" cy="6.5" r="1.6" fill={stroke} />
      <circle cx="23.5" cy="6.5" r="1.6" fill={stroke} />
    </Icon>
  );
}

export function BeeSimple({ size = 24, muted }) {
  // Simplified bee for small sizes (tab bar, wordmark)
  const stroke = muted ? d.gray : d.teal;
  const body = muted ? "#F3F4F6" : d.tealSoft;
  const stripe = muted ? d.grayLight : d.teal;
  const wing = muted ? d.grayLight : d.tealSoft;
  return (
    <Icon size={size}>
      <ellipse cx="18" cy="20" rx="6" ry="8" fill={body} stroke={stroke} strokeWidth="1.5" />
      <rect x="13.5" y="14" width="9" height="2.5" rx="1.25" fill={stripe} />
      <rect x="13.5" y="18.5" width="9" height="2" rx="1" fill={stripe} />
      <rect x="13.5" y="22.5" width="9" height="2" rx="1" fill={stripe} />
      <ellipse cx="10.5" cy="15.5" rx="5.5" ry="2.5" fill={wing} opacity="0.6" transform="rotate(-28 10.5 15.5)" />
      <ellipse cx="25.5" cy="15.5" rx="5.5" ry="2.5" fill={wing} opacity="0.6" transform="rotate(28 25.5 15.5)" />
      <line x1="15.5" y1="12" x2="13.5" y2="8" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="20.5" y1="12" x2="22.5" y2="8" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="13" cy="7.5" r="1.5" fill={stroke} />
      <circle cx="23" cy="7.5" r="1.5" fill={stroke} />
    </Icon>
  );
}

export function HiveBox({ size = 24, muted }) {
  const stroke = muted ? d.gray : d.teal;
  const fill1 = muted ? "#F9FAFB" : d.tealLight;
  const fill2 = muted ? "#F3F4F6" : d.tealMid;
  const dark = muted ? d.gray : d.teal;
  return (
    <Icon size={size}>
      <rect x="7" y="22" width="22" height="10" rx="2" fill={fill1} stroke={stroke} strokeWidth="1.4" />
      <rect x="9" y="15" width="18" height="8" rx="1.5" fill={fill2} stroke={stroke} strokeWidth="1.4" />
      <rect x="5" y="12" width="26" height="4" rx="2" fill={dark} />
      <rect x="14" y="27" width="8" height="5" rx="1" fill={muted ? d.grayLight : "#0A5E48"} />
    </Icon>
  );
}

export function HoneycombIcon({ size = 24, muted }) {
  const stroke = muted ? d.gray : d.teal;
  const fill = muted ? "#F9FAFB" : d.tealLight;
  const fillMid = muted ? "#F3F4F6" : d.tealMid;
  return (
    <Icon size={size}>
      <polygon points="18,4 25,8 25,16 18,20 11,16 11,8" fill={fill} stroke={stroke} strokeWidth="1.4" />
      <polygon points="18,14 23,17.5 23,24 18,27 13,24 13,17.5" fill={fillMid} stroke={stroke} strokeWidth="1.4" />
      <polygon points="25,14 30,17.5 30,24 25,27 20,24 20,17.5" fill={fill} stroke={stroke} strokeWidth="1.4" />
      <polygon points="11,14 16,17.5 16,24 11,27 6,24 6,17.5" fill={fill} stroke={stroke} strokeWidth="1.4" />
    </Icon>
  );
}

export function QueenIcon({ size = 24, muted }) {
  const stroke = muted ? d.gray : d.amber;
  const fill = muted ? "#F9FAFB" : d.amberLight;
  const wing = muted ? d.grayLight : d.tealSoft;
  const center = muted ? d.gray : d.amber;
  return (
    <Icon size={size}>
      <circle cx="18" cy="19" r="11" fill={fill} stroke={stroke} strokeWidth="1.4" />
      <ellipse cx="10" cy="15" rx="5.5" ry="2.5" fill={wing} opacity="0.55" transform="rotate(-30 10 15)" />
      <ellipse cx="26" cy="15" rx="5.5" ry="2.5" fill={wing} opacity="0.55" transform="rotate(30 26 15)" />
      <circle cx="18" cy="19" r="3" fill={center} opacity="0.2" />
      <circle cx="18" cy="19" r="1.5" fill={center} />
      <line x1="18" y1="8" x2="18" y2="5" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="20.5" y1="9" x2="23" y2="6" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="15.5" y1="9" x2="13" y2="6" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
    </Icon>
  );
}

export function HoneyJar({ size = 24, muted }) {
  const stroke = muted ? d.gray : d.amber;
  const fill = muted ? "#F9FAFB" : d.amberLight;
  const fillMid = muted ? "#F3F4F6" : d.amberMid;
  return (
    <Icon size={size}>
      <path d="M11 14 C9 14 7 16 7 19 L7 26 C7 28 9 30 11 30 L25 30 C27 30 29 28 29 26 L29 19 C29 16 27 14 25 14 Z" fill={fill} stroke={stroke} strokeWidth="1.4" />
      <path d="M11 14 C9 14 7 16 7 19 L7 23 C10 25 14 26 18 26 C22 26 26 25 29 23 L29 19 C29 16 27 14 25 14 Z" fill={fillMid} opacity="0.6" />
      <rect x="13" y="9" width="10" height="6" rx="2" fill={fill} stroke={stroke} strokeWidth="1.4" />
      <rect x="11" y="8" width="14" height="3" rx="1.5" fill={stroke} />
      <line x1="18" y1="9" x2="18" y2="6" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="18" cy="5" r="1.5" fill={stroke} />
    </Icon>
  );
}

export function QueenCellIcon({ size = 24, muted }) {
  const stroke = muted ? d.gray : d.amber;
  const fill = muted ? "#F9FAFB" : d.amberLight;
  return (
    <Icon size={size}>
      <path
        d="M18 5 L22 11 L29 12 L24 18 L25.5 26 L18 22.5 L10.5 26 L12 18 L7 12 L14 11 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="15" r="3" fill={stroke} opacity="0.25" />
      <circle cx="18" cy="15" r="1.5" fill={stroke} opacity="0.6" />
    </Icon>
  );
}

export function AlertCircle({ size = 24, color = "red" }) {
  const cols = {
    red:    { fill: d.redLight,   stroke: d.red,   text: d.red },
    amber:  { fill: d.amberLight, stroke: d.amber, text: d.amber },
    teal:   { fill: d.tealLight,  stroke: d.teal,  text: d.teal },
  };
  const c = cols[color] || cols.red;
  return (
    <Icon size={size}>
      <circle cx="18" cy="18" r="13" fill={c.fill} stroke={c.stroke} strokeWidth="1.4" />
      <line x1="18" y1="11" x2="18" y2="21" stroke={c.text} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="25" r="2" fill={c.text} />
    </Icon>
  );
}

export function CheckCircle({ size = 24 }) {
  return (
    <Icon size={size}>
      <circle cx="18" cy="18" r="13" fill={d.tealLight} stroke={d.teal} strokeWidth="1.4" />
      <polyline points="11,18 16,23 25,13" stroke={d.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Icon>
  );
}

export function InspectionIcon({ size = 24, muted }) {
  const stroke = muted ? d.gray : d.teal;
  const fill = muted ? "#F9FAFB" : d.tealLight;
  const line = muted ? d.grayLight : d.tealMid;
  return (
    <Icon size={size}>
      <rect x="7" y="10" width="22" height="20" rx="3" fill={fill} stroke={stroke} strokeWidth="1.4" />
      <line x1="12" y1="16" x2="24" y2="16" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="20" x2="20" y2="20" stroke={line} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="12" y1="24" x2="22" y2="24" stroke={line} strokeWidth="1.1" strokeLinecap="round" />
      <rect x="13" y="6" width="10" height="6" rx="2" fill={stroke} />
      <circle cx="18" cy="9" r="1.5" fill="#fff" opacity="0.5" />
    </Icon>
  );
}

export function SwarmIcon({ size = 24, muted }) {
  const stroke = muted ? d.gray : d.amber;
  const fill = muted ? "#F9FAFB" : d.amberLight;
  return (
    <Icon size={size}>
      <circle cx="13" cy="16" r="4" fill={fill} stroke={stroke} strokeWidth="1.3" />
      <circle cx="22" cy="13" r="3.5" fill={fill} stroke={stroke} strokeWidth="1.3" />
      <circle cx="20" cy="22" r="3" fill={fill} stroke={stroke} strokeWidth="1.3" />
      <circle cx="10" cy="23" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.3" />
      <circle cx="25" cy="21" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.3" />
      <path d="M22 5 C26 5 30 8 28 13" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" fill="none" strokeDasharray="2,2" />
      <line x1="28" y1="13" x2="31" y2="11" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
    </Icon>
  );
}

export function VarroaIcon({ size = 24, muted }) {
  const stroke = muted ? d.gray : d.red;
  const fill = muted ? "#F9FAFB" : d.redLight;
  return (
    <Icon size={size}>
      <ellipse cx="18" cy="19" rx="9" ry="7" fill={fill} stroke={stroke} strokeWidth="1.4" />
      <line x1="9" y1="15" x2="5" y2="12" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="19" x2="5" y2="19" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="23" x2="5" y2="26" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="27" y1="15" x2="31" y2="12" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="27" y1="19" x2="31" y2="19" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="27" y1="23" x2="31" y2="26" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="15" cy="17" r="1.5" fill={stroke} opacity="0.6" />
      <circle cx="21" cy="17" r="1.5" fill={stroke} opacity="0.6" />
      <circle cx="18" cy="21" r="1.5" fill={stroke} opacity="0.6" />
    </Icon>
  );
}

export function SOSIcon({ size = 24 }) {
  return (
    <Icon size={size}>
      <circle cx="18" cy="18" r="13" fill={d.redLight} stroke={d.red} strokeWidth="1.4" />
      <path d="M12 22 C12 20 13 19 15 19 C16 19 17 19.5 18 19.5 C20 19.5 21 18 21 17 C21 15.5 20 15 18 15 C16 15 15 15.5 15 17" stroke={d.red} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="22.5" cy="22.5" r="2" fill={d.red} />
    </Icon>
  );
}

export function TrendIcon({ size = 24, muted }) {
  const stroke = muted ? d.gray : d.teal;
  const fill = muted ? "#F9FAFB" : d.tealLight;
  return (
    <Icon size={size}>
      <polyline points="6,26 12,18 17,22 24,12 30,8" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="30" cy="8" r="2.5" fill={stroke} />
      <line x1="6" y1="28" x2="30" y2="28" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    </Icon>
  );
}

export function SafetyIcon({ size = 24, muted }) {
  const stroke = muted ? d.gray : d.teal;
  const fill = muted ? "#F9FAFB" : d.tealLight;
  return (
    <Icon size={size}>
      <path d="M18 5 L29 9 L29 18 C29 24 24 29 18 31 C12 29 7 24 7 18 L7 9 Z" fill={fill} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
      <polyline points="13,18 17,22 24,14" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Icon>
  );
}

export function SuperCountIcon({ size = 24, count = 0 }) {
  const filled = Math.min(count, 3);
  const heights = [26, 20, 14];
  return (
    <Icon size={size}>
      {[0, 1, 2].map(i => (
        <rect
          key={i}
          x="8"
          y={heights[i]}
          width="20"
          height="6"
          rx="1.5"
          fill={i < filled ? d.tealMid : "#F3F4F6"}
          stroke={i < filled ? d.teal : d.grayLight}
          strokeWidth="1.2"
        />
      ))}
    </Icon>
  );
}

export function BroodFrameIcon({ size = 24, frames = 0, max = 11 }) {
  const pct = Math.min(frames / max, 1);
  return (
    <Icon size={size}>
      <rect x="6" y="8" width="24" height="22" rx="2" fill={d.tealLight} stroke={d.teal} strokeWidth="1.4" />
      <rect x="6" y={8 + 22 * (1 - pct)} width="24" height={22 * pct} rx="2" fill={d.tealMid} />
      <rect x="6" y="8" width="24" height="22" rx="2" fill="none" stroke={d.teal} strokeWidth="1.4" />
      <line x1="10" y1="14" x2="26" y2="14" stroke={d.teal} strokeWidth="0.8" opacity="0.4" />
      <line x1="10" y1="20" x2="26" y2="20" stroke={d.teal} strokeWidth="0.8" opacity="0.4" />
    </Icon>
  );
}
