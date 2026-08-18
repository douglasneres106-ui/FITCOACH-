import './pro-ai.css'
import { supabase } from './supabase'

(() => {
  if (window.__FITCOACH_PRO_AI__) return
  window.__FITCOACH_PRO_AI__ = true

  const state = { open:false, tab:'dashboard', students:[], selectedStudent:null, data:null, busy:false, lastPlan:null }
  const esc = (v='') => String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
  const fmt = v => v ? new Date(v).toLocaleDateString('pt-BR') : '-'

  async function context() {
    const { data:{session} } = await supabase.auth.getSession()
    if (!session) return null
    const { data:profile } = await supabase.from('profiles').select('id,role,full_name').eq('id',session.user.id).maybeSingle()
    return {session, profile}
  }

  async function loadStudents() {
    const ctx = await context()
    if (!ctx || !['trainer','personal'].includes(ctx.profile?.role)) return false
    const { data, error } = await supabase.from('students').select('id,name,goal,weight_kg,waist_cm,user_id,created_at').order('name')
    if (error) throw error
    state.students = data || []
    if (!state.selectedStudent && state.students[0]) state.selectedStudent = state.students[0].id
    return true
  }

  async function loadStudentData(studentId) {
    if (!studentId) return null
    const [workouts, progress, history, checkins] = await Promise.all([
      supabase.from('workouts').select('id,name,created_at,workout_exercises(*)').eq('student_id',studentId).order('created_at',{ascending:false}).limit(12),
      supabase.from('progress_logs').select('*').eq('student_id',studentId).order('created_at',{ascending:false}).limit(60),
      supabase.from('workout_history').select('*').eq('student_id',studentId).order('completed_at',{ascending:false}).limit(120),
      supabase.from('weekly_checkins').select('*').eq('student_id',studentId).order('created_at',{ascending:false}).limit(12)
    ])
    const error = workouts.error || progress.error || history.error || checkins.error
    if (error) throw error
    const student = state.students.find(s=>s.id===studentId)
    state.data = {student, workouts:workouts.data||[], progress:progress.data||[], history:history.data||[], checkins:checkins.data||[]}
    return state.data
  }

  function metrics(data) {
    const now = Date.now()
    const last30 = data.history.filter(x => now - new Date(x.completed_at).getTime() <= 30*86400000).length
    const last7 = data.history.filter(x => now - new Date(x.completed_at).getTime() <= 7*86400000).length
    const weights = data.progress.filter(x=>x.weight_kg!=null).map(x=>Number(x.weight_kg)).filter(Number.isFinite)
    const first = weights.at(-1), latest = weights[0]
    const delta = first!=null && latest!=null ? +(latest-first).toFixed(1) : null
    const avgAdherence = data.checkins.length ? Math.round(data.checkins.reduce((a,c)=>a+Number(c.adherence||0),0)/data.checkins.length) : null
    const energy = data.checkins.length ? +(data.checkins.reduce((a,c)=>a+Number(c.energy||0),0)/data.checkins.length).toFixed(1) : null
    return {last7,last30,delta,avgAdherence,energy,workouts:data.workouts.length,progress:data.progress.length}
  }

  function localInsights(data) {
    const m = metrics(data), insights=[]
    if (!data.workouts.length) insights.push(['critical','Sem ficha ativa','Monte uma ficha personalizada para iniciar o acompanhamento.'])
    if (m.last30 < 8) insights.push(['attention','Consistência abaixo do ideal',`Foram ${m.last30} treinos nos últimos 30 dias.`])
    if (m.avgAdherence!=null && m.avgAdherence < 70) insights.push(['attention','Adesão baixa',`Média de adesão dos check-ins: ${m.avgAdherence}%.`])
    if (m.energy!=null && m.energy < 3) insights.push(['attention','Recuperação merece atenção',`Energia média nos check-ins: ${m.energy}/5.`])
    if (m.delta!=null) insights.push(['positive','Tendência de peso',`Variação registrada: ${m.delta > 0 ? '+' : ''}${m.delta} kg no período disponível.`])
    if (!insights.length) insights.push(['positive','Acompanhamento consistente','Os dados atuais não mostram sinais operacionais importantes.'])
    return insights
  }

  function open() {
    state.open = true
    document.body.classList.add('fc-ai-pro-lock')
    mount()
    loadStudents().then(()=>render()).catch(error=>toast(error.message,'error'))
  }
  function close(){ state.open=false; document.body.classList.remove('fc-ai-pro-lock'); document.querySelector('#fc-ai-pro')?.remove() }
  function toast(message,type='ok'){ const old=document.querySelector('#fc-ai-pro-toast'); old?.remove(); const el=document.createElement('div'); el.id='fc-ai-pro-toast'; el.className=`fc-ai-pro-toast ${type}`; el.textContent=message; document.body.appendChild(el); setTimeout(()=>el.remove(),3200) }

  function mount(){
    if(document.querySelector('#fc-ai-pro')) return
    const root=document.createElement('section'); root.id='fc-ai-pro'; root.innerHTML=`<div class="fc-ai-pro-backdrop"></div><div class="fc-ai-pro-panel"><header><div><span>FITCOACH INTELLIGENCE</span><h2>IA do Personal</h2><p>Planeje, analise e acompanhe seus alunos com dados reais.</p></div><button id="fcAiProClose">×</button></header><div class="fc-ai-pro-toolbar"><label>Aluno<select id="fcAiProStudent"></select></label><button id="fcAiProRefresh">↻ Atualizar</button></div><nav id="fcAiProTabs"><button data-tab="dashboard">Visão</button><button data-tab="workout">Treino</button><button data-tab="adapt">Adaptar</button><button data-tab="history">Histórico</button><button data-tab="progression">Carga</button><button data-tab="evaluation">Avaliação</button><button data-tab="routine">Rotina</button><button data-tab="metrics">Métricas</button></nav><main id="fcAiProContent"></main></div>`
    document.body.appendChild(root)
    root.querySelector('#fcAiProClose').onclick=close
    root.querySelector('.fc-ai-pro-backdrop').onclick=close
    root.querySelector('#fcAiProRefresh').onclick=()=>loadStudentData(state.selectedStudent).then(render)
    root.querySelector('#fcAiProStudent').onchange=e=>{state.selectedStudent=e.target.value;loadStudentData(state.selectedStudent).then(render)}
    root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;render()})
  }

  function tabs(){document.querySelectorAll('#fcAiProTabs [data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab))}
  function studentSelect(){const el=document.querySelector('#fcAiProStudent'); if(!el)return; el.innerHTML=state.students.map(s=>`<option value="${s.id}" ${s.id===state.selectedStudent?'selected':''}>${esc(s.name)}</option>`).join('')}
  function selected(){return state.data?.student || state.students.find(s=>s.id===state.selectedStudent)}

  function render(){
    if(!state.open)return
    studentSelect(); tabs()
    const content=document.querySelector('#fcAiProContent'); if(!content)return
    if(!state.data && state.selectedStudent){ loadStudentData(state.selectedStudent).then(render).catch(e=>content.innerHTML=`<div class="fc-ai-pro-empty">Não foi possível carregar os dados: ${esc(e.message)}</div>`); return }
    if(!state.data){content.innerHTML='<div class="fc-ai-pro-empty">Cadastre um aluno para começar.</div>';return}
    const views={dashboard:dashboard,workout:workout,adapt:adapt,history:history,progression:progression,evaluation:evaluation,routine:routine,metrics:metricsView}
    content.innerHTML=views[state.tab](); bind()
  }

  function actionCard(key,title,desc,cta){return `<button class="fc-ai-pro-action" data-run="${key}"><span>${title}</span><small>${desc}</small><b>${cta} →</b></button>`}

  function dashboard(){
    const d=state.data,m=metrics(d),s=d.student,ins=localInsights(d)
    return `<section class="fc-ai-pro-hero"><div><span>ANÁLISE DO ALUNO</span><h1>${esc(s.name)}</h1><p>${esc(s.goal||'Objetivo ainda não informado')} • ${m.last30} treinos em 30 dias</p></div><div class="fc-ai-pro-score"><strong>${m.avgAdherence??'—'}</strong><small>adesão %</small></div></section><div class="fc-ai-pro-kpis"><article><small>Treinos 7d</small><strong>${m.last7}</strong></article><article><small>Treinos 30d</small><strong>${m.last30}</strong></article><article><small>Variação peso</small><strong>${m.delta==null?'—':`${m.delta>0?'+':''}${m.delta} kg`}</strong></article><article><small>Energia média</small><strong>${m.energy??'—'}</strong></article></div><div class="fc-ai-pro-grid">${actionCard('generate','Montar treino personalizado','Cria uma ficha baseada em objetivo, histórico e nível atual.','Gerar')}${actionCard('adapt','Adaptar conforme evolução','Revisa volume, frequência e seleção de exercícios com base nos dados.','Adaptar')}${actionCard('analyze','Analisar histórico','Resume consistência, evolução e pontos de atenção.','Analisar')}${actionCard('progression','Sugerir progressão de carga','Propõe uma progressão conservadora para os exercícios registrados.','Sugerir')}${actionCard('evaluation','Gerar avaliação','Cria um relatório profissional de evolução e próximos passos.','Gerar')}${actionCard('routine','Montar rotina semanal','Ajuda o personal a organizar a semana do aluno.','Montar')}</div><section class="fc-ai-pro-insights"><header><span>PONTOS AUTOMÁTICOS</span><b>Atualizado agora</b></header>${ins.map(i=>`<div class="insight ${i[0]}"><strong>${esc(i[1])}</strong><span>${esc(i[2])}</span></div>`).join('')}</section>`
  }

  function workout(){
    const s=state.data.student
    return `<section class="fc-ai-pro-section-head"><span>GERADOR DE TREINO</span><h2>Treino personalizado</h2><p>Gera uma proposta editável. Nada é salvo sem sua confirmação.</p></section><div class="fc-ai-pro-form"><label>Objetivo<input id="aiGoal" value="${esc(s.goal||'Hipertrofia')}" /></label><label>Nível<select id="aiLevel"><option>Iniciante</option><option selected>Intermediário</option><option>Avançado</option></select></label><label>Frequência semanal<input id="aiFrequency" type="number" min="1" max="7" value="4" /></label><label>Equipamentos<input id="aiEquipment" value="Academia completa" /></label><label class="wide">Restrições/observações<textarea id="aiConstraints" rows="4" placeholder="Ex.: prefere treinos de 60 min, evitar exercícios que incomodam..."></textarea></label></div><div class="fc-ai-pro-actions"><button class="fc-ai-pro-primary" data-run="generate">Gerar com IA</button></div>${state.lastPlan?planPreview(state.lastPlan):''}`
  }

  function planPreview(plan){
    const exercises=Array.isArray(plan.exercises)?plan.exercises:[]
    return `<section class="fc-ai-pro-result"><header><div><span>PROPOSTA GERADA</span><h3>${esc(plan.name||'Treino personalizado')}</h3><p>${esc(plan.rationale||'Proposta baseada nos dados disponíveis.')}</p></div><button data-apply-plan>Aplicar ao treino</button></header><div class="fc-ai-pro-exercises">${exercises.map((e,i)=>`<article><b>${String(i+1).padStart(2,'0')}</b><div><strong>${esc(e.exercise_name||e.name)}</strong><span>${e.sets||3} séries • ${esc(e.reps||'8-12')} reps • ${esc(e.load||'Carga a definir')} • ${e.rest_seconds||60}s</span></div></article>`).join('')}</div></section>`
  }

  function adapt(){return resultView('ADAPTAÇÃO','Adaptar treino conforme evolução','adapt','A IA compara frequência, evolução, check-ins e ficha atual e sugere o que manter, reduzir ou progredir.')}
  function history(){return resultView('HISTÓRICO DO ALUNO','Analisar histórico','analyze','Transforma o histórico em uma leitura rápida para decisão do personal.')}
  function progression(){return resultView('PROGRESSÃO','Sugestão de carga','progression','Analisa o desempenho registrado e sugere uma progressão conservadora. A carga final continua sendo decisão do personal.')}
  function evaluation(){return resultView('RELATÓRIO','Gerar avaliação/evolução','evaluation','Gera um relatório profissional com evolução, consistência, pontos fortes, atenção e próximos passos.')}
  function routine(){return resultView('ROTINA','Rotina semanal do aluno','routine','Organiza uma proposta semanal considerando frequência, recuperação e objetivo.')}

  function resultView(eyebrow,title,run,desc){return `<section class="fc-ai-pro-section-head"><span>${eyebrow}</span><h2>${title}</h2><p>${desc}</p></section><button class="fc-ai-pro-primary" data-run="${run}">Executar análise com IA</button><div id="fcAiProResult" class="fc-ai-pro-output"><div>O resultado aparecerá aqui.</div></div>`}

  function metricsView(){
    const d=state.data,m=metrics(d),weights=d.progress.filter(x=>x.weight_kg!=null).slice().reverse()
    const adherence=d.checkins.slice().reverse().map(c=>Number(c.adherence||0))
    return `<section class="fc-ai-pro-section-head"><span>MÉTRICAS</span><h2>Leitura rápida de desempenho</h2><p>Dados reais do aluno, sem inventar números ausentes.</p></section><div class="fc-ai-pro-kpis"><article><small>Fichas</small><strong>${m.workouts}</strong></article><article><small>Registros</small><strong>${m.progress}</strong></article><article><small>Adesão média</small><strong>${m.avgAdherence??'—'}${m.avgAdherence!=null?'%':''}</strong></article><article><small>Energia média</small><strong>${m.energy??'—'}</strong></article></div><section class="fc-ai-pro-chart"><header><b>Tendência de peso</b><span>${weights.length?'últimos registros':'sem dados'}</span></header><div class="fc-ai-pro-spark">${weights.length?weights.map(p=>`<div style="height:${sparkHeight(p.weight_kg,weights)}%"><span>${p.weight_kg}</span><small>${fmt(p.created_at)}</small></div>`).join(''):'<div class="fc-ai-pro-empty">Sem registros de peso.</div>'}</div></section><section class="fc-ai-pro-chart"><header><b>Adesão</b><span>${adherence.length?'check-ins':'sem dados'}</span></header><div class="fc-ai-pro-spark">${adherence.length?adherence.map(v=>`<div style="height:${Math.max(8,v)}%"><span>${v}%</span></div>`).join(''):'<div class="fc-ai-pro-empty">Sem check-ins.</div>'}</div></section>`
  }
  function sparkHeight(v,arr){const nums=arr.map(x=>Number(x.weight_kg)).filter(Number.isFinite),max=Math.max(...nums),min=Math.min(...nums);return max===min?55:18+((Number(v)-min)/(max-min))*72}

  async function runAction(action){
    if(state.busy)return
    state.busy=true
    const output=document.querySelector('#fcAiProResult')
    if(output)output.innerHTML='<div class="fc-ai-pro-loading">Analisando dados do aluno…</div>'
    try {
      const ctx=await context(); if(!ctx?.session)throw new Error('Sessão expirada.')
      const prompt = buildPrompt(action)
      const res=await fetch('/api/trainer-ai',{method:'POST',headers:{'content-type':'application/json',Authorization:`Bearer ${ctx.session.access_token}`},body:JSON.stringify({action,student:state.data.student,workouts:state.data.workouts,progress:state.data.progress,history:state.data.history,checkins:state.data.checkins,prompt})})
      const data=await res.json().catch(()=>({}))
      if(!res.ok)throw new Error(data.error||'Não foi possível consultar a IA.')
      if(action==='generate')state.lastPlan=data.result
      const target=document.querySelector('#fcAiProResult')
      if(target)target.innerHTML=renderResult(action,data.result,data.mode)
      if(action==='generate')render()
    } catch(error){
      if(output)output.innerHTML=`<div class="fc-ai-pro-error">${esc(error.message)}</div>`
      toast(error.message,'error')
    } finally { state.busy=false }
  }

  function buildPrompt(action){
    const s=state.data.student,m=metrics(state.data)
    if(action==='generate') return `Crie um treino personalizado para ${s.name}. Objetivo: ${s.goal||'não informado'}. Regras do personal: objetivo e frequência informados na tela. Não invente dados clínicos. Retorne JSON com name, rationale e exercises[]. Cada exercise deve ter exercise_name, sets, reps, load, rest_seconds.`
    if(action==='adapt') return `Analise a ficha atual e evolução de ${s.name}. Identifique o que manter, o que adaptar e por quê. Sugira mudanças de volume, frequência, seleção e descanso sem inventar dados.`
    if(action==='analyze') return `Analise o histórico de ${s.name}. Resuma consistência, evolução, aderência, tendências e pontos de atenção. Separe fatos observados de inferências.`
    if(action==='progression') return `Sugira progressão de carga para ${s.name} usando apenas dados existentes na ficha, histórico e evolução. Não invente kg. Se não houver dados suficientes, diga isso e proponha o que registrar.`
    if(action==='evaluation') return `Gere uma avaliação profissional de evolução de ${s.name}, com resumo, pontos fortes, pontos de atenção e próximos passos. Use somente dados fornecidos.`
    return `Monte uma rotina semanal para ${s.name}, objetivo ${s.goal||'não informado'}, considerando frequência, recuperação e histórico. Não faça prescrição clínica.`
  }

  function renderResult(action,result,mode){
    if(typeof result==='string')return `<article class="fc-ai-pro-text"><div class="fc-ai-pro-mode">${mode==='ai'?'IA FITCOACH':'SMART FITCOACH'}</div><p>${esc(result)}</p></article>`
    if(action==='generate' && result?.exercises)return planPreview(result)
    const sections = Object.entries(result||{}).map(([k,v])=>`<section><span>${esc(k.replaceAll('_',' ').toUpperCase())}</span><p>${esc(Array.isArray(v)?v.map(x=>typeof x==='object'?JSON.stringify(x):x).join(' • '):typeof v==='object'?JSON.stringify(v,null,2):v)}</p></section>`).join('')
    return `<article class="fc-ai-pro-text"><div class="fc-ai-pro-mode">${mode==='ai'?'IA FITCOACH':'SMART FITCOACH'}</div>${sections}</article>`
  }

  async function applyPlan(){
    const plan=state.lastPlan,s=state.data.student
    if(!plan?.exercises?.length)return toast('Gere um treino primeiro.','error')
    const ctx=await context(); if(!ctx?.session)return
    const name=plan.name||'Treino IA FITCOACH'
    const {data:w,error}=await supabase.from('workouts').insert({trainer_id:ctx.session.user.id,student_id:s.id,name}).select().single()
    if(error)return toast(error.message,'error')
    const rows=plan.exercises.map((e,i)=>({workout_id:w.id,exercise_name:e.exercise_name||e.name||'Exercício',sets:Number(e.sets)||3,reps:String(e.reps||'8-12'),load:e.load||null,rest_seconds:Number(e.rest_seconds)||60,sort_order:i}))
    const {error:exError}=await supabase.from('workout_exercises').insert(rows)
    if(exError){await supabase.from('workouts').delete().eq('id',w.id);return toast(exError.message,'error')}
    toast('Treino personalizado aplicado à ficha do aluno.')
    await loadStudentData(s.id);state.tab='workout';render()
  }

  function bind(){
    document.querySelectorAll('[data-run]').forEach(b=>b.onclick=()=>runAction(b.dataset.run))
    document.querySelector('[data-apply-plan]')?.addEventListener('click',applyPlan)
  }

  function installLauncher(){
    if(document.querySelector('#fc-ai-pro-launcher'))return
    const btn=document.createElement('button');btn.id='fc-ai-pro-launcher';btn.type='button';btn.innerHTML='<span>✦</span><b>IA PRO</b><small>Personal</small>';btn.setAttribute('aria-label','Abrir IA profissional do personal');btn.onclick=open;document.body.appendChild(btn)
  }

  async function enhance(){
    try { const ctx=await context(); if(ctx?.profile?.role==='trainer'||ctx?.profile?.role==='personal') installLauncher(); else document.querySelector('#fc-ai-pro-launcher')?.remove() } catch(error){ console.warn('FITCOACH IA Pro',error) }
  }
  new MutationObserver(()=>setTimeout(enhance,120)).observe(document.documentElement,{childList:true,subtree:true})
  supabase.auth.onAuthStateChange(()=>setTimeout(enhance,0))
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true}); else enhance()
})()
