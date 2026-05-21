import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const TEAL = "#0F6E56";
const TEAL_LIGHT = "#E1F5EE";
const TEAL_MID = "#1D9E75";
const AMBER = "#EF9F27";
const AMBER_LIGHT = "#FAEEDA";
const RED = "#E24B4A";
const RED_LIGHT = "#FCEBEB";

// ── Seed data (mirrors App.jsx) ───────────────────────────────────────────────

const allHives = [
  { id:1, number:1, apiary:"Farm" },
  { id:2, number:2, apiary:"Home" },
  { id:4, number:4, apiary:"Farm" },
  { id:5, number:5, apiary:"Farm" },
  { id:6, number:6, apiary:"Farm" },
];

const allQueens = [
  { id:1, number:1, hiveId:1, year:2025, colour:"Blue", origin:"DLW colony from BMH", motherQueenId:null, qcCappedDate:"2025-05-24", eggsFirstSeen:"2025-08-18", lostDate:null, lostReason:null, temperRating:5 },
  { id:2, number:2, hiveId:2, year:2025, colour:"Blue", origin:"BMH new queen", motherQueenId:null, qcCappedDate:null, eggsFirstSeen:"2025-07-17", lostDate:"2026-05-10", lostReason:"Swarmed", temperRating:4 },
  { id:3, number:3, hiveId:null, year:2024, colour:"Red", origin:"Original colony", motherQueenId:null, qcCappedDate:null, eggsFirstSeen:"2024-04-01", lostDate:"2026-02-15", lostReason:"Died", temperRating:3 },
  { id:4, number:4, hiveId:null, year:2024, colour:"Green", origin:"Queen from Hive 2", motherQueenId:null, qcCappedDate:null, eggsFirstSeen:null, lostDate:null, lostReason:null, temperRating:3 },
  { id:5, number:5, hiveId:null, year:2024, colour:"Green", origin:"Original colony", motherQueenId:null, qcCappedDate:null, eggsFirstSeen:"2024-04-01", lostDate:"2025-06-01", lostReason:"Swarmed", temperRating:4 },
  { id:6, number:6, hiveId:null, year:2025, colour:"Blue", origin:"Raised from QC", motherQueenId:5, qcCappedDate:"2025-06-10", eggsFirstSeen:"2025-07-05", lostDate:"2026-05-10", lostReason:"Superseded", temperRating:4 },
  { id:7, number:7, hiveId:4, year:2026, colour:"Yellow", origin:"Raised from QC", motherQueenId:4, qcCappedDate:"2026-05-10", eggsFirstSeen:null, lostDate:null, lostReason:null, temperRating:null },
  { id:8, number:8, hiveId:2, year:2026, colour:"Yellow", origin:"Raised from QC", motherQueenId:2, qcCappedDate:"2026-05-10", eggsFirstSeen:null, lostDate:null, lostReason:null, temperRating:null },
  { id:9, number:9, hiveId:6, year:2026, colour:"Yellow", origin:"Raised from QC", motherQueenId:6, qcCappedDate:"2026-05-10", eggsFirstSeen:null, lostDate:null, lostReason:null, temperRating:null },
  { id:10, number:10, hiveId:5, year:2026, colour:"Yellow", origin:"Raised from QC", motherQueenId:5, qcCappedDate:"2026-05-01", eggsFirstSeen:null, lostDate:null, lostReason:null, temperRating:null },
];

const allInspections = [
  { id:1,   hiveId:1, date:"2026-05-12", broodStatus:"BIAS", broodFrames:2.5, stores:5, room:6, health:"OK", varroa:"Low",    temperament:5, supersTotal:1, weatherCondition:"Cloud", weatherTemp:16 },
  { id:101, hiveId:1, date:"2026-04-28", broodStatus:"BIAS", broodFrames:2,   stores:4, room:7, health:"OK", varroa:"Low",    temperament:5, supersTotal:1, weatherCondition:"Sun",   weatherTemp:18 },
  { id:102, hiveId:1, date:"2026-04-10", broodStatus:"BIAS", broodFrames:1.5, stores:3, room:8, health:"OK", varroa:"Low",    temperament:5, supersTotal:0, weatherCondition:"Sun",   weatherTemp:14 },
  { id:103, hiveId:1, date:"2026-03-22", broodStatus:"BIAS", broodFrames:1,   stores:3, room:9, health:"OK", varroa:"Low",    temperament:5, supersTotal:0, weatherCondition:"Fair",  weatherTemp:12 },
  { id:2,   hiveId:2, date:"2026-05-10", broodStatus:"BIAS", broodFrames:3,   stores:4, room:5, health:"OK", varroa:"Low",    temperament:4, supersTotal:2, weatherCondition:"Cloud", weatherTemp:14 },
  { id:201, hiveId:2, date:"2026-04-20", broodStatus:"No eggs", broodFrames:0, stores:3, room:6, health:"OK", varroa:"Low",   temperament:3, supersTotal:2, weatherCondition:"Cloud", weatherTemp:13 },
  { id:202, hiveId:2, date:"2026-04-05", broodStatus:"BIAS", broodFrames:4,   stores:5, room:4, health:"OK", varroa:"Medium", temperament:4, supersTotal:2, weatherCondition:"Sun",   weatherTemp:17 },
  { id:203, hiveId:2, date:"2026-03-20", broodStatus:"BIAS", broodFrames:2,   stores:4, room:7, health:"OK", varroa:"Low",    temperament:4, supersTotal:1, weatherCondition:"Sun",   weatherTemp:11 },
  { id:3,   hiveId:4, date:"2026-05-10", broodStatus:"BIAS", broodFrames:5,   stores:2, room:3, health:"OK", varroa:"Low",    temperament:4, supersTotal:2, weatherCondition:"Cloud", weatherTemp:14 },
  { id:301, hiveId:4, date:"2026-04-25", broodStatus:"BIAS", broodFrames:6,   stores:3, room:2, health:"OK", varroa:"Low",    temperament:4, supersTotal:2, weatherCondition:"Sun",   weatherTemp:19 },
  { id:302, hiveId:4, date:"2026-04-08", broodStatus:"BIAS", broodFrames:5,   stores:3, room:4, health:"OK", varroa:"Low",    temperament:4, supersTotal:1, weatherCondition:"Fair",  weatherTemp:15 },
  { id:4,   hiveId:5, date:"2026-05-10", broodStatus:"No eggs", broodFrames:0, stores:4, room:5, health:"OK", varroa:"Low",   temperament:4, supersTotal:2, weatherCondition:"Cloud", weatherTemp:14 },
  { id:401, hiveId:5, date:"2026-04-22", broodStatus:"BIAS", broodFrames:5.5, stores:3, room:3, health:"OK", varroa:"Medium", temperament:3, supersTotal:2, weatherCondition:"Cloud", weatherTemp:14 },
  { id:402, hiveId:5, date:"2026-04-05", broodStatus:"BIAS", broodFrames:5,   stores:4, room:3, health:"OK", varroa:"Low",    temperament:4, supersTotal:2, weatherCondition:"Sun",   weatherTemp:16 },
  { id:5,   hiveId:6, date:"2026-05-08", broodStatus:"BIAS", broodFrames:3.5, stores:4, room:5, health:"OK", varroa:"Low",    temperament:5, supersTotal:2, weatherCondition:"Sun",   weatherTemp:20 },
  { id:501, hiveId:6, date:"2026-04-18", broodStatus:"BIAS", broodFrames:4,   stores:4, room:5, health:"OK", varroa:"Low",    temperament:5, supersTotal:2, weatherCondition:"Sun",   weatherTemp:18 },
];

const allHarvests = [
  { id:1, date:"2024-08-10", season:"Summer", year:2024, superFrames:18, jarSize:"12oz", jars:52, weightLbs:39,   notes:"Good yield. Thick honey — OSR influence." },
  { id:2, date:"2025-06-15", season:"Spring", year:2025, superFrames:8,  jarSize:"12oz", jars:22, weightLbs:16.5, notes:"Spring harvest." },
  { id:3, date:"2025-08-20", season:"Summer", year:2025, superFrames:24, jarSize:"12oz", jars:68, weightLbs:51,   notes:"Best summer yet." },
  { id:4, date:"2026-06-01", season:"Spring", year:2026, superFrames:6,  jarSize:"12oz", jars:18, weightLbs:13.5, notes:"Modest spring — swarm disruption." },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(dateStr, short) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (short) return d.toLocaleDateString("en-GB", { day:"numeric", month:"short" });
  return d.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
}

// ── Chart components ──────────────────────────────────────────────────────────

function LineChart({ series, height = 180, yLabel = "" }) {
  // series: [{ label, color, data: [{x: dateStr, y: number}] }]
  if (!series || series.every(s => s.data.length < 2))
    return <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:"#9CA3AF", fontSize:13 }}>Not enough data yet</div>;

  const allY = series.flatMap(s => s.data.map(d => d.y));
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const rangeY = maxY - minY || 1;
  const allX = [...new Set(series.flatMap(s => s.data.map(d => d.x)))].sort();
  const W = 560, H = height, pad = { top:16, right:16, bottom:32, left:36 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  const xPos = x => pad.left + (allX.indexOf(x) / Math.max(allX.length - 1, 1)) * iW;
  const yPos = y => pad.top + iH - ((y - minY) / rangeY) * iH;

  const yTicks = 4;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}>
      {/* Grid */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const val = minY + (rangeY / yTicks) * i;
        const y = yPos(val);
        return (
          <g key={i}>
            <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="#E5E7EB" strokeWidth="1" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{Math.round(val)}</text>
          </g>
        );
      })}
      {/* X labels — show subset */}
      {allX.filter((_, i) => allX.length <= 8 || i % Math.ceil(allX.length / 6) === 0).map(x => (
        <text key={x} x={xPos(x)} y={H - 4} textAnchor="middle" fontSize="10" fill="#9CA3AF">{fmt(x, true)}</text>
      ))}
      {/* Series */}
      {series.map(s => {
        const pts = s.data.map(d => `${xPos(d.x)},${yPos(d.y)}`).join(" ");
        return (
          <g key={s.label}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {s.data.map((d, i) => (
              <circle key={i} cx={xPos(d.x)} cy={yPos(d.y)} r="4" fill={s.color} />
            ))}
          </g>
        );
      })}
      {/* Y axis label */}
      {yLabel && <text x={8} y={H / 2} textAnchor="middle" fontSize="10" fill="#9CA3AF" transform={`rotate(-90, 8, ${H/2})`}>{yLabel}</text>}
    </svg>
  );
}

function BarChart({ data, height = 160 }) {
  // data: [{ label, value, color, sublabel? }]
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 560, H = height;
  const pad = { top:20, right:10, bottom:36, left:10 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const bw = iW / data.length - 8;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {data.map((d, i) => {
        const x = pad.left + i * (iW / data.length) + 4;
        const bh = (d.value / max) * iH;
        const y = pad.top + iH - bh;
        const c = d.color || TEAL;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx="4" fill={c} opacity="0.88" />
            <text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize="11" fill={c} fontWeight="700">{d.value}</text>
            <text x={x + bw / 2} y={H - 18} textAnchor="middle" fontSize="10" fill="#6B7280">{d.label}</text>
            {d.sublabel && <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="9" fill="#9CA3AF">{d.sublabel}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ segments, size = 120 }) {
  // segments: [{ label, value, color }]
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (!total) return null;
  const r = 44, cx = size / 2, cy = size / 2;
  let angle = -Math.PI / 2;
  const arcs = segments.map(seg => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { ...seg, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  });
  return (
    <svg width={size} height={size}>
      {arcs.map((a, i) => <path key={i} d={a.path} fill={a.color} />)}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#fff" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fontWeight="800" fill="#111827">{total}</text>
    </svg>
  );
}

// ── Layout components ─────────────────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{ background:"#fff", borderRadius:16, border:"0.5px solid #E5E7EB", padding:"20px 24px", ...style }}>
      {children}
    </div>
  );
}

function CardTitle({ children, sub }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:15, fontWeight:700, color:"#111827" }}>{children}</div>
      {sub && <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function StatGrid({ stats }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))", gap:12, marginBottom:20 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ background:"#fff", borderRadius:14, border:"0.5px solid #E5E7EB", padding:"16px 18px" }}>
          <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:4 }}>{s.label}</div>
          <div style={{ fontSize:28, fontWeight:800, color:s.color||TEAL, lineHeight:1 }}>{s.value}</div>
          {s.sub && <div style={{ fontSize:12, color:"#9CA3AF", marginTop:4 }}>{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:12 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:item.color, flexShrink:0 }} />
          <span style={{ fontSize:12, color:"#6B7280" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function HivePicker({ hives, selected, onChange }) {
  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
      <button onClick={() => onChange("all")} style={{ padding:"7px 16px", borderRadius:99, background:selected==="all"?TEAL:"#fff", color:selected==="all"?"#fff":"#374151", border:selected==="all"?`1.5px solid ${TEAL}`:"0.5px solid #D1D5DB", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>All hives</button>
      {hives.map(h => (
        <button key={h.id} onClick={() => onChange(h.id)} style={{ padding:"7px 16px", borderRadius:99, background:selected===h.id?TEAL:"#fff", color:selected===h.id?"#fff":"#374151", border:selected===h.id?`1.5px solid ${TEAL}`:"0.5px solid #D1D5DB", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Hive {h.number}</button>
      ))}
    </div>
  );
}

// ── Tab: Colony health ─────────────────────────────────────────────────────────

const HIVE_COLORS = { 1:"#0F6E56", 2:"#2563EB", 4:"#D97706", 5:"#7C3AED", 6:"#DB2777" };

function ColonyTab() {
  const [hiveSel, setHiveSel] = useState("all");
  const varMap = { "Not checked":0, "Low":1, "Medium":2, "High":3 };
  const varColors = { 0:"#9CA3AF", 1:TEAL_MID, 2:AMBER, 3:RED };
  const varLabel = { 0:"—", 1:"Low", 2:"Med", 3:"High" };

  const filteredHives = hiveSel === "all" ? allHives : allHives.filter(h => h.id === hiveSel);

  const broodSeries = filteredHives.map(h => ({
    label: `Hive ${h.number}`,
    color: HIVE_COLORS[h.id] || TEAL,
    data: allInspections.filter(i => i.hiveId === h.id).sort((a,b) => new Date(a.date)-new Date(b.date))
      .map(i => ({ x: i.date, y: i.broodStatus === "BIAS" ? i.broodFrames : 0 }))
  }));

  const storesSeries = filteredHives.map(h => ({
    label: `Hive ${h.number}`,
    color: HIVE_COLORS[h.id] || TEAL,
    data: allInspections.filter(i => i.hiveId === h.id).sort((a,b) => new Date(a.date)-new Date(b.date))
      .map(i => ({ x: i.date, y: i.stores }))
  }));

  const temperSeries = filteredHives.map(h => ({
    label: `Hive ${h.number}`,
    color: HIVE_COLORS[h.id] || TEAL,
    data: allInspections.filter(i => i.hiveId === h.id && i.temperament).sort((a,b) => new Date(a.date)-new Date(b.date))
      .map(i => ({ x: i.date, y: i.temperament }))
  }));

  // Latest snapshot across all hives
  const latestByHive = allHives.map(h => {
    const ins = allInspections.filter(i => i.hiveId === h.id).sort((a,b) => new Date(b.date)-new Date(a.date));
    return ins[0] ? { hive: h, ins: ins[0] } : null;
  }).filter(Boolean);

  // Varroa distribution (latest per hive)
  const varroaDist = [
    { label:"Low", value: latestByHive.filter(x => x.ins.varroa==="Low").length, color:TEAL_MID },
    { label:"Medium", value: latestByHive.filter(x => x.ins.varroa==="Medium").length, color:AMBER },
    { label:"High", value: latestByHive.filter(x => x.ins.varroa==="High").length, color:RED },
  ].filter(d => d.value > 0);

  const avgTemper = (() => {
    const rated = allInspections.filter(i => i.temperament);
    return rated.length ? (rated.reduce((s,i) => s + i.temperament, 0) / rated.length).toFixed(1) : "—";
  })();

  return (
    <div>
      <StatGrid stats={[
        { label:"Active hives", value: allHives.length },
        { label:"Avg temperament", value: avgTemper, sub:"/ 5 across all hives", color: parseFloat(avgTemper) >= 4 ? TEAL : AMBER },
        { label:"High varroa alerts", value: latestByHive.filter(x => x.ins.varroa==="High").length, color: RED, sub:"hives currently" },
        { label:"Total inspections", value: allInspections.length, sub:"on record" },
      ]} />

      <HivePicker hives={allHives} selected={hiveSel} onChange={setHiveSel} />

      <Card style={{ marginBottom:20 }}>
        <CardTitle sub="BIAS frames over time — 0 = no eggs / no brood">Brood strength</CardTitle>
        <Legend items={filteredHives.map(h => ({ label:`Hive ${h.number}`, color:HIVE_COLORS[h.id]||TEAL }))} />
        <LineChart series={broodSeries} height={200} yLabel="Frames" />
      </Card>

      <Card style={{ marginBottom:20 }}>
        <CardTitle sub="Frames of available stores in brood box">Stores level</CardTitle>
        <Legend items={filteredHives.map(h => ({ label:`Hive ${h.number}`, color:HIVE_COLORS[h.id]||TEAL }))} />
        <LineChart series={storesSeries} height={200} yLabel="Frames" />
      </Card>

      <Card style={{ marginBottom:20 }}>
        <CardTitle sub="5 = very calm · 1 = inspection aborted">Colony temperament</CardTitle>
        <Legend items={filteredHives.map(h => ({ label:`Hive ${h.number}`, color:HIVE_COLORS[h.id]||TEAL }))} />
        <LineChart series={temperSeries} height={180} yLabel="Rating" />
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <Card>
          <CardTitle>Varroa status</CardTitle>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <DonutChart segments={varroaDist} size={100} />
            <div>
              {varroaDist.map((d,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:d.color }} />
                  <span style={{ fontSize:13, color:"#6B7280" }}>{d.label}: </span>
                  <span style={{ fontSize:13, fontWeight:700, color:d.color }}>{d.value} hive{d.value!==1?"s":""}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Latest snapshot</CardTitle>
          {latestByHive.map(({ hive, ins }) => (
            <div key={hive.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom:"0.5px solid #F3F4F6" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:TEAL_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#085041" }}>{hive.number}</div>
                <span style={{ fontSize:13, color:"#374151" }}>Hive {hive.number}</span>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <span style={{ fontSize:11, background:TEAL_LIGHT, color:"#085041", padding:"2px 7px", borderRadius:99, fontWeight:600 }}>{ins.broodStatus==="BIAS"?`${ins.broodFrames}fr`:ins.broodStatus}</span>
                <span style={{ fontSize:11, background: ins.varroa==="High"?RED_LIGHT:ins.varroa==="Medium"?AMBER_LIGHT:TEAL_LIGHT, color: ins.varroa==="High"?"#791F1F":ins.varroa==="Medium"?"#633806":"#085041", padding:"2px 7px", borderRadius:99, fontWeight:600 }}>{ins.varroa}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── Tab: Harvest ──────────────────────────────────────────────────────────────

function HarvestTab() {
  const years = [...new Set(allHarvests.map(h => h.year))].sort();
  const byYear = years.map(y => {
    const yh = allHarvests.filter(h => h.year === y);
    return { year:y, jars:yh.reduce((s,h)=>s+h.jars,0), frames:yh.reduce((s,h)=>s+h.superFrames,0), lbs:parseFloat(yh.reduce((s,h)=>s+h.weightLbs,0).toFixed(1)) };
  });
  const totalJars = allHarvests.reduce((s,h)=>s+h.jars,0);
  const totalLbs = allHarvests.reduce((s,h)=>s+h.weightLbs,0);
  const bestYear = byYear.sort((a,b)=>b.jars-a.jars)[0];

  const seasonColors = { Spring: "#1D9E75", Summer: AMBER, Autumn: "#B45309" };
  const seasonData = ["Spring","Summer","Autumn"].map(s => ({
    label: s, color: seasonColors[s],
    value: allHarvests.filter(h => h.season===s).reduce((acc,h) => acc+h.jars, 0)
  })).filter(d => d.value > 0);

  return (
    <div>
      <StatGrid stats={[
        { label:"Total jars", value:totalJars, sub:"all time" },
        { label:"Total weight", value:`${totalLbs}lb`, sub:"all time" },
        { label:"Best year", value:bestYear?.year, sub:`${bestYear?.jars} jars`, color:AMBER },
        { label:"Extractions", value:allHarvests.length, sub:"total events" },
      ]} />

      <Card style={{ marginBottom:20 }}>
        <CardTitle sub="12oz jars produced per year">Honey yield — jars by year</CardTitle>
        <BarChart data={byYear.map(y => ({ label:String(y.year), value:y.jars, color:AMBER }))} height={180} />
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <Card>
          <CardTitle>Weight by year</CardTitle>
          <BarChart data={byYear.map(y => ({ label:String(y.year), value:y.lbs, color:TEAL }))} height={140} />
          <div style={{ fontSize:11, color:"#9CA3AF", marginTop:4, textAlign:"center" }}>lbs</div>
        </Card>
        <Card>
          <CardTitle>Frames by year</CardTitle>
          <BarChart data={byYear.map(y => ({ label:String(y.year), value:y.frames, color:"#7C3AED" }))} height={140} />
          <div style={{ fontSize:11, color:"#9CA3AF", marginTop:4, textAlign:"center" }}>super frames extracted</div>
        </Card>
      </div>

      <Card style={{ marginBottom:20 }}>
        <CardTitle sub="Total jars by season across all years">Yield by season</CardTitle>
        <div style={{ display:"flex", alignItems:"center", gap:32 }}>
          <DonutChart segments={seasonData} size={130} />
          <div>
            {seasonData.map((d,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <div style={{ width:12, height:12, borderRadius:"50%", background:d.color }} />
                <span style={{ fontSize:14, color:"#374151", fontWeight:500 }}>{d.label}</span>
                <span style={{ fontSize:14, fontWeight:800, color:d.color, marginLeft:4 }}>{d.value} jars</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Full harvest log</CardTitle>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #E5E7EB" }}>
              {["Date","Season","Frames","Jars","Weight","Notes"].map(h => (
                <th key={h} style={{ textAlign:"left", fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em", padding:"0 8px 10px 0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allHarvests.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(h => (
              <tr key={h.id} style={{ borderBottom:"0.5px solid #F3F4F6" }}>
                <td style={{ padding:"10px 8px 10px 0", fontSize:13, color:"#374151", fontWeight:600 }}>{fmt(h.date)}</td>
                <td style={{ padding:"10px 8px 10px 0" }}><span style={{ background:seasonColors[h.season]+"22", color:seasonColors[h.season], fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99 }}>{h.season}</span></td>
                <td style={{ padding:"10px 8px 10px 0", fontSize:13, color:"#374151" }}>{h.superFrames}</td>
                <td style={{ padding:"10px 8px 10px 0", fontSize:14, fontWeight:800, color:AMBER }}>{h.jars}</td>
                <td style={{ padding:"10px 8px 10px 0", fontSize:13, color:"#374151" }}>{h.weightLbs}lb</td>
                <td style={{ padding:"10px 8px 10px 0", fontSize:12, color:"#9CA3AF" }}>{h.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Tab: Queens ───────────────────────────────────────────────────────────────

function QueenTab() {
  const active = allQueens.filter(q => !q.lostDate);
  const lost = allQueens.filter(q => q.lostDate);
  const rated = allQueens.filter(q => q.temperRating);
  const avgTemper = rated.length ? (rated.reduce((s,q)=>s+q.temperRating,0)/rated.length).toFixed(1) : "—";

  const cBg = { White:"#F9FAFB", Yellow:AMBER_LIGHT, Red:RED_LIGHT, Green:"#EAF3DE", Blue:"#E6F1FB" };
  const cTx = { White:"#374151", Yellow:"#633806", Red:"#791F1F", Green:"#27500A", Blue:"#0C447C" };

  const lostReasons = [...new Set(lost.map(q => q.lostReason).filter(Boolean))];
  const lostByReason = lostReasons.map(r => ({
    label: r, value: lost.filter(q => q.lostReason===r).length,
    color: r==="Swarmed" ? AMBER : r==="Died" ? RED : r==="Superseded" ? "#7C3AED" : "#9CA3AF"
  }));

  // Family tree renderer
  const roots = allQueens.filter(q => !q.motherQueenId);
  const QNode = ({ queen, depth=0 }) => {
    const children = allQueens.filter(q => q.motherQueenId === queen.id);
    const hive = allHives.find(h => h.id === queen.hiveId);
    return (
      <div style={{ marginLeft: depth * 24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"0.5px solid #F9FAFB", position:"relative" }}>
          {depth > 0 && <div style={{ position:"absolute", left:-16, top:"50%", width:12, height:1, background:"#D1D5DB" }} />}
          <div style={{ width:36, height:36, borderRadius:"50%", background:cBg[queen.colour]||"#F9FAFB", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:cTx[queen.colour]||"#374151", flexShrink:0 }}>Q{queen.number}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color: queen.lostDate ? "#9CA3AF" : "#111827" }}>
              Queen #{queen.number}
              {hive && <span style={{ fontSize:12, fontWeight:400, color:"#9CA3AF" }}> · Hive {hive.number}</span>}
              <span style={{ fontSize:11, background: queen.lostDate ? "#F1EFE8" : TEAL_LIGHT, color: queen.lostDate ? "#5F5E5A" : "#085041", padding:"2px 8px", borderRadius:99, fontWeight:700, marginLeft:8 }}>{queen.lostDate ? queen.lostReason : "Active"}</span>
            </div>
            <div style={{ fontSize:12, color:"#9CA3AF" }}>
              {queen.colour} · {queen.year} · {queen.origin}
              {queen.temperRating && <span style={{ marginLeft:8, fontWeight:600, color: queen.temperRating>=4?TEAL:queen.temperRating>=3?AMBER:RED }}>Temper {queen.temperRating}/5</span>}
            </div>
          </div>
        </div>
        {children.length > 0 && (
          <div style={{ borderLeft:"2px solid #E5E7EB", marginLeft:17, paddingLeft:0 }}>
            {children.map(c => <QNode key={c.id} queen={c} depth={depth+1} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <StatGrid stats={[
        { label:"Active queens", value:active.length },
        { label:"Historical", value:lost.length, color:"#9CA3AF" },
        { label:"Avg temperament", value:avgTemper, sub:"/ 5", color:parseFloat(avgTemper)>=4?TEAL:AMBER },
        { label:"Colony losses", value:lost.filter(q=>q.lostReason==="Died").length, sub:"deadouts recorded", color:RED },
      ]} />

      <Card style={{ marginBottom:20 }}>
        <CardTitle sub="All queens — mother to daughter relationships">Queen lineage tree</CardTitle>
        {roots.map(q => <QNode key={q.id} queen={q} />)}
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <Card>
          <CardTitle>Temperament by queen</CardTitle>
          <BarChart
            data={allQueens.filter(q=>q.temperRating).map(q => ({
              label:`Q${q.number}`,
              value:q.temperRating,
              sublabel: q.lostDate ? "†" : "",
              color: q.temperRating>=4 ? TEAL_MID : q.temperRating>=3 ? AMBER : RED
            }))}
            height={160}
          />
          <div style={{ fontSize:11, color:"#9CA3AF", marginTop:4 }}>† = lost queen. 5 = very calm, 1 = dangerous.</div>
        </Card>

        <Card>
          <CardTitle>Queen losses by reason</CardTitle>
          <DonutChart segments={lostByReason} size={110} />
          <div style={{ marginTop:10 }}>
            {lostByReason.map((d,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                <div style={{ width:9, height:9, borderRadius:"50%", background:d.color }} />
                <span style={{ fontSize:12, color:"#6B7280" }}>{d.label}: <strong style={{ color:d.color }}>{d.value}</strong></span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Queen register</CardTitle>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #E5E7EB" }}>
              {["#","Hive","Colour","Year","Origin","Temper","Status"].map(h => (
                <th key={h} style={{ textAlign:"left", fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em", padding:"0 8px 10px 0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allQueens.sort((a,b)=>b.number-a.number).map(q => {
              const hive = allHives.find(h => h.id===q.hiveId);
              return (
                <tr key={q.id} style={{ borderBottom:"0.5px solid #F3F4F6", opacity: q.lostDate ? 0.7 : 1 }}>
                  <td style={{ padding:"9px 8px 9px 0" }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:cBg[q.colour]||"#F9FAFB", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:cTx[q.colour]||"#374151" }}>Q{q.number}</div>
                  </td>
                  <td style={{ padding:"9px 8px 9px 0", fontSize:13, color:"#374151" }}>{hive?`Hive ${hive.number}`:"—"}</td>
                  <td style={{ padding:"9px 8px 9px 0", fontSize:13, color:"#374151" }}>{q.colour}</td>
                  <td style={{ padding:"9px 8px 9px 0", fontSize:13, color:"#374151" }}>{q.year}</td>
                  <td style={{ padding:"9px 8px 9px 0", fontSize:12, color:"#6B7280", maxWidth:160 }}>{q.origin}</td>
                  <td style={{ padding:"9px 8px 9px 0", fontSize:13, fontWeight:700, color: q.temperRating>=4?TEAL:q.temperRating>=3?AMBER:q.temperRating?RED:"#9CA3AF" }}>{q.temperRating?`${q.temperRating}/5`:"—"}</td>
                  <td style={{ padding:"9px 8px 9px 0" }}>
                    <span style={{ fontSize:11, background:q.lostDate?"#F1EFE8":TEAL_LIGHT, color:q.lostDate?"#5F5E5A":"#085041", padding:"2px 8px", borderRadius:99, fontWeight:700 }}>{q.lostDate?q.lostReason:"Active"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────

export default function Trends() {
  const [tab, setTab] = useState("colony");
  const [dbData, setDbData] = useState({ inspections:[], queens:[], harvests:[], treatments:[], hives:[], apiaries:[], feed_log:[] });
  const [dbLoading, setDbLoading] = useState(false);

  async function loadDbData() {
    setDbLoading(true);
    const [{ data: ins }, { data: q }, { data: h }, { data: t }, { data: hv }, { data: ap }, { data: fl }] = await Promise.all([
      supabase.from("inspections").select("*").order("visit_date", { ascending: false }),
      supabase.from("queens").select("*").order("number"),
      supabase.from("harvests").select("*").order("harvest_date", { ascending: false }),
      supabase.from("treatments").select("*").order("treatment_date", { ascending: false }),
      supabase.from("hives").select("*").order("number"),
      supabase.from("apiaries").select("*").order("name"),
      supabase.from("feed_log").select("*").order("feed_date", { ascending: false }),
    ]);
    setDbData({ inspections: ins||[], queens: q||[], harvests: h||[], treatments: t||[], hives: hv||[], apiaries: ap||[], feed_log: fl||[] });
    setDbLoading(false);
  }

  const tabs = [
    { id:"colony", label:"Colony health" },
    { id:"harvest", label:"Honey harvest" },
    { id:"queens", label:"Queen lineage" },
    { id:"data", label:"Raw data" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#F3F4F6", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", WebkitFontSmoothing:"antialiased" }}>
      {/* Header */}
      <div style={{ background:TEAL, padding:"0 0 0 0" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 32px 0" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <a href="/" style={{ color:"#9FE1CB", fontSize:13, textDecoration:"none" }}>← Back to app</a>
              </div>
              <div style={{ fontSize:32, fontWeight:800, color:"#fff", marginTop:4, letterSpacing:"-0.5px" }}>Waggle — Trends & data</div>
              <div style={{ fontSize:14, color:"#9FE1CB", marginTop:4 }}>Chapman Apiaries · {new Date().toLocaleDateString("en-GB",{ weekday:"long", day:"numeric", month:"long", year:"numeric" })}</div>
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {[["Farm",allHives.filter(h=>h.apiary==="Farm").length+" hives"],["Home",allHives.filter(h=>h.apiary==="Home").length+" hives"]].map(([label,val]) => (
                <div key={label} style={{ background:"rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 16px", textAlign:"center" }}>
                  <div style={{ fontSize:11, color:"#9FE1CB", fontWeight:700 }}>{label}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Tab bar */}
          <div style={{ display:"flex", gap:0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); if(t.id==="data") loadDbData(); }} style={{
                padding:"12px 24px",
                background:"none", border:"none",
                borderBottom: tab===t.id ? "3px solid #fff" : "3px solid transparent",
                color: tab===t.id ? "#fff" : "#9FE1CB",
                fontSize:15, fontWeight: tab===t.id ? 700 : 400,
                cursor:"pointer", fontFamily:"inherit",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 32px" }}>
        {tab==="colony" && <ColonyTab />}
        {tab==="harvest" && <HarvestTab />}
        {tab==="queens" && <QueenTab />}
        {tab==="data" && <DataTab data={dbData} loading={dbLoading} />}
      </div>
    </div>
  );
}

// ── DataTab component ─────────────────────────────────────────────────────────

function DataTab({ data, loading }) {
  const [activeTable, setActiveTable] = useState("inspections");

  function downloadCSV(rows, filename) {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map(row => headers.map(h => {
        const val = row[h] ?? "";
        return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
      }).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  const tables = [
    { id:"inspections", label:"Inspections",  count: data.inspections?.length  || 0 },
    { id:"queens",      label:"Queens",        count: data.queens?.length        || 0 },
    { id:"harvests",    label:"Harvests",      count: data.harvests?.length      || 0 },
    { id:"treatments",  label:"Treatments",    count: data.treatments?.length    || 0 },
    { id:"hives",       label:"Hives",         count: data.hives?.length         || 0 },
    { id:"apiaries",    label:"Apiaries",      count: data.apiaries?.length      || 0 },
    { id:"feed_log",    label:"Feed log",      count: data.feed_log?.length      || 0 },
  ];

  const rows = data[activeTable] || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]).filter(k => k !== "id") : [];

  const TEAL = "#0F6E56";
  const TEAL_LIGHT = "#E1F5EE";

  if (loading) {
    return <div style={{ textAlign:"center", padding:"60px 20px", color:"#9CA3AF", fontSize:15 }}>Loading data…</div>;
  }

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", gap:8 }}>
          {tables.map(t => (
            <button key={t.id} onClick={() => setActiveTable(t.id)} style={{
              padding:"8px 16px", borderRadius:99,
              background: activeTable===t.id ? TEAL : "#fff",
              color: activeTable===t.id ? "#fff" : "#374151",
              border: activeTable===t.id ? `1.5px solid ${TEAL}` : "0.5px solid #D1D5DB",
              fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            }}>
              {t.label} <span style={{ opacity:0.7, fontWeight:400 }}>({t.count})</span>
            </button>
          ))}
        </div>
        <button onClick={() => downloadCSV(rows, `waggle_${activeTable}_${new Date().toISOString().split("T")[0]}.csv`)} style={{
          padding:"9px 18px", background: TEAL_LIGHT, color:"#085041",
          border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          display:"flex", alignItems:"center", gap:6,
        }}>
          ↓ Download CSV
        </button>
      </div>

      <div style={{ background:"#fff", borderRadius:16, border:"0.5px solid #E5E7EB", overflow:"hidden" }}>
        {rows.length === 0 ? (
          <div style={{ padding:"40px 24px", textAlign:"center", color:"#9CA3AF", fontSize:14 }}>No records found.</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#F9FAFB", borderBottom:"1px solid #E5E7EB" }}>
                  {columns.map(col => (
                    <th key={col} style={{ padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#6B7280", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>
                      {col.replace(/_/g," ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom:"0.5px solid #F3F4F6", background: i%2===0?"#fff":"#FAFAFA" }}>
                    {columns.map(col => {
                      const val = row[col];
                      const display = val === null || val === undefined ? "—" : typeof val === "boolean" ? (val ? "Yes" : "No") : String(val);
                      const isNote = col === "notes" || col === "health_note" || col === "qc_note";
                      return (
                        <td key={col} style={{ padding:"9px 14px", color:"#374151", verticalAlign:"top", maxWidth: isNote ? 300 : 180, whiteSpace: isNote ? "normal" : "nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ fontSize:12, color:"#9CA3AF", marginTop:12, textAlign:"right" }}>{rows.length} records · Internal IDs hidden · Last loaded {new Date().toLocaleTimeString("en-GB")}</div>
    </div>
  );
}