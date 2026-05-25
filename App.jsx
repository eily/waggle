import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

const TEAL = "#0F6E56";
const TEAL_LIGHT = "#E1F5EE";
const TEAL_MID = "#1D9E75";
const AMBER = "#EF9F27";
const AMBER_LIGHT = "#FAEEDA";
const RED = "#E24B4A";
const RED_LIGHT = "#FCEBEB";
const GRAY = "#F3F4F6";

const APIARIES = {
  Farm: { name:"Farm apiary", address:"Elton Moor Farm, Whinney Hill, Darlington Back Lane, TS21 1BQ", landowner:"Jonathan Marsh", w3w:"clean.verge.ample", emergencyContact:"Kay Chapman", emergencyPhone:"07852997063" },
  Home: { name:"Home apiary", address:"47 Grosvenor Road, Stockton on Tees, TS19 7AE", landowner:"Peter Chapman", w3w:"tests.hunt.social", emergencyContact:"Kay Chapman", emergencyPhone:"07852997063" },
};

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
    if(last.brood_status==="No eggs")actions.push({text:`No eggs seen ${formatDate(last.visit_date)} — check for new queen or eggs`,priority:"high"});
    if(last.varroa==="High")actions.push({text:"Varroa drop HIGH — consider treatment urgently",priority:"high"});
    if(last.health!=="OK")actions.push({text:`Disease concern: ${last.health} — follow up required`,priority:"high"});
    if(last.room<=1)actions.push({text:"Hive congested — add super or consider split",priority:"medium"});
    if(last.supers_total>0)actions.push({text:`Check super fill — ${last.supers_total} super${last.supers_total>1?"s":""} on hive`,priority:"medium"});
    if(days>10)actions.push({text:`Inspection overdue — last visit ${formatDate(last.visit_date)} (${days} days ago)`,priority:"low"});
  }else{actions.push({text:"No inspections recorded — log first inspection",priority:"high"});}
  if(queen)getQueenMilestones(queen).forEach(m=>{if(!m.confirmed&&m.date){const du=-daysSince(m.date);if(du<=3&&du>=-3)actions.push({text:`Queen milestone: ${m.label} around ${formatDate(m.date)}`,priority:"high"});}});
  return actions;
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti(){
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const W=canvas.offsetWidth,H=canvas.offsetHeight;
    canvas.width=W;canvas.height=H;
    const colors=["#9FE1CB","#FAC775","#fff","#5DCAA5","#EF9F27","#E1F5EE"];
    const particles=Array.from({length:50},()=>({
      x:Math.random()*W,y:-10-Math.random()*50,
      vx:(Math.random()-0.5)*2.5,vy:1.5+Math.random()*2.5,
      size:4+Math.random()*5,color:colors[Math.floor(Math.random()*colors.length)],
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
  return <canvas ref={ref} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}}/>;
}

// ── Celebration: inspection saved ─────────────────────────────────────────────
function InspectionSavedScreen({hive,seasonCount,weekCount,streak,onDone}){
  const [visible,setVisible]=useState([false,false,false]);
  useEffect(()=>{
    [100,280,460].forEach((t,i)=>setTimeout(()=>setVisible(v=>{const n=[...v];n[i]=true;return n;}),t));
  },[]);
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:TEAL,position:"relative",overflow:"hidden"}}>
      <Confetti/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",position:"relative",zIndex:1}}>
        <div style={{display:"flex",gap:6,marginBottom:20}}>
          {["🐝","🐝","🐝"].map((b,i)=>(
            <span key={i} style={{fontSize:i===1?38:26,transition:"all 0.4s cubic-bezier(0.34,1.56,0.64,1)",opacity:visible[i]?1:0,transform:visible[i]?"translateY(0) scale(1)":"translateY(20px) scale(0.4)"}}>
              {b}
            </span>
          ))}
        </div>
        <div style={{fontSize:26,fontWeight:800,color:"#fff",textAlign:"center",marginBottom:8}}>
          Hive {hive.number} logged!
        </div>
        <div style={{fontSize:14,color:"#9FE1CB",textAlign:"center",lineHeight:1.5,marginBottom:28}}>
          Inspection saved · {new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}
        </div>
        <div style={{display:"flex",gap:10,width:"100%",marginBottom:28}}>
          {[["🐝",weekCount,"This week"],["📋",seasonCount,"This season"],["🔥",streak+"wk","Streak"]].map(([icon,val,lbl],i)=>(
            <div key={i} style={{flex:1,background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontSize:16,marginBottom:2}}>{icon}</div>
              <div style={{fontSize:20,fontWeight:800,color:"#fff"}}>{val}</div>
              <div style={{fontSize:10,color:"#9FE1CB",marginTop:2,lineHeight:1.3}}>{lbl}</div>
            </div>
          ))}
        </div>
        <button onClick={onDone} style={{width:"100%",padding:16,background:"#fff",color:TEAL,border:"none",borderRadius:12,fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
          Back to hives
        </button>
      </div>
    </div>
  );
}

// ── Milestone: first eggs seen ────────────────────────────────────────────────
function FirstEggsMilestone({hive,queen,onLog,onDismiss}){
  return(
    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,zIndex:50}}>
      <div style={{background:"#fff",borderRadius:20,padding:"28px 20px",textAlign:"center",width:"100%"}}>
        <div style={{fontSize:44,marginBottom:6,animation:"pulse 1.4s ease-in-out infinite alternate"}}>🐝</div>
        <div style={{display:"inline-block",background:TEAL_LIGHT,color:"#085041",fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:99,marginBottom:10}}>Queen milestone</div>
        <div style={{fontSize:20,fontWeight:800,color:"#111827",marginBottom:6}}>First eggs in Hive {hive.number}!</div>
        <div style={{fontSize:13,color:"#6B7280",lineHeight:1.5,marginBottom:18}}>
          {queen?`Queen #${queen.number} is laying. The colony is back on track.`:"The colony is back on track."}
        </div>
        {queen&&queen.qc_capped_date&&(
          <div style={{background:"#F9FAFB",border:"0.5px solid #E5E7EB",borderRadius:10,padding:"10px 14px",marginBottom:18,textAlign:"left"}}>
            <div style={{fontSize:11,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Queen #{queen.number} · Hive {hive.number}</div>
            <div style={{fontSize:13,fontWeight:700,color:"#111827",marginTop:3}}>
              QC capped {formatDate(queen.qc_capped_date)} → eggs seen today
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:8}}>
          <button onClick={onLog} style={{flex:1,padding:13,background:TEAL,color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Log it ✓</button>
          <button onClick={onDismiss} style={{flex:1,padding:13,background:"#F3F4F6",color:"#374151",border:"none",borderRadius:10,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Dismiss</button>
        </div>
      </div>
      <style>{`@keyframes pulse{from{transform:scale(1)}to{transform:scale(1.1)}}`}</style>
    </div>
  );
}

// ── Season harvest celebration ────────────────────────────────────────────────
function HarvestCelebration({harvest,previousBest,onDone}){
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:TEAL,alignItems:"center",padding:"36px 20px",overflowY:"auto"}}>
      <div style={{display:"flex",gap:6,marginBottom:18}}>
        {["🐝","🍯","🐝"].map((e,i)=>(
          <span key={i} style={{fontSize:34,display:"inline-block",animation:`pulse${i} 1s ${i*0.2}s ease-in-out infinite alternate`}}>{e}</span>
        ))}
      </div>
      <div style={{fontSize:22,fontWeight:800,color:"#fff",textAlign:"center",marginBottom:4}}>
        {harvest.season} {harvest.year} harvest logged
      </div>
      <div style={{fontSize:13,color:"#9FE1CB",textAlign:"center",marginBottom:24}}>Chapman Apiaries</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,width:"100%",marginBottom:16}}>
        {[[harvest.jars,"jars produced"],[harvest.super_frames,"frames extracted"],[`${harvest.weight_lbs}lb`,"total weight"],["5","hives contributed"]].map(([v,l],i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"14px 10px",textAlign:"center"}}>
            <div style={{fontSize:26,fontWeight:800,color:"#fff"}}>{v}</div>
            <div style={{fontSize:11,color:"#9FE1CB",marginTop:3}}>{l}</div>
          </div>
        ))}
      </div>
      {previousBest&&(
        <div style={{background:"rgba(255,255,255,0.12)",borderRadius:10,padding:"12px 16px",width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <div style={{fontSize:11,color:"#9FE1CB"}}>vs {harvest.season} {harvest.year-1}</div>
            <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{previousBest} jars last year</div>
          </div>
          <div style={{fontSize:16,color:harvest.jars>=previousBest?"#9FE1CB":AMBER,fontWeight:800}}>
            {harvest.jars>=previousBest?"↑ Best yet!":"↓ "+(Math.round((1-harvest.jars/previousBest)*100))+"%"}
          </div>
        </div>
      )}
      <button onClick={onDone} style={{width:"100%",padding:16,background:"#fff",color:TEAL,border:"none",borderRadius:12,fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
        Back to hives
      </button>
      <style>{`@keyframes pulse0{from{transform:scale(1)}to{transform:scale(1.1)}}@keyframes pulse1{from{transform:scale(1)}to{transform:scale(1.08)}}@keyframes pulse2{from{transform:scale(1)}to{transform:scale(1.1)}}`}</style>
    </div>
  );
}

// ── Streak card (home screen widget) ─────────────────────────────────────────
function StreakCard({inspections,hives}){
  const activeHives=hives.filter(h=>h.status==="Active");
  const currentWeek=weekNum();
  const weeks=[-3,-2,-1,0,1,2].map(offset=>currentWeek+offset);
  const weekDone=(wk)=>{
    const hivesThisWeek=new Set(inspections.filter(i=>weekNum(i.visit_date)===wk).map(i=>i.hive_id));
    return activeHives.every(h=>hivesThisWeek.has(h.id));
  };
  let streak=0;
  for(let w=currentWeek;w>=currentWeek-20;w--){if(weekDone(w))streak++;else break;}
  if(streak<2)return null;
  return(
    <div style={{background:"#fff",border:"0.5px solid #E5E7EB",borderRadius:14,marginBottom:10,padding:"14px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <span style={{fontSize:26}}>🔥</span>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#111827"}}>{streak}-week inspection streak</div>
          <div style={{fontSize:12,color:"#9CA3AF",marginTop:1}}>Every hive checked every week</div>
        </div>
      </div>
      <div style={{display:"flex",gap:5,marginBottom:12}}>
        {weeks.map((wk,i)=>{
          const done=weekDone(wk);
          const isNow=wk===currentWeek;
          const future=wk>currentWeek;
          return(
            <div key={i} style={{flex:1,height:36,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,
              background:future?"#F1EFE8":isNow&&done?TEAL:done?TEAL_LIGHT:"#F1EFE8",
            }}>
              <span style={{fontSize:12,color:future?"#B4B2A9":isNow&&done?"#fff":done?"#085041":"#B4B2A9"}}>{done&&!future?"✓":"—"}</span>
              <span style={{fontSize:9,fontWeight:500,color:future?"#B4B2A9":isNow&&done?"#9FE1CB":done?"#1D9E75":"#B4B2A9"}}>W{wk}</span>
            </div>
          );
        })}
      </div>
      <div style={{background:"#F9FAFB",borderRadius:8,padding:"9px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:12,color:"#6B7280"}}>Personal best this season</span>
        <span style={{fontSize:16,fontWeight:800,color:TEAL}}>{streak} weeks 🐝</span>
      </div>
    </div>
  );
}

// ── All-clear banner (home screen) ────────────────────────────────────────────
function AllClearBanner({hives,inspections}){
  const activeHives=hives.filter(h=>h.status==="Active");
  if(activeHives.length===0)return null;
  const currentWeek=weekNum();
  const checkedThisWeek=activeHives.filter(h=>inspections.some(i=>i.hive_id===h.id&&weekNum(i.visit_date)===currentWeek));
  if(checkedThisWeek.length<activeHives.length)return null;
  return(
    <div style={{background:TEAL_LIGHT,border:`0.5px solid #9FE1CB`,borderRadius:14,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"flex-start",gap:12}}>
      <span style={{fontSize:28,flexShrink:0}}>🐝</span>
      <div>
        <div style={{fontSize:14,fontWeight:800,color:"#085041"}}>All hives checked this week</div>
        <div style={{fontSize:12,color:"#1D9E75",marginTop:3,lineHeight:1.4}}>Every colony has been visited. Nothing urgent. Enjoy the weekend.</div>
      </div>
    </div>
  );
}

// ── UI primitives ─────────────────────────────────────────────────────────────
function Badge({children,color="teal"}){
  const map={teal:[TEAL_LIGHT,"#085041"],amber:[AMBER_LIGHT,"#633806"],red:[RED_LIGHT,"#791F1F"],gray:["#F1EFE8","#5F5E5A"]};
  const[bg,text]=map[color]||map.teal;
  return<span style={{background:bg,color:text,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:99,display:"inline-block"}}>{children}</span>;
}
function SegPicker({options,value,onChange,small}){
  return<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{options.map(opt=>{const sel=opt===value;return<button key={opt} onClick={()=>onChange(opt)} style={{flex:1,minWidth:52,padding:small?"9px 4px":"13px 4px",border:sel?`1.5px solid ${TEAL}`:"0.5px solid #D1D5DB",borderRadius:10,background:sel?TEAL:"#fff",color:sel?"#fff":"#374151",fontSize:small?12:14,fontWeight:sel?700:400,cursor:"pointer",fontFamily:"inherit",lineHeight:1.2}}>{opt}</button>;})}</div>;
}
function Toggle({value,onChange,label}){
  return<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 12px",background:"#F9FAFB",border:"0.5px solid #E5E7EB",borderRadius:10}}><span style={{fontSize:13,color:"#6B7280"}}>{label}</span><div onClick={()=>onChange(!value)} style={{width:40,height:24,borderRadius:99,background:value?TEAL:"#D1D5DB",position:"relative",cursor:"pointer",flexShrink:0,transition:"background 0.2s"}}><div style={{position:"absolute",width:20,height:20,borderRadius:"50%",background:"#fff",top:2,left:value?18:2,transition:"left 0.2s"}}/></div></div>;
}
function Slider({min,max,step=0.5,value,onChange,unit=" fr"}){
  return<div style={{display:"flex",alignItems:"center",gap:12}}><input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))} style={{flex:1,accentColor:TEAL,height:4}}/><span style={{fontSize:16,fontWeight:700,color:"#111827",minWidth:52,textAlign:"right"}}>{value}{unit}</span></div>;
}
function Stepper({value,onChange,min=0,max=99,display}){
  return<div style={{display:"flex",alignItems:"center",gap:12}}><button onClick={()=>onChange(Math.max(min,value-1))} style={{width:48,height:48,border:"0.5px solid #D1D5DB",borderRadius:10,background:"#fff",fontSize:22,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>−</button><div style={{flex:1,textAlign:"center"}}>{display||<span style={{fontSize:24,fontWeight:700,color:"#111827"}}>{value}</span>}</div><button onClick={()=>onChange(Math.min(max,value+1))} style={{width:48,height:48,border:"0.5px solid #D1D5DB",borderRadius:10,background:"#fff",fontSize:22,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>+</button></div>;
}
function TemperPicker({value,onChange}){
  const labels={1:"Aborted",2:"Aggressive",3:"Agitated",4:"OK",5:"Calm"};
  return<div><div style={{display:"flex",gap:6,marginBottom:8}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>onChange(n)} style={{flex:1,padding:"14px 0",border:n===value?`1.5px solid ${TEAL}`:"0.5px solid #D1D5DB",borderRadius:10,background:n===value?TEAL:"#fff",color:n===value?"#fff":"#374151",fontSize:16,fontWeight:n===value?700:400,cursor:"pointer",fontFamily:"inherit"}}>{n}</button>)}</div>{value&&<div style={{textAlign:"center",fontSize:13,color:"#9CA3AF"}}>{labels[value]}</div>}</div>;
}
function FormSection({title,children}){return<div style={{background:"#fff",border:"0.5px solid #E5E7EB",borderRadius:14,overflow:"hidden",marginBottom:12}}><div style={{padding:"12px 16px 10px",borderBottom:"0.5px solid #F3F4F6"}}><span style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.07em"}}>{title}</span></div>{children}</div>;}
function FormRow({label,sublabel,children,last}){return<div style={{padding:"14px 16px",borderBottom:last?"none":"0.5px solid #F3F4F6"}}>{label&&<div style={{marginBottom:10}}><span style={{fontSize:14,fontWeight:600,color:"#111827"}}>{label}</span>{sublabel&&<span style={{fontSize:12,color:"#9CA3AF",marginLeft:6}}>{sublabel}</span>}</div>}{children}</div>;}
function SectionLabel({children}){return<div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10,paddingLeft:2}}>{children}</div>;}
function ActionBanner({action}){
  const map={high:[RED_LIGHT,"#FECACA","#991B1B",RED],medium:[AMBER_LIGHT,"#FDE68A","#92400E",AMBER],low:["#F9FAFB","#E5E7EB","#6B7280","#9CA3AF"]};
  const[bg,border,text,dot]=map[action.priority]||map.low;
  return<div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 16px",background:bg,borderBottom:`0.5px solid ${border}`}}><div style={{width:8,height:8,borderRadius:"50%",background:dot,flexShrink:0,marginTop:4}}/><span style={{fontSize:13,color:text,lineHeight:1.5,flex:1}}>{action.text}</span></div>;
}
function LoadingScreen(){return<div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:TEAL}}><div style={{fontSize:32,fontWeight:800,color:"#fff",marginBottom:12}}>Waggle</div><div style={{fontSize:14,color:"#9FE1CB"}}>Loading your hives…</div></div>;}
function EmptyHiveState(){return<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:48,marginBottom:12,opacity:0.5}}>🐝</div><div style={{fontSize:15,fontWeight:600,color:"#374151",marginBottom:6}}>No inspections yet</div><div style={{fontSize:13,color:"#9CA3AF",lineHeight:1.5}}>Once you log your first inspection, it will appear here.</div></div>;}

// ── Inspection Form ───────────────────────────────────────────────────────────
function InspectionForm({hive,queens,existingInspection,onSave,onBack}){
  const isEdit=!!existingInspection;
  const activeQueen=queens.find(q=>q.hive_id===hive.id&&!q.lost_date);
  const defaults=isEdit?{
    visit_date:existingInspection.visit_date,visit_time:existingInspection.visit_time||nowTimeStr(),
    queen_seen:existingInspection.queen_seen||"",queen_number:existingInspection.queen_number||"",queen_colour:existingInspection.queen_colour||"",
    qc_count:existingInspection.qc_count||0,qc_action:existingInspection.qc_action||"None seen",qc_note:existingInspection.qc_note||"",
    brood_status:existingInspection.brood_status||"BIAS",brood_frames:existingInspection.brood_frames||3,
    stores:existingInspection.stores||5,room:existingInspection.room||4,
    health:existingInspection.health||"OK",health_note:existingInspection.health_note||"",
    varroa:existingInspection.varroa||"Not checked",temperament:existingInspection.temperament||null,
    feed_given:existingInspection.feed_given||"None",feed_qty:existingInspection.feed_qty||"",
    supers_change:existingInspection.supers_change||0,
    weather_condition:existingInspection.weather_condition||"Sun",weather_temp:existingInspection.weather_temp||16,
    qe:existingInspection.qe??hive.qe,crown_board:existingInspection.crown_board??hive.crown_board,
    porter_escapes:existingInspection.porter_escapes??hive.porter_escapes,entrance_reducer:existingInspection.entrance_reducer??hive.entrance_reducer,
    mouse_guard:existingInspection.mouse_guard??hive.mouse_guard,insulation:existingInspection.insulation??hive.insulation,
    notes:existingInspection.notes||"",
  }:{
    visit_date:todayStr(),visit_time:nowTimeStr(),
    queen_seen:"",queen_number:activeQueen?.number||"",queen_colour:activeQueen?.colour||"",
    qc_count:0,qc_action:"None seen",qc_note:"",
    brood_status:"BIAS",brood_frames:3,stores:5,room:4,
    health:"OK",health_note:"",varroa:"Not checked",temperament:null,
    feed_given:"None",feed_qty:"",supers_change:0,
    weather_condition:"Sun",weather_temp:16,
    qe:hive.qe,crown_board:hive.crown_board,porter_escapes:hive.porter_escapes,
    entrance_reducer:hive.entrance_reducer,mouse_guard:hive.mouse_guard,insulation:hive.insulation,
    notes:"",
  };
  const[form,setForm]=useState(defaults);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const supersTotal=Math.max(0,hive.super_count+(isEdit?0:form.supers_change));
  const[saving,setSaving]=useState(false);

  // detect first eggs milestone
  const wasQueenless=()=>{if(!isEdit&&form.queen_seen==="Seen"&&(form.brood_status==="BIAS"||form.brood_status==="No eggs")){return true;}return false;};
  const prevInspHadNoEggs=()=>{return false;};

  const handleSave=async()=>{
    setSaving(true);
    const firstEggs=!isEdit&&form.queen_seen==="Seen"&&form.brood_status==="BIAS";
    if(isEdit){
      const{error}=await supabase.from("inspections").update({...form}).eq("id",existingInspection.id);
      if(error){alert("Error: "+error.message);}
      else{onSave({...existingInspection,...form},0,true,false);}
    }else{
      const record={hive_id:hive.id,...form,supers_total:supersTotal};
      const{error}=await supabase.from("inspections").insert([record]);
      if(!error){
        await supabase.from("hives").update({super_count:supersTotal}).eq("id",hive.id);
        onSave(record,form.supers_change,false,firstEggs);
      }else{alert("Error: "+error.message);}
    }
    setSaving(false);
  };

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{background:TEAL,padding:"max(env(safe-area-inset-top,0px),12px) 16px 14px",flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#9FE1CB",fontSize:14,cursor:"pointer",padding:0,marginBottom:8,fontFamily:"inherit"}}>← Back</button>
        <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>Hive {hive.number} — {isEdit?"edit inspection":"inspection"}</div>
        <div style={{fontSize:12,color:"#9FE1CB",marginTop:2}}>{hive.apiary_name} apiary · {form.visit_date}</div>
      </div>
      <div style={{flex:1,overflowY:"auto",background:GRAY,padding:"12px",WebkitOverflowScrolling:"touch"}}>
        <FormSection title="Queen">
          <FormRow label="Queen seen?"><SegPicker options={["Seen","Not found","Not looked"]} value={form.queen_seen} onChange={v=>set("queen_seen",v)}/></FormRow>
          <FormRow label="Queen colour"><SegPicker options={["White","Yellow","Red","Green","Blue"]} value={form.queen_colour} onChange={v=>set("queen_colour",v)} small/></FormRow>
          <FormRow label="Queen cells seen"><Stepper value={form.qc_count} onChange={v=>set("qc_count",v)} max={20}/></FormRow>
          {form.qc_count>0&&<FormRow label="Action taken"><SegPicker options={["All removed","1 left","2 left","Other"]} value={form.qc_action} onChange={v=>set("qc_action",v)}/></FormRow>}
          <FormRow label="QC notes" last><input value={form.qc_note} onChange={e=>set("qc_note",e.target.value)} placeholder="Frame locations, capped vs open…" style={{width:"100%",border:"0.5px solid #D1D5DB",borderRadius:10,padding:"12px",fontSize:14,fontFamily:"inherit",background:"#fff",color:"#111827"}}/></FormRow>
        </FormSection>
        <FormSection title="Brood">
          <FormRow label="Status"><SegPicker options={["BIAS","No eggs","No brood","Drone only"]} value={form.brood_status} onChange={v=>set("brood_status",v)}/></FormRow>
          {form.brood_status==="BIAS"&&<FormRow label="Frames covered"><Slider min={0.5} max={11} step={0.5} value={form.brood_frames} onChange={v=>set("brood_frames",v)} unit=" fr"/></FormRow>}
          <FormRow label="Stores" sublabel="space available"><Slider min={0} max={20} step={1} value={form.stores} onChange={v=>set("stores",v)} unit=" fr"/></FormRow>
          <FormRow label="Room" sublabel="space for queen to lay" last><Slider min={0} max={11} step={1} value={form.room} onChange={v=>set("room",v)} unit=" fr"/></FormRow>
        </FormSection>
        <FormSection title="Health & Varroa">
          <FormRow label="Health status"><SegPicker options={["OK","Chalk brood?","EFB?","AFB?","Varroa concern"]} value={form.health} onChange={v=>set("health",v)} small/></FormRow>
          {form.health!=="OK"&&<FormRow label="Health note"><textarea value={form.health_note} onChange={e=>set("health_note",e.target.value)} placeholder="Describe what you observed…" style={{width:"100%",minHeight:72,border:"0.5px solid #D1D5DB",borderRadius:10,padding:"12px",fontSize:14,fontFamily:"inherit",resize:"none",background:"#fff",color:"#111827"}}/></FormRow>}
          <FormRow label="Varroa drop" last><SegPicker options={["Not checked","Low","Medium","High"]} value={form.varroa} onChange={v=>set("varroa",v)}/></FormRow>
        </FormSection>
        <FormSection title="Temperament">
          <FormRow label="Colony temperament" sublabel="5 = very calm · 1 = aborted" last><TemperPicker value={form.temperament} onChange={v=>set("temperament",v)}/></FormRow>
        </FormSection>
        {!isEdit&&<FormSection title="Supers">
          <FormRow label="Change this visit" last>
            <Stepper value={form.supers_change} min={-10} max={10} onChange={v=>set("supers_change",v)}
              display={<div style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:"#111827"}}>{form.supers_change>0?`+${form.supers_change}`:form.supers_change}</div><div style={{fontSize:13,color:"#9CA3AF",marginTop:2}}>Total now: {supersTotal} super{supersTotal!==1?"s":""}</div></div>}/>
          </FormRow>
        </FormSection>}
        <FormSection title="Feed">
          <FormRow label="Feed given"><SegPicker options={["None","Light syrup (1:1)","Heavy syrup (2:1)","Fondant","Pollen patty"]} value={form.feed_given} onChange={v=>set("feed_given",v)} small/></FormRow>
          {form.feed_given!=="None"&&<FormRow label="Quantity" last><input value={form.feed_qty} onChange={e=>set("feed_qty",e.target.value)} placeholder="e.g. 2 litres, 2 kg" style={{width:"100%",border:"0.5px solid #D1D5DB",borderRadius:10,padding:"12px",fontSize:14,fontFamily:"inherit",background:"#fff",color:"#111827"}}/></FormRow>}
        </FormSection>
        <FormSection title="Hive configuration">
          <FormRow last><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["qe","QE fitted"],["crown_board","Crown board"],["porter_escapes","Porter escapes"],["entrance_reducer","Entrance reducer"],["mouse_guard","Mouse guard"],["insulation","Insulation"]].map(([k,l])=><Toggle key={k} value={form[k]} onChange={v=>set(k,v)} label={l}/>)}
          </div></FormRow>
        </FormSection>
        <FormSection title="Weather">
          <FormRow label="Conditions"><SegPicker options={["Sun","Cloud","Rain","Fair"]} value={form.weather_condition} onChange={v=>set("weather_condition",v)}/></FormRow>
          <FormRow label="Temperature" last><Stepper value={form.weather_temp} min={-10} max={40} display={<span style={{fontSize:26,fontWeight:800,color:"#111827"}}>{form.weather_temp}°C</span>} onChange={v=>set("weather_temp",v)}/></FormRow>
        </FormSection>
        <FormSection title="Notes">
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Observations, actions taken, things to remember…" style={{width:"100%",minHeight:120,border:"none",padding:"14px 16px",fontSize:15,fontFamily:"inherit",resize:"none",background:"transparent",color:"#111827",display:"block"}}/>
        </FormSection>
        <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:18,background:saving?"#9CA3AF":TEAL,color:"#fff",border:"none",borderRadius:14,fontSize:17,fontWeight:800,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",marginBottom:32}}>
          {saving?"Saving…":isEdit?"Update inspection":"Save inspection"}
        </button>
      </div>
    </div>
  );
}

// ── Queen Register ────────────────────────────────────────────────────────────
// ── Queen Edit Form ───────────────────────────────────────────────────────────
function QueenEditForm({queen,hives,onSave,onBack}){
  const[form,setForm]=useState({
    hive_id:queen.hive_id||"",
    colour:queen.colour||"",
    year:queen.year||new Date().getFullYear(),
    origin:queen.origin||"",
    clipped:queen.clipped||false,
    qc_uncapped_date:queen.qc_uncapped_date||"",
    qc_capped_date:queen.qc_capped_date||"",
    queen_emerged_date:queen.queen_emerged_date||"",
    swarm_split_date:queen.swarm_split_date||"",
    eggs_first_seen:queen.eggs_first_seen||"",
    lost_date:queen.lost_date||"",
    lost_reason:queen.lost_reason||"",
    temper_rating:queen.temper_rating||null,
    notes:queen.notes||"",
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const[saving,setSaving]=useState(false);
  const activeHives=hives.filter(h=>h.status==="Active");

  const handleSave=async()=>{
    setSaving(true);
    const update={...form,hive_id:form.hive_id||null,lost_date:form.lost_date||null,lost_reason:form.lost_reason||null};
    const{error}=await supabase.from("queens").update(update).eq("id",queen.id);
    if(error){alert("Error: "+error.message);}
    else{onSave({...queen,...update});}
    setSaving(false);
  };

  const inputStyle={width:"100%",border:"0.5px solid #D1D5DB",borderRadius:10,padding:"12px",fontSize:14,fontFamily:"inherit",background:"#fff",color:"#111827"};
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <div style={{background:TEAL,padding:"max(env(safe-area-inset-top,0px),12px) 16px 14px",flexShrink:0}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#9FE1CB",fontSize:14,cursor:"pointer",padding:0,marginBottom:8,fontFamily:"inherit"}}>← Back</button>
      <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>Edit Queen #{queen.number}</div>
    </div>
    <div style={{flex:1,overflowY:"auto",background:GRAY,padding:"12px",WebkitOverflowScrolling:"touch"}}>
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
        {[["qc_uncapped_date","QC uncapped date"],["qc_capped_date","QC capped date"],["queen_emerged_date","Queen emerged"],["swarm_split_date","Swarm / split date"],["eggs_first_seen","Eggs first seen"]].map(([k,l])=>(
          <FormRow key={k} label={l}><input type="date" value={form[k]} onChange={e=>set(k,e.target.value)} style={inputStyle}/></FormRow>
        ))}
        <FormRow label="Lost date"><input type="date" value={form.lost_date} onChange={e=>set("lost_date",e.target.value)} style={inputStyle}/></FormRow>
        {form.lost_date&&<FormRow label="Lost reason" last><SegPicker options={["Swarmed","Died","Superseded","Unknown"]} value={form.lost_reason} onChange={v=>set("lost_reason",v)} small/></FormRow>}
      </FormSection>
      <FormSection title="Temperament">
        <FormRow label="Colony temperament" sublabel="5 = calm · 1 = aggressive" last><TemperPicker value={form.temper_rating} onChange={v=>set("temper_rating",v)}/></FormRow>
      </FormSection>
      <FormSection title="Notes">
        <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Any notes about this queen…" style={{width:"100%",minHeight:80,border:"none",padding:"14px 16px",fontSize:15,fontFamily:"inherit",resize:"none",background:"transparent",color:"#111827",display:"block"}}/>
      </FormSection>
      <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:18,background:saving?"#9CA3AF":TEAL,color:"#fff",border:"none",borderRadius:14,fontSize:17,fontWeight:800,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",marginBottom:32}}>
        {saving?"Saving…":"Save queen"}
      </button>
    </div>
  </div>;
}

// ── Hive Edit Form ────────────────────────────────────────────────────────────
function HiveEditForm({hive,onSave,onBack}){
  const[form,setForm]=useState({
    apiary_name:hive.apiary_name||"Farm",
    hive_type:hive.hive_type||"National Standard",
    status:hive.status||"Active",
    super_count:hive.super_count||0,
    deadout_reason:hive.deadout_reason||"",
    deadout_notes:hive.deadout_notes||"",
    notes:hive.notes||"",
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const[saving,setSaving]=useState(false);
  const inputStyle={width:"100%",border:"0.5px solid #D1D5DB",borderRadius:10,padding:"12px",fontSize:14,fontFamily:"inherit",background:"#fff",color:"#111827"};

  const handleSave=async()=>{
    setSaving(true);
    const{error}=await supabase.from("hives").update(form).eq("id",hive.id);
    if(error){alert("Error: "+error.message);}
    else{onSave({...hive,...form});}
    setSaving(false);
  };

  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <div style={{background:TEAL,padding:"max(env(safe-area-inset-top,0px),12px) 16px 14px",flexShrink:0}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#9FE1CB",fontSize:14,cursor:"pointer",padding:0,marginBottom:8,fontFamily:"inherit"}}>← Back</button>
      <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>Edit Hive {hive.number}</div>
    </div>
    <div style={{flex:1,overflowY:"auto",background:GRAY,padding:"12px",WebkitOverflowScrolling:"touch"}}>
      <FormSection title="Location & type">
        <FormRow label="Apiary"><SegPicker options={["Farm","Home"]} value={form.apiary_name} onChange={v=>set("apiary_name",v)}/></FormRow>
        <FormRow label="Hive type" last><SegPicker options={["National Standard","National Deep (14x12)","Langstroth","Poly Nuc"]} value={form.hive_type} onChange={v=>set("hive_type",v)} small/></FormRow>
      </FormSection>
      <FormSection title="Status">
        <FormRow label="Current status"><SegPicker options={["Active","Deadout","Empty"]} value={form.status} onChange={v=>set("status",v)}/></FormRow>
        {form.status==="Deadout"&&<FormRow label="Deadout reason"><SegPicker options={["Weak due to varroa","Wasps","EFB","AFB","Isolation starvation","Other"]} value={form.deadout_reason} onChange={v=>set("deadout_reason",v)} small/></FormRow>}
        {form.status==="Deadout"&&<FormRow label="Deadout notes" last><textarea value={form.deadout_notes} onChange={e=>set("deadout_notes",e.target.value)} style={{...inputStyle,minHeight:60,resize:"none"}}/></FormRow>}
      </FormSection>
      <FormSection title="Supers">
        <FormRow label="Current super count" last><Stepper value={form.super_count} min={0} max={10} onChange={v=>set("super_count",v)}/></FormRow>
      </FormSection>
      <FormSection title="Notes">
        <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Any notes about this hive…" style={{width:"100%",minHeight:80,border:"none",padding:"14px 16px",fontSize:15,fontFamily:"inherit",resize:"none",background:"transparent",color:"#111827",display:"block"}}/>
      </FormSection>
      <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:18,background:saving?"#9CA3AF":TEAL,color:"#fff",border:"none",borderRadius:14,fontSize:17,fontWeight:800,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",marginBottom:32}}>
        {saving?"Saving…":"Save hive"}
      </button>
    </div>
  </div>;
}

// ── Inspection edit: move to different hive ───────────────────────────────────
function InspectionHiveSelect({inspection,hives,onSave,onBack}){
  const[selectedHiveId,setSelectedHiveId]=useState(inspection.hive_id);
  const[saving,setSaving]=useState(false);
  const handleSave=async()=>{
    if(selectedHiveId===inspection.hive_id){onBack();return;}
    setSaving(true);
    const{error}=await supabase.from("inspections").update({hive_id:selectedHiveId}).eq("id",inspection.id);
    if(error){alert("Error: "+error.message);}
    else{onSave({...inspection,hive_id:selectedHiveId});}
    setSaving(false);
  };
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <div style={{background:TEAL,padding:"max(env(safe-area-inset-top,0px),12px) 16px 14px",flexShrink:0}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#9FE1CB",fontSize:14,cursor:"pointer",padding:0,marginBottom:8,fontFamily:"inherit"}}>← Back</button>
      <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>Move inspection</div>
      <div style={{fontSize:12,color:"#9FE1CB",marginTop:2}}>{formatDate(inspection.visit_date)} — select correct hive</div>
    </div>
    <div style={{flex:1,overflowY:"auto",background:GRAY,padding:"12px",WebkitOverflowScrolling:"touch"}}>
      <div style={{background:AMBER_LIGHT,border:`0.5px solid ${AMBER}`,borderRadius:12,padding:"12px 16px",marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:"#633806",marginBottom:2}}>Moving this inspection</div>
        <div style={{fontSize:12,color:"#854F0B",lineHeight:1.5}}>{formatDate(inspection.visit_date)} · {inspection.brood_status} · {inspection.notes?.slice(0,60)||"No notes"}</div>
      </div>
      <FormSection title="Select the correct hive">
        {hives.map(h=>(
          <div key={h.id} onClick={()=>setSelectedHiveId(h.id)} style={{padding:"14px 16px",borderBottom:"0.5px solid #F3F4F6",display:"flex",alignItems:"center",gap:12,cursor:"pointer",background:selectedHiveId===h.id?TEAL_LIGHT:"transparent"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:selectedHiveId===h.id?TEAL:TEAL_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:selectedHiveId===h.id?"#fff":"#085041",flexShrink:0}}>{h.number}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:"#111827"}}>Hive {h.number}</div>
              <div style={{fontSize:12,color:"#9CA3AF"}}>{h.apiary_name} · {h.status}</div>
            </div>
            {selectedHiveId===h.id&&<span style={{color:TEAL,fontWeight:700,fontSize:16}}>✓</span>}
          </div>
        ))}
      </FormSection>
      <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:18,background:saving?"#9CA3AF":TEAL,color:"#fff",border:"none",borderRadius:14,fontSize:17,fontWeight:800,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",marginBottom:32,marginTop:8}}>
        {saving?"Moving…":"Move inspection"}
      </button>
    </div>
  </div>;
}

// ── Queen Register (with edit buttons) ────────────────────────────────────────
function QueenRegister({queens,hives,onBack,onEditQueen}){
  const[openId,setOpenId]=useState(null);
  const active=queens.filter(q=>!q.lost_date).sort((a,b)=>a.number-b.number);
  const lost=queens.filter(q=>q.lost_date).sort((a,b)=>b.number-a.number);
  const cBg={White:"#F9FAFB",Yellow:AMBER_LIGHT,Red:RED_LIGHT,Green:"#EAF3DE",Blue:"#E6F1FB",TBC:"#F3F4F6"};
  const cTx={White:"#374151",Yellow:"#633806",Red:"#791F1F",Green:"#27500A",Blue:"#0C447C",TBC:"#6B7280"};
  const QCard=({queen,isLost})=>{
    const hive=hives.find(h=>h.id===queen.hive_id);
    const milestones=getQueenMilestones(queen);
    const isOpen=openId===queen.id;
    return<div style={{background:"#fff",borderRadius:14,border:"0.5px solid #E5E7EB",marginBottom:8,overflow:"hidden",opacity:isLost?0.75:1}}>
      <div onClick={()=>setOpenId(isOpen?null:queen.id)} style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
        <div style={{width:42,height:42,borderRadius:"50%",background:cBg[queen.colour]||"#F9FAFB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:cTx[queen.colour]||"#374151",flexShrink:0}}>Q{queen.number}</div>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:"#111827"}}>Queen #{queen.number}{hive?` · Hive ${hive.number}`:" · Unassigned"}</div><div style={{fontSize:12,color:"#9CA3AF",marginTop:1}}>{queen.colour} · {queen.year} · {queen.origin}</div></div>
        <Badge color={isLost?"gray":"teal"}>{isLost?queen.lost_reason:"Active"}</Badge>
      </div>
      {isOpen&&<div style={{borderTop:"0.5px solid #F3F4F6",padding:"14px 16px"}}>
        {milestones.length>0&&<div style={{borderLeft:`2px solid #9FE1CB`,marginLeft:6,paddingLeft:14,marginBottom:12}}>
          {milestones.map((m,i)=><div key={i} style={{display:"flex",gap:10,padding:"7px 0",position:"relative"}}>
            <div style={{position:"absolute",left:-20,top:11,width:8,height:8,borderRadius:"50%",background:m.confirmed?TEAL_MID:"#D1D5DB",border:"2px solid #F9FAFB"}}/>
            <span style={{fontSize:12,color:"#9CA3AF",minWidth:72,flexShrink:0}}>{formatDate(m.actual||m.date)||"—"}</span>
            <div><div style={{fontSize:14,color:m.confirmed?"#111827":"#9CA3AF"}}>{m.label}</div><span style={{fontSize:11,background:m.confirmed?TEAL_LIGHT:AMBER_LIGHT,color:m.confirmed?"#085041":"#92400E",padding:"2px 8px",borderRadius:99,fontWeight:700,display:"inline-block",marginTop:3}}>{m.confirmed?"Confirmed":"Projected"}</span></div>
          </div>)}
        </div>}
        {queen.notes&&<p style={{fontSize:13,color:"#6B7280",marginBottom:10,lineHeight:1.6}}>{queen.notes}</p>}
        {queen.temper_rating&&<div style={{marginBottom:10}}><Badge>Temperament {queen.temper_rating}/5</Badge></div>}
        <button onClick={()=>onEditQueen(queen)} style={{width:"100%",padding:"10px",background:TEAL_LIGHT,color:"#085041",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
          Edit queen #{queen.number}
        </button>
      </div>}
    </div>;
  };
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <div style={{background:TEAL,padding:"max(env(safe-area-inset-top,0px),12px) 16px 14px",flexShrink:0}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#9FE1CB",fontSize:14,cursor:"pointer",padding:0,marginBottom:8,fontFamily:"inherit"}}>← Back</button>
      <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>Queen register</div>
      <div style={{fontSize:12,color:"#9FE1CB",marginTop:2}}>{active.length} active · {lost.length} historical</div>
    </div>
    <div style={{flex:1,overflowY:"auto",background:GRAY,padding:"14px 12px",WebkitOverflowScrolling:"touch"}}>
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
  return<div style={{height:"100%",display:"flex",flexDirection:"column",background:TEAL}}>
    <div style={{padding:"max(env(safe-area-inset-top,0px),12px) 16px 14px",flexShrink:0}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#9FE1CB",fontSize:14,cursor:"pointer",padding:0,marginBottom:8,fontFamily:"inherit"}}>← Back</button>
      <div style={{fontSize:22,fontWeight:800,color:"#fff",marginBottom:10}}>Apiary safety</div>
      <div style={{display:"flex",gap:8}}>{Object.keys(APIARIES).map(name=><button key={name} onClick={()=>setApiary(name)} style={{padding:"8px 18px",borderRadius:99,background:apiary===name?"#fff":"rgba(255,255,255,0.15)",color:apiary===name?TEAL:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{name}</button>)}</div>
    </div>
    <div style={{flex:1,background:GRAY,borderRadius:"22px 22px 0 0",overflowY:"auto",padding:"16px 12px",WebkitOverflowScrolling:"touch"}}>
      <div style={{background:"#fff",borderRadius:14,border:"0.5px solid #E5E7EB",padding:16,marginBottom:10}}>
        <div style={{fontSize:17,fontWeight:700,color:"#111827",marginBottom:2}}>{a.name}</div>
        <div style={{fontSize:13,color:"#9CA3AF",marginBottom:12}}>{a.address} · {a.landowner}</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:TEAL_LIGHT,color:"#085041",fontSize:14,fontWeight:700,padding:"9px 14px",borderRadius:99}}>📍 {a.w3w}</div>
      </div>
      <div style={{background:"#fff",borderRadius:14,border:"0.5px solid #E5E7EB",padding:16,marginBottom:10,display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:48,height:48,borderRadius:"50%",background:TEAL_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#085041",flexShrink:0}}>{a.emergencyContact.split(" ").map(w=>w[0]).join("")}</div>
        <div><div style={{fontSize:15,fontWeight:700,color:"#111827"}}>{a.emergencyContact}</div><div style={{fontSize:12,color:"#9CA3AF"}}>Emergency contact</div><div style={{fontSize:14,color:TEAL,fontWeight:600,marginTop:3}}>{a.emergencyPhone}</div></div>
      </div>
      <a href={`tel:${a.emergencyPhone}`} style={{textDecoration:"none",display:"block",marginBottom:12}}>
        <div style={{width:"100%",padding:20,background:RED,color:"#fff",borderRadius:14,fontSize:18,fontWeight:800,textAlign:"center"}}>📞 Call {a.emergencyContact}</div>
      </a>
      <SectionLabel>Hives at this apiary</SectionLabel>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {hives.filter(h=>h.apiary_name===apiary).map(h=><div key={h.id} style={{background:"#fff",borderRadius:12,border:"0.5px solid #E5E7EB",padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:TEAL_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#085041"}}>{h.number}</div>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#111827"}}>Hive {h.number}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{h.status}</div></div>
          <div style={{width:9,height:9,borderRadius:"50%",background:h.status==="Active"?TEAL_MID:RED,flexShrink:0}}/>
        </div>)}
      </div>
      <div style={{height:20}}/>
    </div>
  </div>;
}

// ── Inspection History ────────────────────────────────────────────────────────
function InspectionHistory({hive,inspections,onBack,onEdit,onMove}){
  const list=inspections.filter(i=>i.hive_id===hive.id).sort((a,b)=>new Date(b.visit_date)-new Date(a.visit_date));
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <div style={{background:TEAL,padding:"max(env(safe-area-inset-top,0px),12px) 16px 14px",flexShrink:0}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#9FE1CB",fontSize:14,cursor:"pointer",padding:0,marginBottom:8,fontFamily:"inherit"}}>← Back</button>
      <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>Hive {hive.number} — history</div>
      <div style={{fontSize:12,color:"#9FE1CB",marginTop:2}}>{list.length} inspection{list.length!==1?"s":""}</div>
    </div>
    <div style={{flex:1,overflowY:"auto",background:GRAY,padding:"14px 12px",WebkitOverflowScrolling:"touch"}}>
      {list.length===0&&<EmptyHiveState/>}
      {list.map(ins=><div key={ins.id} style={{background:"#fff",borderRadius:14,border:"0.5px solid #E5E7EB",marginBottom:10,overflow:"hidden"}}>
        <div style={{padding:"12px 16px 10px",borderBottom:"0.5px solid #F3F4F6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#111827"}}>{formatDate(ins.visit_date)}</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <Badge color={ins.varroa==="High"?"red":ins.varroa==="Medium"?"amber":"teal"}>{ins.varroa}</Badge>
            {ins.temperament&&<Badge>Temper {ins.temperament}/5</Badge>}
            <button onClick={()=>onEdit(ins)} style={{padding:"5px 10px",background:TEAL_LIGHT,color:"#085041",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
            <button onClick={()=>onMove(ins)} style={{padding:"5px 10px",background:AMBER_LIGHT,color:"#633806",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Move</button>
          </div>
        </div>
        <div style={{padding:"12px 16px"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:ins.notes?10:0}}>
            <Badge>{ins.brood_status}{ins.brood_status==="BIAS"?` ${ins.brood_frames}fr`:""}</Badge>
            <Badge>Stores {ins.stores}</Badge><Badge>Room {ins.room}</Badge>
            <Badge color={ins.health==="OK"?"teal":"red"}>{ins.health}</Badge>
            <Badge>{ins.supers_total} super{ins.supers_total!==1?"s":""}</Badge>
            {ins.feed_given!=="None"&&<Badge color="amber">Fed: {ins.feed_given}</Badge>}
            <Badge color="gray">{ins.weather_condition} {ins.weather_temp}°C</Badge>
          </div>
          {ins.qc_count>0&&<div style={{fontSize:13,color:"#9CA3AF",marginBottom:6}}>QCs: {ins.qc_count} · {ins.qc_action}</div>}
          {ins.notes&&<div style={{fontSize:14,color:"#6B7280",lineHeight:1.6,borderTop:"0.5px solid #F3F4F6",paddingTop:10}}>{ins.notes}</div>}
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
    const statusColor=high.length?RED:med.length?AMBER:TEAL_MID;
    const isHealthy=high.length===0&&med.length===0;
    const[open,setOpen]=useState(high.length>0);
    return<div style={{background:"#fff",borderRadius:14,border:"0.5px solid #E5E7EB",marginBottom:10,overflow:"hidden"}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",borderBottom:open?"0.5px solid #F3F4F6":"none"}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:TEAL_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#085041",flexShrink:0}}>{hive.number}</div>
        <div style={{flex:1}}><div style={{fontSize:16,fontWeight:700,color:"#111827"}}>Hive {hive.number}</div><div style={{fontSize:12,color:"#9CA3AF",marginTop:1}}>{hive.apiary_name} · {last?`Last inspected ${formatDate(last.visit_date)}`:"Never inspected"}</div></div>
        <span style={{fontSize:isHealthy?18:11}}>{isHealthy?"🐝":""}</span>
        {!isHealthy&&<div style={{width:11,height:11,borderRadius:"50%",background:statusColor,flexShrink:0}}/>}
        <span style={{color:"#9CA3AF",fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<>
        {[...high,...med,...low].map((a,i)=><ActionBanner key={i} action={a}/>)}
        {actions.length===0&&last&&<div style={{padding:"10px 16px",display:"flex",flexWrap:"wrap",gap:6}}><Badge>BIAS {last.brood_frames}fr</Badge><Badge>Stores {last.stores}</Badge><Badge>{last.supers_total} super{last.supers_total!==1?"s":""}</Badge><Badge>Temper {last.temperament}/5</Badge></div>}
        <div style={{padding:"10px 16px 14px",display:"flex",gap:8}}>
          <button onClick={()=>onInspect(hive)} style={{flex:1,padding:"13px",background:TEAL,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓ Inspect</button>
          <button onClick={()=>onHistory(hive)} style={{padding:"13px 14px",background:"#F9FAFB",color:"#6B7280",border:"0.5px solid #E5E7EB",borderRadius:10,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>History</button>
          <button onClick={()=>onEditHive(hive)} style={{padding:"13px 14px",background:"#F9FAFB",color:"#6B7280",border:"0.5px solid #E5E7EB",borderRadius:10,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
        </div>
      </>}
    </div>;
  };
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <div style={{background:TEAL,padding:"max(env(safe-area-inset-top,0px),12px) 16px 16px",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <ellipse cx="14" cy="13" rx="5" ry="7" fill="#9FE1CB" opacity="0.9"/>
              <rect x="10.5" y="9" width="7" height="2.5" rx="1.25" fill="#085041"/>
              <rect x="10.5" y="12.5" width="7" height="2" rx="1" fill="#085041"/>
              <rect x="10.5" y="15.5" width="7" height="2" rx="1" fill="#085041"/>
              <ellipse cx="9" cy="11" rx="4" ry="2.5" fill="#fff" opacity="0.45" transform="rotate(-20 9 11)"/>
              <ellipse cx="19" cy="11" rx="4" ry="2.5" fill="#fff" opacity="0.45" transform="rotate(20 19 11)"/>
              <line x1="12" y1="6" x2="10" y2="3" stroke="#9FE1CB" strokeWidth="1" strokeLinecap="round"/>
              <line x1="16" y1="6" x2="18" y2="3" stroke="#9FE1CB" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="10" cy="2.5" r="1" fill="#9FE1CB"/>
              <circle cx="18" cy="2.5" r="1" fill="#9FE1CB"/>
            </svg>
            <div style={{fontSize:28,fontWeight:800,color:"#fff",letterSpacing:"-0.5px"}}>Waggle</div>
          </div>
          <div style={{fontSize:13,color:"#9FE1CB",marginTop:1}}>{new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</div>
        </div>
        <button onClick={onSafety} style={{background:RED,border:"none",borderRadius:10,padding:"10px 14px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>SOS</button>
      </div>
      <div style={{display:"flex",gap:8}}>
        {[["Farm",farmHives.length+" hives"],["Home",homeHives.length+" hives"],["Actions",totalHigh+" urgent"]].map(([label,val])=><div key={label} style={{flex:1,background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"9px 10px"}}><div style={{fontSize:11,color:"#9FE1CB",fontWeight:700}}>{label}</div><div style={{fontSize:17,fontWeight:800,color:"#fff",marginTop:1}}>{val}</div></div>)}
      </div>
    </div>
    <div style={{flex:1,overflowY:"auto",background:GRAY,padding:"14px 12px",WebkitOverflowScrolling:"touch"}}>
      <AllClearBanner hives={hives} inspections={inspections}/>
      <StreakCard inspections={inspections} hives={hives}/>
      <SectionLabel>Farm apiary</SectionLabel>
      {farmHives.map(h=><HiveCard key={h.id} hive={h}/>)}
      <SectionLabel>Home apiary</SectionLabel>
      {homeHives.map(h=><HiveCard key={h.id} hive={h}/>)}
      <div style={{height:8}}/>
    </div>
  </div>;
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────
function TabBar({active,onChange}){
  const tabs=[{id:"home",label:"Home",icon:"⌂"},{id:"queens",label:"Queens",icon:"♛"},{id:"trends",label:"Trends",icon:"↗"},{id:"safety",label:"Safety",icon:"⊕"}];
  return<div style={{display:"flex",background:"#fff",borderTop:"0.5px solid #E5E7EB",flexShrink:0,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
    {tabs.map(t=><button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 0 12px",border:"none",background:"transparent",cursor:"pointer",fontFamily:"inherit"}}>
      <span style={{fontSize:22,color:active===t.id?TEAL:"#9CA3AF"}}>{t.icon}</span>
      <span style={{fontSize:11,color:active===t.id?TEAL:"#9CA3AF",fontWeight:active===t.id?700:400}}>{t.label}</span>
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
    const activeHives=hives.filter(h=>h.status==="Active");
    const checked=new Set(inspections.filter(i=>weekNum(i.visit_date)===w).map(i=>i.hive_id));
    if(activeHives.every(h=>checked.has(h.id)))streak++;else break;
  }

  const handleInspect=hive=>{setSelectedHive(hive);setEditingInspection(null);setScreen("inspect");};
  const handleHistory=hive=>{setSelectedHive(hive);setScreen("history");};
  const handleEdit=ins=>{const hive=hives.find(h=>h.id===ins.hive_id);setSelectedHive(hive);setEditingInspection(ins);setScreen("inspect");};
  const handleMove=ins=>{setMovingInspection(ins);setScreen("move");};
  const handleEditQueen=queen=>{setEditingQueen(queen);setScreen("editqueen");};
  const handleEditHive=hive=>{setEditingHive(hive);setScreen("edithive");};

  const handleSaveInspection=(inspection,supersChange,isEdit,triggersFirstEggs)=>{
    if(isEdit){
      setInspections(prev=>prev.map(i=>i.id===inspection.id?inspection:i));
      setScreen("history");
    }else{
      setInspections(prev=>[inspection,...prev]);
      setHives(prev=>prev.map(h=>h.id===selectedHive.id?{...h,super_count:Math.max(0,h.super_count+supersChange)}:h));
      if(triggersFirstEggs){
        const queen=queens.find(q=>q.hive_id===selectedHive.id&&!q.lost_date);
        setMilestone({hive:selectedHive,queen,inspection});
        setScreen("home");setTab("home");
      }else{
        setCelebrationData({hive:selectedHive,seasonCount,weekCount,streak:streak+1});
        setCelebration("saved");
      }
    }
  };

  const handleMoveInspection=movedIns=>{
    setInspections(prev=>prev.map(i=>i.id===movedIns.id?movedIns:i));
    setMovingInspection(null);
    setScreen("home");setTab("home");
  };

  const handleSaveQueen=updatedQueen=>{
    setQueens(prev=>prev.map(q=>q.id===updatedQueen.id?updatedQueen:q));
    setEditingQueen(null);setScreen("queens");
  };

  const handleSaveHive=updatedHive=>{
    setHives(prev=>prev.map(h=>h.id===updatedHive.id?updatedHive:h));
    setEditingHive(null);setScreen("home");setTab("home");
  };

  const handleTab=t=>{
    setTab(t);
    if(t==="trends"){window.location.href="/trends";return;}
    setScreen(t);
  };
  const handleBack=()=>{
    if(screen==="inspect"&&editingInspection){setScreen("history");return;}
    if(screen==="move"){setMovingInspection(null);setScreen("history");return;}
    if(screen==="editqueen"){setEditingQueen(null);setScreen("queens");return;}
    if(screen==="edithive"){setEditingHive(null);setScreen("home");return;}
    setScreen("home");setTab("home");
  };
  const showTab=["home","queens","trends","safety"].includes(screen);

  if(loading)return<LoadingScreen/>;

  return<div style={{height:"100dvh",display:"flex",flexDirection:"column",background:TEAL,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",WebkitFontSmoothing:"antialiased",position:"relative"}}>
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
