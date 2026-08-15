import './style.css'
import { supabase } from './supabase'

const app = document.querySelector('#app')
let session = null
let profile = null
let page = 'home'

function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function showError(msg){alert(msg?.message || msg || 'Ocorreu um erro.')}
function modal(html){document.body.insertAdjacentHTML('beforeend',`<div id="modal" class="modal"><div class="card modal-card">${html}</div></div>`)}
function closeModal(){document.querySelector('#modal')?.remove()}
function initials(name=''){return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('') || 'FC'}
function formatDate(value,withTime=false){
  if(!value)return '-'
  const d=new Date(value)
  return withTime?d.toLocaleString('pt-BR'):d.toLocaleDateString('pt-BR')
}
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
  if(error){
    app.innerHTML=`<section class="login"><div class="card auth-card"><div class="brand">FIT<b>COACH</b></div><h2>Perfil não encontrado</h2><p class="muted">${esc(error.message)}</p><button class="btn full" id="logoutBtn">Sair</button></div></section>`
    document.querySelector('#logoutBtn').onclick=()=>supabase.auth.signOut()
    return
  }
  profile=data
  if(profile.role==='student'){
    const linked = await getStudentSelf()
    if(!linked){renderClaim();return}
  }
  renderShell()
}

function renderAuth(mode='login'){
  const signup=mode==='signup'
  app.innerHTML=`<section class="login auth-screen">
    <div class="auth-wrap">
      <div class="auth-copy">
        <div class="brand brand-large">FIT<b>COACH</b></div>
        <span class="eyebrow">GESTÃO DE TREINOS</span>
        <h1>Treinos, alunos e evolução em um só lugar.</h1>
        <p>Uma experiência simples para o personal organizar o acompanhamento e para o aluno focar no que importa: treinar e evoluir.</p>
        <div class="auth-features"><span>✓ Acompanhamento</span><span>✓ Treinos personalizados</span><span>✓ Evolução registrada</span></div>
      </div>
      <div class="card auth-card">
        <div class="auth-card-head"><div><span class="eyebrow">${signup?'NOVA CONTA':'BEM-VINDO'}</span><h2>${signup?'Crie seu acesso':'Entre no FITCOACH'}</h2></div><span class="version-badge">v4</span></div>
        <div class="tabs">
          <button class="tab-btn ${signup?'':'active'}" id="tabLogin">Entrar</button>
          <button class="tab-btn ${signup?'active':''}" id="tabSignup">Criar conta</button>
        </div>
        ${signup?`<label>Nome</label><input id="name" placeholder="Seu nome">
          <label>Tipo de conta</label><select id="role"><option value="trainer">Personal</option><option value="student">Aluno</option></select>`:''}
        <label>E-mail</label><input id="email" type="email" autocomplete="email" placeholder="voce@email.com">
        <label>Senha</label><input id="password" type="password" minlength="6" autocomplete="${signup?'new-password':'current-password'}" placeholder="••••••••">
        <button class="btn full auth-submit" id="submit">${signup?'Criar minha conta':'Entrar no FITCOACH'}</button>
        <div id="authMsg" class="auth-msg"></div>
      </div>
    </div>
  </section>`
  document.querySelector('#tabLogin').onclick=()=>renderAuth('login')
  document.querySelector('#tabSignup').onclick=()=>renderAuth('signup')
  document.querySelector('#submit').onclick=()=>signup?signUp():signIn()
}

async function signIn(){
  const button=document.querySelector('#submit')
  const email=document.querySelector('#email').value.trim(),password=document.querySelector('#password').value
  button.disabled=true;button.textContent='Entrando...'
  const {error}=await supabase.auth.signInWithPassword({email,password})
  if(error){
    document.querySelector('#authMsg').innerHTML=`<div class="notice error">${esc(error.message)}</div>`
    button.disabled=false;button.textContent='Entrar no FITCOACH'
  }
}

async function signUp(){
  const button=document.querySelector('#submit')
  const email=document.querySelector('#email').value.trim(),password=document.querySelector('#password').value
  const full_name=document.querySelector('#name').value.trim(),role=document.querySelector('#role').value
  if(!full_name)return showError('Digite seu nome.')
  button.disabled=true;button.textContent='Criando conta...'
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name,role}}})
  if(error){
    document.querySelector('#authMsg').innerHTML=`<div class="notice error">${esc(error.message)}</div>`
    button.disabled=false;button.textContent='Criar minha conta';return
  }
  document.querySelector('#authMsg').innerHTML=`<div class="notice">${data.session?'Conta criada com sucesso.':'Conta criada. Confira seu e-mail caso a confirmação esteja ativada no Supabase.'}</div>`
}

async function getStudentSelf(){
  const {data}=await supabase.from('students').select('*').eq('user_id',session.user.id).maybeSingle()
  return data
}

function renderClaim(){
  app.innerHTML=`<section class="login auth-screen"><div class="card auth-card claim-card">
    <div class="brand">FIT<b>COACH</b></div><span class="eyebrow">VINCULAR CONTA</span>
    <h2>Conecte-se ao seu personal</h2>
    <p class="muted">Digite o código de convite enviado pelo seu personal para liberar seus treinos e evolução.</p>
    <label>Código de convite</label><input id="invite" class="invite-input" placeholder="ABC12345" style="text-transform:uppercase">
    <button class="btn full" id="claim">Vincular conta</button>
    <button class="btn sec full" id="logout">Sair</button>
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
    ? [['home','Painel','⌂'],['students','Alunos','♙'],['workouts','Treinos','◆'],['progress','Evolução','↗']]
    : [['home','Treinos','◆'],['history','Histórico','✓'],['progress','Evolução','↗']]
}

function renderShell(){
  const roleLabel=profile.role==='trainer'?'Personal Trainer':'Aluno'
  app.innerHTML=`<div class="app-frame">
    <header class="app-header">
      <div class="header-inner">
        <div class="brand">FIT<b>COACH</b></div>
        <div class="user-box">
          <div class="avatar">${initials(profile.full_name)}</div>
          <div class="user-meta"><strong>${esc(profile.full_name)}</strong><span>${roleLabel}</span></div>
          <button class="icon-btn" id="logoutBtn" title="Sair" aria-label="Sair">↗</button>
        </div>
      </div>
    </header>
    <div class="shell">
      <nav class="nav">${navItems().map(([p,t,i])=>`<button class="nav-btn ${page===p?'active':''}" data-page="${p}"><span class="nav-icon">${i}</span><span>${t}</span></button>`).join('')}</nav>
      <main id="content"><div class="skeleton-card"></div><div class="skeleton-grid"><div></div><div></div><div></div></div></main>
    </div>
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
    c.innerHTML=`<section class="hero-card">
      <div><span class="eyebrow">PAINEL DO PERSONAL</span><h1>Olá, ${esc(profile.full_name?.split(' ')[0]||'Personal')}.</h1><p>Organize sua carteira de alunos e acompanhe a evolução de forma simples.</p></div>
      <div class="hero-mark">FC</div>
    </section>
    <section class="section-head"><div><span class="eyebrow">RESUMO</span><h2>Visão geral</h2></div><span class="status-dot">Sistema online</span></section>
    <div class="metrics-grid">
      <button class="metric-card" data-go="students"><span class="metric-icon">♙</span><span class="metric-label">Alunos</span><strong>${students||0}</strong><small>Gerenciar alunos →</small></button>
      <button class="metric-card" data-go="workouts"><span class="metric-icon">◆</span><span class="metric-label">Treinos</span><strong>${workouts||0}</strong><small>Ver fichas →</small></button>
      <button class="metric-card" data-go="progress"><span class="metric-icon">↗</span><span class="metric-label">Registros</span><strong>${history||0}</strong><small>Acompanhar evolução →</small></button>
    </div>
    <section class="quick-panel">
      <div><span class="eyebrow">AÇÕES RÁPIDAS</span><h2>O que você quer fazer?</h2><p class="muted">Acesse as tarefas mais usadas sem perder tempo.</p></div>
      <div class="quick-actions"><button class="btn" id="quickStudent">+ Novo aluno</button><button class="btn sec" id="quickWorkout">+ Montar treino</button></div>
    </section>`
    document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{page=b.dataset.go;renderShell()})
    document.querySelector('#quickStudent').onclick=openStudentForm
    document.querySelector('#quickWorkout').onclick=()=>openWorkoutForm()
  }
  if(page==='students') await trainerStudents(c)
  if(page==='workouts') await trainerWorkouts(c)
  if(page==='progress') await trainerProgress(c)
}

async function trainerStudents(c){
  const {data,error}=await supabase.from('students').select('*').order('created_at',{ascending:false})
  if(error)return showError(error)
  c.innerHTML=`<section class="page-head"><div><span class="eyebrow">GESTÃO</span><h1>Alunos</h1><p>Gerencie seus alunos, convites, objetivos e registros.</p></div><button class="btn" id="newStudent">+ Novo aluno</button></section>
    <div class="list">${data.length?data.map(s=>`<article class="row item-card">
      <div class="item-main"><div class="avatar avatar-lg">${initials(s.name)}</div><div><div class="item-title">${esc(s.name)} ${s.user_id?'<span class="pill">Vinculado</span>':'<span class="pill neutral">Convite pendente</span>'}</div><div class="item-meta"><span>${esc(s.goal||'Objetivo não informado')}</span><span>${s.weight_kg??'-'} kg</span>${s.waist_cm?`<span>${s.waist_cm} cm cintura</span>`:''}</div>${!s.user_id?`<div class="invite-code"><span>Código</span><strong>${esc(s.invite_code)}</strong></div>`:''}</div></div>
      <div class="actions"><button class="btn sec" data-workout="${s.id}">Montar treino</button><button class="btn ghost" data-progress="${s.id}">+ Evolução</button></div>
    </article>`).join(''):`<div class="empty"><div class="empty-icon">♙</div><h3>Nenhum aluno ainda</h3><p>Cadastre seu primeiro aluno para começar.</p></div>`}</div>`
  document.querySelector('#newStudent').onclick=openStudentForm
  document.querySelectorAll('[data-workout]').forEach(b=>b.onclick=()=>openWorkoutForm(b.dataset.workout))
  document.querySelectorAll('[data-progress]').forEach(b=>b.onclick=()=>openProgressForm(b.dataset.progress))
}

function openStudentForm(){
  modal(`<div class="modal-head"><div><span class="eyebrow">NOVO CADASTRO</span><h2>Adicionar aluno</h2></div><button class="icon-btn" onclick="closeModal()">×</button></div>
  <p class="muted">Cadastre as informações iniciais. O aluno poderá vincular a conta usando o código de convite.</p>
  <div class="two"><div><label>Nome</label><input id="sn" placeholder="Nome completo"></div><div><label>Objetivo</label><input id="sg" placeholder="Ex.: Hipertrofia"></div><div><label>Peso (kg)</label><input id="sw" type="number" step="0.1" placeholder="80"></div><div><label>Cintura (cm)</label><input id="sc" type="number" step="0.1" placeholder="85"></div></div>
  <div class="actions modal-actions"><button class="btn sec" onclick="closeModal()">Cancelar</button><button class="btn" id="saveStudent">Salvar aluno</button></div>`)
  document.querySelector('#saveStudent').onclick=saveStudent
}

async function saveStudent(){
  const button=document.querySelector('#saveStudent')
  const row={trainer_id:session.user.id,name:document.querySelector('#sn').value.trim(),goal:document.querySelector('#sg').value.trim()||null,weight_kg:+document.querySelector('#sw').value||null,waist_cm:+document.querySelector('#sc').value||null}
  if(!row.name)return showError('Digite o nome.')
  button.disabled=true;button.textContent='Salvando...'
  const {error}=await supabase.from('students').insert(row)
  if(error){button.disabled=false;button.textContent='Salvar aluno';return showError(error)}
  closeModal();renderPage()
}

async function trainerWorkouts(c){
  const {data,error}=await supabase.from('workouts').select('id,name,student_id,students(name),created_at').order('created_at',{ascending:false})
  if(error)return showError(error)
  c.innerHTML=`<section class="page-head"><div><span class="eyebrow">PROGRAMAÇÃO</span><h1>Treinos</h1><p>Crie e consulte as fichas dos seus alunos.</p></div><button class="btn" id="newWorkout">+ Montar treino</button></section>
  <div class="list">${data.length?data.map(w=>`<article class="row item-card workout-card"><div class="item-main"><div class="workout-symbol">◆</div><div><div class="item-title">${esc(w.name)}</div><div class="item-meta"><span>${esc(w.students?.name||'Aluno')}</span><span>Criado em ${formatDate(w.created_at)}</span></div></div></div><button class="btn sec" data-view="${w.id}">Ver ficha</button></article>`).join(''):`<div class="empty"><div class="empty-icon">◆</div><h3>Nenhum treino criado</h3><p>Monte a primeira ficha de treino dos seus alunos.</p></div>`}</div>`
  document.querySelector('#newWorkout').onclick=()=>openWorkoutForm()
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>viewWorkout(b.dataset.view,false))
}

async function openWorkoutForm(studentId=''){
  const {data:students,error}=await supabase.from('students').select('id,name').order('name')
  if(error)return showError(error)
  if(!students.length)return showError('Cadastre um aluno primeiro.')
  modal(`<div class="modal-head"><div><span class="eyebrow">NOVA FICHA</span><h2>Montar treino</h2></div><button class="icon-btn" onclick="closeModal()">×</button></div>
  <div class="two"><div><label>Aluno</label><select id="ws">${students.map(s=>`<option value="${s.id}" ${s.id===studentId?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div><div><label>Nome do treino</label><input id="wn" placeholder="Treino A - Peito e Tríceps"></div></div>
  <div class="form-section-head"><div><h3>Exercícios</h3><p class="muted">Adicione exercícios, séries, repetições, carga e descanso.</p></div><button class="btn sec compact" id="addExercise">+ Exercício</button></div>
  <div id="exerciseBox" class="exercise-box"></div>
  <div class="actions modal-actions"><button class="btn sec" onclick="closeModal()">Cancelar</button><button class="btn" id="saveWorkout">Salvar treino</button></div>`)
  document.querySelector('#addExercise').onclick=addExerciseRow
  document.querySelector('#saveWorkout').onclick=saveWorkout
  addExerciseRow()
}

function addExerciseRow(){
  const d=document.createElement('div')
  d.className='exercise'
  d.innerHTML=`<div class="exercise-name"><label>Exercício</label><input placeholder="Ex.: Supino reto"></div><div><label>Séries</label><input type="number" placeholder="3"></div><div><label>Reps</label><input placeholder="10"></div><div><label>Carga</label><input placeholder="20kg"></div><div><label>Descanso</label><input type="number" placeholder="60"></div>`
  document.querySelector('#exerciseBox').appendChild(d)
}

async function saveWorkout(){
  const button=document.querySelector('#saveWorkout')
  const student_id=document.querySelector('#ws').value,name=document.querySelector('#wn').value.trim()
  if(!name)return showError('Dê um nome ao treino.')
  button.disabled=true;button.textContent='Salvando...'
  const {data:w,error}=await supabase.from('workouts').insert({trainer_id:session.user.id,student_id,name}).select().single()
  if(error){button.disabled=false;button.textContent='Salvar treino';return showError(error)}
  const rows=[...document.querySelectorAll('.exercise')].map((r,i)=>{const x=r.querySelectorAll('input');return{workout_id:w.id,exercise_name:x[0].value||'Exercício',sets:+x[1].value||3,reps:x[2].value||'10',load:x[3].value||null,rest_seconds:parseInt(x[4].value)||60,sort_order:i}})
  const {error:e}=await supabase.from('workout_exercises').insert(rows)
  if(e)return showError(e)
  closeModal();page='workouts';renderShell()
}

async function viewWorkout(id,studentMode){
  const {data:w,error}=await supabase.from('workouts').select('id,name,student_id,students(name),workout_exercises(*)').eq('id',id).single()
  if(error)return showError(error)
  const exercises=(w.workout_exercises||[]).sort((a,b)=>a.sort_order-b.sort_order)
  modal(`<div class="modal-head"><div><span class="eyebrow">${studentMode?'SEU TREINO':'FICHA DE TREINO'}</span><h2>${esc(w.name)}</h2><p class="muted">${esc(w.students?.name||'')}</p></div><button class="icon-btn" onclick="closeModal()">×</button></div>
  <div class="exercise-view">${exercises.length?exercises.map((e,i)=>`<article class="exercise-view-row"><span class="exercise-index">${String(i+1).padStart(2,'0')}</span><div><strong>${esc(e.exercise_name)}</strong><div class="item-meta"><span>${e.sets} séries</span><span>${esc(e.reps)} reps</span><span>Carga ${esc(e.load||'-')}</span><span>${e.rest_seconds}s descanso</span></div></div></article>`).join(''):'<div class="empty">Nenhum exercício cadastrado.</div>'}</div>
  <div class="actions modal-actions">${studentMode?`<button class="btn" id="finishWorkout">✓ Concluir treino</button>`:''}<button class="btn sec" onclick="closeModal()">Fechar</button></div>`)
  if(studentMode)document.querySelector('#finishWorkout').onclick=()=>finishWorkout(w)
}

async function openProgressForm(studentId){
  modal(`<div class="modal-head"><div><span class="eyebrow">ACOMPANHAMENTO</span><h2>Registrar evolução</h2></div><button class="icon-btn" onclick="closeModal()">×</button></div>
  <p class="muted">Registre as medidas atuais para acompanhar a evolução ao longo do tempo.</p>
  <div class="two"><div><label>Peso (kg)</label><input id="pw" type="number" step="0.1" placeholder="80.5"></div><div><label>Cintura (cm)</label><input id="pc" type="number" step="0.1" placeholder="84"></div></div><label>Observação</label><textarea id="pn" rows="4" placeholder="Observações do acompanhamento"></textarea>
  <div class="actions modal-actions"><button class="btn sec" onclick="closeModal()">Cancelar</button><button class="btn" id="saveProgress">Salvar evolução</button></div>`)
  document.querySelector('#saveProgress').onclick=async()=>{
    const button=document.querySelector('#saveProgress');button.disabled=true;button.textContent='Salvando...'
    const {error}=await supabase.from('progress_logs').insert({student_id:studentId,weight_kg:+document.querySelector('#pw').value||null,waist_cm:+document.querySelector('#pc').value||null,notes:document.querySelector('#pn').value||null})
    if(error){button.disabled=false;button.textContent='Salvar evolução';return showError(error)}
    closeModal();renderPage()
  }
}

async function trainerProgress(c){
  const {data,error}=await supabase.from('progress_logs').select('*,students(name)').order('created_at',{ascending:false}).limit(50)
  if(error)return showError(error)
  c.innerHTML=`<section class="page-head"><div><span class="eyebrow">ACOMPANHAMENTO</span><h1>Evolução</h1><p>Histórico das medidas registradas para seus alunos.</p></div></section>
  <div class="list timeline">${data.length?data.map(p=>`<article class="row item-card"><div class="item-main"><div class="timeline-dot"></div><div><div class="item-title">${esc(p.students?.name||'Aluno')}</div><div class="item-meta"><span>${formatDate(p.created_at)}</span><span>${p.weight_kg??'-'} kg</span><span>Cintura ${p.waist_cm??'-'} cm</span></div>${p.notes?`<p class="item-note">${esc(p.notes)}</p>`:''}</div></div></article>`).join(''):`<div class="empty"><div class="empty-icon">↗</div><h3>Sem registros ainda</h3><p>As evoluções registradas aparecerão aqui.</p></div>`}</div>`
}

async function studentPage(){
  const c=document.querySelector('#content'), s=await getStudentSelf()
  if(page==='home'){
    const {data,error}=await supabase.from('workouts').select('id,name,workout_exercises(*),created_at').eq('student_id',s.id).order('created_at',{ascending:false})
    if(error)return showError(error)
    c.innerHTML=`<section class="hero-card student-hero"><div><span class="eyebrow">SEU ESPAÇO</span><h1>Pronto para treinar, ${esc(profile.full_name?.split(' ')[0]||'Atleta')}?</h1><p>${esc(s.goal||'Mantenha a consistência. Cada treino conta.')}</p></div><div class="hero-stat"><span>Peso atual</span><strong>${s.weight_kg??'-'}<small> kg</small></strong></div></section>
    <section class="section-head"><div><span class="eyebrow">TREINOS</span><h2>Suas fichas</h2></div><span class="status-dot">${data.length} ${data.length===1?'treino':'treinos'}</span></section>
    <div class="workout-grid">${data.length?data.map((w,i)=>`<article class="student-workout-card"><div class="workout-card-top"><span class="workout-number">${String(i+1).padStart(2,'0')}</span><span class="pill">${w.workout_exercises?.length||0} exercícios</span></div><h3>${esc(w.name)}</h3><p>Ficha preparada pelo seu personal.</p><button class="btn full" data-start="${w.id}">Abrir treino →</button></article>`).join(''):`<div class="empty"><div class="empty-icon">◆</div><h3>Nenhum treino liberado</h3><p>Seu personal ainda não cadastrou uma ficha para você.</p></div>`}</div>`
    document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>viewWorkout(b.dataset.start,true))
  }
  if(page==='history'){
    const {data,error}=await supabase.from('workout_history').select('*').eq('student_id',s.id).order('completed_at',{ascending:false})
    if(error)return showError(error)
    c.innerHTML=`<section class="page-head"><div><span class="eyebrow">CONSISTÊNCIA</span><h1>Histórico</h1><p>Todos os treinos que você já concluiu.</p></div></section>
    <div class="list">${data.length?data.map(h=>`<article class="row item-card"><div class="item-main"><div class="complete-icon">✓</div><div><div class="item-title">${esc(h.workout_name)}</div><div class="item-meta"><span>${formatDate(h.completed_at,true)}</span></div></div></div><span class="pill">Concluído</span></article>`).join(''):`<div class="empty"><div class="empty-icon">✓</div><h3>Seu histórico começa aqui</h3><p>Conclua um treino para registrar sua primeira sessão.</p></div>`}</div>`
  }
  if(page==='progress'){
    const {data,error}=await supabase.from('progress_logs').select('*').eq('student_id',s.id).order('created_at',{ascending:false})
    if(error)return showError(error)
    const latest=data[0]
    c.innerHTML=`<section class="page-head"><div><span class="eyebrow">RESULTADOS</span><h1>Minha evolução</h1><p>Acompanhe suas medidas ao longo do tempo.</p></div></section>
    ${latest?`<div class="metrics-grid student-metrics"><div class="metric-card static"><span class="metric-label">Peso atual</span><strong>${latest.weight_kg??'-'}</strong><small>kg</small></div><div class="metric-card static"><span class="metric-label">Cintura atual</span><strong>${latest.waist_cm??'-'}</strong><small>cm</small></div></div>`:''}
    <div class="list timeline">${data.length?data.map(p=>`<article class="row item-card"><div class="item-main"><div class="timeline-dot"></div><div><div class="item-title">${formatDate(p.created_at)}</div><div class="item-meta"><span>${p.weight_kg??'-'} kg</span><span>Cintura ${p.waist_cm??'-'} cm</span></div>${p.notes?`<p class="item-note">${esc(p.notes)}</p>`:''}</div></div></article>`).join(''):`<div class="empty"><div class="empty-icon">↗</div><h3>Nenhuma evolução registrada</h3><p>Seus registros aparecerão aqui.</p></div>`}</div>`
  }
}

async function finishWorkout(w){
  const button=document.querySelector('#finishWorkout')
  button.disabled=true;button.textContent='Registrando...'
  const {error}=await supabase.from('workout_history').insert({student_id:w.student_id,workout_id:w.id,workout_name:w.name})
  if(error){button.disabled=false;button.textContent='✓ Concluir treino';return showError(error)}
  closeModal();page='history';renderShell()
}

init().catch(showError)
