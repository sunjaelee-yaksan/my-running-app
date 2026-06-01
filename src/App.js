import React, { useState } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
  ReferenceLine,
} from "recharts";
import * as XLSX from "xlsx";

// ── 초기 데이터 (완전히 빈 상태) ─────────────────────────────────
const INIT_STUDENTS = [];
const INIT_RUNS = {};

// ── 색상 ─────────────────────────────────────────────────────────
const C = {
  neon: "#00FF87", neonDim: "#00CC6A", accent: "#FF6B35",
  blue: "#00B4D8", purple: "#9B59FF", red: "#FF4D6D", gold: "#FFB703", teal: "#4CC9F0",
  bg: "#0A0F0D", card: "#111816", cardBorder: "#1E2E28",
  text: "#E8F5F0", muted: "#5A7A70",
};

const METRIC_CONFIG = {
  avgSpeed:  { label: "평균 속도",   unit: "km/h",  color: C.neon,   icon: "⚡", goodUp: true },
  distance:  { label: "거리",        unit: "km",    color: C.blue,   icon: "📍", goodUp: true },
  cadence:   { label: "케이던스",    unit: "spm",   color: C.purple, icon: "👣", goodUp: true },
  avgPace:   { label: "평균 페이스", unit: "'/km",  color: C.accent, icon: "⏱", goodUp: false },
  heartRate: { label: "심박수",      unit: "bpm",   color: C.red,    icon: "❤️", goodUp: false },
  calories:  { label: "칼로리",      unit: "kcal",  color: C.gold,   icon: "🔥", goodUp: true },
  stride:    { label: "보폭",        unit: "m",     color: C.teal,   icon: "📐", goodUp: true },
};

const MOOD_OPTIONS = ["😊", "😤", "🔥", "😴", "💪", "😅", "🙂", "😢"];
const FEEDBACK_TAGS = ["우수", "잘함", "노력중", "개선필요", "부상주의", "칭찬"];
const TAG_COLORS = { "우수": C.neon, "잘함": C.blue, "노력중": C.gold, "개선필요": C.accent, "부상주의": C.red, "칭찬": C.purple };
const AVATAR_OPTIONS = ["🏃", "🏃‍♀️", "🧑‍🎓", "👨‍🎓", "👩‍🎓", "🙋", "🙋‍♂️", "⭐"];

const avg = (arr, key) => arr.length ? arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length : 0;
const fmt = (v, d = 2) => typeof v === "number" ? v.toFixed(d) : "-";

// ── 달력 ─────────────────────────────────────────────────────────
const CalendarPicker = ({ value, onChange }) => {
  const today = new Date();
  const init = value ? new Date(value + "T00:00:00") : today;
  const [viewYear, setViewYear] = useState(init.getFullYear());
  const [viewMonth, setViewMonth] = useState(init.getMonth());
  const [open, setOpen] = useState(false);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const select = (day) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };
  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); };
  const displayVal = value ? `${value.slice(0,4)}년 ${parseInt(value.slice(5,7))}월 ${parseInt(value.slice(8,10))}일` : "날짜 선택";
  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width:"100%", padding:"10px 14px", background:"#0D1A15", border:`1px solid ${open ? C.neon : C.cardBorder}`, borderRadius:10, color: value ? C.text : C.muted, fontSize:13, textAlign:"left", cursor:"pointer", fontFamily:"'Space Mono',monospace", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span>📅 {displayVal}</span><span style={{ color:C.muted }}>▼</span>
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"#0D1A15", border:`1px solid ${C.neon}55`, borderRadius:14, padding:14, zIndex:999, boxShadow:"0 8px 32px #00000088" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <button onClick={prevMonth} style={{ background:"none", border:"none", color:C.neon, fontSize:20, cursor:"pointer" }}>‹</button>
            <span style={{ fontWeight:700, fontSize:14, color:C.text }}>{viewYear}년 {viewMonth+1}월</span>
            <button onClick={nextMonth} style={{ background:"none", border:"none", color:C.neon, fontSize:20, cursor:"pointer" }}>›</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
            {["일","월","화","수","목","금","토"].map((d,i) => (
              <div key={d} style={{ textAlign:"center", fontSize:11, color: i===0?C.red:i===6?C.blue:C.muted, padding:"4px 0" }}>{d}</div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
            {Array(firstDay).fill(null).map((_,i) => <div key={`e${i}`}/>)}
            {Array(daysInMonth).fill(null).map((_,i) => {
              const day = i + 1;
              const mm = String(viewMonth+1).padStart(2,"0"), dd = String(day).padStart(2,"0");
              const dateStr = `${viewYear}-${mm}-${dd}`;
              const isSelected = value === dateStr, isToday = todayStr === dateStr;
              const col = (firstDay + i) % 7;
              return (
                <button key={day} onClick={() => select(day)} style={{ padding:"6px 0", borderRadius:8, border:"none", background: isSelected?C.neon:isToday?`${C.neon}22`:"transparent", color: isSelected?"#0A0F0D":col===0?C.red:col===6?C.blue:C.text, fontWeight: isSelected?800:400, fontSize:12, cursor:"pointer" }}>{day}</button>
              );
            })}
          </div>
          <button onClick={() => { onChange(todayStr); setOpen(false); }} style={{ marginTop:10, width:"100%", padding:"7px", background:`${C.neon}18`, border:`1px solid ${C.neon}44`, borderRadius:8, color:C.neon, fontSize:12, fontWeight:700, cursor:"pointer" }}>오늘 선택</button>
        </div>
      )}
    </div>
  );
};

// ── 학생 관리 모달 ────────────────────────────────────────────────
const StudentManagerModal = ({ students, onClose, onSave }) => {
  const [list, setList] = useState(students.map(s => ({ ...s })));
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({ name:"", grade:"", avatar:"🏃" });
  const [addMode, setAddMode] = useState(false);
  const [newStudent, setNewStudent] = useState({ name:"", grade:"", avatar:"🏃" });
  const [confirmDel, setConfirmDel] = useState(null);

  const startEdit = (s) => { setEditId(s.id); setDraft({ name:s.name, grade:s.grade, avatar:s.avatar }); setAddMode(false); };
  const saveEdit = () => {
    if (!draft.name.trim() || !draft.grade.trim()) return;
    setList(prev => prev.map(s => s.id === editId ? { ...s, ...draft } : s));
    setEditId(null);
  };
  const deleteStudent = (id) => { setList(prev => prev.filter(s => s.id !== id)); setConfirmDel(null); };
  const addStudent = () => {
    if (!newStudent.name.trim() || !newStudent.grade.trim()) return;
    const newId = Math.max(0, ...list.map(s => s.id)) + 1;
    setList(prev => [...prev, { id: newId, ...newStudent }]);
    setNewStudent({ name:"", grade:"", avatar:"🏃" });
    setAddMode(false);
  };

  const iSt = { background:"#0D1A15", border:`1px solid ${C.cardBorder}`, color:C.text, borderRadius:8, padding:"8px 12px", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box" };
  const AvatarRow = ({ val, setVal }) => (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
      {AVATAR_OPTIONS.map(av => (
        <button key={av} onClick={() => setVal(av)} style={{ fontSize:22, background: val===av?`${C.neon}22`:"none", border:`2px solid ${val===av?C.neon:"transparent"}`, borderRadius:8, padding:4, cursor:"pointer" }}>{av}</button>
      ))}
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"#000000BB", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:20, width:"100%", maxWidth:480, maxHeight:"85vh", overflow:"auto", padding:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontWeight:900, fontSize:16 }}>👥 학생 관리</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:22, cursor:"pointer" }}>✕</button>
        </div>

        {list.length === 0 && (
          <div style={{ textAlign:"center", padding:"20px 0", color:C.muted, fontSize:13 }}>등록된 학생이 없습니다.<br/>아래 버튼으로 추가해 주세요.</div>
        )}

        {list.map(s => (
          <div key={s.id} style={{ background:C.bg, borderRadius:12, padding:"12px 14px", marginBottom:8, border:`1px solid ${editId===s.id?C.neon:C.cardBorder}` }}>
            {editId === s.id ? (
              <div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>아바타</div>
                <AvatarRow val={draft.avatar} setVal={v => setDraft(d => ({ ...d, avatar:v }))}/>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                  <div><div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>이름</div><input value={draft.name} onChange={e => setDraft(d => ({ ...d, name:e.target.value }))} style={iSt} placeholder="이름 입력"/></div>
                  <div><div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>반</div><input value={draft.grade} onChange={e => setDraft(d => ({ ...d, grade:e.target.value }))} style={iSt} placeholder="예: 2-1"/></div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={saveEdit} style={{ flex:1, padding:"8px", background:C.neon, border:"none", borderRadius:8, color:"#0A0F0D", fontWeight:800, fontSize:13, cursor:"pointer" }}>저장</button>
                  <button onClick={() => setEditId(null)} style={{ padding:"8px 14px", background:"transparent", border:`1px solid ${C.cardBorder}`, borderRadius:8, color:C.muted, fontSize:13, cursor:"pointer" }}>취소</button>
                </div>
              </div>
            ) : confirmDel === s.id ? (
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:13, marginBottom:12 }}><span style={{ color:C.red }}>⚠️</span> <b>{s.name}</b> 학생의 모든 기록이 삭제됩니다. 삭제할까요?</div>
                <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                  <button onClick={() => deleteStudent(s.id)} style={{ padding:"8px 20px", background:C.red, border:"none", borderRadius:8, color:C.text, fontWeight:800, fontSize:13, cursor:"pointer" }}>삭제</button>
                  <button onClick={() => setConfirmDel(null)} style={{ padding:"8px 20px", background:"transparent", border:`1px solid ${C.cardBorder}`, borderRadius:8, color:C.muted, fontSize:13, cursor:"pointer" }}>취소</button>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:24 }}>{s.avatar}</span>
                <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14 }}>{s.name}</div><div style={{ fontSize:11, color:C.muted }}>{s.grade}</div></div>
                <button onClick={() => startEdit(s)} style={{ padding:"6px 12px", background:`${C.blue}22`, border:`1px solid ${C.blue}44`, borderRadius:8, color:C.blue, fontSize:12, fontWeight:700, cursor:"pointer" }}>수정</button>
                <button onClick={() => setConfirmDel(s.id)} style={{ padding:"6px 12px", background:`${C.red}22`, border:`1px solid ${C.red}44`, borderRadius:8, color:C.red, fontSize:12, fontWeight:700, cursor:"pointer" }}>삭제</button>
              </div>
            )}
          </div>
        ))}

        {addMode ? (
          <div style={{ background:`${C.neon}08`, border:`1px solid ${C.neon}44`, borderRadius:12, padding:14, marginTop:8 }}>
            <div style={{ fontSize:12, color:C.neon, fontWeight:700, marginBottom:10 }}>➕ 새 학생 추가</div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>아바타 선택</div>
            <AvatarRow val={newStudent.avatar} setVal={v => setNewStudent(d => ({ ...d, avatar:v }))}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
              <div><div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>이름 *</div><input value={newStudent.name} onChange={e => setNewStudent(d => ({ ...d, name:e.target.value }))} style={iSt} placeholder="이름 입력"/></div>
              <div><div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>반 *</div><input value={newStudent.grade} onChange={e => setNewStudent(d => ({ ...d, grade:e.target.value }))} style={iSt} placeholder="예: 2-1"/></div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={addStudent} style={{ flex:1, padding:"9px", background:C.neon, border:"none", borderRadius:8, color:"#0A0F0D", fontWeight:800, fontSize:13, cursor:"pointer" }}>추가</button>
              <button onClick={() => setAddMode(false)} style={{ padding:"9px 14px", background:"transparent", border:`1px solid ${C.cardBorder}`, borderRadius:8, color:C.muted, fontSize:13, cursor:"pointer" }}>취소</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setAddMode(true); setEditId(null); }} style={{ width:"100%", marginTop:8, padding:"12px", background:"transparent", border:`2px dashed ${C.neon}55`, borderRadius:12, color:C.neon, fontWeight:700, fontSize:13, cursor:"pointer" }}>
            ➕ 학생 추가하기
          </button>
        )}

        <button onClick={() => onSave(list)} style={{ width:"100%", marginTop:16, padding:"14px", background:C.neon, border:"none", borderRadius:12, color:"#0A0F0D", fontWeight:800, fontSize:15, cursor:"pointer" }}>
          💾 변경사항 저장
        </button>
      </div>
    </div>
  );
};

// ── 공통 컴포넌트 ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0D1A15", border:`1px solid ${C.cardBorder}`, borderRadius:12, padding:"10px 14px", fontSize:12 }}>
      <p style={{ color:C.muted, marginBottom:4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color:p.color||p.stroke, fontWeight:700 }}>{p.name}: {p.value} {METRIC_CONFIG[p.dataKey]?.unit||""}</p>)}
    </div>
  );
};

const StatCard = ({ metricKey, latest, delta, goal }) => {
  const cfg = METRIC_CONFIG[metricKey];
  const up = delta >= 0;
  const positive = cfg.goodUp ? up : !up;
  const progress = goal ? Math.min(100, (latest / goal) * 100) : null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:16, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-16, right:-16, fontSize:64, opacity:0.04 }}>{cfg.icon}</div>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:10, color:C.muted, letterSpacing:1, textTransform:"uppercase" }}>{cfg.label}</span>
        <span style={{ fontSize:11, color:cfg.color }}>{cfg.icon}</span>
      </div>
      <div style={{ marginTop:8, fontSize:26, fontWeight:800, color:C.text, fontFamily:"'Space Mono',monospace" }}>
        {latest}<span style={{ fontSize:12, fontWeight:400, color:C.muted, marginLeft:3 }}>{cfg.unit}</span>
      </div>
      <div style={{ marginTop:4, fontSize:11, color: positive?C.neon:C.red }}>
        {up?"▲":"▼"} {Math.abs(delta).toFixed(2)} {cfg.unit} (전주 대비)
      </div>
      {progress !== null && (
        <div style={{ marginTop:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.muted, marginBottom:4 }}>
            <span>목표 달성률</span><span style={{ color: progress>=100?C.neon:C.gold }}>{progress.toFixed(0)}%</span>
          </div>
          <div style={{ height:4, background:C.cardBorder, borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progress}%`, background: progress>=100?C.neon:cfg.color, borderRadius:4, transition:"width .4s" }}/>
          </div>
          <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>목표: {goal} {cfg.unit}</div>
        </div>
      )}
    </div>
  );
};

const StarRating = ({ value, onChange, readonly=false }) => (
  <div style={{ display:"flex", gap:4 }}>
    {[1,2,3,4,5].map(n => <span key={n} onClick={() => !readonly && onChange(n)} style={{ fontSize:20, cursor:readonly?"default":"pointer", color: n<=value?C.gold:C.cardBorder }}>★</span>)}
  </div>
);

// ── 메인 ─────────────────────────────────────────────────────────
export default function RunTracker() {
  const [tab, setTab] = useState("dashboard");
  const [students, setStudents] = useState(INIT_STUDENTS);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [activeMetric, setActiveMetric] = useState("avgSpeed");
  const [rankMetric, setRankMetric] = useState("avgSpeed");
  const [rankScope, setRankScope] = useState("latest");
  const [compareStudentIds, setCompareStudentIds] = useState([]);
  const [compareMetric, setCompareMetric] = useState("avgSpeed");
  const [records, setRecords] = useState(INIT_RUNS);
  const [saved, setSaved] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const [showStudentManager, setShowStudentManager] = useState(false);

  const [goals, setGoals] = useState({ distance:4.0, avgPace:6.0, avgSpeed:10.0, cadence:175, heartRate:160, calories:300, stride:1.2 });
  const [goalEditing, setGoalEditing] = useState(false);
  const [goalDraft, setGoalDraft] = useState({ ...goals });

  const [reflections, setReflections] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [reflForm, setReflForm] = useState({ text:"", mood:"😊", effort:3 });
  const [reflTarget, setReflTarget] = useState(null);
  const [reflSaved, setReflSaved] = useState(false);
  const [fbForm, setFbForm] = useState({ text:"", stars:4, tag:"잘함" });
  const [fbTarget, setFbTarget] = useState(null);
  const [fbSaved, setFbSaved] = useState(false);

  const [form, setForm] = useState({ date:new Date().toISOString().slice(0,10), distance:"", avgPace:"", avgSpeed:"", cadence:"", heartRate:"", calories:"", duration:"", stride:"" });

  // 현재 선택된 학생 객체 (null 안전)
  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0] || null;
  const studentRuns = selectedStudent ? (records[selectedStudent.id] || []) : [];
  const latestRun = studentRuns[studentRuns.length - 1] || null;
  const prevRun = studentRuns[studentRuns.length - 2] || null;

  // 학생 저장
  const handleSaveStudents = (newList) => {
    setStudents(newList);
    if (newList.length > 0) {
      const stillExists = newList.find(s => s.id === selectedStudentId);
      setSelectedStudentId(stillExists ? stillExists.id : newList[0].id);
    } else {
      setSelectedStudentId(null);
    }
    setShowStudentManager(false);
  };

  const classStats = () => {
    const byGrade = {};
    students.forEach(s => {
      const runs = records[s.id] || [];
      if (!byGrade[s.grade]) byGrade[s.grade] = [];
      byGrade[s.grade].push({ s, runs });
    });
    return Object.entries(byGrade).map(([grade, items]) => {
      const row = { grade, studentCount: items.length };
      Object.keys(METRIC_CONFIG).forEach(k => {
        const vals = items.flatMap(({runs}) => runs.map(r => r[k]||0));
        row[k] = vals.length ? parseFloat((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2)) : 0;
      });
      row.totalDistance = items.reduce((sum,{runs}) => sum + runs.reduce((a,r)=>a+(r.distance||0),0),0).toFixed(1);
      return row;
    });
  };

  const getRanking = (metricKey, scope) => {
    const cfg = METRIC_CONFIG[metricKey];
    return [...students].map(s => {
      const runs = records[s.id] || [];
      const val = scope==="latest" ? (runs.slice(-1)[0]?.[metricKey]??0) : (runs.length ? parseFloat(avg(runs,metricKey).toFixed(2)) : 0);
      return { ...s, val, sessions:runs.length };
    }).sort((a,b) => cfg.goodUp ? b.val-a.val : a.val-b.val);
  };

  const saveReflection = () => {
    if (!reflTarget || !reflForm.text.trim()) return;
    setReflections(prev => ({ ...prev, [`${reflTarget.sid}-${reflTarget.date}`]: { ...reflForm } }));
    setReflSaved(true); setTimeout(() => { setReflSaved(false); setReflTarget(null); }, 1800);
  };
  const saveFeedback = () => {
    if (!fbTarget || !fbForm.text.trim()) return;
    setFeedbacks(prev => ({ ...prev, [`${fbTarget.sid}-${fbTarget.date}`]: { ...fbForm } }));
    setFbSaved(true); setTimeout(() => { setFbSaved(false); setFbTarget(null); }, 1800);
  };

  const exportExcel = (mode) => {
    if (!selectedStudent && mode==="student") return;
    const wb = XLSX.utils.book_new();
    const hdr = ["날짜","거리(km)","평균속도(km/h)","페이스('/km)","케이던스(spm)","심박(bpm)","칼로리(kcal)","시간(분)","보폭(m)","소감","무드","노력도","피드백","별점","태그"];
    const toRow = (r, sid) => { const k=`${sid}-${r.date}`,rf=reflections[k],fb=feedbacks[k]; return [r.date,r.distance,r.avgSpeed,r.avgPace,r.cadence,r.heartRate,r.calories,r.duration,r.stride,rf?.text||"",rf?.mood||"",rf?.effort||"",fb?.text||"",fb?.stars||"",fb?.tag||""]; };
    if (mode==="student") {
      const ws=XLSX.utils.aoa_to_sheet([hdr,...studentRuns.map(r=>toRow(r,selectedStudent.id))]);
      ws["!cols"]=hdr.map(()=>({wch:14})); XLSX.utils.book_append_sheet(wb,ws,`${selectedStudent.name} 기록`);
    } else {
      students.forEach(s => { const runs=records[s.id]||[]; const ws=XLSX.utils.aoa_to_sheet([hdr,...runs.map(r=>toRow(r,s.id))]); ws["!cols"]=hdr.map(()=>({wch:14})); XLSX.utils.book_append_sheet(wb,ws,s.name); });
    }
    const fname=mode==="student"?`러닝기록_${selectedStudent.name}.xlsx`:"러닝기록_전체학생.xlsx";
    XLSX.writeFile(wb,fname);
    setExportNotice(`📥 "${fname}" 다운로드 완료!`); setTimeout(()=>setExportNotice(""),3000);
  };

  const handleSave = () => {
    if (!selectedStudent) return;
    const newRun = { date:form.date, label:"기록", distance:parseFloat(form.distance)||0, avgPace:parseFloat(form.avgPace)||0, avgSpeed:parseFloat(form.avgSpeed)||0, cadence:parseInt(form.cadence)||0, heartRate:parseInt(form.heartRate)||0, calories:parseInt(form.calories)||0, duration:parseInt(form.duration)||0, stride:parseFloat(form.stride)||0 };
    setRecords(prev => ({ ...prev, [selectedStudent.id]: [...(prev[selectedStudent.id]||[]), newRun] }));
    setSaved(true); setTimeout(()=>setSaved(false),2500);
    setForm(f => ({ ...f, distance:"", avgPace:"", avgSpeed:"", cadence:"", heartRate:"", calories:"", duration:"", stride:"" }));
  };

  // 스타일 헬퍼
  const IS = { background:"#0D1A15", border:`1px solid ${C.cardBorder}`, color:C.text, borderRadius:10, padding:"10px 14px", fontSize:13, width:"100%", outline:"none", fontFamily:"'Space Mono',monospace", boxSizing:"border-box" };
  const Card = ({ children, extra={} }) => <div style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:20, padding:20, marginBottom:16, ...extra }}>{children}</div>;
  const STitle = ({ children }) => <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:12, letterSpacing:1 }}>{children}</div>;
  const MetricPills = ({ active, setActive }) => (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
      {Object.entries(METRIC_CONFIG).map(([k,cfg]) => (
        <button key={k} onClick={() => setActive(k)} style={{ padding:"5px 12px", borderRadius:20, background:active===k?cfg.color:C.card, border:`1px solid ${active===k?cfg.color:C.cardBorder}`, color:active===k?"#0A0F0D":C.muted, fontSize:11, fontWeight:700, cursor:"pointer" }}>{cfg.icon} {cfg.label}</button>
      ))}
    </div>
  );

  const ranked = getRanking(rankMetric, rankScope);
  const myRank = selectedStudent ? ranked.findIndex(r => r.id===selectedStudent.id)+1 : 0;
  const maxCompareLen = compareStudentIds.length ? Math.max(...compareStudentIds.map(sid => (records[sid]||[]).length)) : 0;
  const compareData = Array.from({length:maxCompareLen},(_,i) => {
    const base = records[compareStudentIds[0]]?.[i];
    const row = { label: base?.label||base?.date||`${i+1}회` };
    compareStudentIds.forEach(sid => { row[sid] = records[sid]?.[i]?.[compareMetric]??null; });
    return row;
  });

  const radarData = latestRun ? [
    {axis:"속도",  value:Math.min(100,((latestRun.avgSpeed||0)/15)*100)},
    {axis:"거리",  value:Math.min(100,((latestRun.distance||0)/5)*100)},
    {axis:"케이던스",value:Math.min(100,((latestRun.cadence||0)/200)*100)},
    {axis:"심박",  value:Math.min(100,(1-(latestRun.heartRate||170)/200)*100+20)},
    {axis:"칼로리",value:Math.min(100,((latestRun.calories||0)/400)*100)},
    {axis:"보폭",  value:Math.min(100,((latestRun.stride||0)/1.5)*100)},
  ] : [];

  const noStudents = students.length === 0;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Noto Sans KR',sans-serif", paddingBottom:60 }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet"/>

      {showStudentManager && <StudentManagerModal students={students} onClose={()=>setShowStudentManager(false)} onSave={handleSaveStudents}/>}

      {/* 헤더 */}
      <div style={{ background:"linear-gradient(135deg,#0A1A12,#0F2018)", borderBottom:`1px solid ${C.cardBorder}`, padding:"18px 20px 14px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, marginBottom:10 }}>
          <div>
            <div style={{ fontSize:10, color:C.neon, letterSpacing:2, textTransform:"uppercase", marginBottom:2 }}>⬡ RUNNING TRACKER</div>
            <h1 style={{ margin:0, fontSize:19, fontWeight:900, letterSpacing:-0.5 }}>학생 러닝 데이터</h1>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
            {!noStudents && (
              <select value={selectedStudent?.id||""} onChange={e => setSelectedStudentId(+e.target.value)}
                style={{ ...IS, width:"auto", padding:"7px 10px", fontSize:12 }}>
                {students.map(s => <option key={s.id} value={s.id}>{s.avatar} {s.name} ({s.grade})</option>)}
              </select>
            )}
            <div style={{ display:"flex", gap:6 }}>
              {isTeacher && <button onClick={()=>setShowStudentManager(true)} style={{ padding:"5px 12px", borderRadius:20, background:`${C.gold}22`, border:`1px solid ${C.gold}55`, color:C.gold, fontSize:11, fontWeight:700, cursor:"pointer" }}>👥 학생 관리</button>}
              <button onClick={()=>setIsTeacher(v=>!v)} style={{ padding:"5px 12px", borderRadius:20, background:isTeacher?C.purple:"transparent", border:`1px solid ${isTeacher?C.purple:C.cardBorder}`, color:isTeacher?C.text:C.muted, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                {isTeacher?"👩‍🏫 교사 모드":"👤 학생 모드"}
              </button>
            </div>
          </div>
        </div>
        {!noStudents && (
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>exportExcel("student")} style={{ flex:1, padding:"7px 0", background:"transparent", border:`1px solid ${C.neon}55`, borderRadius:10, color:C.neon, fontSize:11, fontWeight:700, cursor:"pointer" }}>📥 현재 학생 Excel</button>
            <button onClick={()=>exportExcel("all")} style={{ flex:1, padding:"7px 0", background:"transparent", border:`1px solid ${C.gold}55`, borderRadius:10, color:C.gold, fontSize:11, fontWeight:700, cursor:"pointer" }}>📊 전체 학생 Excel</button>
          </div>
        )}
        {exportNotice && <div style={{ marginTop:8, padding:"7px 12px", background:`${C.neon}15`, border:`1px solid ${C.neon}44`, borderRadius:8, fontSize:12, color:C.neon, textAlign:"center" }}>{exportNotice}</div>}
      </div>

      {/* 탭 */}
      {!noStudents && (
        <div style={{ padding:"12px 20px 0" }}>
          <div style={{ display:"flex", gap:3, background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:13, padding:4 }}>
            {[["dashboard","대시보드","📊"],["ranking","순위","🏆"],["journal","소감·피드백","✍️"],["stats","통계","📈"],["goals","목표","🎯"],["record","기록입력","✏️"],["compare","비교","⚖️"]].map(([k,l,ic])=>(
              <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:"9px 0", background:tab===k?C.neon:"transparent", color:tab===k?"#0A0F0D":C.muted, border:"none", borderRadius:10, fontWeight:700, fontSize:10, cursor:"pointer", transition:"all .2s", whiteSpace:"nowrap" }}>{ic}<br/>{l}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding:"16px 20px" }}>

        {/* 학생 없을 때 */}
        {noStudents && (
          <div style={{ textAlign:"center", padding:"80px 20px" }}>
            <div style={{ fontSize:72, marginBottom:16 }}>👥</div>
            <div style={{ fontSize:20, fontWeight:900, marginBottom:8 }}>등록된 학생이 없습니다</div>
            <div style={{ fontSize:14, color:C.muted, marginBottom:28 }}>교사 모드로 전환 후 학생을 추가해 주세요</div>
            <button onClick={()=>{ setIsTeacher(true); setShowStudentManager(true); }} style={{ padding:"16px 32px", background:C.neon, border:"none", borderRadius:16, color:"#0A0F0D", fontWeight:900, fontSize:16, cursor:"pointer" }}>
              👩‍🏫 교사 모드로 학생 추가하기
            </button>
          </div>
        )}

        {/* ══ 대시보드 ══ */}
        {!noStudents && tab==="dashboard" && selectedStudent && (
          <div>
            <div style={{ background:"linear-gradient(135deg,#0F2018,#12261C)", border:`1px solid ${C.neon}22`, borderRadius:20, padding:18, marginBottom:16, display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:`${C.neon}22`, border:`2px solid ${C.neon}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{selectedStudent.avatar}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:17, fontWeight:900 }}>{selectedStudent.name}</div>
                <div style={{ fontSize:12, color:C.muted }}>{selectedStudent.grade} · 총 {studentRuns.length}회 · 종합 {myRank}위</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:C.muted, marginBottom:2 }}>총 누적 거리</div>
                <div style={{ fontSize:22, fontWeight:800, color:C.neon, fontFamily:"'Space Mono',monospace" }}>
                  {studentRuns.reduce((a,r)=>a+(r.distance||0),0).toFixed(1)}<span style={{ fontSize:11, color:C.muted, marginLeft:3 }}>km</span>
                </div>
              </div>
            </div>
            {latestRun && prevRun && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {Object.keys(METRIC_CONFIG).map(k => <StatCard key={k} metricKey={k} latest={latestRun[k]} delta={latestRun[k]-prevRun[k]} goal={goals[k]||null}/>)}
              </div>
            )}
            {latestRun && radarData.length > 0 && (
              <Card><STitle>📡 최근 기록 종합 분석</STitle>
                <ResponsiveContainer width="100%" height={200}><RadarChart data={radarData}><PolarGrid stroke={C.cardBorder}/><PolarAngleAxis dataKey="axis" tick={{fill:C.muted,fontSize:11}}/><Radar dataKey="value" stroke={C.neon} fill={C.neon} fillOpacity={0.15} strokeWidth={2}/></RadarChart></ResponsiveContainer>
              </Card>
            )}
            <STitle>📈 주별 변화 추이</STitle>
            <MetricPills active={activeMetric} setActive={setActiveMetric}/>
            <Card>
              <ResponsiveContainer width="100%" height={200}><AreaChart data={studentRuns}>
                <defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={METRIC_CONFIG[activeMetric].color} stopOpacity={0.3}/><stop offset="100%" stopColor={METRIC_CONFIG[activeMetric].color} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid stroke={C.cardBorder} strokeDasharray="3 3"/><XAxis dataKey="label" tick={{fill:C.muted,fontSize:10}}/><YAxis tick={{fill:C.muted,fontSize:10}}/><Tooltip content={<CustomTooltip/>}/>
                {goals[activeMetric]&&<ReferenceLine y={goals[activeMetric]} stroke={C.gold} strokeDasharray="5 3" label={{value:`목표 ${goals[activeMetric]}`,fill:C.gold,fontSize:10,position:"insideTopRight"}}/>}
                <Area type="monotone" dataKey={activeMetric} stroke={METRIC_CONFIG[activeMetric].color} strokeWidth={2.5} fill="url(#mg)" dot={{fill:METRIC_CONFIG[activeMetric].color,r:3}}/>
              </AreaChart></ResponsiveContainer>
            </Card>
            {studentRuns.length === 0 && <div style={{ textAlign:"center", color:C.muted, padding:"40px 0", fontSize:14 }}>아직 기록이 없습니다. <b style={{color:C.neon}}>기록입력</b> 탭에서 추가해 주세요.</div>}
            {studentRuns.length > 0 && (
              <Card><div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>🗓 전체 기록 내역</div>
                <div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                  <thead><tr style={{ background:"#0D1A15" }}>{["날짜","거리","속도","페이스","케이던스","심박","칼로리","보폭"].map(h=><th key={h} style={{ padding:"8px 12px", color:C.muted, fontWeight:600, textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
                  <tbody>{[...studentRuns].reverse().map((r,i)=>(
                    <tr key={i} style={{ borderTop:`1px solid ${C.cardBorder}` }}>
                      <td style={{ padding:"8px 12px", color:C.muted }}>{r.date}</td>
                      <td style={{ padding:"8px 12px", color:C.blue, fontWeight:700, fontFamily:"monospace" }}>{r.distance}km</td>
                      <td style={{ padding:"8px 12px", color:C.neon, fontWeight:700, fontFamily:"monospace" }}>{r.avgSpeed}</td>
                      <td style={{ padding:"8px 12px", color:C.accent, fontFamily:"monospace" }}>{r.avgPace}'</td>
                      <td style={{ padding:"8px 12px", color:C.purple, fontFamily:"monospace" }}>{r.cadence}</td>
                      <td style={{ padding:"8px 12px", color:C.red, fontFamily:"monospace" }}>{r.heartRate}</td>
                      <td style={{ padding:"8px 12px", color:C.gold, fontFamily:"monospace" }}>{r.calories}</td>
                      <td style={{ padding:"8px 12px", color:C.teal, fontFamily:"monospace" }}>{r.stride}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              </Card>
            )}
          </div>
        )}

        {/* ══ 순위 ══ */}
        {!noStudents && tab==="ranking" && (
          <div>
            <div style={{ background:`linear-gradient(135deg,${C.gold}18,${C.gold}08)`, border:`1px solid ${C.gold}44`, borderRadius:20, padding:20, marginBottom:16, textAlign:"center" }}>
              <div style={{ fontSize:11, color:C.gold, letterSpacing:2, marginBottom:6 }}>🏆 나의 현재 순위</div>
              <div style={{ fontSize:56, fontWeight:900, color:C.gold, fontFamily:"'Space Mono',monospace", lineHeight:1 }}>{myRank||"-"}<span style={{ fontSize:20, color:C.muted }}>위</span></div>
              <div style={{ fontSize:13, color:C.muted, marginTop:6 }}>{selectedStudent?.name} · {METRIC_CONFIG[rankMetric].label} 기준</div>
            </div>
            <Card><STitle>지표 선택</STitle><MetricPills active={rankMetric} setActive={setRankMetric}/><STitle>기준 선택</STitle>
              <div style={{ display:"flex", gap:8 }}>
                {[["latest","최신 기록"],["all","전체 평균"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setRankScope(v)} style={{ flex:1, padding:"9px 0", borderRadius:12, background:rankScope===v?C.neon:"transparent", border:`1px solid ${rankScope===v?C.neon:C.cardBorder}`, color:rankScope===v?"#0A0F0D":C.muted, fontWeight:700, fontSize:13, cursor:"pointer" }}>{l}</button>
                ))}
              </div>
            </Card>
            <Card><STitle>{`🏅 ${METRIC_CONFIG[rankMetric].label} ${rankScope==="latest"?"최신 기록":"전체 평균"} 순위`}</STitle>
              {ranked.map((s,i) => {
                const isMe = s.id===selectedStudent?.id, medal=["🥇","🥈","🥉"][i]||null, pct=ranked[0]?.val>0?(s.val/ranked[0].val)*100:0;
                return (
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", marginBottom:8, borderRadius:14, background:isMe?`${C.neon}12`:C.bg, border:`1px solid ${isMe?C.neon:C.cardBorder}` }}>
                    <div style={{ width:36, textAlign:"center", flexShrink:0 }}>{medal?<span style={{ fontSize:22 }}>{medal}</span>:<span style={{ fontFamily:"'Space Mono',monospace", fontSize:16, fontWeight:800, color:C.muted }}>{i+1}</span>}</div>
                    <div style={{ fontSize:24 }}>{s.avatar}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:6 }}>{s.name}{isMe&&<span style={{ fontSize:10, background:C.neon, color:"#0A0F0D", borderRadius:6, padding:"1px 6px", fontWeight:800 }}>나</span>}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.grade} · {s.sessions}회</div>
                      <div style={{ marginTop:6, height:4, background:C.cardBorder, borderRadius:4, overflow:"hidden" }}><div style={{ height:"100%", width:`${pct}%`, background:isMe?C.neon:METRIC_CONFIG[rankMetric].color, borderRadius:4 }}/></div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:20, fontWeight:800, color:isMe?C.neon:METRIC_CONFIG[rankMetric].color, fontFamily:"'Space Mono',monospace" }}>{s.val}</div>
                      <div style={{ fontSize:10, color:C.muted }}>{METRIC_CONFIG[rankMetric].unit}</div>
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card><STitle>📍 누적 거리 순위</STitle>
              {[...students].map(s=>({...s,totalDist:parseFloat((records[s.id]||[]).reduce((a,r)=>a+(r.distance||0),0).toFixed(1))}))
                .sort((a,b)=>b.totalDist-a.totalDist)
                .map((s,i) => {
                  const isMe=s.id===selectedStudent?.id, maxDist=Math.max(1,...students.map(st=>(records[st.id]||[]).reduce((a,r)=>a+(r.distance||0),0)));
                  return (
                    <div key={s.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:i<students.length-1?`1px solid ${C.cardBorder}`:"none" }}>
                      <span style={{ width:28, textAlign:"center" }}>{["🥇","🥈","🥉"][i]||<span style={{ color:C.muted, fontFamily:"monospace", fontSize:14 }}>{i+1}</span>}</span>
                      <span style={{ fontSize:20 }}>{s.avatar}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:13, display:"flex", gap:6, alignItems:"center" }}>{s.name}{isMe&&<span style={{ fontSize:10, background:C.neon, color:"#0A0F0D", borderRadius:6, padding:"1px 6px", fontWeight:800 }}>나</span>}</div>
                        <div style={{ marginTop:4, height:4, background:C.cardBorder, borderRadius:4, overflow:"hidden" }}><div style={{ height:"100%", width:`${(s.totalDist/maxDist)*100}%`, background:isMe?C.neon:C.blue, borderRadius:4 }}/></div>
                      </div>
                      <div style={{ fontFamily:"'Space Mono',monospace", fontWeight:800, color:isMe?C.neon:C.blue, fontSize:16 }}>{s.totalDist}<span style={{ fontSize:11, color:C.muted, marginLeft:2 }}>km</span></div>
                    </div>
                  );
                })}
            </Card>
          </div>
        )}

        {/* ══ 소감·피드백 ══ */}
        {!noStudents && tab==="journal" && selectedStudent && (
          <div>
            <div style={{ background:isTeacher?`${C.purple}15`:`${C.blue}10`, border:`1px solid ${isTeacher?C.purple:C.blue}33`, borderRadius:14, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:22 }}>{isTeacher?"👩‍🏫":"🎒"}</span>
              <div><div style={{ fontWeight:700, fontSize:13 }}>{isTeacher?"교사 모드 — 피드백 작성":"학생 모드 — 소감 작성"}</div><div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{isTeacher?"각 학생의 기록에 피드백을 작성할 수 있습니다.":"활동 후 소감과 컨디션을 기록해 보세요."}</div></div>
            </div>
            {isTeacher && (
              <div style={{ marginBottom:12 }}>
                <STitle>학생 선택</STitle>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {students.map(s=><button key={s.id} onClick={()=>setSelectedStudentId(s.id)} style={{ padding:"7px 14px", borderRadius:20, background:selectedStudent.id===s.id?C.purple:"transparent", border:`1px solid ${selectedStudent.id===s.id?C.purple:C.cardBorder}`, color:selectedStudent.id===s.id?C.text:C.muted, fontWeight:700, fontSize:12, cursor:"pointer" }}>{s.avatar} {s.name}</button>)}
                </div>
              </div>
            )}
            {studentRuns.length===0 && <div style={{ textAlign:"center", color:C.muted, padding:"40px 0", fontSize:14 }}>기록이 없습니다. 먼저 기록을 추가해 주세요.</div>}
            {[...studentRuns].reverse().map((r,ri) => {
              const key=`${selectedStudent.id}-${r.date}`, rf=reflections[key], fb=feedbacks[key];
              const isRE=reflTarget?.sid===selectedStudent.id&&reflTarget?.date===r.date;
              const isFE=fbTarget?.sid===selectedStudent.id&&fbTarget?.date===r.date;
              return (
                <div key={ri} style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:18, marginBottom:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.cardBorder}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div><div style={{ fontWeight:800, fontSize:14 }}>{r.date}</div><div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{r.duration}분 · <span style={{color:C.blue}}>{r.distance}km</span> · <span style={{color:C.neon}}>{r.avgSpeed}km/h</span></div></div>
                      <div style={{ display:"flex", gap:6 }}>{rf&&<span style={{fontSize:18}}>{rf.mood}</span>}{fb&&<span style={{ fontSize:10, padding:"3px 8px", borderRadius:10, background:`${TAG_COLORS[fb.tag]}22`, color:TAG_COLORS[fb.tag], fontWeight:700 }}>{fb.tag}</span>}</div>
                    </div>
                  </div>
                  {rf&&<div style={{ padding:"12px 18px", borderBottom:`1px solid ${C.cardBorder}`, background:"#0D1A15" }}><div style={{ fontSize:10, color:C.blue, fontWeight:700, marginBottom:6 }}>✍️ 학생 소감</div><div style={{ fontSize:13, lineHeight:1.6 }}>{rf.text}</div><div style={{ fontSize:11, color:C.muted, marginTop:6 }}>무드 {rf.mood} · 노력도 {"⭐".repeat(rf.effort)}</div></div>}
                  {fb&&<div style={{ padding:"12px 18px", borderBottom:`1px solid ${C.cardBorder}`, background:`${C.purple}08` }}><div style={{ fontSize:10, color:C.purple, fontWeight:700, marginBottom:6 }}>👩‍🏫 교사 피드백</div><div style={{ fontSize:13, lineHeight:1.6 }}>{fb.text}</div><div style={{ display:"flex", gap:10, marginTop:8, alignItems:"center" }}><StarRating value={fb.stars} readonly/><span style={{ fontSize:11, padding:"2px 10px", borderRadius:10, background:`${TAG_COLORS[fb.tag]}22`, color:TAG_COLORS[fb.tag], fontWeight:700 }}>{fb.tag}</span></div></div>}
                  {!isTeacher && <div style={{ padding:"12px 18px" }}>
                    {isRE ? (
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:C.blue, marginBottom:10 }}>✍️ 소감 작성</div>
                        <textarea rows={3} placeholder="오늘 달리면서 느낀 점을 작성해 보세요..." value={reflForm.text} onChange={e=>setReflForm(f=>({...f,text:e.target.value}))} style={{ ...IS, resize:"none", lineHeight:1.6, fontFamily:"'Noto Sans KR',sans-serif" }}/>
                        <div style={{ display:"flex", gap:12, marginTop:10, flexWrap:"wrap" }}>
                          <div><div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>오늘 무드</div><div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>{MOOD_OPTIONS.map(m=><button key={m} onClick={()=>setReflForm(f=>({...f,mood:m}))} style={{ fontSize:20, background:"none", border:`2px solid ${reflForm.mood===m?C.blue:"transparent"}`, borderRadius:8, padding:2, cursor:"pointer" }}>{m}</button>)}</div></div>
                          <div><div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>노력도</div><div style={{ display:"flex", gap:4 }}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setReflForm(f=>({...f,effort:n}))} style={{ fontSize:18, background:"none", border:"none", cursor:"pointer", color:n<=reflForm.effort?C.gold:C.cardBorder }}>★</button>)}</div></div>
                        </div>
                        <div style={{ display:"flex", gap:8, marginTop:12 }}>
                          <button onClick={saveReflection} style={{ flex:1, padding:"10px", background:reflSaved?C.neonDim:C.blue, border:"none", borderRadius:10, color:C.text, fontWeight:800, fontSize:13, cursor:"pointer" }}>{reflSaved?"✅ 저장 완료!":"💾 저장"}</button>
                          <button onClick={()=>setReflTarget(null)} style={{ padding:"10px 16px", background:"transparent", border:`1px solid ${C.cardBorder}`, borderRadius:10, color:C.muted, fontSize:13, cursor:"pointer" }}>취소</button>
                        </div>
                      </div>
                    ) : <button onClick={()=>{setReflTarget({sid:selectedStudent.id,date:r.date});setReflForm(reflections[key]||{text:"",mood:"😊",effort:3});}} style={{ width:"100%", padding:"9px", background:"transparent", border:`1px dashed ${C.blue}55`, borderRadius:10, color:C.blue, fontWeight:700, fontSize:12, cursor:"pointer" }}>{rf?"✏️ 소감 수정하기":"✍️ 소감 작성하기"}</button>}
                  </div>}
                  {isTeacher && <div style={{ padding:"12px 18px" }}>
                    {isFE ? (
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:C.purple, marginBottom:10 }}>👩‍🏫 피드백 작성</div>
                        <textarea rows={3} placeholder={`${selectedStudent.name} 학생에게 피드백을 작성해 주세요...`} value={fbForm.text} onChange={e=>setFbForm(f=>({...f,text:e.target.value}))} style={{ ...IS, resize:"none", lineHeight:1.6, fontFamily:"'Noto Sans KR',sans-serif" }}/>
                        <div style={{ display:"flex", gap:16, marginTop:10, flexWrap:"wrap" }}>
                          <div><div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>별점</div><StarRating value={fbForm.stars} onChange={v=>setFbForm(f=>({...f,stars:v}))}/></div>
                          <div style={{ flex:1 }}><div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>태그</div><div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>{FEEDBACK_TAGS.map(tag=><button key={tag} onClick={()=>setFbForm(f=>({...f,tag}))} style={{ padding:"4px 10px", borderRadius:10, background:fbForm.tag===tag?`${TAG_COLORS[tag]}33`:"transparent", border:`1px solid ${fbForm.tag===tag?TAG_COLORS[tag]:C.cardBorder}`, color:fbForm.tag===tag?TAG_COLORS[tag]:C.muted, fontSize:11, fontWeight:700, cursor:"pointer" }}>{tag}</button>)}</div></div>
                        </div>
                        <div style={{ display:"flex", gap:8, marginTop:12 }}>
                          <button onClick={saveFeedback} style={{ flex:1, padding:"10px", background:fbSaved?C.neonDim:C.purple, border:"none", borderRadius:10, color:C.text, fontWeight:800, fontSize:13, cursor:"pointer" }}>{fbSaved?"✅ 저장 완료!":"💾 피드백 저장"}</button>
                          <button onClick={()=>setFbTarget(null)} style={{ padding:"10px 16px", background:"transparent", border:`1px solid ${C.cardBorder}`, borderRadius:10, color:C.muted, fontSize:13, cursor:"pointer" }}>취소</button>
                        </div>
                      </div>
                    ) : <button onClick={()=>{setFbTarget({sid:selectedStudent.id,date:r.date});setFbForm(feedbacks[key]||{text:"",stars:4,tag:"잘함"});}} style={{ width:"100%", padding:"9px", background:"transparent", border:`1px dashed ${C.purple}55`, borderRadius:10, color:C.purple, fontWeight:700, fontSize:12, cursor:"pointer" }}>{fb?"✏️ 피드백 수정하기":"👩‍🏫 피드백 작성하기"}</button>}
                  </div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ 통계 ══ */}
        {!noStudents && tab==="stats" && selectedStudent && (
          <div>
            <Card><STitle>{`📊 ${selectedStudent.name} 전체 기간 평균`}</STitle>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {Object.entries(METRIC_CONFIG).map(([k,cfg]) => {
                  const a=avg(studentRuns,k), g=goals[k], achieved=g?(cfg.goodUp?a>=g:a<=g):null;
                  return <div key={k} style={{ background:C.bg, borderRadius:12, padding:"12px 14px", border:`1px solid ${achieved===true?C.neon+"55":achieved===false?C.red+"44":C.cardBorder}` }}>
                    <div style={{ fontSize:10, color:C.muted }}>{cfg.icon} {cfg.label}</div>
                    <div style={{ fontSize:20, fontWeight:800, color:cfg.color, fontFamily:"monospace", marginTop:4 }}>{fmt(a)} <span style={{ fontSize:11, color:C.muted }}>{cfg.unit}</span></div>
                    {g&&<div style={{ fontSize:10, color:achieved?C.neon:C.red, marginTop:2 }}>{achieved?"✅ 목표 달성":"❌ 목표 미달"}</div>}
                  </div>;
                })}
              </div>
            </Card>
            <Card><STitle>🏫 반별 평균 통계</STitle>
              <div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead><tr style={{ background:"#0D1A15" }}>{["반","학생수","총거리",...Object.values(METRIC_CONFIG).map(c=>c.label)].map(h=><th key={h} style={{ padding:"8px 12px", color:C.muted, fontWeight:600, textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
                <tbody>{classStats().map((row,i)=>(
                  <tr key={i} style={{ borderTop:`1px solid ${C.cardBorder}` }}>
                    <td style={{ padding:"8px 12px", fontWeight:700, color:C.neon }}>{row.grade}</td>
                    <td style={{ padding:"8px 12px", color:C.muted }}>{row.studentCount}명</td>
                    <td style={{ padding:"8px 12px", color:C.blue, fontFamily:"monospace" }}>{row.totalDistance}km</td>
                    {Object.entries(METRIC_CONFIG).map(([k,cfg])=><td key={k} style={{ padding:"8px 12px", color:cfg.color, fontFamily:"monospace" }}>{row[k]}</td>)}
                  </tr>
                ))}</tbody>
              </table></div>
            </Card>
          </div>
        )}

        {/* ══ 목표 ══ */}
        {!noStudents && tab==="goals" && (
          <div>
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div><div style={{ fontWeight:800, fontSize:15 }}>🎯 목표 설정</div><div style={{ fontSize:11, color:C.muted, marginTop:2 }}>각 지표의 목표값을 설정합니다</div></div>
                {!goalEditing ? <button onClick={()=>{setGoalEditing(true);setGoalDraft({...goals});}} style={{ padding:"8px 16px", background:C.neon, border:"none", borderRadius:10, color:"#0A0F0D", fontWeight:700, fontSize:12, cursor:"pointer" }}>편집</button>
                  : <div style={{ display:"flex", gap:6 }}><button onClick={()=>{setGoals({...goalDraft});setGoalEditing(false);}} style={{ padding:"8px 14px", background:C.neon, border:"none", borderRadius:10, color:"#0A0F0D", fontWeight:700, fontSize:12, cursor:"pointer" }}>저장</button><button onClick={()=>setGoalEditing(false)} style={{ padding:"8px 14px", background:"transparent", border:`1px solid ${C.cardBorder}`, borderRadius:10, color:C.muted, fontSize:12, cursor:"pointer" }}>취소</button></div>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {Object.entries(METRIC_CONFIG).map(([k,cfg]) => (
                  <div key={k} style={{ background:C.bg, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.cardBorder}` }}>
                    <div style={{ fontSize:11, color:cfg.color, fontWeight:700, marginBottom:8 }}>{cfg.icon} {cfg.label}</div>
                    {goalEditing ? <input type="number" value={goalDraft[k]??""} step="0.1" onChange={e=>setGoalDraft(p=>({...p,[k]:parseFloat(e.target.value)||0}))} style={{ ...IS, fontSize:18, fontWeight:800, padding:"8px 10px" }}/> : <div style={{ fontSize:22, fontWeight:800, fontFamily:"monospace", color:C.text }}>{goals[k]} <span style={{ fontSize:11, color:C.muted }}>{cfg.unit}</span></div>}
                    {latestRun&&(()=>{const cur=latestRun[k]||0,g=goalEditing?goalDraft[k]:goals[k],pct=Math.min(100,(cur/g)*100),achieved=cfg.goodUp?cur>=g:cur<=g;return(<div style={{marginTop:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginBottom:4}}><span>{selectedStudent?.name}: {cur}</span><span style={{color:achieved?C.neon:C.red}}>{pct.toFixed(0)}%</span></div><div style={{height:5,background:C.cardBorder,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:achieved?C.neon:cfg.color,borderRadius:4}}/></div></div>);})()}
                  </div>
                ))}
              </div>
            </Card>
            <Card><STitle>👥 전체 학생 목표 달성 현황</STitle>
              <div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead><tr style={{ background:"#0D1A15" }}><th style={{ padding:"8px 12px", color:C.muted, textAlign:"left" }}>학생</th>{Object.entries(METRIC_CONFIG).map(([k,cfg])=><th key={k} style={{ padding:"8px 10px", color:cfg.color, textAlign:"center" }}>{cfg.icon}</th>)}<th style={{ padding:"8px 12px", color:C.gold, textAlign:"center" }}>달성률</th></tr></thead>
                <tbody>{students.map(s=>{const last=(records[s.id]||[]).slice(-1)[0],results=Object.entries(METRIC_CONFIG).map(([k,cfg])=>{const cur=last?.[k]??0;return cfg.goodUp?cur>=goals[k]:cur<=goals[k];});const rate=Math.round((results.filter(Boolean).length/results.length)*100);return(<tr key={s.id} style={{borderTop:`1px solid ${C.cardBorder}`}}><td style={{padding:"8px 12px",fontWeight:700}}>{s.avatar} {s.name}</td>{results.map((ok,i)=><td key={i} style={{padding:"8px 10px",textAlign:"center",fontSize:14}}>{ok?"✅":"❌"}</td>)}<td style={{padding:"8px 12px",textAlign:"center",fontWeight:800,color:rate>=70?C.neon:rate>=40?C.gold:C.red,fontFamily:"monospace"}}>{rate}%</td></tr>);})}</tbody>
              </table></div>
            </Card>
          </div>
        )}

        {/* ══ 기록 입력 ══ */}
        {!noStudents && tab==="record" && selectedStudent && (
          <div>
            <Card>
              <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>✏️ {selectedStudent.name} 러닝 기록 입력</div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:20 }}>새로운 러닝 기록을 추가합니다</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ fontSize:10, color:C.muted, display:"block", marginBottom:5 }}>📅 날짜</label>
                  <CalendarPicker value={form.date} onChange={v=>setForm(f=>({...f,date:v}))}/>
                </div>
                {[{key:"duration",label:"⏱ 운동시간 (분)",ph:"예: 25"},{key:"distance",label:"📍 거리 (km)",ph:"예: 3.2"},{key:"avgSpeed",label:"⚡ 평균속도 (km/h)",ph:"예: 9.5"},{key:"avgPace",label:"⏱ 평균페이스 ('/km)",ph:"예: 6.3"},{key:"cadence",label:"👣 케이던스 (spm)",ph:"예: 168"},{key:"heartRate",label:"❤️ 심박수 (bpm)",ph:"예: 165"},{key:"calories",label:"🔥 칼로리 (kcal)",ph:"예: 240"},{key:"stride",label:"📐 보폭 (m)",ph:"예: 1.12"}].map(({key,label,ph})=>(
                  <div key={key}>
                    <label style={{ fontSize:10, color:C.muted, display:"block", marginBottom:5 }}>{label}</label>
                    <input type="number" placeholder={ph} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={IS}/>
                  </div>
                ))}
              </div>
              <button onClick={handleSave} style={{ marginTop:20, width:"100%", padding:"14px", background:saved?C.neonDim:C.neon, border:"none", borderRadius:12, color:"#0A0F0D", fontWeight:800, fontSize:14, cursor:"pointer", transition:"all .2s" }}>{saved?"✅ 저장 완료!":"💾 기록 저장"}</button>
            </Card>
            <STitle>최근 기록 (최신순)</STitle>
            {[...(records[selectedStudent.id]||[])].reverse().slice(0,5).map((r,i)=>(
              <div key={i} style={{ background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:12, padding:"12px 16px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div><div style={{ fontSize:13, fontWeight:700 }}>{r.date}</div><div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{r.duration}분 · {r.distance}km · {r.avgSpeed}km/h</div></div>
                <div style={{ textAlign:"right" }}><div style={{ color:C.neon, fontWeight:700, fontFamily:"monospace", fontSize:13 }}>{r.cadence} spm</div><div style={{ color:C.red, fontSize:11, fontFamily:"monospace" }}>{r.heartRate} bpm</div></div>
              </div>
            ))}
          </div>
        )}

        {/* ══ 비교 ══ */}
        {!noStudents && tab==="compare" && (
          <div>
            <Card><STitle>비교 학생 선택 (최대 3명)</STitle>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {students.map(s => { const on=compareStudentIds.includes(s.id); return <button key={s.id} onClick={()=>setCompareStudentIds(prev=>on?prev.filter(id=>id!==s.id):prev.length<3?[...prev,s.id]:prev)} style={{ padding:"7px 14px", borderRadius:20, background:on?C.neon:C.bg, border:`1px solid ${on?C.neon:C.cardBorder}`, color:on?"#0A0F0D":C.muted, fontWeight:700, fontSize:12, cursor:"pointer" }}>{s.avatar} {s.name}</button>; })}
              </div>
            </Card>
            <MetricPills active={compareMetric} setActive={setCompareMetric}/>
            {compareStudentIds.length >= 2 ? <>
              <Card><STitle>{`📈 ${METRIC_CONFIG[compareMetric].label} 추이 비교`}</STitle>
                <ResponsiveContainer width="100%" height={220}><LineChart data={compareData}>
                  <CartesianGrid stroke={C.cardBorder} strokeDasharray="3 3"/><XAxis dataKey="label" tick={{fill:C.muted,fontSize:10}}/><YAxis tick={{fill:C.muted,fontSize:10}}/><Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{color:C.muted,fontSize:11}}/>
                  {goals[compareMetric]&&<ReferenceLine y={goals[compareMetric]} stroke={C.gold} strokeDasharray="5 3" label={{value:`목표 ${goals[compareMetric]}`,fill:C.gold,fontSize:10}}/>}
                  {compareStudentIds.map((sid,i)=>{const palette=[C.neon,C.blue,C.purple];const st=students.find(s=>s.id===sid);return <Line key={sid} type="monotone" dataKey={sid} name={st?.name} stroke={palette[i%3]} strokeWidth={2.5} dot={{r:3,fill:palette[i%3]}} connectNulls/>;})}</LineChart></ResponsiveContainer>
              </Card>
              <Card><STitle>📊 최신 기록 비교</STitle>
                <ResponsiveContainer width="100%" height={170}><BarChart data={compareStudentIds.map(sid=>{const st=students.find(x=>x.id===sid);const last=(records[sid]||[]).slice(-1)[0];return{name:st?.name,value:last?.[compareMetric]||0};})}>
                  <CartesianGrid stroke={C.cardBorder} strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fill:C.muted,fontSize:11}}/><YAxis tick={{fill:C.muted,fontSize:10}}/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:10,fontSize:12}}/>
                  {goals[compareMetric]&&<ReferenceLine y={goals[compareMetric]} stroke={C.gold} strokeDasharray="4 3"/>}<Bar dataKey="value" name={METRIC_CONFIG[compareMetric].label} fill={METRIC_CONFIG[compareMetric].color} radius={[8,8,0,0]}/></BarChart></ResponsiveContainer>
              </Card>
            </> : <div style={{ textAlign:"center", color:C.muted, padding:"40px 0", fontSize:14 }}>위에서 학생을 2명 이상 선택해 주세요.</div>}
          </div>
        )}

      </div>
    </div>
  );
}