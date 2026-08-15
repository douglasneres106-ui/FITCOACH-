import './pro-level5.css'
import { supabase } from './supabase'

const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
let scheduled=false

function toast(message){
  document.querySelector('#pro5Toast')?.remove()
  const el=document.createElement('div')
  el.id='pro5Toast';el.className='pro5-toast';el.textContent=message
  document.body.appendChild(el)
  setTimeout(()=>el.remove(),3200)
}

function openModal(html){
  document.querySelector('#pro5Modal')?.remove()
  const wrap=document.createElement('div')
  wrap.id='pro5Modal';wrap.className='pro5-modal'
  wrap.innerHTML=`<div class="pro5-card">${html}</div>`
  wrap.onclick=e=>{if(e.target===wrap)wrap.remove()}
  document.body.appendChild(wrap)
}
window.closePro5Modal=()=>document.querySelector('#pro5Modal')?.remove()

async function sessionUser(){
  const {data}=await supabase.auth.getSession()
  return data.session?.user||null
}

const libraries={
  push:['Supino reto','Supino inclinado com halteres','Desenvolvimento com halteres','Elevação lateral','Crucifixo na máquina','Tríceps na polia','Tríceps francês'],
  pull:['Puxada alta','Remada baixa','Remada unilateral','Pulldown','Crucifixo inverso','Rosca direta','Rosca martelo'],
  quads:['Agachamento livre','Leg press','Afundo com halteres','Cadeira extensora','Panturrilha em pé','Prancha abdominal','Abdominal infra'],
  posterior:['Levantamento terra romeno','Mesa flexora','Elevação pélvica','Agachamento sumô','Cadeira flexora','Panturrilha sentada','Prancha lateral'],
  full:['Agachamento livre','Supino reto','Puxada alta','Levantamento terra romeno','Remada baixa','Desenvolvimento com halteres','Prancha abdominal'],
  conditioning:['Agachamento goblet','Supino com halteres','Remada baixa','Passada alternada','Puxada alta','Desenvolvimento com halteres','Prancha abdominal']
}

const splitByDays={
  3:[['A • Corpo inteiro','full'],['B • Corpo inteiro','conditioning'],['C • Corpo inteiro','full']],
  4:[['A • Superior empurrar','push'],['B • Inferior quadríceps','quads'],['C • Superior puxar','pull'],['D • Inferior posterior','posterior']],
  5:[['A • Peito e tríceps','push'],['B • Costas e bíceps','pull'],['C • Pernas','quads'],['D • Posterior e glúteos','posterior'],['E • Corpo inteiro','full']],
  6:[['A • Push','push'],['B • Pull','pull'],['C • Legs','quads'],['D • Push 2','push'],['E • Pull 2','pull'],['F • Legs 2','posterior']]
}

function inferGoal(raw=''){
  const g=raw.toLowerCase()
  if(/emag|perd|defin|secar|condicion/.test(g))return 'fatloss'
  if(/força|forca|power/.test(g))return 'strength'
  if(/hipert|massa|ganho/.test(g))return 'hypertrophy'
  return 'general'
}

function prescription(goal,level){
  const advanced=level==='advanced', beginner=level==='beginner'
  if(goal==='strength')return {sets:beginner?3:advanced?5:4,reps:'4-6',rest:120}
  if(goal==='fatloss')return {sets:beginner?2:3,reps:'12-15',rest:45}
  if(goal==='hypertrophy')return {sets:beginner?3:4,reps:'8-12',rest:75}
  return {sets:beginner?2:3,reps:'10-12',rest:60}
}

function buildPlan(student,days,duration,level,goalOverride){
  const goal=goalOverride||inferGoal(student.goal||'')
  const rx=prescription(goal,level)
  const maxExercises=duration<=45?5:duration>=75?7:6
  const split=splitByDays[days]||splitByDays[4]
  return split.map(([name,key],dayIndex)=>{
    let pool=[...libraries[key]]
    if(goal==='fatloss' && dayIndex%2===1)pool=[...libraries.conditioning]
    return {
      name:`FIT ${name}`,
      exercises:pool.slice(0,maxExercises).map((exercise_name,i)=>({
        exercise_name,
        sets:rx.sets,
        reps:i===pool.slice(0,maxExercises).length-1 && /Prancha/.test(exercise_name)?'30-45s':rx.reps,
        load:null,
        rest_seconds:/Prancha|Abdominal/.test(exercise_name)?45:rx.rest,
        sort_order:i
      }))
    }
  })
}

async function openAssistant(studentId=''){
  const {data:students,error}=await supabase.from('students').select('id,name,goal,weight_kg,waist_cm').order('name')
  if(error)return toast(error.message)
  if(!students?.length)return toast('Cadastre um aluno primeiro.')
  const selected=students.find(s=>s.id===studentId)||students[0]
  openModal(`<div class="pro5-head"><div><span class="eyebrow">FITCOACH SMART</span><h2>Assistente de treinos</h2><p>Gere uma base de treino profissional e revise antes de salvar.</p></div><button class="icon-btn" onclick="closePro5Modal()">×</button></div>
    <div class="pro5-smart-note"><strong>Sugestão assistida</strong><span>O FITCOACH monta a estrutura; você continua decidindo cargas, limitações e ajustes individuais.</span></div>
    <div class="pro5-form-grid">
      <div><label>Aluno</label><select id="pro5Student">${students.map(s=>`<option value="${s.id}" ${s.id===selected.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
      <div><label>Dias por semana</label><select id="pro5Days"><option value="3">3 dias</option><option value="4" selected>4 dias</option><option value="5">5 dias</option><option value="6">6 dias</option></select></div>
      <div><label>Duração média</label><select id="pro5Duration"><option value="45">45 min</option><option value="60" selected>60 min</option><option value="75">75 min</option></select></div>
      <div><label>Experiência</label><select id="pro5Level"><option value="beginner">Iniciante</option><option value="intermediate" selected>Intermediário</option><option value="advanced">Avançado</option></select></div>
      <div class="pro5-wide"><label>Foco</label><select id="pro5Goal"><option value="auto">Usar objetivo do aluno</option><option value="hypertrophy">Hipertrofia</option><option value="fatloss">Emagrecimento/condicionamento</option><option value="strength">Força</option><option value="general">Saúde geral</option></select></div>
    </div>
    <div class="actions pro5-actions"><button class="btn sec" onclick="closePro5Modal()">Cancelar</button><button class="btn" id="pro5Generate">Gerar plano</button></div>`)
  document.querySelector('#pro5Generate').onclick=()=>previewPlan(students)
}

function previewPlan(students){
  const student=students.find(s=>s.id===document.querySelector('#pro5Student').value)
  const days=Number(document.querySelector('#pro5Days').value)
  const duration=Number(document.querySelector('#pro5Duration').value)
  const level=document.querySelector('#pro5Level').value
  const goalValue=document.querySelector('#pro5Goal').value
  const goal=goalValue==='auto'?inferGoal(student.goal||''):goalValue
  const plan=buildPlan(student,days,duration,level,goal)
  const goalLabel={hypertrophy:'Hipertrofia',fatloss:'Emagrecimento/condicionamento',strength:'Força',general:'Saúde geral'}[goal]
  openModal(`<div class="pro5-head"><div><span class="eyebrow">PLANO GERADO</span><h2>${esc(student.name)}</h2><p>${days}x por semana • ${duration} min • ${goalLabel}</p></div><button class="icon-btn" onclick="closePro5Modal()">×</button></div>
    <div class="pro5-plan-grid">${plan.map((w,idx)=>`<article class="pro5-workout"><div class="pro5-workout-title"><span>${String(idx+1).padStart(2,'0')}</span><h3>${esc(w.name)}</h3></div><ol>${w.exercises.map(e=>`<li><strong>${esc(e.exercise_name)}</strong><small>${e.sets} séries • ${esc(e.reps)} • ${e.rest_seconds}s descanso</small></li>`).join('')}</ol></article>`).join('')}</div>
    <div class="pro5-review"><strong>Antes de salvar:</strong> revise restrições, técnica, volume e cargas de acordo com a avaliação do aluno.</div>
    <div class="actions pro5-actions"><button class="btn sec" id="pro5Back">Ajustar</button><button class="btn" id="pro5Save">Salvar ${plan.length} treinos</button></div>`)
  document.querySelector('#pro5Back').onclick=()=>openAssistant(student.id)
  document.querySelector('#pro5Save').onclick=()=>savePlan(student,plan)
}

async function savePlan(student,plan){
  const user=await sessionUser();if(!user)return toast('Sessão expirada. Entre novamente.')
  const button=document.querySelector('#pro5Save');button.disabled=true;button.textContent='Salvando...'
  let saved=0
  for(const workout of plan){
    const {data:w,error}=await supabase.from('workouts').insert({trainer_id:user.id,student_id:student.id,name:workout.name}).select('id').single()
    if(error){button.disabled=false;button.textContent=`Salvar ${plan.length} treinos`;return toast(`Erro ao criar ${workout.name}: ${error.message}`)}
    const rows=workout.exercises.map(e=>({...e,workout_id:w.id}))
    const {error:exerciseError}=await supabase.from('workout_exercises').insert(rows)
    if(exerciseError){
      await supabase.from('workouts').delete().eq('id',w.id)
      button.disabled=false;button.textContent=`Salvar ${plan.length} treinos`
      return toast(`Erro nos exercícios de ${workout.name}: ${exerciseError.message}`)
    }
    saved++
  }
  closePro5Modal();toast(`${saved} treinos criados para ${student.name}.`)
  setTimeout(()=>document.querySelector('[data-page="workouts"]')?.click(),450)
}

function daysSince(value){
  if(!value)return null
  return Math.floor((Date.now()-new Date(value).getTime())/86400000)
}

async function openInsights(studentId){
  openModal('<div class="pro5-loading">Analisando aluno...</div>')
  const [{data:student,error:studentError},{data:history,error:historyError},{data:progress,error:progressError},{count:workoutCount,error:workoutError}]=await Promise.all([
    supabase.from('students').select('id,name,goal,weight_kg,waist_cm').eq('id',studentId).single(),
    supabase.from('workout_history').select('completed_at,workout_name').eq('student_id',studentId).order('completed_at',{ascending:false}).limit(80),
    supabase.from('progress_logs').select('weight_kg,waist_cm,created_at').eq('student_id',studentId).order('created_at',{ascending:false}).limit(10),
    supabase.from('workouts').select('*',{count:'exact',head:true}).eq('student_id',studentId)
  ])
  const error=studentError||historyError||progressError||workoutError
  if(error){closePro5Modal();return toast(error.message)}
  const now=Date.now(), week=7*86400000, month=30*86400000
  const last7=(history||[]).filter(h=>now-new Date(h.completed_at).getTime()<=week).length
  const last30=(history||[]).filter(h=>now-new Date(h.completed_at).getTime()<=month).length
  const latest=progress?.[0], previous=progress?.[1]
  const weightDelta=latest?.weight_kg!=null&&previous?.weight_kg!=null?Number(latest.weight_kg)-Number(previous.weight_kg):null
  const waistDelta=latest?.waist_cm!=null&&previous?.waist_cm!=null?Number(latest.waist_cm)-Number(previous.waist_cm):null
  const inactivity=daysSince(history?.[0]?.completed_at)
  const suggestions=[]
  if(!workoutCount)suggestions.push('Criar a primeira ficha de treino para este aluno.')
  if(inactivity==null)suggestions.push('Ainda não há treino concluído; alinhe o início da rotina.')
  else if(inactivity>=7)suggestions.push(`Último treino há ${inactivity} dias; vale fazer um contato de acompanhamento.`)
  if(last7>=3)suggestions.push('Boa consistência nesta semana; mantenha a progressão planejada.')
  if(progress?.length<2)suggestions.push('Registre uma nova avaliação para liberar comparação de medidas.')
  if(!suggestions.length)suggestions.push('Acompanhamento em dia. Revise cargas e execução no próximo contato.')
  const fmtDelta=(v,unit)=>v==null?'Sem comparação':`${v>0?'+':''}${v.toFixed(1)} ${unit} desde a avaliação anterior`
  openModal(`<div class="pro5-head"><div><span class="eyebrow">INSIGHTS DO ALUNO</span><h2>${esc(student.name)}</h2><p>${esc(student.goal||'Objetivo não informado')}</p></div><button class="icon-btn" onclick="closePro5Modal()">×</button></div>
    <div class="pro5-insight-grid">
      <div class="pro5-kpi"><span>Treinos 7 dias</span><strong>${last7}</strong><small>${last7>=3?'Boa frequência':'Acompanhar frequência'}</small></div>
      <div class="pro5-kpi"><span>Treinos 30 dias</span><strong>${last30}</strong><small>${workoutCount||0} fichas disponíveis</small></div>
      <div class="pro5-kpi"><span>Peso</span><strong>${latest?.weight_kg??student.weight_kg??'-'}<small> kg</small></strong><small>${fmtDelta(weightDelta,'kg')}</small></div>
      <div class="pro5-kpi"><span>Cintura</span><strong>${latest?.waist_cm??student.waist_cm??'-'}<small> cm</small></strong><small>${fmtDelta(waistDelta,'cm')}</small></div>
    </div>
    <section class="pro5-suggestions"><span class="eyebrow">PRÓXIMAS AÇÕES</span><h3>O que merece atenção</h3>${suggestions.map(s=>`<div class="pro5-suggestion">✓ ${esc(s)}</div>`).join('')}</section>
    <div class="actions pro5-actions"><button class="btn sec" data-pro5-smart="${student.id}">Gerar plano</button><button class="btn" onclick="closePro5Modal()">Concluir</button></div>`)
  document.querySelector('[data-pro5-smart]').onclick=()=>openAssistant(student.id)
}

function enhanceHome(){
  const quick=document.querySelector('.quick-actions')
  if(quick&&!quick.querySelector('#pro5SmartHome')){
    const b=document.createElement('button');b.className='btn pro5-smart-btn';b.id='pro5SmartHome';b.type='button';b.innerHTML='✦ Assistente de treinos';b.onclick=()=>openAssistant();quick.appendChild(b)
  }
  const badge=document.querySelector('.version-badge');if(badge)badge.textContent='v5'
}

function enhanceStudentCards(){
  document.querySelectorAll('#content .item-card').forEach(card=>{
    const anchor=card.querySelector('[data-workout]'),actions=card.querySelector('.actions')
    if(!anchor||!actions)return
    const id=anchor.dataset.workout
    if(!actions.querySelector('[data-pro5-insights]')){
      const b=document.createElement('button');b.className='btn ghost';b.type='button';b.textContent='Insights';b.dataset.pro5Insights=id;b.onclick=()=>openInsights(id);actions.appendChild(b)
    }
    if(!actions.querySelector('[data-pro5-smart]')){
      const b=document.createElement('button');b.className='btn pro5-mini-smart';b.type='button';b.textContent='✦ Smart';b.dataset.pro5Smart=id;b.onclick=()=>openAssistant(id);actions.appendChild(b)
    }
  })
}

function enhance(){enhanceHome();enhanceStudentCards()}
function scheduleEnhance(){
  if(scheduled)return;scheduled=true
  setTimeout(()=>{scheduled=false;try{enhance()}catch(e){console.warn('FITCOACH pro5:',e)}},140)
}
new MutationObserver(scheduleEnhance).observe(document.documentElement,{subtree:true,childList:true})
window.addEventListener('focus',scheduleEnhance)
scheduleEnhance()
