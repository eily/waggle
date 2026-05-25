import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

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

// Google Fonts loaded in index.html — using DM Serif Display + DM Sans
const FONT_DISPLAY = "'DM Serif Display', Georgia, serif";
const FONT_SANS    = "'DM Sans', -apple-system, sans-serif";

const APIARIES = {
  Farm: { name:"Farm apiary", address:"Elton Moor Farm, Whinney Hill, Darlington Back Lane, TS21 1BQ", landowner:"Jonathan Marsh", w3w:"clean.verge.ample", emergencyContact:"Kay Chapman", emergencyPhone:"07852997063" },
  Home: { name:"Home apiary", address:"47 Grosvenor Road, Stockton on Tees, TS19 7AE", landowner:"Peter Chapman", w3w:"tests.hunt.social", emergencyContact:"Kay Chapman", emergencyPhone:"07852997063" },
};

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
    if(last.brood_status==="No eggs")actions.push({text:`No eggs seen ${formatDate(last.visit_date)} — check for new queen`,priority:"high"});
    if(last.varroa==="High")actions.push({text:"Varroa drop HIGH — consider treatment urgently",priority:"high"});
    if(last.health!=="OK")actions.push({text:`Disease concern: ${last.health} — follow up required`,priority:"high"});
    if(last.room<=1)actions.push({text:"Hive congested — add super or consider split",priority:"medium"});
    if(last.supers_total>0)actions.push({text:`Check super fill — ${last.supers_total} super${last.supers_total>1?"s":""} on hive`,priority:"medium"});
    if(days>10)actions.push({text:`Inspection overdue — last visit ${formatDate(last.visit_date)} (${days} days ago)`,priority:"low"});
  }else{actions.push({text:"No inspections recorded — log first inspection",priority:"high"});}
  if(queen)getQueenMilestones(queen).forEach(m=>{if(!m.confirmed&&m.date){const du=-daysSince(m.date);if(du<=3&&du>=-3)actions.push({text:`Queen milestone: ${m.label} around ${formatDate(m.date)}`,priority:"high"});}});
  return actions;
}

// ── Honeycomb SVG background ──────────────────────────────────────────────────
function HoneycombBg(){
  return(
    <svg style={{position:"absolute",top:0,right:-20,opacity:0.08,pointerEvents:"none"}} width="180" height="160" viewBox="0 0 180 160" fill="none">
      <g stroke="#fff" strokeWidth="1">
        <polygon points="45,8 75,8 90,34 75,60 45,60 30,34"/>
        <polygon points="90,34 120,34 135,60 120,86 90,86 75,60"/>
        <polygon points="45,60 75,60 90,86 75,112 45,112 30,86"/>
        <polygon points="90,86 120,86 135,112 120,138 90,138 75,112"/>
        <polygon points="135,8 165,8 180,34 165,60 135,60 120,34"/>
        <polygon points="0,34 30,34 45,60 30,86 0,86 -15,60"/>
        <polygon points="135,60 165,60 180,86 165,112 135,112 120,86"/>
        <polygon points="0,86 30,86 45,112 30,138 0,138 -15,112"/>
      </g>
    </svg>
  );
}

// ── Bee wordmark ──────────────────────────────────────────────────────────────
function BeeIcon({size=24}){
  return(
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <ellipse cx="14" cy="14" rx="5.5" ry="7.5" fill="#9FE1CB" opacity="0.95"/>
      <rect x="10.5" y="9.5" width="7" height="2.5" rx="1.25" fill={T.teal}/>
      <rect x="10.5" y="13" width="7" height="2" rx="1" fill={T.teal}/>
      <rect x="10.5" y="16.5" width="7" height="2" rx="1" fill={T.teal}/>
      <ellipse cx="8.5" cy="11" rx="4.5" ry="2.5" fill="#fff" opacity="0.4" transform="rotate(-25 8.5 11)"/>
      <ellipse cx="19.5" cy="11" rx="4.5" ry="2.5" fill="#fff" opacity="0.4" transform="rotate(25 19.5 11)"/>
      <line x1="12" y1="7" x2="10" y2="3.5" stroke="#9FE1CB" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="16" y1="7" x2="18" y2="3.5" stroke="#9FE1CB" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="9.5" cy="3" r="1.2" fill="#9FE1CB"/>
      <circle cx="18.5" cy="3" r="1.2" fill="#9FE1CB"/>
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
          {["🐝","🐝","🐝"].map((b,i)=>(
            <span key={i} style={{fontSize:i===1?42:28,transition:"all 0.5s cubic-bezier(0.34,1.56,0.64,1)",opacity:vis[i]?1:0,transform:vis[i]?"translateY(0) scale(1)":"translateY(24px) scale(0.3)",display:"inline-block"}}>
              {b}
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
          {[["🐝",weekCount,"This week"],["📋",seasonCount,"This season"],["🔥",streak+"wk","Streak"]].map(([icon,val,lbl],i)=>(
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
        <div style={{fontSize:52,marginBottom:8,display:"inline-block",animation:"gentlePulse 1.6s ease-in-out infinite alternate"}}>🐝</div>
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
      <style>{`@keyframes gentlePulse{from{transform:scale(1) rotate(-3deg)}to{transform:scale(1.1) rotate(3deg)}}`}</style>
    </div>
  );
}

// ── Harvest celebration ───────────────────────────────────────────────────────
function HarvestCelebration({harvest,previousBest,onDone}){
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:`linear-gradient(160deg, ${T.teal} 0%, #083D2D 100%)`,alignItems:"center",padding:"40px 24px",overflowY:"auto",position:"relative"}}>
      <HoneycombBg/>
      <div style={{position:"relative",zIndex:1,width:"100%",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {["🐝","🍯","🐝"].map((e,i)=>(
            <span key={i} style={{fontSize:36,display:"inline-block",animation:`hb${i} 1.2s ${i*0.25}s ease-in-out infinite alternate`}}>{e}</span>
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
        <span style={{fontSize:28}}>🔥</span>
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
        <span style={{fontFamily:FONT_SANS,fontSize:16,fontWeight:800,color:T.teal}}>{streak} weeks 🐝</span>
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
      <span style={{fontSize:30,flexShrink:0,lineHeight:1}}>🐝</span>
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

function Slider({min,max,step=0.5,value,onChange,unit=" fr"}){
  return<div style={{display:"flex",alignItems:"center",gap:14}}>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{flex:1,accentColor:T.tealMid,height:4}}/>
    <span style={{fontFamily:FONT_SANS,fontSize:16,fontWeight:700,color:T.ink,minWidth:52,textAlign:"right"}}>{value}{unit}</span>
  </div>;
}

function Stepper({value,onChange,min=0,max=99,display}){
  return<div style={{display:"flex",alignItems:"center",gap:14}}>
    <button onClick={()=>onChange(Math.max(min,value-1))} style={{width:50,height:50,border:`0.5px solid ${T.border}`,borderRadius:12,background:T.white,fontSize:22,cursor:"pointer",fontFamily:FONT_SANS,flexShrink:0,color:T.inkMid}}>−</button>
    <div style={{flex:1,textAlign:"center"}}>{display||<span style={{fontFamily:FONT_SANS,fontSize:26,fontWeight:700,color:T.ink}}>{value}</span>}</div>
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

function ActionBanner({action}){
  const map={
    high:[T.redLight,"#FECACA","#7A1F1F",T.red],
    medium:[T.amberLight,"#FDE68A","#7A4A00",T.amber],
    low:[T.surface,T.border,T.inkLight,"#9A9A9A"],
  };
  const[bg,border,text,dot]=map[action.priority]||map.low;
  return<div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 18px",background:bg,borderBottom:`0.5px solid ${border}`}}>
    <div style={{width:7,height:7,borderRadius:"50%",background:dot,flexShrink:0,marginTop:5}}/>
    <span style={{fontFamily:FONT_SANS,fontSize:13,color:text,lineHeight:1.55,flex:1}}>{action.text}</span>
  </div>;
}

function LoadingScreen(){
  return<div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`linear-gradient(160deg, ${T.teal} 0%, ${T.tealMid} 100%)`}}>
    <BeeIcon size={40}/>
    <div style={{fontFamily:FONT_DISPLAY,fontSize:34,color:"#fff",marginTop:12,marginBottom:6}}>Waggle</div>
    <div style={{fontFamily:FONT_SANS,fontSize:14,color:"#9FE1CB"}}>Loading your hives…</div>
  </div>;
}

function EmptyHiveState(){
  return<div style={{textAlign:"center",padding:"48px 24px"}}>
    <div style={{fontSize:52,marginBottom:14,opacity:0.4}}>🐝</div>
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

// ── Home header (special — bee wordmark) ─────────────────────────────────────
function HomeHeader({farmCount,homeCount,urgentCount,onSafety}){
  return<div style={{background:`linear-gradient(160deg, ${T.teal} 0%, ${T.tealMid} 100%)`,padding:"max(env(safe-area-inset-top,0px),14px) 18px 18px",flexShrink:0,position:"relative",overflow:"hidden"}}>
    <HoneycombBg/>
    <div style={{position:"relative",zIndex:1}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <BeeIcon size={26}/>
            <div style={{fontFamily:FONT_DISPLAY,fontSize:30,color:"#fff",letterSpacing:"-0.3px",lineHeight:1}}>Waggle</div>
          </div>
          <div style={{fontFamily:FONT_SANS,fontSize:12,color:"#9FE1CB"}}>
            {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
          </div>
        </div>
        <button onClick={onSafety} style={{background:T.red,border:"none",borderRadius:10,padding:"10px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT_SANS,letterSpacing:"0.02em"}}>SOS</button>
      </div>
      <div style={{display:"flex",gap:8}}>
        {[["Farm",farmCount+" hives"],["Home",homeCount+" hives"],["Actions",urgentCount+" urgent"]].map(([label,val])=>(
          <div key={label} style={{flex:1,background:"rgba(255,255,255,0.14)",borderRadius:12,padding:"10px 12px",backdropFilter:"blur(4px)"}}>
            <div style={{fontFamily:FONT_SANS,fontSize:10,color:"#9FE1CB",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</div>
            <div style={{fontFamily:FONT_SANS,fontSize:17,fontWeight:700,color:"#fff",marginTop:2,letterSpacing:"-0.3px"}}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

// ── Inspection Form ───────────────────────────────────────────────────────────
function InspectionForm({hive,queens,existingInspection,onSave,onBack}){
  const isEdit=!!existingInspection;
  const activeQueen=queens.find(q=>q.hive_id===hive.id&&!q.lost_date);
  const mk=(k,fallback)=>isEdit?(existingInspection[k]??fallback):fallback;
  const[form,setForm]=useState({
    visit_date:mk("visit_date",todayStr()),visit_time:mk("visit_time",nowTimeStr()),
    queen_seen:mk("queen_seen",""),queen_number:mk("queen_number",activeQueen?.number||""),queen_colour:mk("queen_colour",activeQueen?.colour||""),
    qc_count:mk("qc_count",0),qc_action:mk("qc_action","None seen"),qc_note:mk("qc_note",""),
    brood_status:mk("brood_status","BIAS"),brood_frames:mk("brood_frames",3),
    stores:mk("stores",5),room:mk("room",4),
    health:mk("health","OK"),health_note:mk("health_note",""),
    varroa:mk("varroa","Not checked"),temperament:mk("temperament",null),
    feed_given:mk("feed_given","None"),feed_qty:mk("feed_qty",""),
    supers_change:mk("supers_change",0),
    weather_condition:mk("weather_condition","Sun"),weather_temp:mk("weather_temp",16),
    qe:mk("qe",hive.qe),crown_board:mk("crown_board",hive.crown_board),
    porter_escapes:mk("porter_escapes",hive.porter_escapes),entrance_reducer:mk("entrance_reducer",hive.entrance_reducer),
    mouse_guard:mk("mouse_guard",hive.mouse_guard),insulation:mk("insulation",hive.insulation),
    notes:mk("notes",""),
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const supersTotal=Math.max(0,hive.super_count+(isEdit?0:form.supers_change));
  const[saving,setSaving]=useState(false);

  const handleSave=async()=>{
    setSaving(true);
    const firstEggs=!isEdit&&form.queen_seen==="Seen"&&form.brood_status==="BIAS";
    if(isEdit){
      const{error}=await supabase.from("inspections").update({...form}).eq("id",existingInspection.id);
      if(error){alert("Error: "+error.message);}else{onSave({...existingInspection,...form},0,true,false);}
    }else{
      const record={hive_id:hive.id,...form,supers_total:supersTotal};
      const{error}=await supabase.from("inspections").insert([record]);
      if(!error){await supabase.from("hives").update({super_count:supersTotal}).eq("id",hive.id);onSave(record,form.supers_change,false,firstEggs);}
      else{alert("Error: "+error.message);}
    }
    setSaving(false);
  };

  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <AppHeader title={`Hive ${hive.number} — ${isEdit?"edit":"inspect"}`} subtitle={`${hive.apiary_name} · ${form.visit_date} · ${form.visit_time}`} onBack={onBack}/>
    <div style={{flex:1,overflowY:"auto",background:T.surface,padding:"12px 14px",WebkitOverflowScrolling:"touch"}}>
      <FormSection title="Queen">
        <FormRow label="Queen seen?"><SegPicker options={["Seen","Not found","Not looked"]} value={form.queen_seen} onChange={v=>set("queen_seen",v)}/></FormRow>
        <FormRow label="Queen colour"><SegPicker options={["White","Yellow","Red","Green","Blue"]} value={form.queen_colour} onChange={v=>set("queen_colour",v)} small/></FormRow>
        <FormRow label="Queen cells seen"><Stepper value={form.qc_count} onChange={v=>set("qc_count",v)} max={20}/></FormRow>
        {form.qc_count>0&&<FormRow label="Action taken"><SegPicker options={["All removed","1 left","2 left","Other"]} value={form.qc_action} onChange={v=>set("qc_action",v)}/></FormRow>}
        <FormRow label="QC notes" last><input value={form.qc_note} onChange={e=>set("qc_note",e.target.value)} placeholder="Frame locations, capped vs open…" style={inputStyle}/></FormRow>
      </FormSection>
      <FormSection title="Brood">
        <FormRow label="Status"><SegPicker options={["BIAS","No eggs","No brood","Drone only"]} value={form.brood_status} onChange={v=>set("brood_status",v)}/></FormRow>
        {form.brood_status==="BIAS"&&<FormRow label="Frames covered"><Slider min={0.5} max={11} step={0.5} value={form.brood_frames} onChange={v=>set("brood_frames",v)} unit=" fr"/></FormRow>}
        <FormRow label="Stores" sublabel="space available"><Slider min={0} max={20} step={1} value={form.stores} onChange={v=>set("stores",v)} unit=" fr"/></FormRow>
        <FormRow label="Room" sublabel="space for queen to lay" last><Slider min={0} max={11} step={1} value={form.room} onChange={v=>set("room",v)} unit=" fr"/></FormRow>
      </FormSection>
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
    origin:queen.origin||"",clipped:queen.clipped||false,
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
        <FormRow label="Clipped?" last><Toggle value={form.clipped} onChange={v=>set("clipped",v)} label="Queen clipped"/></FormRow>
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
        <div style={{fontFamily:FONT_SANS,fontSize:12,color:"#7A5500",lineHeight:1.5}}>{formatDate(inspection.visit_date)} · {inspection.brood_status}{inspection.notes?` · ${inspection.notes.slice(0,50)}…`:""}</div>
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
        <div style={{width:44,height:44,borderRadius:"50%",background:cBg[queen.colour]||T.surface,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:cTx[queen.colour]||T.inkMid,flexShrink:0,fontFamily:FONT_SANS}}>Q{queen.number}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:FONT_SANS,fontSize:15,fontWeight:700,color:T.ink}}>Queen #{queen.number}{hive?` · Hive ${hive.number}`:" · Unassigned"}</div>
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
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:T.tealLight,color:T.teal,fontSize:14,fontWeight:700,padding:"10px 16px",borderRadius:99,fontFamily:FONT_SANS}}>📍 {a.w3w}</div>
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
        <div style={{width:"100%",padding:20,background:T.red,color:"#fff",borderRadius:16,fontSize:18,fontWeight:700,textAlign:"center",fontFamily:FONT_SANS}}>📞 Call {a.emergencyContact}</div>
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
function HomeScreen({hives,inspections,queens,onInspect,onSafety,onHistory,onEditHive}){
  const farmHives=hives.filter(h=>h.apiary_name==="Farm");
  const homeHives=hives.filter(h=>h.apiary_name==="Home");
  const totalHigh=hives.reduce((n,h)=>n+generateActions(h,inspections,queens).filter(a=>a.priority==="high").length,0);

  const HiveCard=({hive})=>{
    const actions=generateActions(hive,inspections,queens);
    const high=actions.filter(a=>a.priority==="high");
    const med=actions.filter(a=>a.priority==="medium");
    const low=actions.filter(a=>a.priority==="low");
    const last=inspections.filter(i=>i.hive_id===hive.id).sort((a,b)=>new Date(b.visit_date)-new Date(a.visit_date))[0];
    const isHealthy=high.length===0&&med.length===0;
    const statusColor=high.length?T.red:med.length?T.amber:T.tealMid;
    const[open,setOpen]=useState(high.length>0);
    return<div style={{background:T.white,borderRadius:16,border:`0.5px solid ${T.border}`,marginBottom:10,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",transition:"box-shadow 0.2s"}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",borderBottom:open?`0.5px solid ${T.border}`:"none"}}>
        <div style={{width:42,height:42,borderRadius:"50%",background:T.tealLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:T.teal,flexShrink:0,fontFamily:FONT_SANS}}>{hive.number}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:FONT_SANS,fontSize:16,fontWeight:700,color:T.ink}}>Hive {hive.number}</div>
          <div style={{fontFamily:FONT_SANS,fontSize:12,color:T.inkLight,marginTop:2}}>{hive.apiary_name} · {last?`Last inspected ${formatDate(last.visit_date)}`:"Never inspected"}</div>
        </div>
        {isHealthy?<span style={{fontSize:18}}>🐝</span>:<div style={{width:10,height:10,borderRadius:"50%",background:statusColor,flexShrink:0}}/>}
        <span style={{fontFamily:FONT_SANS,color:T.inkLight,fontSize:11}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<>
        {[...high,...med,...low].map((a,i)=><ActionBanner key={i} action={a}/>)}
        {actions.length===0&&last&&(
          <div style={{padding:"12px 18px",display:"flex",flexWrap:"wrap",gap:6}}>
            <Badge>BIAS {last.brood_frames}fr</Badge>
            <Badge>Stores {last.stores}</Badge>
            <Badge>{last.supers_total} super{last.supers_total!==1?"s":""}</Badge>
            <Badge>Temper {last.temperament}/5</Badge>
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

  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <HomeHeader farmCount={farmHives.length} homeCount={homeHives.length} urgentCount={totalHigh} onSafety={onSafety}/>
    <div style={{flex:1,overflowY:"auto",background:T.surface,padding:"14px 14px",WebkitOverflowScrolling:"touch"}}>
      <AllClearBanner hives={hives} inspections={inspections}/>
      <StreakCard inspections={inspections} hives={hives}/>
      <SectionLabel>Farm apiary</SectionLabel>
      {farmHives.map(h=><HiveCard key={h.id} hive={h}/>)}
      <SectionLabel>Home apiary</SectionLabel>
      {homeHives.map(h=><HiveCard key={h.id} hive={h}/>)}
      <div style={{height:12}}/>
    </div>
  </div>;
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────
function TabBar({active,onChange}){
  const tabs=[{id:"home",label:"Home",icon:"⌂"},{id:"queens",label:"Queens",icon:"♛"},{id:"trends",label:"Trends",icon:"↗"},{id:"safety",label:"Safety",icon:"⊕"}];
  return<div style={{display:"flex",background:T.white,borderTop:`0.5px solid ${T.border}`,flexShrink:0,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
    {tabs.map(t=><button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 0 13px",border:"none",background:"transparent",cursor:"pointer",fontFamily:FONT_SANS}}>
      <span style={{fontSize:22,color:active===t.id?T.teal:T.inkLight}}>{t.icon}</span>
      <span style={{fontFamily:FONT_SANS,fontSize:11,color:active===t.id?T.teal:T.inkLight,fontWeight:active===t.id?700:400,letterSpacing:"0.02em"}}>{t.label}</span>
    </button>)}
  </div>;
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App(){
  const[hives,setHives]=useState([]);
  const[queens,setQueens]=useState([]);
  const[inspections,setInspections]=useState([]);
  const[loading,setLoading]=useState(true);
  const[screen,setScreen]=useState("home");
  const[tab,setTab]=useState("home");
  const[selectedHive,setSelectedHive]=useState(null);
  const[editingInspection,setEditingInspection]=useState(null);
  const[movingInspection,setMovingInspection]=useState(null);
  const[editingQueen,setEditingQueen]=useState(null);
  const[editingHive,setEditingHive]=useState(null);
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
      setHives(h||[]);setQueens(q||[]);setInspections(i||[]);setLoading(false);
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

  const handleTab=t=>{setTab(t);if(t==="trends"){window.location.href="/trends";return;}setScreen(t);};
  const handleBack=()=>{
    if(screen==="inspect"&&editingInspection){setScreen("history");return;}
    if(screen==="move"){setMovingInspection(null);setScreen("history");return;}
    if(screen==="editqueen"){setEditingQueen(null);setScreen("queens");return;}
    if(screen==="edithive"){setEditingHive(null);setScreen("home");return;}
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
          {screen==="home"&&<HomeScreen hives={hives} inspections={inspections} queens={queens} onInspect={handleInspect} onSafety={()=>{setScreen("safety");setTab("safety");}} onHistory={handleHistory} onEditHive={handleEditHive}/>}
          {screen==="inspect"&&selectedHive&&<InspectionForm hive={selectedHive} queens={queens} existingInspection={editingInspection} onSave={handleSaveInspection} onBack={handleBack}/>}
          {screen==="queens"&&<QueenRegister queens={queens} hives={hives} onBack={handleBack} onEditQueen={handleEditQueen}/>}
          {screen==="safety"&&<SafetyScreen hives={hives} onBack={handleBack}/>}
          {screen==="history"&&selectedHive&&<InspectionHistory hive={selectedHive} inspections={inspections} onBack={handleBack} onEdit={handleEdit} onMove={handleMove}/>}
          {screen==="move"&&movingInspection&&<InspectionHiveSelect inspection={movingInspection} hives={hives} onSave={handleMoveInspection} onBack={handleBack}/>}
          {screen==="editqueen"&&editingQueen&&<QueenEditForm queen={editingQueen} hives={hives} onSave={handleSaveQueen} onBack={handleBack}/>}
          {screen==="edithive"&&editingHive&&<HiveEditForm hive={editingHive} onSave={handleSaveHive} onBack={handleBack}/>}
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
