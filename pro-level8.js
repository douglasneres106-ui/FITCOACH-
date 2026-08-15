import './pro-level8.css'

let scheduled=false
let originalAlert=window.alert

function professionalToast(message,type='info'){
  document.querySelector('#pro8Toast')?.remove()
  const el=document.createElement('div')
  el.id='pro8Toast'
  el.className=`pro8-toast ${type}`
  el.setAttribute('role','status')
  el.innerHTML=`<span class="pro8-toast-dot"></span><div><strong>${type==='error'?'Atenção':'FITCOACH'}</strong><span>${String(message||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}</span></div>`
  document.body.appendChild(el)
  requestAnimationFrame(()=>el.classList.add('show'))
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),220)},3600)
}

function replaceNativeAlert(){
  if(window.alert?.__fitcoachProfessional)return
  const wrapped=(message)=>professionalToast(message,'error')
  wrapped.__fitcoachProfessional=true
  wrapped.__original=originalAlert
  window.alert=wrapped
}

function enhanceBrand(){
  document.querySelectorAll('.brand').forEach(brand=>{
    if(brand.querySelector('.pro8-logo-mark'))return
    const large=brand.classList.contains('brand-large')
    brand.innerHTML=`<span class="pro8-logo-mark">FC</span><span class="pro8-brand-name">FIT<b>COACH</b>${large?'<small>Professional</small>':''}</span>`
  })
}

function enhanceHeader(){
  const header=document.querySelector('.app-header')
  if(!header)return
  header.classList.add('pro8-header')
  const inner=header.querySelector('.header-inner')
  if(inner&&!inner.querySelector('.pro8-product-label')){
    inner.querySelector('.brand')?.insertAdjacentHTML('afterend','<span class="pro8-product-label">Professional Workspace</span>')
  }
  const userBox=header.querySelector('.user-box')
  if(userBox&&!userBox.querySelector('.pro8-online')){
    userBox.insertAdjacentHTML('afterbegin','<span class="pro8-online"><i></i> Online</span>')
  }
  const logout=header.querySelector('#logoutBtn')
  if(logout){logout.textContent='↗';logout.title='Sair da conta'}
}

function enhanceNav(){
  const nav=document.querySelector('.nav')
  if(!nav)return
  nav.setAttribute('aria-label','Navegação principal')
  const labels={home:'Início',students:'Alunos',workouts:'Treinos',progress:'Evolução',history:'Histórico'}
  nav.querySelectorAll('.nav-btn').forEach(button=>{
    const page=button.dataset.page
    button.title=labels[page]||button.textContent.trim()
    button.setAttribute('aria-label',labels[page]||button.textContent.trim())
  })
}

function enhanceHome(){
  const hero=document.querySelector('#content .hero-card')
  if(!hero)return
  hero.classList.add('pro8-home-hero')
  const first=hero.firstElementChild
  if(first&&!first.querySelector('.pro8-hero-kicker')){
    first.insertAdjacentHTML('afterbegin','<div class="pro8-hero-kicker"><span></span> FITCOACH PROFESSIONAL</div>')
  }
  const mark=hero.querySelector('.hero-mark')
  if(mark&&!mark.querySelector('small'))mark.innerHTML='FC<small>08</small>'
  const metrics=document.querySelector('#content .metrics-grid')
  metrics?.classList.add('pro8-metrics')
  document.querySelector('#content .quick-panel')?.classList.add('pro8-quick-panel')
}

function enhancePages(){
  const content=document.querySelector('#content')
  if(!content)return
  content.classList.add('pro8-content')
  content.querySelector('.page-head')?.classList.add('pro8-page-head')
  content.querySelectorAll('.item-card').forEach(card=>card.classList.add('pro8-item-card'))
  content.querySelectorAll('.student-workout-card').forEach(card=>card.classList.add('pro8-workout-card'))
  content.querySelectorAll('.empty').forEach(empty=>empty.classList.add('pro8-empty'))
}

function enhanceAuth(){
  const screen=document.querySelector('.auth-screen')
  if(!screen)return
  screen.classList.add('pro8-auth')
  const card=screen.querySelector('.auth-card')
  card?.classList.add('pro8-auth-card')
  const badge=screen.querySelector('.version-badge')
  if(badge)badge.textContent='v8 PRO'
}

function enhanceVersion(){
  document.querySelectorAll('.version-badge').forEach(badge=>badge.textContent='v8 PRO')
}

function enhanceModals(){
  document.querySelectorAll('.modal,.pro5-modal,.pro6-modal,.pro7-modal').forEach(modal=>modal.classList.add('pro8-modal-surface'))
  document.querySelectorAll('.modal-card,.pro5-card,.pro6-card,.pro7-card').forEach(card=>card.classList.add('pro8-dialog'))
}

function addFooter(){
  const shell=document.querySelector('.shell')
  if(!shell||shell.querySelector('.pro8-footer'))return
  shell.insertAdjacentHTML('beforeend','<footer class="pro8-footer"><span><i></i> FITCOACH Professional</span><span>v8.0 • Ambiente seguro</span></footer>')
}

function improveButtons(){
  document.querySelectorAll('.btn').forEach(button=>{
    if(!button.type)button.type='button'
  })
}

function enhance(){
  document.body.classList.add('pro8-ready')
  replaceNativeAlert()
  enhanceBrand()
  enhanceHeader()
  enhanceNav()
  enhanceHome()
  enhancePages()
  enhanceAuth()
  enhanceVersion()
  enhanceModals()
  addFooter()
  improveButtons()
}

function scheduleEnhance(){
  if(scheduled)return
  scheduled=true
  requestAnimationFrame(()=>{
    scheduled=false
    try{enhance()}catch(error){console.warn('FITCOACH Professional UI:',error)}
  })
}

new MutationObserver(scheduleEnhance).observe(document.documentElement,{subtree:true,childList:true})
window.addEventListener('focus',scheduleEnhance)
window.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return
  const top=document.querySelector('#pro7Modal,#pro6Modal,#pro5Modal,#modal')
  if(top)top.remove()
})

scheduleEnhance()
