import { supabase } from './supabase'

const styleId='fitcoach-checkin-style'
if(!document.getElementById(styleId)){
 const s=document.createElement('style');s.id=styleId;s.textContent=`.checkin-card{margin-top:18px;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:20px;background:linear-gradient(135deg,rgba(114,227,160,.10),rgba(255,255,255,.025));box-shadow:0 12px 35px rgba(0,0,0,.16)}.checkin-head{display:flex;justify-content:space-between;gap:16px;align-items:center}.checkin-head h2{margin:4px 0}.checkin-sub{color:#9aa39e;font-size:13px}.checkin-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}.checkin-stat{padding:14px;border-radius:14px;background:rgba(255,255,255,.04)}.checkin-stat strong{display:block;font-size:24px;margin-top:4px}.checkin-list{display:grid;gap:8px;margin-top:14px}.checkin-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;background:rgba(0,0,0,.12)}.checkin-row small{color:#9aa39e}.checkin-ok{color:#72e3a0}.checkin-empty{color:#9aa39e;font-size:13px;margin-top:14px}@media(max-width:700px){.checkin-stats{grid-template-columns:1fr}.checkin-head{align-items:flex-start;flex-direction:column}.checkin-row{align-items:flex-start;flex-direction:column}}`;document.head.appendChild(s)
}

async function renderStudentCheckinCard(){
 const content=document.querySelector('#content'); if(!content||window.__fcCheckinMounted)return
 const {data:students}=await supabase.from('students').select('id,name').order('name')
 const ids=(students||[]).map(s=>s.id)
 let history=[]
 if(ids.length){const r=await supabase.from('workout_history').select('student_id,completed_at,workout_name').in('student_id',ids).order('completed_at',{ascending:false});history=r.data||[]}
 const today=new Date().toISOString().slice(0,10)
 const checked=new Set(history.filter(x=>String(x.completed_at||'').slice(0,10)===today).map(x=>x.student_id))
 const recentByStudent=new Map();history.forEach(x=>{if(!recentByStudent.has(x.student_id))recentByStudent.set(x.student_id,x)})
 const card=document.createElement('section');card.className='checkin-card';card.innerHTML=`<div class="checkin-head"><div><span class="eyebrow">ACOMPANHAMENTO</span><h2>Check-in de Alunos</h2><div class="checkin-sub">Veja quem já registrou atividade e acompanhe os últimos sinais de presença.</div></div><button class="btn sec" id="openCheckins">Ver check-ins</button></div><div class="checkin-stats"><div class="checkin-stat"><span class="checkin-sub">Alunos</span><strong>${students?.length||0}</strong></div><div class="checkin-stat"><span class="checkin-sub">Check-ins hoje</span><strong>${checked.size}</strong></div><div class="checkin-stat"><span class="checkin-sub">Pendentes hoje</span><strong>${Math.max((students?.length||0)-checked.size,0)}</strong></div></div><div class="checkin-list">${(students||[]).slice(0,5).map(s=>{const r=recentByStudent.get(s.id);return `<div class="checkin-row"><div><strong>${s.name}</strong><br><small>${r?`Último registro: ${new Date(r.completed_at).toLocaleDateString('pt-BR')} · ${r.workout_name||'Treino'}`:'Nenhum registro ainda'}</small></div><strong class="${checked.has(s.id)?'checkin-ok':''}">${checked.has(s.id)?'✓ Hoje':'Pendente'}</strong></div>`}).join('')||'<div class="checkin-empty">Cadastre alunos para começar o acompanhamento.</div>'}</div>`
 const quick=document.querySelector('.quick-panel');if(quick)quick.after(card);else content.appendChild(card)
 window.__fcCheckinMounted=true
 document.querySelector('#openCheckins')?.addEventListener('click',()=>{window.__fcCheckinMounted=false;window.location.hash='checkins';alert('Check-ins: use a lista abaixo para acompanhar presença e últimos registros. O histórico já está sendo usado pelo FITCOACH.')})
}

const observer=new MutationObserver(()=>{if(document.querySelector('#content')&&!window.__fcCheckinMounted)renderStudentCheckinCard()})
observer.observe(document.body,{childList:true,subtree:true})
setTimeout(renderStudentCheckinCard,900)
