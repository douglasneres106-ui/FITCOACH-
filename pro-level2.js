import './pro-level2.css'
import { supabase } from './supabase'

const EXERCISE_LIBRARY=[
  'Agachamento livre','Agachamento no smith','Leg press 45°','Cadeira extensora','Mesa flexora','Cadeira flexora','Stiff','Levantamento terra','Passada com halteres','Afundo búlgaro','Panturrilha em pé','Panturrilha sentado',
  'Supino reto','Supino inclinado','Supino com halteres','Crucifixo','Crossover','Peck deck','Desenvolvimento com halteres','Elevação lateral','Elevação frontal','Remada alta','Face pull',
  'Puxada frente','Puxada neutra','Remada baixa','Remada curvada','Remada unilateral','Pulldown','Barra fixa','Rosca direta','Rosca alternada','Rosca martelo','Rosca Scott',
  'Tríceps corda','Tríceps testa','Tríceps francês','Mergulho','Abdominal infra','Abdominal máquina','Prancha','Elevação pélvica','Hip thrust','Abdutora','Adutora'
]

const timers=new Map()
let enhancing=false

function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function toast(message){
  document.querySelector('.pro2-toast')?.remove()
  const el=document.createElement('div');el.className='pro2-toast';el.textContent=message;document.body.appendChild(el)
  setTimeout(()=>el.remove(),2400)
}
function modal(html){
  document.querySelector('#pro2Modal')?.remove()
  const wrap=document.createElement('div');wrap.id='pro2Modal';wrap.className='modal';wrap.innerHTML=`<div class="card modal-card">${html}</div>`;document.body.appendChild(wrap)
}
function closeModal(){document.querySelector('#pro2Modal')?.remove()}
window.pro2CloseModal=closeModal

function currentRole(){
  const text=document.querySelector('.user-meta span')?.textContent||''
  return /personal/i.test(text)?'trainer':/aluno/i.test(text)?'student':null
}

function ensureExerciseLibrary(){
  if(!document.querySelector('#fcExerciseLibrary')){
    const list=document.createElement('datalist');list.id='fcExerciseLibrary';list.innerHTML=EXERCISE_LIBRARY.map(x=>`<option value="${esc(x)}"></option>`).join('');document.body.appendChild(list)
  }
  document.querySelectorAll('.exercise .exercise-name input:not([data-pro2-library])').forEach(input=>{
    input.dataset.pro2Library='1';input.setAttribute('list','fcExerciseLibrary');input.placeholder='Busque ou digite um exercício'
  })
  const box=document.querySelector('#exerciseBox')
  if(box && !document.querySelector('.pro2-library')){
    const panel=document.createElement('div');panel.className='pro2-library';panel.innerHTML=`<div class="pro2-library-head"><strong>Biblioteca rápida</strong><span>Toque para preencher o próximo exercício</span></div><div class="pro2-chips">${EXERCISE_LIBRARY.slice(0,12).map(x=>`<button type="button" class="pro2-chip" data-pro2-exercise="${esc(x)}">${esc(x)}</button>`).join('')}</div>`
    box.parentNode.insertBefore(panel,box)
  }
}

function fillExercise(name){
  const inputs=[...document.querySelectorAll('.exercise .exercise-name input')]
  const target=inputs.find(i=>!i.value.trim())||inputs[inputs.length-1]
  if(target){target.value=name;target.focus();toast(`${name} adicionado`)}
}

function enhanceWorkoutCards(){
  if(currentRole()!=='trainer')return
  document.querySelectorAll('.workout-card').forEach(card=>{
    if(card.dataset.pro2Actions)return
    const view=card.querySelector('[data-view]');if(!view)return
    card.dataset.pro2Actions='1'
    const id=view.dataset.view
    const toolbar=document.createElement('div');toolbar.className='pro2-toolbar';toolbar.innerHTML=`<button class="btn ghost" type="button" data-pro2-edit="${id}">Editar</button><button class="btn sec" type="button" data-view-copy="${id}">Ver ficha</button><button class="btn ghost pro2-danger" type="button" data-pro2-delete="${id}">Excluir</button>`
    view.replaceWith(toolbar)
    toolbar.querySelector('[data-view-copy]').onclick=()=>document.querySelector(`[data-view="${id}"]`)?.click()
    toolbar.querySelector('[data-view-copy]').onclick=()=>openReadonlyWorkout(id)
  })
}

async function openReadonlyWorkout(id){
  const {data:w,error}=await supabase.from('workouts').select('id,name,student_id,students(name),workout_exercises(*)').eq('id',id).single()
  if(error)return alert(error.message)
  const exercises=(w.workout_exercises||[]).sort((a,b)=>a.sort_order-b.sort_order)
  modal(`<div class="modal-head"><div><span class="eyebrow">FICHA DE TREINO</span><h2>${esc(w.name)}</h2><p class="muted">${esc(w.students?.name||'')}</p></div><button class="icon-btn" onclick="pro2CloseModal()">×</button></div><div class="exercise-view">${exercises.map((e,i)=>`<article class="exercise-view-row"><span class="exercise-index">${String(i+1).padStart(2,'0')}</span><div><strong>${esc(e.exercise_name)}</strong><div class="item-meta"><span>${e.sets} séries</span><span>${esc(e.reps)} reps</span><span>Carga ${esc(e.load||'-')}</span><span>${e.rest_seconds}s descanso</span></div></div></article>`).join('')||'<div class="empty">Nenhum exercício cadastrado.</div>'}</div><div class="actions modal-actions"><button class="btn sec" onclick="pro2CloseModal()">Fechar</button></div>`)
}

async function openEditWorkout(id){
  const [{data:w,error},{data:students,error:studentError}]=await Promise.all([
    supabase.from('workouts').select('id,name,student_id,workout_exercises(*)').eq('id',id).single(),
    supabase.from('students').select('id,name').order('name')
  ])
  if(error||studentError)return alert((error||studentError).message)
  const exercises=(w.workout_exercises||[]).sort((a,b)=>a.sort_order-b.sort_order)
  modal(`<div class="modal-head"><div><span class="eyebrow">EDIÇÃO PROFISSIONAL</span><h2>Editar treino</h2></div><button class="icon-btn" onclick="pro2CloseModal()">×</button></div><div class="two"><div><label>Aluno</label><select id="pro2Student">${students.map(s=>`<option value="${s.id}" ${s.id===w.student_id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div><div><label>Nome do treino</label><input id="pro2WorkoutName" value="${esc(w.name)}"></div></div><div class="pro2-section-title"><h3>Exercícios</h3><p>Edite a ficha mantendo séries, repetições, carga e descanso.</p></div><div id="pro2EditExercises">${exercises.map(renderEditExercise).join('')}</div><div class="pro2-edit-actions"><button type="button" class="btn sec compact" id="pro2AddExercise">+ Exercício</button></div><div class="actions modal-actions"><button class="btn sec" onclick="pro2CloseModal()">Cancelar</button><button class="btn" id="pro2SaveWorkout">Salvar alterações</button></div>`)
  ensureEditLibrary()
  document.querySelector('#pro2AddExercise').onclick=()=>{document.querySelector('#pro2EditExercises').insertAdjacentHTML('beforeend',renderEditExercise({exercise_name:'',sets:3,reps:'10',load:'',rest_seconds:60}));ensureEditLibrary()}
  document.querySelector('#pro2EditExercises').onclick=e=>{if(e.target.matches('.pro2-remove-exercise'))e.target.closest('.pro2-edit-grid')?.remove()}
  document.querySelector('#pro2SaveWorkout').onclick=()=>saveEditedWorkout(id)
}

function renderEditExercise(e){return `<div class="pro2-edit-grid"><div class="pro2-edit-name"><label>Exercício</label><input data-pro2-edit-name value="${esc(e.exercise_name||'')}" placeholder="Exercício"></div><div><label>Séries</label><input type="number" value="${Number(e.sets)||3}" placeholder="3"></div><div><label>Reps</label><input value="${esc(e.reps||'10')}" placeholder="10"></div><div><label>Carga</label><input value="${esc(e.load||'')}" placeholder="20kg"></div><div><label>Descanso</label><input type="number" value="${Number(e.rest_seconds)||60}" placeholder="60"></div><button class="pro2-remove-exercise" type="button" title="Remover">×</button></div>`}
function ensureEditLibrary(){
  if(!document.querySelector('#fcExerciseLibrary')){const list=document.createElement('datalist');list.id='fcExerciseLibrary';list.innerHTML=EXERCISE_LIBRARY.map(x=>`<option value="${esc(x)}"></option>`).join('');document.body.appendChild(list)}
  document.querySelectorAll('[data-pro2-edit-name]').forEach(i=>i.setAttribute('list','fcExerciseLibrary'))
}

async function saveEditedWorkout(id){
  const button=document.querySelector('#pro2SaveWorkout'),name=document.querySelector('#pro2WorkoutName').value.trim(),student_id=document.querySelector('#pro2Student').value
  if(!name)return alert('Dê um nome ao treino.')
  const rows=[...document.querySelectorAll('.pro2-edit-grid')].map((r,i)=>{const x=r.querySelectorAll('input');return{workout_id:id,exercise_name:x[0].value.trim()||'Exercício',sets:+x[1].value||3,reps:x[2].value.trim()||'10',load:x[3].value.trim()||null,rest_seconds:parseInt(x[4].value)||60,sort_order:i}})
  if(!rows.length)return alert('Mantenha pelo menos um exercício no treino.')
  button.disabled=true;button.textContent='Salvando...'
  const {error}=await supabase.from('workouts').update({name,student_id}).eq('id',id)
  if(error){button.disabled=false;button.textContent='Salvar alterações';return alert(error.message)}
  const {error:deleteError}=await supabase.from('workout_exercises').delete().eq('workout_id',id)
  if(deleteError){button.disabled=false;button.textContent='Salvar alterações';return alert(deleteError.message)}
  const {error:insertError}=await supabase.from('workout_exercises').insert(rows)
  if(insertError){button.disabled=false;button.textContent='Salvar alterações';return alert(insertError.message)}
  closeModal();toast('Treino atualizado');refreshWorkouts()
}

async function deleteWorkout(id){
  const {count,error:historyError}=await supabase.from('workout_history').select('*',{count:'exact',head:true}).eq('workout_id',id)
  if(historyError)return alert(historyError.message)
  if(count>0)return alert('Este treino já possui histórico concluído. Para proteger os registros do aluno, ele não pode ser excluído. Você ainda pode editá-lo.')
  if(!confirm('Excluir este treino permanentemente?'))return
  const {error:e1}=await supabase.from('workout_exercises').delete().eq('workout_id',id);if(e1)return alert(e1.message)
  const {error:e2}=await supabase.from('workouts').delete().eq('id',id);if(e2)return alert(e2.message)
  toast('Treino excluído');refreshWorkouts()
}
function refreshWorkouts(){setTimeout(()=>document.querySelector('[data-page="workouts"]')?.click(),100)}

function enhanceRestTimers(){
  const modalEl=document.querySelector('#modal')
  if(!modalEl||!modalEl.querySelector('#finishWorkout'))return
  modalEl.querySelectorAll('.exercise-view-row:not([data-pro2-timer])').forEach((row,index)=>{
    const match=row.textContent.match(/(\d+)s\s+descanso/i);if(!match)return
    row.dataset.pro2Timer='1';const seconds=parseInt(match[1])||60
    const btn=document.createElement('button');btn.type='button';btn.className='pro2-timer';btn.dataset.timerKey=`${Date.now()}-${index}`;btn.dataset.seconds=seconds;btn.textContent=`⏱ ${seconds}s`;row.appendChild(btn)
  })
}
function startTimer(button){
  const key=button.dataset.timerKey;clearInterval(timers.get(key));let remaining=parseInt(button.dataset.seconds)||60
  button.classList.remove('done');button.classList.add('running');button.textContent=`⏱ ${remaining}s`
  const tick=()=>{remaining--;if(remaining<=0){clearInterval(timers.get(key));timers.delete(key);button.classList.remove('running');button.classList.add('done');button.textContent='Pronto ✓';navigator.vibrate?.([120,80,120]);setTimeout(()=>{if(button.isConnected){button.classList.remove('done');button.textContent=`⏱ ${button.dataset.seconds}s`}},3000);return}button.textContent=`⏱ ${remaining}s`}
  timers.set(key,setInterval(tick,1000))
}

function chartMarkup(rows,key,label,unit){
  const values=rows.map((r,i)=>({i,v:Number(r[key]),date:r.created_at})).filter(x=>Number.isFinite(x.v)&&x.v>0)
  if(values.length<2)return `<div class="pro2-chart-card"><div class="pro2-chart-head"><span>${label}</span></div><div class="pro2-chart-empty">Registre pelo menos duas medidas para gerar o gráfico.</div></div>`
  const width=620,height=190,pad=24,min=Math.min(...values.map(x=>x.v)),max=Math.max(...values.map(x=>x.v)),span=Math.max(max-min,1)
  const points=values.map((x,i)=>{const px=pad+(i*(width-pad*2))/Math.max(values.length-1,1),py=height-pad-((x.v-min)/span)*(height-pad*2);return{x:px,y:py,v:x.v}})
  const poly=points.map(p=>`${p.x},${p.y}`).join(' '),area=`${pad},${height-pad} ${poly} ${width-pad},${height-pad}`
  const last=values[values.length-1].v,first=values[0].v,delta=(last-first).toFixed(1)
  return `<div class="pro2-chart-card"><div class="pro2-chart-head"><span>${label}</span><div><strong>${last.toFixed(1)}</strong> <small>${unit}</small></div></div><svg class="pro2-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfico de ${label.toLowerCase()}"><line class="pro2-chart-grid" x1="${pad}" y1="${height/2}" x2="${width-pad}" y2="${height/2}"></line><polygon class="pro2-chart-area" points="${area}"></polygon><polyline class="pro2-chart-line" points="${poly}"></polyline>${points.map(p=>`<circle class="pro2-chart-dot" cx="${p.x}" cy="${p.y}" r="5"></circle>`).join('')}</svg><div class="item-meta"><span>${values.length} registros</span><span class="pro2-delta ${Number(delta)<=0?'down':'up'}">Variação ${Number(delta)>0?'+':''}${delta} ${unit}</span></div></div>`
}

async function enhanceStudentProgress(){
  if(currentRole()!=='student'||document.querySelector('[data-pro2-charts]'))return
  const heading=[...document.querySelectorAll('h1')].find(h=>/Minha evolução/i.test(h.textContent));if(!heading)return
  const {data:{session}}=await supabase.auth.getSession();if(!session)return
  const {data:student}=await supabase.from('students').select('id').eq('user_id',session.user.id).maybeSingle();if(!student)return
  const {data:logs,error}=await supabase.from('progress_logs').select('*').eq('student_id',student.id).order('created_at',{ascending:true});if(error||!logs)return
  const wrap=document.createElement('section');wrap.dataset.pro2Charts='1';wrap.innerHTML=`<div class="pro2-section-title"><h3>Gráficos de progresso</h3><p>Visualize a tendência das suas medidas ao longo do tempo.</p></div><div class="pro2-chart-wrap">${chartMarkup(logs,'weight_kg','Peso','kg')}${chartMarkup(logs,'waist_cm','Cintura','cm')}</div>`
  const metrics=document.querySelector('.student-metrics');(metrics||heading.closest('.page-head'))?.insertAdjacentElement('afterend',wrap)
}

async function enhanceTrainerProgress(){
  if(currentRole()!=='trainer'||document.querySelector('[data-pro2-summary]'))return
  const heading=[...document.querySelectorAll('h1')].find(h=>/^Evolução$/i.test(h.textContent.trim()));if(!heading)return
  const {data,error}=await supabase.from('progress_logs').select('student_id,weight_kg,waist_cm,created_at,students(name)').order('created_at',{ascending:true}).limit(200);if(error||!data?.length)return
  const groups=new Map();data.forEach(r=>{const key=r.student_id||r.students?.name;if(!key)return;const arr=groups.get(key)||[];arr.push(r);groups.set(key,arr)})
  let improved=0,tracked=groups.size
  groups.forEach(arr=>{const weights=arr.map(x=>Number(x.weight_kg)).filter(Number.isFinite);if(weights.length>1&&weights[weights.length-1]!==weights[0])improved++})
  const latest=data[data.length-1]
  const wrap=document.createElement('section');wrap.dataset.pro2Summary='1';wrap.innerHTML=`<div class="pro2-section-title"><h3>Resumo de acompanhamento</h3><p>Indicadores rápidos dos registros mais recentes.</p></div><div class="pro2-summary"><div class="pro2-summary-card"><span>Alunos acompanhados</span><strong>${tracked}</strong></div><div class="pro2-summary-card"><span>Registros analisados</span><strong>${data.length}</strong></div><div class="pro2-summary-card"><span>Último registro</span><strong>${latest?new Date(latest.created_at).toLocaleDateString('pt-BR'):'-'}</strong></div></div>`
  heading.closest('.page-head')?.insertAdjacentElement('afterend',wrap)
}

function enhance(){
  if(enhancing)return;enhancing=true
  try{ensureExerciseLibrary();enhanceWorkoutCards();enhanceRestTimers();enhanceStudentProgress();enhanceTrainerProgress()}finally{enhancing=false}
}

document.addEventListener('click',e=>{
  const chip=e.target.closest('[data-pro2-exercise]');if(chip){fillExercise(chip.dataset.pro2Exercise);return}
  const edit=e.target.closest('[data-pro2-edit]');if(edit){openEditWorkout(edit.dataset.pro2Edit);return}
  const del=e.target.closest('[data-pro2-delete]');if(del){deleteWorkout(del.dataset.pro2Delete);return}
  const timer=e.target.closest('.pro2-timer');if(timer){startTimer(timer);return}
})

const observer=new MutationObserver(()=>queueMicrotask(enhance))
observer.observe(document.documentElement,{childList:true,subtree:true})
window.addEventListener('load',enhance)
enhance()
