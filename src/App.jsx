import { useState, useEffect } from "react";
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

function FormSection({title,children}){
  return<div style={{background:"#fff",border:"0.5px solid #E5E7EB",borderRadius:14,overflow:"hidden",marginBottom:12}}><div style={{padding:"12px 16px 10px",borderBottom:"0.5px solid #F3F4F6"}}><span style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.07em"}}>{title}</span></div>{children}</div>;
}

function FormRow({label,sublabel,children,last}){
  return<div style={{padding:"14px 16px",borderBottom:last?"none":"0.5px solid #F3F4F6"}}>{label&&<div style={{marginBottom:10}}><span style={{fontSize:14,fontWeight:600,color:"#111827"}}>{label}</span>{sublabel&&<span style={{fontSize:12,color:"#9CA3AF",marginLeft:6}}>{sublabel}</span>}</div>}{children}</div>;
}

function SectionLabel({children}){return<div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10,paddingLeft:2}}>{children}</div>;}

function ActionBanner({action}){
  const map={high:[RED_LIGHT,"#FECACA","#991B1B",RED],medium:[AMBER_LIGHT,"#FDE68A","#92400E",AMBER],low:["#F9FAFB","#E5E7EB","#6B7280","#9CA3AF"]};
  const[bg,border,text,dot]=map[action.priority]||map.low;
  return<div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 16px",background:bg,borderBottom:`0.5px solid ${border}`}}><div style={{width:8,height:8,borderRadius:"50%",background:dot,flexShrink:0,marginTop:4}}/><span style={{fontSize:13,color:text,lineHeight:1.5,flex:1}}>{action.text}</span></div>;
}

function LoadingScreen(){
  return<div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:TEAL}}><div style={{fontSize:32,fontWeight:800,color:"#fff",marginBottom:12}}>Waggle</div><div style={{fontSize:14,color:"#9FE1CB"}}>Loading your hives…</div></div>;
}

// ── Inspection Form (shared for new + edit) ───────────────────────────────────
function InspectionForm({hive,queens,existingInspection,onSave,onBack}){
  const isEdit = !!existingInspection;
  const activeQueen=queens.find(q=>q.hive_id===hive.id&&!q.lost_date);
  const defaults = isEdit ? {
    visit_date: existingInspection.visit_date,
    visit_time: existingInspection.visit_time || nowTimeStr(),
    queen_seen: existingInspection.queen_seen || "",
    queen_number: existingInspection.queen_number || "",
    queen_colour: existingInspection.queen_colour || "",
    qc_count: existingInspection.qc_count || 0,
    qc_action: existingInspection.qc_action || "None seen",
    qc_note: existingInspection.qc_note || "",
    brood_status: existingInspection.brood_status || "BIAS",
    brood_frames: existingInspection.brood_frames || 3,
    stores: existingInspection.stores || 5,
    room: existingInspection.room || 4,
    health: existingInspection.health || "OK",
    health_note: existingInspection.health_note || "",
    varroa: existingInspection.varroa || "Not checked",
    temperament: existingInspection.temperament || null,
    feed_given: existingInspection.feed_given || "None",
    feed_qty: existingInspection.feed_qty || "",
    supers_change: existingInspection.supers_change || 0,
    weather_condition: existingInspection.weather_condition || "Sun",
    weather_temp: existingInspection.weather_temp || 16,
    qe: existingInspection.qe ?? hive.qe,
    crown_board: existingInspection.crown_board ?? hive.crown_board,
    porter_escapes: existingInspection.porter_escapes ?? hive.porter_escapes,
    entrance_reducer: existingInspection.entrance_reducer ?? hive.entrance_reducer,
    mouse_guard: existingInspection.mouse_guard ?? hive.mouse_guard,
    insulation: existingInspection.insulation ?? hive.insulation,
    notes: existingInspection.notes || "",
  } : {
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

  const [form,setForm]=useState(defaults);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const supersTotal=Math.max(0,hive.super_count+(isEdit?0:form.supers_change));
  const [saving,setSaving]=useState(false);

  const handleSave=async()=>{
    setSaving(true);
    if(isEdit){
      const{error}=await supabase.from("inspections").update({...form}).eq("id",existingInspection.id);
      if(error){alert("Error updating: "+error.message);}
      else{onSave({...existingInspection,...form},0,true);}
    }else{
      const record={hive_id:hive.id,...form,supers_total:supersTotal};
      const{error}=await supabase.from("inspections").insert([record]);
      if(!error){
        await supabase.from("hives").update({super_count:supersTotal}).eq("id",hive.id);
        onSave(record,form.supers_change,false);
      }else{alert("Error saving: "+error.message);}
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
function QueenRegister({queens,hives,onBack}){
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
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:"#111827"}}>Queen #{queen.number}{hive?` · Hive ${hive.number}`:""}</div><div style={{fontSize:12,color:"#9CA3AF",marginTop:1}}>{queen.colour} · {queen.year} · {queen.origin}</div></div>
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
      <SectionLabel>Active queens</SectionLabel>
      {active.map(q=><QCard key={q.id} queen={q}/>)}
      <SectionLabel>Historical</SectionLabel>
      {lost.map(q=><QCard key={q.id} queen={q} isLost/>)}
      <div style={{height:8}}/>
    </div>
  </div>;
}

// ── Safety Screen ─────────────────────────────────────────────────────────────
function SafetyScreen({hives,onBack}){
  const[apiary,setApiary]=useState("Farm");
  const a=APIARIES[apiary];
  const apiaryHives=hives.filter(h=>h.apiary_name===apiary);
  return<div style={{height:"100%",display:"flex",flexDirection:"column",background:TEAL}}>
    <div style={{padding:"max(env(safe-area-inset-top,0px),12px) 16px 14px",flexShrink:0}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#9FE1CB",fontSize:14,cursor:"pointer",padding:0,marginBottom:8,fontFamily:"inherit"}}>← Back</button>
      <div style={{fontSize:22,fontWeight:800,color:"#fff",marginBottom:10}}>Apiary safety</div>
      <div style={{display:"flex",gap:8}}>{Object.keys(APIARIES).map(name=><button key={name} onClick={()=>setApiary(name)} style={{padding:"8px 18px",borderRadius:99,background:apiary===name?"#fff":"rgba(255,255,255,0.15)",color:apiary===name?TEAL:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{name}</button>)}</div>
    </div>
    <div style={{flex:1,background:GRAY,borderRadius:"22px 22px 0 0",overflowY:"auto",padding:"16px 12px",WebkitOverflowScrolling:"touch"}}>
      <div style={{background:"#fff",borderRadius:14,border:"0.5px solid #E5E7EB",padding:16,marginBottom:10}}>
        <div style={{fontSize:17,fontWeight:700,color:"#111827",marginBottom:2}}>{a.name}</div>
        <div style={{fontSize:13,color:"#9CA3AF",marginBottom:12}}>{a.address}{a.landowner?` · ${a.landowner}`:""}</div>
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
        {apiaryHives.map(h=><div key={h.id} style={{background:"#fff",borderRadius:12,border:"0.5px solid #E5E7EB",padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:TEAL_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#085041"}}>{h.number}</div>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#111827"}}>Hive {h.number}</div><div style={{fontSize:11,color:"#9CA3AF"}}>{h.status}</div></div>
          <div style={{width:9,height:9,borderRadius:"50%",background:h.status==="Active"?TEAL_MID:RED,flexShrink:0}}/>
        </div>)}
      </div>
      <div style={{height:20}}/>
    </div>
  </div>;
}

// ── Inspection History (with Edit button) ─────────────────────────────────────
function InspectionHistory({hive,inspections,onBack,onEdit}){
  const list=inspections.filter(i=>i.hive_id===hive.id).sort((a,b)=>new Date(b.visit_date)-new Date(a.visit_date));
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <div style={{background:TEAL,padding:"max(env(safe-area-inset-top,0px),12px) 16px 14px",flexShrink:0}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#9FE1CB",fontSize:14,cursor:"pointer",padding:0,marginBottom:8,fontFamily:"inherit"}}>← Back</button>
      <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>Hive {hive.number} — history</div>
      <div style={{fontSize:12,color:"#9FE1CB",marginTop:2}}>{list.length} inspection{list.length!==1?"s":""}</div>
    </div>
    <div style={{flex:1,overflowY:"auto",background:GRAY,padding:"14px 12px",WebkitOverflowScrolling:"touch"}}>
      {list.length===0&&<div style={{textAlign:"center",color:"#9CA3AF",padding:"48px 20px",fontSize:15}}>No inspections recorded yet.</div>}
      {list.map(ins=><div key={ins.id} style={{background:"#fff",borderRadius:14,border:"0.5px solid #E5E7EB",marginBottom:10,overflow:"hidden"}}>
        <div style={{padding:"12px 16px 10px",borderBottom:"0.5px solid #F3F4F6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#111827"}}>{formatDate(ins.visit_date)}</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Badge color={ins.varroa==="High"?"red":ins.varroa==="Medium"?"amber":"teal"}>{ins.varroa}</Badge>
            {ins.temperament&&<Badge>Temper {ins.temperament}/5</Badge>}
            <button onClick={()=>onEdit(ins)} style={{padding:"5px 12px",background:TEAL_LIGHT,color:"#085041",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
          </div>
        </div>
        <div style={{padding:"12px 16px"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:ins.notes?10:0}}>
            <Badge>{ins.brood_status}{ins.brood_status==="BIAS"?` ${ins.brood_frames}fr`:""}</Badge>
            <Badge>Stores {ins.stores}</Badge>
            <Badge>Room {ins.room}</Badge>
            <Badge color={ins.health==="OK"?"teal":"red"}>{ins.health}</Badge>
            <Badge>{ins.supers_total} super{ins.supers_total!==1?"s":""}</Badge>
            {ins.feed_given!=="None"&&<Badge color="amber">Fed: {ins.feed_given}</Badge>}
            <Badge color="gray">{ins.weather_condition} {ins.weather_temp}°C</Badge>
          </div>
          {ins.qc_count>0&&<div style={{fontSize:13,color:"#9CA3AF",marginBottom:6}}>QCs: {ins.qc_count} seen · {ins.qc_action}{ins.qc_note?` · ${ins.qc_note}`:""}</div>}
          {ins.notes&&<div style={{fontSize:14,color:"#6B7280",lineHeight:1.6,borderTop:"0.5px solid #F3F4F6",paddingTop:10}}>{ins.notes}</div>}
        </div>
      </div>)}
      <div style={{height:8}}/>
    </div>
  </div>;
}

// ── Home Screen ───────────────────────────────────────────────────────────────
function HomeScreen({hives,inspections,queens,onInspect,onSafety,onHistory}){
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
    const[open,setOpen]=useState(high.length>0);
    return<div style={{background:"#fff",borderRadius:14,border:"0.5px solid #E5E7EB",marginBottom:10,overflow:"hidden"}}>
      <div onClick={()=>setOpen(!open)} style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",borderBottom:open?"0.5px solid #F3F4F6":"none"}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:TEAL_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#085041",flexShrink:0}}>{hive.number}</div>
        <div style={{flex:1}}><div style={{fontSize:16,fontWeight:700,color:"#111827"}}>Hive {hive.number}</div><div style={{fontSize:12,color:"#9CA3AF",marginTop:1}}>{hive.apiary_name} · {last?`Last inspected ${formatDate(last.visit_date)}`:"Never inspected"}</div></div>
        <div style={{width:11,height:11,borderRadius:"50%",background:statusColor,flexShrink:0}}/>
        <span style={{color:"#9CA3AF",fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<>
        {[...high,...med,...low].map((a,i)=><ActionBanner key={i} action={a}/>)}
        {actions.length===0&&last&&<div style={{padding:"10px 16px",display:"flex",flexWrap:"wrap",gap:6}}><Badge>BIAS {last.brood_frames}fr</Badge><Badge>Stores {last.stores}</Badge><Badge>{last.supers_total} super{last.supers_total!==1?"s":""}</Badge><Badge>Temper {last.temperament}/5</Badge></div>}
        <div style={{padding:"10px 16px 14px",display:"flex",gap:8}}>
          <button onClick={()=>onInspect(hive)} style={{flex:1,padding:"13px",background:TEAL,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓ Inspect</button>
          <button onClick={()=>onHistory(hive)} style={{padding:"13px 16px",background:"#F9FAFB",color:"#6B7280",border:"0.5px solid #E5E7EB",borderRadius:10,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>History</button>
        </div>
      </>}
    </div>;
  };
  return<div style={{height:"100%",display:"flex",flexDirection:"column"}}>
    <div style={{background:TEAL,padding:"max(env(safe-area-inset-top,0px),12px) 16px 16px",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
        <div><div style={{fontSize:28,fontWeight:800,color:"#fff",letterSpacing:"-0.5px"}}>Waggle</div><div style={{fontSize:13,color:"#9FE1CB",marginTop:1}}>{new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</div></div>
        <button onClick={onSafety} style={{background:RED,border:"none",borderRadius:10,padding:"10px 14px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>SOS</button>
      </div>
      <div style={{display:"flex",gap:8}}>
        {[["Farm",farmHives.length+" hives"],["Home",homeHives.length+" hives"],["Actions",totalHigh+" urgent"]].map(([label,val])=><div key={label} style={{flex:1,background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"9px 10px"}}><div style={{fontSize:11,color:"#9FE1CB",fontWeight:700}}>{label}</div><div style={{fontSize:17,fontWeight:800,color:"#fff",marginTop:1}}>{val}</div></div>)}
      </div>
    </div>
    <div style={{flex:1,overflowY:"auto",background:GRAY,padding:"14px 12px",WebkitOverflowScrolling:"touch"}}>
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
  const[toast,setToast]=useState(null);

  useEffect(()=>{
    async function loadData(){
      const[{data:hivesData},{data:queensData},{data:inspectionsData}]=await Promise.all([
        supabase.from("hives").select("*").order("number"),
        supabase.from("queens").select("*").order("number"),
        supabase.from("inspections").select("*").order("visit_date",{ascending:false}),
      ]);
      setHives(hivesData||[]);
      setQueens(queensData||[]);
      setInspections(inspectionsData||[]);
      setLoading(false);
    }
    loadData();
  },[]);

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),2500);};

  const handleInspect=hive=>{setSelectedHive(hive);setEditingInspection(null);setScreen("inspect");};
  const handleHistory=hive=>{setSelectedHive(hive);setScreen("history");};
  const handleEdit=inspection=>{
    const hive=hives.find(h=>h.id===inspection.hive_id);
    setSelectedHive(hive);
    setEditingInspection(inspection);
    setScreen("inspect");
  };

  const handleSaveInspection=(inspection,supersChange,isEdit)=>{
    if(isEdit){
      setInspections(prev=>prev.map(i=>i.id===inspection.id?inspection:i));
      showToast("Inspection updated ✓");
      setScreen("history");
    }else{
      setInspections(prev=>[inspection,...prev]);
      setHives(prev=>prev.map(h=>h.id===selectedHive.id?{...h,super_count:Math.max(0,h.super_count+supersChange)}:h));
      showToast(`Hive ${selectedHive.number} inspection saved ✓`);
      setScreen("home");setTab("home");
    }
  };

  const handleTab=t=>{
    setTab(t);
    if(t==="trends"){window.location.href="/trends";return;}
    setScreen(t);
  };
  const handleBack=()=>{
    if(screen==="inspect"&&editingInspection){setScreen("history");return;}
    setScreen("home");setTab("home");
  };
  const showTab=["home","queens","trends","safety"].includes(screen);

  if(loading)return<LoadingScreen/>;

  return<div style={{height:"100dvh",display:"flex",flexDirection:"column",background:TEAL,fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",WebkitFontSmoothing:"antialiased",position:"relative"}}>
    <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
      {screen==="home"&&<HomeScreen hives={hives} inspections={inspections} queens={queens} onInspect={handleInspect} onSafety={()=>{setScreen("safety");setTab("safety");}} onHistory={handleHistory}/>}
      {screen==="inspect"&&selectedHive&&<InspectionForm hive={selectedHive} queens={queens} existingInspection={editingInspection} onSave={handleSaveInspection} onBack={handleBack}/>}
      {screen==="queens"&&<QueenRegister queens={queens} hives={hives} onBack={handleBack}/>}
      {screen==="safety"&&<SafetyScreen hives={hives} onBack={handleBack}/>}
      {screen==="history"&&selectedHive&&<InspectionHistory hive={selectedHive} inspections={inspections} onBack={handleBack} onEdit={handleEdit}/>}
    </div>
    {showTab&&<TabBar active={tab} onChange={handleTab}/>}
    {toast&&<div style={{position:"absolute",bottom:90,left:"50%",transform:"translateX(-50%)",background:"#111827",color:"#fff",padding:"12px 20px",borderRadius:99,fontSize:14,fontWeight:700,whiteSpace:"nowrap",zIndex:999}}>{toast}</div>}
  </div>;
}
