import './professional-dashboard-v1.css'
import { supabase } from './supabase'

(() => {
  if (window.__FITCOACH_PRO_DASH__) return
  window.__FITCOACH_PRO_DASH__ = true

  const esc = (v='') => String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))
  const auth = async () => { const {data:{session}} = await supabase.auth.getSession(); return session }
  const profile = async id => { const {data} = await supabase.from('profiles').select('role,full_name').eq('id',id).maybeSingle(); return data }
  const plan = async id => { const {data} = await supabase.from('trainer_plan_preferences').select('billing_cycle').eq('trainer_id',id).maybeSingle(); return data }
  const students = async id => { const {data,error} = await supabase.from('students').select('id,name,goal,weight_kg,waist_cm,created_at').eq('trainer_id',id).order('created_at',{ascending:false}); if(error) throw error; return data || [] }

  function target() {
    return document.querySelector('#dashboard,.dashboard,.home-screen,.app-home,main') || document.querySelector('#app')
  }
  function isTrainerPage() {
    const text = (document.body?.innerText || '').toLowerCase()
    return !!document.querySelector('[data-role="trainer"],.trainer-dashboard,#trainer-dashboard') || /alunos|aluno|personal|professor|dashboard/.test(text)
  }
  function mount(data) {
    const old = document.querySelector('#fcProfessionalDashboard'); if(old) old.remove()
    const root = target(); if(!root || !isTrainerPage()) return
    const limit = data.plan?.billing_cycle === 'monthly' ? 30 : data.plan?.billing_cycle === 'semiannual' ? 15 : 10
    const isPro = !!data.plan?.billing_cycle
    const recent = data.students.slice(0,4)
    const pct = Math.min(100, Math.round((data.students.length/limit)*100))
    const pending = data.students.filter(s => !s.weight_kg || !s.waist_cm).length
    const html = `<section id="fcProfessionalDashboard" class="fc-pro-dash" aria-label="Dashboard profissional"><div class="fc-pro-dash-head"><div><span class="fc-pro-eyebrow">FITCOACH • ${isPro?'PRO':'LIVRE'}</span><h2>Visão profissional</h2><p>Seu painel rápido para acompanhar alunos, evolução e próximos passos.</p></div><button id="fcProPlansBtn" class="fc-pro-plan-btn" type="button">${isPro?'⭐ Plano '+(data.plan.billing_cycle==='monthly'?'Mensal':'Semestral'):'◆ Ver planos'}</button></div><div class="fc-pro-metrics"><article><span>Alunos ativos</span><strong>${data.students.length}</strong><small>de ${limit} disponíveis</small></article><article><span>Perfil completo</span><strong>${Math.max(0,data.students.length-pending)}</strong><small>${pending} precisam de dados</small></article><article><span>Capacidade</span><strong>${pct}%</strong><div class="fc-pro-bar"><i style="width:${pct}%"></i></div></article><article><span>IA profissional</span><strong>${isPro?'Ativa':'Pro'}</strong><small>${isPro?'Assistente disponível':'Faça upgrade para liberar'}</small></article></div><div class="fc-pro-grid"><article class="fc-pro-panel"><div class="fc-pro-panel-title"><div><span class="fc-pro-eyebrow">ALUNOS</span><h3>Visão rápida</h3></div><span>${data.students.length} total</span></div>${recent.length?`<div class="fc-pro-students">${recent.map(s=>`<div class="fc-pro-student"><div class="fc-pro-avatar">${esc((s.name||'?').slice(0,1).toUpperCase())}</div><div><strong>${esc(s.name||'Aluno')}</strong><small>${esc(s.goal||'Objetivo não definido')}</small></div><em>${s.weight_kg?esc(s.weight_kg)+' kg':'Avaliação pendente'}</em></div>`).join('')}</div>`:'<div class="fc-pro-empty">Cadastre seu primeiro aluno para começar o acompanhamento.</div>'}</article><article class="fc-pro-panel"><div class="fc-pro-panel-title"><div><span class="fc-pro-eyebrow">ACOMPANHAMENTO</span><h3>Próximas ações</h3></div></div><div class="fc-pro-actions"><div><b>${pending}</b><span>avaliações com dados incompletos</span></div><div><b>${data.students.length}</b><span>alunos para acompanhar</span></div><div><b>${isPro?'IA':'PRO'}</b><span>${isPro?'assistente do Personal ativo':'recursos inteligentes disponíveis no Pro'}</span></div></div></article></div></section>`
    root.insertAdjacentHTML('afterbegin', html)
    document.querySelector('#fcProPlansBtn')?.addEventListener('click',()=>document.querySelector('#pro10PlansHeader,#pro10PlansHome')?.click())
  }
  async function refresh() {
    const session=await auth(); if(!session) return
    const p=await profile(session.user.id); if(p?.role!=='trainer') return
    try { mount({profile:p,plan:await plan(session.user.id),students:await students(session.user.id)}) } catch(e) { console.warn('FITCOACH professional dashboard:',e) }
  }
  let timer
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>refresh().catch(()=>{}),400)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule,{once:true}); else schedule()
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})
})()
