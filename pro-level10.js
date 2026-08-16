import './pro-level10.css'
import { supabase } from './supabase'

let scheduled=false
let profileCache=null

const cycles={
  monthly:{
    title:'Mensal',
    period:'1 mês',
    eyebrow:'FLEXÍVEL',
    description:'Para quem quer começar sem compromisso de longo prazo.',
    features:['Acesso ao FITCOACH Professional','Alunos, treinos e evolução','Agenda Pro e check-ins','Painel Pro e Smart/IA','Fotos, avisos e PWA instalável'],
    tag:'Renovação mensal'
  },
  semiannual:{
    title:'Semestral',
    period:'6 meses',
    eyebrow:'RECOMENDADO',
    description:'Equilíbrio entre flexibilidade e permanência.',
    features:['Tudo do plano Mensal','Ciclo de 6 meses','Ideal para acompanhamento contínuo','Menos renovações ao longo do ano','Pronto para desconto semestral'],
    tag:'6 meses'
  },
  annual:{
    title:'Anual',
    period:'12 meses',
    eyebrow:'MELHOR VALOR',
    description:'Para profissionais que querem usar o FITCOACH o ano inteiro.',
    features:['Tudo do plano Semestral','Ciclo de 12 meses','Melhor opção para fidelização','Pronto para maior desconto anual','Operação contínua por 1 ano'],
    tag:'12 meses'
  }
}

const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))

function toast(message,type='ok'){
  document.querySelector('#pro10Toast')?.remove()
  const el=document.createElement('div')
  el.id='pro10Toast';el.className=`pro10-toast ${type}`;el.textContent=message
  document.body.appendChild(el)
  setTimeout(()=>el.remove(),3200)
}

function openModal(html){
  document.querySelector('#pro10Modal')?.remove()
  const wrap=document.createElement('div')
  wrap.id='pro10Modal';wrap.className='pro10-modal'
  wrap.innerHTML=`<div class="pro10-card">${html}</div>`
  wrap.onclick=e=>{if(e.target===wrap)wrap.remove()}
  document.body.appendChild(wrap)
}
window.closePro10Modal=()=>document.querySelector('#pro10Modal')?.remove()

async function getContext(){
  const {data:{session}}=await supabase.auth.getSession()
  if(!session)return null
  if(!profileCache){
    const {data}=await supabase.from('profiles').select('id,role,full_name').eq('id',session.user.id).maybeSingle()
    profileCache=data||null
  }
  return {session,profile:profileCache}
}

async function getPreference(userId){
  const {data}=await supabase.from('trainer_plan_preferences').select('billing_cycle,updated_at').eq('trainer_id',userId).maybeSingle()
  return data||null
}

function cycleCard(key,current){
  const p=cycles[key]
  const selected=current===key
  return `<article class="pro10-plan ${selected?'selected':''} ${key==='semiannual'?'featured':''}">
    <div class="pro10-plan-top"><span class="pro10-eyebrow">${p.eyebrow}</span>${selected?'<span class="pro10-current">Selecionado</span>':''}</div>
    <h3>${p.title}</h3>
    <div class="pro10-period"><strong>${p.period}</strong><span>por ciclo</span></div>
    <p>${p.description}</p>
    <ul>${p.features.map(f=>`<li><span>✓</span>${esc(f)}</li>`).join('')}</ul>
    <button class="btn ${selected?'sec':''} full" data-pro10-cycle="${key}">${selected?'Ciclo selecionado':`Escolher ${p.title}`}</button>
    <small class="pro10-tag">${p.tag}</small>
  </article>`
}

async function openPlans(){
  const ctx=await getContext()
  if(!ctx?.session)return toast('Entre na sua conta para ver os planos.','error')
  if(ctx.profile?.role!=='trainer')return toast('Os planos são destinados à conta do personal.','error')
  const pref=await getPreference(ctx.session.user.id)
  const current=pref?.billing_cycle||''
  openModal(`<div class="pro10-head">
    <div><span class="pro10-badge">FITCOACH PROFESSIONAL • NÍVEL 10</span><h2>Escolha seu ciclo</h2><p>Mensal, semestral ou anual. Todos mantêm os recursos Professional; o que muda é o período de cobrança.</p></div>
    <button class="icon-btn" onclick="closePro10Modal()" aria-label="Fechar">×</button>
  </div>
  <div class="pro10-status"><div><span>STATUS DA COBRANÇA</span><strong>Checkout em preparação</strong></div><p>Selecionar um ciclo agora <b>não gera cobrança</b>. Sua preferência ficará salva até o pagamento online ser conectado.</p></div>
  <div class="pro10-grid">${['monthly','semiannual','annual'].map(k=>cycleCard(k,current)).join('')}</div>
  <div class="pro10-pricing-note"><strong>Próxima configuração</strong><span>Os valores em R$ serão adicionados antes de ativar o checkout. Assim não publicamos preços que você ainda não aprovou.</span></div>`)
  document.querySelectorAll('[data-pro10-cycle]').forEach(btn=>btn.onclick=()=>selectCycle(btn.dataset.pro10Cycle))
}

async function selectCycle(cycle){
  if(!cycles[cycle])return
  const ctx=await getContext();if(!ctx?.session)return
  const uid=ctx.session.user.id
  const {data:existing,error:readError}=await supabase.from('trainer_plan_preferences').select('trainer_id').eq('trainer_id',uid).maybeSingle()
  if(readError)return toast(readError.message,'error')
  let result
  if(existing){
    result=await supabase.from('trainer_plan_preferences').update({billing_cycle:cycle,updated_at:new Date().toISOString()}).eq('trainer_id',uid)
  }else{
    result=await supabase.from('trainer_plan_preferences').insert({trainer_id:uid,billing_cycle:cycle})
  }
  if(result.error)return toast(result.error.message,'error')
  toast(`Preferência salva: plano ${cycles[cycle].title}.`)
  await openPlans()
  scheduleEnhance()
}

async function enhanceHeader(){
  const ctx=await getContext()
  if(ctx?.profile?.role!=='trainer')return
  const userBox=document.querySelector('.user-box')
  if(userBox&&!userBox.querySelector('#pro10PlansHeader')){
    const b=document.createElement('button')
    b.id='pro10PlansHeader';b.className='pro10-header-btn';b.type='button';b.innerHTML='<span>◆</span><span>Planos</span>';b.onclick=openPlans
    const logout=userBox.querySelector('#logoutBtn,.icon-btn')
    userBox.insertBefore(b,logout||null)
  }
}

async function enhanceHome(){
  const ctx=await getContext()
  if(ctx?.profile?.role!=='trainer')return
  const quick=document.querySelector('.quick-actions')
  if(quick&&!quick.querySelector('#pro10PlansHome')){
    const pref=await getPreference(ctx.session.user.id)
    const b=document.createElement('button')
    b.className='btn sec pro10-home-btn';b.id='pro10PlansHome';b.type='button'
    b.innerHTML=pref?.billing_cycle?`◆ Plano: ${cycles[pref.billing_cycle]?.title||'Professional'}`:'◆ Ver planos'
    b.onclick=openPlans;quick.appendChild(b)
  }
  const badge=document.querySelector('.version-badge');if(badge)badge.textContent='v10'
}

async function enhance(){
  try{await enhanceHeader();await enhanceHome()}catch(e){console.warn('FITCOACH pro10:',e)}
}
function scheduleEnhance(){
  if(scheduled)return;scheduled=true
  setTimeout(()=>{scheduled=false;enhance()},160)
}
new MutationObserver(scheduleEnhance).observe(document.documentElement,{subtree:true,childList:true})
window.addEventListener('focus',scheduleEnhance)
scheduleEnhance()
