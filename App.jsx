import { useState } from "react";

const TEAL = "#0F6E56";
const TEAL_LIGHT = "#E1F5EE";
const TEAL_MID = "#1D9E75";
const AMBER = "#EF9F27";
const AMBER_LIGHT = "#FAEEDA";
const RED = "#E24B4A";
const RED_LIGHT = "#FCEBEB";

const initialHives = [
  { id: 1, number: 1, apiary: "Farm", status: "Active", queenId: 1, superCount: 1, type: "National Standard", qe: true, crownBoard: true, porterEscapes: false, entranceReducer: false, mouseGuard: false, insulation: false },
  { id: 2, number: 2, apiary: "Home", status: "Active", queenId: 8, superCount: 2, type: "National Standard", qe: true, crownBoard: true, porterEscapes: false, entranceReducer: false, mouseGuard: false, insulation: false },
  { id: 4, number: 4, apiary: "Farm", status: "Active", queenId: 7, superCount: 2, type: "National Standard", qe: true, crownBoard: true, porterEscapes: false, entranceReducer: false, mouseGuard: false, insulation: false },
  { id: 5, number: 5, apiary: "Farm", status: "Active", queenId: 10, superCount: 2, type: "National Standard", qe: true, crownBoard: true, porterEscapes: false, entranceReducer: false, mouseGuard: false, insulation: false },
  { id: 6, number: 6, apiary: "Farm", status: "Active", queenId: 9, superCount: 2, type: "National Standard", qe: true, crownBoard: true, porterEscapes: false, entranceReducer: false, mouseGuard: false, insulation: false },
];

const initialQueens = [
  { id: 1, number: 1, hiveId: 1, year: 2025, colour: "Blue", clipped: false, origin: "DLW colony from BMH", motherQueenId: null, qcCappedDate: "2025-05-24", queenEmergedDate: null, eggsFirstSeen: "2025-08-18", lostDate: null, lostReason: null, temperRating: 5, notes: "From BMH. DLW's." },
  { id: 7, number: 7, hiveId: 4, year: 2026, colour: "Yellow", clipped: false, origin: "Raised from QC", motherQueenId: 4, qcCappedDate: "2026-05-10", queenEmergedDate: null, eggsFirstSeen: null, lostDate: null, lostReason: null, temperRating: null, notes: "Split into Nuc 10/05" },
  { id: 8, number: 8, hiveId: 2, year: 2026, colour: "Yellow", clipped: false, origin: "Raised from QC", motherQueenId: 2, qcCappedDate: "2026-05-10", queenEmergedDate: null, eggsFirstSeen: null, lostDate: null, lostReason: null, temperRating: null, notes: "Virgin Q seen and marked yellow" },
  { id: 9, number: 9, hiveId: 6, year: 2026, colour: "Yellow", clipped: false, origin: "Raised from QC", motherQueenId: 6, qcCappedDate: "2026-05-10", queenEmergedDate: null, eggsFirstSeen: null, lostDate: null, lostReason: null, temperRating: null, notes: "" },
  { id: 10, number: 10, hiveId: 5, year: 2026, colour: "Yellow", clipped: false, origin: "Raised from QC", motherQueenId: 5, qcCappedDate: "2026-05-01", queenEmergedDate: null, eggsFirstSeen: null, lostDate: null, lostReason: null, temperRating: null, notes: "" },
  { id: 2, number: 2, hiveId: 2, year: 2025, colour: "Blue", clipped: false, origin: "BMH new queen", motherQueenId: null, qcCappedDate: null, queenEmergedDate: null, eggsFirstSeen: "2025-07-17", lostDate: "2026-05-10", lostReason: "Swarmed", temperRating: 4, notes: "" },
];

const initialInspections = [
  { id: 1, hiveId: 1, date: "2026-05-12", time: "13:00", queenSeen: "Seen", queenNumber: 1, queenColour: "Blue", qcCount: 0, qcAction: "None seen", qcNote: "", broodStatus: "BIAS", broodFrames: 2.5, stores: 5, room: 6, health: "OK", healthNote: "", varroa: "Low", temperament: 5, feedGiven: "None", feedQty: "", supersChange: 0, supersTotal: 1, weatherCondition: "Cloud", weatherTemp: 16, qe: true, crownBoard: true, porterEscapes: false, entranceReducer: false, mouseGuard: false, insulation: false, notes: "Drawn new comb under super. Removed old brood. Added fresh foundation." },
  { id: 2, hiveId: 4, date: "2026-05-10", time: "16:30", queenSeen: "Seen", queenNumber: 7, queenColour: "Green", qcCount: 4, qcAction: "2 left", qcNote: "4 capped QCs. Split performed.", broodStatus: "BIAS", broodFrames: 5, stores: 2, room: 3, health: "OK", healthNote: "", varroa: "Low", temperament: 4, feedGiven: "None", feedQty: "", supersChange: 0, supersTotal: 2, weatherCondition: "Cloud", weatherTemp: 14, qe: true, crownBoard: true, porterEscapes: false, entranceReducer: false, mouseGuard: false, insulation: false, notes: "SPLIT - Q in Nuc taken to Home. Hive 4 queenless. 2 x QCs left." },
  { id: 3, hiveId: 5, date: "2026-05-10", time: "15:30", queenSeen: "Not found", queenNumber: 10, queenColour: null, qcCount: 3, qcAction: "2 left", qcNote: "", broodStatus: "No eggs", broodFrames: 0, stores: 4, room: 5, health: "OK", healthNote: "", varroa: "Low", temperament: 4, feedGiven: "None", feedQty: "", supersChange: 0, supersTotal: 2, weatherCondition: "Cloud", weatherTemp: 14, qe: true, crownBoard: true, porterEscapes: false, entranceReducer: false, mouseGuard: false, insulation: false, notes: "Suspect swarmed. Expect eggs 22nd May. S1=85% S2=40%" },
];

const APIARIES = {
  Farm: { name: "Farm apiary", address: "Farm Lane, Darlington DL3", landowner: "J. Harrison", w3w: "filled.count.ripen", emergencyContact: "Kay Chapman", emergencyPhone: "07852 997063" },
  Home: { name: "Home apiary", address: "Home, Durham", landowner: "Peter Chapman", w3w: "lamp.sting.dark", emergencyContact: "Kay Chapman", emergencyPhone: "07852 997063" },
};

function addDays(dateStr, days) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  return Math.floor((new Date() - new Date(dateStr)) / 86400000);
}

function todayStr() { return new Date().toISOString().split("T")[0]; }
function nowTimeStr() { return new Date().toTimeString().slice(0, 5); }

function getQueenMilestones(queen) {
  if (!queen.qcCappedDate) return [];
  const capped = queen.qcCappedDate;
  return [
    { label: "QC capped", date: capped, confirmed: true },
    { label: "Queen expected to emerge", date: addDays(capped, 16), confirmed: !!queen.queenEmergedDate, actual: queen.queenEmergedDate },
    { label: "Virgin queen mature", date: addDays(capped, 20), confirmed: false },
    { label: "Mating flights begin", date: addDays(capped, 22), confirmed: false },
    { label: "Earliest expected eggs", date: addDays(capped, 25), confirmed: !!queen.eggsFirstSeen, actual: queen.eggsFirstSeen },
  ];
}

function generateActions(hive, inspections, queens) {
  const actions = [];
  const hiveInspections = inspections.filter(i => i.hiveId === hive.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const last = hiveInspections[0];
  const queen = queens.find(q => q.id === hive.queenId && !q.lostDate);
  const days = last ? daysSince(last.date) : 999;

  if (last) {
    if (last.qcAction === "1 left" || last.qcAction === "2 left")
      actions.push({ text: `Check if queen cell has hatched — left ${last.qcAction} on ${formatDate(last.date)}`, priority: "high" });
    if (last.broodStatus === "No eggs")
      actions.push({ text: `No eggs seen ${formatDate(last.date)} — check for new queen or eggs`, priority: "high" });
    if (last.varroa === "High")
      actions.push({ text: "Varroa drop HIGH — consider treatment urgently", priority: "high" });
    if (last.health !== "OK")
      actions.push({ text: `Disease concern: ${last.health} — follow up required`, priority: "high" });
    if (last.room <= 1)
      actions.push({ text: "Hive congested — add super or consider split", priority: "medium" });
    if (last.supersTotal > 0)
      actions.push({ text: `Check super fill — ${last.supersTotal} super${last.supersTotal > 1 ? "s" : ""} on hive`, priority: "medium" });
    if (days > 10)
      actions.push({ text: `Inspection overdue — last visit ${formatDate(last.date)} (${days} days ago)`, priority: "low" });
  } else {
    actions.push({ text: "No inspections recorded — log first inspection", priority: "high" });
  }

  if (queen) {
    getQueenMilestones(queen).forEach(m => {
      if (!m.confirmed && m.date) {
        const daysUntil = -daysSince(m.date);
        if (daysUntil <= 3 && daysUntil >= -3)
          actions.push({ text: `Queen milestone: ${m.label} around ${formatDate(m.date)}`, priority: "high" });
      }
    });
  }
  return actions;
}

// ── UI primitives ──────────────────────────────────────────────────────────

function Badge({ children, color = "teal" }) {
  const map = { teal: [TEAL_LIGHT, "#085041"], amber: [AMBER_LIGHT, "#633806"], red: [RED_LIGHT, "#791F1F"], gray: ["#F1EFE8", "#5F5E5A"] };
  const [bg, text] = map[color] || map.teal;
  return <span style={{ background: bg, color: text, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, display: "inline-block" }}>{children}</span>;
}

function SegPicker({ options, value, onChange, small }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(opt => {
        const sel = opt === value;
        return (
          <button key={opt} onClick={() => onChange(opt)} style={{
            flex: 1, minWidth: 56, padding: small ? "9px 4px" : "13px 4px",
            border: sel ? `1.5px solid ${TEAL}` : "0.5px solid #D1D5DB",
            borderRadius: 10, background: sel ? TEAL : "#fff",
            color: sel ? "#fff" : "#374151",
            fontSize: small ? 12 : 14, fontWeight: sel ? 700 : 400,
            cursor: "pointer", fontFamily: "inherit", lineHeight: 1.2,
          }}>{opt}</button>
        );
      })}
    </div>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", background: "#F9FAFB", border: "0.5px solid #E5E7EB", borderRadius: 10 }}>
      <span style={{ fontSize: 13, color: "#6B7280" }}>{label}</span>
      <div onClick={() => onChange(!value)} style={{ width: 40, height: 24, borderRadius: 99, background: value ? TEAL : "#D1D5DB", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}>
        <div style={{ position: "absolute", width: 20, height: 20, borderRadius: "50%", background: "#fff", top: 2, left: value ? 18 : 2, transition: "left 0.2s" }} />
      </div>
    </div>
  );
}

function Slider({ min, max, step = 0.5, value, onChange, unit = " fr" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ flex: 1, accentColor: TEAL, height: 4 }} />
      <span style={{ fontSize: 16, fontWeight: 700, color: "#111827", minWidth: 52, textAlign: "right" }}>{value}{unit}</span>
    </div>
  );
}

function Stepper({ value, onChange, min = 0, max = 99, display }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={{ width: 48, height: 48, border: "0.5px solid #D1D5DB", borderRadius: 10, background: "#fff", fontSize: 22, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>−</button>
      <div style={{ flex: 1, textAlign: "center" }}>{display || <span style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{value}</span>}</div>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={{ width: 48, height: 48, border: "0.5px solid #D1D5DB", borderRadius: 10, background: "#fff", fontSize: 22, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>+</button>
    </div>
  );
}

function TemperPicker({ value, onChange }) {
  const labels = { 1: "Aborted", 2: "Aggressive", 3: "Agitated", 4: "OK", 5: "Calm" };
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            flex: 1, padding: "14px 0",
            border: n === value ? `1.5px solid ${TEAL}` : "0.5px solid #D1D5DB",
            borderRadius: 10, background: n === value ? TEAL : "#fff",
            color: n === value ? "#fff" : "#374151",
            fontSize: 16, fontWeight: n === value ? 700 : 400,
            cursor: "pointer", fontFamily: "inherit",
          }}>{n}</button>
        ))}
      </div>
      {value && <div style={{ textAlign: "center", fontSize: 13, color: "#9CA3AF" }}>{labels[value]}</div>}
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ padding: "12px 16px 10px", borderBottom: "0.5px solid #F3F4F6" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function FormRow({ label, sublabel, children, last }) {
  return (
    <div style={{ padding: "14px 16px", borderBottom: last ? "none" : "0.5px solid #F3F4F6" }}>
      {label && <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{label}</span>
        {sublabel && <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 6 }}>{sublabel}</span>}
      </div>}
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10, paddingLeft: 2 }}>{children}</div>;
}

function ActionBanner({ action }) {
  const map = { high: [RED_LIGHT, "#FECACA", "#991B1B", RED], medium: [AMBER_LIGHT, "#FDE68A", "#92400E", AMBER], low: ["#F9FAFB", "#E5E7EB", "#6B7280", "#9CA3AF"] };
  const [bg, border, text, dot] = map[action.priority] || map.low;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 16px", background: bg, borderBottom: `0.5px solid ${border}` }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0, marginTop: 4 }} />
      <span style={{ fontSize: 13, color: text, lineHeight: 1.5, flex: 1 }}>{action.text}</span>
    </div>
  );
}

// ── Screens ────────────────────────────────────────────────────────────────

function HomeScreen({ hives, inspections, queens, onInspect, onSafety, onHistory }) {
  const farmHives = hives.filter(h => h.apiary === "Farm");
  const homeHives = hives.filter(h => h.apiary === "Home");
  const totalHigh = hives.reduce((n, h) => n + generateActions(h, inspections, queens).filter(a => a.priority === "high").length, 0);

  const HiveCard = ({ hive }) => {
    const actions = generateActions(hive, inspections, queens);
    const high = actions.filter(a => a.priority === "high");
    const med = actions.filter(a => a.priority === "medium");
    const low = actions.filter(a => a.priority === "low");
    const last = inspections.filter(i => i.hiveId === hive.id).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const statusColor = high.length ? RED : med.length ? AMBER : TEAL_MID;
    const [open, setOpen] = useState(high.length > 0);

    return (
      <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #E5E7EB", marginBottom: 10, overflow: "hidden" }}>
        <div onClick={() => setOpen(!open)} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: open ? "0.5px solid #F3F4F6" : "none" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: TEAL_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#085041", flexShrink: 0 }}>{hive.number}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Hive {hive.number}</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>{hive.apiary} · {last ? `Last inspected ${formatDate(last.date)}` : "Never inspected"}</div>
          </div>
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
          <span style={{ color: "#9CA3AF", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
        </div>

        {open && (
          <>
            {[...high, ...med, ...low].map((a, i) => <ActionBanner key={i} action={a} />)}
            {actions.length === 0 && last && (
              <div style={{ padding: "10px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                <Badge>BIAS {last.broodFrames}fr</Badge>
                <Badge>Stores {last.stores}</Badge>
                <Badge>{last.supersTotal} super{last.supersTotal !== 1 ? "s" : ""}</Badge>
                <Badge>Temper {last.temperament}/5</Badge>
              </div>
            )}
            <div style={{ padding: "10px 16px 14px", display: "flex", gap: 8 }}>
              <button onClick={() => onInspect(hive)} style={{ flex: 1, padding: "13px", background: TEAL, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ✓ Inspect
              </button>
              <button onClick={() => onHistory(hive)} style={{ padding: "13px 16px", background: "#F9FAFB", color: "#6B7280", border: "0.5px solid #E5E7EB", borderRadius: 10, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
                History
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: TEAL, padding: "env(safe-area-inset-top, 12px) 16px 16px", paddingTop: "max(env(safe-area-inset-top, 0px), 12px)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Waggle</div>
            <div style={{ fontSize: 13, color: "#9FE1CB", marginTop: 1 }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          <button onClick={onSafety} style={{ background: RED, border: "none", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            SOS
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["Farm", farmHives.length + " hives"], ["Home", homeHives.length + " hives"], ["Actions", totalHigh + " urgent"]].map(([label, val]) => (
            <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "9px 10px" }}>
              <div style={{ fontSize: 11, color: "#9FE1CB", fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginTop: 1 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: "#F3F4F6", padding: "14px 12px", WebkitOverflowScrolling: "touch" }}>
        <SectionLabel>Farm apiary</SectionLabel>
        {farmHives.map(h => <HiveCard key={h.id} hive={h} />)}
        <SectionLabel>Home apiary</SectionLabel>
        {homeHives.map(h => <HiveCard key={h.id} hive={h} />)}
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

function InspectionForm({ hive, queens, onSave, onBack }) {
  const activeQueen = queens.find(q => q.id === hive.queenId && !q.lostDate);
  const [form, setForm] = useState({
    date: todayStr(), time: nowTimeStr(),
    queenSeen: "", queenNumber: activeQueen?.number || "", queenColour: activeQueen?.colour || "",
    qcCount: 0, qcAction: "None seen", qcNote: "",
    broodStatus: "BIAS", broodFrames: 3,
    stores: 5, room: 4,
    health: "OK", healthNote: "",
    varroa: "Not checked",
    temperament: null,
    feedGiven: "None", feedQty: "",
    supersChange: 0,
    weatherCondition: "Sun", weatherTemp: 16,
    qe: hive.qe, crownBoard: hive.crownBoard, porterEscapes: hive.porterEscapes,
    entranceReducer: hive.entranceReducer, mouseGuard: hive.mouseGuard, insulation: hive.insulation,
    notes: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const supersTotal = Math.max(0, hive.superCount + form.supersChange);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: TEAL, padding: "env(safe-area-inset-top, 12px) 16px 14px", paddingTop: "max(env(safe-area-inset-top, 0px), 12px)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9FE1CB", fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 8, fontFamily: "inherit" }}>← Back</button>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>Hive {hive.number} — inspection</div>
        <div style={{ fontSize: 12, color: "#9FE1CB", marginTop: 2 }}>{hive.apiary} apiary · {form.date} · {form.time}</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: "#F3F4F6", padding: "12px", WebkitOverflowScrolling: "touch" }}>

        <FormSection title="Queen">
          <FormRow label="Queen seen?">
            <SegPicker options={["Seen", "Not found", "Not looked"]} value={form.queenSeen} onChange={v => set("queenSeen", v)} />
          </FormRow>
          <FormRow label="Queen colour">
            <SegPicker options={["White", "Yellow", "Red", "Green", "Blue"]} value={form.queenColour} onChange={v => set("queenColour", v)} small />
          </FormRow>
          <FormRow label="Queen cells seen">
            <Stepper value={form.qcCount} onChange={v => set("qcCount", v)} max={20} />
          </FormRow>
          {form.qcCount > 0 && (
            <FormRow label="Action taken">
              <SegPicker options={["All removed", "1 left", "2 left", "Other"]} value={form.qcAction} onChange={v => set("qcAction", v)} />
            </FormRow>
          )}
          <FormRow label="QC notes" last>
            <input value={form.qcNote} onChange={e => set("qcNote", e.target.value)} placeholder="Frame locations, capped vs open…" style={{ width: "100%", border: "0.5px solid #D1D5DB", borderRadius: 10, padding: "12px", fontSize: 14, fontFamily: "inherit", background: "#fff", color: "#111827" }} />
          </FormRow>
        </FormSection>

        <FormSection title="Brood">
          <FormRow label="Status">
            <SegPicker options={["BIAS", "No eggs", "No brood", "Drone only"]} value={form.broodStatus} onChange={v => set("broodStatus", v)} />
          </FormRow>
          {form.broodStatus === "BIAS" && (
            <FormRow label="Frames covered (BIAS)">
              <Slider min={0.5} max={11} step={0.5} value={form.broodFrames} onChange={v => set("broodFrames", v)} unit=" fr" />
            </FormRow>
          )}
          <FormRow label="Stores" sublabel="space available in brood box">
            <Slider min={0} max={20} step={1} value={form.stores} onChange={v => set("stores", v)} unit=" fr" />
          </FormRow>
          <FormRow label="Room" sublabel="space for queen to lay" last>
            <Slider min={0} max={11} step={1} value={form.room} onChange={v => set("room", v)} unit=" fr" />
          </FormRow>
        </FormSection>

        <FormSection title="Health & Varroa">
          <FormRow label="Health status">
            <SegPicker options={["OK", "Chalk brood?", "EFB?", "AFB?", "Varroa concern"]} value={form.health} onChange={v => set("health", v)} small />
          </FormRow>
          {form.health !== "OK" && (
            <FormRow label="Health note">
              <textarea value={form.healthNote} onChange={e => set("healthNote", e.target.value)} placeholder="Describe what you observed…" style={{ width: "100%", minHeight: 72, border: "0.5px solid #D1D5DB", borderRadius: 10, padding: "12px", fontSize: 14, fontFamily: "inherit", resize: "none", background: "#fff", color: "#111827" }} />
            </FormRow>
          )}
          <FormRow label="Varroa drop" last>
            <SegPicker options={["Not checked", "Low", "Medium", "High"]} value={form.varroa} onChange={v => set("varroa", v)} />
          </FormRow>
        </FormSection>

        <FormSection title="Temperament">
          <FormRow label="Colony temperament" sublabel="5 = very calm · 1 = aborted inspection" last>
            <TemperPicker value={form.temperament} onChange={v => set("temperament", v)} />
          </FormRow>
        </FormSection>

        <FormSection title="Supers">
          <FormRow label="Change this visit" last>
            <Stepper value={form.supersChange} min={-10} max={10} onChange={v => set("supersChange", v)}
              display={
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{form.supersChange > 0 ? `+${form.supersChange}` : form.supersChange}</div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>Total now: {supersTotal} super{supersTotal !== 1 ? "s" : ""}</div>
                </div>
              }
            />
          </FormRow>
        </FormSection>

        <FormSection title="Feed">
          <FormRow label="Feed given">
            <SegPicker options={["None", "Light syrup (1:1)", "Heavy syrup (2:1)", "Fondant", "Pollen patty"]} value={form.feedGiven} onChange={v => set("feedGiven", v)} small />
          </FormRow>
          {form.feedGiven !== "None" && (
            <FormRow label="Quantity" last>
              <input value={form.feedQty} onChange={e => set("feedQty", e.target.value)} placeholder="e.g. 2 litres, 2 kg" style={{ width: "100%", border: "0.5px solid #D1D5DB", borderRadius: 10, padding: "12px", fontSize: 14, fontFamily: "inherit", background: "#fff", color: "#111827" }} />
            </FormRow>
          )}
        </FormSection>

        <FormSection title="Hive configuration">
          <FormRow last>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[["qe", "QE fitted"], ["crownBoard", "Crown board"], ["porterEscapes", "Porter escapes"], ["entranceReducer", "Entrance reducer"], ["mouseGuard", "Mouse guard"], ["insulation", "Insulation"]].map(([k, l]) => (
                <Toggle key={k} value={form[k]} onChange={v => set(k, v)} label={l} />
              ))}
            </div>
          </FormRow>
        </FormSection>

        <FormSection title="Weather">
          <FormRow label="Conditions">
            <SegPicker options={["Sun", "Cloud", "Rain", "Fair"]} value={form.weatherCondition} onChange={v => set("weatherCondition", v)} />
          </FormRow>
          <FormRow label="Temperature" last>
            <Stepper value={form.weatherTemp} min={-10} max={40} display={<span style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>{form.weatherTemp}°C</span>} onChange={v => set("weatherTemp", v)} />
          </FormRow>
        </FormSection>

        <FormSection title="Notes">
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Observations, actions taken, things to remember…" style={{ width: "100%", minHeight: 120, border: "none", padding: "14px 16px", fontSize: 15, fontFamily: "inherit", resize: "none", background: "transparent", color: "#111827", display: "block" }} />
        </FormSection>

        <button onClick={() => onSave({ id: Date.now(), hiveId: hive.id, ...form, supersTotal })} style={{ width: "100%", padding: 18, background: TEAL, color: "#fff", border: "none", borderRadius: 14, fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 32 }}>
          Save inspection
        </button>
      </div>
    </div>
  );
}

function QueenRegister({ queens, hives, onBack }) {
  const [openId, setOpenId] = useState(null);
  const active = queens.filter(q => !q.lostDate).sort((a, b) => a.number - b.number);
  const lost = queens.filter(q => q.lostDate).sort((a, b) => b.number - a.number);
  const cBg = { White: "#F9FAFB", Yellow: AMBER_LIGHT, Red: RED_LIGHT, Green: "#EAF3DE", Blue: "#E6F1FB" };
  const cTx = { White: "#374151", Yellow: "#633806", Red: "#791F1F", Green: "#27500A", Blue: "#0C447C" };

  const QCard = ({ queen, isLost }) => {
    const hive = hives.find(h => h.id === queen.hiveId);
    const milestones = getQueenMilestones(queen);
    const isOpen = openId === queen.id;
    return (
      <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #E5E7EB", marginBottom: 8, overflow: "hidden", opacity: isLost ? 0.75 : 1 }}>
        <div onClick={() => setOpenId(isOpen ? null : queen.id)} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: cBg[queen.colour] || "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: cTx[queen.colour] || "#374151", flexShrink: 0 }}>Q{queen.number}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Queen #{queen.number}{hive ? ` · Hive ${hive.number}` : ""}</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>{queen.colour} · {queen.year} · {queen.origin}</div>
          </div>
          <Badge color={isLost ? "gray" : "teal"}>{isLost ? queen.lostReason : "Active"}</Badge>
        </div>
        {isOpen && (
          <div style={{ borderTop: "0.5px solid #F3F4F6", padding: "14px 16px" }}>
            {milestones.length > 0 && (
              <div style={{ borderLeft: `2px solid #9FE1CB`, marginLeft: 6, paddingLeft: 14, marginBottom: 12 }}>
                {milestones.map((m, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", position: "relative" }}>
                    <div style={{ position: "absolute", left: -20, top: 11, width: 8, height: 8, borderRadius: "50%", background: m.confirmed ? TEAL_MID : "#D1D5DB", border: "2px solid #F9FAFB" }} />
                    <span style={{ fontSize: 12, color: "#9CA3AF", minWidth: 72, flexShrink: 0 }}>{formatDate(m.actual || m.date) || "—"}</span>
                    <div>
                      <div style={{ fontSize: 14, color: m.confirmed ? "#111827" : "#9CA3AF" }}>{m.label}</div>
                      <span style={{ fontSize: 11, background: m.confirmed ? TEAL_LIGHT : AMBER_LIGHT, color: m.confirmed ? "#085041" : "#92400E", padding: "2px 8px", borderRadius: 99, fontWeight: 700, display: "inline-block", marginTop: 3 }}>
                        {m.confirmed ? "Confirmed" : "Projected"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {queen.notes ? <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10, lineHeight: 1.6 }}>{queen.notes}</p> : null}
            {queen.temperRating && <div style={{ marginBottom: 10 }}><Badge>Temperament {queen.temperRating}/5</Badge></div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: TEAL, padding: "env(safe-area-inset-top, 12px) 16px 14px", paddingTop: "max(env(safe-area-inset-top, 0px), 12px)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9FE1CB", fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 8, fontFamily: "inherit" }}>← Back</button>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>Queen register</div>
        <div style={{ fontSize: 12, color: "#9FE1CB", marginTop: 2 }}>{active.length} active · {lost.length} historical</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", background: "#F3F4F6", padding: "14px 12px", WebkitOverflowScrolling: "touch" }}>
        <SectionLabel>Active queens</SectionLabel>
        {active.map(q => <QCard key={q.id} queen={q} />)}
        <SectionLabel>Historical</SectionLabel>
        {lost.map(q => <QCard key={q.id} queen={q} isLost />)}
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

function SafetyScreen({ hives, onBack }) {
  const [apiary, setApiary] = useState("Farm");
  const a = APIARIES[apiary];
  const apiaryHives = hives.filter(h => h.apiary === apiary);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: TEAL }}>
      <div style={{ padding: "max(env(safe-area-inset-top, 0px), 12px) 16px 14px", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9FE1CB", fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 8, fontFamily: "inherit" }}>← Back</button>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 10 }}>Apiary safety</div>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.keys(APIARIES).map(name => (
            <button key={name} onClick={() => setApiary(name)} style={{ padding: "8px 18px", borderRadius: 99, background: apiary === name ? "#fff" : "rgba(255,255,255,0.15)", color: apiary === name ? TEAL : "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{name}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, background: "#F3F4F6", borderRadius: "22px 22px 0 0", overflowY: "auto", padding: "16px 12px", WebkitOverflowScrolling: "touch" }}>
        <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #E5E7EB", padding: 16, marginBottom: 10 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{a.name}</div>
          <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 12 }}>{a.address}{a.landowner ? ` · ${a.landowner}` : ""}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: TEAL_LIGHT, color: "#085041", fontSize: 14, fontWeight: 700, padding: "9px 14px", borderRadius: 99 }}>
            📍 {a.w3w}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #E5E7EB", padding: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: TEAL_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#085041", flexShrink: 0 }}>
            {a.emergencyContact.split(" ").map(w => w[0]).join("")}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{a.emergencyContact}</div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>Emergency contact</div>
            <div style={{ fontSize: 14, color: TEAL, fontWeight: 600, marginTop: 3 }}>{a.emergencyPhone}</div>
          </div>
        </div>

        <a href={`tel:${a.emergencyPhone}`} style={{ textDecoration: "none", display: "block", marginBottom: 12 }}>
          <div style={{ width: "100%", padding: 20, background: RED, color: "#fff", border: "none", borderRadius: 14, fontSize: 18, fontWeight: 800, cursor: "pointer", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            📞 Call {a.emergencyContact}
          </div>
        </a>

        <SectionLabel>Hives at this apiary</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {apiaryHives.map(h => (
            <div key={h.id} style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #E5E7EB", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: TEAL_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#085041" }}>{h.number}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Hive {h.number}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{h.status}</div>
              </div>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: h.status === "Active" ? TEAL_MID : RED, flexShrink: 0 }} />
            </div>
          ))}
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

function InspectionHistory({ hive, inspections, onBack }) {
  const list = inspections.filter(i => i.hiveId === hive.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: TEAL, padding: "max(env(safe-area-inset-top, 0px), 12px) 16px 14px", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9FE1CB", fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 8, fontFamily: "inherit" }}>← Back</button>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>Hive {hive.number} — history</div>
        <div style={{ fontSize: 12, color: "#9FE1CB", marginTop: 2 }}>{list.length} inspection{list.length !== 1 ? "s" : ""}</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", background: "#F3F4F6", padding: "14px 12px", WebkitOverflowScrolling: "touch" }}>
        {list.length === 0 && <div style={{ textAlign: "center", color: "#9CA3AF", padding: "48px 20px", fontSize: 15 }}>No inspections recorded yet.</div>}
        {list.map(ins => (
          <div key={ins.id} style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #E5E7EB", marginBottom: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px 10px", borderBottom: "0.5px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{formatDate(ins.date)}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <Badge color={ins.varroa === "High" ? "red" : ins.varroa === "Medium" ? "amber" : "teal"}>{ins.varroa} varroa</Badge>
                {ins.temperament && <Badge>Temper {ins.temperament}/5</Badge>}
              </div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: ins.notes ? 10 : 0 }}>
                <Badge>{ins.broodStatus}{ins.broodStatus === "BIAS" ? ` ${ins.broodFrames}fr` : ""}</Badge>
                <Badge>Stores {ins.stores}</Badge>
                <Badge>Room {ins.room}</Badge>
                <Badge color={ins.health === "OK" ? "teal" : "red"}>{ins.health}</Badge>
                <Badge>{ins.supersTotal} super{ins.supersTotal !== 1 ? "s" : ""}</Badge>
                {ins.feedGiven !== "None" && <Badge color="amber">Fed: {ins.feedGiven}</Badge>}
                <Badge color="gray">{ins.weatherCondition} {ins.weatherTemp}°C</Badge>
              </div>
              {ins.qcCount > 0 && <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 6 }}>QCs: {ins.qcCount} seen · {ins.qcAction}{ins.qcNote ? ` · ${ins.qcNote}` : ""}</div>}
              {ins.notes && <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, borderTop: "0.5px solid #F3F4F6", paddingTop: 10 }}>{ins.notes}</div>}
            </div>
          </div>
        ))}
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

function TabBar({ active, onChange }) {
  const tabs = [{ id: "home", label: "Home", icon: "⌂" }, { id: "queens", label: "Queens", icon: "♛" }, { id: "safety", label: "Safety", icon: "⊕" }];
  return (
    <div style={{ display: "flex", background: "#fff", borderTop: "0.5px solid #E5E7EB", flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 0 12px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ fontSize: 22, color: active === t.id ? TEAL : "#9CA3AF" }}>{t.icon}</span>
          <span style={{ fontSize: 11, color: active === t.id ? TEAL : "#9CA3AF", fontWeight: active === t.id ? 700 : 400 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [hives, setHives] = useState(initialHives);
  const [queens] = useState(initialQueens);
  const [inspections, setInspections] = useState(initialInspections);
  const [screen, setScreen] = useState("home");
  const [tab, setTab] = useState("home");
  const [selectedHive, setSelectedHive] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleInspect = hive => { setSelectedHive(hive); setScreen("inspect"); };
  const handleHistory = hive => { setSelectedHive(hive); setScreen("history"); };

  const handleSaveInspection = (inspection) => {
    setInspections(prev => [inspection, ...prev]);
    setHives(prev => prev.map(h => h.id === selectedHive.id ? { ...h, superCount: Math.max(0, h.superCount + inspection.supersChange) } : h));
    setScreen("home"); setTab("home");
    showToast(`Hive ${selectedHive.number} inspection saved ✓`);
  };

  const handleTab = t => { setTab(t); setScreen(t); };
  const handleBack = () => { setScreen("home"); setTab("home"); };

  const showTab = ["home", "queens", "safety"].includes(screen);

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: TEAL, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", WebkitFontSmoothing: "antialiased", position: "relative" }}>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {screen === "home" && <HomeScreen hives={hives} inspections={inspections} queens={queens} onInspect={handleInspect} onSafety={() => { setScreen("safety"); setTab("safety"); }} onHistory={handleHistory} />}
        {screen === "inspect" && selectedHive && <InspectionForm hive={selectedHive} queens={queens} onSave={handleSaveInspection} onBack={handleBack} />}
        {screen === "queens" && <QueenRegister queens={queens} hives={hives} onBack={handleBack} />}
        {screen === "safety" && <SafetyScreen hives={hives} onBack={handleBack} />}
        {screen === "history" && selectedHive && <InspectionHistory hive={selectedHive} inspections={inspections} onBack={handleBack} />}
      </div>

      {showTab && <TabBar active={tab} onChange={handleTab} />}

      {toast && (
        <div style={{ position: "absolute", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "#111827", color: "#fff", padding: "12px 20px", borderRadius: 99, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", zIndex: 999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
