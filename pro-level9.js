import './pro-level9.css'
import { supabase } from './supabase'

const DAY=86400000
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
let scheduled=false
let contextPromise=null
let agendaState=null
let studentHubCache={at:0,data:null}

function toast(message,type='ok'){
  document.querySelector('#pro9Toast')?.remove()
  const el=document.createElement('div')
  el.id='pro9Toast'
  el.className=`pro9-toast ${type}`
  el.textContent=message
  document.body.appendChild(el)
  setTimeout(()=>el.remove(),3600)
}

function openModal(html,wide=false){
  document.querySelector('#pro9Modal')?.remove()
  const wrap=document.createElement('div')
  wrap.id='pro9Modal'
  wrap.className='pro9-modal'
  wrap.innerHTML=`<div class="pro9-card ${wide?'wide':''}">${html}</div>`
  wrap.onclick=e=>{if(e.target===wrap)wrap.remove()}
  document.body.appendChild(wrap)
}
window.closePro9Modal=()=>document.querySelector('#pro9Modal')?.remove()

async function getContext(force=false){
  if(force)contextPromise=null
  if(contextPromise)return contextPromise
  contextPromise=(async()=>{
    const {data:sessionData}=await supabase.auth.getSession()
    const session=sessionData.session
    if(!session)return {session:null,profile:null,student:null}
    const {data:profile}=await supabase.from('profiles').select('id,full_name,role').eq('id',session.user.id).maybeSingle()
    let student=null
    if(profile?.role==='student'){
      const {data}=await supabase.from('students').select('id,name,goal,trainer_id,user_id').eq('user_id',session.user.id).maybeSingle()
      student=data||null
    }
    return {session,profile,student}
  })()
  return contextPromise
}

function formatDate(value,withWeekday=false){
  if(!value)return '-'
  return new Date(value).toLocaleDateString('pt-BR',withWeekday?{weekday:'short',day:'2-digit',month:'short'}:{day:'2-digit',month:'2-digit',year:'numeric'})
}
function formatTime(value){
  if(!value)return '-'
  return new Date(value).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
}
function dateKey(value){
  const d=new Date(value);return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
function toLocalInput(date){
  const d=new Date(date.getTime()-date.getTimezoneOffset()*60000)
  return d.toISOString().slice(0,16)
}
function statusLabel(status){return ({scheduled:'Agendada',completed:'Concluída',cancelled:'Cancelada'})[status]||status}
function checkinFlags(c){
  const flags=[]
  if(Number(c.energy)<=2)flags.push('Energia baixa')
  if(Number(c.sleep_quality)<=2)flags.push('Sono ruim')
  if(Number(c.soreness)>=4)flags.push('Dor muscular alta')
  if(Number(c.adherence)<60)flags.push('Adesão baixa')
  if((c.pain||'').trim())flags.push('Relatou dor/desconforto')
  return flags
}

async function loadAgenda(){
  const ctx=await getContext()
  if(ctx.profile?.role!=='trainer')throw new Error('Área disponível para o personal.')
  const start=new Date(Date.now()-14*DAY).toISOString()
  const end=new Date(Date.now()+90*DAY).toISOString()
  const [studentsResult,appointmentsResult,checkinsResult]=await Promise.all([
    supabase.from('students').select('id,name,user_id,goal').order('name'),
    supabase.from('appointments').select('id,trainer_id,student_id,title,starts_at,ends_at,status,notes,students(name,user_id)').gte('starts_at',start).lte('starts_at',end).order('starts_at',{ascending:true}),
    supabase.from('weekly_checkins').select('id,student_id,energy,sleep_quality,soreness,adherence,pain,notes,created_at,students(name)').gte('created_at',new Date(Date.now()-30*DAY).toISOString()).order('created_at',{ascending:false}).limit(120)
  ])
  const error=studentsResult.error||appointmentsResult.error||checkinsResult.error
  if(error)throw error
  agendaState={ctx,students:studentsResult.data||[],appointments:appointmentsResult.data||[],checkins:checkinsResult.data||[]}
  return agendaState
}

async function openAgenda(preselectedStudent=''){
  openModal('<div class="pro9-loading">Carregando Agenda Pro...</div>',true)
  try{
    await loadAgenda()
    renderAgenda('agenda',preselectedStudent)
  }catch(error){
    closePro9Modal();toast(error.message||'Não foi possível carregar a agenda.','error')
  }
}
window.openPro9Agenda=openAgenda

function renderAgenda(tab='agenda',preselectedStudent=''){
  if(!agendaState)return
  const {appointments,checkins}=agendaState
  const now=Date.now(),weekEnd=now+7*DAY
  const upcoming=appointments.filter(a=>a.status==='scheduled'&&new Date(a.starts_at).getTime()>=now)
  const today=upcoming.filter(a=>dateKey(a.starts_at)===dateKey(Date.now())).length
  const next7=upcoming.filter(a=>new Date(a.starts_at).getTime()<=weekEnd).length
  const flagged=checkins.filter(c=>checkinFlags(c).length).length
  const latestByStudent=[]
  const seen=new Set()
  for(const c of checkins){if(!seen.has(c.student_id)){seen.add(c.student_id);latestByStudent.push(c)}}

  openModal(`<div class="pro9-head">
      <div><span class="pro9-badge">NÍVEL 9 • OPERAÇÃO</span><h2>Agenda & Check-ins</h2><p>Organize sessões e acompanhe como seus alunos estão entre os treinos.</p></div>
      <button class="icon-btn" onclick="closePro9Modal()" aria-label="Fechar">×</button>
    </div>
    <div class="pro9-kpis">
      <article><span>Hoje</span><strong>${today}</strong><small>sessões agendadas</small></article>
      <article><span>Próximos 7 dias</span><strong>${next7}</strong><small>${upcoming.length} futuras</small></article>
      <article class="${flagged?'alert':''}"><span>Check-ins com atenção</span><strong>${flagged}</strong><small>últimos 30 dias</small></article>
    </div>
    <div class="pro9-tabs">
      <button class="${tab==='agenda'?'active':''}" data-pro9-tab="agenda">Agenda</button>
      <button class="${tab==='checkins'?'active':''}" data-pro9-tab="checkins">Check-ins <span>${latestByStudent.length}</span></button>
    </div>
    ${tab==='agenda'?agendaView(preselectedStudent):checkinsView(latestByStudent)}
  `,true)
  document.querySelectorAll('[data-pro9-tab]').forEach(b=>b.onclick=()=>renderAgenda(b.dataset.pro9Tab))
  document.querySelector('#pro9NewAppointment')?.addEventListener('click',()=>openAppointmentForm(preselectedStudent))
  document.querySelectorAll('[data-pro9-complete]').forEach(b=>b.onclick=()=>updateAppointment(b.dataset.pro9Complete,'completed'))
  document.querySelectorAll('[data-pro9-cancel]').forEach(b=>b.onclick=()=>updateAppointment(b.dataset.pro9Cancel,'cancelled'))
  document.querySelectorAll('[data-pro9-checkin]').forEach(b=>b.onclick=()=>openCheckinDetail(b.dataset.pro9Checkin))
}

function agendaView(preselectedStudent){
  const now=Date.now()
  const future=agendaState.appointments.filter(a=>new Date(a.starts_at).getTime()>=now-3*60*60*1000&&a.status!=='cancelled')
  const past=agendaState.appointments.filter(a=>new Date(a.starts_at).getTime()<now-3*60*60*1000).slice(-8).reverse()
  return `<div class="pro9-toolbar"><div><span class="eyebrow">PRÓXIMAS SESSÕES</span><h3>Sua agenda</h3></div><button class="btn" id="pro9NewAppointment">+ Agendar sessão</button></div>
    <div class="pro9-agenda-list">${future.length?future.map(appointmentCard).join(''):'<div class="pro9-empty"><strong>Agenda livre</strong><span>Nenhuma sessão futura cadastrada.</span></div>'}</div>
    ${past.length?`<div class="pro9-past"><span class="eyebrow">RECENTES</span>${past.map(appointmentCard).join('')}</div>`:''}`
}

function appointmentCard(a){
  const day=new Date(a.starts_at).toLocaleDateString('pt-BR',{day:'2-digit'})
  const month=new Date(a.starts_at).toLocaleDateString('pt-BR',{month:'short'}).replace('.','')
  const actionable=a.status==='scheduled'&&new Date(a.starts_at).getTime()>Date.now()-12*60*60*1000
  return `<article class="pro9-appointment ${a.status}">
    <div class="pro9-date"><strong>${day}</strong><span>${month}</span></div>
    <div class="pro9-appointment-main"><div class="pro9-line"><h4>${esc(a.students?.name||'Aluno')}</h4><span class="pro9-status ${a.status}">${statusLabel(a.status)}</span></div><strong>${esc(a.title)}</strong><p>${formatDate(a.starts_at,true)} • ${formatTime(a.starts_at)}–${formatTime(a.ends_at)}${a.notes?` • ${esc(a.notes)}`:''}</p></div>
    ${actionable?`<div class="pro9-card-actions"><button class="btn ghost compact" data-pro9-cancel="${a.id}">Cancelar</button><button class="btn sec compact" data-pro9-complete="${a.id}">Concluir</button></div>`:''}
  </article>`
}

function checkinsView(checkins){
  return `<div class="pro9-toolbar"><div><span class="eyebrow">CHECK-IN SEMANAL</span><h3>Estado dos alunos</h3><p class="muted">O destaque indica sinais que merecem acompanhamento.</p></div></div>
    <div class="pro9-checkin-list">${checkins.length?checkins.map(checkinCard).join(''):'<div class="pro9-empty"><strong>Nenhum check-in ainda</strong><span>Quando os alunos responderem, os dados aparecerão aqui.</span></div>'}</div>`
}

function checkinCard(c){
  const flags=checkinFlags(c),risk=flags.length>0
  return `<button class="pro9-checkin-row ${risk?'risk':''}" data-pro9-checkin="${c.id}">
    <div class="pro9-checkin-main"><div class="pro9-line"><h4>${esc(c.students?.name||'Aluno')}</h4>${risk?`<span class="pro9-risk">${flags.length} alerta${flags.length>1?'s':''}</span>`:'<span class="pro9-ok">Em dia</span>'}</div><p>${formatDate(c.created_at,true)} • ${risk?esc(flags[0]):'Sem sinais críticos no check-in'}</p></div>
    <div class="pro9-mini-metrics"><span><b>${c.energy}/5</b> energia</span><span><b>${c.sleep_quality}/5</b> sono</span><span><b>${c.soreness}/5</b> dores</span><span><b>${c.adherence}%</b> adesão</span></div>
  </button>`
}

function openAppointmentForm(studentId=''){
  const students=agendaState?.students||[]
  if(!students.length)return toast('Cadastre um aluno primeiro.','error')
  const d=new Date(Date.now()+60*60*1000);d.setMinutes(0,0,0)
  openModal(`<div class="pro9-head"><div><span class="pro9-badge">NOVA SESSÃO</span><h2>Agendar atendimento</h2><p>O aluno verá a sessão no FITCOACH e receberá um aviso quando a conta estiver vinculada.</p></div><button class="icon-btn" onclick="closePro9Modal()">×</button></div>
    <div class="pro9-form-grid">
      <div class="pro9-wide"><label>Aluno</label><select id="pro9ApptStudent">${students.map(s=>`<option value="${s.id}" ${s.id===studentId?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
      <div><label>Data e hora</label><input id="pro9ApptStart" type="datetime-local" value="${toLocalInput(d)}"></div>
      <div><label>Duração</label><select id="pro9ApptDuration"><option value="30">30 min</option><option value="45">45 min</option><option value="60" selected>60 min</option><option value="90">90 min</option></select></div>
      <div class="pro9-wide"><label>Título</label><input id="pro9ApptTitle" maxlength="80" value="Sessão de treino" placeholder="Ex.: Avaliação, treino presencial"></div>
      <div class="pro9-wide"><label>Observação</label><textarea id="pro9ApptNotes" rows="3" maxlength="300" placeholder="Local, foco da sessão ou observação opcional"></textarea></div>
    </div>
    <div class="actions pro9-actions"><button class="btn sec" id="pro9ApptBack">Voltar</button><button class="btn" id="pro9ApptSave">Agendar sessão</button></div>`)
  document.querySelector('#pro9ApptBack').onclick=()=>renderAgenda('agenda')
  document.querySelector('#pro9ApptSave').onclick=saveAppointment
}

async function saveAppointment(){
  const student_id=document.querySelector('#pro9ApptStudent').value
  const local=document.querySelector('#pro9ApptStart').value
  const duration=Number(document.querySelector('#pro9ApptDuration').value)
  const title=document.querySelector('#pro9ApptTitle').value.trim()
  const notes=document.querySelector('#pro9ApptNotes').value.trim()||null
  if(!local||!title)return toast('Preencha data, hora e título.','error')
  const start=new Date(local)
  if(Number.isNaN(start.getTime()))return toast('Data inválida.','error')
  if(start.getTime()<Date.now()-15*60*1000)return toast('Escolha um horário futuro.','error')
  const end=new Date(start.getTime()+duration*60000)
  const button=document.querySelector('#pro9ApptSave');button.disabled=true;button.textContent='Agendando...'
  const trainer_id=agendaState.ctx.session.user.id
  const {error}=await supabase.from('appointments').insert({trainer_id,student_id,title,starts_at:start.toISOString(),ends_at:end.toISOString(),notes})
  if(error){button.disabled=false;button.textContent='Agendar sessão';return toast(error.message,'error')}
  const student=agendaState.students.find(s=>s.id===student_id)
  if(student?.user_id){
    await supabase.from('notifications').insert({student_id,title:'Nova sessão agendada',body:`${title} em ${formatDate(start,true)} às ${formatTime(start)}.`,created_by:trainer_id})
  }
  toast('Sessão agendada com sucesso.')
  await loadAgenda();renderAgenda('agenda')
}

async function updateAppointment(id,status){
  const {error}=await supabase.from('appointments').update({status}).eq('id',id)
  if(error)return toast(error.message,'error')
  toast(status==='completed'?'Sessão marcada como concluída.':'Sessão cancelada.')
  await loadAgenda();renderAgenda('agenda')
}

function openCheckinDetail(id){
  const c=agendaState?.checkins.find(x=>x.id===id)
  if(!c)return
  const flags=checkinFlags(c)
  openModal(`<div class="pro9-head"><div><span class="pro9-badge">CHECK-IN DO ALUNO</span><h2>${esc(c.students?.name||'Aluno')}</h2><p>Enviado em ${formatDate(c.created_at,true)} às ${formatTime(c.created_at)}.</p></div><button class="icon-btn" onclick="closePro9Modal()">×</button></div>
    <div class="pro9-checkin-kpis"><article><span>Energia</span><strong>${c.energy}<small>/5</small></strong></article><article><span>Sono</span><strong>${c.sleep_quality}<small>/5</small></strong></article><article><span>Dores</span><strong>${c.soreness}<small>/5</small></strong></article><article><span>Adesão</span><strong>${c.adherence}<small>%</small></strong></article></div>
    ${flags.length?`<section class="pro9-alert-box"><span class="eyebrow">PONTOS DE ATENÇÃO</span>${flags.map(f=>`<div>• ${esc(f)}</div>`).join('')}</section>`:'<section class="pro9-good-box">✓ Check-in sem sinais críticos automáticos.</section>'}
    ${c.pain?`<section class="pro9-note"><span>Dor ou desconforto relatado</span><p>${esc(c.pain)}</p></section>`:''}
    ${c.notes?`<section class="pro9-note"><span>Observações</span><p>${esc(c.notes)}</p></section>`:''}
    <div class="actions pro9-actions"><button class="btn sec" id="pro9CheckinBack">Voltar</button><button class="btn" id="pro9Followup">Enviar acompanhamento</button></div>`)
  document.querySelector('#pro9CheckinBack').onclick=()=>renderAgenda('checkins')
  document.querySelector('#pro9Followup').onclick=()=>openFollowup(c)
}

function openFollowup(c){
  const flags=checkinFlags(c)
  const body=flags.length?`Vi seu check-in e quero acompanhar melhor: ${flags.join(', ').toLowerCase()}. Me avise como você está e, se necessário, ajustamos o treino.`:'Recebi seu check-in. Continue mantendo a consistência e me avise se precisar ajustar o treino.'
  openModal(`<div class="pro9-head"><div><span class="pro9-badge">ACOMPANHAMENTO</span><h2>Mensagem para ${esc(c.students?.name||'aluno')}</h2><p>O aviso aparecerá na central do aluno.</p></div><button class="icon-btn" onclick="closePro9Modal()">×</button></div><label>Título</label><input id="pro9FollowTitle" value="Acompanhamento do check-in" maxlength="80"><label>Mensagem</label><textarea id="pro9FollowBody" rows="6" maxlength="500">${esc(body)}</textarea><div class="actions pro9-actions"><button class="btn sec" id="pro9FollowBack">Voltar</button><button class="btn" id="pro9FollowSend">Enviar aviso</button></div>`)
  document.querySelector('#pro9FollowBack').onclick=()=>openCheckinDetail(c.id)
  document.querySelector('#pro9FollowSend').onclick=()=>sendFollowup(c)
}

async function sendFollowup(c){
  const title=document.querySelector('#pro9FollowTitle').value.trim(),body=document.querySelector('#pro9FollowBody').value.trim()
  if(!title||!body)return toast('Preencha título e mensagem.','error')
  const button=document.querySelector('#pro9FollowSend');button.disabled=true;button.textContent='Enviando...'
  const {error}=await supabase.from('notifications').insert({student_id:c.student_id,title,body,created_by:agendaState.ctx.session.user.id})
  if(error){button.disabled=false;button.textContent='Enviar aviso';return toast(error.message,'error')}
  closePro9Modal();toast('Acompanhamento enviado.')
}

async function loadStudentHub(force=false){
  if(!force&&studentHubCache.data&&Date.now()-studentHubCache.at<30000)return studentHubCache.data
  const ctx=await getContext()
  if(ctx.profile?.role!=='student'||!ctx.student)throw new Error('Conta de aluno não vinculada.')
  const [appointmentsResult,checkinsResult]=await Promise.all([
    supabase.from('appointments').select('id,title,starts_at,ends_at,status,notes').eq('student_id',ctx.student.id).gte('starts_at',new Date(Date.now()-DAY).toISOString()).order('starts_at',{ascending:true}).limit(20),
    supabase.from('weekly_checkins').select('id,energy,sleep_quality,soreness,adherence,pain,notes,created_at').eq('student_id',ctx.student.id).order('created_at',{ascending:false}).limit(8)
  ])
  const error=appointmentsResult.error||checkinsResult.error
  if(error)throw error
  const data={ctx,appointments:appointmentsResult.data||[],checkins:checkinsResult.data||[]}
  studentHubCache={at:Date.now(),data}
  return data
}

async function openStudentHub(){
  openModal('<div class="pro9-loading">Carregando seu acompanhamento...</div>')
  try{
    const data=await loadStudentHub(true)
    const upcoming=data.appointments.filter(a=>a.status==='scheduled'&&new Date(a.starts_at).getTime()>=Date.now())
    const latest=data.checkins[0]
    openModal(`<div class="pro9-head"><div><span class="pro9-badge">NÍVEL 9 • ACOMPANHAMENTO</span><h2>Minha agenda</h2><p>Sessões marcadas e seu check-in de acompanhamento.</p></div><button class="icon-btn" onclick="closePro9Modal()">×</button></div>
      <section class="pro9-student-hub-section"><div class="pro9-section-title"><span class="eyebrow">PRÓXIMAS SESSÕES</span><strong>${upcoming.length}</strong></div>${upcoming.length?upcoming.slice(0,5).map(studentAppointment).join(''):'<div class="pro9-empty compact"><strong>Nenhuma sessão marcada</strong><span>Sua agenda está livre no momento.</span></div>'}</section>
      <section class="pro9-student-hub-section"><div class="pro9-section-title"><span class="eyebrow">CHECK-IN</span>${latest?`<small>Último: ${formatDate(latest.created_at)}</small>`:''}</div>${latest?`<div class="pro9-last-checkin"><span><b>${latest.energy}/5</b> energia</span><span><b>${latest.sleep_quality}/5</b> sono</span><span><b>${latest.soreness}/5</b> dores</span><span><b>${latest.adherence}%</b> adesão</span></div>`:'<p class="muted">Você ainda não enviou um check-in.</p>'}<button class="btn full" id="pro9OpenCheckin">Responder check-in</button></section>`)
    document.querySelector('#pro9OpenCheckin').onclick=openCheckinForm
  }catch(error){closePro9Modal();toast(error.message||'Não foi possível carregar.','error')}
}
window.openPro9StudentHub=openStudentHub

function studentAppointment(a){
  return `<article class="pro9-student-appointment"><div><span>${formatDate(a.starts_at,true)}</span><strong>${esc(a.title)}</strong><small>${formatTime(a.starts_at)}–${formatTime(a.ends_at)}</small></div><span class="pro9-status ${a.status}">${statusLabel(a.status)}</span></article>`
}

async function openCheckinForm(){
  let data
  try{data=await loadStudentHub()}catch(error){return toast(error.message,'error')}
  openModal(`<div class="pro9-head"><div><span class="pro9-badge">CHECK-IN SEMANAL</span><h2>Como você está?</h2><p>Leva menos de um minuto e ajuda seu personal a acompanhar sua recuperação e consistência.</p></div><button class="icon-btn" onclick="closePro9Modal()">×</button></div>
    <div class="pro9-checkin-form">
      <div><label>Energia hoje</label><select id="pro9Energy"><option value="5">5 • Excelente</option><option value="4" selected>4 • Boa</option><option value="3">3 • Média</option><option value="2">2 • Baixa</option><option value="1">1 • Muito baixa</option></select></div>
      <div><label>Qualidade do sono</label><select id="pro9Sleep"><option value="5">5 • Excelente</option><option value="4" selected>4 • Boa</option><option value="3">3 • Média</option><option value="2">2 • Ruim</option><option value="1">1 • Muito ruim</option></select></div>
      <div><label>Dor muscular / cansaço</label><select id="pro9Soreness"><option value="1">1 • Quase nada</option><option value="2" selected>2 • Leve</option><option value="3">3 • Moderado</option><option value="4">4 • Alto</option><option value="5">5 • Muito alto</option></select></div>
      <div><label>Adesão ao plano</label><select id="pro9Adherence"><option value="100">100% • Completa</option><option value="80" selected>80% • Boa</option><option value="60">60% • Parcial</option><option value="40">40% • Baixa</option><option value="20">20% • Muito baixa</option></select></div>
      <div class="pro9-wide"><label>Sentiu dor ou desconforto fora do comum?</label><textarea id="pro9Pain" rows="3" maxlength="350" placeholder="Se sim, descreva onde e em que situação. Se não, deixe em branco."></textarea></div>
      <div class="pro9-wide"><label>Observação para seu personal</label><textarea id="pro9Notes" rows="3" maxlength="500" placeholder="Algo que queira contar sobre sua semana, treino ou recuperação."></textarea></div>
    </div>
    <div class="pro9-safety-note">Se houver dor forte, lesão, falta de ar, tontura ou outro sintoma importante, não use o check-in como substituto de avaliação médica.</div>
    <div class="actions pro9-actions"><button class="btn sec" id="pro9CheckinCancel">Cancelar</button><button class="btn" id="pro9CheckinSave">Enviar check-in</button></div>`)
  document.querySelector('#pro9CheckinCancel').onclick=()=>openStudentHub()
  document.querySelector('#pro9CheckinSave').onclick=()=>saveCheckin(data.ctx)
}

async function saveCheckin(ctx){
  const row={student_id:ctx.student.id,submitted_by:ctx.session.user.id,energy:Number(document.querySelector('#pro9Energy').value),sleep_quality:Number(document.querySelector('#pro9Sleep').value),soreness:Number(document.querySelector('#pro9Soreness').value),adherence:Number(document.querySelector('#pro9Adherence').value),pain:document.querySelector('#pro9Pain').value.trim()||null,notes:document.querySelector('#pro9Notes').value.trim()||null}
  const button=document.querySelector('#pro9CheckinSave');button.disabled=true;button.textContent='Enviando...'
  const {error}=await supabase.from('weekly_checkins').insert(row)
  if(error){button.disabled=false;button.textContent='Enviar check-in';return toast(error.message,'error')}
  studentHubCache={at:0,data:null}
  toast('Check-in enviado ao seu personal.')
  await openStudentHub()
}

async function enhanceTrainerHome(ctx){
  if(ctx.profile?.role!=='trainer')return
  const quick=document.querySelector('.quick-actions')
  if(quick&&!quick.querySelector('#pro9AgendaHome')){
    const b=document.createElement('button');b.id='pro9AgendaHome';b.type='button';b.className='btn sec pro9-agenda-btn';b.innerHTML='◷ Agenda & check-ins';b.onclick=()=>openAgenda();quick.appendChild(b)
  }
}

async function enhanceStudentHome(ctx){
  if(ctx.profile?.role!=='student'||!ctx.student)return
  const hero=document.querySelector('.student-hero')
  if(!hero||document.querySelector('#pro9StudentStrip'))return
  const strip=document.createElement('section');strip.id='pro9StudentStrip';strip.className='pro9-student-strip';strip.innerHTML='<div class="pro9-loading-inline">Carregando agenda e check-in...</div>';hero.insertAdjacentElement('afterend',strip)
  try{
    const data=await loadStudentHub()
    const next=data.appointments.find(a=>a.status==='scheduled'&&new Date(a.starts_at).getTime()>=Date.now())
    const latest=data.checkins[0]
    const days=latest?Math.floor((Date.now()-new Date(latest.created_at).getTime())/DAY):null
    strip.innerHTML=`<button class="pro9-strip-card" id="pro9StudentAgenda"><span class="pro9-strip-icon">◷</span><span><small>PRÓXIMA SESSÃO</small><strong>${next?esc(next.title):'Agenda livre'}</strong><em>${next?`${formatDate(next.starts_at,true)} • ${formatTime(next.starts_at)}`:'Nenhuma sessão marcada'}</em></span></button><button class="pro9-strip-card ${days===null||days>=7?'accent':''}" id="pro9StudentCheckin"><span class="pro9-strip-icon">◎</span><span><small>CHECK-IN</small><strong>${latest&&days<7?'Check-in em dia':'Como você está?'}</strong><em>${latest?`Último há ${days} dia${days===1?'':'s'}`:'Envie seu primeiro check-in'}</em></span></button>`
    document.querySelector('#pro9StudentAgenda').onclick=openStudentHub
    document.querySelector('#pro9StudentCheckin').onclick=()=>latest&&days<7?openStudentHub():openCheckinForm()
  }catch(error){strip.remove()}
}

async function enhanceStudentCards(ctx){
  if(ctx.profile?.role!=='trainer')return
  document.querySelectorAll('#content .item-card').forEach(card=>{
    const anchor=card.querySelector('[data-workout]'),actions=card.querySelector('.actions')
    if(!anchor||!actions||actions.querySelector('[data-pro9-schedule]'))return
    const b=document.createElement('button');b.type='button';b.className='btn ghost';b.dataset.pro9Schedule=anchor.dataset.workout;b.textContent='Agendar';b.onclick=()=>openAgenda(anchor.dataset.workout);actions.appendChild(b)
  })
}

async function enhanceNav(ctx){
  const nav=document.querySelector('.nav')
  if(!nav||nav.querySelector('.pro9-nav-btn'))return
  const b=document.createElement('button');b.type='button';b.className='nav-btn pro9-nav-btn'
  if(ctx.profile?.role==='trainer'){b.innerHTML='<span class="nav-icon">◷</span><span>Agenda</span>';b.onclick=()=>openAgenda()}
  else if(ctx.profile?.role==='student'){b.innerHTML='<span class="nav-icon">◎</span><span>Check-in</span>';b.onclick=openStudentHub}
  else return
  nav.appendChild(b)
}

async function enhance(){
  const ctx=await getContext()
  if(!ctx.session)return
  await Promise.allSettled([enhanceTrainerHome(ctx),enhanceStudentHome(ctx),enhanceStudentCards(ctx),enhanceNav(ctx)])
  const version=document.querySelector('.version-badge');if(version)version.textContent='v9'
}
function scheduleEnhance(){
  if(scheduled)return;scheduled=true
  setTimeout(()=>{scheduled=false;enhance().catch(()=>{})},160)
}
new MutationObserver(scheduleEnhance).observe(document.documentElement,{subtree:true,childList:true})
window.addEventListener('focus',scheduleEnhance)
supabase.auth.onAuthStateChange(()=>{contextPromise=null;studentHubCache={at:0,data:null};scheduleEnhance()})
scheduleEnhance()
