import './pro-level6.css'
import { supabase } from './supabase'

const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
let scheduled=false
let lastGeneration=null

function toast(message,type='ok'){
  document.querySelector('#pro6Toast')?.remove()
  const el=document.createElement('div')
  el.id='pro6Toast';el.className=`pro6-toast ${type}`;el.textContent=message
  document.body.appendChild(el)
  setTimeout(()=>el.remove(),3600)
}

function openModal(html){
  document.querySelector('#pro6Modal')?.remove()
  const wrap=document.createElement('div')
  wrap.id='pro6Modal';wrap.className='pro6-modal'
  wrap.innerHTML=`<div class="pro6-card">${html}</div>`
  wrap.onclick=e=>{if(e.target===wrap)wrap.remove()}
  document.body.appendChild(wrap)
}
window.closePro6Modal=()=>document.querySelector('#pro6Modal')?.remove()

async function currentSession(){
  const {data}=await supabase.auth.getSession()
  return data.session||null
}

async function loadStudents(){
  const {data,error}=await supabase.from('students').select('id,name,goal').order('name')
  if(error)throw error
  return data||[]
}

async function openAIStudio(studentId='',seed=''){
  let students
  try{students=await loadStudents()}catch(error){return toast(error.message,'error')}
  if(!students.length)return toast('Cadastre um aluno antes de usar a IA.','error')
  const selected=students.find(s=>s.id===studentId)||students[0]
  openModal(`<div class="pro6-head">
      <div><span class="pro6-ai-badge">✦ NÍVEL 6 • IA</span><h2>FITCOACH AI Studio</h2><p>Descreva o treino em linguagem natural. A IA usa o contexto do aluno e devolve uma ficha pronta para sua revisão.</p></div>
      <button class="icon-btn" onclick="closePro6Modal()" aria-label="Fechar">×</button>
    </div>
    <div class="pro6-security"><span>🔒</span><div><strong>IA protegida</strong><p>A geração acontece no servidor e exige sua sessão de personal. Revise técnica, restrições e cargas antes de salvar.</p></div></div>
    <div class="pro6-form-grid">
      <div><label>Aluno</label><select id="pro6Student">${students.map(s=>`<option value="${s.id}" ${s.id===selected.id?'selected':''}>${esc(s.name)}${s.goal?` • ${esc(s.goal)}`:''}</option>`).join('')}</select></div>
      <div class="pro6-wide"><label>O que você quer montar?</label><textarea id="pro6Prompt" rows="6" maxlength="2500" placeholder="Ex.: Monte um treino de hipertrofia 4x por semana, sessões de 60 minutos, foco maior em costas e ombros. Evite levantamento terra."></textarea><div class="pro6-counter"><span id="pro6Count">0</span>/2500</div></div>
    </div>
    <div class="pro6-chips">
      <button type="button" data-pro6-seed="Monte uma ficha de hipertrofia 4x por semana, com sessões de aproximadamente 60 minutos e progressão equilibrada.">Hipertrofia 4x</button>
      <button type="button" data-pro6-seed="Monte uma ficha de emagrecimento e condicionamento 3x por semana, com musculação e descansos moderados.">Emagrecimento 3x</button>
      <button type="button" data-pro6-seed="Monte uma ficha de força 4x por semana, priorizando exercícios compostos e descansos maiores.">Força 4x</button>
      <button type="button" data-pro6-seed="Monte um treino 3x por semana para fazer em casa, usando somente halteres e peso corporal.">Treino em casa</button>
    </div>
    <div class="actions pro6-actions"><button class="btn sec" onclick="closePro6Modal()">Cancelar</button><button class="btn pro6-generate" id="pro6Generate">✦ Gerar com IA</button></div>`)

  const textarea=document.querySelector('#pro6Prompt')
  textarea.value=seed
  const updateCount=()=>document.querySelector('#pro6Count').textContent=String(textarea.value.length)
  updateCount();textarea.oninput=updateCount
  document.querySelectorAll('[data-pro6-seed]').forEach(button=>button.onclick=()=>{textarea.value=button.dataset.pro6Seed;updateCount();textarea.focus()})
  document.querySelector('#pro6Generate').onclick=()=>generateWithAI(students)
}

async function generateWithAI(students){
  const button=document.querySelector('#pro6Generate')
  const studentId=document.querySelector('#pro6Student')?.value
  const prompt=document.querySelector('#pro6Prompt')?.value.trim()||''
  const student=students.find(s=>s.id===studentId)
  if(prompt.length<10)return toast('Descreva melhor o treino que deseja.','error')

  const session=await currentSession()
  if(!session)return toast('Sua sessão expirou. Entre novamente.','error')

  button.disabled=true;button.textContent='✦ Analisando aluno e montando ficha...'
  try{
    const response=await fetch('/api/ai-workout',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`},
      body:JSON.stringify({studentId,prompt})
    })
    const data=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(data.error||'Não foi possível gerar o treino.')
    lastGeneration={student,prompt,plan:data.plan,model:data.model}
    renderAIPlan(lastGeneration)
  }catch(error){
    button.disabled=false;button.textContent='✦ Gerar com IA'
    toast(error.message||'Erro ao gerar treino com IA.','error')
  }
}

function renderAIPlan(generation){
  const {student,prompt,plan}=generation
  const blocked=plan.safety_status!=='ready'
  const warnings=plan.warnings||[]
  const rationale=plan.rationale||[]
  openModal(`<div class="pro6-head">
      <div><span class="pro6-ai-badge">✦ PLANO GERADO COM IA</span><h2>${esc(plan.title)}</h2><p>${esc(student.name)} • ${esc(plan.summary)}</p></div>
      <button class="icon-btn" onclick="closePro6Modal()" aria-label="Fechar">×</button>
    </div>
    <div class="pro6-status ${blocked?'review':'ready'}"><strong>${blocked?'⚠ Revisão profissional obrigatória':'✓ Pronto para revisão do personal'}</strong><span>${blocked?'A IA identificou um contexto que não deve ser convertido automaticamente em prescrição.':'Edite qualquer campo abaixo antes de salvar.'}</span></div>
    ${warnings.length?`<section class="pro6-warning-box"><span class="eyebrow">ATENÇÃO</span>${warnings.map(w=>`<p>• ${esc(w)}</p>`).join('')}</section>`:''}
    ${rationale.length?`<details class="pro6-rationale"><summary>Por que a IA montou assim?</summary>${rationale.map(r=>`<p>• ${esc(r)}</p>`).join('')}</details>`:''}
    ${plan.workouts?.length?`<div class="pro6-plan-list">${plan.workouts.map((workout,wi)=>workoutEditor(workout,wi)).join('')}</div>`:'<div class="pro6-empty"><strong>Nenhuma ficha foi gerada.</strong><p>Revise o aviso acima e faça uma avaliação profissional antes de continuar.</p></div>'}
    <section class="pro6-adjust"><label>Ajustar com IA</label><div><input id="pro6Adjustment" maxlength="700" placeholder="Ex.: reduza o volume de pernas e inclua mais deltoide lateral"><button class="btn sec" id="pro6Regenerate">✦ Refazer</button></div></section>
    <div class="actions pro6-actions"><button class="btn sec" id="pro6Back">Novo pedido</button>${!blocked&&plan.workouts?.length?'<button class="btn pro6-save" id="pro6Save">Salvar fichas no aluno</button>':''}</div>`)

  document.querySelector('#pro6Back').onclick=()=>openAIStudio(student.id,prompt)
  document.querySelector('#pro6Regenerate').onclick=async()=>{
    const adjustment=document.querySelector('#pro6Adjustment').value.trim()
    if(adjustment.length<5)return toast('Digite o ajuste que deseja.','error')
    await openAIStudio(student.id,`${prompt}\n\nAjuste adicional: ${adjustment}`)
    setTimeout(()=>document.querySelector('#pro6Generate')?.click(),60)
  }
  if(document.querySelector('#pro6Save'))document.querySelector('#pro6Save').onclick=()=>saveGeneratedPlan(student.id)
}

function workoutEditor(workout,wi){
  return `<article class="pro6-workout-edit" data-workout-index="${wi}">
    <div class="pro6-workout-head"><span>${String(wi+1).padStart(2,'0')}</span><div><label>Nome da ficha</label><input class="pro6-workout-name" maxlength="90" value="${esc(workout.name)}"><small>${esc(workout.focus||'')}</small></div></div>
    <div class="pro6-exercises">${workout.exercises.map((exercise,ei)=>`<div class="pro6-exercise" data-exercise-index="${ei}">
      <div class="pro6-exercise-name"><label>Exercício</label><input data-field="name" maxlength="110" value="${esc(exercise.exercise_name)}">${exercise.notes?`<small>${esc(exercise.notes)}</small>`:''}</div>
      <div><label>Séries</label><input data-field="sets" type="number" min="1" max="8" value="${Number(exercise.sets)||3}"></div>
      <div><label>Reps</label><input data-field="reps" maxlength="40" value="${esc(exercise.reps)}"></div>
      <div><label>Carga</label><input data-field="load" maxlength="40" value="${esc(exercise.load||'') }" placeholder="Definir depois"></div>
      <div><label>Descanso</label><input data-field="rest" type="number" min="15" max="300" value="${Number(exercise.rest_seconds)||60}"></div>
    </div>`).join('')}</div>
  </article>`
}

function collectEditedPlan(){
  return [...document.querySelectorAll('.pro6-workout-edit')].map((workout,wi)=>({
    name:workout.querySelector('.pro6-workout-name').value.trim()||`Treino ${wi+1}`,
    exercises:[...workout.querySelectorAll('.pro6-exercise')].map((row,ei)=>({
      exercise_name:row.querySelector('[data-field="name"]').value.trim()||'Exercício',
      sets:Math.max(1,Math.min(8,parseInt(row.querySelector('[data-field="sets"]').value)||3)),
      reps:row.querySelector('[data-field="reps"]').value.trim()||'10',
      load:row.querySelector('[data-field="load"]').value.trim()||null,
      rest_seconds:Math.max(15,Math.min(300,parseInt(row.querySelector('[data-field="rest"]').value)||60)),
      sort_order:ei
    }))
  }))
}

async function saveGeneratedPlan(studentId){
  const plan=collectEditedPlan()
  if(!plan.length)return toast('Nenhuma ficha para salvar.','error')
  const session=await currentSession();if(!session)return toast('Sessão expirada.','error')
  const button=document.querySelector('#pro6Save');button.disabled=true;button.textContent='Salvando fichas...'
  const created=[]
  try{
    for(const workout of plan){
      const {data:w,error}=await supabase.from('workouts').insert({trainer_id:session.user.id,student_id:studentId,name:workout.name}).select('id').single()
      if(error)throw error
      created.push(w.id)
      const rows=workout.exercises.map(exercise=>({...exercise,workout_id:w.id}))
      const {error:exerciseError}=await supabase.from('workout_exercises').insert(rows)
      if(exerciseError)throw exerciseError
    }
    closePro6Modal();toast(`${plan.length} ${plan.length===1?'ficha criada':'fichas criadas'} com revisão do personal.`)
    setTimeout(()=>document.querySelector('[data-page="workouts"]')?.click(),450)
  }catch(error){
    if(created.length){
      await supabase.from('workout_exercises').delete().in('workout_id',created)
      await supabase.from('workouts').delete().in('id',created)
    }
    button.disabled=false;button.textContent='Salvar fichas no aluno'
    toast(error.message||'Não foi possível salvar as fichas.','error')
  }
}

function enhanceHome(){
  const quick=document.querySelector('.quick-actions')
  if(quick&&!quick.querySelector('#pro6AIHome')){
    const b=document.createElement('button');b.id='pro6AIHome';b.type='button';b.className='btn pro6-ai-main';b.innerHTML='✦ Criar treino com IA';b.onclick=()=>openAIStudio();quick.appendChild(b)
  }
}

function enhanceStudentCards(){
  document.querySelectorAll('#content .item-card').forEach(card=>{
    const anchor=card.querySelector('[data-workout]'),actions=card.querySelector('.actions')
    if(!anchor||!actions)return
    const id=anchor.dataset.workout
    if(actions.querySelector('[data-pro6-ai]'))return
    const b=document.createElement('button');b.type='button';b.className='btn pro6-ai-card';b.dataset.pro6Ai=id;b.textContent='✦ IA';b.onclick=()=>openAIStudio(id);actions.appendChild(b)
  })
}

function enhanceVersion(){
  const badge=document.querySelector('.version-badge');if(badge)badge.textContent='v6'
}

function enhance(){enhanceVersion();enhanceHome();enhanceStudentCards()}
function scheduleEnhance(){
  if(scheduled)return;scheduled=true
  setTimeout(()=>{scheduled=false;try{enhance()}catch(error){console.warn('FITCOACH pro6:',error)}},120)
}

new MutationObserver(scheduleEnhance).observe(document.documentElement,{subtree:true,childList:true})
window.addEventListener('focus',scheduleEnhance)
scheduleEnhance()
