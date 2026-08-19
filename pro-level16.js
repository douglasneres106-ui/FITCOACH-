import './pro-level16.css'
import { supabase } from './supabase'

(() => {
  if (window.__FITCOACH_PRO16__) return
  window.__FITCOACH_PRO16__ = true
  let context
  let students = []
  let progress = []
  let history = []

  const esc = (v='') => String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
  const fmt = v => v ? new Date(v).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) : '-'
  const num = v => Number.isFinite(Number(v)) ? Number(v) : null

  async function getContext() {
    const { data:{ session } } = await supabase.auth.getSession()
    if (!session) return null
    const { data:profile } = await supabase.from('profiles').select('id,role,full_name').eq('id',session.user.id).maybeSingle()
    return { session, profile }
  }

  async function load() {
    context = await getContext()
    if (context?.profile?.role !== 'trainer') return false
    const [s,p,h] = await Promise.all([
      supabase.from('students').select('id,name,goal,created_at').eq('trainer_id',context.session.user.id).order('name'),
      supabase.from('progress_logs').select('id,student_id,weight_kg,waist_cm,created_at,notes').eq('trainer_id',context.session.user.id).order('created_at',{ascending:true}).limit(2000),
      supabase.from('workout_history').select('student_id,completed_at,workout_name').eq('trainer_id',context.session.user.id).order('completed_at',{ascending:false}).limit(3000)
    ])
    if (s.error || p.error || h.error) throw new Error((s.error || p.error || h.error).message)
    students = s.data || []
    progress = p.data || []
    history = h.data || []
    return true
  }

  function studentStats(studentId) {
    const rows = progress.filter(x=>x.student_id===studentId).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at))
    const recent = rows[rows.length-1]
    const previous = rows.length>1 ? rows[rows.length-2] : null
    const weights = rows.filter(x=>num(x.weight_kg)!==null)
    const firstWeight = weights[0]?.weight_kg != null ? num(weights[0].weight_kg) : null
    const lastWeight = recent?.weight_kg != null ? num(recent.weight_kg) : null
    const deltaWeight = firstWeight!==null && lastWeight!==null ? +(lastWeight-firstWeight).toFixed(1) : null
    const firstWaist = rows.find(x=>num(x.waist_cm)!==null)?.waist_cm
    const lastWaist = recent?.waist_cm != null ? num(recent.waist_cm) : null
    const deltaWaist = firstWaist!==undefined && lastWaist!==null ? +(lastWaist-num(firstWaist)).toFixed(1) : null
    const studentHistory = history.filter(x=>x.student_id===studentId)
    const last7 = studentHistory.filter(x=>Date.now()-new Date(x.completed_at).getTime()<=7*86400000).length
    const last30 = studentHistory.filter(x=>Date.now()-new Date(x.completed_at).getTime()<=30*86400000).length
    const lastWorkout = studentHistory[0]?.completed_at
    const daysSinceWorkout = lastWorkout ? Math.floor((Date.now()-new Date(lastWorkout).getTime())/86400000) : null
    const daysSinceProgress = recent ? Math.floor((Date.now()-new Date(recent.created_at).getTime())/86400000) : null
    return {rows,recent,previous,firstWeight,lastWeight,deltaWeight,deltaWaist,lastWaist,last7,last30,daysSinceWorkout,daysSinceProgress}
  }

  function recommendations(student, s) {
    const rec = []
    if (!s.rows.length) rec.push('Registre peso e medidas deste aluno para criar uma linha de base e acompanhar tendência.')
    if (s.daysSinceProgress !== null && s.daysSinceProgress >= 45) rec.push(`A última avaliação tem ${s.daysSinceProgress} dias. Considere atualizar peso, medidas e observações.`)
    if (s.daysSinceWorkout === null || s.daysSinceWorkout >= 14) rec.push('A frequência recente está baixa. Vale entrar em contato e revisar adesão, rotina e possíveis barreiras.')
    else if (s.daysSinceWorkout >= 7) rec.push('O último treino foi há vários dias. Confirme como está a adesão antes de aumentar volume ou carga.')
    if (s.last7 >= 3) rec.push('Boa consistência recente. Use os registros de execução para decidir se há espaço para progressão.')
    if (s.deltaWeight !== null && Math.abs(s.deltaWeight) >= 3) rec.push(`O peso mudou ${Math.abs(s.deltaWeight)} kg desde o primeiro registro. Interprete junto com objetivo e medidas, sem assumir que a mudança é só massa muscular ou gordura.`)
    if (s.deltaWaist !== null && Math.abs(s.deltaWaist) >= 3) rec.push(`A cintura variou ${Math.abs(s.deltaWaist)} cm desde o primeiro registro. Compare com o objetivo e a tendência de peso.`)
    if (!rec.length) rec.push('Evolução estável. Continue registrando desempenho, peso e medidas antes de alterar a estratégia.')
    return rec.slice(0,4)
  }

  function metric(label,value,hint,cls='') { return `<article class="pro16-metric"><small>${label}</small><strong class="${cls}">${value}</strong><span>${hint}</span></article>` }

  function render(selectedId) {
    const root = document.querySelector('#pro16Evolution')
    if (!root) return
    const student = students.find(s=>s.id===selectedId) || students[0]
    if (!student) { root.innerHTML = `<div class="pro16-empty">Nenhum aluno cadastrado para analisar.</div>`; return }
    const s = studentStats(student.id)
    const weightRows = s.rows.filter(x=>num(x.weight_kg)!==null).slice(-10)
    const max = weightRows.length ? Math.max(...weightRows.map(x=>num(x.weight_kg))) : 1
    const min = weightRows.length ? Math.min(...weightRows.map(x=>num(x.weight_kg))) : 0
    const scale = max===min ? 58 : 18
    const recommendationsHtml = recommendations(student,s).map(x=>`<div class="pro16-rec"><i>✦</i><p>${esc(x)}</p></div>`).join('')
    root.innerHTML = `<div class="pro16-head"><div><div class="pro16-kicker">FITCOACH INTELLIGENCE • EVOLUÇÃO</div><h2>Evolução inteligente do aluno</h2><p>Transforme histórico, frequência e medidas em decisões melhores para o próximo treino.</p></div><select class="pro16-select" id="pro16Student">${students.map(x=>`<option value="${x.id}" ${x.id===student.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
      <div class="pro16-metrics">${metric('Peso atual',s.lastWeight!==null?`${s.lastWeight} kg`:'-',s.deltaWeight===null?'Sem comparação':`${s.deltaWeight>0?'+':''}${s.deltaWeight} kg desde o 1º registro`,s.deltaWeight>0?'pro16-delta-down':s.deltaWeight<0?'pro16-delta-up':'')}${metric('Cintura',s.lastWaist!==null?`${s.lastWaist} cm`:'-',s.deltaWaist===null?'Sem comparação':`${s.deltaWaist>0?'+':''}${s.deltaWaist} cm desde o 1º registro`,s.deltaWaist>0?'pro16-delta-down':s.deltaWaist<0?'pro16-delta-up':'')}${metric('Treinos 7 dias',s.last7,`${s.last30} nos últimos 30 dias`)}${metric('Registros',s.rows.length,s.daysSinceProgress===null?'Sem avaliação':`último há ${s.daysSinceProgress}d`)}</div>
      <div class="pro16-grid"><section class="pro16-box"><div class="pro16-kicker">TENDÊNCIA</div><h3>Peso registrado</h3>${weightRows.length?`<div class="pro16-chart">${weightRows.map(r=>{const n=num(r.weight_kg);const h=max===min?58:18+((n-min)/(max-min))*64;return `<div class="pro16-bar" style="height:${h}%"><b>${n}kg</b><span>${fmt(r.created_at)}</span></div>`}).join('')}</div>`:'<div class="pro16-empty">Ainda não existem registros de peso.</div>'}</section><section class="pro16-box"><div class="pro16-kicker">PRÓXIMAS DECISÕES</div><h3>Recomendações</h3><div class="pro16-recommendations">${recommendationsHtml}</div></section></div>
      <div class="pro16-actions"><button class="primary" id="pro16AI">✦ Abrir IA do Personal</button><button id="pro16StudentDetail">Ver aluno</button><button id="pro16Refresh">Atualizar dados</button></div>`
    root.querySelector('#pro16Student').onchange = e => render(e.target.value)
    root.querySelector('#pro16Refresh').onclick = async () => { const btn=root.querySelector('#pro16Refresh'); btn.textContent='Atualizando...'; try{await load();render(root.querySelector('#pro16Student')?.value||selectedId)}catch(e){btn.textContent='Erro ao atualizar';setTimeout(()=>btn.textContent='Atualizar dados',1800)} }
    root.querySelector('#pro16AI').onclick = () => document.querySelector('#fc-ai-pro-launcher')?.click() || document.querySelector('#pro6Launcher')?.click() || document.querySelector('#pro6AIHome')?.click()
    root.querySelector('#pro16StudentDetail').onclick = () => { document.querySelector(`[data-student="${student.id}"]`)?.click(); document.querySelector(`[data-student-id="${student.id}"]`)?.click() }
  }

  async function mount() {
    if (document.querySelector('#pro16Evolution')) return
    const ctx = await getContext()
    if (ctx?.profile?.role !== 'trainer') return
    const content = document.querySelector('#content')
    if (!content) return
    const panel = document.createElement('section')
    panel.id = 'pro16Evolution'
    panel.className = 'pro16-evolution'
    content.prepend(panel)
    try { await load(); render(students[0]?.id) } catch (error) { panel.innerHTML = `<div class="pro16-empty">Não foi possível carregar a inteligência de evolução agora.</div>`; console.warn('FITCOACH pro16',error) }
  }

  const observe = () => setTimeout(mount, 120)
  new MutationObserver(observe).observe(document.documentElement,{subtree:true,childList:true})
  window.addEventListener('focus',mount)
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount()
})()
