import './style.css'
import { supabase } from './supabase'

const app = document.querySelector('#app')
let session = null
let profile = null
let page = 'home'

function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function money(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0)}
function showError(msg){alert(msg?.message || msg || 'Ocorreu um erro.')}
function modal(html){document.body.insertAdjacentHTML('beforeend',`<div id="modal" class="modal"><div class="card">${html}</div></div>`)}
function closeModal(){document.querySelector('#modal')?.remove()}
window.closeModal=closeModal

async function init(){
  const { data } = await supabase.auth.getSession()
  session = data.session
  supabase.auth.onAuthStateChange((_event,newSession)=>{session=newSession;boot()})
  await boot()
}

async function boot(){
  if(!session){renderAuth();return}
  const {data,error}=await supabase.from('profiles').select('*').eq('id',session.user.id).single()
  if(error){app.innerHTML=`<div class="login"><div class="card"><h2>Perfil não encontrado</h2><p class="muted">${esc(error.message)}</p><button class="btn" id="logoutBtn">Sair</button></div></div>`;document.querySelector('#logoutBtn').onclick=()=>supabase.auth.signOut();return}
  profile=data
  if(profile.role==='student'){
    const linked = await getStudentSelf()
    if(!linked){renderClaim();return}
  }
  renderShell()
}

function renderAuth(mode='login'){
  const signup=mode==='signup'
  app.innerHTML=`<section class="login"><div class="card">
    <div class="brand">FIT<b>COACH</b></div>
    <p class="muted">Versão online V3</p>
    <div class="tabs">
      <button class="btn ${signup?'sec':''}" id="tabLogin">Entrar</button>
      <button class="btn ${signup?'':'sec'}" id="tabSignup">Criar conta</button>
    </div>
    ${signup?`<label>Nome</label><input id="name" placeholder="Seu nome">
      <label>Tipo de conta</label><select id="role"><option value="trainer">Personal</option><option value="student">Aluno</option></select>`:''}
    <label>E-mail</label><input id="email" type="email" autocomplete="email">
    <label>Senha</label><input id="password" type="password" minlength="6" autocomplete="${signup?'new-password':'current-password'}">
    <button class="btn" style="width:100%;margin-top:16px" id="submit">${signup?'Criar conta':'Entrar'}</button>
    <div id="authMsg" style="margin-top:12px"></div>
  </div></section>`
  document.querySelector('#tabLogin').onclick=()=>renderAuth('login')
  document.querySelector('#tabSignup').onclick=()=>renderAuth('signup')
  document.querySelector('#submit').onclick=()=>signup?signUp():signIn()
}

async function signIn(){
  const email=document.querySelector('#email').value.trim(),password=document.querySelector('#password').value
  const {error}=await supabase.auth.signInWithPassword({email,password})
  if(error) document.querySelector('#authMsg').innerHTML=`<div class="notice error">${esc(error.message)}</div>`
}

async function signUp(){
  const email=document.querySelector('#email').value.trim(),password=document.querySelector('#password').value
  const full_name=document.querySelector('#name').value.trim(),role=document.querySelector('#role').value
  if(!full_name)return showError('Digite seu nome.')
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name,role}}})
  if(error)return document.querySelector('#authMsg').innerHTML=`<div class="notice error">${esc(error.message)}</div>`
  document.querySelector('#authMsg').innerHTML=`<div class="notice">${data.session?'Conta criada.':'Conta criada. Confira seu e-mail caso a confirmação esteja ativada no Supabase.'}</div>`
}

async function getStudentSelf(){
  const {data}=await supabase.from('students').select('*').eq('user_id',session.user.id).maybeSingle()
  return data
}

function renderClaim(){
  app.innerHTML=`<section class="login"><div class="card"><div class="brand">FIT<b>COACH</b></div>
    <h2 style="margin-top:20px">Vincular ao seu personal</h2>
    <p class="muted">Peça ao seu personal o código de convite exibido no cadastro do aluno.</p>
    <label>Código de convite</label><input id="invite" placeholder="ABC12345" style="text-transform:uppercase">
    <button class="btn" style="width:100%;margin-top:14px" id="claim">Vincular conta</button>
    <button class="btn sec" style="width:100%;margin-top:8px" id="logout">Sair</button>
  </div></section>`
  document.querySelector('#claim').onclick=claimStudent
  document.querySelector('#logout').onclick=()=>supabase.auth.signOut()
}

async function claimStudent(){
  const code=document.querySelector('#invite').value.trim().toUpperCase()
  const {error}=await supabase.rpc('claim_student',{p_invite_code:code})
  if(error)return showError(error)
  await boot()
}

function navItems(){
  return profile.role==='trainer'
    ? [['home','Painel'],['students','Alunos'],['workouts','Treinos'],['progress','Evolução']]
    : [['home','Meu treino'],['history','Histórico'],['progress','Minha evolução']]
}

function renderShell(){
  app.innerHTML=`<div class="shell">
    <div class="top"><div><div class="brand">FIT<b>COACH</b></div><div class="muted">${esc(profile.full_name)} • ${profile.role==='trainer'?'Personal':'Aluno'}</div></div>
    <button class="btn sec" id="logoutBtn">Sair</button></div>
    <div class="nav">${navItems().map(([p,t])=>`<button class="btn ${page===p?'':'sec'}" data-page="${p}">${t}</button>`).join('')}</div>
    <main id="content"><div class="card">Carregando...</div></main>
  </div>`
  document.querySelector('#logoutBtn').onclick=()=>supabase.auth.signOut()
  document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{page=b.dataset.page;renderShell()})
  renderPage()
}

async function renderPage(){
  if(profile.role==='trainer') await trainerPage()
  else await studentPage()
}

async function trainerPage(){
  const c=document.querySelector('#content')
  if(page==='home'){
    const [{count:students},{count:workouts},{count:history}] = await Promise.all([
      supabase.from('students').select('*',{count:'exact',head:true}),
      supabase.from('workouts').select('*',{count:'exact',head:true}),
      supabase.from('workout_history').select('*',{count:'exact',head:true})
    ])
    c.innerHTML=`<div class="grid">
      <div class="card"><div class="muted">Alunos</div><div class="kpi">${students||0}</div></div>
      <div class="card"><div class="muted">Treinos</div><div class="kpi">${workouts||0}</div></div>
      <div class="card"><div class="muted">Registros</div><div class="kpi">${history||0}</div></div>
      <div class="card"><div class="muted">Plano</div><div class="kpi" style="font-size:20px">MVP</div></div>
    </div><div style="height:18px"></div><div class="notice">Cadastre o aluno, envie o código de convite e depois monte a ficha de treino.</div>`
  }
  if(page==='students') await trainerStudents(c)
  if(page==='workouts') await trainerWorkouts(c)
  if(page==='progress') await trainerProgress(c)
}

async function trainerStudents(c){
  const {data,error}=await supabase.from('students').select('*').order('created_at',{ascending:false})
  if(error)return showError(error)
  c.innerHTML=`<div class="top"><h2>Alunos</h2><button class="btn" id="newStudent">+ Aluno</button></div>
    <div class="list">${data.length?data.map(s=>`<div class="row"><div><b>${esc(s.name)}</b><div class="muted">${esc(s.goal||'Sem objetivo')} • ${s.weight_kg??'-'} kg</div><div class="code">${esc(s.invite_code)}</div><small class="muted">${s.user_id?'Conta vinculada':'Envie este código ao aluno'}</small></div>
    <div class="actions"><button class="btn sec" data-workout="${s.id}">Montar treino</button><button class="btn sec" data-progress="${s.id}">Medidas</button></div></div>`).join(''):`<div class="empty">Nenhum aluno cadastrado.</div>`}</div>`
  document.querySelector('#newStudent').onclick=openStudentForm
  document.querySelectorAll('[data-workout]').forEach(b=>b.onclick=()=>openWorkoutForm(b.dataset.workout))
  document.querySelectorAll('[data-progress]').forEach(b=>b.onclick=()=>openProgressForm(b.dataset.progress))
}

function openStudentForm(){
  modal(`<h2>Novo aluno</h2><div class="two"><div><label>Nome</label><input id="sn"></div><div><label>Objetivo</label><input id="sg" placeholder="Hipertrofia"></div><div><label>Peso (kg)</label><input id="sw" type="number" step="0.1"></div><div><label>Cintura (cm)</label><input id="sc" type="number" step="0.1"></div></div>
  <div class="actions" style="margin-top:14px"><button class="btn sec" onclick="closeModal()">Cancelar</button><button class="btn" id="saveStudent">Salvar</button></div>`)
  document.querySelector('#saveStudent').onclick=saveStudent
}
async function saveStudent(){
  const row={trainer_id:session.user.id,name:document.querySelector('#sn').value.trim(),goal:document.querySelector('#sg').value.trim()||null,weight_kg:+document.querySelector('#sw').value||null,waist_cm:+document.querySelector('#sc').value||null}
  if(!row.name)return showError('Digite o nome.')
  const {error}=await supabase.from('students').insert(row);if(error)return showError(error)
  closeModal();renderPage()
}

async function trainerWorkouts(c){
  const {data,error}=await supabase.from('workouts').select('id,name,student_id,students(name),created_at').order('created_at',{ascending:false})
  if(error)return showError(error)
  c.innerHTML=`<div class="top"><h2>Treinos</h2><button class="btn" id="newWorkout">+ Montar treino</button></div>
  <div class="list">${data.length?data.map(w=>`<div class="row"><div><b>${esc(w.name)}</b><div class="muted">${esc(w.students?.name||'Aluno')}</div></div><button class="btn sec" data-view="${w.id}">Ver ficha</button></div>`).join(''):`<div class="empty">Nenhum treino criado.</div>`}</div>`
  document.querySelector('#newWorkout').onclick=()=>openWorkoutForm()
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>viewWorkout(b.dataset.view,false))
}

async function openWorkoutForm(studentId=''){
  const {data:students,error}=await supabase.from('students').select('id,name').order('name')
  if(error)return showError(error); if(!students.length)return showError('Cadastre um aluno primeiro.')
  modal(`<h2>Montar treino</h2><label>Aluno</label><select id="ws">${students.map(s=>`<option value="${s.id}" ${s.id===studentId?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
  <label>Nome do treino</label><input id="wn" placeholder="Treino A - Peito e Tríceps"><h3 style="margin-top:18px">Exercícios</h3><div id="exerciseBox"></div>
  <button class="btn sec" id="addExercise">+ Exercício</button><div class="actions" style="margin-top:14px"><button class="btn sec" onclick="closeModal()">Cancelar</button><button class="btn" id="saveWorkout">Salvar</button></div>`)
  document.querySelector('#addExercise').onclick=addExerciseRow;document.querySelector('#saveWorkout').onclick=saveWorkout;addExerciseRow()
}
function addExerciseRow(){
  const d=document.createElement('div');d.className='exercise';d.innerHTML=`<input placeholder="Exercício"><input placeholder="Séries"><input placeholder="Reps"><input placeholder="Carga"><input placeholder="Descanso">`;document.querySelector('#exerciseBox').appendChild(d)
}
async function saveWorkout(){
  const student_id=document.querySelector('#ws').value,name=document.querySelector('#wn').value.trim();if(!name)return showError('Dê um nome ao treino.')
  const {data:w,error}=await supabase.from('workouts').insert({trainer_id:session.user.id,student_id,name}).select().single();if(error)return showError(error)
  const rows=[...document.querySelectorAll('.exercise')].map((r,i)=>{const x=r.querySelectorAll('input');return{workout_id:w.id,exercise_name:x[0].value||'Exercício',sets:+x[1].value||3,reps:x[2].value||'10',load:x[3].value||null,rest_seconds:parseInt(x[4].value)||60,sort_order:i}})
  const {error:e}=await supabase.from('workout_exercises').insert(rows);if(e)return showError(e)
  closeModal();page='workouts';renderShell()
}

async function viewWorkout(id,studentMode){
  const {data:w,error}=await supabase.from('workouts').select('id,name,student_id,students(name),workout_exercises(*)').eq('id',id).single();if(error)return showError(error)
  modal(`<h2>${esc(w.name)}</h2><div class="muted">${esc(w.students?.name||'')}</div><div class="list">${(w.workout_exercises||[]).sort((a,b)=>a.sort_order-b.sort_order).map(e=>`<div class="row"><div><b>${esc(e.exercise_name)}</b><div class="muted">${e.sets} séries • ${esc(e.reps)} reps • carga ${esc(e.load||'-')} • descanso ${e.rest_seconds}s</div></div></div>`).join('')}</div>
  <div class="actions" style="margin-top:14px">${studentMode?`<button class="btn" id="finishWorkout">Concluir treino</button>`:''}<button class="btn sec" onclick="closeModal()">Fechar</button></div>`)
  if(studentMode)document.querySelector('#finishWorkout').onclick=()=>finishWorkout(w)
}

async function openProgressForm(studentId){
  modal(`<h2>Registrar evolução</h2><div class="two"><div><label>Peso (kg)</label><input id="pw" type="number" step="0.1"></div><div><label>Cintura (cm)</label><input id="pc" type="number" step="0.1"></div></div><label>Observação</label><textarea id="pn"></textarea><div class="actions" style="margin-top:14px"><button class="btn sec" onclick="closeModal()">Cancelar</button><button class="btn" id="saveProgress">Salvar</button></div>`)
  document.querySelector('#saveProgress').onclick=async()=>{const {error}=await supabase.from('progress_logs').insert({student_id:studentId,weight_kg:+document.querySelector('#pw').value||null,waist_cm:+document.querySelector('#pc').value||null,notes:document.querySelector('#pn').value||null});if(error)return showError(error);closeModal();renderPage()}
}

async function trainerProgress(c){
  const {data,error}=await supabase.from('progress_logs').select('*,students(name)').order('created_at',{ascending:false}).limit(50);if(error)return showError(error)
  c.innerHTML=`<h2>Evolução</h2><div class="list">${data.length?data.map(p=>`<div class="row"><div><b>${esc(p.students?.name)}</b><div class="muted">${new Date(p.created_at).toLocaleDateString('pt-BR')} • ${p.weight_kg??'-'} kg • cintura ${p.waist_cm??'-'} cm</div></div></div>`).join(''):`<div class="empty">Sem registros ainda.</div>`}</div>`
}

async function studentPage(){
  const c=document.querySelector('#content'), s=await getStudentSelf()
  if(page==='home'){
    const {data,error}=await supabase.from('workouts').select('id,name,workout_exercises(*)').eq('student_id',s.id).order('created_at',{ascending:false});if(error)return showError(error)
    c.innerHTML=`<h2>Meus treinos</h2><div class="list">${data.length?data.map(w=>`<div class="row"><div><b>${esc(w.name)}</b><div class="muted">${w.workout_exercises?.length||0} exercícios</div></div><button class="btn" data-start="${w.id}">Abrir treino</button></div>`).join(''):`<div class="empty">Seu personal ainda não cadastrou um treino.</div>`}</div>`
    document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>viewWorkout(b.dataset.start,true))
  }
  if(page==='history'){
    const {data,error}=await supabase.from('workout_history').select('*').eq('student_id',s.id).order('completed_at',{ascending:false});if(error)return showError(error)
    c.innerHTML=`<h2>Histórico</h2><div class="list">${data.length?data.map(h=>`<div class="row"><div><b>${esc(h.workout_name)}</b><div class="muted">${new Date(h.completed_at).toLocaleString('pt-BR')}</div></div><span class="pill">Concluído</span></div>`).join(''):`<div class="empty">Nenhum treino concluído.</div>`}</div>`
  }
  if(page==='progress'){
    const {data,error}=await supabase.from('progress_logs').select('*').eq('student_id',s.id).order('created_at',{ascending:false});if(error)return showError(error)
    c.innerHTML=`<h2>Minha evolução</h2><div class="list">${data.length?data.map(p=>`<div class="row"><div><b>${new Date(p.created_at).toLocaleDateString('pt-BR')}</b><div class="muted">${p.weight_kg??'-'} kg • cintura ${p.waist_cm??'-'} cm</div></div></div>`).join(''):`<div class="empty">Nenhum registro de evolução.</div>`}</div>`
  }
}

async function finishWorkout(w){
  const {error}=await supabase.from('workout_history').insert({student_id:w.student_id,workout_id:w.id,workout_name:w.name});if(error)return showError(error)
  closeModal();page='history';renderShell()
}

init().catch(showError)
