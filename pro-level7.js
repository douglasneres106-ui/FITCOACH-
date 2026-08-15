import './pro-level7.css'
import { supabase } from './supabase'

const DAY=86400000
const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
let scheduled=false
let dashboardState=null

function toast(message,type='ok'){
  document.querySelector('#pro7Toast')?.remove()
  const el=document.createElement('div')
  el.id='pro7Toast';el.className=`pro7-toast ${type}`;el.textContent=message
  document.body.appendChild(el)
  setTimeout(()=>el.remove(),3600)
}

function openModal(html){
  document.querySelector('#pro7Modal')?.remove()
  const wrap=document.createElement('div')
  wrap.id='pro7Modal';wrap.className='pro7-modal'
  wrap.innerHTML=`<div class="pro7-card">${html}</div>`
  wrap.onclick=e=>{if(e.target===wrap)wrap.remove()}
  document.body.appendChild(wrap)
}
window.closePro7Modal=()=>document.querySelector('#pro7Modal')?.remove()

function daysSince(value){
  if(!value)return null
  return Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/DAY))
}
function formatDate(value){
  if(!value)return 'Sem registro'
  return new Date(value).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
}

async function loadDashboardData(){
  const {data:sessionData}=await supabase.auth.getSession()
  const session=sessionData.session
  if(!session)throw new Error('Sua sessão expirou. Entre novamente.')

  const [studentsResult,historyResult,progressResult,workoutsResult]=await Promise.all([
    supabase.from('students').select('id,name,goal,user_id,created_at').order('name'),
    supabase.from('workout_history').select('student_id,completed_at,workout_name').order('completed_at',{ascending:false}).limit(1200),
    supabase.from('progress_logs').select('student_id,weight_kg,waist_cm,created_at').order('created_at',{ascending:false}).limit(1200),
    supabase.from('workouts').select('id,student_id,name,created_at').order('created_at',{ascending:false}).limit(1200)
  ])
  const error=studentsResult.error||historyResult.error||progressResult.error||workoutsResult.error
  if(error)throw error

  return buildDashboard(session.user,studentsResult.data||[],historyResult.data||[],progressResult.data||[],workoutsResult.data||[])
}

function buildDashboard(user,students,history,progress,workouts){
  const now=Date.now()
  const rows=students.map(student=>{
    const sh=history.filter(x=>x.student_id===student.id)
    const sp=progress.filter(x=>x.student_id===student.id)
    const sw=workouts.filter(x=>x.student_id===student.id)
    const lastWorkout=sh[0]?.completed_at||null
    const lastProgress=sp[0]?.created_at||null
    const workoutDays=daysSince(lastWorkout)
    const progressDays=daysSince(lastProgress)
    const last7=sh.filter(x=>now-new Date(x.completed_at).getTime()<=7*DAY).length
    const last30=sh.filter(x=>now-new Date(x.completed_at).getTime()<=30*DAY).length

    let score=0
    if(sw.length)score+=20
    if(workoutDays!==null){
      if(workoutDays<=3)score+=40
      else if(workoutDays<=7)score+=30
      else if(workoutDays<=14)score+=15
    }
    if(progressDays!==null){
      if(progressDays<=30)score+=20
      else if(progressDays<=60)score+=10
    }
    if(last30>=12)score+=20
    else if(last30>=8)score+=15
    else if(last30>=4)score+=10
    score=Math.min(100,score)

    const issues=[]
    if(!sw.length)issues.push('Sem ficha de treino')
    if(workoutDays===null)issues.push('Nenhum treino concluído')
    else if(workoutDays>=14)issues.push(`Sem treinar há ${workoutDays} dias`)
    else if(workoutDays>=7)issues.push(`Último treino há ${workoutDays} dias`)
    if(progressDays===null)issues.push('Sem avaliação registrada')
    else if(progressDays>=45)issues.push(`Avaliação há ${progressDays} dias`)

    let status='good',statusLabel='Em dia'
    if(!sw.length||workoutDays===null||workoutDays>=14){status='risk';statusLabel='Prioridade'}
    else if(workoutDays>=7||progressDays===null||progressDays>=45){status='attention';statusLabel='Atenção'}

    return {student,score,status,statusLabel,issues,lastWorkout,lastProgress,workoutDays,progressDays,last7,last30,workoutCount:sw.length,latestProgress:sp[0]||null}
  }).sort((a,b)=>a.score-b.score||a.student.name.localeCompare(b.student.name))

  return {
    user,
    rows,
    metrics:{
      total:rows.length,
      active7:rows.filter(r=>r.workoutDays!==null&&r.workoutDays<7).length,
      risk:rows.filter(r=>r.status==='risk').length,
      attention:rows.filter(r=>r.status==='attention').length,
      evalDue:rows.filter(r=>r.progressDays===null||r.progressDays>=45).length,
      workouts30:rows.reduce((sum,r)=>sum+r.last30,0),
      withPlan:rows.filter(r=>r.workoutCount>0).length
    }
  }
}

async function openDashboard(){
  openModal('<div class="pro7-loading">Montando seu Painel Pro...</div>')
  try{
    dashboardState=await loadDashboardData()
    renderDashboard('all')
  }catch(error){
    closePro7Modal();toast(error.message||'Não foi possível carregar o Painel Pro.','error')
  }
}
window.openPro7Dashboard=openDashboard

function renderDashboard(filter='all'){
  if(!dashboardState)return
  const {metrics,rows}=dashboardState
  const filtered=filter==='all'?rows:rows.filter(row=>row.status===filter)
  openModal(`<div class="pro7-head">
      <div><span class="pro7-badge">NÍVEL 7 • GESTÃO PRO</span><h2>Painel Pro</h2><p>Prioridades do seu acompanhamento com base nos dados reais dos alunos.</p></div>
      <button class="icon-btn" onclick="closePro7Modal()" aria-label="Fechar">×</button>
    </div>
    <div class="pro7-kpis">
      <article><span>Alunos</span><strong>${metrics.total}</strong><small>${metrics.withPlan} com ficha</small></article>
      <article><span>Ativos 7 dias</span><strong>${metrics.active7}</strong><small>${metrics.workouts30} treinos em 30d</small></article>
      <article class="warn"><span>Precisam atenção</span><strong>${metrics.risk+metrics.attention}</strong><small>${metrics.risk} prioritários</small></article>
      <article><span>Avaliação pendente</span><strong>${metrics.evalDue}</strong><small>45+ dias ou sem registro</small></article>
    </div>
    <div class="pro7-toolbar">
      <div class="pro7-filters">
        <button class="${filter==='all'?'active':''}" data-pro7-filter="all">Todos ${rows.length}</button>
        <button class="risk ${filter==='risk'?'active':''}" data-pro7-filter="risk">Prioridade ${metrics.risk}</button>
        <button class="attention ${filter==='attention'?'active':''}" data-pro7-filter="attention">Atenção ${metrics.attention}</button>
        <button class="good ${filter==='good'?'active':''}" data-pro7-filter="good">Em dia ${rows.filter(r=>r.status==='good').length}</button>
      </div>
      <button class="btn sec pro7-share" id="pro7Share">Compartilhar resumo</button>
    </div>
    <div class="pro7-list">${filtered.length?filtered.map(studentRow).join(''):'<div class="pro7-empty">Nenhum aluno nesta categoria.</div>'}</div>
    <div class="pro7-footer-note">O status é um indicador operacional baseado em frequência, avaliação e presença de ficha. Use seu julgamento profissional no acompanhamento.</div>`)

  document.querySelectorAll('[data-pro7-filter]').forEach(b=>b.onclick=()=>renderDashboard(b.dataset.pro7Filter))
  document.querySelectorAll('[data-pro7-notify]').forEach(b=>b.onclick=()=>openQuickNotice(b.dataset.pro7Notify))
  document.querySelectorAll('[data-pro7-student]').forEach(b=>b.onclick=()=>openStudentSnapshot(b.dataset.pro7Student))
  document.querySelector('#pro7Share').onclick=shareSummary
}

function studentRow(row){
  const issue=row.issues[0]||'Acompanhamento em dia'
  const workoutText=row.workoutDays===null?'Nunca treinou':row.workoutDays===0?'Treinou hoje':`Último treino há ${row.workoutDays}d`
  const evalText=row.progressDays===null?'Sem avaliação':row.progressDays===0?'Avaliação hoje':`Avaliação há ${row.progressDays}d`
  return `<article class="pro7-student-row ${row.status}">
    <div class="pro7-score"><strong>${row.score}</strong><span>/100</span></div>
    <div class="pro7-student-main">
      <div class="pro7-name-line"><h3>${esc(row.student.name)}</h3><span class="pro7-status ${row.status}">${row.statusLabel}</span></div>
      <p>${esc(row.student.goal||'Objetivo não informado')}</p>
      <div class="pro7-mini"><span>${workoutText}</span><span>${evalText}</span><span>${row.workoutCount} ${row.workoutCount===1?'ficha':'fichas'}</span></div>
      <small>${esc(issue)}</small>
    </div>
    <div class="pro7-row-actions"><button class="btn ghost" data-pro7-student="${row.student.id}">Detalhes</button><button class="btn sec" data-pro7-notify="${row.student.id}">Avisar</button></div>
  </article>`
}

function openStudentSnapshot(studentId){
  const row=dashboardState?.rows.find(r=>r.student.id===studentId)
  if(!row)return
  const progress=row.latestProgress
  openModal(`<div class="pro7-head"><div><span class="pro7-badge">ACOMPANHAMENTO</span><h2>${esc(row.student.name)}</h2><p>${esc(row.student.goal||'Objetivo não informado')}</p></div><button class="icon-btn" onclick="closePro7Modal()">×</button></div>
    <div class="pro7-snapshot-grid">
      <article><span>Score operacional</span><strong>${row.score}<small>/100</small></strong><p>${row.statusLabel}</p></article>
      <article><span>Treinos 7 dias</span><strong>${row.last7}</strong><p>${row.last30} nos últimos 30 dias</p></article>
      <article><span>Peso recente</span><strong>${progress?.weight_kg??'-'}<small>${progress?.weight_kg!=null?' kg':''}</small></strong><p>${formatDate(progress?.created_at)}</p></article>
      <article><span>Cintura recente</span><strong>${progress?.waist_cm??'-'}<small>${progress?.waist_cm!=null?' cm':''}</small></strong><p>${formatDate(progress?.created_at)}</p></article>
    </div>
    <section class="pro7-issues"><span class="eyebrow">PRÓXIMAS AÇÕES</span><h3>O que revisar</h3>${(row.issues.length?row.issues:['Acompanhamento em dia. Revisar progressão e técnica no próximo contato.']).map(x=>`<div>✓ ${esc(x)}</div>`).join('')}</section>
    <div class="actions pro7-actions"><button class="btn sec" id="pro7BackDashboard">Voltar</button><button class="btn" data-pro7-notify="${row.student.id}">Enviar aviso</button></div>`)
  document.querySelector('#pro7BackDashboard').onclick=()=>renderDashboard('all')
  document.querySelector('[data-pro7-notify]').onclick=()=>openQuickNotice(row.student.id)
}

function openQuickNotice(studentId){
  const row=dashboardState?.rows.find(r=>r.student.id===studentId)
  if(!row)return
  const inactivity=row.workoutDays
  const suggested=inactivity===null||inactivity>=7?'Oi! Passando para acompanhar sua rotina. Vi que faz alguns dias desde o último treino. Como você está? Se precisar, ajustamos a ficha.':'Oi! Passando para acompanhar sua evolução. Continue mantendo a consistência e me avise se precisar ajustar algum exercício ou carga.'
  openModal(`<div class="pro7-head"><div><span class="pro7-badge">CONTATO RÁPIDO</span><h2>Avisar ${esc(row.student.name)}</h2><p>O aviso aparecerá na central do aluno.</p></div><button class="icon-btn" onclick="closePro7Modal()">×</button></div>
    <div class="pro7-notice-form"><label>Título</label><input id="pro7NoticeTitle" maxlength="80" value="Acompanhamento FITCOACH"><label>Mensagem</label><textarea id="pro7NoticeBody" rows="6" maxlength="500">${esc(suggested)}</textarea></div>
    <div class="pro7-templates"><button data-template="Lembrete de treino|Oi! Seu treino está disponível no FITCOACH. Quando concluir, registre por aqui para acompanharmos sua consistência.">Lembrete de treino</button><button data-template="Nova avaliação|Está na hora de atualizar sua avaliação para acompanharmos sua evolução. Vamos registrar peso e medidas no próximo encontro.">Nova avaliação</button><button data-template="Boa sequência!|Excelente consistência nos últimos dias. Continue assim e me avise se alguma carga ou exercício precisar de ajuste.">Parabenizar</button></div>
    <div class="actions pro7-actions"><button class="btn sec" id="pro7NoticeCancel">Cancelar</button><button class="btn" id="pro7NoticeSend">Enviar aviso</button></div>`)
  document.querySelector('#pro7NoticeCancel').onclick=()=>renderDashboard('all')
  document.querySelectorAll('[data-template]').forEach(b=>b.onclick=()=>{const [title,body]=b.dataset.template.split('|');document.querySelector('#pro7NoticeTitle').value=title;document.querySelector('#pro7NoticeBody').value=body})
  document.querySelector('#pro7NoticeSend').onclick=()=>sendNotice(row.student.id)
}

async function sendNotice(studentId){
  const title=document.querySelector('#pro7NoticeTitle').value.trim()
  const body=document.querySelector('#pro7NoticeBody').value.trim()
  if(!title||!body)return toast('Preencha título e mensagem.','error')
  const button=document.querySelector('#pro7NoticeSend');button.disabled=true;button.textContent='Enviando...'
  const user=dashboardState?.user
  const {error}=await supabase.from('notifications').insert({student_id:studentId,title,body,created_by:user.id})
  if(error){button.disabled=false;button.textContent='Enviar aviso';return toast(error.message,'error')}
  closePro7Modal();toast('Aviso enviado para o aluno.')
}

async function shareSummary(){
  const m=dashboardState.metrics
  const top=dashboardState.rows.filter(r=>r.status!=='good').slice(0,5).map(r=>`${r.student.name}: ${r.issues[0]||r.statusLabel}`).join('\n')
  const text=`FITCOACH • Resumo do acompanhamento\n\nAlunos: ${m.total}\nAtivos nos últimos 7 dias: ${m.active7}\nTreinos nos últimos 30 dias: ${m.workouts30}\nPrioridade: ${m.risk}\nAtenção: ${m.attention}\nAvaliações pendentes: ${m.evalDue}${top?`\n\nPrioridades:\n${top}`:''}`
  try{
    if(navigator.share)await navigator.share({title:'FITCOACH • Resumo',text})
    else{await navigator.clipboard.writeText(text);toast('Resumo copiado.')}
  }catch(error){if(error?.name!=='AbortError')toast('Não foi possível compartilhar o resumo.','error')}
}

function enhanceHome(){
  const quick=document.querySelector('.quick-actions')
  if(quick&&!quick.querySelector('#pro7DashboardHome')){
    const b=document.createElement('button');b.id='pro7DashboardHome';b.type='button';b.className='btn pro7-main-btn';b.innerHTML='▦ Painel Pro';b.onclick=openDashboard;quick.prepend(b)
  }
  const badge=document.querySelector('.version-badge');if(badge)badge.textContent='v7'
}

function enhance(){enhanceHome()}
function scheduleEnhance(){
  if(scheduled)return;scheduled=true
  setTimeout(()=>{scheduled=false;try{enhance()}catch(error){console.warn('FITCOACH pro7:',error)}},120)
}
new MutationObserver(scheduleEnhance).observe(document.documentElement,{subtree:true,childList:true})
window.addEventListener('focus',scheduleEnhance)
scheduleEnhance()
