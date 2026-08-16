import './pro-suite.css'
import { supabase } from './supabase'

(() => {
  const state = { open: false, tab: 'overview', students: [], workouts: [], progress: [] }
  const esc = (v = '') => String(v).replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]))
  const fmt = value => value ? new Date(value).toLocaleDateString('pt-BR') : '-'
  const moneySafe = value => Number.isFinite(Number(value)) ? Number(value) : 0

  const mount = () => {
    if (document.querySelector('#fc-pro-suite')) return
    const launcher = document.createElement('button')
    launcher.id = 'fc-pro-launcher'
    launcher.type = 'button'
    launcher.innerHTML = '<span>FC</span><small>PRO</small>'
    launcher.setAttribute('aria-label', 'Abrir Central Profissional FITCOACH')
    launcher.onclick = open
    document.body.appendChild(launcher)

    const root = document.createElement('div')
    root.id = 'fc-pro-suite'
    root.className = 'fc-pro-hidden'
    root.innerHTML = `<div class="fc-pro-backdrop"></div><section class="fc-pro-panel" role="dialog" aria-modal="true" aria-labelledby="fc-pro-title">
      <header class="fc-pro-header"><div><span class="fc-pro-eyebrow">FITCOACH PROFESSIONAL</span><h2 id="fc-pro-title">Central do Personal</h2><p>Gestão, análise e ferramentas em um só lugar.</p></div><button class="fc-pro-close" aria-label="Fechar">×</button></header>
      <nav class="fc-pro-tabs" aria-label="Central profissional">
        <button data-tab="overview">Visão geral</button><button data-tab="students">Alunos</button><button data-tab="workouts">Treinos</button><button data-tab="progress">Evolução</button><button data-tab="tools">Ferramentas</button>
      </nav><main class="fc-pro-content" id="fc-pro-content"></main></section>`
    document.body.appendChild(root)
    root.querySelector('.fc-pro-backdrop').onclick = close
    root.querySelector('.fc-pro-close').onclick = close
    root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { state.tab = b.dataset.tab; render() })
  }

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false
    const [students, workouts, progress] = await Promise.all([
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('workouts').select('id,name,student_id,students(name),created_at').order('created_at', { ascending: false }),
      supabase.from('progress_logs').select('*,students(name)').order('created_at', { ascending: false }).limit(100)
    ])
    state.students = students.data || []
    state.workouts = workouts.data || []
    state.progress = progress.data || []
    return !students.error && !workouts.error && !progress.error
  }

  function open() { mount(); state.open = true; document.querySelector('#fc-pro-suite').classList.remove('fc-pro-hidden'); document.body.classList.add('fc-pro-lock'); load().then(render) }
  function close() { state.open = false; document.querySelector('#fc-pro-suite')?.classList.add('fc-pro-hidden'); document.body.classList.remove('fc-pro-lock') }

  const card = (label, value, hint, icon) => `<article class="fc-pro-stat"><span>${icon}</span><small>${label}</small><strong>${value}</strong><em>${hint}</em></article>`

  function render() {
    if (!state.open) return
    const content = document.querySelector('#fc-pro-content')
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === state.tab))
    if (state.tab === 'overview') content.innerHTML = overview()
    if (state.tab === 'students') content.innerHTML = studentsView()
    if (state.tab === 'workouts') content.innerHTML = workoutsView()
    if (state.tab === 'progress') content.innerHTML = progressView()
    if (state.tab === 'tools') content.innerHTML = toolsView()
    bindContent()
  }

  function overview() {
    const linked = state.students.filter(s => s.user_id).length
    const pending = state.students.length - linked
    const last = state.progress[0]
    const weights = state.progress.filter(p => p.weight_kg != null).map(p => Number(p.weight_kg)).filter(Number.isFinite)
    const avg = weights.length ? (weights.reduce((a,b)=>a+b,0)/weights.length).toFixed(1) : '-'
    return `<div class="fc-pro-welcome"><div><span class="fc-pro-eyebrow">COMMAND CENTER</span><h1>Seu negócio, de forma mais profissional.</h1><p>Uma visão rápida da carteira, treinos e evolução sem sair do FITCOACH.</p></div><div class="fc-pro-health"><b>● Sistema saudável</b><span>Dados sincronizados com Supabase</span></div></div>
      <div class="fc-pro-stats">${card('Alunos', state.students.length, `${linked} vinculados`, '♙')}${card('Treinos', state.workouts.length, 'fichas cadastradas', '◆')}${card('Registros', state.progress.length, 'histórico de evolução', '↗')}${card('Peso médio', avg, 'últimos registros', '⚖')}</div>
      <div class="fc-pro-grid"><section class="fc-pro-box"><div class="fc-pro-box-head"><div><span class="fc-pro-eyebrow">ATENÇÃO</span><h3>Carteira de alunos</h3></div></div><div class="fc-pro-bars"><div><span>Vinculados</span><b>${linked}</b><i style="width:${state.students.length ? linked/state.students.length*100 : 0}%"></i></div><div><span>Convites pendentes</span><b>${pending}</b><i style="width:${state.students.length ? pending/state.students.length*100 : 0}%"></i></div></div></section><section class="fc-pro-box"><div class="fc-pro-box-head"><div><span class="fc-pro-eyebrow">ÚLTIMA EVOLUÇÃO</span><h3>${esc(last?.students?.name || 'Nenhum registro')}</h3></div></div>${last ? `<div class="fc-pro-highlight"><strong>${last.weight_kg ?? '-'} kg</strong><span>${last.waist_cm ?? '-'} cm cintura</span><small>${fmt(last.created_at)}</small></div>` : '<p class="fc-pro-muted">Registre a primeira evolução para começar a acompanhar resultados.</p>'}</section></div>
      <div class="fc-pro-actions"><button data-action="student">+ Novo aluno</button><button data-action="workout">+ Montar treino</button><button data-action="progress">+ Registrar evolução</button></div>`
  }

  function studentsView() {
    return `<div class="fc-pro-view-head"><div><span class="fc-pro-eyebrow">GESTÃO</span><h2>Carteira de alunos</h2><p>Pesquise, acompanhe vínculo e exporte seus dados.</p></div><input id="fc-pro-filter" placeholder="Buscar aluno..."></div><div class="fc-pro-table-wrap"><table><thead><tr><th>Aluno</th><th>Objetivo</th><th>Peso</th><th>Status</th><th>Cadastro</th></tr></thead><tbody>${state.students.length ? state.students.map(s=>`<tr data-search="${esc(`${s.name} ${s.goal||''}`.toLowerCase())}"><td><b>${esc(s.name)}</b></td><td>${esc(s.goal||'-')}</td><td>${s.weight_kg ?? '-'} kg</td><td><span class="fc-pro-pill ${s.user_id?'ok':''}">${s.user_id?'Vinculado':'Pendente'}</span></td><td>${fmt(s.created_at)}</td></tr>`).join('') : '<tr><td colspan="5" class="fc-pro-empty">Nenhum aluno cadastrado.</td></tr>'}</tbody></table></div>`
  }

  function workoutsView() {
    return `<div class="fc-pro-view-head"><div><span class="fc-pro-eyebrow">PROGRAMAÇÃO</span><h2>Treinos</h2><p>Visão geral das fichas e distribuição por aluno.</p></div><input id="fc-pro-filter" placeholder="Buscar treino ou aluno..."></div><div class="fc-pro-table-wrap"><table><thead><tr><th>Treino</th><th>Aluno</th><th>Exercícios</th><th>Criado</th></tr></thead><tbody>${state.workouts.length ? state.workouts.map(w=>`<tr data-search="${esc(`${w.name} ${w.students?.name||''}`.toLowerCase())}"><td><b>${esc(w.name)}</b></td><td>${esc(w.students?.name||'-')}</td><td>${Array.isArray(w.workout_exercises) ? w.workout_exercises.length : '—'}</td><td>${fmt(w.created_at)}</td></tr>`).join('') : '<tr><td colspan="4" class="fc-pro-empty">Nenhum treino cadastrado.</td></tr>'}</tbody></table></div>`
  }

  function progressView() {
    const rows = state.progress.slice(0, 30)
    const weights = rows.filter(p=>p.weight_kg!=null).slice().reverse()
    const max = weights.length ? Math.max(...weights.map(p=>Number(p.weight_kg))) : 1
    const min = weights.length ? Math.min(...weights.map(p=>Number(p.weight_kg))) : 0
    return `<div class="fc-pro-view-head"><div><span class="fc-pro-eyebrow">RESULTADOS</span><h2>Evolução</h2><p>Histórico recente de peso e medidas.</p></div></div><section class="fc-pro-chart"><div class="fc-pro-chart-title"><strong>Tendência de peso</strong><span>${weights.length ? `${min}–${max} kg` : 'Sem dados'}</span></div><div class="fc-pro-chart-body">${weights.length ? weights.map(p=>{const n=Number(p.weight_kg);const h=max===min?55:18+((n-min)/(max-min))*64;return `<div class="fc-pro-bar" style="height:${h}%"><b>${n}</b><span>${fmt(p.created_at)}</span></div>`}).join('') : '<div class="fc-pro-empty">Registre evoluções para visualizar o gráfico.</div>'}</div></section><div class="fc-pro-table-wrap"><table><thead><tr><th>Aluno</th><th>Data</th><th>Peso</th><th>Cintura</th><th>Observação</th></tr></thead><tbody>${rows.map(p=>`<tr><td><b>${esc(p.students?.name||'-')}</b></td><td>${fmt(p.created_at)}</td><td>${p.weight_kg ?? '-'} kg</td><td>${p.waist_cm ?? '-'} cm</td><td>${esc(p.notes||'-')}</td></tr>`).join('') || '<tr><td colspan="5" class="fc-pro-empty">Sem registros.</td></tr>'}</tbody></table></div>`
  }

  function toolsView() {
    return `<div class="fc-pro-tool-grid"><button data-tool="export-students"><b>Exportar alunos</b><span>CSV para Excel/planilhas</span></button><button data-tool="export-all"><b>Backup completo</b><span>JSON com alunos, treinos e evolução</span></button><button data-tool="print"><b>Relatório</b><span>Gerar versão para impressão/PDF</span></button><button data-tool="pwa"><b>Status do aplicativo</b><span>Verificar PWA e instalação</span></button><button data-tool="refresh"><b>Sincronizar dados</b><span>Atualizar informações do Supabase</span></button><button data-tool="clear"><b>Limpar pesquisa</b><span>Restaurar todas as tabelas</span></button></div><div class="fc-pro-note"><strong>Segurança</strong><span>O backup é gerado localmente no dispositivo. Nenhuma senha ou token é exportado.</span></div>`
  }

  function bindContent() {
    const filter = document.querySelector('#fc-pro-filter')
    if (filter) filter.oninput = () => document.querySelectorAll('tbody tr[data-search]').forEach(r => r.style.display = r.dataset.search.includes(filter.value.toLowerCase().trim()) ? '' : 'none')
    document.querySelectorAll('[data-action="student"]').forEach(b=>b.onclick=()=>{close();document.querySelector('#newStudent,#quickStudent')?.click()})
    document.querySelectorAll('[data-action="workout"]').forEach(b=>b.onclick=()=>{close();document.querySelector('#newWorkout,#quickWorkout')?.click()})
    document.querySelectorAll('[data-action="progress"]').forEach(b=>b.onclick=()=>{close();document.querySelector('[data-progress]')?.click()})
    document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>tool(b.dataset.tool))
  }

  function download(name, text, type) { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000) }
  function csv(rows) { const keys=['name','goal','weight_kg','waist_cm','user_id','created_at']; return [keys.join(';'),...rows.map(r=>keys.map(k=>`"${String(r[k]??'').replace(/"/g,'""')}"`).join(';'))].join('\n') }
  async function tool(kind) {
    if(kind==='export-students') return download('fitcoach-alunos.csv','\ufeff'+csv(state.students),'text/csv;charset=utf-8')
    if(kind==='export-all') return download('fitcoach-backup.json',JSON.stringify({exported_at:new Date().toISOString(),students:state.students,workouts:state.workouts,progress:state.progress},null,2),'application/json')
    if(kind==='print'){ window.print(); return }
    if(kind==='refresh'){ await load(); render(); return }
    if(kind==='clear'){ const input=document.querySelector('#fc-pro-filter'); if(input){input.value='';input.dispatchEvent(new Event('input'))} return }
    if(kind==='pwa'){ const standalone=window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone; const sw='serviceWorker' in navigator; alert(`PWA: ${sw?'service worker disponível':'service worker não detectado'}\nModo instalado: ${standalone?'sim':'não'}\nOnline: ${navigator.onLine?'sim':'não'}`) }
  }

  addEventListener('keydown', e => { if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='j'){e.preventDefault();state.open?close():open()} if(e.key==='Escape'&&state.open)close() })
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', mount, {once:true}); else mount()
})()
