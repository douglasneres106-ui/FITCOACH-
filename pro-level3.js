import './pro-level3.css'
import { supabase } from './supabase'

const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
const fmt=(v)=>v?new Date(v).toLocaleDateString('pt-BR'):'-'
const fmtTime=(v)=>v?new Date(v).toLocaleString('pt-BR'):'-'

function toast(message){
  document.querySelector('#pro3Toast')?.remove()
  const el=document.createElement('div')
  el.id='pro3Toast';el.className='pro3-toast';el.textContent=message
  document.body.appendChild(el)
  setTimeout(()=>el.remove(),2800)
}

function openProModal(html){
  document.querySelector('#pro3Modal')?.remove()
  const wrap=document.createElement('div')
  wrap.id='pro3Modal';wrap.className='pro3-modal'
  wrap.innerHTML=`<div class="pro3-modal-card">${html}</div>`
  wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove()})
  document.body.appendChild(wrap)
}
window.closePro3Modal=()=>document.querySelector('#pro3Modal')?.remove()

async function studentProfile(studentId){
  openProModal('<div class="pro3-loading">Carregando perfil...</div>')
  const [{data:s,error},{data:progress},{data:workouts},{data:history}]=await Promise.all([
    supabase.from('students').select('*').eq('id',studentId).single(),
    supabase.from('progress_logs').select('*').eq('student_id',studentId).order('created_at',{ascending:false}).limit(8),
    supabase.from('workouts').select('id,name,created_at').eq('student_id',studentId).order('created_at',{ascending:false}),
    supabase.from('workout_history').select('workout_name,completed_at').eq('student_id',studentId).order('completed_at',{ascending:false}).limit(10)
  ])
  if(error){document.querySelector('#pro3Modal')?.remove();return toast(error.message||'Erro ao abrir perfil')}
  const latest=progress?.[0]
  const first=[...(progress||[])].reverse()[0]
  const weightDelta=(latest?.weight_kg!=null&&first?.weight_kg!=null)?(latest.weight_kg-first.weight_kg).toFixed(1):null
  const waistDelta=(latest?.waist_cm!=null&&first?.waist_cm!=null)?(latest.waist_cm-first.waist_cm).toFixed(1):null
  openProModal(`<div class="pro3-modal-head"><div><span class="eyebrow">PERFIL DO ALUNO</span><h2>${esc(s.name)}</h2><p>${esc(s.goal||'Objetivo não informado')}</p></div><button class="icon-btn" onclick="closePro3Modal()">×</button></div>
  <div class="pro3-profile-grid">
    <div class="pro3-stat"><span>Peso atual</span><strong>${latest?.weight_kg??s.weight_kg??'-'}<small> kg</small></strong>${weightDelta!==null?`<em>${Number(weightDelta)>0?'+':''}${weightDelta} kg no período</em>`:''}</div>
    <div class="pro3-stat"><span>Cintura atual</span><strong>${latest?.waist_cm??s.waist_cm??'-'}<small> cm</small></strong>${waistDelta!==null?`<em>${Number(waistDelta)>0?'+':''}${waistDelta} cm no período</em>`:''}</div>
    <div class="pro3-stat"><span>Treinos criados</span><strong>${workouts?.length||0}</strong><em>fichas ativas</em></div>
    <div class="pro3-stat"><span>Treinos concluídos</span><strong>${history?.length||0}</strong><em>últimos registros</em></div>
  </div>
  <div class="pro3-columns">
    <section><h3>Treinos</h3><div class="pro3-list">${workouts?.length?workouts.map(w=>`<div><strong>${esc(w.name)}</strong><span>${fmt(w.created_at)}</span></div>`).join(''):'<p class="muted">Nenhum treino cadastrado.</p>'}</div></section>
    <section><h3>Evolução recente</h3><div class="pro3-list">${progress?.length?progress.map(p=>`<div><strong>${fmt(p.created_at)}</strong><span>${p.weight_kg??'-'} kg • ${p.waist_cm??'-'} cm</span></div>`).join(''):'<p class="muted">Nenhuma evolução registrada.</p>'}</div></section>
  </div>
  <section class="pro3-history"><h3>Últimos treinos concluídos</h3><div class="pro3-list">${history?.length?history.map(h=>`<div><strong>${esc(h.workout_name)}</strong><span>${fmtTime(h.completed_at)}</span></div>`).join(''):'<p class="muted">Nenhum treino concluído.</p>'}</div></section>`)
}

async function duplicateWorkout(id,button){
  if(button){button.disabled=true;button.textContent='Duplicando...'}
  const {data:w,error}=await supabase.from('workouts').select('id,name,student_id,trainer_id,workout_exercises(*)').eq('id',id).single()
  if(error){if(button){button.disabled=false;button.textContent='Duplicar'};return toast(error.message)}
  const {data:newWorkout,error:insertError}=await supabase.from('workouts').insert({trainer_id:w.trainer_id,student_id:w.student_id,name:`${w.name} - Cópia`}).select().single()
  if(insertError){if(button){button.disabled=false;button.textContent='Duplicar'};return toast(insertError.message)}
  const exercises=(w.workout_exercises||[]).map((e,i)=>({workout_id:newWorkout.id,exercise_name:e.exercise_name,sets:e.sets,reps:e.reps,load:e.load,rest_seconds:e.rest_seconds,sort_order:e.sort_order??i}))
  if(exercises.length){
    const {error:e}=await supabase.from('workout_exercises').insert(exercises)
    if(e)return toast(e.message)
  }
  toast('Treino duplicado com sucesso')
  document.querySelector('[data-page="workouts"]')?.click()
}

function enhanceStudents(){
  const head=[...document.querySelectorAll('.page-head')].find(x=>x.querySelector('h1')?.textContent.trim()==='Alunos')
  if(!head)return
  if(!document.querySelector('#pro3StudentSearch')){
    const search=document.createElement('div')
    search.className='pro3-search'
    search.innerHTML='<span>⌕</span><input id="pro3StudentSearch" type="search" placeholder="Buscar aluno por nome, objetivo ou código...">'
    head.insertAdjacentElement('afterend',search)
    search.querySelector('input').addEventListener('input',e=>{
      const q=e.target.value.toLowerCase().trim()
      document.querySelectorAll('#content .item-card').forEach(card=>{if(card.querySelector('[data-workout]'))card.style.display=!q||card.innerText.toLowerCase().includes(q)?'':'none'})
    })
  }
  document.querySelectorAll('#content .item-card').forEach(card=>{
    const anchor=card.querySelector('[data-workout]')
    const actions=card.querySelector('.actions')
    if(anchor&&actions&&!actions.querySelector('[data-pro3-profile]')){
      const b=document.createElement('button');b.className='btn ghost';b.textContent='Ver perfil';b.dataset.pro3Profile=anchor.dataset.workout
      actions.prepend(b)
    }
  })
}

function enhanceWorkouts(){
  document.querySelectorAll('#content .workout-card').forEach(card=>{
    const view=card.querySelector('[data-view]')
    if(!view||card.querySelector('[data-pro3-duplicate]'))return
    const wrap=document.createElement('div');wrap.className='actions pro3-workout-actions'
    const dup=document.createElement('button');dup.className='btn ghost';dup.textContent='Duplicar';dup.dataset.pro3Duplicate=view.dataset.view
    view.replaceWith(wrap);wrap.append(dup,view)
  })
}

async function enhanceTrainerDashboard(){
  const hero=document.querySelector('.hero-card .eyebrow')
  if(!hero||!hero.textContent.includes('PAINEL DO PERSONAL')||document.querySelector('.pro3-activity'))return
  const content=document.querySelector('#content');if(!content)return
  const block=document.createElement('section');block.className='pro3-activity card';block.innerHTML='<span class="eyebrow">ATIVIDADE RECENTE</span><h2>Movimentação dos alunos</h2><div class="pro3-loading">Carregando...</div>'
  content.appendChild(block)
  const [{data:history},{data:progress}]=await Promise.all([
    supabase.from('workout_history').select('student_id,workout_name,completed_at').order('completed_at',{ascending:false}).limit(5),
    supabase.from('progress_logs').select('student_id,created_at,weight_kg,waist_cm').order('created_at',{ascending:false}).limit(5)
  ])
  const ids=[...new Set([...(history||[]).map(x=>x.student_id),...(progress||[]).map(x=>x.student_id)].filter(Boolean))]
  let names={}
  if(ids.length){const {data}=await supabase.from('students').select('id,name').in('id',ids);names=Object.fromEntries((data||[]).map(x=>[x.id,x.name]))}
  const activity=[...(history||[]).map(x=>({date:x.completed_at,type:'Treino concluído',name:names[x.student_id]||'Aluno',detail:x.workout_name})),...(progress||[]).map(x=>({date:x.created_at,type:'Evolução registrada',name:names[x.student_id]||'Aluno',detail:`${x.weight_kg??'-'} kg • ${x.waist_cm??'-'} cm`}))].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8)
  block.innerHTML=`<span class="eyebrow">ATIVIDADE RECENTE</span><h2>Movimentação dos alunos</h2><div class="pro3-feed">${activity.length?activity.map(a=>`<div><span class="pro3-feed-dot"></span><div><strong>${esc(a.name)}</strong><p>${esc(a.type)} · ${esc(a.detail||'')}</p></div><time>${fmt(a.date)}</time></div>`).join(''):'<p class="muted">Nenhuma atividade recente.</p>'}</div>`
}

async function enhanceStudentConsistency(){
  if(!document.querySelector('.student-hero')||document.querySelector('.pro3-consistency'))return
  const {data:{session}}=await supabase.auth.getSession();if(!session)return
  const {data:s}=await supabase.from('students').select('id').eq('user_id',session.user.id).maybeSingle();if(!s)return
  const since30=new Date(Date.now()-30*86400000).toISOString(),since7=new Date(Date.now()-7*86400000).toISOString()
  const {data}=await supabase.from('workout_history').select('completed_at').eq('student_id',s.id).gte('completed_at',since30).order('completed_at',{ascending:false})
  const month=(data||[]).length,week=(data||[]).filter(x=>x.completed_at>=since7).length
  const card=document.createElement('section');card.className='pro3-consistency'
  card.innerHTML=`<div><span class="eyebrow">CONSISTÊNCIA</span><h2>Seu ritmo de treino</h2><p>Continue acumulando sessões e construindo constância.</p></div><div class="pro3-consistency-stats"><div><strong>${week}</strong><span>últimos 7 dias</span></div><div><strong>${month}</strong><span>últimos 30 dias</span></div></div>`
  document.querySelector('.student-hero').insertAdjacentElement('afterend',card)
}

let timer
function scheduleEnhance(){clearTimeout(timer);timer=setTimeout(()=>{enhanceStudents();enhanceWorkouts();enhanceTrainerDashboard();enhanceStudentConsistency()},90)}
new MutationObserver(scheduleEnhance).observe(document.body,{childList:true,subtree:true})
scheduleEnhance()

document.addEventListener('click',e=>{
  const profile=e.target.closest('[data-pro3-profile]');if(profile)return studentProfile(profile.dataset.pro3Profile)
  const dup=e.target.closest('[data-pro3-duplicate]');if(dup)return duplicateWorkout(dup.dataset.pro3Duplicate,dup)
})
