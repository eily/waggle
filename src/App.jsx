import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import {
  BeeSimple, BeeFull, HiveBox, HoneycombIcon, QueenIcon,
  HoneyJar, QueenCellIcon, AlertCircle, CheckCircle,
  InspectionIcon, SwarmIcon, VarroaIcon, SafetyIcon,
  TrendIcon, SuperCountIcon, BroodFrameIcon,
} from "./icons.jsx";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  teal:      "#0A5E48",
  tealMid:   "#0F6E56",
  tealLight: "#E0F5EE",
  tealSoft:  "#C8EDE1",
  amber:     "#D4880A",
  amberLight:"#FEF3DC",
  red:       "#C93B3A",
  redLight:  "#FCEAEA",
  ink:       "#1A1A1A",
  inkMid:    "#4A4A4A",
  inkLight:  "#9A9A9A",
  border:    "#E8E8E8",
  surface:   "#F8F7F4",
  white:     "#FFFFFF",
};

const FONT_DISPLAY = "'DM Serif Display', Georgia, serif";
const FONT_SANS    = "'DM Sans', -apple-system, sans-serif";

const APIARIES = {
  Farm: { name:"Farm apiary", address:"Elton Moor Farm, Whinney Hill, Darlington Back Lane, TS21 1BQ", landowner:"Jonathan Marsh", w3w:"clean.verge.ample", emergencyContact:"Kay Chapman", emergencyPhone:"07852997063" },
  Home: { name:"Home apiary", address:"47 Grosvenor Road, Stockton on Tees, TS19 7AE", landowner:"Peter Chapman", w3w:"tests.hunt.social", emergencyContact:"Kay Chapman", emergencyPhone:"07852997063" },
};

// Queen colours by year (IBRA system: 2021=White, 2022=Yellow, 2023=Red, 2024=Green, 2025=Blue, cycle repeats)
const YEAR_COLOURS = {0:"White",1:"Yellow",2:"Red",3:"Green",4:"Blue"};
function yearColour(year){ return YEAR_COLOURS[year%5] || "White"; }

// ── Helpers ───────────────────────────────────────────────────────────────────
function addDays(d,n){if(!d)return null;const x=new Date(d);x.setDate(x.getDate()+n);return x.toISOString().split("T")[0];}
function formatDate(d){if(!d)return null;const x=new Date(d);return x.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:x.getFullYear()!==new Date().getFullYear()?"numeric":undefined});}
function daysSince(d){if(!d)return 999;return Math.floor((new Date()-new Date(d))/86400000);}
function todayStr(){return new Date().toISOString().split("T")[0];}
function nowTimeStr(){return new Date().toTimeString().slice(0,5);}
function weekNum(d){const dt=new Date(d||Date.now());const jan1=new Date(dt.getFullYear(),0,1);return Math.ceil(((dt-jan1)/86400000+jan1.getDay()+1)/7);}

function getQueenMilestones(q){
  if(!q.qc_capped_date)return[];
  const c=q.qc_capped_date;
  return[
    {label:"QC capped",date:c,confirmed:true},
    {label:"Queen expected to emerge",date:addDays(c,16),confirmed:!!q.queen_emerged_date,actual:q.queen_emerged_date},
    {label:"Virgin queen mature",date:addDays(c,20),confirmed:false},
    {label:"Mating flights begin",date:addDays(c,22),confirmed:false},
    {label:"Earliest expected eggs",date:addDays(c,25),confirmed:!!q.eggs_first_seen,actual:q.eggs_first_seen},
  ];
}

function generateActions(hive,inspections,queens){
  const actions=[];
  const hi=inspections.filter(i=>i.hive_id===hive.id).sort((a,b)=>new Date(b.visit_date)-new Date(a.visit_date));
  const last=hi[0];
  const queen=queens.find(q=>q.hive_id===hive.id&&!q.lost_date);
  const days=last?daysSince(last.visit_date):999;
  if(last){
    if(last.qc_action==="1 left"||last.qc_action==="2 left")actions.push({text:`Check if queen cell has hatched — left ${last.qc_action} on ${formatDate(last.visit_date)}`,priority:"high"});
    if(last.queen_status==="Queenless")actions.push({text:`Colony queenless since ${formatDate(last.visit_date)} — check for QCs or new queen`,priority:"high"});
    if(last.brood_status==="No eggs")actions.push({text:`No eggs seen ${formatDate(last.visit_date)} — check for new queen`,priority:"high"});
    if(last.varroa==="High")actions.push({text:"Varroa drop HIGH — consider treatment urgently",priority:"high"});
    if(last.health!=="OK")actions.push({text:`Disease concern: ${last.health} — follow up required`,priority:"high"});
    if(last.room<=1)actions.push({text:"Hive congested — add super or consider split",priority:"medium"});
    if(last.supers_total>0)actions.push({text:`Check super fill — ${last.supers_total} super${last.supers_total>1?"s":""} on hive`,priority:"medium"});
    if(days>14){
      const month=new Date().getMonth()+1;
      const inSeason=month>=3&&month<=9;
      if(inSeason)actions.push({text:`Inspection overdue — last visit ${formatDate(last.visit_date)} (${days} days ago)`,priority:"low"});
    }
  }else{actions.push({text:"No inspections recorded — log first inspection",priority:"high"});}
  if(queen)getQueenMilestones(queen).forEach(m=>{if(!m.confirmed&&m.date){const du=-daysSince(m.date);if(du<=3&&du>=-3)actions.push({text:`Queen milestone: ${m.label} around ${formatDate(m.date)}`,priority:"high"});}});
  return actions;
}

// ── Honeycomb header background ───────────────────────────────────────────────
function HoneycombBg(){
  return(
    <svg style={{position:"absolute",top:0,right:-20,opacity:0.07,pointerEvents:"none"}} width="180" height="160" viewBox="0 0 180 160" fill="none" aria-hidden="true">
      <g stroke="#fff" strokeWidth="1">
        <polygon points="45,8 75,8 90,34 75,60 45,60 30,34"/>
        <polygon points="90,34 120,34 135,60 120,86 90,86 75,60"/>
        <polygon points="45,60 75,60 90,86 75,112 45,112 30,86"/>
        <polygon points="90,86 120,86 135,112 120,138 90,138 75,112"/>
        <polygon points="135,8 165,8 180,34 165,60 135,60 120,34"/>
        <polygon points="0,34 30,34 45,60 30,86 0,86 -15,60"/>
        <polygon points="135,60 165,60 180,86 165,112 135,112 120,86"/>
      </g>
    </svg>
  );
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti(){
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");
    canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight;
    const W=canvas.width,H=canvas.height;
    const colors=["#9FE1CB","#FAC775","#fff","#5DCAA5","#EF9F27","#C8EDE1"];
    const particles=Array.from({length:55},()=>({
      x:Math.random()*W,y:-10-Math.random()*50,
      vx:(Math.random()-0.5)*2.5,vy:1.5+Math.random()*2.5,
      size:3+Math.random()*5,color:colors[Math.floor(Math.random()*colors.length)],
      angle:Math.random()*Math.PI*2,spin:(Math.random()-0.5)*0.18,
    }));
    let frame=0,raf;
    function draw(){
      ctx.clearRect(0,0,W,H);
      particles.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy;p.angle+=p.spin;
        if(p.y>H+10){p.y=-10;p.x=Math.random()*W;}
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
        ctx.fillStyle=p.color;ctx.globalAlpha=0.85;
        ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);
        ctx.restore();
      });
      if(frame++<350)raf=requestAnimationFrame(draw);
    }
    const t=setTimeout(()=>draw(),200);
    return()=>{clearTimeout(t);cancelAnimationFrame(raf);};
  },[]);
  return<canvas ref={ref} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}}/>;
}

// ── Inspection saved celebration ──────────────────────────────────────────────
function InspectionSavedScreen({hive,seasonCount,weekCount,streak,onDone}){
  const[vis,setVis]=useState([false,false,false]);
  useEffect(()=>{[80,240,420].forEach((t,i)=>setTimeout(()=>setVis(v=>{const n=[...v];n[i]=true;return n;}),t));},[]);
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:`linear-gradient(160deg, ${T.teal} 0%, ${T.tealMid} 100%)`,position:"relative",overflow:"hidden"}}>
      <HoneycombBg/>
      <Confetti/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 28px",position:"relative",zIndex:1}}>
        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {[0,1,2].map(i=>(
            <span key={i} style={{transition:"all 0.5s cubic-bezier(0.34,1.56,0.64,1)",opacity:vis[i]?1:0,transform:vis[i]?"translateY(0) scale(1)":"translateY(24px) scale(0.3)",display:"inline-block"}}>
              <BeeSimple size={i===1?40:28}/>
            </span>
          ))}
        </div>
        <div style={{fontFamily:FONT_DISPLAY,fontSize:32,color:"#fff",textAlign:"center",marginBottom:8,lineHeight:1.1}}>
          Hive {hive.number} logged!
        </div>
        <div style={{fontFamily:FONT_SANS,fontSize:14,color:"#9FE1CB",textAlign:"center",lineHeight:1.5,marginBottom:32}}>
          {new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})} · All fields saved
        </div>
        <div style={{display:"flex",gap:10,width:"100%",marginBottom:32}}>
          {[[<BeeSimple size={20}/>,weekCount,"This week"],[<InspectionIcon size={20}/>,seasonCount,"This season"],[<span style={{fontSize:20}}>🔥</span>,streak+"wk","Streak"]].map(([icon,val,lbl],i)=>(
            <div key={i} style={{flex:1,background:"rgba(255,255,255,0.12)",borderRadius:14,padding:"14px 8px",textAlign:"center",backdropFilter:"blur(4px)"}}>
              <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
              <div style={{fontFamily:FONT_SANS,fontSize:22,fontWeight:700,color:"#fff",letterSpacing:"-0.5px"}}>{val}</div>
              <div style={{fontFamily:FONT_SANS,fontSize:10,color:"#9FE1CB",marginTop:3,lineHeight:1.3,textTransform:"uppercase",letterSpacing:"0.04em"}}>{lbl}</div>
            </div>
          ))}
        </div>
        <button onClick={onDone} style={{width:"100%",padding:17,background:"#fff",color:T.teal,border:"none",borderRadius:14,fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS,letterSpacing:"-0.2px"}}>
          Back to hives
        </button>
      </div>
    </div>
  );
}

// ── First eggs milestone ──────────────────────────────────────────────────────
function FirstEggsMilestone({hive,queen,onLog,onDismiss}){
  return(
    <div style={{position:"absolute",inset:0,background:"rgba(10,20,15,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,zIndex:50,backdropFilter:"blur(2px)"}}>
      <div style={{background:"#fff",borderRadius:24,padding:"32px 24px",textAlign:"center",width:"100%",maxWidth:340}}>
        <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><BeeFull size={52}/></div>
        <div style={{display:"inline-block",background:T.tealLight,color:T.teal,fontSize:11,fontWeight:700,padding:"5px 14px",borderRadius:99,marginBottom:12,fontFamily:FONT_SANS,letterSpacing:"0.04em",textTransform:"uppercase"}}>Queen milestone</div>
        <div style={{fontFamily:FONT_DISPLAY,fontSize:24,color:T.ink,marginBottom:8,lineHeight:1.2}}>First eggs in<br/>Hive {hive.number}!</div>
        <div style={{fontFamily:FONT_SANS,fontSize:13,color:T.inkMid,lineHeight:1.6,marginBottom:20}}>
          {queen?`Queen #${queen.number} is laying.`:"The colony is back on track."} The colony is back on track.
        </div>
        {queen?.qc_capped_date&&(
          <div style={{background:T.surface,border:`0.5px solid ${T.border}`,borderRadius:12,padding:"12px 16px",marginBottom:20,textAlign:"left"}}>
            <div style={{fontFamily:FONT_SANS,fontSize:11,color:T.inkLight,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Queen #{queen.number} · Hive {hive.number}</div>
            <div style={{fontFamily:FONT_SANS,fontSize:13,fontWeight:600,color:T.ink,marginTop:4}}>QC capped {formatDate(queen.qc_capped_date)} → eggs today</div>
          </div>
        )}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onLog} style={{flex:1,padding:14,background:T.tealMid,color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS}}>Log it ✓</button>
          <button onClick={onDismiss} style={{flex:1,padding:14,background:T.surface,color:T.inkMid,border:`0.5px solid ${T.border}`,borderRadius:12,fontSize:15,cursor:"pointer",fontFamily:FONT_SANS}}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}

// ── Queen seen / marked / clipped modal ──────────────────────────────────────
function QueenSeenModal({hive,queen,onDone}){
  const[marked,setMarked]=useState(queen?.marked||false);
  const[clipped,setClipped]=useState(queen?.clipped||false);
  const[saving,setSaving]=useState(false);
  const handleSave=async()=>{
    setSaving(true);
    if(queen){
      await supabase.from("queens").update({marked,clipped}).eq("id",queen.id);
    }
    onDone({marked,clipped});
    setSaving(false);
  };
  return(
    <div style={{position:"absolute",inset:0,background:"rgba(10,20,15,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,zIndex:50,backdropFilter:"blur(2px)"}}>
      <div style={{background:"#fff",borderRadius:24,padding:"28px 24px",width:"100%",maxWidth:340}}>
        <div style={{display:"inline-block",background:T.tealLight,color:T.teal,fontSize:11,fontWeight:700,padding:"5px 14px",borderRadius:99,marginBottom:14,fontFamily:FONT_SANS,letterSpacing:"0.04em",textTransform:"uppercase"}}>Queen seen</div>
        <div style={{fontFamily:FONT_DISPLAY,fontSize:22,color:T.ink,marginBottom:18,lineHeight:1.2}}>Is she marked<br/>and/or clipped?</div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22}}>
          <div onClick={()=>setMarked(!marked)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:marked?T.tealLight:T.surface,border:`1.5px solid ${marked?T.tealMid:T.border}`,borderRadius:12,cursor:"pointer",transition:"all 0.15s"}}>
            <span style={{fontFamily:FONT_SANS,fontSize:15,fontWeight:600,color:marked?T.teal:T.inkMid}}>Marked</span>
            <span style={{fontSize:20}}>{marked?"✓":""}</span>
          </div>
          <div onClick={()=>setClipped(!clipped)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:clipped?T.tealLight:T.surface,border:`1.5px solid ${clipped?T.tealMid:T.border}`,borderRadius:12,cursor:"pointer",transition:"all 0.15s"}}>
            <span style={{fontFamily:FONT_SANS,fontSize:15,fontWeight:600,color:clipped?T.teal:T.inkMid}}>Clipped</span>
            <span style={{fontSize:20}}>{clipped?"✓":""}</span>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:14,background:saving?"#9CA3AF":T.tealMid,color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS}}>
          {saving?"Saving…":"Save"}
        </button>
      </div>
    </div>
  );
}

// ── Harvest celebration ───────────────────────────────────────────────────────
function HarvestCelebration({harvest,previousBest,onDone}){
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:`linear-gradient(160deg, ${T.teal} 0%, #083D2D 100%)`,alignItems:"center",padding:"40px 24px",overflowY:"auto",position:"relative"}}>
      <HoneycombBg/>
      <div style={{position:"relative",zIndex:1,width:"100%",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{display:"flex",gap:10,marginBottom:20,alignItems:"center"}}>
          {[<BeeSimple size={36}/>,<HoneyJar size={36}/>,<BeeSimple size={36}/>].map((icon,i)=>(
            <span key={i} style={{display:"inline-block",animation:`hb${i} 1.2s ${i*0.25}s ease-in-out infinite alternate`}}>{icon}</span>
          ))}
        </div>
        <div style={{fontFamily:FONT_DISPLAY,fontSize:28,color:"#fff",textAlign:"center",marginBottom:4,lineHeight:1.1}}>{harvest.season} {harvest.year}</div>
        <div style={{fontFamily:FONT_SANS,fontSize:14,color:"#9FE1CB",marginBottom:28}}>Harvest logged · Chapman Apiaries</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,width:"100%",marginBottom:16}}>
          {[[harvest.jars,"jars produced"],[harvest.super_frames,"frames extracted"],[`${harvest.weight_lbs}lb`,"total weight"],["5","hives contributed"]].map(([v,l],i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.12)",borderRadius:14,padding:"16px 12px",textAlign:"center"}}>
              <div style={{fontFamily:FONT_DISPLAY,fontSize:30,color:"#fff",lineHeight:1}}>{v}</div>
              <div style={{fontFamily:FONT_SANS,fontSize:11,color:"#9FE1CB",marginTop:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>{l}</div>
            </div>
          ))}
        </div>
        {previousBest&&(
          <div style={{background:"rgba(255,255,255,0.1)",borderRadius:12,padding:"12px 18px",width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <div>
              <div style={{fontFamily:FONT_SANS,fontSize:11,color:"#9FE1CB",textTransform:"uppercase",letterSpacing:"0.04em"}}>vs {harvest.season} {harvest.year-1}</div>
              <div style={{fontFamily:FONT_SANS,fontSize:15,fontWeight:600,color:"#fff",marginTop:2}}>{previousBest} jars last year</div>
            </div>
            <div style={{fontFamily:FONT_SANS,fontSize:16,color:harvest.jars>=previousBest?"#9FE1CB":"#FAC775",fontWeight:800}}>
              {harvest.jars>=previousBest?"↑ Best yet!":"↓ "+(Math.round((1-harvest.jars/previousBest)*100))+"%"}
            </div>
          </div>
        )}
        <button onClick={onDone} style={{width:"100%",padding:17,background:"#fff",color:T.teal,border:"none",borderRadius:14,fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS}}>
          Back to hives
        </button>
      </div>
      <style>{`@keyframes hb0{from{transform:scale(1) rotate(-4deg)}to{transform:scale(1.1) rotate(4deg)}}@keyframes hb1{from{transform:scale(0.95)}to{transform:scale(1.08)}}@keyframes hb2{from{transform:scale(1) rotate(4deg)}to{transform:scale(1.1) rotate(-4deg)}}`}</style>
    </div>
  );
}

// ── Streak card ───────────────────────────────────────────────────────────────
function StreakCard({inspections,hives}){
  const activeHives=hives.filter(h=>h.status==="Active");
  const currentWeek=weekNum();
  const weeks=[-3,-2,-1,0,1,2].map(o=>currentWeek+o);
  const weekDone=wk=>{const s=new Set(inspections.filter(i=>weekNum(i.visit_date)===wk).map(i=>i.hive_id));return activeHives.every(h=>s.has(h.id));};
  let streak=0;for(let w=currentWeek;w>=currentWeek-20;w--){if(weekDone(w))streak++;else break;}
  if(streak<2)return null;
  return(
    <div style={{background:T.white,border:`0.5px solid ${T.border}`,borderRadius:16,marginBottom:12,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
        <span style={{fontSize:28,flexShrink:0}}>🔥</span>
        <div>
          <div style={{fontFamily:FONT_SANS,fontSize:15,fontWeight:700,color:T.ink}}>{streak}-week inspection streak</div>
          <div style={{fontFamily:FONT_SANS,fontSize:12,color:T.inkLight,marginTop:1}}>Every hive checked every week</div>
        </div>
      </div>
      <div style={{display:"flex",gap:5,marginBottom:14}}>
        {weeks.map((wk,i)=>{
          const done=weekDone(wk),isNow=wk===currentWeek,future=wk>currentWeek;
          return<div key={i} style={{flex:1,height:38,borderRadius:9,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,
            background:future?"#F5F4F0":isNow&&done?T.tealMid:done?T.tealLight:"#F5F4F0",
            transition:"background 0.3s",
          }}>
            <span style={{fontSize:13,color:future?"#C8C4B8":isNow&&done?"#fff":done?T.teal:"#C8C4B8"}}>{done&&!future?"✓":"·"}</span>
            <span style={{fontFamily:FONT_SANS,fontSize:9,fontWeight:600,color:future?"#C8C4B8":isNow&&done?"#9FE1CB":done?T.tealMid:"#C8C4B8",letterSpacing:"0.02em"}}>W{wk}</span>
          </div>;
        })}
      </div>
        <div style={{background:T.surface,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontFamily:FONT_SANS,fontSize:13,color:T.inkMid}}>Personal best this season</span>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontFamily:FONT_SANS,fontSize:16,fontWeight:800,color:T.teal}}>{streak} weeks</span>
            <BeeSimple size={18}/>
          </div>
        </div>
    </div>
  );
}

// ── All clear banner ──────────────────────────────────────────────────────────
function AllClearBanner({hives,inspections}){
  const active=hives.filter(h=>h.status==="Active");
  if(!active.length)return null;
  const w=weekNum();
  const checked=active.filter(h=>inspections.some(i=>i.hive_id===h.id&&weekNum(i.visit_date)===w));
  if(checked.length<active.length)return null;
  return(
    <div style={{background:T.tealLight,border:`0.5px solid ${T.tealSoft}`,borderRadius:16,padding:"16px 18px",marginBottom:12,display:"flex",alignItems:"flex-start",gap:14}}>
      <BeeFull size={32}/>
      <div>
        <div style={{fontFamily:FONT_SANS,fontSize:15,fontWeight:700,color:T.teal,marginBottom:3}}>All hives checked this week</div>
        <div style={{fontFamily:FONT_SANS,fontSize:13,color:T.tealMid,lineHeight:1.5}}>Every colony has been visited. Nothing urgent. Enjoy the weekend.</div>
      </div>
    </div>
  );
}

// ── Shared UI primitives ──────────────────────────────────────────────────────
function Badge({children,color="teal"}){
  const map={
    teal:[T.tealLight,T.teal],
    amber:[T.amberLight,T.amber],
    red:[T.redLight,T.red],
    gray:["#F0EEE8","#6B6B6B"],
  };
  const[bg,text]=map[color]||map.teal;
  return<span style={{background:bg,color:text,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:99,display:"inline-block",fontFamily:FONT_SANS,letterSpacing:"0.02em"}}>{children}</span>;
}

function SegPicker({options,value,onChange,small}){
  return<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
    {options.map(opt=>{
      const sel=opt===value;
      return<button key={opt} onClick={()=>onChange(opt)} style={{
        flex:1,minWidth:52,padding:small?"10px 4px":"14px 4px",
        border:sel?`1.5px solid ${T.tealMid}`:`0.5px solid ${T.border}`,
        borderRadius:10,background:sel?T.tealMid:T.white,
        color:sel?"#fff":T.inkMid,
        fontSize:small?12:14,fontWeight:sel?700:400,
        cursor:"pointer",fontFamily:FONT_SANS,lineHeight:1.2,
        transition:"all 0.15s",
      }}>{opt}</button>;
    })}
  </div>;
}

function Toggle({value,onChange,label}){
  return<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:T.surface,border:`0.5px solid ${T.border}`,borderRadius:10}}>
    <span style={{fontFamily:FONT_SANS,fontSize:13,color:T.inkMid}}>{label}</span>
    <div onClick={()=>onChange(!value)} style={{width:42,height:24,borderRadius:99,background:value?T.tealMid:"#D8D5CC",position:"relative",cursor:"pointer",flexShrink:0,transition:"background 0.2s"}}>
      <div style={{position:"absolute",width:20,height:20,borderRadius:"50%",background:"#fff",top:2,left:value?20:2,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}}/>
    </div>
  </div>;
}

// +/- stepper — replaces sliders for frame counts etc.
function Stepper({value,onChange,min=0,max=99,display,unit=""}){
  return<div style={{display:"flex",alignItems:"center",gap:14}}>
    <button onClick={()=>onChange(Math.max(min,value-1))} style={{width:50,height:50,border:`0.5px solid ${T.border}`,borderRadius:12,background:T.white,fontSize:22,cursor:"pointer",fontFamily:FONT_SANS,flexShrink:0,color:T.inkMid}}>−</button>
    <div style={{flex:1,textAlign:"center"}}>{display||<span style={{fontFamily:FONT_SANS,fontSize:26,fontWeight:700,color:T.ink}}>{value}{unit&&<span style={{fontSize:16,color:T.inkLight,marginLeft:4}}>{unit}</span>}</span>}</div>
    <button onClick={()=>onChange(Math.min(max,value+1))} style={{width:50,height:50,border:`0.5px solid ${T.border}`,borderRadius:12,background:T.white,fontSize:22,cursor:"pointer",fontFamily:FONT_SANS,flexShrink:0,color:T.inkMid}}>+</button>
  </div>;
}

function TemperPicker({value,onChange}){
  const labels={1:"Aborted",2:"Aggressive",3:"Agitated",4:"Calm",5:"Very calm"};
  return<div>
    <div style={{display:"flex",gap:6,marginBottom:8}}>
      {[1,2,3,4,5].map(n=>(
        <button key={n} onClick={()=>onChange(n)} style={{
          flex:1,padding:"14px 0",
          border:n===value?`1.5px solid ${T.tealMid}`:`0.5px solid ${T.border}`,
          borderRadius:10,background:n===value?T.tealMid:T.white,
          color:n===value?"#fff":T.inkMid,
          fontSize:16,fontWeight:n===value?700:400,
          cursor:"pointer",fontFamily:FONT_SANS,
          transition:"all 0.15s",
        }}>{n}</button>
      ))}
    </div>
    {value&&<div style={{textAlign:"center",fontFamily:FONT_SANS,fontSize:13,color:T.inkLight}}>{labels[value]}</div>}
  </div>;
}

function FormSection({title,children}){
  return<div style={{background:T.white,border:`0.5px solid ${T.border}`,borderRadius:16,overflow:"hidden",marginBottom:12,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
    <div style={{padding:"11px 18px 9px",borderBottom:`0.5px solid ${T.border}`,background:T.surface}}>
      <span style={{fontFamily:FONT_SANS,fontSize:11,fontWeight:700,color:T.inkLight,textTransform:"uppercase",letterSpacing:"0.07em"}}>{title}</span>
    </div>
    {children}
  </div>;
}

function FormRow({label,sublabel,children,last}){
  return<div style={{padding:"15px 18px",borderBottom:last?"none":`0.5px solid ${T.border}`}}>
    {label&&<div style={{marginBottom:10}}>
      <span style={{fontFamily:FONT_SANS,fontSize:14,fontWeight:600,color:T.ink}}>{label}</span>
      {sublabel&&<span style={{fontFamily:FONT_SANS,fontSize:12,color:T.inkLight,marginLeft:6}}>{sublabel}</span>}
    </div>}
    {children}
  </div>;
}

function SectionLabel({children}){
  return<div style={{fontFamily:FONT_SANS,fontSize:11,fontWeight:700,color:T.inkLight,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10,paddingLeft:2}}>{children}</div>;
}

// Action banner — black text on red/amber for outdoor readability
function ActionBanner({action}){
  const map={
    high:  {bg:T.redLight,   border:"#FECACA", text:T.ink},
    medium:{bg:T.amberLight, border:"#FDE68A", text:T.ink},
    low:   {bg:T.surface,    border:T.border,  text:T.inkLight},
  };
  const s=map[action.priority]||map.low;
  return<div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 16px",background:s.bg,borderBottom:`0.5px solid ${s.border}`}}>
    <div style={{flexShrink:0,marginTop:2,width:8,height:8,borderRadius:"50%",background:action.priority==="high"?T.red:action.priority==="medium"?T.amber:T.inkLight,marginTop:6}}/>
    <span style={{fontFamily:FONT_SANS,fontSize:13,color:s.text,lineHeight:1.55,flex:1,fontWeight:action.priority==="low"?400:500}}>{action.text}</span>
  </div>;
}

function LoadingScreen(){
  return<div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`linear-gradient(160deg, ${T.teal} 0%, ${T.tealMid} 100%)`}}>
    <BeeSimple size={44}/>
    <div style={{fontFamily:FONT_DISPLAY,fontSize:34,color:"#fff",marginTop:12,marginBottom:6}}>Waggle</div>
    <div style={{fontFamily:FONT_SANS,fontSize:14,color:"#9FE1CB"}}>Loading your hives…</div>
  </div>;
}

function EmptyHiveState(){
  return<div style={{textAlign:"center",padding:"48px 24px"}}>
    <div style={{marginBottom:14,opacity:0.4,display:"flex",justifyContent:"center"}}><HiveBox size={52}/></div>
    <div style={{fontFamily:FONT_SANS,fontSize:15,fontWeight:600,color:T.inkMid,marginBottom:6}}>No inspections yet</div>
    <div style={{fontFamily:FONT_SANS,fontSize:13,color:T.inkLight,lineHeight:1.6}}>Once you log your first inspection, it will appear here.</div>
  </div>;
}

const inputStyle={width:"100%",border:`0.5px solid ${T.border}`,borderRadius:10,padding:"13px 14px",fontSize:14,fontFamily:FONT_SANS,background:T.white,color:T.ink,outline:"none"};

// ── App header (shared) ───────────────────────────────────────────────────────
function AppHeader({title,subtitle,onBack,rightSlot}){
  return<div style={{background:`linear-gradient(160deg, ${T.teal} 0%, ${T.tealMid} 100%)`,padding:"max(env(safe-area-inset-top,0px),12px) 18px 16px",flexShrink:0,position:"relative",overflow:"hidden"}}>
    <HoneycombBg/>
    <div style={{position:"relative",zIndex:1}}>
      {onBack&&<button onClick={onBack} style={{background:"none",border:"none",color:"#9FE1CB",fontSize:14,cursor:"pointer",padding:0,marginBottom:8,fontFamily:FONT_SANS,display:"flex",alignItems:"center",gap:4}}>← Back</button>}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div>
          <div style={{fontFamily:FONT_DISPLAY,fontSize:26,color:"#fff",letterSpacing:"-0.3px",lineHeight:1.1}}>{title}</div>
          {subtitle&&<div style={{fontFamily:FONT_SANS,fontSize:12,color:"#9FE1CB",marginTop:4}}>{subtitle}</div>}
        </div>
        {rightSlot}
      </div>
    </div>
  </div>;
}

// ── Home header ───────────────────────────────────────────────────────────────
function HomeHeader({farmCount,homeCount,nucCount,urgentCount,onSafety}){
  return<div style={{background:`linear-gradient(160deg, ${T.teal} 0%, ${T.tealMid} 100%)`,padding:"max(env(safe-area-inset-top,0px),14px) 18px 18px",flexShrink:0,position:"relative",overflow:"hidden"}}>
    <HoneycombBg/>
    <div style={{position:"relative",zIndex:1}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <BeeSimple size={26}/>
            <div style={{fontFamily:FONT_DISPLAY,fontSize:30,color:"#fff",letterSpacing:"-0.3px",lineHeight:1}}>Waggle</div>
          </div>
          <div style={{fontFamily:FONT_SANS,fontSize:12,color:"#9FE1CB"}}>
            {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
          </div>
        </div>
        <button onClick={onSafety} style={{background:T.red,border:"none",borderRadius:10,padding:"10px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS,letterSpacing:"0.02em"}}>SOS</button>
      </div>
      <div style={{display:"flex",gap:8}}>
        {[["Farm",farmCount+" hives"],["Home",homeCount+" hives"],nucCount>0?["Nucs",nucCount+" active"]:null,["Actions",urgentCount+" urgent"]].filter(Boolean).map(([label,val])=>(
          <div key={label} style={{flex:1,background:"rgba(255,255,255,0.14)",borderRadius:12,padding:"10px 12px",backdropFilter:"blur(4px)"}}>
            <div style={{fontFamily:FONT_SANS,fontSize:10,color:"#9FE1CB",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</div>
            <div style={{fontFamily:FONT_SANS,fontSize:17,fontWeight:700,color:"#fff",marginTop:2,letterSpacing:"-0.3px"}}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

// ── Add Hive Form ─────────────────────────────────────────────────────────────
function AddHiveForm({hives,onSave,onBack}){
  const nextNumber=Math.max(0,...hives.map(h=>typeof h.number==="number"?h.number:parseInt(h.number)||0))+1;
  const[form,setForm]=useState({
    number:nextNumber,apiary_name:"Farm",hive_type:"National Standard",
    status:"Active",super_count:0,notes:"",
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const[saving,setSaving]=useState(false);
  const handleSave=async()=>{
    setSaving(true);
    const{data,error}=await supabase.from("hives").insert([{...form,qe:false,crown_board:false,porter_escapes:false,entrance_reducer:false,mouse_guard:false,insulation:false}]).select().single();
    if(error){alert("Error: "+error.message);setSaving(false);}
    else{onSave(data);}
  };
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <AppHeader title="Add hive" subtitle="New colony" onBack={onBack}/>
    <div style={{flex:1,overflowY:"auto",background:T.surface,padding:"12px 14px",WebkitOverflowScrolling:"touch"}}>
      <FormSection title="Identity">
        <FormRow label="Hive number"><Stepper value={form.number} min={1} max={999} onChange={v=>set("number",v)}/></FormRow>
        <FormRow label="Apiary"><SegPicker options={["Farm","Home"]} value={form.apiary_name} onChange={v=>set("apiary_name",v)}/></FormRow>
        <FormRow label="Hive type" last><SegPicker options={["National Standard","National Deep (14x12)","Langstroth","Poly Nuc"]} value={form.hive_type} onChange={v=>set("hive_type",v)} small/></FormRow>
      </FormSection>
      <FormSection title="Notes">
        <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Origin, notes about this hive…" style={{width:"100%",minHeight:80,border:"none",padding:"16px 18px",fontSize:15,fontFamily:FONT_SANS,resize:"none",background:"transparent",color:T.ink,display:"block"}}/>
      </FormSection>
      <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:18,background:saving?"#9CA3AF":T.tealMid,color:"#fff",border:"none",borderRadius:14,fontSize:17,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:FONT_SANS,marginBottom:36}}>
        {saving?"Adding hive…":"Add hive"}
      </button>
    </div>
  </div>;
}

// ── Add Nuc Form ──────────────────────────────────────────────────────────────
function AddNucForm({nucs,hives,onSave,onBack}){
  const nextN=Math.max(0,...nucs.map(n=>parseInt(n.nuc_number)||0))+1;
  const[form,setForm]=useState({
    nuc_number:nextN,origin:"Swarm",parent_hive_id:"",
    apiary_name:"Farm",status:"Active",notes:"",established_date:todayStr(),
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const[saving,setSaving]=useState(false);
  const handleSave=async()=>{
    setSaving(true);
    const record={...form,parent_hive_id:form.origin==="Split"&&form.parent_hive_id?form.parent_hive_id:null};
    const{data,error}=await supabase.from("nucs").insert([record]).select().single();
    if(error){alert("Error: "+error.message);setSaving(false);}
    else{onSave(data);}
  };
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <AppHeader title="Add Nuc" subtitle="Temporary colony" onBack={onBack}/>
    <div style={{flex:1,overflowY:"auto",background:T.surface,padding:"12px 14px",WebkitOverflowScrolling:"touch"}}>
      <FormSection title="Identity">
        <FormRow label="Nuc number"><Stepper value={form.nuc_number} min={1} max={99} onChange={v=>set("nuc_number",v)} display={<span style={{fontFamily:FONT_SANS,fontSize:26,fontWeight:700,color:T.ink}}>N{form.nuc_number}</span>}/></FormRow>
        <FormRow label="Apiary"><SegPicker options={["Farm","Home"]} value={form.apiary_name} onChange={v=>set("apiary_name",v)}/></FormRow>
        <FormRow label="Date established" last><input type="date" value={form.established_date} onChange={e=>set("established_date",e.target.value)} style={inputStyle}/></FormRow>
      </FormSection>
      <FormSection title="Origin">
        <FormRow label="Where did this nuc come from?"><SegPicker options={["Swarm","Split"]} value={form.origin} onChange={v=>set("origin",v)}/></FormRow>
        {form.origin==="Split"&&<FormRow label="Parent hive" last>
          <select value={form.parent_hive_id} onChange={e=>set("parent_hive_id",e.target.value)} style={{...inputStyle,appearance:"none"}}>
            <option value="">Select parent hive…</option>
            {hives.filter(h=>h.status==="Active").map(h=><option key={h.id} value={h.id}>Hive {h.number} — {h.apiary_name}</option>)}
          </select>
        </FormRow>}
      </FormSection>
      <FormSection title="Notes">
        <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Queen status, condition, date caught…" style={{width:"100%",minHeight:80,border:"none",padding:"16px 18px",fontSize:15,fontFamily:FONT_SANS,resize:"none",background:"transparent",color:T.ink,display:"block"}}/>
      </FormSection>
      <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:18,background:saving?"#9CA3AF":T.tealMid,color:"#fff",border:"none",borderRadius:14,fontSize:17,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:FONT_SANS,marginBottom:36}}>
        {saving?"Adding nuc…":"Add N"+form.nuc_number}
      </button>
    </div>
  </div>;
}

// ── Promote Nuc → Hive ────────────────────────────────────────────────────────
function PromoteNucForm({nuc,hives,onSave,onBack}){
  const nextNumber=Math.max(0,...hives.map(h=>typeof h.number==="number"?h.number:parseInt(h.number)||0))+1;
  const[hiveNumber,setHiveNumber]=useState(nextNumber);
  const[apiary,setApiary]=useState(nuc.apiary_name||"Farm");
  const[hiveType,setHiveType]=useState("National Standard");
  const[saving,setSaving]=useState(false);
  const handleSave=async()=>{
    setSaving(true);
    // Create the new hive
    const{data:newHive,error:hiveErr}=await supabase.from("hives").insert([{
      number:hiveNumber,apiary_name:apiary,hive_type:hiveType,status:"Active",
      super_count:0,notes:`Promoted from Nuc N${nuc.nuc_number} on ${todayStr()}. Origin: ${nuc.origin}.`,
      qe:false,crown_board:false,porter_escapes:false,entrance_reducer:false,mouse_guard:false,insulation:false,
    }]).select().single();
    if(hiveErr){alert("Error: "+hiveErr.message);setSaving(false);return;}
    // Mark nuc as promoted
    await supabase.from("nucs").update({status:"Promoted",promoted_to_hive_id:newHive.id,promoted_date:todayStr()}).eq("id",nuc.id);
    onSave(newHive,{...nuc,status:"Promoted",promoted_to_hive_id:newHive.id});
  };
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <AppHeader title={`Promote N${nuc.nuc_number}`} subtitle="Move into a full hive" onBack={onBack}/>
    <div style={{flex:1,overflowY:"auto",background:T.surface,padding:"12px 14px",WebkitOverflowScrolling:"touch"}}>
      <div style={{background:T.tealLight,borderRadius:14,padding:"14px 18px",marginBottom:14}}>
        <div style={{fontFamily:FONT_SANS,fontSize:13,fontWeight:700,color:T.teal,marginBottom:3}}>Nuc N{nuc.nuc_number}</div>
        <div style={{fontFamily:FONT_SANS,fontSize:12,color:T.tealMid}}>Origin: {nuc.origin}{nuc.established_date?` · Est. ${formatDate(nuc.established_date)}`:""}</div>
        {nuc.notes&&<div style={{fontFamily:FONT_SANS,fontSize:12,color:T.tealMid,marginTop:4}}>{nuc.notes}</div>}
      </div>
      <FormSection title="New hive details">
        <FormRow label="Hive number"><Stepper value={hiveNumber} min={1} max={999} onChange={setHiveNumber}/></FormRow>
        <FormRow label="Apiary"><SegPicker options={["Farm","Home"]} value={apiary} onChange={setApiary}/></FormRow>
        <FormRow label="Hive type" last><SegPicker options={["National Standard","National Deep (14x12)","Langstroth"]} value={hiveType} onChange={setHiveType} small/></FormRow>
      </FormSection>
      <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:18,background:saving?"#9CA3AF":T.tealMid,color:"#fff",border:"none",borderRadius:14,fontSize:17,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:FONT_SANS,marginBottom:36}}>
        {saving?"Promoting…":`Create Hive ${hiveNumber} from N${nuc.nuc_number}`}
      </button>
    </div>
  </div>;
}

// ── Inspection Form ───────────────────────────────────────────────────────────
function InspectionForm({hive,queens,inspections,existingInspection,onSave,onBack}){
  const isEdit=!!existingInspection;
  const activeQueen=queens.find(q=>q.hive_id===hive.id&&!q.lost_date);

  // Get last inspection to default sliders
  const lastInspection=inspections
    .filter(i=>i.hive_id===hive.id)
    .sort((a,b)=>new Date(b.visit_date)-new Date(a.visit_date))[0];

  const mk=(k,fallback)=>{
    if(isEdit) return existingInspection[k]??fallback;
    // Default to last inspection value if available, else fallback
    return lastInspection?.(lastInspection[k]??fallback)??fallback;
  };

  const[form,setForm]=useState({
    visit_date:isEdit?existingInspection.visit_date:todayStr(),
    visit_time:isEdit?existingInspection.visit_time:nowTimeStr(),
    queen_status:isEdit?(existingInspection.queen_status||existingInspection.queen_seen||""):"",
    queen_colour:isEdit?(existingInspection.queen_colour||activeQueen?.colour||""):(activeQueen?.colour||""),
    qc_count:mk("qc_count",0),
    qc_action:mk("qc_action","None seen"),
    qc_note:mk("qc_note",""),
    brood_status:mk("brood_status","BIAS"),
    brood_frames:lastInspection?lastInspection.brood_frames??3:3,
    qc_capped_date:mk("qc_capped_date",""),
    qc_hatched_date:mk("qc_hatched_date",""),
    eggs_first_seen_date:mk("eggs_first_seen_date",""),
    stores:lastInspection?lastInspection.stores??5:5,
    room:lastInspection?lastInspection.room??4:4,
    health:mk("health","OK"),
    health_note:mk("health_note",""),
    varroa:mk("varroa","Not checked"),
    temperament:mk("temperament",null),
    feed_given:mk("feed_given","None"),
    feed_qty:mk("feed_qty",""),
    supers_change:mk("supers_change",0),
    weather_condition:mk("weather_condition","Sun"),
    weather_temp:mk("weather_temp",16),
    qe:mk("qe",hive.qe),
    crown_board:mk("crown_board",hive.crown_board),
    porter_escapes:mk("porter_escapes",hive.porter_escapes),
    entrance_reducer:mk("entrance_reducer",hive.entrance_reducer),
    mouse_guard:mk("mouse_guard",hive.mouse_guard),
    insulation:mk("insulation",hive.insulation),
    notes:mk("notes",""),
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const supersTotal=Math.max(0,hive.super_count+(isEdit?0:form.supers_change));
  const[saving,setSaving]=useState(false);
  const[showQueenModal,setShowQueenModal]=useState(false);

  const isQueenless=form.queen_status==="Queenless";
  const isVirgin=form.queen_status==="Virgin queen";
  const queenSeen=form.queen_status==="Seen";
  const eggsOrQueenSeen=queenSeen||form.brood_status==="BIAS";

  // When queen status changes to/from Queenless, adjust brood defaults
  const handleQueenStatus=v=>{
    set("queen_status",v);
    if(v==="Queenless"){
      set("brood_status","No eggs");
    }
  };

  const handleSave=async()=>{
    setSaving(true);
    // Map queen_status back to queen_seen for DB compatibility
    const record={
      ...form,
      queen_seen:form.queen_status,
      supers_total:supersTotal,
    };
    if(isEdit){
      const{error}=await supabase.from("inspections").update(record).eq("id",existingInspection.id);
      if(error){alert("Error: "+error.message);setSaving(false);return;}
      onSave({...existingInspection,...record},0,true,false);
    }else{
      const{error}=await supabase.from("inspections").insert([{hive_id:hive.id,...record}]);
      if(!error){
        await supabase.from("hives").update({super_count:supersTotal}).eq("id",hive.id);
        const firstEggs=queenSeen&&form.brood_status==="BIAS"&&!activeQueen?.eggs_first_seen;
        if(queenSeen&&!activeQueen?.marked){
          // Will show modal after save
          setShowQueenModal(true);
          setSaving(false);
          return;
        }
        onSave(record,form.supers_change,false,firstEggs);
      }else{alert("Error: "+error.message);}
    }
    setSaving(false);
  };

  if(showQueenModal){
    return<div style={{height:"100%",display:"flex",flexDirection:"column",position:"relative"}}>
      <AppHeader title={`Hive ${hive.number} — inspect`} subtitle="Queen seen" onBack={onBack}/>
      <div style={{flex:1,background:T.surface}}/>
      <QueenSeenModal hive={hive} queen={activeQueen} onDone={async({marked,clipped})=>{
        setShowQueenModal(false);
        // Update queen record if exists
        if(activeQueen){
          await supabase.from("queens").update({marked,clipped}).eq("id",activeQueen.id);
        }
        const record={...form,queen_seen:form.queen_status,supers_total:supersTotal};
        const{error}=await supabase.from("inspections").insert([{hive_id:hive.id,...record}]);
        if(!error){
          await supabase.from("hives").update({super_count:supersTotal}).eq("id",hive.id);
          const firstEggs=queenSeen&&form.brood_status==="BIAS"&&!activeQueen?.eggs_first_seen;
          onSave(record,form.supers_change,false,firstEggs);
        }else{alert("Error: "+error.message);}
      }}/>
    </div>;
  }

  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <AppHeader title={`Hive ${hive.number} — ${isEdit?"edit":"inspect"}`} subtitle={`${hive.apiary_name} · ${form.visit_date} · ${form.visit_time}`} onBack={onBack}/>
    <div style={{flex:1,overflowY:"auto",background:T.surface,padding:"12px 14px",WebkitOverflowScrolling:"touch"}}>

      {/* Queen Status */}
      <FormSection title="Queen status">
        <FormRow label="Queen status">
          <SegPicker
            options={["Seen","Not found","Not looked","Virgin queen","Queenless","DLQ","DLW"]}
            value={form.queen_status}
            onChange={handleQueenStatus}
            small
          />
        </FormRow>

        {/* Colour — only show if not queenless */}
        {!isQueenless&&(
          <FormRow label="Queen colour">
            <SegPicker options={["White","Yellow","Red","Green","Blue","Unknown"]} value={form.queen_colour} onChange={v=>set("queen_colour",v)} small/>
          </FormRow>
        )}

        <FormRow label="Queen cells seen">
          <Stepper value={form.qc_count} onChange={v=>set("qc_count",v)} max={20}/>
        </FormRow>
        {form.qc_count>0&&<FormRow label="Action taken">
          <SegPicker options={["All removed","1 left","2 left","Other"]} value={form.qc_action} onChange={v=>set("qc_action",v)}/>
        </FormRow>}
        <FormRow label="QC notes" last>
          <input value={form.qc_note} onChange={e=>set("qc_note",e.target.value)} placeholder="Frame locations, capped vs open…" style={inputStyle}/>
        </FormRow>
      </FormSection>

      {/* Brood — if queenless, show simplified queenless fields */}
      {isQueenless?(
        <FormSection title="Queenless status">
          <FormRow label="QC capped date">
            <input type="date" value={form.qc_capped_date} onChange={e=>set("qc_capped_date",e.target.value)} style={inputStyle}/>
          </FormRow>
          <FormRow label="QC hatched date">
            <input type="date" value={form.qc_hatched_date} onChange={e=>set("qc_hatched_date",e.target.value)} style={inputStyle}/>
          </FormRow>
          <FormRow label="Date eggs first seen" last>
            <input type="date" value={form.eggs_first_seen_date} onChange={e=>set("eggs_first_seen_date",e.target.value)} style={inputStyle}/>
          </FormRow>
        </FormSection>
      ):(
        <FormSection title="Brood">
          <FormRow label="Status">
            <SegPicker options={["BIAS","No eggs","No brood","Drone only"]} value={form.brood_status} onChange={v=>set("brood_status",v)}/>
          </FormRow>
          {form.brood_status==="BIAS"&&(
            <FormRow label="Frames covered">
              <Stepper value={form.brood_frames} min={0.5} max={11} onChange={v=>set("brood_frames",v)} unit="fr"/>
            </FormRow>
          )}
          <FormRow label="Stores" sublabel="frames">
            <Stepper value={form.stores} min={0} max={20} onChange={v=>set("stores",v)} unit="fr"/>
          </FormRow>
          <FormRow label="Room" sublabel="frames for queen to lay" last>
            <Stepper value={form.room} min={0} max={11} onChange={v=>set("room",v)} unit="fr"/>
          </FormRow>
        </FormSection>
      )}

      <FormSection title="Health & Varroa">
        <FormRow label="Health"><SegPicker options={["OK","Chalk brood?","EFB?","AFB?","Varroa concern"]} value={form.health} onChange={v=>set("health",v)} small/></FormRow>
        {form.health!=="OK"&&<FormRow label="Health note"><textarea value={form.health_note} onChange={e=>set("health_note",e.target.value)} placeholder="Describe what you observed…" style={{...inputStyle,minHeight:72,resize:"none"}}/></FormRow>}
        <FormRow label="Varroa drop" last><SegPicker options={["Not checked","Low","Medium","High"]} value={form.varroa} onChange={v=>set("varroa",v)}/></FormRow>
      </FormSection>

      <FormSection title="Temperament">
        <FormRow label="Colony temperament" sublabel="5 = very calm · 1 = aborted" last><TemperPicker value={form.temperament} onChange={v=>set("temperament",v)}/></FormRow>
      </FormSection>

      {!isEdit&&<FormSection title="Supers">
        <FormRow label="Change this visit" last>
          <Stepper value={form.supers_change} min={-10} max={10} onChange={v=>set("supers_change",v)}
            display={<div style={{textAlign:"center"}}>
              <div style={{fontFamily:FONT_SANS,fontSize:26,fontWeight:700,color:T.ink}}>{form.supers_change>0?`+${form.supers_change}`:form.supers_change}</div>
              <div style={{fontFamily:FONT_SANS,fontSize:12,color:T.inkLight,marginTop:2}}>Total now: {supersTotal} super{supersTotal!==1?"s":""}</div>
            </div>}/>
        </FormRow>
      </FormSection>}

      <FormSection title="Feed">
        <FormRow label="Feed given"><SegPicker options={["None","Light syrup (1:1)","Heavy syrup (2:1)","Fondant","Pollen patty"]} value={form.feed_given} onChange={v=>set("feed_given",v)} small/></FormRow>
        {form.feed_given!=="None"&&<FormRow label="Quantity" last><input value={form.feed_qty} onChange={e=>set("feed_qty",e.target.value)} placeholder="e.g. 2 litres, 2 kg" style={inputStyle}/></FormRow>}
      </FormSection>

      <FormSection title="Hive configuration">
        <FormRow last><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["qe","QE fitted"],["crown_board","Crown board"],["porter_escapes","Porter escapes"],["entrance_reducer","Entrance reducer"],["mouse_guard","Mouse guard"],["insulation","Insulation"]].map(([k,l])=><Toggle key={k} value={form[k]} onChange={v=>set(k,v)} label={l}/>)}
        </div></FormRow>
      </FormSection>

      <FormSection title="Weather">
        <FormRow label="Conditions"><SegPicker options={["Sun","Cloud","Rain","Fair"]} value={form.weather_condition} onChange={v=>set("weather_condition",v)}/></FormRow>
        <FormRow label="Temperature" last><Stepper value={form.weather_temp} min={-10} max={40} display={<span style={{fontFamily:FONT_DISPLAY,fontSize:30,color:T.ink}}>{form.weather_temp}°C</span>} onChange={v=>set("weather_temp",v)}/></FormRow>
      </FormSection>

      <FormSection title="Notes">
        <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Observations, actions taken, things to remember…" style={{width:"100%",minHeight:120,border:"none",padding:"16px 18px",fontSize:15,fontFamily:FONT_SANS,resize:"none",background:"transparent",color:T.ink,display:"block",lineHeight:1.6}}/>
      </FormSection>

      <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:18,background:saving?"#9CA3AF":T.tealMid,color:"#fff",border:"none",borderRadius:14,fontSize:17,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:FONT_SANS,marginBottom:36,letterSpacing:"-0.2px"}}>
        {saving?"Saving…":isEdit?"Update inspection":"Save inspection"}
      </button>
    </div>
  </div>;
}

// ── Queen Edit ────────────────────────────────────────────────────────────────
function QueenEditForm({queen,hives,onSave,onBack}){
  const[form,setForm]=useState({
    hive_id:queen.hive_id||"",colour:queen.colour||"",year:queen.year||new Date().getFullYear(),
    origin:queen.origin||"",marked:queen.marked||false,clipped:queen.clipped||false,
    qc_uncapped_date:queen.qc_uncapped_date||"",qc_capped_date:queen.qc_capped_date||"",
    queen_emerged_date:queen.queen_emerged_date||"",swarm_split_date:queen.swarm_split_date||"",
    eggs_first_seen:queen.eggs_first_seen||"",lost_date:queen.lost_date||"",
    lost_reason:queen.lost_reason||"",temper_rating:queen.temper_rating||null,notes:queen.notes||"",
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const[saving,setSaving]=useState(false);
  const handleSave=async()=>{
    setSaving(true);
    const update={...form,hive_id:form.hive_id||null,lost_date:form.lost_date||null,lost_reason:form.lost_reason||null};
    const{error}=await supabase.from("queens").update(update).eq("id",queen.id);
    if(error){alert("Error: "+error.message);}else{onSave({...queen,...update});}
    setSaving(false);
  };
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <AppHeader title={`Edit Queen #${queen.number}`} onBack={onBack}/>
    <div style={{flex:1,overflowY:"auto",background:T.surface,padding:"12px 14px",WebkitOverflowScrolling:"touch"}}>
      <FormSection title="Hive assignment">
        <FormRow label="Hive" last>
          <select value={form.hive_id} onChange={e=>set("hive_id",e.target.value)} style={{...inputStyle,appearance:"none"}}>
            <option value="">No hive (nuc / unassigned)</option>
            {hives.map(h=><option key={h.id} value={h.id}>Hive {h.number} — {h.apiary_name} ({h.status})</option>)}
          </select>
        </FormRow>
      </FormSection>
      <FormSection title="Identity">
        <FormRow label="Colour"><SegPicker options={["White","Yellow","Red","Green","Blue","TBC"]} value={form.colour} onChange={v=>set("colour",v)} small/></FormRow>
        <FormRow label="Year"><Stepper value={form.year} min={2020} max={2035} onChange={v=>set("year",v)}/></FormRow>
        <FormRow label="Origin"><input value={form.origin} onChange={e=>set("origin",e.target.value)} style={inputStyle} placeholder="e.g. Raised from QC, BMH colony…"/></FormRow>
        <FormRow label="Marked?"><Toggle value={form.marked} onChange={v=>set("marked",v)} label="Queen is marked"/></FormRow>
        <FormRow label="Clipped?" last><Toggle value={form.clipped} onChange={v=>set("clipped",v)} label="Queen is clipped"/></FormRow>
      </FormSection>
      <FormSection title="Key dates">
        {[["qc_uncapped_date","QC uncapped"],["qc_capped_date","QC capped"],["queen_emerged_date","Queen emerged"],["swarm_split_date","Swarm / split"],["eggs_first_seen","Eggs first seen"],["lost_date","Lost date"]].map(([k,l])=>(
          <FormRow key={k} label={l}><input type="date" value={form[k]} onChange={e=>set(k,e.target.value)} style={inputStyle}/></FormRow>
        ))}
        {form.lost_date&&<FormRow label="Lost reason" last><SegPicker options={["Swarmed","Died","Superseded","Unknown"]} value={form.lost_reason} onChange={v=>set("lost_reason",v)} small/></FormRow>}
      </FormSection>
      <FormSection title="Temperament">
        <FormRow label="Colony temperament" sublabel="5 = calm · 1 = aggressive" last><TemperPicker value={form.temper_rating} onChange={v=>set("temper_rating",v)}/></FormRow>
      </FormSection>
      <FormSection title="Notes">
        <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Notes about this queen…" style={{width:"100%",minHeight:80,border:"none",padding:"16px 18px",fontSize:15,fontFamily:FONT_SANS,resize:"none",background:"transparent",color:T.ink,display:"block"}}/>
      </FormSection>
      <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:18,background:saving?"#9CA3AF":T.tealMid,color:"#fff",border:"none",borderRadius:14,fontSize:17,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:FONT_SANS,marginBottom:36}}>
        {saving?"Saving…":"Save queen"}
      </button>
    </div>
  </div>;
}

// ── Hive Edit ─────────────────────────────────────────────────────────────────
function HiveEditForm({hive,onSave,onBack}){
  const[form,setForm]=useState({apiary_name:hive.apiary_name||"Farm",hive_type:hive.hive_type||"National Standard",status:hive.status||"Active",super_count:hive.super_count||0,deadout_reason:hive.deadout_reason||"",deadout_notes:hive.deadout_notes||"",notes:hive.notes||""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const[saving,setSaving]=useState(false);
  const handleSave=async()=>{
    setSaving(true);
    const{error}=await supabase.from("hives").update(form).eq("id",hive.id);
    if(error){alert("Error: "+error.message);}else{onSave({...hive,...form});}
    setSaving(false);
  };
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <AppHeader title={`Edit Hive ${hive.number}`} onBack={onBack}/>
    <div style={{flex:1,overflowY:"auto",background:T.surface,padding:"12px 14px",WebkitOverflowScrolling:"touch"}}>
      <FormSection title="Location & type">
        <FormRow label="Apiary"><SegPicker options={["Farm","Home"]} value={form.apiary_name} onChange={v=>set("apiary_name",v)}/></FormRow>
        <FormRow label="Hive type" last><SegPicker options={["National Standard","National Deep (14x12)","Langstroth","Poly Nuc"]} value={form.hive_type} onChange={v=>set("hive_type",v)} small/></FormRow>
      </FormSection>
      <FormSection title="Status">
        <FormRow label="Current status"><SegPicker options={["Active","Deadout","Empty"]} value={form.status} onChange={v=>set("status",v)}/></FormRow>
        {form.status==="Deadout"&&<FormRow label="Deadout reason"><SegPicker options={["Weak due to varroa","Wasps","EFB","AFB","Isolation starvation","Other"]} value={form.deadout_reason} onChange={v=>set("deadout_reason",v)} small/></FormRow>}
        {form.status==="Deadout"&&<FormRow label="Notes" last><textarea value={form.deadout_notes} onChange={e=>set("deadout_notes",e.target.value)} style={{...inputStyle,minHeight:60,resize:"none"}}/></FormRow>}
      </FormSection>
      <FormSection title="Supers">
        <FormRow label="Current super count" last><Stepper value={form.super_count} min={0} max={10} onChange={v=>set("super_count",v)}/></FormRow>
      </FormSection>
      <FormSection title="Notes">
        <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} style={{width:"100%",minHeight:80,border:"none",padding:"16px 18px",fontSize:15,fontFamily:FONT_SANS,resize:"none",background:"transparent",color:T.ink,display:"block"}}/>
      </FormSection>
      <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:18,background:saving?"#9CA3AF":T.tealMid,color:"#fff",border:"none",borderRadius:14,fontSize:17,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:FONT_SANS,marginBottom:36}}>
        {saving?"Saving…":"Save hive"}
      </button>
    </div>
  </div>;
}

// ── Move inspection ───────────────────────────────────────────────────────────
function InspectionHiveSelect({inspection,hives,onSave,onBack}){
  const[sel,setSel]=useState(inspection.hive_id);
  const[saving,setSaving]=useState(false);
  const handleSave=async()=>{
    if(sel===inspection.hive_id){onBack();return;}
    setSaving(true);
    const{error}=await supabase.from("inspections").update({hive_id:sel}).eq("id",inspection.id);
    if(error){alert("Error: "+error.message);}else{onSave({...inspection,hive_id:sel});}
    setSaving(false);
  };
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <AppHeader title="Move inspection" subtitle={`${formatDate(inspection.visit_date)} — select correct hive`} onBack={onBack}/>
    <div style={{flex:1,overflowY:"auto",background:T.surface,padding:"12px 14px",WebkitOverflowScrolling:"touch"}}>
      <div style={{background:T.amberLight,border:`0.5px solid #F5D08A`,borderRadius:14,padding:"14px 18px",marginBottom:14}}>
        <div style={{fontFamily:FONT_SANS,fontSize:13,fontWeight:700,color:T.amber,marginBottom:3}}>Moving this inspection</div>
        <div style={{fontFamily:FONT_SANS,fontSize:12,color:T.ink,lineHeight:1.5}}>{formatDate(inspection.visit_date)} · {inspection.brood_status}{inspection.notes?` · ${inspection.notes.slice(0,50)}…`:""}</div>
      </div>
      <FormSection title="Select the correct hive">
        {hives.map(h=>(
          <div key={h.id} onClick={()=>setSel(h.id)} style={{padding:"15px 18px",borderBottom:`0.5px solid ${T.border}`,display:"flex",alignItems:"center",gap:14,cursor:"pointer",background:sel===h.id?T.tealLight:"transparent",transition:"background 0.15s"}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:sel===h.id?T.tealMid:T.tealLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:sel===h.id?"#fff":T.teal,flexShrink:0,transition:"all 0.15s"}}>{h.number}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:FONT_SANS,fontSize:14,fontWeight:600,color:T.ink}}>Hive {h.number}</div>
              <div style={{fontFamily:FONT_SANS,fontSize:12,color:T.inkLight}}>{h.apiary_name} · {h.status}</div>
            </div>
            {sel===h.id&&<span style={{color:T.teal,fontWeight:700,fontSize:18}}>✓</span>}
          </div>
        ))}
      </FormSection>
      <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:18,background:saving?"#9CA3AF":T.tealMid,color:"#fff",border:"none",borderRadius:14,fontSize:17,fontWeight:700,cursor:saving?"not-allowed":"pointer",fontFamily:FONT_SANS,marginBottom:36,marginTop:8}}>
        {saving?"Moving…":"Move inspection"}
      </button>
    </div>
  </div>;
}

// ── Queen Register ────────────────────────────────────────────────────────────
function QueenRegister({queens,hives,onBack,onEditQueen}){
  const[openId,setOpenId]=useState(null);
  const active=queens.filter(q=>!q.lost_date).sort((a,b)=>a.number-b.number);
  const lost=queens.filter(q=>q.lost_date).sort((a,b)=>b.number-a.number);
  const cBg={White:"#F9F9F7",Yellow:T.amberLight,Red:T.redLight,Green:"#EAF3DE",Blue:"#E6F1FB",TBC:T.surface};
  const cTx={White:T.inkMid,Yellow:T.amber,Red:T.red,Green:"#27500A",Blue:"#0C447C",TBC:T.inkLight};
  const QCard=({queen,isLost})=>{
    const hive=hives.find(h=>h.id===queen.hive_id);
    const milestones=getQueenMilestones(queen);
    const isOpen=openId===queen.id;
    return<div style={{background:T.white,borderRadius:16,border:`0.5px solid ${T.border}`,marginBottom:8,overflow:"hidden",opacity:isLost?0.7:1,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div onClick={()=>setOpenId(isOpen?null:queen.id)} style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:cBg[queen.colour]||T.surface,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative"}}>
          <QueenIcon size={28} muted={isLost}/>
          <div style={{position:"absolute",bottom:-2,right:-2,background:cBg[queen.colour]||T.surface,borderRadius:99,padding:"1px 4px",fontFamily:FONT_SANS,fontSize:9,fontWeight:700,color:cTx[queen.colour]||T.inkMid,border:`0.5px solid ${T.border}`}}>#{queen.number}</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:FONT_SANS,fontSize:15,fontWeight:700,color:T.ink}}>
            Queen #{queen.number}{hive?` · Hive ${hive.number}`:" · Unassigned"}
            {queen.marked&&<span style={{marginLeft:6,fontSize:11,background:T.tealLight,color:T.teal,padding:"1px 6px",borderRadius:99,fontWeight:600}}>Marked</span>}
            {queen.clipped&&<span style={{marginLeft:4,fontSize:11,background:T.amberLight,color:T.amber,padding:"1px 6px",borderRadius:99,fontWeight:600}}>Clipped</span>}
          </div>
          <div style={{fontFamily:FONT_SANS,fontSize:12,color:T.inkLight,marginTop:2}}>{queen.colour} · {queen.year} · {queen.origin}</div>
        </div>
        <Badge color={isLost?"gray":"teal"}>{isLost?queen.lost_reason:"Active"}</Badge>
      </div>
      {isOpen&&<div style={{borderTop:`0.5px solid ${T.border}`,padding:"16px 18px",background:T.surface}}>
        {milestones.length>0&&<div style={{borderLeft:`2px solid ${T.tealSoft}`,marginLeft:6,paddingLeft:16,marginBottom:14}}>
          {milestones.map((m,i)=><div key={i} style={{display:"flex",gap:12,padding:"7px 0",position:"relative"}}>
            <div style={{position:"absolute",left:-21,top:11,width:8,height:8,borderRadius:"50%",background:m.confirmed?T.tealMid:"#D8D5CC",border:`2px solid ${T.surface}`}}/>
            <span style={{fontFamily:FONT_SANS,fontSize:12,color:T.inkLight,minWidth:74,flexShrink:0}}>{formatDate(m.actual||m.date)||"—"}</span>
            <div>
              <div style={{fontFamily:FONT_SANS,fontSize:13,color:m.confirmed?T.ink:T.inkLight}}>{m.label}</div>
              <span style={{fontFamily:FONT_SANS,fontSize:11,background:m.confirmed?T.tealLight:T.amberLight,color:m.confirmed?T.teal:T.amber,padding:"2px 9px",borderRadius:99,fontWeight:700,display:"inline-block",marginTop:3}}>{m.confirmed?"Confirmed":"Projected"}</span>
            </div>
          </div>)}
        </div>}
        {queen.notes&&<p style={{fontFamily:FONT_SANS,fontSize:13,color:T.inkMid,marginBottom:12,lineHeight:1.6}}>{queen.notes}</p>}
        {queen.temper_rating&&<div style={{marginBottom:12}}><Badge>Temperament {queen.temper_rating}/5</Badge></div>}
        <button onClick={()=>onEditQueen(queen)} style={{width:"100%",padding:"11px",background:T.tealLight,color:T.teal,border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS}}>
          Edit queen #{queen.number}
        </button>
      </div>}
    </div>;
  };
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <AppHeader title="Queen register" subtitle={`${active.length} active · ${lost.length} historical`} onBack={onBack}/>
    <div style={{flex:1,overflowY:"auto",background:T.surface,padding:"14px 14px",WebkitOverflowScrolling:"touch"}}>
      <SectionLabel>Active queens</SectionLabel>{active.map(q=><QCard key={q.id} queen={q}/>)}
      <SectionLabel>Historical</SectionLabel>{lost.map(q=><QCard key={q.id} queen={q} isLost/>)}
      <div style={{height:8}}/>
    </div>
  </div>;
}

// ── Safety Screen ─────────────────────────────────────────────────────────────
function SafetyScreen({hives,onBack}){
  const[apiary,setApiary]=useState("Farm");
  const a=APIARIES[apiary];
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <div style={{background:`linear-gradient(160deg, ${T.teal} 0%, ${T.tealMid} 100%)`,padding:"max(env(safe-area-inset-top,0px),12px) 18px 0",flexShrink:0,position:"relative",overflow:"hidden"}}>
      <HoneycombBg/>
      <div style={{position:"relative",zIndex:1}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#9FE1CB",fontSize:14,cursor:"pointer",padding:0,marginBottom:8,fontFamily:FONT_SANS}}>← Back</button>
        <div style={{fontFamily:FONT_DISPLAY,fontSize:26,color:"#fff",marginBottom:14}}>Apiary safety</div>
        <div style={{display:"flex",gap:8,paddingBottom:16}}>
          {Object.keys(APIARIES).map(name=><button key={name} onClick={()=>setApiary(name)} style={{padding:"9px 20px",borderRadius:99,background:apiary===name?"#fff":"rgba(255,255,255,0.15)",color:apiary===name?T.teal:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS,transition:"all 0.15s"}}>{name}</button>)}
        </div>
      </div>
    </div>
    <div style={{flex:1,background:T.surface,overflowY:"auto",padding:"16px 14px",WebkitOverflowScrolling:"touch"}}>
      <div style={{background:T.white,borderRadius:16,border:`0.5px solid ${T.border}`,padding:18,marginBottom:12,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <div style={{fontFamily:FONT_SANS,fontSize:17,fontWeight:700,color:T.ink,marginBottom:3}}>{a.name}</div>
        <div style={{fontFamily:FONT_SANS,fontSize:13,color:T.inkLight,marginBottom:14}}>{a.address}{a.landowner?` · ${a.landowner}`:""}</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:T.tealLight,color:T.teal,fontSize:14,fontWeight:700,padding:"10px 16px",borderRadius:99,fontFamily:FONT_SANS,cursor:"pointer"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          {a.w3w}
        </div>
      </div>
      <div style={{background:T.white,borderRadius:16,border:`0.5px solid ${T.border}`,padding:18,marginBottom:12,display:"flex",alignItems:"center",gap:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <div style={{width:50,height:50,borderRadius:"50%",background:T.tealLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:T.teal,flexShrink:0,fontFamily:FONT_SANS}}>{a.emergencyContact.split(" ").map(w=>w[0]).join("")}</div>
        <div>
          <div style={{fontFamily:FONT_SANS,fontSize:15,fontWeight:700,color:T.ink}}>{a.emergencyContact}</div>
          <div style={{fontFamily:FONT_SANS,fontSize:12,color:T.inkLight}}>Emergency contact</div>
          <div style={{fontFamily:FONT_SANS,fontSize:14,color:T.teal,fontWeight:600,marginTop:3}}>{a.emergencyPhone}</div>
        </div>
      </div>
      <a href={`tel:${a.emergencyPhone}`} style={{textDecoration:"none",display:"block",marginBottom:16}}>
        <div style={{width:"100%",padding:20,background:T.red,color:"#fff",borderRadius:16,fontSize:17,fontWeight:700,textAlign:"center",fontFamily:FONT_SANS,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.17 6.17l1.27-.84a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          Call {a.emergencyContact}
        </div>
      </a>
      <SectionLabel>Hives at this apiary</SectionLabel>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {hives.filter(h=>h.apiary_name===apiary).map(h=><div key={h.id} style={{background:T.white,borderRadius:12,border:`0.5px solid ${T.border}`,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 1px 2px rgba(0,0,0,0.03)"}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:T.tealLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:T.teal,fontFamily:FONT_SANS}}>{h.number}</div>
          <div style={{flex:1}}><div style={{fontFamily:FONT_SANS,fontSize:13,fontWeight:700,color:T.ink}}>Hive {h.number}</div><div style={{fontFamily:FONT_SANS,fontSize:11,color:T.inkLight}}>{h.status}</div></div>
          <div style={{width:8,height:8,borderRadius:"50%",background:h.status==="Active"?T.tealMid:T.red,flexShrink:0}}/>
        </div>)}
      </div>
      <div style={{height:24}}/>
    </div>
  </div>;
}

// ── Inspection History ────────────────────────────────────────────────────────
function InspectionHistory({hive,inspections,onBack,onEdit,onMove}){
  const list=inspections.filter(i=>i.hive_id===hive.id).sort((a,b)=>new Date(b.visit_date)-new Date(a.visit_date));
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <AppHeader title={`Hive ${hive.number} — history`} subtitle={`${list.length} inspection${list.length!==1?"s":""}`} onBack={onBack}/>
    <div style={{flex:1,overflowY:"auto",background:T.surface,padding:"14px 14px",WebkitOverflowScrolling:"touch"}}>
      {list.length===0&&<EmptyHiveState/>}
      {list.map(ins=><div key={ins.id} style={{background:T.white,borderRadius:16,border:`0.5px solid ${T.border}`,marginBottom:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"13px 18px 11px",borderBottom:`0.5px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:T.surface}}>
          <div style={{fontFamily:FONT_SANS,fontSize:15,fontWeight:700,color:T.ink}}>{formatDate(ins.visit_date)}</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <Badge color={ins.varroa==="High"?"red":ins.varroa==="Medium"?"amber":"teal"}>{ins.varroa}</Badge>
            {ins.temperament&&<Badge>Temper {ins.temperament}/5</Badge>}
            <button onClick={()=>onEdit(ins)} style={{padding:"5px 11px",background:T.tealLight,color:T.teal,border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS}}>Edit</button>
            <button onClick={()=>onMove(ins)} style={{padding:"5px 11px",background:T.amberLight,color:T.amber,border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS}}>Move</button>
          </div>
        </div>
        <div style={{padding:"13px 18px"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:ins.notes?10:0}}>
            <Badge>{ins.brood_status}{ins.brood_status==="BIAS"?` ${ins.brood_frames}fr`:""}</Badge>
            <Badge>Stores {ins.stores}</Badge><Badge>Room {ins.room}</Badge>
            <Badge color={ins.health==="OK"?"teal":"red"}>{ins.health}</Badge>
            <Badge>{ins.supers_total} super{ins.supers_total!==1?"s":""}</Badge>
            {ins.feed_given!=="None"&&<Badge color="amber">Fed: {ins.feed_given}</Badge>}
            <Badge color="gray">{ins.weather_condition} {ins.weather_temp}°C</Badge>
            {(ins.queen_status||ins.queen_seen)&&<Badge color={(ins.queen_status||ins.queen_seen)==="Queenless"?"red":(ins.queen_status||ins.queen_seen)==="Seen"?"teal":"gray"}>{ins.queen_status||ins.queen_seen}</Badge>}
          </div>
          {ins.qc_count>0&&<div style={{fontFamily:FONT_SANS,fontSize:13,color:T.inkLight,marginBottom:6}}>QCs: {ins.qc_count} · {ins.qc_action}</div>}
          {ins.notes&&<div style={{fontFamily:FONT_SANS,fontSize:14,color:T.inkMid,lineHeight:1.6,borderTop:`0.5px solid ${T.border}`,paddingTop:10,marginTop:4}}>{ins.notes}</div>}
        </div>
      </div>)}
      <div style={{height:8}}/>
    </div>
  </div>;
}

// ── Home Screen ───────────────────────────────────────────────────────────────
function HomeScreen({hives,nucs,inspections,queens,onInspect,onSafety,onHistory,onEditHive,onAddHive,onAddNuc,onPromoteNuc}){
  const farmHives=hives.filter(h=>h.apiary_name==="Farm"&&h.status==="Active");
  const homeHives=hives.filter(h=>h.apiary_name==="Home"&&h.status==="Active");
  const activeNucs=nucs.filter(n=>n.status==="Active");
  const allActiveHives=hives.filter(h=>h.status==="Active");
  const totalHigh=allActiveHives.reduce((n,h)=>n+generateActions(h,inspections,queens).filter(a=>a.priority==="high").length,0);

  const HiveCard=({hive})=>{
    const actions=generateActions(hive,inspections,queens);
    const high=actions.filter(a=>a.priority==="high");
    const med=actions.filter(a=>a.priority==="medium");
    const low=actions.filter(a=>a.priority==="low");
    const last=inspections.filter(i=>i.hive_id===hive.id).sort((a,b)=>new Date(b.visit_date)-new Date(a.visit_date))[0];
    const isHealthy=high.length===0&&med.length===0;
    const statusColor=high.length?T.red:med.length?T.amber:T.tealMid;
    const[open,setOpen]=useState(high.length>0);
    return<div style={{background:T.white,borderRadius:16,border:`0.5px solid ${T.border}`,marginBottom:10,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",borderBottom:open?`0.5px solid ${T.border}`:"none"}}>
        <div style={{width:42,height:42,borderRadius:"50%",background:T.tealLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:T.teal,flexShrink:0,fontFamily:FONT_SANS}}>{hive.number}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:FONT_SANS,fontSize:16,fontWeight:700,color:T.ink}}>Hive {hive.number}</div>
          <div style={{fontFamily:FONT_SANS,fontSize:12,color:T.inkLight,marginTop:2}}>{hive.apiary_name} · {last?`Last inspected ${formatDate(last.visit_date)}`:"Never inspected"}</div>
        </div>
        {isHealthy?<BeeSimple size={20}/>:<div style={{width:10,height:10,borderRadius:"50%",background:statusColor,flexShrink:0}}/>}
        <span style={{fontFamily:FONT_SANS,color:T.inkLight,fontSize:11}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<>
        {[...high,...med,...low].map((a,i)=><ActionBanner key={i} action={a}/>)}
        {actions.length===0&&last&&(
          <div style={{padding:"12px 18px",display:"flex",flexWrap:"wrap",gap:6}}>
            <Badge>BIAS {last.brood_frames}fr</Badge>
            <Badge>Stores {last.stores}</Badge>
            <Badge>{last.supers_total} super{last.supers_total!==1?"s":""}</Badge>
            {last.temperament&&<Badge>Temper {last.temperament}/5</Badge>}
          </div>
        )}
        <div style={{padding:"10px 18px 16px",display:"flex",gap:8}}>
          <button onClick={()=>onInspect(hive)} style={{flex:1,padding:"13px",background:T.tealMid,color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS}}>✓ Inspect</button>
          <button onClick={()=>onHistory(hive)} style={{padding:"13px 14px",background:T.surface,color:T.inkMid,border:`0.5px solid ${T.border}`,borderRadius:12,fontSize:14,cursor:"pointer",fontFamily:FONT_SANS}}>History</button>
          <button onClick={()=>onEditHive(hive)} style={{padding:"13px 14px",background:T.surface,color:T.inkMid,border:`0.5px solid ${T.border}`,borderRadius:12,fontSize:14,cursor:"pointer",fontFamily:FONT_SANS}}>Edit</button>
        </div>
      </>}
    </div>;
  };

  const NucCard=({nuc})=>{
    const parentHive=hives.find(h=>h.id===nuc.parent_hive_id);
    return<div style={{background:T.white,borderRadius:16,border:`0.5px solid ${T.border}`,marginBottom:10,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
      <div style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:42,height:42,borderRadius:"50%",background:T.amberLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{fontFamily:FONT_SANS,fontSize:13,fontWeight:700,color:T.amber}}>N{nuc.nuc_number}</span>
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:FONT_SANS,fontSize:15,fontWeight:700,color:T.ink}}>Nuc N{nuc.nuc_number}</div>
          <div style={{fontFamily:FONT_SANS,fontSize:12,color:T.inkLight,marginTop:2}}>
            {nuc.origin}{parentHive?` from Hive ${parentHive.number}`:""} · {nuc.apiary_name}
            {nuc.established_date?` · Est. ${formatDate(nuc.established_date)}`:""}
          </div>
        </div>
        <button onClick={()=>onPromoteNuc(nuc)} style={{padding:"8px 12px",background:T.tealLight,color:T.teal,border:"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS,flexShrink:0}}>
          → Hive
        </button>
      </div>
      {nuc.notes&&<div style={{padding:"0 18px 14px",fontFamily:FONT_SANS,fontSize:13,color:T.inkMid,lineHeight:1.5}}>{nuc.notes}</div>}
    </div>;
  };

  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <HomeHeader farmCount={farmHives.length} homeCount={homeHives.length} nucCount={activeNucs.length} urgentCount={totalHigh} onSafety={onSafety}/>
    <div style={{flex:1,overflowY:"auto",background:T.surface,padding:"14px 14px",WebkitOverflowScrolling:"touch"}}>
      <AllClearBanner hives={hives} inspections={inspections}/>
      <StreakCard inspections={inspections} hives={hives}/>
      <SectionLabel>Farm apiary</SectionLabel>
      {farmHives.map(h=><HiveCard key={h.id} hive={h}/>)}
      <SectionLabel>Home apiary</SectionLabel>
      {homeHives.map(h=><HiveCard key={h.id} hive={h}/>)}
      {activeNucs.length>0&&<>
        <SectionLabel>Nucs</SectionLabel>
        {activeNucs.map(n=><NucCard key={n.id} nuc={n}/>)}
      </>}
      {/* Add buttons */}
      <div style={{display:"flex",gap:8,marginTop:4,marginBottom:8}}>
        <button onClick={onAddHive} style={{flex:1,padding:"13px",background:T.white,color:T.teal,border:`1.5px dashed ${T.tealSoft}`,borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS}}>+ Add hive</button>
        <button onClick={onAddNuc} style={{flex:1,padding:"13px",background:T.white,color:T.amber,border:`1.5px dashed #F5D08A`,borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS}}>+ Add nuc</button>
      </div>
      <div style={{height:12}}/>
    </div>
  </div>;
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────
function TabBar({active,onChange}){
  const tabs=[
    {id:"home",   label:"Home",   Icon:(p)=><HiveBox   size={22} muted={p.muted}/>},
    {id:"queens", label:"Queens", Icon:(p)=><QueenIcon size={22} muted={p.muted}/>},
    {id:"trends", label:"Trends", Icon:(p)=><TrendIcon size={22} muted={p.muted}/>},
    {id:"safety", label:"Safety", Icon:(p)=><SafetyIcon size={22} muted={p.muted}/>},
  ];
  return<div style={{display:"flex",background:T.white,borderTop:`0.5px solid ${T.border}`,flexShrink:0,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
    {tabs.map(t=>{
      const isActive=active===t.id;
      return<button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 0 13px",border:"none",background:"transparent",cursor:"pointer",fontFamily:FONT_SANS}}>
        <t.Icon muted={!isActive}/>
        <span style={{fontFamily:FONT_SANS,fontSize:10,color:isActive?T.teal:T.inkLight,fontWeight:isActive?700:400,letterSpacing:"0.02em"}}>{t.label}</span>
      </button>;
    })}
  </div>;
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App(){
  const[hives,setHives]=useState([]);
  const[queens,setQueens]=useState([]);
  const[inspections,setInspections]=useState([]);
  const[nucs,setNucs]=useState([]);
  const[loading,setLoading]=useState(true);
  const[screen,setScreen]=useState("home");
  const[tab,setTab]=useState("home");
  const[selectedHive,setSelectedHive]=useState(null);
  const[editingInspection,setEditingInspection]=useState(null);
  const[movingInspection,setMovingInspection]=useState(null);
  const[editingQueen,setEditingQueen]=useState(null);
  const[editingHive,setEditingHive]=useState(null);
  const[promotingNuc,setPromotingNuc]=useState(null);
  const[celebration,setCelebration]=useState(null);
  const[celebrationData,setCelebrationData]=useState(null);
  const[milestone,setMilestone]=useState(null);

  useEffect(()=>{
    async function load(){
      const[{data:h},{data:q},{data:i}]=await Promise.all([
        supabase.from("hives").select("*").order("number"),
        supabase.from("queens").select("*").order("number"),
        supabase.from("inspections").select("*").order("visit_date",{ascending:false}),
      ]);
      let n=[];
      try{const{data:nd}=await supabase.from("nucs").select("*").order("nuc_number");n=nd||[];}catch(_){}
      setHives(h||[]);setQueens(q||[]);setInspections(i||[]);setNucs(n||[]);setLoading(false);
    }
    load();
  },[]);

  const seasonCount=inspections.filter(i=>new Date(i.visit_date).getFullYear()===new Date().getFullYear()).length+1;
  const weekCount=inspections.filter(i=>weekNum(i.visit_date)===weekNum()).length+1;
  const currentWeek=weekNum();
  let streak=0;
  for(let w=currentWeek;w>=currentWeek-20;w--){
    const active=hives.filter(h=>h.status==="Active");
    const checked=new Set(inspections.filter(i=>weekNum(i.visit_date)===w).map(i=>i.hive_id));
    if(active.every(h=>checked.has(h.id)))streak++;else break;
  }

  const handleInspect=hive=>{setSelectedHive(hive);setEditingInspection(null);setScreen("inspect");};
  const handleHistory=hive=>{setSelectedHive(hive);setScreen("history");};
  const handleEdit=ins=>{const hive=hives.find(h=>h.id===ins.hive_id);setSelectedHive(hive);setEditingInspection(ins);setScreen("inspect");};
  const handleMove=ins=>{setMovingInspection(ins);setScreen("move");};
  const handleEditQueen=q=>{setEditingQueen(q);setScreen("editqueen");};
  const handleEditHive=h=>{setEditingHive(h);setScreen("edithive");};
  const handlePromoteNuc=n=>{setPromotingNuc(n);setScreen("promotenuc");};

  const handleSaveInspection=(inspection,supersChange,isEdit,triggersFirstEggs)=>{
    if(isEdit){setInspections(prev=>prev.map(i=>i.id===inspection.id?inspection:i));setScreen("history");}
    else{
      setInspections(prev=>[inspection,...prev]);
      setHives(prev=>prev.map(h=>h.id===selectedHive.id?{...h,super_count:Math.max(0,h.super_count+supersChange)}:h));
      if(triggersFirstEggs){
        const queen=queens.find(q=>q.hive_id===selectedHive.id&&!q.lost_date);
        setMilestone({hive:selectedHive,queen,inspection});setScreen("home");setTab("home");
      }else{setCelebrationData({hive:selectedHive,seasonCount,weekCount,streak:streak+1});setCelebration("saved");}
    }
  };
  const handleMoveInspection=moved=>{setInspections(prev=>prev.map(i=>i.id===moved.id?moved:i));setMovingInspection(null);setScreen("home");setTab("home");};
  const handleSaveQueen=q=>{setQueens(prev=>prev.map(x=>x.id===q.id?q:x));setEditingQueen(null);setScreen("queens");};
  const handleSaveHive=h=>{setHives(prev=>prev.map(x=>x.id===h.id?h:x));setEditingHive(null);setScreen("home");setTab("home");};
  const handleAddHive=h=>{setHives(prev=>[...prev,h].sort((a,b)=>a.number-b.number));setScreen("home");setTab("home");};
  const handleAddNuc=n=>{setNucs(prev=>[...prev,n]);setScreen("home");setTab("home");};
  const handlePromoteNucDone=(newHive,updatedNuc)=>{
    setHives(prev=>[...prev,newHive].sort((a,b)=>a.number-b.number));
    setNucs(prev=>prev.map(n=>n.id===updatedNuc.id?updatedNuc:n));
    setPromotingNuc(null);setScreen("home");setTab("home");
  };

  const handleTab=t=>{setTab(t);if(t==="trends"){window.location.href="/trends";return;}setScreen(t);};
  const handleBack=()=>{
    if(screen==="inspect"&&editingInspection){setScreen("history");return;}
    if(screen==="move"){setMovingInspection(null);setScreen("history");return;}
    if(screen==="editqueen"){setEditingQueen(null);setScreen("queens");return;}
    if(screen==="edithive"){setEditingHive(null);setScreen("home");return;}
    if(screen==="addhive"||screen==="addnuc"||screen==="promotenuc"){setScreen("home");setTab("home");return;}
    setScreen("home");setTab("home");
  };
  const showTab=["home","queens","trends","safety"].includes(screen);

  if(loading)return<LoadingScreen/>;

  return<div style={{height:"100dvh",display:"flex",flexDirection:"column",background:T.surface,fontFamily:FONT_SANS,WebkitFontSmoothing:"antialiased",position:"relative"}}>
    <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      {celebration==="saved"&&celebrationData?(
        <InspectionSavedScreen hive={celebrationData.hive} seasonCount={celebrationData.seasonCount} weekCount={celebrationData.weekCount} streak={celebrationData.streak} onDone={()=>{setCelebration(null);setCelebrationData(null);setScreen("home");setTab("home");}}/>
      ):celebration==="harvest"&&celebrationData?(
        <HarvestCelebration harvest={celebrationData.harvest} previousBest={celebrationData.previousBest} onDone={()=>{setCelebration(null);setCelebrationData(null);setScreen("home");setTab("home");}}/>
      ):(
        <>
          {screen==="home"&&<HomeScreen hives={hives} nucs={nucs} inspections={inspections} queens={queens} onInspect={handleInspect} onSafety={()=>{setScreen("safety");setTab("safety");}} onHistory={handleHistory} onEditHive={handleEditHive} onAddHive={()=>setScreen("addhive")} onAddNuc={()=>setScreen("addnuc")} onPromoteNuc={handlePromoteNuc}/>}
          {screen==="inspect"&&selectedHive&&<InspectionForm hive={selectedHive} queens={queens} inspections={inspections} existingInspection={editingInspection} onSave={handleSaveInspection} onBack={handleBack}/>}
          {screen==="queens"&&<QueenRegister queens={queens} hives={hives} onBack={handleBack} onEditQueen={handleEditQueen}/>}
          {screen==="safety"&&<SafetyScreen hives={hives} onBack={handleBack}/>}
          {screen==="history"&&selectedHive&&<InspectionHistory hive={selectedHive} inspections={inspections} onBack={handleBack} onEdit={handleEdit} onMove={handleMove}/>}
          {screen==="move"&&movingInspection&&<InspectionHiveSelect inspection={movingInspection} hives={hives} onSave={handleMoveInspection} onBack={handleBack}/>}
          {screen==="editqueen"&&editingQueen&&<QueenEditForm queen={editingQueen} hives={hives} onSave={handleSaveQueen} onBack={handleBack}/>}
          {screen==="edithive"&&editingHive&&<HiveEditForm hive={editingHive} onSave={handleSaveHive} onBack={handleBack}/>}
          {screen==="addhive"&&<AddHiveForm hives={hives} onSave={handleAddHive} onBack={handleBack}/>}
          {screen==="addnuc"&&<AddNucForm nucs={nucs} hives={hives} onSave={handleAddNuc} onBack={handleBack}/>}
          {screen==="promotenuc"&&promotingNuc&&<PromoteNucForm nuc={promotingNuc} hives={hives} onSave={handlePromoteNucDone} onBack={handleBack}/>}
          {milestone&&<div style={{position:"absolute",inset:0,zIndex:50}}>
            <FirstEggsMilestone hive={milestone.hive} queen={milestone.queen}
              onLog={async()=>{
                if(milestone.queen){await supabase.from("queens").update({eggs_first_seen:todayStr()}).eq("id",milestone.queen.id);setQueens(prev=>prev.map(q=>q.id===milestone.queen.id?{...q,eggs_first_seen:todayStr()}:q));}
                setMilestone(null);setCelebrationData({hive:milestone.hive,seasonCount,weekCount,streak:streak+1});setCelebration("saved");
              }}
              onDismiss={()=>setMilestone(null)}/>
          </div>}
        </>
      )}
    </div>
    {showTab&&!celebration&&<TabBar active={tab} onChange={handleTab}/>}
  </div>;
}
